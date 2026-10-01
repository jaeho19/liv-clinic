import 'server-only';
import type { ChatAdminClient } from '@/lib/chat/db';
import { sendAutoAckIfDue, type AutoAckOutcome } from '@/lib/chat/autoAck';
import { saveEmailFromMessage, type ContactSession, type MessageEmailResult } from '@/lib/chat/contactService';
import { sendEventHintIfDue } from '@/lib/chat/eventHint';
import {
  relayChatMessageToSlack,
  relayContactToSlack,
  relayEventHintNoteToSlack,
  type RelayOutboundArgs,
} from '@/lib/chat/slackRelay';

// 손님 글 한 건에 뒤따르는 일들 (스펙 2026-10-01 §4.1 "발송 시점을 앞당긴다").
//   1. 손님 글 INSERT                      ← 라우트
//   2. 글 속 이메일 인식·저장               ← startEarlyFollowups (끝까지 기다린다)
//   3. 자동 안내 → 이벤트 안내 시작         ← startEarlyFollowups (기다리지 않는다 — 번역·Slack과 무관)
//   4. 번역 → UPDATE → broadcast → 응답     ← 라우트
//   5. 응답 뒤: Slack 릴레이(→ 연락처 알림)와 3의 완료를 함께 기다린 뒤 이벤트 안내 알림   ← runVisitorMessageFollowups
// 라우트 단위 테스트가 없는 리포라 순서 로직을 여기로 뺐다.

export interface AckResult {
  ack: AutoAckOutcome;
  /** 이벤트 안내가 나갔으면 그 링크. 안 나갔으면 null */
  eventHintUrl: string | null;
}

export interface EarlyFollowups {
  contact: MessageEmailResult;
  /** 자동 안내에 이어 이벤트 안내까지 끝나면 풀린다. reject 되지 않는다. */
  ackPromise: Promise<AckResult>;
}

export async function startEarlyFollowups(
  admin: ChatAdminClient,
  session: ContactSession,
  text: string
): Promise<EarlyFollowups> {
  // 2. 자동 안내가 "남겨 주신 연락처로 …" 문장을 고르려면 이메일 저장이 먼저 끝나 있어야 한다.
  const contact = await saveEmailFromMessage(admin, session, text);
  // 3. 손님이 화면 앞에 있는 첫 몇 초 안에 나가도록, 번역과 Slack 릴레이를 기다리지 않고 지금 시작한다.
  const ackPromise = (async (): Promise<AckResult> => {
    try {
      const ack = await sendAutoAckIfDue(session.id);
      // 이벤트 안내는 자동 안내 뒤에 넣는다 — 손님 화면에서 손님 글 → 안내 → 이벤트 안내 순으로 보인다.
      const hint = await sendEventHintIfDue(admin, session.id, text);
      return { ack, eventHintUrl: hint.outcome === 'sent' && hint.url ? hint.url : null };
    } catch (e) {
      console.warn('[chat followups] ack chain failed:', e);
      return { ack: 'error', eventHintUrl: null };
    }
  })();
  return { contact, ackPromise };
}

export async function runVisitorMessageFollowups(args: {
  relayArgs: RelayOutboundArgs;
  contact: MessageEmailResult;
  ackPromise: Promise<AckResult>;
}): Promise<void> {
  const { relayArgs, contact, ackPromise } = args;
  // Slack: 손님 글 → (이메일이 저장됐으면) 연락처 알림 순. 방에서 글 → 연락처 순으로 보이게 한다.
  const slackChain = (async () => {
    await relayChatMessageToSlack({ ...relayArgs, contactJustSaved: contact.saved });
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
  // 직원이 손님이 무엇을 보고 있는지 알고 답하도록, 손님 글 릴레이가 끝난 뒤에 방에 알린다.
  if (ack.value.eventHintUrl) {
    try {
      await relayEventHintNoteToSlack({ sessionId: relayArgs.sessionId, url: ack.value.eventHintUrl });
    } catch (e) {
      console.warn('[chat followups] event hint note failed:', e);
    }
  }
}
