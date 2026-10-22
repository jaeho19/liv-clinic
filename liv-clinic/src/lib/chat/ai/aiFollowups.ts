import 'server-only';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { createChatAdminClient } from '@/lib/chat/db';
import { relayAiTurnToSlack, relayContactToSlack } from '@/lib/chat/slackRelay';
import { AI_FALLBACK_REASON, AI_SESSION_CAP_REASON } from '@/lib/chat/slackText';
import { translate } from '@/lib/chat/translation';
import { bookingSummaryKo, bookingWhenKo } from './booking';
import { priceQuoteKo } from './knowledge';
import { benefitKo } from './knowledge/offers';
import type { AiTurnOutcome } from './turn';

// AI 응대 한 차례의 뒤처리 (스펙 2026-10-02 chat-ai-first-response §4.1 의 "응답 뒤" · §4.11 · §4.12,
// 2026-10-22 chat-ai-slack-transcript §1). throw 하지 않는다.
// 손님 글의 Slack 릴레이가 끝난 뒤에 부른다 — 방에서 손님 글 → AI 답(번역 전문) → 가예약 → 직원 확인 필요 순으로 보이게.

/** runAiTurn 의 결과, 또는 대화당 한도에 닿아 AI가 답하지 않은 경우 */
export type AiFollowup = AiTurnOutcome | { kind: 'session_cap' };

/** 043 의 글 길이 한도 */
const ORIGINAL_TEXT_MAX = 4000;

/**
 * 손님에게 나간 AI 글의 한국어 번역. 실패하면 null(방에는 나간 글 그대로 올라간다).
 * 번역할 것이 없으면(skipped — 이모지뿐 등) 나간 글을 그대로 쓴다.
 */
async function koreanOf(text: string, locale: VisitorLocale): Promise<string | null> {
  const result = await translate(text, locale, 'ko');
  if (result.status === 'skipped') return text;
  if (result.status !== 'success') {
    console.warn('[chat ai] korean translation not saved:', result.status, result.errorCode ?? '');
    return null;
  }
  return Array.from(result.text.trim()).slice(0, ORIGINAL_TEXT_MAX).join('') || null;
}

/** 관리자 화면이 직원 글과 같은 방식(한국어가 큰 글, 손님에게 나간 글이 작은 글)으로 보이게 AI 글을 한국어로 바꿔 둔다. */
async function saveKoreanTranslation(messageId: string, text: string, korean: string): Promise<void> {
  if (korean === text) return;
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
        reply: null,
        booking: null,
        staffNeeded: { reason: outcome.kind === 'fallback' ? AI_FALLBACK_REASON : AI_SESSION_CAP_REASON },
      });
      return;
    }
    // 번역을 먼저 끝낸다(한도 5초 + 재시도 1번) — 방에는 그 번역(손님에게 나간 답 전문)을 올리고,
    // 관리자 화면에도 같은 번역을 저장한다(번역은 한 번만 부른다).
    const korean = await koreanOf(outcome.text, locale).catch((e: unknown) => {
      console.warn('[chat ai] korean translation failed:', e);
      return null;
    });
    const slack = async (): Promise<void> => {
      await relayAiTurnToSlack({
        sessionId,
        reply: { sentText: outcome.text, koreanText: korean, quoted: outcome.usedRows.map(priceQuoteKo) },
        booking: outcome.bookingEvent
          ? {
              changed: outcome.bookingEvent === 'changed',
              summary: bookingSummaryKo(outcome.booking, outcome.contact),
              when: bookingWhenKo(outcome.booking),
              benefit: outcome.bookingBenefit ? benefitKo(outcome.bookingBenefit) : null,
            }
          : null,
        staffNeeded: outcome.needsStaff ? { reason: outcome.staffReasonKo } : null,
      });
      // 가예약이 차지 않았는데 연락처만 받았다 → 지금의 연락처 알림(초록 막대 + 피드 줄)
      if (outcome.contactSaved) {
        await relayContactToSlack({ sessionId, channel: outcome.contactSaved.channel, handle: outcome.contactSaved.handle });
      }
    };
    // Slack 게시(글 여러 개)와 관리자 화면용 저장은 함께 돈다. 한쪽이 실패해도 다른 쪽은 끝까지 간다.
    const [posted, saved] = await Promise.allSettled([
      slack(),
      korean ? saveKoreanTranslation(outcome.messageId, outcome.text, korean) : Promise.resolve(),
    ]);
    if (posted.status === 'rejected') console.warn('[chat ai] slack followups failed:', posted.reason);
    if (saved.status === 'rejected') console.warn('[chat ai] korean translation save failed:', saved.reason);
  } catch (e) {
    console.warn('[chat ai] followups failed:', e);
  }
}
