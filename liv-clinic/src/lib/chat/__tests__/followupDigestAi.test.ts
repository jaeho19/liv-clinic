import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../slackStaff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../slackStaff')>();
  return { ...actual, loadStaffDirectory: vi.fn() };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  postSlackMessage: vi.fn(),
}));

import { _resetBusinessHoursForTesting } from '../businessHours';
import { createChatAdminClient } from '../db';
import { runFollowupDigest } from '../followupDigest';
import { postSlackMessage } from '../slack';
import { loadStaffDirectory, parseStaffDirectory } from '../slackStaff';
import { fakeAdmin, hasFilter, type FakeOp, type FakeResult } from './fakeAdmin';

// 스펙 2026-10-02 chat-ai-first-response §4.11 — 요약 줄 끝에 가예약 날짜와 🙋 를 덧붙인다.
const adminMock = vi.mocked(createChatAdminClient);
const postMock = vi.mocked(postSlackMessage);
// 2026-10-05(월)은 시험용 날짜다(휴진일 설정 없음) — 18:03 KST, 마감 60분 전 창 안
const NOW = new Date('2026-10-05T09:03:00Z');
const A = 'aaaaaaaa-0000-0000-0000-000000000001';
const B = 'aaaaaaaa-0000-0000-0000-000000000002';

const row = (id: string, name: string) => ({
  id,
  visitor_name: name,
  visitor_locale: 'en',
  visitor_email: null,
  visitor_messenger_channel: 'whatsapp',
  visitor_messenger_handle: '+65 9123 4567',
  awaiting_since: '2026-10-05T00:26:00Z',
  followup_digest_at: null,
  slack_mode: 'room',
  slack_channel_id: id === A ? 'C0ROOMA' : 'C0ROOMB',
});

function useAdmin(extra: (op: FakeOp) => FakeResult | undefined) {
  const admin = fakeAdmin((op) => {
    const custom = extra(op);
    if (custom) return custom;
    if (op.table === 'chat_sessions' && op.op === 'select') return { data: [row(A, 'Emma'), row(B, 'Yuki')] };
    if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: 'x' }] };
    return { data: null };
  });
  adminMock.mockReturnValue(admin as never);
  return admin;
}
const isMarkQuery = (op: FakeOp) =>
  op.table === 'chat_sessions' && op.op === 'select' && op.columns === 'id, ai_handoff_at, staff_engaged_at';
const lines = () => String(postMock.mock.calls[0][0].text).split('\n');

beforeEach(() => {
  delete process.env.CHAT_BUSINESS_HOURS_JSON;
  delete process.env.CHAT_CLOSED_DATES;
  delete process.env.CHAT_FOLLOWUP;
  _resetBusinessHoursForTesting();
  process.env.SLACK_BOT_TOKEN = 'xoxb-test';
  process.env.SLACK_CHANNEL_ID = 'C0FEED';
  adminMock.mockReset();
  postMock.mockReset();
  postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0FEED' });
  vi.mocked(loadStaffDirectory).mockResolvedValue(parseStaffDirectory('U0AAA:이정현'));
});
afterEach(() => {
  delete process.env.SLACK_BOT_TOKEN;
  delete process.env.SLACK_CHANNEL_ID;
  _resetBusinessHoursForTesting();
  vi.restoreAllMocks();
});

describe('runFollowupDigest — AI 응대의 표시', () => {
  it('가예약을 받은 손님은 줄 끝에 가예약 날짜, 직원 확인 필요가 걸린 손님은 🙋', async () => {
    const admin = useAdmin((op) => {
      if (op.table === 'chat_bookings') {
        return { data: [{ session_id: A, visit_date: '2026-10-14', visit_time: '14:00', time_note: null }] };
      }
      if (isMarkQuery(op)) {
        return {
          data: [
            { id: A, ai_handoff_at: null, staff_engaged_at: null },
            { id: B, ai_handoff_at: '2026-10-05T08:00:00Z', staff_engaged_at: null },
          ],
        };
      }
      return undefined;
    });
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 2 });
    expect(lines()[1]).toBe('• 🇬🇧 Emma · WhatsApp · 10/05(월) 09:26 문의 · 🗓 10/14(수) 14:00 · <#C0ROOMA>');
    expect(lines()[2]).toBe('• 🇬🇧 Yuki · WhatsApp · 10/05(월) 09:26 문의 · 🙋 · <#C0ROOMB>');

    const bookingQuery = admin.ops.find((o) => o.table === 'chat_bookings')!;
    expect(hasFilter(bookingQuery, 'status', 'requested')).toBe(true);
    expect(bookingQuery.filters).toContainEqual(['session_id', 'in', [A, B]]);
  });

  it('정확한 시각 없이 받은 가예약은 시간 메모를 쓴다', async () => {
    useAdmin((op) =>
      op.table === 'chat_bookings'
        ? { data: [{ session_id: B, visit_date: '2026-10-20', visit_time: null, time_note: 'morning' }] }
        : undefined
    );
    await runFollowupDigest(NOW);
    expect(lines()[2]).toContain('· 🗓 10/20(화) morning · <#C0ROOMB>');
    expect(lines()[1]).not.toContain('🗓');
  });

  it('직원이 이미 맡은 대화에는 🙋 를 붙이지 않는다 (AI가 넘긴 질문에 직원이 답을 시작했다)', async () => {
    useAdmin((op) =>
      isMarkQuery(op)
        ? { data: [{ id: B, ai_handoff_at: '2026-10-05T08:00:00Z', staff_engaged_at: '2026-10-05T08:10:00Z' }] }
        : undefined
    );
    await runFollowupDigest(NOW);
    expect(lines()[2]).toBe('• 🇬🇧 Yuki · WhatsApp · 10/05(월) 09:26 문의 · <#C0ROOMB>');
  });

  it('표시를 읽지 못해도(043 미적용) 요약은 지금 모양대로 나간다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAdmin((op) => (op.table === 'chat_bookings' || isMarkQuery(op) ? { error: { code: '42P01' } } : undefined));
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 2 });
    expect(lines()[1]).toBe('• 🇬🇧 Emma · WhatsApp · 10/05(월) 09:26 문의 · <#C0ROOMA>');
    expect(warn).toHaveBeenCalled();
  });
});
