import { NextRequest, NextResponse } from 'next/server';
import { createChatAdminClient } from '@/lib/chat/db';
import { createServerClient } from '@/lib/supabase-server';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { getChatSystemMessage } from '@/lib/chat/serverI18n';
import type { VisitorLocale } from '@/lib/chat/serverI18n';

export const runtime = 'nodejs';

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

  const admin = createChatAdminClient();

  // 세션 조회 — locale과 현재 상태 확인용
  const { data: session, error: fetchError } = await admin
    .from('chat_sessions')
    .select('id, status, visitor_locale')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
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

  return NextResponse.json({ success: true, sessionId });
}
