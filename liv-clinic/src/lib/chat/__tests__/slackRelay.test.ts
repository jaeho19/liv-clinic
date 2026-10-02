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
  archiveChannel: vi.fn(),
  unarchiveChannel: vi.fn(),
}));

vi.mock('../slackRooms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slackRooms')>()),
  ensureRoom: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { archiveChannel, fetchThreadParent, getBotUserId, postSlackMessage, unarchiveChannel } from '../slack';
import { ensureRoom } from '../slackRooms';
import { translate } from '../translation';
import {
  notifyDeliveryFailure,
  postStyled,
  relayChatMessageToSlack,
  relayContactToSlack,
  relayEventHintNoteToSlack,
  relayMessengerClickToSlack,
  relaySlackReplyToVisitor,
  resolveTarget,
} from '../slackRelay';
import { BAR_COLOR } from '../slackLook';
import { buildRoomFirstText, ROOM_REOPENED_LEAD } from '../slackText';
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
    // 방에 남기는 사본은 작성자 이름표로 올라간다 (slack-room-look §3.4의 6번)
    expect(postMock.mock.calls[0][0]).toMatchObject({
      channelId: 'C0ROOM',
      username: '이정현 · 피드에서 답함',
      iconEmoji: ':leftwards_arrow_with_hook:',
      text: INBOUND.text,
    });
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
  delete process.env.SLACK_ROOM_LOOK;
}

