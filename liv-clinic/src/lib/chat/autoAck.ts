import 'server-only';
import { createChatAdminClient } from '@/lib/chat/db';
import { broadcastToSession } from '@/lib/chat/broadcast';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { getAutoAckTexts, type VisitorLocale } from '@/lib/chat/serverI18n';

// 자동 첫 안내 (스펙 §4.10): 손님 메시지가 새 대기 구간을 시작할 때 1회, 손님 언어로 미리 쓴 문구를 낸다.
// 번역 API 호출 없음. source='auto'라 040 트리거가 "답변"으로 세지 않는다.

export interface AutoAckState {
  awaitingSince: string | null;
  autoAckAt: string | null;
}

/** 새 대기 구간의 첫 손님 메시지일 때만 true (순수). */
export function shouldSendAutoAck(s: AutoAckState): boolean {
  if (!s.awaitingSince) return false;
  if (!s.autoAckAt) return true;
  return Date.parse(s.autoAckAt) < Date.parse(s.awaitingSince);
}

export type AutoAckOutcome = 'sent' | 'not_due' | 'lost_race' | 'error';

export async function sendAutoAckIfDue(sessionId: string, now = new Date()): Promise<AutoAckOutcome> {
  try {
    const admin = createChatAdminClient();
    const { data: s } = await admin
      .from('chat_sessions')
      .select('id, visitor_locale, awaiting_since, auto_ack_at')
      .eq('id', sessionId)
      .maybeSingle();
    if (!s || !s.awaiting_since) return 'not_due';
    if (!shouldSendAutoAck({ awaitingSince: s.awaiting_since, autoAckAt: s.auto_ack_at })) return 'not_due';

    // 조건부 선점 — 읽은 값이 그대로일 때만 1행. 손님이 연달아 보내도 안내는 한 번이다.
    let claim = admin
      .from('chat_sessions')
      .update({ auto_ack_at: now.toISOString() })
      .eq('id', sessionId)
      .eq('awaiting_since', s.awaiting_since);
    claim = s.auto_ack_at ? claim.eq('auto_ack_at', s.auto_ack_at) : claim.is('auto_ack_at', null);
    const { data: claimed, error: claimError } = await claim.select('id');
    if (claimError) {
      console.warn('[auto ack] claim failed:', claimError.code ?? 'unknown');
      return 'error';
    }
    if (!claimed || claimed.length === 0) return 'lost_race';

    const locale = s.visitor_locale as VisitorLocale;
    const texts = getAutoAckTexts(locale, !isBusinessHours(now));
    const { data: inserted, error } = await admin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'operator',
        sender_admin_id: null,
        original_text: texts.ko,
        original_lang: 'ko',
        translated_text: texts.localized,
        translated_lang: locale,
        translation_status: 'success',
        translation_latency_ms: 0,
        source: 'auto',
        sender_label: '자동 안내',
      })
      .select('id')
      .single();
    if (error || !inserted) {
      console.warn('[auto ack] insert failed:', error?.code ?? 'unknown');
      return 'error';
    }
    await broadcastToSession(sessionId, {
      type: 'message_created',
      payload: { messageId: inserted.id, sender: 'operator' },
    });
    return 'sent';
  } catch (e) {
    console.warn('[auto ack] failed:', e);
    return 'error';
  }
}