import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../slackStaff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../slackStaff')>();
  return {
    ...actual,
    loadStaffDirectory: vi.fn(async () => actual.parseStaffDirectory('U0AAA:이정현')),
  };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  postSlackMessage: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { postSlackMessage } from '../slack';
import { runEscalations } from '../escalationRunner';
import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';

describe('runEscalations — 연락처를 남긴 손님은 재촉 알림에서 뺀다', () => {
  const adminMock = vi.mocked(createChatAdminClient);
  const postMock = vi.mocked(postSlackMessage);
  // 2026-10-05(월) 12:00 KST
  const NOW = new Date('2026-10-05T03:00:00Z');

  const WAITING = {
    id: '5b0c7c1a-07c0-49bc-91da-2f556884b769',
    visitor_name: null,
    visitor_email: null,
    visitor_locale: 'en',
    status: 'open',
    slack_mode: 'room',
    slack_channel_id: 'C0ROOM',
    slack_thread_ts: null,
    assigned_slack_user_id: null,
    assigned_label: null,
    resolved_at: null,
    awaiting_since: '2026-10-05T02:54:00Z', // 6분째
    escalation_level: 0,
  };

  function adminWith(rows: unknown[]) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: rows };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: WAITING.id }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const candidateQuery = (admin: ReturnType<typeof fakeAdmin>) =>
    admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'select') as FakeOp;

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.CHAT_ESCALATION_MINUTES;
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.CHAT_FOLLOWUP;
  });

  it('후보 조회에 연락처 NULL 조건 두 개가 붙는다', async () => {
    const admin = adminWith([]);
    await runEscalations(NOW);
    const q = candidateQuery(admin);
    expect(q.filters).toContainEqual(['visitor_email', 'is', null]);
    expect(q.filters).toContainEqual(['visitor_messenger_handle', 'is', null]);
    // 기존 조건은 그대로다
    expect(hasFilter(q, 'status', 'open')).toBe(true);
    expect(q.filters).toContainEqual(['resolved_at', 'is', null]);
    expect(q.filters).toContainEqual(['escalation_level', 'lt', 3]);
  });

  it('CHAT_FOLLOWUP=off 면 연락처 조건이 없다 (예전처럼 모두에게 알린다)', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    const admin = adminWith([]);
    await runEscalations(NOW);
    const q = candidateQuery(admin);
    expect(q.filters.some(([c]) => c === 'visitor_email' || c === 'visitor_messenger_handle')).toBe(false);
    expect(hasFilter(q, 'status', 'open')).toBe(true);
  });

  it('회귀: 연락처가 없는 손님은 예전처럼 5분 알림이 방에 간다', async () => {
    adminWith([WAITING]);
    const result = await runEscalations(NOW);
    expect(result).toEqual({ checked: 1, escalated: 1 });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM' });
    expect(postMock.mock.calls[0][0].text).toBe('⏰ <@U0AAA> 5분째 답이 없습니다.');
  });
});
