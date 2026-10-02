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

vi.mock('../slackRooms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slackRooms')>()),
  ensureRoom: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { fetchThreadParent, getBotUserId, postSlackMessage } from '../slack';
import { ensureRoom } from '../slackRooms';
import { translate } from '../translation';
import {
  relayChatMessageToSlack,
  relayContactToSlack,
  relayEventHintNoteToSlack,
  relayMessengerClickToSlack,
  relaySlackReplyToVisitor,
  resolveTarget,
} from '../slackRelay';
import { ROOM_EMAIL_CONTACT_NOTE } from '../slackText';
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

// ── "연락처 먼저" 1단계 (스펙 2026-10-01) ───────────────────────────────────

const SESSION_ID = '5b0c7c1a-07c0-49bc-91da-2f556884b769';
const ROOM_ROW = {
  id: SESSION_ID,
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
const THREAD_TS = '1788966626.694829';
const THREAD_ROW = { ...ROOM_ROW, slack_mode: 'thread', slack_channel_id: 'C0FEED', slack_thread_ts: THREAD_TS };
const UNASSIGNED_ROW = { ...ROOM_ROW, slack_mode: null, slack_channel_id: null };

function setSlackEnv() {
  process.env.SLACK_BOT_TOKEN = 'xoxb-test';
  process.env.SLACK_CHANNEL_ID = 'C0FEED';
}
function clearSlackEnv() {
  delete process.env.SLACK_BOT_TOKEN;
  delete process.env.SLACK_CHANNEL_ID;
  delete process.env.CHAT_FOLLOWUP;
  delete process.env.NEXT_PUBLIC_SITE_URL;
}

describe('relaySlackReplyToVisitor — 연락 수단이 있는 손님의 방에 번역본 게시', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);
  const parentMock = vi.mocked(fetchThreadParent);
  const translateMock = vi.mocked(translate);

  type Means = { visitor_email: string | null; visitor_messenger_handle: string | null; visitor_messenger_clicked: string | null };
  const NONE: Means = { visitor_email: null, visitor_messenger_handle: null, visitor_messenger_clicked: null };

  /** 연락 수단 조회(visitor_messenger_clicked 를 읽는 조회)만 따로 답하는 가짜 DB. */
  function adminFor(means: Means | 'lookup_error', row: typeof ROOM_ROW | typeof THREAD_ROW = ROOM_ROW) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') {
        if (op.columns?.includes('visitor_messenger_clicked')) {
          return means === 'lookup_error' ? { error: { code: '42703' } } : { data: means };
        }
        if (hasFilter(op, 'slack_channel_id', 'C0ROOM')) return { data: row.slack_mode === 'room' ? row : null };
        if (hasFilter(op, 'slack_thread_ts', THREAD_TS)) return { data: row.slack_mode === 'thread' ? row : null };
        return { data: null };
      }
      if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-new' } };
      if (op.op === 'update') return { data: [{ id: row.id }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const ROOM_REPLY = {
    channel: 'C0ROOM',
    slackTs: '3.0',
    threadTs: null,
    isTopLevel: true,
    isBroadcast: false,
    text: '안녕하세요, 100만원입니다.',
    slackUserId: 'U0AAA',
  };
  const FEED_REPLY = { ...ROOM_REPLY, channel: 'C0FEED', slackTs: '1788999999.000100', threadTs: THREAD_TS, isTopLevel: false };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    parentMock.mockReset();
    vi.mocked(getBotUserId).mockReset();
    vi.mocked(getBotUserId).mockResolvedValue('U0BOT');
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('이메일을 남긴 손님의 방: 전달 뒤 번역문만 담은 글을 한 번 올린다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({ text: '翻译', channelId: 'C0ROOM' });
  });

  it('메신저 연락처를 남겼거나 카드 단추만 누른 손님도 대상이다', async () => {
    adminFor({ ...NONE, visitor_messenger_handle: 'liwei88' });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    expect(postMock).toHaveBeenCalledTimes(1);

    postMock.mockClear();
    adminFor({ ...NONE, visitor_messenger_clicked: 'whatsapp' });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('연락 수단이 없는 손님의 방에는 올리지 않는다', async () => {
    adminFor(NONE);
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('번역이 실패했으면 올리지 않는다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    translateMock.mockResolvedValueOnce({ status: 'failed', text: ROOM_REPLY.text, latencyMs: 1, errorCode: 'api_error' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('번역이 생략됐거나(이모지·URL만) 번역문이 원문과 같으면 올리지 않는다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    translateMock.mockResolvedValueOnce({ status: 'skipped', text: ROOM_REPLY.text, latencyMs: 0 });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    translateMock.mockResolvedValueOnce({ status: 'success', text: ` ${ROOM_REPLY.text} `, latencyMs: 1 });
    await relaySlackReplyToVisitor(ROOM_REPLY);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('스레드 모드 세션에는 올리지 않는다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' }, THREAD_ROW);
    expect(await relaySlackReplyToVisitor(FEED_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('CHAT_FOLLOWUP=off 면 올리지 않는다 (연락 수단 조회도 하지 않는다)', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    const admin = adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
    expect(admin.ops.some((o) => o.columns?.includes('visitor_messenger_clicked'))).toBe(false);
  });

  it('연락 수단 조회가 실패해도(042 미적용) 답글 전달은 delivered', async () => {
    adminFor('lookup_error');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).not.toHaveBeenCalled();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('contact means lookup failed'))).toBe(true);
    warn.mockRestore();
  });

  it('번역본 게시가 실패해도 delivered', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    postMock.mockResolvedValue({ ok: false, error: 'is_archived' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('translation copy failed'))).toBe(true);
    warn.mockRestore();
  });

  it('피드 스레드 답장은 방 복사 뒤에 번역본을 올린다', async () => {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select') {
        if (op.columns?.includes('visitor_messenger_clicked')) {
          return { data: { ...NONE, visitor_messenger_handle: 'liwei88' } };
        }
        if (hasFilter(op, 'slack_channel_id', 'C0ROOM')) return { data: ROOM_ROW };
        return { data: null };
      }
      if (op.table === 'chat_messages' && op.op === 'insert') return { data: { id: 'm-new' } };
      if (op.op === 'update') return { data: [{ id: SESSION_ID }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    parentMock.mockResolvedValue({
      ok: true,
      data: { text: '🔴 새 문의 · <#C0ROOM>', botId: 'B1', userId: 'U0BOT' },
    });

    expect(await relaySlackReplyToVisitor(FEED_REPLY)).toBe('delivered');
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][0].text).toContain('피드에서 답함');
    expect(postMock.mock.calls[1][0]).toEqual({ text: '翻译', channelId: 'C0ROOM' });
  });
});

