import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/chat/db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('@/lib/chat/translation', () => ({ translate: vi.fn() }));
vi.mock('@/lib/chat/slackRelay', () => ({ relayAiTurnToSlack: vi.fn(), relayContactToSlack: vi.fn() }));

import { createChatAdminClient } from '@/lib/chat/db';
import { relayAiTurnToSlack, relayContactToSlack } from '@/lib/chat/slackRelay';
import { translate } from '@/lib/chat/translation';
import { fakeAdmin, hasFilter } from '@/lib/chat/__tests__/fakeAdmin';
import { finishAiTurn } from '../aiFollowups';
import { EMPTY_BOOKING } from '../booking';
import { getKnowledge } from '../knowledge';
import type { AiTurnSent } from '../turn';

const relayAi = vi.mocked(relayAiTurnToSlack);
const relayContact = vi.mocked(relayContactToSlack);
const translateMock = vi.mocked(translate);
const adminMock = vi.mocked(createChatAdminClient);

const SESSION_ID = '11111111-2222-3333-4444-555555555555';
const THERMAGE = getKnowledge('en', new Date('2026-10-02T07:20:00Z')).rows.find((r) => r.key === 'thermage.name.shot600')!;
const SENT: AiTurnSent = {
  kind: 'sent',
  messageId: 'm-ai',
  text: 'Hello! How can we help you today?',
  staffNoteKo: '인사에 답했습니다.',
  usedRows: [],
  bookingEvent: null,
  booking: EMPTY_BOOKING,
  contact: null,
  needsStaff: false,
  staffReasonKo: null,
  contactSaved: null,
};
const finish = (outcome: Parameters<typeof finishAiTurn>[0]['outcome']) =>
  finishAiTurn({ sessionId: SESSION_ID, locale: 'en', outcome });

let admin: ReturnType<typeof fakeAdmin>;
beforeEach(() => {
  vi.clearAllMocks();
  admin = fakeAdmin(() => ({ data: null }));
  adminMock.mockReturnValue(admin as never);
  relayAi.mockResolvedValue(undefined);
  relayContact.mockResolvedValue(undefined);
  translateMock.mockResolvedValue({ status: 'success', text: '안녕하세요! 무엇을 도와드릴까요?', latencyMs: 300 });
});
afterEach(() => vi.restoreAllMocks());

