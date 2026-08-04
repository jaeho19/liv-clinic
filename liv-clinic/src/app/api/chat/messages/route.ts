import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
import { createServerClient } from '@/lib/supabase-server';
import { translate, type SupportedLang } from '@/lib/chat/translation';
import type { VisitorLocale } from '@/lib/chat/serverI18n';
import { checkSessionMessageLimit } from '@/lib/chat/rateLimit';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { relayChatMessageToSlack } from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';

const VisitorMessageSchema = z.object({
  sessionToken: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

const OperatorMessageSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 운영자 / 방문자 모드 분기 — body 형태로 판단
  const isVisitorBody = body && typeof body === 'object' && 'sessionToken' in (body as object);
  return isVisitorBody ? handleVisitorMessage(body) : handleOperatorMessage(body);
}

async function handleVisitorMessage(body: unknown) {
  const parsed = VisitorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionToken, text } = parsed.data;
  const admin = createChatAdminClient();

  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale, status')
    .eq('session_token', sessionToken)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }
  if (session.status !== 'open') {
    return NextResponse.json({ error: 'session_closed' }, { status: 409 });
  }

  const limit = checkSessionMessageLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', reason: limit.reason, retryAfterSec: limit.retryAfterSec },
      { status: 429 }
    );
  }

  const visitorLocale = session.visitor_locale as VisitorLocale;
  return persistAndBroadcast(admin, {
    sessionId: session.id,
    sender: 'visitor',
    senderAdminId: null,
    text,
    fromLang: visitorLocale,
    toLang: 'ko',
  });
}

async function handleOperatorMessage(body: unknown) {
  const parsed = OperatorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionId, text } = parsed.data;

  // 어드민 인증 (Supabase 쿠키 기반)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createChatAdminClient();
  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale, status')
    .eq('id', sessionId)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }
  if (session.status !== 'open') {
    return NextResponse.json({ error: 'session_closed' }, { status: 409 });
  }

  const visitorLocale = session.visitor_locale as VisitorLocale;
  return persistAndBroadcast(admin, {
    sessionId: session.id,
    sender: 'operator',
    senderAdminId: user.id,
    // Slack 스레드에서 누가 답장했는지 구분할 수 있도록 (비공개 채널 내부 표시용)
    senderLabel: user.email ?? null,
    text,
    fromLang: 'ko',
    toLang: visitorLocale,
  });
}

interface PersistArgs {
  sessionId: string;
  sender: 'visitor' | 'operator';
  senderAdminId: string | null;
  /** Slack에 표시할 작성자 라벨. 방문자 메시지에는 쓰지 않는다. */
  senderLabel?: string | null;
  text: string;
  fromLang: SupportedLang;
  toLang: SupportedLang;
}

async function persistAndBroadcast(
  admin: ChatAdminClient,
  args: PersistArgs
) {
  const { sessionId, sender, senderAdminId, senderLabel = null, text, fromLang, toLang } = args;

  // 1. pending 메시지 INSERT
  const { data: pending, error: insertError } = await admin
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender,
      sender_admin_id: senderAdminId,
      original_text: text,
      original_lang: fromLang,
      translation_status: 'pending',
    })
    .select('id, created_at')
    .single();
  if (insertError || !pending) {
    console.error('[chat/messages] insert failed:', insertError);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // 2. 동기 번역
  const translation = await translate(text, fromLang, toLang);

  // 3. 결과 UPDATE
  const { data: updated, error: updateError } = await admin
    .from('chat_messages')
    .update({
      translated_text: translation.status === 'failed' ? null : translation.text,
      translated_lang: translation.status === 'failed' ? null : toLang,
      translation_status: translation.status,
      translation_latency_ms: translation.latencyMs,
      translation_error: translation.errorCode ?? null,
    })
    .eq('id', pending.id)
    .select(
      'id, session_id, sender, original_text, original_lang, translated_text, translated_lang, translation_status, created_at'
    )
    .single();
  if (updateError || !updated) {
    console.error('[chat/messages] update failed:', updateError);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // 4. Broadcast (방문자 측 위젯 도달용. 어드민은 postgres_changes로 자체 수신)
  void broadcastToSession(sessionId, {
    type: 'message_created',
    payload: { messageId: updated.id, sender: updated.sender as 'visitor' | 'operator' | 'system' },
  });

  // 5. Slack 채널로 릴레이 — 방문자 메시지와 어드민 UI 답장을 같은 스레드에 미러링한다.
  //    응답 이후(after)에 처리 — 이미 동기 번역이 걸려 있는 경로에 Slack 왕복까지 얹지 않는다.
  //    Slack에서 들어온 답글은 이 라우트를 거치지 않고 slackRelay가 직접 INSERT하므로 에코가 없다.
  const translatedText = updated.translation_status === 'success' ? updated.translated_text : null;
  after(async () => {
    await relayChatMessageToSlack({
      sessionId,
      messageId: updated.id,
      sender,
      originalText: updated.original_text,
      translatedText,
      senderLabel,
    });
  });

  return NextResponse.json({ message: updated }, { status: 201 });
}

// GET /api/chat/messages?sessionToken=xxx (visitor) OR ?sessionId=xxx (admin)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get('sessionToken');
  const sessionIdParam = url.searchParams.get('sessionId');
  const since = url.searchParams.get('since');

  const admin = createChatAdminClient();
  let sessionId: string | null = null;

  if (sessionToken) {
    const { data, error } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .single();
    if (error || !data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    sessionId = data.id;
  } else if (sessionIdParam) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    sessionId = sessionIdParam;
  } else {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  let query = admin
    .from('chat_messages')
    .select(
      'id, session_id, sender, original_text, original_lang, translated_text, translated_lang, translation_status, created_at'
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[chat/messages] list failed:', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