/** 색 막대 알림 한 건의 색·큰 줄·설명 줄 (slack-room-look §3.3). */
function barOf(post: Parameters<typeof postSlackMessage>[0]) {
  const a = post.attachments![0];
  return {
    color: a.color,
    headline: (a.blocks[0].text as { text: string }).text,
    notes: a.blocks[1] ? (a.blocks[1].elements as Array<{ text: string }>).map((e) => e.text) : [],
  };
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

  // 번역본 글: 이름표는 붙지만 본문(text)은 번역문만이다 — 휴대폰의 "텍스트 복사"가 본문을 그대로 복사한다.
  const COPY_POST = { text: '翻译', username: '번역본 · 복사용', iconEmoji: ':clipboard:', channelId: 'C0ROOM' };

  it('이메일을 남긴 손님의 방: 전달 뒤 번역문만 담은 글을 한 번 올린다', async () => {
    adminFor({ ...NONE, visitor_email: 'guest@example.com' });
    expect(await relaySlackReplyToVisitor(ROOM_REPLY)).toBe('delivered');
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual(COPY_POST);
    expect(postMock.mock.calls[0][0].attachments).toBeUndefined();
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
    expect(postMock.mock.calls[0][0].username).toBe('이정현 · 피드에서 답함');
    expect(postMock.mock.calls[1][0]).toEqual(COPY_POST);
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

  it('방: LIV 알림의 초록 막대(큰 줄만)를 방에, 피드에 "연락처 남김" 한 줄', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(2);
    const room = postMock.mock.calls[0][0];
    expect(room).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', iconEmoji: ':bell:', text: '' });
    // 설명 줄 없이 큰 줄 하나 (slack-room-notice-trim)
    expect(barOf(room)).toEqual({
      color: BAR_COLOR.contact,
      headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com',
      notes: [],
    });
    const feed = postMock.mock.calls[1][0];
    expect(feed.channelId).toBe('C0FEED');
    expect(feed.text.startsWith('📋 연락처 남김 · 🇨🇳 익명 · 이메일 · <#C0ROOM> · ')).toBe(true);
    expect(feed.username).toBeUndefined();
  });

  it('메신저 채널은 브랜드명으로 적는다', async () => {
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'wechat', handle: 'liwei88' });
    expect(barOf(postMock.mock.calls[0][0]).headline).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
  });

  it('SLACK_ROOM_LOOK=off 면 방에도 예전 글자 문구로 올린다', async () => {
    process.env.SLACK_ROOM_LOOK = 'off';
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'wechat', handle: 'liwei88' });
    const room = postMock.mock.calls[0][0];
    expect(room.username).toBeUndefined();
    expect(room.text.split('\n')[0]).toBe('📱 *손님이 연락처를 남겼습니다* — WeChat: liwei88');
    expect(room.text).toContain("_'오늘 연락할 손님'으로 분류했습니다");
  });

  it('스레드: 대표 스레드에 올리고 번역본 안내와 피드 줄은 없다', async () => {
    adminFor(THREAD_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'whatsapp', handle: '+82 10-1234-5678' });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0FEED', threadTs: THREAD_TS });
    expect(postMock.mock.calls[0][0].text).not.toContain('번역본');
    expect(postMock.mock.calls[0][0].text).toContain('이 스레드에 답글을 쓰면 목록에서 빠집니다');
    // 스레드 방식은 예전 그대로 글자만
    expect(postMock.mock.calls[0][0].username).toBeUndefined();
    expect(postMock.mock.calls[0][0].attachments).toBeUndefined();
  });

  it('방도 스레드도 없으면 관리자 화면 링크를 붙여 단독 게시한다', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net';
    adminFor(UNASSIGNED_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0].threadTs).toBeUndefined();
    expect(postMock.mock.calls[0][0].text).toContain(`🔗 <https://liv-clinic.net/admin/chat/${SESSION_ID}|관리자 화면에서 열기>`);
    // #해외문의에 단독으로 올리는 글에는 이름표를 붙이지 않는다
    expect(postMock.mock.calls[0][0].username).toBeUndefined();
  });

  it('CHAT_FOLLOWUP=off 여도 방의 막대는 큰 줄만이다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor(ROOM_ROW);
    await relayContactToSlack({ sessionId: SESSION_ID, channel: 'email', handle: 'guest@example.com' });
    expect(barOf(postMock.mock.calls[0][0])).toEqual({
      color: BAR_COLOR.contact,
      headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com',
      notes: [],
    });
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

  it('단추 클릭: 방에 LIV 알림의 초록 막대 (큰 줄만)', async () => {
    adminFor(ROOM_ROW);
    await relayMessengerClickToSlack({ sessionId: SESSION_ID, channel: 'whatsapp' });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
    expect(barOf(postMock.mock.calls[0][0])).toEqual({
      color: BAR_COLOR.contact,
      headline:
        '📲 손님이 WhatsApp으로 이어가기를 눌렀습니다 — 병원 WhatsApp에서 코드 #5B0C7C1A 가 담긴 메시지를 확인해 주세요.',
      notes: [],
    });
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

  it('이벤트 안내: 방에 LIV 알림의 회색 막대 (짧은 문장 다음 줄에 링크)', async () => {
    adminFor(ROOM_ROW);
    const url = 'https://liv-clinic.net/zh/events/2026-10-promotion';
    await relayEventHintNoteToSlack({ sessionId: SESSION_ID, url });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
    expect(barOf(postMock.mock.calls[0][0])).toEqual({
      color: BAR_COLOR.info,
      headline: `🎁 이벤트 링크를 자동으로 보냈습니다\n${url}`,
      notes: [],
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

describe('notifyDeliveryFailure — 답글 전달 실패 알림', () => {
  const postMock = vi.mocked(postSlackMessage);
  const ROOM_REPLY = {
    channel: 'C0ROOM',
    slackTs: '3.0',
    threadTs: null,
    isTopLevel: true,
    isBroadcast: false,
    text: '답',
    slackUserId: 'U0AAA',
  };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  });
  afterEach(clearSlackEnv);

  it('손님 방 안: LIV 알림의 빨간 막대 (큰 줄 + 사유)', async () => {
    await notifyDeliveryFailure(ROOM_REPLY, 'error');
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
    expect(barOf(postMock.mock.calls[0][0])).toEqual({
      color: BAR_COLOR.alert,
      headline: '⚠️ *방금 답글이 손님에게 전달되지 않았습니다*',
      notes: ['사유: 서버 오류가 났습니다. 관리자 화면에서 다시 보내 주세요'],
    });
  });

  it('방 안의 스레드에서 난 실패는 그 스레드에 단다', async () => {
    await notifyDeliveryFailure({ ...ROOM_REPLY, threadTs: '1.5', isTopLevel: false, isBroadcast: true }, 'empty_text');
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', threadTs: '1.5', username: 'LIV 알림' });
  });

  it('#해외문의(피드 채널)의 스레드에서는 예전 그대로 글자만 올린다', async () => {
    await notifyDeliveryFailure(
      { ...ROOM_REPLY, channel: 'C0FEED', threadTs: THREAD_TS, isTopLevel: false },
      'session_not_found'
    );
    expect(postMock.mock.calls[0][0]).toEqual({
      text: '⚠️ 방금 답글이 손님에게 전달되지 않았습니다 · 사유: 이 스레드는 상담과 연결돼 있지 않습니다. 사이드바의 손님 방(날짜-이름으로 된 방) 본문에 답해 주세요',
      channelId: 'C0FEED',
      threadTs: THREAD_TS,
    });
  });

  it('전달됐거나 일부러 무시한 경우에는 알리지 않는다', async () => {
    for (const outcome of ['delivered', 'internal_note', 'legacy_top_level', 'unknown_channel'] as const) {
      await notifyDeliveryFailure(ROOM_REPLY, outcome);
    }
    expect(postMock).not.toHaveBeenCalled();
  });
});

describe('relayChatMessageToSlack — 방의 첫 글: 손님 글과 새 문의 알림', () => {
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
    return admin;
  }

  const FIRST = {
    sessionId: SESSION_ID,
    messageId: 'm-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    // 2026-10-05(월) 12:00 KST
    receivedAt: '2026-10-05T03:00:00Z',
  };
  const VISITOR_TEXT = '<@U0AAA>\n울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?';
  /** n번째 게시(새 문의 알림)의 막대들 — 색, 큰 줄, 블록 수(1 = 설명 줄 없음) */
  const noticeBars = (call: number) =>
    postMock.mock.calls[call][0].attachments!.map((a) => ({
      color: a.color,
      headline: (a.blocks[0].text as { text: string }).text,
      blocks: a.blocks.length,
    }));
  const NEW_INQUIRY_BAR = {
    color: BAR_COLOR.info,
    headline: '*새 문의* · 📥 10/05(월) 12:00 KST · 참조코드 `#5B0C7C1A`',
    blocks: 1,
  };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0NEW' });
    ensureRoomMock.mockReset();
    ensureRoomMock.mockResolvedValue({ mode: 'room', channelId: 'C0NEW', created: true });
  });
  afterEach(() => {
    clearSlackEnv();
    delete process.env.SLACK_ROOM_LOOK;
  });

  it('손님 글(손님 이름표) → 새 문의 알림(LIV 알림, 회색 막대) → 피드 줄 순으로 올린다', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(postMock).toHaveBeenCalledTimes(3);

    const visitor = postMock.mock.calls[0][0];
    expect(visitor).toMatchObject({
      channelId: 'C0NEW',
      username: '중국어(간체) 손님',
      iconEmoji: ':flag-cn:',
      text: VISITOR_TEXT,
    });
    expect(visitor.attachments).toBeUndefined();

    const notice = postMock.mock.calls[1][0];
    expect(notice).toMatchObject({ channelId: 'C0NEW', username: 'LIV 알림', iconEmoji: ':bell:', text: '' });
    expect(notice.attachments![0].color).toBe(BAR_COLOR.info);
    expect(notice.attachments![0].blocks[0]).toEqual({
      type: 'section',
      text: { type: 'mrkdwn', text: '*새 문의* · 📥 10/05(월) 12:00 KST · 참조코드 `#5B0C7C1A`' },
    });
    // 설명 줄 없이 큰 줄 하나 (slack-room-notice-trim)
    expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);

    // 피드 줄에는 이름표를 붙이지 않는다 — 피드 스레드 답장 전달이 부모 글의 user로 우리 봇을 판별한다.
    const feed = postMock.mock.calls[2][0];
    expect(feed.channelId).toBe('C0FEED');
    expect(feed.text.startsWith('🔴 새 문의 · 🇨🇳 익명 · <#C0NEW> · ')).toBe(true);
    expect(feed.username).toBeUndefined();
    expect(feed.attachments).toBeUndefined();
  });

  it('손님 이름이 있으면 이름표에 쓴다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_name: 'Li Wei' });
    await relayChatMessageToSlack(FIRST);
    expect(postMock.mock.calls[0][0].username).toBe('Li Wei 손님');
  });

  it('chat_messages.slack_ts에는 손님 글의 ts를 남긴다 (알림 글의 ts가 아니다)', async () => {
    const admin = adminFor(UNASSIGNED_ROW);
    postMock
      .mockResolvedValueOnce({ ok: true, ts: '1.1', channel: 'C0NEW' })
      .mockResolvedValueOnce({ ok: true, ts: '2.2', channel: 'C0NEW' })
      .mockResolvedValueOnce({ ok: true, ts: '3.3', channel: 'C0FEED' });
    await relayChatMessageToSlack(FIRST);
    const persist = admin.ops.find((o) => o.table === 'chat_messages' && o.op === 'update');
    expect(persist?.payload).toEqual({ slack_ts: '1.1' });
  });

  it('시작 화면에서 이메일을 넣은 손님: 새 문의 알림에 초록 막대 한 줄(연락처)이 따라붙는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    // 손님 글, 알림(막대 두 개), 피드 줄 — 게시 횟수는 늘지 않는다
    expect(postMock).toHaveBeenCalledTimes(3);
    expect(postMock.mock.calls[0][0].text).toBe(VISITOR_TEXT);
    expect(noticeBars(1)).toEqual([
      NEW_INQUIRY_BAR,
      { color: BAR_COLOR.contact, headline: '📱 *손님이 연락처를 남겼습니다* — 이메일: guest@example.com', blocks: 1 },
    ]);
  });

  it('이메일이 없는 손님에게는 붙지 않는다', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);
  });

  it('이 글에서 방금 이메일이 저장됐으면(📱 알림이 뒤따른다) 붙이지 않는다', async () => {
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack({ ...FIRST, contactJustSaved: true });
    expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);
  });

  it('CHAT_FOLLOWUP=off 면 붙이지 않는다', async () => {
    process.env.CHAT_FOLLOWUP = 'off';
    adminFor({ ...UNASSIGNED_ROW, visitor_email: 'guest@example.com' });
    await relayChatMessageToSlack(FIRST);
    expect(noticeBars(1)).toEqual([NEW_INQUIRY_BAR]);
  });

  it('알림 게시가 실패해도 피드 줄까지 간다', async () => {
    adminFor(UNASSIGNED_ROW);
    postMock
      .mockResolvedValueOnce({ ok: true, ts: '1.1', channel: 'C0NEW' })
      .mockResolvedValueOnce({ ok: false, error: 'timeout' })
      .mockResolvedValueOnce({ ok: true, ts: '3.3', channel: 'C0FEED' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await relayChatMessageToSlack(FIRST);
    expect(postMock).toHaveBeenCalledTimes(3);
    expect(postMock.mock.calls[2][0].channelId).toBe('C0FEED');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('first notice failed'))).toBe(true);
    warn.mockRestore();
  });

  it('SLACK_ROOM_LOOK=off: 예전처럼 한 글에 머리말·꼬리말을 담고, 알림은 따로 올리지 않는다', async () => {
    process.env.SLACK_ROOM_LOOK = 'off';
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: buildRoomFirstText({
        mentionAll: '<@U0AAA>',
        receivedAt: FIRST.receivedAt,
        visitorLocale: 'zh',
        originalText: FIRST.originalText,
        translatedText: FIRST.translatedText,
        contactNote: null,
      }),
      channelId: 'C0NEW',
    });
    expect(postMock.mock.calls[1][0].channelId).toBe('C0FEED');
  });

  it('꾸민 손님 글이 거부돼 글자만으로 올라가면 알림은 따로 올리지 않는다', async () => {
    adminFor(UNASSIGNED_ROW);
    postMock
      .mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' })
      .mockResolvedValueOnce({ ok: true, ts: '1.1', channel: 'C0NEW' })
      .mockResolvedValueOnce({ ok: true, ts: '3.3', channel: 'C0FEED' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await relayChatMessageToSlack(FIRST);
    expect(postMock).toHaveBeenCalledTimes(3);
    expect(postMock.mock.calls[1][0].text.startsWith('🔴 *새 문의* · <@U0AAA> · 📥')).toBe(true);
    expect(postMock.mock.calls[2][0].channelId).toBe('C0FEED');
    warn.mockRestore();
  });

  it('첫 글의 시각을 방 만들기에 넘긴다 (방 이름의 날짜가 된다)', async () => {
    adminFor(UNASSIGNED_ROW);
    await relayChatMessageToSlack(FIRST);
    expect(ensureRoomMock).toHaveBeenCalledTimes(1);
    expect(ensureRoomMock.mock.calls[0][2]).toBe(FIRST.receivedAt);
  });
});

