import 'server-only';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { createChatAdminClient } from '@/lib/chat/db';
import { relayAiTurnToSlack, relayContactToSlack } from '@/lib/chat/slackRelay';
import { AI_FALLBACK_REASON, AI_SESSION_CAP_REASON } from '@/lib/chat/slackText';
import { translate } from '@/lib/chat/translation';
import { bookingSummaryKo, bookingWhenKo } from './booking';
import { priceQuoteKo } from './knowledge';
import type { AiTurnOutcome } from './turn';

// AI 응대 한 차례의 뒤처리 (스펙 2026-10-02 chat-ai-first-response §4.1 의 "응답 뒤" · §4.11 · §4.12). throw 하지 않는다.
// 손님 글의 Slack 릴레이가 끝난 뒤에 부른다 — 방에서 손님 글 → AI 요지 → 가예약 → 직원 확인 필요 순으로 보이게.

/** runAiTurn 의 결과, 또는 대화당 한도에 닿아 AI가 답하지 않은 경우 */
export type AiFollowup = AiTurnOutcome | { kind: 'session_cap' };

/** 043 의 글 길이 한도 */
const ORIGINAL_TEXT_MAX = 4000;

/**
 * AI 글의 한국어 번역을 저장한다 — 관리자 화면이 직원 글과 같은 방식(한국어가 큰 글, 손님에게 나간 글이 작은 글)으로 보여 준다.
 * 실패하면 손님 언어 글이 그대로 남는다(방의 요지는 이미 올라가 있다).
 */
async function saveKoreanTranslation(messageId: string, text: string, locale: VisitorLocale): Promise<void> {
  const result = await translate(text, locale, 'ko');
  if (result.status !== 'success') {
    console.warn('[chat ai] korean translation not saved:', result.status, result.errorCode ?? '');
    return;
  }
  const korean = Array.from(result.text.trim()).slice(0, ORIGINAL_TEXT_MAX).join('');
  if (!korean || korean === text) return;
  const admin = createChatAdminClient();
  const { error } = await admin.from('chat_messages').update({ original_text: korean }).eq('id', messageId);
  if (error) console.warn('[chat ai] korean translation update failed:', error.code ?? 'unknown');
}

export async function finishAiTurn(args: { sessionId: string; locale: VisitorLocale; outcome: AiFollowup }): Promise<void> {
  const { sessionId, locale, outcome } = args;
  try {
    if (outcome.kind === 'superseded') return;
    if (outcome.kind === 'fallback' || outcome.kind === 'session_cap') {
      // AI가 답하지 못했다(접수 안내가 대신 나갔다) · 대화당 한도에 닿았다 → 직원에게 넘긴다
      await relayAiTurnToSlack({
        sessionId,
        note: null,
        quoted: [],
        booking: null,
        staffNeeded: { reason: outcome.kind === 'fallback' ? AI_FALLBACK_REASON : AI_SESSION_CAP_REASON },
      });
      return;
    }
    const slack = async (): Promise<void> => {
      await relayAiTurnToSlack({
        sessionId,
        note: outcome.staffNoteKo,
        quoted: outcome.usedRows.map(priceQuoteKo),
        booking: outcome.bookingEvent
          ? {
              changed: outcome.bookingEvent === 'changed',
              summary: bookingSummaryKo(outcome.booking, outcome.contact),
              when: bookingWhenKo(outcome.booking),
            }
          : null,
        staffNeeded: outcome.needsStaff ? { reason: outcome.staffReasonKo } : null,
      });
      // 가예약이 차지 않았는데 연락처만 받았다 → 지금의 연락처 알림(초록 막대 + 피드 줄)
      if (outcome.contactSaved) {
        await relayContactToSlack({ sessionId, channel: outcome.contactSaved.channel, handle: outcome.contactSaved.handle });
      }
    };
    // Slack 게시(글 여러 개)와 한국어 번역을 함께 돌린다 — 차례로 하면 Slack 이 느린 날 함수 시간 한도(60초)에 가까워진다.
    // 한쪽이 실패해도 다른 쪽은 끝까지 간다.
    const [posted, translated] = await Promise.allSettled([slack(), saveKoreanTranslation(outcome.messageId, outcome.text, locale)]);
    if (posted.status === 'rejected') console.warn('[chat ai] slack followups failed:', posted.reason);
    if (translated.status === 'rejected') console.warn('[chat ai] korean translation failed:', translated.reason);
  } catch (e) {
    console.warn('[chat ai] followups failed:', e);
  }
}
