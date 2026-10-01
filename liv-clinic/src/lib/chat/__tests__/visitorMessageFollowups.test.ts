import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../autoAck', () => ({ sendAutoAckIfDue: vi.fn() }));
vi.mock('../eventHint', () => ({ sendEventHintIfDue: vi.fn() }));
vi.mock('../contactService', () => ({ saveEmailFromMessage: vi.fn() }));
vi.mock('../slackRelay', () => ({
  relayChatMessageToSlack: vi.fn(),
  relayContactToSlack: vi.fn(),
  relayEventHintNoteToSlack: vi.fn(),
}));

import { sendAutoAckIfDue } from '../autoAck';
import { sendEventHintIfDue } from '../eventHint';
import { saveEmailFromMessage } from '../contactService';
import { relayChatMessageToSlack, relayContactToSlack, relayEventHintNoteToSlack } from '../slackRelay';
import { runVisitorMessageFollowups, startEarlyFollowups, type AckResult } from '../visitorMessageFollowups';

const saveEmail = vi.mocked(saveEmailFromMessage);
const autoAck = vi.mocked(sendAutoAckIfDue);
const eventHint = vi.mocked(sendEventHintIfDue);
const relayMessage = vi.mocked(relayChatMessageToSlack);
const relayContact = vi.mocked(relayContactToSlack);
const relayHintNote = vi.mocked(relayEventHintNoteToSlack);

const SESSION = {
  id: '11111111-2222-3333-4444-555555555555',
  visitor_locale: 'en',
  visitor_email: null,
  visitor_messenger_handle: null,
};
const ADMIN = {} as never;
const URL = 'https://liv-clinic.net/en/events/2026-10-promotion';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
/** 마이크로태스크 큐를 비운다 — "아직 호출되지 않았다"를 확인하기 전에 쓴다. */
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  saveEmail.mockResolvedValue({ saved: false, hasContact: false });
  autoAck.mockResolvedValue('sent');
  eventHint.mockResolvedValue({ outcome: 'not_due' });
  relayMessage.mockResolvedValue(undefined);
  relayContact.mockResolvedValue(undefined);
  relayHintNote.mockResolvedValue(undefined);
});

describe('startEarlyFollowups', () => {
  it('이메일 저장이 끝난 뒤에 자동 안내를 시작한다', async () => {
    const saving = deferred<{ saved: boolean; hasContact: boolean; email?: string }>();
    saveEmail.mockReturnValue(saving.promise);

    const started = startEarlyFollowups(ADMIN, SESSION, 'mail me at guest@example.com');
    await flush();
    expect(saveEmail).toHaveBeenCalledWith(ADMIN, SESSION, 'mail me at guest@example.com');
    expect(autoAck).not.toHaveBeenCalled();

    saving.resolve({ saved: true, hasContact: true, email: 'guest@example.com' });
    const early = await started;
    expect(early.contact).toEqual({ saved: true, hasContact: true, email: 'guest@example.com' });
    expect(autoAck).toHaveBeenCalledWith(SESSION.id);
  });

  it('자동 안내 완료를 기다리지 않고 돌아오며, 이벤트 안내는 자동 안내가 끝난 뒤에 시작한다', async () => {
    const ack = deferred<'sent'>();
    autoAck.mockReturnValue(ack.promise);
    eventHint.mockResolvedValue({ outcome: 'sent', url: URL });

    const early = await startEarlyFollowups(ADMIN, SESSION, 'How much is Ulthera?');
    await flush();
    expect(autoAck).toHaveBeenCalledTimes(1);
    expect(eventHint).not.toHaveBeenCalled();

    ack.resolve('sent');
    expect(await early.ackPromise).toEqual({ ack: 'sent', eventHintUrl: URL });
    expect(eventHint).toHaveBeenCalledWith(ADMIN, SESSION.id, 'How much is Ulthera?');
  });

  it('이벤트 안내가 나가지 않았으면 eventHintUrl 은 null', async () => {
    const early = await startEarlyFollowups(ADMIN, SESSION, 'hello');
    expect(await early.ackPromise).toEqual({ ack: 'sent', eventHintUrl: null });
  });

  it('자동 안내가 not_due 여도 이벤트 안내는 따로 판정한다 (대화 중간의 가격 질문)', async () => {
    autoAck.mockResolvedValue('not_due');
    eventHint.mockResolvedValue({ outcome: 'sent', url: URL });
    const early = await startEarlyFollowups(ADMIN, SESSION, 'and the price?');
    expect(await early.ackPromise).toEqual({ ack: 'not_due', eventHintUrl: URL });
  });

  it('안쪽에서 예외가 나도 ackPromise 는 reject 되지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    autoAck.mockRejectedValue(new Error('boom'));
    const early = await startEarlyFollowups(ADMIN, SESSION, 'hello');
    expect(await early.ackPromise).toEqual({ ack: 'error', eventHintUrl: null });
    warn.mockRestore();
  });
});

