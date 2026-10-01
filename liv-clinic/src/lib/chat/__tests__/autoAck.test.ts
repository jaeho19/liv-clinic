import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));

import { createChatAdminClient } from '../db';
import { broadcastToSession } from '../broadcast';
import { autoAckKind, INTAKE_REPEAT_MS, sendAutoAckIfDue, shouldSendAutoAck } from '../autoAck';
import { _resetBusinessHoursForTesting } from '../businessHours';
import { composeIntakeTexts, getAutoAckTexts, intakeFragmentKeys, VISITOR_LOCALES, type IntakeSlot } from '../serverI18n';
import { fakeAdmin, type FakeOp } from './fakeAdmin';

describe('shouldSendAutoAck', () => {
  it('기다리는 중이 아니면(awaiting_since NULL) 안 보낸다', () => {
    expect(shouldSendAutoAck({ awaitingSince: null, autoAckAt: null })).toBe(false);
  });
  it('아직 한 번도 안 보냈으면 보낸다', () => {
    expect(shouldSendAutoAck({ awaitingSince: '2024-01-01T01:00:00Z', autoAckAt: null })).toBe(true);
  });
  it('이번 대기 구간이 시작된 뒤에 이미 보냈으면 안 보낸다', () => {
    expect(
      shouldSendAutoAck({ awaitingSince: '2024-01-01T01:00:00Z', autoAckAt: '2024-01-01T01:00:05Z' })
    ).toBe(false);
  });
  it('지난 대기 구간에 보낸 것이면(직원 답변 후 손님 재발신) 다시 보낸다', () => {
    expect(
      shouldSendAutoAck({ awaitingSince: '2024-01-02T09:00:00Z', autoAckAt: '2024-01-01T01:00:05Z' })
    ).toBe(true);
  });
});

describe('getAutoAckTexts', () => {
  it('10개 로케일 모두 영업시간 중/외 문구가 있고 서로 다르다', () => {
    for (const locale of VISITOR_LOCALES) {
      const open = getAutoAckTexts(locale, false);
      const off = getAutoAckTexts(locale, true);
      expect(open.localized.length).toBeGreaterThan(10);
      expect(off.localized.length).toBeGreaterThan(10);
      expect(open.localized).not.toBe(off.localized);
    }
  });
  it('한국어 원문은 로케일과 무관하게 같고, 영업시간 중/외가 다르다', () => {
    expect(getAutoAckTexts('en', false).ko).toBe(getAutoAckTexts('ja', false).ko);
    expect(getAutoAckTexts('en', false).ko).toContain('잠시만 기다려 주세요');
    expect(getAutoAckTexts('en', true).ko).toContain('상담 시간에 순서대로');
  });
});

describe('autoAckKind — 접수 안내 / 짧은 안내', () => {
  const now = new Date('2026-10-05T03:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('자동 안내를 보낸 적이 없으면 접수 안내', () => {
    expect(autoAckKind({ autoAckAt: null }, now)).toBe('intake');
  });
  it('마지막 안내가 12시간보다 오래됐으면 접수 안내', () => {
    expect(autoAckKind({ autoAckAt: ago(INTAKE_REPEAT_MS + 1) }, now)).toBe('intake');
  });
  it('12시간 이내면 짧은 안내', () => {
    expect(autoAckKind({ autoAckAt: ago(INTAKE_REPEAT_MS) }, now)).toBe('short');
    expect(autoAckKind({ autoAckAt: ago(60_000) }, now)).toBe('short');
  });
});

describe('composeIntakeTexts — 접수 안내 문장 조합', () => {
  const SLOTS: IntakeSlot[] = ['open', 'closing', 'closed'];

  it('문장 키: G + S + C + Q, 영업 중일 때만 W', () => {
    expect(intakeFragmentKeys('open', false)).toEqual(['G', 'S_open', 'C_ask_open', 'Q', 'W']);
    expect(intakeFragmentKeys('closing', false)).toEqual(['G', 'S_closing', 'C_ask_closing', 'Q']);
    expect(intakeFragmentKeys('closed', true)).toEqual(['G', 'S_closed', 'C_known_closed', 'Q']);
  });

  it('10개 로케일 × 3 시간대 × 연락처 유무가 모두 비어 있지 않고 서로 다르다', () => {
    for (const locale of VISITOR_LOCALES) {
      const seen = new Set<string>();
      for (const slot of SLOTS) {
        for (const hasContact of [false, true]) {
          const { localized } = composeIntakeTexts(locale, slot, hasContact);
          const lines = localized.split('\n');
          expect(lines).toHaveLength(slot === 'open' ? 5 : 4);
          for (const line of lines) expect(line.trim().length).toBeGreaterThan(5);
          seen.add(localized);
        }
      }
      expect(seen.size).toBe(6);
    }
  });

  it('채팅 메시지 길이 제한(1000자)을 넘지 않는다', () => {
    for (const locale of VISITOR_LOCALES) {
      for (const slot of SLOTS) {
        for (const hasContact of [false, true]) {
          const t = composeIntakeTexts(locale, slot, hasContact);
          expect(t.localized.length).toBeLessThanOrEqual(1000);
          expect(t.ko.length).toBeLessThanOrEqual(1000);
        }
      }
    }
  });

  it('한국어 원문은 로케일과 무관하게 같다', () => {
    expect(composeIntakeTexts('en', 'open', false).ko).toBe(composeIntakeTexts('ar', 'open', false).ko);
  });

  it('한국어 원문: 영업 중에는 "오늘 안에 최대한 빨리", 상담 시간 외에는 "상담 시간이 시작되는 대로"', () => {
    expect(composeIntakeTexts('en', 'open', false).ko).toContain('오늘 안에 최대한 빨리');
    expect(composeIntakeTexts('en', 'open', true).ko).toContain('남겨 주신 연락처로 오늘 안에 최대한 빨리');
    expect(composeIntakeTexts('en', 'closed', false).ko).toContain('상담 시간이 시작되는 대로');
    expect(composeIntakeTexts('en', 'closing', false).ko).toContain('다음 영업일에 가장 먼저');
  });

  it('"이 창을 열어 두시면" 문장(W)은 영업 중에만 붙는다', () => {
    const w = '이 창을 열어 두시면 여기로도 답변드립니다.';
    expect(composeIntakeTexts('en', 'open', false).ko.endsWith(w)).toBe(true);
    expect(composeIntakeTexts('en', 'closing', false).ko).not.toContain(w);
    expect(composeIntakeTexts('en', 'closed', false).ko).not.toContain(w);
  });

  it('원장님이 확인한 영어·일본어·중국어 첫 문장', () => {
    expect(composeIntakeTexts('en', 'open', false).localized.split('\n')[0]).toBe(
      "Hello, this is LIV Plastic Surgery. We've received your message."
    );
    expect(composeIntakeTexts('ja', 'open', false).localized.split('\n')[0]).toBe(
      'こんにちは、LIV美容クリニックです。メッセージを受け付けました。'
    );
    expect(composeIntakeTexts('zh', 'open', false).localized.split('\n')[0]).toBe('您好，这里是LIV整形外科。已收到您的留言。');
    expect(composeIntakeTexts('zh-TW', 'open', false).localized.split('\n')[0]).toBe(
      '您好，這裡是LIV整形外科。已收到您的訊息。'
    );
  });
});

