import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { archiveSessionRoom, unarchiveSessionRoom } from '@/lib/chat/slackRelay';
import { createChatAdminClient } from '@/lib/chat/db';
import { createServerClient } from '@/lib/supabase-server';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { getChatSystemMessage } from '@/lib/chat/serverI18n';
import type { VisitorLocale } from '@/lib/chat/serverI18n';

export const runtime = 'nodejs';

// 기존 closeSession()은 바디 없이 호출하므로 default가 필수.
const PatchSchema = z
  .object({ action: z.enum(['resolve', 'unresolve', 'close']).default('close') })
  .default({ action: 'close' });

// PATCH /api/chat/sessions/[id]  — 어드민: 세션 종료
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // 어드민 인증 확인
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let action: 'resolve' | 'unresolve' | 'close' = 'close';
  try {
    const raw = await req.text();
    const parsed = PatchSchema.safeParse(raw ? JSON.parse(raw) : {});
    if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    action = parsed.data.action;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const admin = createChatAdminClient();

  // 세션 조회 — locale과 현재 상태 확인용
  const { data: session, error: fetchError } = await admin
    .from('chat_sessions')
    .select('id, status, visitor_locale, resolved_at')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // 완료 ≠ 종료 (스펙 §4.5). resolved_at만 세팅하고 status는 open 유지 — 손님에게 아무 것도 가지 않는다.
  if (action === 'resolve') {
    if (session.status !== 'open') {
      return NextResponse.json({ error: 'already_closed', status: session.status }, { status: 409 });
    }
    // Task 12 addendum: 이미 완료된 세션은 UPDATE 대상에서 제외해 반복 클릭을 무변경으로 만든다.
    const { data: updated, error } = await admin
      .from('chat_sessions')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_label: '관리자 화면',
        awaiting_since: null,
        escalation_level: 0,
      })
      .eq('id', sessionId)
      .is('resolved_at', null)
      .select('id');
    if (error) {
      console.error('[chat/sessions/[id]] resolve failed:', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    if (updated && updated.length > 0) {
      after(() => archiveSessionRoom(sessionId, 'resolved'));
    }
    return NextResponse.json({ success: true, sessionId, action });
  }

  if (action === 'unresolve') {
    // Task 12 addendum: 이미 미완료 상태면 UPDATE 대상에서 제외해 반복 클릭을 무변경으로 만든다.
    const { data: updated, error } = await admin
      .from('chat_sessions')
      .update({ resolved_at: null, resolved_label: null })
      .eq('id', sessionId)
      .not('resolved_at', 'is', null)
      .select('id');
    if (error) {
      console.error('[chat/sessions/[id]] unresolve failed:', error);
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }
    if (updated && updated.length > 0) {
      after(() => unarchiveSessionRoom(sessionId));
    }
    return NextResponse.json({ success: true, sessionId, action });
  }

  if (session.status !== 'open') {
    return NextResponse.json(
      { error: 'already_closed', status: session.status },
      { status: 409 }
    );
  }

  // 세션 상태 closed로 업데이트
  const { error: updateError } = await admin
    .from('chat_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      awaiting_since: null,
      escalation_level: 0,
    })
    .eq('id', sessionId);

  if (updateError) {
    console.error('[chat/sessions/[id]] close failed:', updateError);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // §7.5: 종료 사실을 방문자에게 알리는 system 메시지 INSERT
  const visitorLocale = session.visitor_locale as VisitorLocale;
  const endText = getChatSystemMessage(visitorLocale, 'sessionEnded');

  const { data: sysMsg, error: msgError } = await admin
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender: 'system',
      original_text: endText,
      original_lang: visitorLocale,
      translation_status: 'skipped',
    })
    .select('id')
    .single();

  if (msgError) {
    console.warn('[chat/sessions/[id]] sessionEnded message insert failed:', msgError);
  } else if (sysMsg) {
    await broadcastToSession(sessionId, {
      type: 'message_created',
      payload: { messageId: sysMsg.id, sender: 'system' },
    });
  }

  // 세션 종료 broadcast
  await broadcastToSession(sessionId, {
    type: 'session_closed',
    payload: { sessionId },
  });

  after(() => archiveSessionRoom(sessionId, 'closed'));

  return NextResponse.json({ success: true, sessionId, action });
}
