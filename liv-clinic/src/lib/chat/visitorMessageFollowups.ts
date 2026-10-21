import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { finishAiTurn, type AiFollowup } from '@/lib/chat/ai/aiFollowups';
import { decideAiTurn, runAiTurn } from '@/lib/chat/ai/turn';
import { sendAutoAckIfDue, type AutoAckOutcome } from '@/lib/chat/autoAck';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { saveEmailFromMessage, type ContactSession, type MessageEmailResult } from '@/lib/chat/contactService';
import { sendEventHintIfDue } from '@/lib/chat/eventHint';
import {
  relayChatMessageToSlack,
  relayContactToSlack,
  relayEventHintNoteToSlack,
  type RelayOutboundArgs,
} from '@/lib/chat/slackRelay';

// 손님 글 한 건에 뒤따르는 일들 (스펙 2026-10-01 §4.1 "발송 시점을 앞당긴다", 2026-10-02 chat-ai-first-response §4.1).
//   1. 손님 글 INSERT                      ← 라우트
//   2. 글 속 이메일 인식·저장               ← startEarlyFollowups (끝까지 기다린다)
//   3. AI가 답할 차례인가?                  ← startEarlyFollowups (판정만 기다린다)
//        예   → AI 답 만들기 시작 (기다리지 않는다). 답하지 못하면 3'로 대신한다
//        AI가 맡은 대화인데 답할 내용이 없는 글(이모지뿐) → 아무것도 보내지 않는다
//        아니오 → 3'. 자동 안내 → 이벤트 안내 시작 (기다리지 않는다 — 번역·Slack과 무관)
//   4. 번역 → UPDATE → broadcast → 응답     ← 라우트
//   5. 응답 뒤: Slack 릴레이(→ 연락처 알림)와 3의 완료를 함께 기다린 뒤 AI 결과·이벤트 안내 알림   ← runVisitorMessageFollowups
// 라우트 단위 테스트가 없는 리포라 순서 로직을 여기로 뺐다.

export interface AckResult {
  ack: AutoAckOutcome;
  /** 이벤트 안내가 나갔으면 그 링크. 안 나갔으면 null */
  eventHintUrl: string | null;
  /** AI 응대의 결과. AI가 답할 차례가 아니었으면 이 항목 자체가 없다 */
  ai?: AiFollowup;
}

export interface EarlyFollowups {
  contact: MessageEmailResult;
  /** AI가 이 글의 답을 만들고 있다 — 손님 화면은 "입력 중"을 보인다 */
  aiReplying: boolean;
  /** AI가 맡은 대화의 글이다(답을 만드는 중이거나, 이모지뿐이라 답할 것이 없다) — 방의 손님 글은 멘션 없이 올라간다 */
  aiLed: boolean;
  /** 자동 안내에 이어 이벤트 안내까지(또는 AI 답까지) 끝나면 풀린다. reject 되지 않는다. */
  ackPromise: Promise<AckResult>;
}

/** 지금의 자동 안내 → 이벤트 안내. AI가 답하지 않을 때와, AI가 답하지 못했을 때 쓴다. */
async function ackChain(admin: ChatAdminClient, sessionId: string, text: string): Promise<AckResult> {
  try {
    const ack = await sendAutoAckIfDue(sessionId);
    // 이벤트 안내는 자동 안내 뒤에 넣는다 — 손님 화면에서 손님 글 → 안내 → 이벤트 안내 순으로 보인다.
    const hint = await sendEventHintIfDue(admin, sessionId, text);
    return { ack, eventHintUrl: hint.outcome === 'sent' && hint.url ? hint.url : null };
  } catch (e) {
    console.warn('[chat followups] ack chain failed:', e);
    return { ack: 'error', eventHintUrl: null };
  }
}

/**
 * trigger(방금 저장한 손님 글의 id)를 넘기면 AI가 답할 차례인지 본다. 넘기지 않으면 지금 방식(자동 안내)만 한다.
 */
