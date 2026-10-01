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

import { createChatAdminClient } from '../db';
import { postSlackMessage } from '../slack';
import { loadStaffDirectory, parseStaffDirectory } from '../slackStaff';
import { _resetBusinessHoursForTesting, getBusinessHoursConfig } from '../businessHours';
import { digestWindow, isFollowupDue, runFollowupDigest } from '../followupDigest';
import { fakeAdmin, hasFilter, type FakeOp, type FakeResult } from './fakeAdmin';

function resetHours() {
  delete process.env.CHAT_BUSINESS_HOURS_JSON;
  delete process.env.CHAT_CLOSED_DATES;
  _resetBusinessHoursForTesting();
}

describe('isFollowupDue — 오늘 연락할 손님', () => {
  const base = {
    status: 'open',
    resolved_at: null,
    awaiting_since: '2026-10-05T02:00:00Z',
    visitor_email: 'guest@example.com',
    visitor_messenger_handle: null,
  };
  it('열려 있고, 답을 기다리는 중이고, 연락처가 있으면 해당한다', () => {
    expect(isFollowupDue(base)).toBe(true);
    expect(isFollowupDue({ ...base, visitor_email: null, visitor_messenger_handle: 'liwei88' })).toBe(true);
  });
  it('연락처가 없으면 아니다', () => {
    expect(isFollowupDue({ ...base, visitor_email: null })).toBe(false);
  });
  it('직원이 답했으면(awaiting_since 없음) 아니다', () => {
    expect(isFollowupDue({ ...base, awaiting_since: null })).toBe(false);
  });
  it('완료했거나 종료된 상담은 아니다', () => {
    expect(isFollowupDue({ ...base, resolved_at: '2026-10-05T02:30:00Z' })).toBe(false);
    expect(isFollowupDue({ ...base, status: 'closed' })).toBe(false);
  });
});

describe('digestWindow — 하루 두 번 요약 창', () => {
  beforeEach(resetHours);
  afterEach(resetHours);
  const hours = () => getBusinessHoursConfig();

  it('평일 영업 시작 10:00~10:08 (KST)', () => {
    // 2026-10-05(월) 10:00 KST = 01:00 UTC
    expect(digestWindow(new Date('2026-10-05T01:00:00Z'), hours())).toEqual({
      kind: 'open',
      startsAt: new Date('2026-10-05T01:00:00Z'),
    });
    expect(digestWindow(new Date('2026-10-05T01:08:59Z'), hours())?.kind).toBe('open');
    expect(digestWindow(new Date('2026-10-05T01:09:00Z'), hours())).toBeNull();
    expect(digestWindow(new Date('2026-10-05T00:59:59Z'), hours())).toBeNull();
  });

  it('평일 마감 60분 전 18:00~18:08', () => {
    expect(digestWindow(new Date('2026-10-05T09:00:00Z'), hours())).toEqual({
      kind: 'closing',
      startsAt: new Date('2026-10-05T09:00:00Z'),
    });
    expect(digestWindow(new Date('2026-10-05T09:06:00Z'), hours())?.startsAt.toISOString()).toBe(
      '2026-10-05T09:00:00.000Z'
    );
    expect(digestWindow(new Date('2026-10-05T09:09:00Z'), hours())).toBeNull();
  });

  it('토요일은 15:00 (16시 마감 60분 전)', () => {
    // 2026-10-10(토) 15:00 KST = 06:00 UTC
    expect(digestWindow(new Date('2026-10-10T06:00:00Z'), hours())).toEqual({
      kind: 'closing',
      startsAt: new Date('2026-10-10T06:00:00Z'),
    });
    expect(digestWindow(new Date('2026-10-10T09:00:00Z'), hours())).toBeNull(); // 토요일 18:00 — 평일 시각은 아니다
  });

  it('창 밖과 휴무일(일요일)은 null', () => {
    expect(digestWindow(new Date('2026-10-05T03:00:00Z'), hours())).toBeNull(); // 월 12:00
    expect(digestWindow(new Date('2026-10-11T01:00:00Z'), hours())).toBeNull(); // 일 10:00
  });

  it('영업시간 설정을 바꾸면 창도 따라간다', () => {
    process.env.CHAT_BUSINESS_HOURS_JSON = JSON.stringify({ weekday: ['09:30', '18:30'] });
    _resetBusinessHoursForTesting();
    // 09:30 KST = 00:30 UTC, 17:30 KST = 08:30 UTC
    expect(digestWindow(new Date('2026-10-05T00:30:00Z'), hours())?.kind).toBe('open');
    expect(digestWindow(new Date('2026-10-05T08:30:00Z'), hours())?.kind).toBe('closing');
    expect(digestWindow(new Date('2026-10-05T01:00:00Z'), hours())).toBeNull();
  });

  it('영업시간이 60분보다 짧은 날에는 마감 전 요약이 없다', () => {
    const short = { weekday: ['10:00', '10:30'] as [string, string], saturday: null, sunday: null };
    expect(digestWindow(new Date('2026-10-05T01:00:00Z'), short)?.kind).toBe('open');
    expect(digestWindow(new Date('2026-10-05T00:30:00Z'), short)).toBeNull();
  });
});