describe('sendAutoAckIfDue — 종류에 따라 문구를 고른다', () => {
  const adminMock = vi.mocked(createChatAdminClient);
  const SESSION_ID = '11111111-2222-3333-4444-555555555555';
  // 2026-10-05(월) 12:00 KST — 영업 중(open)
  const NOW = new Date('2026-10-05T03:00:00Z');

  function sessionRow(over: Record<string, unknown> = {}) {
    return {
      id: SESSION_ID,
      visitor_locale: 'en',
      awaiting_since: '2026-10-05T02:59:58Z',
      auto_ack_at: null,
      visitor_email: null,
      visitor_messenger_handle: null,
      ...over,
    };
  }

  function adminWith(row: Record<string, unknown> | null) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: row };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: SESSION_ID }] };
      if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-auto' } };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const insertedPayload = (admin: ReturnType<typeof fakeAdmin>) =>
    admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'insert')?.payload as Record<string, unknown>;

  beforeEach(() => {
    delete process.env.CHAT_BUSINESS_HOURS_JSON;
    delete process.env.CHAT_CLOSED_DATES;
    _resetBusinessHoursForTesting();
    adminMock.mockReset();
    vi.mocked(broadcastToSession).mockClear();
  });
  afterEach(() => {
    _resetBusinessHoursForTesting();
  });

  it('첫 문의(연락처 없음) → 접수 안내: 연락처를 남겨 달라는 문장', async () => {
    const admin = adminWith(sessionRow());
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    const expected = composeIntakeTexts('en', 'open', false);
    expect(insertedPayload(admin)).toMatchObject({
      session_id: SESSION_ID,
      sender: 'operator',
      source: 'auto',
      sender_label: '자동 안내',
      original_lang: 'ko',
      original_text: expected.ko,
      translated_text: expected.localized,
      translated_lang: 'en',
      translation_status: 'success',
    });
    expect(expected.ko).toContain('편한 연락처를 남겨 주시면');
    expect(broadcastToSession).toHaveBeenCalledTimes(1);
  });

  it('시작 화면에서 이메일을 넣은 손님 → "남겨 주신 연락처로" 문장', async () => {
    const admin = adminWith(sessionRow({ visitor_email: 'guest@example.com', visitor_locale: 'ja' }));
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(composeIntakeTexts('ja', 'open', true).ko);
    expect(insertedPayload(admin).translated_text).toBe(composeIntakeTexts('ja', 'open', true).localized);
  });

  it('상담 시간 외 첫 문의 → closed 문장', async () => {
    const admin = adminWith(sessionRow({ awaiting_since: '2026-10-04T15:00:00Z' }));
    // 2026-10-05(월) 00:00 KST
    expect(await sendAutoAckIfDue(SESSION_ID, new Date('2026-10-04T15:00:02Z'))).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(composeIntakeTexts('en', 'closed', false).ko);
  });

  it('12시간 안의 재발신 → 예전 짧은 안내 그대로', async () => {
    const admin = adminWith(
      sessionRow({ auto_ack_at: '2026-10-05T01:00:00Z', awaiting_since: '2026-10-05T02:59:58Z' })
    );
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(getAutoAckTexts('en', false).ko);
    expect(insertedPayload(admin).translated_text).toBe(getAutoAckTexts('en', false).localized);
  });

  it('마지막 안내가 12시간보다 오래됐으면 다시 접수 안내', async () => {
    const admin = adminWith(
      sessionRow({ auto_ack_at: '2026-10-04T10:00:00Z', awaiting_since: '2026-10-05T02:59:58Z' })
    );
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('sent');
    expect(insertedPayload(admin).original_text).toBe(composeIntakeTexts('en', 'open', false).ko);
  });

  it('이번 대기 구간에 이미 보냈으면 아무것도 넣지 않는다', async () => {
    const admin = adminWith(
      sessionRow({ auto_ack_at: '2026-10-05T02:59:59Z', awaiting_since: '2026-10-05T02:59:58Z' })
    );
    expect(await sendAutoAckIfDue(SESSION_ID, NOW)).toBe('not_due');
    expect(admin.ops.some((o) => o.op === 'insert')).toBe(false);
  });
});
