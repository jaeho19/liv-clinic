import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../autoAck', () => ({ sendAutoAckIfDue: vi.fn() }));
vi.mock('../eventHint', () => ({ sendEventHintIfDue: vi.fn() }));
vi.mock('../contactService', () => ({ saveEmailFromMessage: vi.fn() }));
vi.mock('../slackRelay', () => ({
  relayChatMessageToSlack: vi.fn(),
  relayContactToSlack: vi.fn(),
  relayEventHintNoteToSlack: vi.fn(),
}));
vi.mock('../ai/turn', () => ({ decideAiTurn: vi.fn(), runAiTurn: vi.fn() }));
vi.mock('../ai/aiFollowups', () => ({ finishAiTurn: vi.fn() }));

import { sendAutoAckIfDue } from '../autoAck';
import { sendEventHintIfDue } from '../eventHint';
import { saveEmailFromMessage } from '../contactService';
import { relayChatMessageToSlack, relayEventHintNoteToSlack } from '../slackRelay';
import { finishAiTurn } from '../ai/aiFollowups';
import { EMPTY_BOOKING } from '../ai/booking';
import { decideAiTurn, runAiTurn, type AiTurnContext, type AiTurnSent } from '../ai/turn';
import { runVisitorMessageFollowups, settleEarlyFollowups, startEarlyFollowups } from '../visitorMessageFollowups';

// 스펙 2026-10-02 chat-ai-first-response §4.1 — AI가 답할 차례면 접수 안내 대신 AI 답, 답하지 못하면 접수 안내로 대신한다.
const saveEmail = vi.mocked(saveEmailFromMessage);
const autoAck = vi.mocked(sendAutoAckIfDue);
const eventHint = vi.mocked(sendEventHintIfDue);
const relayMessage = vi.mocked(relayChatMessageToSlack);
const relayHintNote = vi.mocked(relayEventHintNoteToSlack);
const decide = vi.mocked(decideAiTurn);
const runTurn = vi.mocked(runAiTurn);
const finish = vi.mocked(finishAiTurn);

const SESSION = {
  id: '11111111-2222-3333-4444-555555555555',
  visitor_locale: 'en',
  visitor_email: null,
  visitor_messenger_handle: null,
};
const ADMIN = {} as never;
const TRIGGER = { messageId: 'v-1' };
const URL = 'https://liv-clinic.net/en/events/2026-10-promotion';
const CTX: AiTurnContext = {
  sessionId: SESSION.id,
  locale: 'en',
  visitorEmail: null,
  messengerChannel: null,
  messengerHandle: null,
  sessionContact: null,
  handoffAt: null,
};
const SENT: AiTurnSent = {
  kind: 'sent',
  messageId: 'm-ai',
  text: 'Hello!',
  staffNoteKo: '인사에 답했습니다.',
  usedRows: [],
  bookingEvent: null,
  booking: EMPTY_BOOKING,
  contact: null,
  needsStaff: false,
  staffReasonKo: null,
  contactSaved: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  saveEmail.mockResolvedValue({ saved: false, hasContact: false });
  autoAck.mockResolvedValue('sent');
  eventHint.mockResolvedValue({ outcome: 'not_due' });
  relayMessage.mockResolvedValue(undefined);
  relayHintNote.mockResolvedValue(undefined);
  finish.mockResolvedValue(undefined);
  decide.mockResolvedValue({ run: false, reason: 'off', ctx: null });
  runTurn.mockResolvedValue(SENT);
});

