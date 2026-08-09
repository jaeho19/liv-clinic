import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatAdminClient } from '@/lib/chat/db';
import {
  CONTACT_CHANNELS,
  CONTACT_CHANNEL_LABELS,
  validateContactHandle,
} from '@/lib/chat/contactChannels';
import { checkContactSaveLimit } from '@/lib/chat/rateLimit';
import { getContactSavedMessage, type VisitorLocale } from '@/lib/chat/serverI18n';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { relayContactToSlack } from '@/lib/chat/slackRelay';

export const runtime = 'nodejs';

const ContactSchema = z.object({
  sessionToken: z.string().uuid(),
  channel: z.enum(CONTACT_CHANNELS),
  handle: z.string().trim().min(4).max(100),
});

// 방문자가 오프시간 캡처 블록에서 메신저 연락처를 남긴다.
// 근무 시작 후 직원이 이 연락처로 선제 연락하는 것이 전제 (spec §7.1).
export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = ContactSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { sessionToken, channel } = parsed.data;
  const handle = parsed.data.handle.trim();

  if (!validateContactHandle(channel, handle)) {
    return NextResponse.json({ error: 'invalid_handle' }, { status: 400 });
  }

  const admin = createChatAdminClient();
  const { data: session, error: sessionError } = await admin
    .from('chat_sessions')
    .select('id, visitor_locale')
    .eq('session_token', sessionToken)
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  }

  const limit = checkContactSaveLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'rate_limited', reason: limit.reason }, { status: 429 });
  }

  const { error: updateError } = await admin
    .from('chat_sessions')
    .update({ visitor_messenger_channel: channel, visitor_messenger_handle: handle })
    .eq('id', session.id);
  if (updateError) {
    console.error('[chat/contact] update failed:', updateError);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const locale = session.visitor_locale as VisitorLocale;
  const label = CONTACT_CHANNEL_LABELS[channel];

  // 확인 system 메시지 — 실패해도 저장 자체는 성공 처리 (세션 생성 라우트와 동일 정책)
  const { data: sysMsg, error: msgError } = await admin
    .from('chat_messages')
    .insert({
      session_id: session.id,
      sender: 'system',
      original_text: getContactSavedMessage(locale, label, handle),
      original_lang: locale,
      translation_status: 'skipped',
    })
    .select('id')
    .single();
  if (msgError) {
    console.warn('[chat/contact] system message insert failed:', msgError);
  } else if (sysMsg) {
    await broadcastToSession(session.id, {
      type: 'message_created',
      payload: { messageId: sysMsg.id, sender: 'system' },
    });
  }

  after(async () => {
    await relayContactToSlack({ sessionId: session.id, channelLabel: label, handle });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