describe('relayChatMessageToSlack — 이미 있는 방: 후속 글, 재발신, 관리자 화면 답장', () => {
  const postMock = vi.mocked(postSlackMessage);
  const adminMock = vi.mocked(createChatAdminClient);
  const archiveMock = vi.mocked(archiveChannel);
  const unarchiveMock = vi.mocked(unarchiveChannel);

  function adminFor(row: Record<string, unknown>) {
    const admin = fakeAdmin((op: FakeOp) => {
      if (op.table === 'chat_sessions' && op.op === 'select' && hasFilter(op, 'id', SESSION_ID)) return { data: row };
      if (op.op === 'update') return { data: [{ id: SESSION_ID }] };
      return { data: null };
    });
    adminMock.mockReturnValue(admin as never);
    return admin;
  }

  const NEXT = {
    sessionId: SESSION_ID,
    messageId: 'm-2',
    sender: 'visitor' as const,
    originalText: 'Can I book for Thursday?',
    translatedText: '목요일에 예약할 수 있나요?',
    // 2026-10-05(월) 12:12 KST
    receivedAt: '2026-10-05T03:12:00Z',
  };
  const ADMIN_REPLY = {
    sessionId: SESSION_ID,
    messageId: 'm-3',
    sender: 'operator' as const,
    senderLabel: 'admin@livps.co.kr',
    originalText: '안녕하세요',
    translatedText: '你好',
  };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
    archiveMock.mockReset();
    archiveMock.mockResolvedValue({ ok: true, data: {} });
    unarchiveMock.mockReset();
    unarchiveMock.mockResolvedValue({ ok: true, data: {} });
  });
  afterEach(() => {
    clearSlackEnv();
    delete process.env.SLACK_ROOM_LOOK;
  });

  it('후속 글: 손님 이름표로 한 번만 올린다 (알림·피드 없음, 시각 글자 없음)', async () => {
    adminFor({ ...ROOM_ROW, visitor_name: 'Li Wei' });
    await relayChatMessageToSlack(NEXT);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: '<@U0AAA>\n목요일에 예약할 수 있나요?\n> _원문:_ Can I book for Thursday?',
      username: 'Li Wei 손님',
      iconEmoji: ':flag-cn:',
      channelId: 'C0ROOM',
    });
  });

  it('보관된 방에 손님이 다시 쓰면: 보관 해제 → 손님 글 → 피드 "다시 열림" → 방에 🔔 알림', async () => {
    adminFor(ROOM_ROW);
    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
    await relayChatMessageToSlack(NEXT);

    expect(unarchiveMock).toHaveBeenCalledWith('C0ROOM');
    expect(postMock).toHaveBeenCalledTimes(4);
    // [0]은 보관된 방이라 실패한 게시. [1] 해제 뒤 손님 글 — 🔔 머리말은 글에 넣지 않는다
    expect(postMock.mock.calls[1][0]).toMatchObject({ channelId: 'C0ROOM', username: '중국어(간체) 손님' });
    expect(postMock.mock.calls[1][0].text).not.toContain('🔔');
    // [2] 피드 줄
    expect(postMock.mock.calls[2][0].channelId).toBe('C0FEED');
    expect(postMock.mock.calls[2][0].text.startsWith('🔄 다시 열림 · 익명 · <#C0ROOM> · ')).toBe(true);
    // [3] 방의 🔔 알림 (회색 막대)
    const notice = postMock.mock.calls[3][0];
    expect(notice).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: '' });
    expect(notice.attachments![0].color).toBe(BAR_COLOR.info);
    expect(notice.attachments![0].blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: ROOM_REOPENED_LEAD } },
    ]);
  });

  it('SLACK_ROOM_LOOK=off 재발신: 🔔 머리말이 든 글 하나만 올린다', async () => {
    process.env.SLACK_ROOM_LOOK = 'off';
    adminFor(ROOM_ROW);
    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
    await relayChatMessageToSlack(NEXT);
    expect(postMock).toHaveBeenCalledTimes(3); // 실패한 게시, 해제 뒤 게시, 피드 줄
    expect(postMock.mock.calls[1][0].text.startsWith(`${ROOM_REOPENED_LEAD} · <@U0AAA> · 12:12 KST`)).toBe(true);
    expect(postMock.mock.calls[1][0].username).toBeUndefined();
  });

  it('보관 해제가 실패하면 스레드 방식으로 넘겨 손님 글을 잃지 않는다', async () => {
    adminFor(ROOM_ROW);
    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
    unarchiveMock.mockResolvedValue({ ok: false, error: 'restricted_action' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await relayChatMessageToSlack(NEXT);
    // 스레드 방식의 첫 글은 #해외문의에 글자만으로 올라간다
    const last = postMock.mock.calls[postMock.mock.calls.length - 1][0];
    expect(last.channelId).toBe('C0FEED');
    expect(last.username).toBeUndefined();
    expect(last.text).toContain('새 채팅 문의');
    warn.mockRestore();
  });

  it('관리자 화면에서 쓴 답: 작성자 이름표로 사본을 올린다', async () => {
    adminFor(ROOM_ROW);
    await relayChatMessageToSlack(ADMIN_REPLY);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: '안녕하세요\n> _zh 전달:_ 你好',
      username: 'admin@livps.co.kr · 관리자 화면에서 답함',
      iconEmoji: ':leftwards_arrow_with_hook:',
      channelId: 'C0ROOM',
    });
  });

  it('관리자 화면 답으로 보관된 방이 되살아나면 🔔 알림은 올리지 않는다', async () => {
    adminFor(ROOM_ROW);
    postMock.mockResolvedValueOnce({ ok: false, error: 'is_archived' });
    await relayChatMessageToSlack(ADMIN_REPLY);
    expect(postMock).toHaveBeenCalledTimes(3); // 실패한 게시, 해제 뒤 게시, 피드 줄
    expect(postMock.mock.calls.every((c) => c[0].username !== 'LIV 알림')).toBe(true);
  });

  it('스레드 방식 세션의 글은 예전 그대로 글자만 올린다', async () => {
    adminFor(THREAD_ROW);
    await relayChatMessageToSlack(NEXT);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: '목요일에 예약할 수 있나요?\n> _원문:_ Can I book for Thursday?',
      threadTs: THREAD_TS,
      channelId: 'C0FEED',
    });
  });
});