export async function startEarlyFollowups(
  admin: ChatAdminClient,
  session: ContactSession,
  text: string,
  trigger?: { messageId: string }
): Promise<EarlyFollowups> {
  // 2. 자동 안내가 "남겨 주신 연락처로 …" 문장을 고르려면, AI가 세션의 연락처를 보려면 이메일 저장이 먼저 끝나 있어야 한다.
  const contact = await saveEmailFromMessage(admin, session, text);

  // 3. AI가 답할 차례인가 (스위치가 꺼져 있으면 DB를 건드리지 않고 바로 돌아온다)
  const decision = trigger
    ? await decideAiTurn(admin, session.id, text)
    : ({ run: false, reason: 'off', ctx: null } as const);

  if (decision.run) {
    const ackPromise = (async (): Promise<AckResult> => {
      let outcome: AiFollowup;
      try {
        outcome = await runAiTurn(admin, { ctx: decision.ctx, triggerMessageId: trigger!.messageId, text });
      } catch (e) {
        console.warn('[chat followups] ai turn threw:', e);
        outcome = { kind: 'fallback', reason: 'exception' };
      }
      // AI가 답하지 못했다 → 지금의 접수 안내(→ 이벤트 안내)가 대신 나간다
      if (outcome.kind === 'fallback') return { ...(await ackChain(admin, session.id, text)), ai: outcome };
      return { ack: 'not_due', eventHintUrl: null, ai: outcome };
    })();
    return { contact, aiReplying: true, aiLed: true, ackPromise };
  }

  // AI가 맡은 대화의 이모지·문장부호뿐인 글("🙏") — 아무것도 보내지 않는다.
  // 접수 안내("직원이 10~20분 안에 답합니다")가 AI의 답 사이에 끼어들지 않게 한다. 앞 글의 AI 답은 그대로 나간다.
  if (decision.reason === 'no_substance') {
    return { contact, aiReplying: false, aiLed: true, ackPromise: Promise.resolve({ ack: 'not_due', eventHintUrl: null }) };
  }

  // 3'. 손님이 화면 앞에 있는 첫 몇 초 안에 나가도록, 번역과 Slack 릴레이를 기다리지 않고 지금 시작한다.
  const ackPromise = ackChain(admin, session.id, text).then(
    (result): AckResult =>
      // 대화당 한도에 닿았다 — 지금 방식으로 동작하되 직원에게 넘긴다
      decision.reason === 'session_cap' ? { ...result, ai: { kind: 'session_cap' } } : result
  );
  return { contact, aiReplying: false, aiLed: false, ackPromise };
}

/**
 * 손님 글의 번역 저장이 실패해 응답이 500 으로 나갈 때 — 이미 시작한 자동 안내·AI 답은 끝까지 가게 하고,
 * AI 결과(가예약 · 직원 확인 필요)는 방에 올린다. 손님 글의 Slack 릴레이는 하지 않는다(글이 온전히 저장되지 않았다).
 */
export async function settleEarlyFollowups(args: {
  sessionId: string;
  locale: VisitorLocale;
  ackPromise: Promise<AckResult>;
}): Promise<void> {
  try {
    const ack = await args.ackPromise;
    if (ack.ai) await finishAiTurn({ sessionId: args.sessionId, locale: args.locale, outcome: ack.ai });
  } catch (e) {
    console.warn('[chat followups] settle failed:', e);
  }
}

export async function runVisitorMessageFollowups(args: {
  relayArgs: RelayOutboundArgs;
  contact: MessageEmailResult;
  ackPromise: Promise<AckResult>;
  /** AI가 맡은 대화면(EarlyFollowups.aiLed) 손님 글을 멘션 없이 올린다 */
  quiet?: boolean;
  /** 손님 언어 — AI 글의 한국어 번역에 쓴다 */
  locale?: VisitorLocale;
}): Promise<void> {
  const { relayArgs, contact, ackPromise } = args;
  // Slack: 손님 글 → (이메일이 저장됐으면) 연락처 알림 순. 방에서 글 → 연락처 순으로 보이게 한다.
  const slackChain = (async () => {
    await relayChatMessageToSlack({
      ...relayArgs,
      contactJustSaved: contact.saved,
      ...(args.quiet ? { quiet: true } : {}),
    });
    if (contact.saved && contact.email) {
      await relayContactToSlack({ sessionId: relayArgs.sessionId, channel: 'email', handle: contact.email });
    }
  })();
  // 한쪽이 실패해도 다른 쪽은 끝까지 간다.
  const [slack, ack] = await Promise.allSettled([slackChain, ackPromise]);
  if (slack.status === 'rejected') console.warn('[chat followups] slack relay failed:', slack.reason);
  if (ack.status === 'rejected') {
    console.warn('[chat followups] ack failed:', ack.reason);
    return;
  }
  if (ack.value.ack === 'error') {
    console.warn('[chat followups] auto ack failed for session', relayArgs.sessionId);
  }
  // AI 결과: 방에 요지 · 가예약 · 직원 확인 필요를 올리고 한국어 번역을 저장한다 — 손님 글 릴레이가 끝난 뒤에.
  if (ack.value.ai) {
    try {
      await finishAiTurn({ sessionId: relayArgs.sessionId, locale: args.locale ?? 'en', outcome: ack.value.ai });
    } catch (e) {
      console.warn('[chat followups] ai followups failed:', e);
    }
  }
  // 직원이 손님이 무엇을 보고 있는지 알고 답하도록, 손님 글 릴레이가 끝난 뒤에 방에 알린다.
  if (ack.value.eventHintUrl) {
    try {
      await relayEventHintNoteToSlack({ sessionId: relayArgs.sessionId, url: ack.value.eventHintUrl });
    } catch (e) {
      console.warn('[chat followups] event hint note failed:', e);
    }
  }
}