describe('startEarlyFollowups — AI가 답할 차례', () => {
  it('AI 답 만들기를 시작하고, 접수 안내와 이벤트 안내는 보내지 않는다', async () => {
    decide.mockResolvedValue({ run: true, ctx: CTX });
    const early = await startEarlyFollowups(ADMIN, SESSION, 'How much is Ulthera?', TRIGGER);

    expect(early.aiReplying).toBe(true);
    expect(early.aiLed).toBe(true);
    expect(decide).toHaveBeenCalledWith(ADMIN, SESSION.id, 'How much is Ulthera?');
    expect(runTurn).toHaveBeenCalledWith(ADMIN, { ctx: CTX, triggerMessageId: 'v-1', text: 'How much is Ulthera?' });
    expect(await early.ackPromise).toEqual({ ack: 'not_due', eventHintUrl: null, ai: SENT });
    expect(autoAck).not.toHaveBeenCalled();
    expect(eventHint).not.toHaveBeenCalled();
  });

  it('이메일 저장이 끝난 뒤에 판정한다 (AI가 세션의 연락처를 보게)', async () => {
    const order: string[] = [];
    saveEmail.mockImplementation(async () => {
      order.push('email');
      return { saved: true, hasContact: true, email: 'emma@example.com' };
    });
    decide.mockImplementation(async () => {
      order.push('decide');
      return { run: true, ctx: CTX };
    });
    await startEarlyFollowups(ADMIN, SESSION, 'emma@example.com', TRIGGER);
    expect(order).toEqual(['email', 'decide']);
  });

  it('AI 답을 기다리지 않고 돌아온다', async () => {
    decide.mockResolvedValue({ run: true, ctx: CTX });
    let release!: (v: AiTurnSent) => void;
    runTurn.mockReturnValue(new Promise((r) => (release = r)));
    const early = await startEarlyFollowups(ADMIN, SESSION, 'Hello', TRIGGER);
    expect(early.aiReplying).toBe(true);
    release(SENT);
    expect((await early.ackPromise).ai).toBe(SENT);
  });

  it('AI가 답하지 못하면(fallback) 접수 안내 → 이벤트 안내가 대신 나간다', async () => {
    decide.mockResolvedValue({ run: true, ctx: CTX });
    runTurn.mockResolvedValue({ kind: 'fallback', reason: 'call:timeout' });
    eventHint.mockResolvedValue({ outcome: 'sent', url: URL });
    const early = await startEarlyFollowups(ADMIN, SESSION, 'How much is Ulthera?', TRIGGER);
    expect(await early.ackPromise).toEqual({
      ack: 'sent',
      eventHintUrl: URL,
      ai: { kind: 'fallback', reason: 'call:timeout' },
    });
    expect(autoAck).toHaveBeenCalledWith(SESSION.id);
    expect(eventHint).toHaveBeenCalledWith(ADMIN, SESSION.id, 'How much is Ulthera?');
  });

  it('AI 실행이 예외를 내도 fallback 으로 다룬다 — ackPromise 는 reject 되지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    decide.mockResolvedValue({ run: true, ctx: CTX });
    runTurn.mockRejectedValue(new Error('boom'));
    const early = await startEarlyFollowups(ADMIN, SESSION, 'Hello', TRIGGER);
    expect(await early.ackPromise).toEqual({ ack: 'sent', eventHintUrl: null, ai: { kind: 'fallback', reason: 'exception' } });
    warn.mockRestore();
  });

  it('더 새 글이 있어 버린 답(superseded)에는 접수 안내를 보내지 않는다', async () => {
    decide.mockResolvedValue({ run: true, ctx: CTX });
    runTurn.mockResolvedValue({ kind: 'superseded' });
    const early = await startEarlyFollowups(ADMIN, SESSION, 'Hello', TRIGGER);
    expect(await early.ackPromise).toEqual({ ack: 'not_due', eventHintUrl: null, ai: { kind: 'superseded' } });
    expect(autoAck).not.toHaveBeenCalled();
  });
});

describe('startEarlyFollowups — AI가 답할 차례가 아니다', () => {
  it('스위치가 꺼져 있거나 직원이 맡은 대화면 지금과 똑같다 (접수 안내 → 이벤트 안내)', async () => {
    for (const reason of ['off', 'no_key', 'staff_engaged', 'daily_cap', 'error'] as const) {
      vi.clearAllMocks();
      autoAck.mockResolvedValue('sent');
      eventHint.mockResolvedValue({ outcome: 'not_due' });
      saveEmail.mockResolvedValue({ saved: false, hasContact: false });
      decide.mockResolvedValue({ run: false, reason, ctx: null });
      const early = await startEarlyFollowups(ADMIN, SESSION, 'Hello', TRIGGER);
      expect(early.aiReplying, reason).toBe(false);
      expect(early.aiLed, reason).toBe(false);
      expect(await early.ackPromise, reason).toEqual({ ack: 'sent', eventHintUrl: null });
      expect(runTurn, reason).not.toHaveBeenCalled();
      expect(autoAck, reason).toHaveBeenCalledWith(SESSION.id);
    }
  });

  it('AI가 맡은 대화의 내용 없는 글(이모지뿐)에는 아무것도 보내지 않는다 — 접수 안내가 AI 답 사이에 끼어들지 않는다', async () => {
    decide.mockResolvedValue({ run: false, reason: 'no_substance', ctx: CTX });
    const early = await startEarlyFollowups(ADMIN, SESSION, '🙏', TRIGGER);
    expect(early.aiReplying).toBe(false);
    expect(early.aiLed).toBe(true);
    expect(await early.ackPromise).toEqual({ ack: 'not_due', eventHintUrl: null });
    expect(runTurn).not.toHaveBeenCalled();
    expect(autoAck).not.toHaveBeenCalled();
    expect(eventHint).not.toHaveBeenCalled();
  });

  it('대화당 한도에 닿았으면 지금 방식으로 동작하고, 직원에게 넘길 표시를 남긴다', async () => {
    decide.mockResolvedValue({ run: false, reason: 'session_cap', ctx: CTX });
    const early = await startEarlyFollowups(ADMIN, SESSION, 'Hello', TRIGGER);
    expect(early.aiReplying).toBe(false);
    expect(await early.ackPromise).toEqual({ ack: 'sent', eventHintUrl: null, ai: { kind: 'session_cap' } });
  });

  it('손님 글의 id 를 넘기지 않으면 판정 자체를 하지 않는다', async () => {
    const early = await startEarlyFollowups(ADMIN, SESSION, 'Hello');
    expect(decide).not.toHaveBeenCalled();
    expect(early.aiReplying).toBe(false);
    expect(early.aiLed).toBe(false);
  });
});

