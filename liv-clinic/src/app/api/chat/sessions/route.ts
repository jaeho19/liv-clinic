import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { corsPreflight, withCorsHandler } from '@/lib/chat/cors';
import { createChatAdminClient } from '@/lib/chat/db';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { checkIpSessionDailyLimit } from '@/lib/chat/rateLimit';
import { extractIp, hashIp } from '@/lib/chat/ipHash';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { getChatSystemMessage, VISITOR_LOCALES } from '@/lib/chat/serverI18n';
import { createServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

// Method handlers are wrapped with withCorsHandler at the bottom so responses carry CORS headers
// (function declarations are hoisted, so the exports below can reference them).
export const POST = withCorsHandler(postHandler);
export const GET = withCorsHandler(getHandler);
export function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

const CreateSessionSchema = z.object({
  visitorLocale: z.enum(VISITOR_LOCALES),
  visitorName: z.string().trim().max(60).optional().or(z.literal('')),
  visitorEmail: z.string().trim().email().optional().or(z.literal('')),
});

async function postHandler(req: NextRequest) {
  let parsed;
  try {
    parsed = CreateSessionSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.format() }, { status: 400 });
  }
  const { visitorLocale, visitorName, visitorEmail } = parsed.data;

  const ip = extractIp(req.headers);
  const ipHash = hashIp(ip);
  const ipDecision = checkIpSessionDailyLimit(ipHash);
  if (!ipDecision.allowed) {
    return NextResponse.json({ error: 'rate_limited', reason: ipDecision.reason }, { status: 429 });
  }

  const admin = createChatAdminClient();
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  const { data: session, error } = await admin
    .from('chat_sessions')
    .insert({
      visitor_locale: visitorLocale,
      visitor_name: visitorName || null,
      visitor_email: visitorEmail || null,
      ip_hash: ipHash,
      user_agent: userAgent,
    })
    .select('id, session_token, visitor_locale, status, created_at')
    .single();

  if (error || !session) {
    console.error('[chat/sessions] insert failed:', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // 운영자 presence: MVP는 단순 운영시간 판정으로 대체 (정확한 presence는 후속)
  const businessHours = isBusinessHours();

  // §5.1, §6.2: 세션 생성 직후 system 메시지 1건 자동 INSERT
  const systemKey = businessHours ? 'welcome' : 'delayedResponseNotice';
  const systemText = getChatSystemMessage(visitorLocale, systemKey);

  const { data: systemMsg, error: msgError } = await admin
    .from('chat_messages')
    .insert({
      session_id: session.id,
      sender: 'system',
      original_text: systemText,
      original_lang: visitorLocale,
      translation_status: 'skipped',
    })
    .select('id')
    .single();

  if (msgError) {
    // system 메시지 실패는 세션 생성 자체를 막지 않음 — warn만 기록
    console.warn('[chat/sessions] system message insert failed:', msgError);
  } else if (systemMsg) {
    // 방문자 위젯이 broadcast로 system 메시지를 수신할 수 있도록 알림
    await broadcastToSession(session.id, {
      type: 'message_created',
      payload: { messageId: systemMsg.id, sender: 'system' },
    });
  }

  return NextResponse.json(
    {
      sessionId: session.id,
      sessionToken: session.session_token,
      visitorLocale: session.visitor_locale,
      status: session.status,
      createdAt: session.created_at,
      businessHours,
      operatorOnline: businessHours, // MVP: 운영시간 = 운영자 온라인 가정
    },
    { status: 201 }
  );
}

// Visitor: GET /api/chat/sessions?token=xxx — 세션 메타 조회
// Admin: GET /api/chat/sessions — 전체 세션 목록(미응답 우선)
async function getHandler(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  const admin = createChatAdminClient();

  if (token) {
    // Visitor 측: token으로 단건 조회
    const { data, error } = await admin
      .from('chat_sessions')
      .select('id, visitor_locale, status, last_message_at, created_at')
      .eq('session_token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ session: data });
  }

  // Admin 측: 쿠키 기반 Supabase 세션으로 인증 확인
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const status = url.searchParams.get('status') ?? 'open';
  const { data, error } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale, visitor_name, visitor_email, status, last_message_at, unread_admin_count, created_at')
    .eq('status', status)
    .order('unread_admin_count', { ascending: false })
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error('[chat/sessions] list failed:', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  return NextResponse.json({ sessions: data ?? [] });
}