describe('runVisitorMessageFollowups', () => {
  const relayArgs = {
    sessionId: SESSION.id,
    messageId: 'm-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    senderLabel: null,
    receivedAt: '2026-10-05T03:00:00Z',
  };
  const ackDone = (value: AckResult) => Promise.resolve(value);

  it('이메일이 저장된 경우에만 연락처 알림이 손님 글 릴레이 뒤에 간다', async () => {
    const order: string[] = [];
    relayMessage.mockImplementation(async () => {
      order.push('message');
    });
    relayContact.mockImplementation(async () => {
      order.push('contact');
    });

    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: true, hasContact: true, email: 'guest@example.com' },
      ackPromise: ackDone({ ack: 'sent', eventHintUrl: null }),
    });
    expect(order).toEqual(['message', 'contact']);
    expect(relayMessage).toHaveBeenCalledWith({ ...relayArgs, contactJustSaved: true });
    expect(relayContact).toHaveBeenCalledWith({ sessionId: SESSION.id, channel: 'email', handle: 'guest@example.com' });
  });

  it('이메일이 저장되지 않았으면 연락처 알림은 없다', async () => {
    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: true },
      ackPromise: ackDone({ ack: 'sent', eventHintUrl: null }),
    });
    expect(relayMessage).toHaveBeenCalledWith({ ...relayArgs, contactJustSaved: false });
    expect(relayContact).not.toHaveBeenCalled();
  });

  it('ackPromise 를 끝까지 기다린다', async () => {
    const ack = deferred<AckResult>();
    let finished = false;
    const running = runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ack.promise,
    }).then(() => {
      finished = true;
    });
    await flush();
    expect(relayMessage).toHaveBeenCalledTimes(1);
    expect(finished).toBe(false);

    ack.resolve({ ack: 'sent', eventHintUrl: null });
    await running;
    expect(finished).toBe(true);
  });

  it('eventHintUrl 이 있을 때만 이벤트 안내 알림이 손님 글 릴레이 뒤에 간다', async () => {
    const order: string[] = [];
    const relaying = deferred<void>();
    relayMessage.mockImplementation(async () => {
      await relaying.promise;
      order.push('message');
    });
    relayHintNote.mockImplementation(async () => {
      order.push('hint-note');
    });

    const running = runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ackDone({ ack: 'sent', eventHintUrl: URL }),
    });
    await flush();
    expect(relayHintNote).not.toHaveBeenCalled(); // 자동 안내는 끝났지만 손님 글 릴레이가 아직이다
    relaying.resolve();
    await running;
    expect(order).toEqual(['message', 'hint-note']);
    expect(relayHintNote).toHaveBeenCalledWith({ sessionId: SESSION.id, url: URL });
  });

  it('eventHintUrl 이 없으면 이벤트 안내 알림은 없다', async () => {
    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ackDone({ ack: 'not_due', eventHintUrl: null }),
    });
    expect(relayHintNote).not.toHaveBeenCalled();
  });

  it('Slack 릴레이가 실패해도 자동 안내 쪽은 끝까지 가고 이벤트 안내 알림도 보낸다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    relayMessage.mockRejectedValue(new Error('slack down'));
    await expect(
      runVisitorMessageFollowups({
        relayArgs,
        contact: { saved: false, hasContact: false },
        ackPromise: ackDone({ ack: 'sent', eventHintUrl: URL }),
      })
    ).resolves.toBeUndefined();
    expect(relayHintNote).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('자동 안내 쪽이 실패해도 Slack 릴레이는 끝난다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      runVisitorMessageFollowups({
        relayArgs,
        contact: { saved: true, hasContact: true, email: 'guest@example.com' },
        ackPromise: Promise.reject(new Error('boom')),
      })
    ).resolves.toBeUndefined();
    expect(relayMessage).toHaveBeenCalledTimes(1);
    expect(relayContact).toHaveBeenCalledTimes(1);
    expect(relayHintNote).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('자동 안내가 error 면 경고를 남긴다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runVisitorMessageFollowups({
      relayArgs,
      contact: { saved: false, hasContact: false },
      ackPromise: ackDone({ ack: 'error', eventHintUrl: null }),
    });
    expect(warn.mock.calls.some((c) => String(c[0]).includes('auto ack failed'))).toBe(true);
    warn.mockRestore();
  });
});