describe('settleEarlyFollowups — 손님 글의 번역 저장이 실패했을 때', () => {
  it('AI 결과가 있으면 방에 올린다 (가예약 알림이 빠지지 않게). 손님 글 릴레이는 하지 않는다', async () => {
    await settleEarlyFollowups({
      sessionId: SESSION.id,
      locale: 'ja',
      ackPromise: Promise.resolve({ ack: 'not_due', eventHintUrl: null, ai: SENT }),
    });
    expect(finish).toHaveBeenCalledWith({ sessionId: SESSION.id, locale: 'ja', outcome: SENT });
    expect(relayMessage).not.toHaveBeenCalled();
  });

  it('AI 결과가 없으면 기다리기만 한다. 실패해도 throw 하지 않는다', async () => {
    await settleEarlyFollowups({ sessionId: SESSION.id, locale: 'en', ackPromise: Promise.resolve({ ack: 'sent', eventHintUrl: null }) });
    expect(finish).not.toHaveBeenCalled();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      settleEarlyFollowups({ sessionId: SESSION.id, locale: 'en', ackPromise: Promise.reject(new Error('boom')) })
    ).resolves.toBeUndefined();
    warn.mockRestore();
  });
});

describe('runVisitorMessageFollowups — AI 결과의 뒤처리', () => {
  const relayArgs = {
    sessionId: SESSION.id,
    messageId: 'v-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    senderLabel: null,
    receivedAt: '2026-10-02T07:20:00Z',
  };
  const contact = { saved: false, hasContact: false };

  it('AI가 맡은 대화면 손님 글을 멘션 없이(quiet) 올린다', async () => {
    await runVisitorMessageFollowups({
      relayArgs,
      contact,
      ackPromise: Promise.resolve({ ack: 'not_due', eventHintUrl: null, ai: SENT }),
      quiet: true,
      locale: 'en',
    });
    expect(relayMessage).toHaveBeenCalledWith({ ...relayArgs, contactJustSaved: false, quiet: true });
  });

  it('손님 글 릴레이가 끝난 뒤에 AI 결과를 방에 올린다', async () => {
    const order: string[] = [];
    let releaseRelay!: () => void;
    relayMessage.mockImplementation(
      () =>
        new Promise<void>((r) => {
          releaseRelay = () => {
            order.push('message');
            r();
          };
        })
    );
    finish.mockImplementation(async () => {
      order.push('ai');
    });
    const running = runVisitorMessageFollowups({
      relayArgs,
      contact,
      ackPromise: Promise.resolve({ ack: 'not_due', eventHintUrl: null, ai: SENT }),
      quiet: true,
      locale: 'ja',
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(finish).not.toHaveBeenCalled();
    releaseRelay();
    await running;
    expect(order).toEqual(['message', 'ai']);
    expect(finish).toHaveBeenCalledWith({ sessionId: SESSION.id, locale: 'ja', outcome: SENT });
  });

  it('fallback 이면 직원에게 넘기는 알림과 이벤트 안내 알림이 모두 간다', async () => {
    const outcome = { kind: 'fallback' as const, reason: 'call:timeout' };
    await runVisitorMessageFollowups({
      relayArgs,
      contact,
      ackPromise: Promise.resolve({ ack: 'sent', eventHintUrl: URL, ai: outcome }),
      quiet: true,
      locale: 'en',
    });
    expect(finish).toHaveBeenCalledWith({ sessionId: SESSION.id, locale: 'en', outcome });
    expect(relayHintNote).toHaveBeenCalledWith({ sessionId: SESSION.id, url: URL });
  });

  it('AI 결과가 없으면 뒤처리를 부르지 않는다', async () => {
    await runVisitorMessageFollowups({ relayArgs, contact, ackPromise: Promise.resolve({ ack: 'sent', eventHintUrl: null }) });
    expect(finish).not.toHaveBeenCalled();
    expect(relayMessage).toHaveBeenCalledWith({ ...relayArgs, contactJustSaved: false });
  });

  it('뒤처리가 실패해도 throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    finish.mockRejectedValue(new Error('boom'));
    await expect(
      runVisitorMessageFollowups({
        relayArgs,
        contact,
        ackPromise: Promise.resolve({ ack: 'not_due', eventHintUrl: null, ai: SENT }),
        quiet: true,
        locale: 'en',
      })
    ).resolves.toBeUndefined();
    warn.mockRestore();
  });
});