describe('finishAiTurn — 답이 나간 차례', () => {
  it('방에 요지를 올리고, AI 글의 한국어 번역을 저장한다', async () => {
    await finish(SENT);
    expect(relayAi).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      note: '인사에 답했습니다.',
      quoted: [],
      booking: null,
      staffNeeded: null,
    });
    expect(translateMock).toHaveBeenCalledWith('Hello! How can we help you today?', 'en', 'ko');
    const update = admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'update')!;
    expect(update.payload).toEqual({ original_text: '안녕하세요! 무엇을 도와드릴까요?' });
    expect(hasFilter(update, 'id', 'm-ai')).toBe(true);
    expect(relayContact).not.toHaveBeenCalled();
  });

  it('금액 줄을 썼으면 "안내한 금액"을 한국어로 넘긴다', async () => {
    await finish({ ...SENT, usedRows: [THERMAGE] });
    expect(relayAi.mock.calls[0][0].quoted).toEqual(['써마지 레이저 · 600샷 2,400,000원~']);
  });

  it('가예약이 찼거나 바뀌었으면 한 줄 요약과 날짜를 넘긴다', async () => {
    const booking = { ...EMPTY_BOOKING, date: '2026-10-14', time: '14:00', partySize: 2, treatmentKo: '울쎄라피 프라임', name: 'Emma' };
    const contact = { channel: 'whatsapp' as const, handle: '+65 9123 4567' };
    await finish({ ...SENT, bookingEvent: 'requested', booking, contact });
    expect(relayAi.mock.calls[0][0].booking).toEqual({
      changed: false,
      summary: '10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma',
      when: '10/14(수) 14:00',
    });
    await finish({ ...SENT, bookingEvent: 'changed', booking, contact });
    expect(relayAi.mock.calls[1][0].booking?.changed).toBe(true);
  });

  it('직원 확인 필요와 사유를 넘긴다', async () => {
    await finish({ ...SENT, needsStaff: true, staffReasonKo: '스컬트라 금액 문의' });
    expect(relayAi.mock.calls[0][0].staffNeeded).toEqual({ reason: '스컬트라 금액 문의' });
  });

  it('가예약 없이 연락처만 받았으면 연락처 알림을 요지 뒤에 올린다', async () => {
    const order: string[] = [];
    relayAi.mockImplementation(async () => {
      order.push('ai');
    });
    relayContact.mockImplementation(async () => {
      order.push('contact');
    });
    await finish({ ...SENT, contactSaved: { channel: 'wechat', handle: 'emma_w' } });
    expect(order).toEqual(['ai', 'contact']);
    expect(relayContact).toHaveBeenCalledWith({ sessionId: SESSION_ID, channel: 'wechat', handle: 'emma_w' });
  });

  it('한국어 번역은 Slack 게시와 함께 돈다 — 게시를 기다렸다가 시작하지 않는다 (함수 시간 한도 60초)', async () => {
    let releaseRelay!: () => void;
    relayAi.mockImplementation(() => new Promise<void>((resolve) => (releaseRelay = resolve)));
    const running = finish(SENT);
    await new Promise((r) => setTimeout(r, 0));
    expect(translateMock).toHaveBeenCalledTimes(1); // Slack 게시가 아직 끝나지 않았다
    releaseRelay();
    await running;
    expect(admin.ops.filter((o) => o.table === 'chat_messages' && o.op === 'update')).toHaveLength(1);
  });

  it('Slack 게시가 예외를 내도 한국어 번역은 저장한다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    relayAi.mockRejectedValue(new Error('boom'));
    await finish(SENT);
    expect(admin.ops.filter((o) => o.table === 'chat_messages' && o.op === 'update')).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it('번역이 실패하거나 원문과 같으면 글을 고치지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    translateMock.mockResolvedValueOnce({ status: 'failed', text: SENT.text, errorCode: 'timeout', latencyMs: 5000 });
    await finish(SENT);
    translateMock.mockResolvedValueOnce({ status: 'skipped', text: SENT.text, latencyMs: 0 });
    await finish(SENT);
    translateMock.mockResolvedValueOnce({ status: 'success', text: SENT.text, latencyMs: 10 });
    await finish(SENT);
    expect(admin.ops.filter((o) => o.op === 'update')).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('번역이 4,000자를 넘으면 자른다', async () => {
    translateMock.mockResolvedValueOnce({ status: 'success', text: '가'.repeat(4500), latencyMs: 10 });
    await finish(SENT);
    const update = admin.ops.find((o) => o.op === 'update')!;
    expect((update.payload as { original_text: string }).original_text).toHaveLength(4000);
  });
});

describe('finishAiTurn — 답이 나가지 않은 차례', () => {
  it('fallback: 요지 없이 직원 확인 필요(자동 응대가 답하지 못했습니다)만', async () => {
    await finish({ kind: 'fallback', reason: 'call:timeout' });
    expect(relayAi).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      note: null,
      quoted: [],
      booking: null,
      staffNeeded: { reason: '자동 응대가 답하지 못했습니다' },
    });
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('대화당 한도: 직원 확인 필요(AI 응답 한도에 닿았습니다)', async () => {
    await finish({ kind: 'session_cap' });
    expect(relayAi.mock.calls[0][0].staffNeeded).toEqual({ reason: 'AI 응답 한도에 닿았습니다' });
  });

  it('superseded: 아무것도 하지 않는다', async () => {
    await finish({ kind: 'superseded' });
    expect(relayAi).not.toHaveBeenCalled();
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('안에서 예외가 나도 throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    relayAi.mockRejectedValue(new Error('slack down'));
    await expect(finish(SENT)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
