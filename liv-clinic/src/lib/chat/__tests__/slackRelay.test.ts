import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('../broadcast', () => ({ broadcastToSession: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../translation', () => ({
  translate: vi.fn().mockResolvedValue({ status: 'success', text: '翻译', latencyMs: 1 }),
}));
vi.mock('../slackStaff', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../slackStaff')>();
  return {
    ...actual,
    loadStaffDirectory: vi.fn(async () => actual.parseStaffDirectory('U0AAA:이정현', 'U0OBS:이재호')),
    resolveStaffLabel: vi.fn(async (id: string | null) => (id === 'U0AAA' ? '이정현' : actual.UNKNOWN_STAFF_LABEL)),
  };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  fetchThreadParent: vi.fn(),
  postSlackMessage: vi.fn(),
  getBotUserId: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { fetchThreadParent, getBotUserId, postSlackMessage } from '../slack';
import { relaySlackReplyToVisitor, resolveTarget } from '../slackRelay';
import { fakeAdmin, hasFilter, type FakeOp } from './fakeAdmin';

describe('resolveTarget', () => {
  it('room 모드 + 채널 → room', () => {
    expect(resolveTarget({ slack_mode: 'room', slack_channel_id: 'C9', slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'room',
      channelId: 'C9',
    });
  });
  it('room 선점만 되고 채널이 아직 없으면 unassigned (경합 폴링 대상)', () => {
    expect(resolveTarget({ slack_mode: 'room', slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'unassigned',
    });
  });
  it('thread 모드는 저장된 채널과 thread_ts를 쓴다', () => {
    expect(resolveTarget({ slack_mode: 'thread', slack_channel_id: 'C0OLD', slack_thread_ts: '1.0' }, 'C0FEED')).toEqual({
      mode: 'thread',
      channelId: 'C0OLD',
      threadTs: '1.0',
    });
  });
  it('thread 모드인데 채널이 비어 있으면 피드 채널', () => {
    expect(resolveTarget({ slack_mode: 'thread', slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'thread',
      channelId: 'C0FEED',
      threadTs: null,
    });
  });
  it('모드가 없으면 unassigned', () => {
    expect(resolveTarget({ slack_mode: null, slack_channel_id: null, slack_thread_ts: null }, 'C0FEED')).toEqual({
      mode: 'unassigned',
    });
  });
});

describe('relaySlackReplyToVisitor — #해외문의 피드 줄 스레드 답장', () => {
  const ROOM_SESSION = {
    id: '5b0c7c1a-07c0-49bc-91da-2f556884b769',
    visitor_name: null,
    visitor_email: null,
    visitor_locale: 'zh',
    status: 'open',
    slack_mode: 'room',
    slack_channel_id: 'C0ROOM',
    slack_thread_ts: null,
    assigned_slack_user_id: null,
    assigned_label: null,
    resolved_at: null,
  };

  const parentMock = vi.mocked(fetchThreadParent);
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);
  const botMock = vi.mocked(getBotUserId);

  /** 기본 DB: 세션 스레드/메시지 ts로는 못 찾고, 방 채널 C0ROOM으로는 찾는다. */
  function defaultHandler(op: FakeOp) {
    if (op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'slack_channel_id', 'C0ROOM')) {
      return { data: ROOM_SESSION };
    }
    if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-new' } };
    if (op.op === 'update') return { data: [{ id: ROOM_SESSION.id }] };
    return { data: null };
  }

  const INBOUND = {
    channel: 'C0FEED',
    slackTs: '1788999999.000100',
    threadTs: '1788966626.694829',
    isTopLevel: false,
    isBroadcast: false,
    text: '안녕하세요~ 리브성형외과입니다.',
    slackUserId: 'U0AAA',
  };

  beforeEach(() => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    parentMock.mockReset();
    postMock.mockReset();
    botMock.mockReset();
    botMock.mockResolvedValue('U0BOT');
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });

  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
  });

  it('부모 피드 줄의 <#채널>로 방 세션을 찾아 전달하고 방에 복사한다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔴 *새 문의* · 익명 · <#C0ROOM> · 09/10(목) 00:10 KST', botId: 'B1', userId: 'U0BOT' },
    });

    const outcome = await relaySlackReplyToVisitor(INBOUND);

    expect(outcome).toBe('delivered');
    expect(parentMock).toHaveBeenCalledWith('C0FEED', INBOUND.threadTs);
    const insert = admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'insert');
    expect(insert?.payload).toMatchObject({
      session_id: ROOM_SESSION.id,
      sender: 'operator',
      source: 'slack',
      slack_user_id: 'U0AAA',
      sender_label: '이정현',
      original_text: INBOUND.text,
      translated_text: '翻译',
    });
    const assign = admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update');
    expect(assign?.payload).toMatchObject({ assigned_slack_user_id: 'U0AAA', assigned_label: '이정현' });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM' });
    expect(postMock.mock.calls[0][0].text).toContain('피드에서 답함 · 이정현');
    expect(postMock.mock.calls[0][0].text).toContain(INBOUND.text);
  });

  it('부모에 채널 링크가 없으면 session_not_found, 저장하지 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '새 채팅 문의 — 익명 (en)', botId: 'B1', userId: 'U0BOT' },
    });

    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
    expect(admin.ops.some((o) => o.op === 'insert')).toBe(false);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('부모가 봇 메시지가 아니면 session_not_found', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({ ok: true, data: { text: '<#C0ROOM> 여기 봐주세요', botId: null, userId: null } });
    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
  });

  it('부모가 다른 봇/앱의 메시지면(우리 봇 user_id와 불일치) session_not_found, 저장하지 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B9', userId: 'U0OTHER' },
    });
    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
    expect(admin.ops.some((o) => o.op === 'insert')).toBe(false);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('auth.test가 실패(null)해도 기존 botId 존재 여부로 폴백해 정상 전달한다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    botMock.mockResolvedValue(null);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B1', userId: null },
    });
    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('delivered');
  });

  it('부모 조회가 실패해도 session_not_found (⚠️ 안내로 방에 쓰도록 유도)', async () => {
    adminMock.mockReturnValue(fakeAdmin(defaultHandler) as never);
    parentMock.mockResolvedValue({ ok: false, error: 'ratelimited' });
    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('session_not_found');
  });

  it('방 복사가 실패해도 손님 전달은 delivered', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔔 다시 열림 · <#C0ROOM|chat-zh-5b0c7c>', botId: 'B1', userId: 'U0BOT' },
    });
    postMock.mockResolvedValue({ ok: false, error: 'is_archived' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await relaySlackReplyToVisitor(INBOUND)).toBe('delivered');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('feed reply mirror failed'))).toBe(true);
    warn.mockRestore();
  });

  it('관찰자의 피드 답장도 전달되지만 담당자가 되지는 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B1', userId: 'U0BOT' },
    });

    expect(await relaySlackReplyToVisitor({ ...INBOUND, slackUserId: 'U0OBS' })).toBe('delivered');
    expect(admin.ops.some((o) => o.table === 'chat_sessions' && o.op === 'update')).toBe(false);
  });

  it('방 본문 답장(기존 경로)은 부모를 조회하지 않고 복사도 하지 않는다', async () => {
    const admin = fakeAdmin(defaultHandler);
    adminMock.mockReturnValue(admin as never);

    const outcome = await relaySlackReplyToVisitor({
      channel: 'C0ROOM',
      slackTs: '3.0',
      threadTs: null,
      isTopLevel: true,
      isBroadcast: false,
      text: '방에서 답',
      slackUserId: 'U0AAA',
    });
    expect(outcome).toBe('delivered');
    expect(parentMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
  });
});
