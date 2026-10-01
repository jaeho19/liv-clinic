import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { CONTACT_CHANNEL_LABELS, extractEmail, type ContactChannel } from '@/lib/chat/contactChannels';
import { checkContactSaveLimit } from '@/lib/chat/rateLimit';
import { getContactSavedMessage, type VisitorLocale } from '@/lib/chat/serverI18n';

// 손님 연락처 저장 로직 (스펙 2026-10-01 §4.3·§4.4). 라우트(api/chat/contact, api/chat/messages)는 검증·한도·응답만 맡는다.
// 세 함수 모두 throw하지 않고 결과 객체를 돌려준다. Slack 알림은 호출자가 응답 뒤(after)에 보낸다.

export interface ContactSession {
  id: string;
  visitor_locale: string;
  visitor_email: string | null;
  visitor_messenger_handle: string | null;
}

export type SaveContactResult = { ok: true } | { ok: false; error: 'db_error' };

/** 손님 화면에 확인 문구(시스템 메시지)를 남긴다. 실패해도 저장 자체는 성공으로 친다 (세션 생성 라우트와 같은 정책). */
async function confirmToVisitor(
  admin: ChatAdminClient,
  session: Pick<ContactSession, 'id' | 'visitor_locale'>,
  channel: ContactChannel,
  handle: string
): Promise<void> {
  const locale = session.visitor_locale as VisitorLocale;
  const { data: sysMsg, error } = await admin
    .from('chat_messages')
    .insert({
      session_id: session.id,
      sender: 'system',
      original_text: getContactSavedMessage(locale, CONTACT_CHANNEL_LABELS[channel], handle),
      original_lang: locale,
      translation_status: 'skipped',
    })
    .select('id')
    .single();
  if (error || !sysMsg) {
    console.warn('[chat contact] system message insert failed:', error?.code ?? 'unknown');
    return;
  }
  await broadcastToSession(session.id, {
    type: 'message_created',
    payload: { messageId: sysMsg.id, sender: 'system' },
  });
}

/** 연락처 저장: email → visitor_email, 메신저 → visitor_messenger_channel/handle. 그 뒤 손님 화면에 확인 문구. */
export async function saveVisitorContact(
  admin: ChatAdminClient,
  session: Pick<ContactSession, 'id' | 'visitor_locale'>,
  input: { channel: ContactChannel; handle: string }
): Promise<SaveContactResult> {
  try {
    const patch =
      input.channel === 'email'
        ? { visitor_email: input.handle }
        : { visitor_messenger_channel: input.channel, visitor_messenger_handle: input.handle };
    const { error } = await admin.from('chat_sessions').update(patch).eq('id', session.id);
    if (error) {
      console.error('[chat contact] update failed:', error.code ?? 'unknown');
      return { ok: false, error: 'db_error' };
    }
    await confirmToVisitor(admin, session, input.channel, input.handle);
    return { ok: true };
  } catch (e) {
    console.error('[chat contact] save failed:', e);
    return { ok: false, error: 'db_error' };
  }
}

/** 카드의 병원 연락 단추를 눌렀음을 기록한다 — 연락처가 아니며 손님 화면에는 아무것도 남기지 않는다. */
export async function recordMessengerClick(
  admin: ChatAdminClient,
  session: Pick<ContactSession, 'id'>,
  channel: ContactChannel
): Promise<{ ok: boolean }> {
  try {
    const { error } = await admin
      .from('chat_sessions')
      .update({ visitor_messenger_clicked: channel })
      .eq('id', session.id);
    if (error) {
      // 042 적용 전이면 컬럼이 없어 여기로 온다 — 채팅 본 기능에는 영향이 없다.
      console.warn('[chat contact] click record failed:', error.code ?? 'unknown');
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[chat contact] click record threw:', e);
    return { ok: false };
  }
}

export interface MessageEmailResult {
  /** 이번 글에서 이메일을 새로 저장했는가 */
  saved: boolean;
  /** 처리 뒤 기준으로 연락처(이메일·메신저)가 있는가 */
  hasContact: boolean;
  /** saved=true일 때 저장한 주소 */
  email?: string;
}

/**
 * 손님 글 속 이메일을 연락처로 저장한다 (§4.3). 마지막에 쓴 주소가 이긴다.
 * 이미 같은 주소면 아무것도 하지 않는다. 하루 저장 한도(카드 저장과 공용)를 넘으면 건너뛴다.
 */
export async function saveEmailFromMessage(
  admin: ChatAdminClient,
  session: ContactSession,
  text: string
): Promise<MessageEmailResult> {
  const had = Boolean(session.visitor_email || session.visitor_messenger_handle);
  try {
    const email = extractEmail(text);
    if (!email) return { saved: false, hasContact: had };
    if (session.visitor_email && session.visitor_email.toLowerCase() === email.toLowerCase()) {
      return { saved: false, hasContact: true };
    }
    if (!checkContactSaveLimit(session.id).allowed) return { saved: false, hasContact: had };
    const result = await saveVisitorContact(admin, session, { channel: 'email', handle: email });
    if (!result.ok) return { saved: false, hasContact: had };
    return { saved: true, hasContact: true, email };
  } catch (e) {
    console.warn('[chat contact] email from message failed:', e);
    return { saved: false, hasContact: had };
  }
}