// ── 손님 방 글 모양 (스펙 2026-10-01 slack-room-look §3.5) ───────────────────────────

describe('postStyled — 꾸민 글 올리기와 글자만 재게시', () => {
  const postMock = vi.mocked(postSlackMessage);
  const MSG = {
    username: 'LIV 알림',
    iconEmoji: ':bell:',
    text: '',
    attachments: [
      { color: '#a8a6a8', fallback: '안내', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*안내*' } }] },
    ],
    plainText: '글자만 문구',
  };
  const OK = { ok: true, ts: '9.9', channel: 'C0ROOM' };

  beforeEach(() => {
    setSlackEnv();
    postMock.mockReset();
    postMock.mockResolvedValue(OK);
  });
  afterEach(() => {
    clearSlackEnv();
    delete process.env.SLACK_ROOM_LOOK;
  });

  it('이름표·아이콘·색 막대를 붙여 한 번 올린다', async () => {
    const r = await postStyled(MSG, { channelId: 'C0ROOM' });
    expect(r).toEqual({ ...OK, plain: false });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({
      text: '',
      username: 'LIV 알림',
      iconEmoji: ':bell:',
      attachments: MSG.attachments,
      channelId: 'C0ROOM',
    });
  });

  it('SLACK_ROOM_LOOK=off 면 글자만 문구를 올린다', async () => {
    process.env.SLACK_ROOM_LOOK = 'off';
    const r = await postStyled(MSG, { channelId: 'C0ROOM' });
    expect(r).toEqual({ ...OK, plain: true });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0][0]).toEqual({ text: '글자만 문구', channelId: 'C0ROOM' });
  });

  it('꾸민 글이 거부되면(invalid_blocks) 같은 내용을 글자만으로 한 번 더 올린다', async () => {
    postMock.mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' }).mockResolvedValueOnce(OK);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await postStyled(MSG, { channelId: 'C0ROOM' });
    expect(r).toEqual({ ...OK, plain: true });
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[1][0]).toEqual({ text: '글자만 문구', channelId: 'C0ROOM' });
    expect(warn.mock.calls.some((c) => String(c[0]).includes('styled post failed, retrying plain'))).toBe(true);
    warn.mockRestore();
  });

  it('앱 권한이 빠졌을 때(missing_scope)와 모르는 오류도 글자만으로 올린다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const error of ['missing_scope', 'some_new_slack_error']) {
      postMock.mockReset();
      postMock.mockResolvedValueOnce({ ok: false, error }).mockResolvedValueOnce(OK);
      expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ...OK, plain: true });
      expect(postMock).toHaveBeenCalledTimes(2);
    }
    warn.mockRestore();
  });

  it('방 상태 오류(is_archived·channel_not_found·not_in_channel)는 다시 올리지 않는다 — 호출부가 처리한다', async () => {
    for (const error of ['is_archived', 'channel_not_found', 'not_in_channel']) {
      postMock.mockReset();
      postMock.mockResolvedValue({ ok: false, error });
      expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ok: false, error, plain: false });
      expect(postMock).toHaveBeenCalledTimes(1);
    }
  });

  it('일시 오류(timeout·ratelimited·http_503)는 다시 올리지 않는다 — callSlack이 이미 한 번 재시도했다', async () => {
    for (const error of ['timeout', 'ratelimited', 'network_error', 'http_503']) {
      postMock.mockReset();
      postMock.mockResolvedValue({ ok: false, error });
      expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ok: false, error, plain: false });
      expect(postMock).toHaveBeenCalledTimes(1);
    }
  });

  it('글자만 재게시도 실패하면 그 결과를 돌려준다', async () => {
    postMock
      .mockResolvedValueOnce({ ok: false, error: 'invalid_attachments' })
      .mockResolvedValueOnce({ ok: false, error: 'msg_too_long' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await postStyled(MSG, { channelId: 'C0ROOM' })).toEqual({ ok: false, error: 'msg_too_long', plain: true });
    warn.mockRestore();
  });

  it('스레드 안에 올릴 때는 thread_ts를 두 번 다 넘긴다', async () => {
    postMock.mockResolvedValueOnce({ ok: false, error: 'invalid_blocks' }).mockResolvedValueOnce(OK);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await postStyled(MSG, { channelId: 'C0ROOM', threadTs: '1.5' });
    expect(postMock.mock.calls[0][0]).toMatchObject({ channelId: 'C0ROOM', threadTs: '1.5', username: 'LIV 알림' });
    expect(postMock.mock.calls[1][0]).toEqual({ text: '글자만 문구', channelId: 'C0ROOM', threadTs: '1.5' });
    warn.mockRestore();
  });
});
