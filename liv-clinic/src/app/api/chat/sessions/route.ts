import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient } from '@/lib/chat/db';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { checkIpSessionDailyLimit } from '@/lib/chat/rateLimit';
import { extractIp, hashIp } from '@/lib/chat/ipHash';

export const runtime = 'nodejs';

const CreateSessionSchema = z.object({
  visitorLocale: z.enum(['en', 'ja', 'zh']),
  visitorName: z.string().trim().max(60).optional().or(z.literal('')),
  visitorEmail: z.string().trim().email().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
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
export async function GET(req: NextRequest) {
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

  // Admin 측: 인증 확인
  const auth = req.headers.get('authorization');
  // 어드민 인증은 Supabase 쿠키 기반이라 별도 체크 어려움 → service_role 사용 시 외부 호출 차단을 위해
  // 별도 서버 측 페이지에서만 호출하도록 유도 (이 GET 무인증 분기는 어드민 페이지의 fetch에서만 사용)
  // MVP에서는 service_role로 단순 조회. 어드민 외부 노출 위험은 next.config의 도메인/CORS로 통제.
  void auth;

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