describe('relayContactToSlack — 연락처 알림', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) =>
      op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID) ? { data: row } : { data: null }
    );
    adminMock.mockReturnValue(admin as never);
  }

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('방: 분류 안내가 담긴 글을 방에, 피드에 "연락처 남김" 한 줄', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(2);
    const room = postMock.mock.calls[0][0];
    expect(room.channelId).toBe('C0ROOM');
    expect(room.text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com');
    expect(room.text).toContain("'오늘 연락할 손님'으로 분류했습니다");
    expect(room.text).toContain('번역본이 올라옵니다');
    const feed = postMock.mock.calls[1][0];
    expect(feed.channelId).toBe('C0FEED');
    expect(feed.text.startsWith('📋 연락처 남김 · 🇨🇳 익명 · 이메일 · <#C0ROOM> · ')).toBe(true);
  });

  it('메신저 채널은 브랜드명으로 적는다', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'wechat', handle: 'liwei88' });
    expect(postMock.mock.calls[0][0].text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
  });

  it('스레드: 대표 스레드에 올리고 번역본 안내와 피드 줄은 없다', async () => {
    adminFor(THREAD_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'whatsapp', handle: '+82 10-1234-5678' });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });
    expect(postMock.mock.calls[0][0].text).not.toContain('번역본');
    expect(postMock.mock.calls[0][0].text).toContain('이 스레드에 답글을 쓰면 목록에서 빠집니다');
  });

  it('방도 스레드도 없으면 관리자 화면 링크를 붙여 단독 게시한다', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net';
    adminFor(UNASSIGNED_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].threadTs).toBeUndefined();
    expect(postMock.mock.calls[0][0].text).toContain(`🔗 <https://liv-clinic.net/admin/chat/${SESSION_ID}|관리자 화면에서 열기>`);
  });

  it('CHAT_FOLLOWUP=off 면 분류 안내 대신 연락 요청만 남긴다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
    expect(postMock.mock.calls[0][0].text).toBe(
      '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com\n_이 연락처로 먼저 연락해 주세요._'
    );
  });

  it('Slack 설정이 없으면 아무것도 하지 않는다', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('relayMessengerClickToSlack · relayEventHintNoteToSlack — 방에 한 줄', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) =>
      op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID) ? { data: row } : { data: null }
    );
    adminMock.mockReturnValue(admin as never);
  }

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('단추 클릭: 방에 📲 한 줄 (번역본 안내 포함)', async () => {
    adminFor(ROOM_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'whatsapp' });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].channelId).toBe('C0ROOM');
    expect(postMock.mock.calls[0][0].text).toBe(
      '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #5B0C7C1A 가 담긴 메시지를 확인해 주세요. 이 방에 답을 쓰면 번역본이 아래에 올라옵니다.'
    );
  });

  it('단추 클릭: 스레드 모드는 스레드에, 번역본 안내 없이', async () => {
    adminFor(THREAD_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'line' });
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });
    expect(postMock.mock.calls[0][0].text).not.toContain('번역본');
  });

  it('단추 클릭: 방도 스레드도 없으면 올리지 않는다', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'email' });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('이벤트 안내: 방에 🎁 한 줄과 링크', async () => {
    adminFor(ROOM_ROW);
    const url = 'https://liv-clinic.net/zh/events/2026-10-promotion';
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: `🎁 _가격 문의로 보여 손님에게 이벤트 링크를 자동으로 보냈습니다. 가격은 직접 답해 주세요._\n${url}`,
      channelId: 'C0ROOM',
    });
  });

  it('이벤트 안내: 스레드 모드는 스레드에, 방도 스레드도 없으면 올리지 않는다', async () => {
    adminFor(THREAD_ROW);
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url: 'https://liv-clinic.net/en/events' });
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });

    postMock.mockClear();
    adminFor(UNASSIGNED_ROW);
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url: 'https://liv-clinic.net/en/events' });
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('relayChatMessageToSlack — 방 첫 메시지의 연락처 꼬리말', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);
  const ensureRoomMock = vi.mocked(ensureRoom);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID)) return { data: row };
      if (op.op === 'update') return { data: [{ id: SESSION_ID }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
  }

  const FIRST = {
    sessionId: SESSION_ID,
    messageId: 'm-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    receivedAt: '2026-10-05T03:00:00Z',
  };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0NEW' });
    ensureRoomMock.mockReset();
    ensureRoomMock.mockResolvedValue({ mode: 'room', channelId: 'C0NEW', created: true });
  });
  afterEach(clearSlackEnv);

  it('시작 화면에서 이메일을 넣은 손님: 첫 메시지 끝에 꼬리말이 붙는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].channelId).toBe('C0NEW');
    expect(postMock.mock.calls[0][0].text.endsWith(ROOM_EMAIL_CONTACT_NOTE)).toBe(true);
  });

  it('이메일이 없는 손님에게는 붙지 않는다', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
  });

  it('이 글에서 방금 이메일이 저장됐으면(📱 알림이 뒤따른다) 붙이지 않는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack({ ...FIRST, contactJustSaved: true });
    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
  });

  it('CHAT_FOLLOWUP=off 면 붙이지 않는다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].text).not.toContain('이메일을 남긴 손님입니다');
  });

  it('첫 글의 시각을 방 만들기에 넘긴다 (방 이름의 날짜가 된다)', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(ensureRoomMock).toHaveBeenCalledTimes(1);
    expect(ensureRoomMock.mock.calls[0][2]).toBe(FIRST.receivedAt);
  });
});