describe('runFollowupDigest', () => {
  const adminMock = vi.mocked(createChatAdminClient);
  const postMock = vi.mocked(postSlackMessage);
  const staffMock = vi.mocked(loadStaffDirectory);

  // 2026-10-05(월) 18:03 KST — 마감 60분 전 창(18:00 시작) 안
  const NOW = new Date('2026-10-05T09:03:00Z');
  const WINDOW_START = '2026-10-05T09:00:00.000Z';

  const row = (over: Record<string, unknown> = {}) => ({
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    visitor_name: 'Li Wei',
    visitor_locale: 'zh',
    visitor_email: null,
    visitor_messenger_channel: 'wechat',
    visitor_messenger_handle: 'liwei88',
    awaiting_since: '2026-10-05T00:26:00Z',
    followup_digest_at: null,
    slack_mode: 'room',
    slack_channel_id: 'C0ROOM1',
    ...over,
  });

  function adminWith(rows: unknown[], claim: (op: FakeOp) => FakeResult = () => ({ data: [{ id: 'x' }] })) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: rows };
      if (op.table === 'chat_sessions' && op.op === 'update') return claim(op);
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  beforeEach(() => {
    resetHours();
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    adminMock.mockReset();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0FEED' });
    staffMock.mockReset();
    staffMock.mockResolvedValue(parseStaffDirectory('U0AAA:이정현,U0BBB:방애금'));
  });
  afterEach(() => {
    resetHours();
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.CHAT_FOLLOWUP;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('창 안이면 대상 손님을 한 번에 모아 #해외문의에 올린다', async () => {
    const admin = adminWith([
      row(),
      row({
        id: 'aaaaaaaa-0000-0000-0000-000000000002',
        visitor_name: null,
        visitor_locale: 'en',
        visitor_email: 'guest@example.com',
        visitor_messenger_channel: null,
        visitor_messenger_handle: null,
        awaiting_since: '2026-10-05T05:03:00Z',
        slack_channel_id: 'C0ROOM2',
      }),
    ]);

    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 2 });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].channelId).toBeUndefined(); // 기본 채널 = #해외문의
    expect(postMock.mock.calls[0][0].text).toBe(
      '📋 *오늘 연락할 손님 2명* <@U0AAA> <@U0BBB>\n' +
        '• 🇨🇳 Li Wei · WeChat · 10/05(월) 09:26 문의 · <#C0ROOM1>\n' +
        '• 🇬🇧 익명 · 이메일 · 10/05(월) 14:03 문의 · <#C0ROOM2>\n' +
        '_방에 답을 쓰거나 방을 보관(완료)하면 목록에서 빠집니다._'
    );
    const claims = admin.ops.filter((o) => o.op === 'update');
    expect(claims).toHaveLength(2);
    expect(claims[0].payload).toEqual({ followup_digest_at: NOW.toISOString() });
    expect(claims[0].filters).toContainEqual(['followup_digest_at', 'is', null]);
  });

  it('대상 조회 조건: 열림·미완료·기다리는 중·연락처 있음·최근 7일', async () => {
    const admin = adminWith([]);
    await runFollowupDigest(NOW);
    const q = admin.ops.find((o) => o.op === 'select') as FakeOp;
    expect(hasFilter(q, 'status', 'open')).toBe(true);
    expect(q.filters).toContainEqual(['resolved_at', 'is', null]);
    expect(q.filters).toContainEqual(['awaiting_since', 'not.is', null]);
    expect(q.filters).toContainEqual(['awaiting_since', 'gte', '2026-09-28T09:03:00.000Z']);
    expect(q.filters).toContainEqual(['', 'or', 'visitor_email.not.is.null,visitor_messenger_handle.not.is.null']);
  });

  it('0명이면 게시하지 않는다', async () => {
    adminWith([]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 0 });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('이 창에서 이미 오른 손님은 다시 올리지 않고, 지난 창에서 오른 손님은 다시 올린다', async () => {
    const admin = adminWith([
      row({ followup_digest_at: '2026-10-05T09:00:30Z' }), // 이번 창(18:00~)에서 이미 올랐다
      row({ id: 'aaaaaaaa-0000-0000-0000-000000000002', visitor_name: 'Aya', followup_digest_at: '2026-10-05T01:02:00Z' }), // 아침 창
    ]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 1 });
    const claims = admin.ops.filter((o) => o.op === 'update');
    expect(claims).toHaveLength(1);
    expect(claims[0].filters).toContainEqual(['followup_digest_at', 'eq', '2026-10-05T01:02:00Z']);
    expect(postMock.mock.calls[0][0].text).toContain('Aya');
    expect(postMock.mock.calls[0][0].text).not.toContain('Li Wei');
    expect(Date.parse('2026-10-05T09:00:30Z')).toBeGreaterThan(Date.parse(WINDOW_START));
  });

  it('선점된 세션만 게시한다 (겹쳐 돈 크론이 먼저 가져간 손님은 뺀다)', async () => {
    adminWith(
      [row(), row({ id: 'aaaaaaaa-0000-0000-0000-000000000002', visitor_name: 'Aya' })],
      (op) => (hasFilter(op, 'id', 'aaaaaaaa-0000-0000-0000-000000000001') ? { data: [] } : { data: [{ id: 'x' }] })
    );
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 1 });
    expect(postMock.mock.calls[0][0].text.split('\n')[0]).toBe('📋 *오늘 연락할 손님 1명* <@U0AAA> <@U0BBB>');
    expect(postMock.mock.calls[0][0].text).toContain('Aya');
  });

  it('방이 없는 손님(스레드 방식)은 관리자 화면 링크', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net';
    adminWith([row({ slack_mode: 'thread', slack_channel_id: 'C0FEED' })]);
    await runFollowupDigest(NOW);
    expect(postMock.mock.calls[0][0].text).toContain(
      '<https://liv-clinic.net/admin/chat/aaaaaaaa-0000-0000-0000-000000000001|관리자 화면>'
    );
  });

  it('메신저와 이메일을 둘 다 남겼으면 둘 다 적는다', async () => {
    adminWith([row({ visitor_email: 'liwei@example.com' })]);
    await runFollowupDigest(NOW);
    expect(postMock.mock.calls[0][0].text).toContain('• 🇨🇳 Li Wei · WeChat, 이메일 · ');
  });

  it('창 밖이면 조회하지 않는다', async () => {
    const admin = adminWith([row()]);
    // 2026-10-05(월) 12:00 KST
    expect(await runFollowupDigest(new Date('2026-10-05T03:00:00Z'))).toEqual({ window: null, listed: 0 });
    expect(admin.ops).toHaveLength(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('CHAT_FOLLOWUP=off 면 아무것도 하지 않는다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    const admin = adminWith([row()]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: null, listed: 0 });
    expect(admin.ops).toHaveLength(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('답변 직원이 없으면 게시하지 않는다 (선점도 하지 않는다)', async () => {
    staffMock.mockResolvedValue(parseStaffDirectory(''));
    const admin = adminWith([row()]);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 0 });
    expect(admin.ops).toHaveLength(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('조회가 실패하면(042 미적용 등) 경고만 남긴다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = fakeAdmin(() => ({ error: { code: '42703' } }));
    adminMock.mockReturnValue(admin as never);
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 0 });
    expect(postMock).not.toHaveBeenCalled();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('followup digest query failed'))).toBe(true);
    warn.mockRestore();
  });

  it('게시가 실패해도 throw 하지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    adminWith([row()]);
    postMock.mockResolvedValue({ ok: false, error: 'channel_not_found' });
    expect(await runFollowupDigest(NOW)).toEqual({ window: 'closing', listed: 1 });
    warn.mockRestore();
  });
});
