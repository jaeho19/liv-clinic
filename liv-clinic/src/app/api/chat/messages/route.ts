import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient, type ChatAdminClient } from '@/lib/chat/db';
import { createServerClient } from '@/lib/supabase-server';
import { translate, type SupportedLang } from '@/lib/chat/translation';
import type { VisitorLocale } from '@/lib/chat/serverI18n';
import { checkSessionMessageLimit } from '@/lib/chat/rateLimit';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { relayChatMessageToSlack } from '@/lib/chat/slackRelay';
import type { ContactSession } from '@/lib/chat/contactService';
import {
  runVisitorMessageFollowups,
  startEarlyFollowups,
  type EarlyFollowups,
} from '@/lib/chat/visitorMessageFollowups';

export const runtime = 'nodejs';

const VisitorMessageSchema = z.object({
  sessionToken: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

const OperatorMessageSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
});

// source 는 손님 화면이 직원 글과 자동 안내(source='auto')를 가르는 데 쓴다 (연락처 카드 노출 규칙).
const MESSAGE_COLUMNS =
  'id, session_id, sender, original_text, original_lang, translated_text, translated_lang, translation_status, created_at, source';

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
    .select('id, visitor_locale, status, visitor_email, visitor_messenger_handle')
    .eq('session_token', sessionToken)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }
  if (session.status !== 'open') {
    // 자동 재오픈: 방문자가 돌아와 말을 이으면 종료된 상담을 되살린다 (spec §5.4).
    // 운영자 경로(handleOperatorMessage)는 여전히 409 — 재오픈은 방문자 발신 전용.
    const { error: reopenError } = await admin
      .from('chat_sessions')
      .update({ status: 'open', closed_at: null })
      .eq('id', session.id);
    if (reopenError) {
      console.error('[chat/messages] session reopen failed:', reopenError);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
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
    visitorSession: {
      id: session.id,
      visitor_locale: session.visitor_locale,
      visitor_email: session.visitor_email,
      visitor_messenger_handle: session.visitor_messenger_handle,
    },
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
  /** 손님 글일 때만 — 글 속 이메일 인식과 자동 안내에 쓴다 */
  visitorSession?: ContactSession;
}

async function persistAndBroadcast(
  admin: ChatAdminClient,
  args: PersistArgs
) {
  const { sessionId, sender, senderAdminId, senderLabel = null, text, fromLang, toLang, visitorSession } = args;

  // 1. pending 메시지 INSERT (손님 글이면 트리거가 awaiting_since를 세운다)
  const { data: pending, error: insertError } = await admin
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender,
      sender_admin_id: senderAdminId,
      sender_label: sender === 'operator' ? senderLabel : null,
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

  // 2. 손님 글: 글 속 이메일을 저장하고, 자동 안내(→ 이벤트 안내)를 번역·Slack을 기다리지 않고 지금 시작한다.
  //    손님이 화면 앞에 있는 첫 몇 초 안에 안내가 도착해야 한다 (스펙 2026-10-01 §4.1).
  const early: EarlyFollowups | null = visitorSession
    ? await startEarlyFollowups(admin, visitorSession, text)
    : null;

  // 3. 동기 번역
  const translation = await translate(text, fromLang, toLang);

  // 4. 결과 UPDATE
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
    .select(MESSAGE_COLUMNS)
    .single();
  if (updateError || !updated) {
    console.error('[chat/messages] update failed:', updateError);
    // 자동 안내는 이미 나갔거나 나가는 중이다 — 함수가 끝나기 전에 마저 끝나게 한다.
    if (early) {
      const ackPromise = early.ackPromise;
      after(async () => {
        await ackPromise;
      });
    }
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // 5. Broadcast (방문자 측 위젯 도달용. 어드민은 postgres_changes로 자체 수신)
  void broadcastToSession(sessionId, {
    type: 'message_created',
    payload: { messageId: updated.id, sender: updated.sender as 'visitor' | 'operator' | 'system' },
  });

  // 6. Slack 채널로 릴레이 — 방문자 메시지와 어드민 UI 답장을 같은 방/스레드에 미러링한다.
  //    응답 이후(after)에 처리 — 이미 동기 번역이 걸려 있는 경로에 Slack 왕복까지 얹지 않는다.
  //    Slack에서 들어온 답글은 이 라우트를 거치지 않고 slackRelay가 직접 INSERT하므로 에코가 없다.
  const translatedText = updated.translation_status === 'success' ? updated.translated_text : null;
  const relayArgs = {
    sessionId,
    messageId: updated.id,
    sender,
    originalText: updated.original_text,
    translatedText,
    senderLabel,
    receivedAt: updated.created_at,
  };
  after(async () => {
    if (early) {
      // 손님 글: Slack 릴레이 → (이메일 저장 시) 연락처 알림, 그리고 2에서 시작한 자동 안내의 완료를 기다린다.
      await runVisitorMessageFollowups({ relayArgs, contact: early.contact, ackPromise: early.ackPromise });
    } else {
      await relayChatMessageToSlack(relayArgs);
    }
  });

  if (early) {
    // contact.saved: 이번 글에서 이메일을 저장했다. hasContact: 연락처 카드를 숨길지 판단하는 값.
    return NextResponse.json(
      { message: updated, contact: { saved: early.contact.saved, hasContact: early.contact.hasContact } },
      { status: 201 }
    );
  }
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
    .select(MESSAGE_COLUMNS)
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
