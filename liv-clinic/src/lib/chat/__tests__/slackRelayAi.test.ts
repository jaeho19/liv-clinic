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
    loadStaffDirectory: vi.fn(async () => actual.parseStaffDirectory('U0AAA:이정현,U0BBB:유다영', 'U0OBS:이재호')),
  };
});
vi.mock('../slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slack')>()),
  postSlackMessage: vi.fn(),
  unarchiveChannel: vi.fn(),
  archiveChannel: vi.fn(),
}));
vi.mock('../slackRooms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../slackRooms')>()),
  ensureRoom: vi.fn(),
}));

import { createChatAdminClient } from '../db';
import { postSlackMessage } from '../slack';
import { BAR_COLOR } from '../slackLook';
import { ensureRoom } from '../slackRooms';
import { parseStaffDirectory, loadStaffDirectory } from '../slackStaff';
import { relayAiSummaryToSlack, relayAiTurnToSlack, relayChatMessageToSlack } from '../slackRelay';
import { AI_FALLBACK_REASON } from '../slackText';
import { fakeAdmin, hasFilter, type FakeOp, type FakeResult } from './fakeAdmin';

// 스펙 2026-10-02 chat-ai-first-response §4.11 — AI가 답하는 대화의 손님 글은 멘션 없이, AI 결과는 세 가지 글로.
const SESSION_ID = '5b0c7c1a-07c0-49bc-91da-2f556884b769';
const ROOM_SESSION = {
  id: SESSION_ID,
  visitor_name: 'Emma',
  visitor_email: null,
  visitor_locale: 'en',
  status: 'open',
  slack_mode: 'room',
  slack_channel_id: 'C0ROOM',
  slack_thread_ts: null,
  assigned_slack_user_id: null,
  assigned_label: null,
  resolved_at: null,
};
const ALL = '<@U0AAA> <@U0BBB>';
const SUMMARY = '10/14(수) 14:00 · 2명 · 울쎄라피 프라임 · WhatsApp +65 9123 4567 · Emma';

const postMock = vi.mocked(postSlackMessage);
const adminMock = vi.mocked(createChatAdminClient);
const roomMock = vi.mocked(ensureRoom);

function useAdmin(session: Record<string, unknown> | null, override?: (op: FakeOp) => FakeResult | undefined) {
  const admin = fakeAdmin((op) => {
    const custom = override?.(op);
    if (custom) return custom;
    if (op.table === 'chat_sessions' && op.op === 'select') return { data: session };
    if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: SESSION_ID }] };
    return { data: null };
  });
  adminMock.mockReturnValue(admin as never);
  return admin;
}
const posts = () => postMock.mock.calls.map((c) => c[0]);

beforeEach(() => {
  process.env.SLACK_BOT_TOKEN = 'xoxb-test';
  process.env.SLACK_CHANNEL_ID = 'C0FEED';
  postMock.mockReset();
  postMock.mockResolvedValue({ ok: true, ts: '9.9', channel: 'C0ROOM' });
  roomMock.mockReset();
});
afterEach(() => {
  delete process.env.SLACK_BOT_TOKEN;
  delete process.env.SLACK_CHANNEL_ID;
  vi.restoreAllMocks();
});

describe('relayChatMessageToSlack — quiet (AI가 답하는 대화의 손님 글)', () => {
  const base = {
    sessionId: SESSION_ID,
    messageId: 'm-1',
    sender: 'visitor' as const,
    originalText: 'How much is Ulthera?',
    translatedText: '울쎄라 얼마인가요?',
    receivedAt: '2026-10-02T07:20:00Z',
  };

  it('후속 글: quiet 이면 멘션 없이 본문만, 아니면 지금처럼 전원 멘션', async () => {
    useAdmin(ROOM_SESSION);
    await relayChatMessageToSlack({ ...base, quiet: true });
    expect(posts()[0].text).toBe('울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?');

    postMock.mockClear();
    await relayChatMessageToSlack(base);
    expect(posts()[0].text).toBe(`${ALL}\n울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?`);
  });

  it('담당자가 있어도 quiet 이면 멘션하지 않는다', async () => {
    useAdmin({ ...ROOM_SESSION, assigned_slack_user_id: 'U0AAA' });
    await relayChatMessageToSlack({ ...base, quiet: true });
    expect(posts()[0].text).not.toContain('<@');
  });

  it('방의 첫 글: quiet 이면 멘션 없이 올라가고, 새 문의 알림과 피드 줄은 그대로 나간다', async () => {
    useAdmin({ ...ROOM_SESSION, slack_mode: null, slack_channel_id: null });
    roomMock.mockResolvedValue({ mode: 'room', channelId: 'C0ROOM', created: true } as never);
    await relayChatMessageToSlack({ ...base, quiet: true });
    const sent = posts();
    expect(sent[0]).toMatchObject({ channelId: 'C0ROOM', username: 'Emma 손님' });
    expect(sent[0].text).toBe('울쎄라 얼마인가요?\n> _원문:_ How much is Ulthera?');
    expect(sent[1].attachments?.[0].color).toBe(BAR_COLOR.info); // 새 문의 알림
    expect(sent[2]).toMatchObject({ channelId: 'C0FEED' });
    expect(sent[2].text).toContain('🔴 새 문의');
    expect(sent.some((p) => String(p.text).includes('<@'))).toBe(false);
  });
});

describe('relayAiTurnToSlack', () => {
  const args = {
    sessionId: SESSION_ID,
    reply: { sentText: 'Ulthera is …', koreanText: '울쎄라 가격을 안내했습니다.', quoted: [] },
    booking: null,
    staffNeeded: null,
  };

  it('AI 응대 글: 이름표 AI 응대, 멘션 없음, 손님에게 나간 답의 번역 전문. 금액이 빠졌으면 정확한 금액 줄', async () => {
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({
      ...args,
      reply: {
        sentText: 'Thermage 600 shots: from KRW 2,400,000',
        koreanText: '써마지 600샷은 240만 원부터입니다.',
        quoted: ['써마지 레이저 · 600샷 2,400,000원~'],
      },
    });
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({
      channelId: 'C0ROOM',
      username: 'AI 응대',
      iconEmoji: ':speech_balloon:',
      text: '써마지 600샷은 240만 원부터입니다.\n> 안내한 금액: 써마지 레이저 · 600샷 2,400,000원~',
    });
  });

  it('가예약이 처음 찼다: 요지 → 파란 막대(전원 멘션) → #해외문의 한 줄', async () => {
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({ ...args, booking: { changed: false, summary: SUMMARY, when: '10/14(수) 14:00' } });
    const sent = posts();
    expect(sent).toHaveLength(3);
    expect(sent[1]).toMatchObject({ channelId: 'C0ROOM', username: 'LIV 알림', text: ALL });
    expect(sent[1].attachments?.[0]).toMatchObject({ color: '#2f6fde', fallback: `🗓 가예약 · ${SUMMARY}` });
    expect(sent[2].channelId).toBe('C0FEED');
    expect(sent[2].text).toMatch(/^🗓 가예약 · 🇬🇧 Emma · 10\/14\(수\) 14:00 · <#C0ROOM> · /);
    expect(sent[2].username).toBeUndefined(); // 피드에는 이름표를 쓰지 않는다
  });

  it('가예약 변경: 파란 막대와 멘션은 가지만 피드 줄은 없다', async () => {
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({ ...args, booking: { changed: true, summary: SUMMARY, when: '10/16(금) 11:00' } });
    const sent = posts();
    expect(sent).toHaveLength(2);
    expect(sent[1].attachments?.[0].fallback).toBe(`🗓 가예약 변경 · ${SUMMARY}`);
  });

  it('직원 확인 필요: 처음에는 전원 멘션(ai_handoff_at 선점), 이미 알린 대화면 막대만', async () => {
    const admin = useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({ ...args, staffNeeded: { reason: '스컬트라 금액 문의' } });
    let sent = posts();
    expect(sent[1]).toMatchObject({ username: 'LIV 알림', text: ALL });
    expect(sent[1].attachments?.[0]).toMatchObject({ color: BAR_COLOR.alert, fallback: '🙋 직원 확인 필요 · 스컬트라 금액 문의' });
    const claim = admin.ops.find((o) => o.table === 'chat_sessions' && o.op === 'update')!;
    expect(hasFilter(claim, 'id', SESSION_ID)).toBe(true);
    expect(claim.filters).toContainEqual(['ai_handoff_at', 'is', null]);
    expect(Object.keys(claim.payload as object)).toEqual(['ai_handoff_at']);

    postMock.mockClear();
    useAdmin(ROOM_SESSION, (op) => (op.table === 'chat_sessions' && op.op === 'update' ? { data: [] } : undefined));
    await relayAiTurnToSlack({ ...args, staffNeeded: { reason: '추가 할인 요청' } });
    sent = posts();
    expect(sent[1].text).toBe('');
    expect(sent[1].attachments?.[0].fallback).toBe('🙋 직원 확인 필요 · 추가 할인 요청');
  });

  it('선점 조회가 실패하면(043 미적용 등) 알리는 쪽을 고른다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAdmin(ROOM_SESSION, (op) => (op.table === 'chat_sessions' && op.op === 'update' ? { error: { code: '42703' } } : undefined));
    await relayAiTurnToSlack({ ...args, staffNeeded: { reason: null } });
    expect(posts()[1].text).toBe(ALL);
    expect(warn).toHaveBeenCalled();
  });

  it('AI가 답하지 못했을 때(reply=null): AI 응대 글 없이 직원 확인 필요만', async () => {
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({ ...args, reply: null, staffNeeded: { reason: AI_FALLBACK_REASON } });
    const sent = posts();
    expect(sent).toHaveLength(1);
    expect(sent[0].attachments?.[0].fallback).toBe('🙋 직원 확인 필요 · 자동 응대가 답하지 못했습니다');
  });

  it('스레드 방식: 같은 글을 글자만으로 스레드에 올리고 피드 줄은 만들지 않는다', async () => {
    useAdmin({ ...ROOM_SESSION, slack_mode: 'thread', slack_channel_id: 'C0FEED', slack_thread_ts: '1.0' });
    await relayAiTurnToSlack({
      ...args,
      booking: { changed: false, summary: SUMMARY, when: '10/14(수) 14:00' },
      staffNeeded: { reason: '스컬트라 금액 문의' },
    });
    const sent = posts();
    expect(sent).toHaveLength(3);
    expect(sent.every((p) => p.threadTs === '1.0' && p.channelId === 'C0FEED' && !p.username && !p.attachments)).toBe(true);
    expect(sent[0].text).toBe('💬 _AI 응대_\n울쎄라 가격을 안내했습니다.');
    expect(sent[1].text).toBe(`🗓 *가예약* ${ALL} · ${SUMMARY}`);
    expect(sent[2].text).toBe(`🙋 *직원 확인 필요* ${ALL} · 스컬트라 금액 문의`);
  });

  it('답변 직원이 한 명도 없으면 피드 줄을 만들지 않는다', async () => {
    vi.mocked(loadStaffDirectory).mockResolvedValueOnce(parseStaffDirectory('', ''));
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({ ...args, booking: { changed: false, summary: SUMMARY, when: '10/14(수) 14:00' } });
    expect(posts().some((p) => p.channelId === 'C0FEED')).toBe(false);
  });

  it('방도 스레드도 없으면: AI 응대 글은 올리지 않고, 가예약과 직원 확인 필요는 #해외문의에 관리자 화면 링크와 함께 올린다 (조용히 빠지지 않게)', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://liv-clinic.net';
    useAdmin({ ...ROOM_SESSION, slack_mode: null, slack_channel_id: null });
    await relayAiTurnToSlack({
      ...args,
      booking: { changed: false, summary: SUMMARY, when: '10/14(수) 14:00' },
      staffNeeded: { reason: '스컬트라 금액 문의' },
    });
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const sent = posts();
    expect(sent).toHaveLength(2);
    expect(sent.every((p) => p.channelId === undefined && !p.username && !p.attachments && !p.threadTs)).toBe(true);
    expect(sent[0].text).toBe(`🗓 *가예약* ${ALL} · ${SUMMARY}\n<https://liv-clinic.net/admin/chat/${SESSION_ID}|관리자 화면에서 열기>`);
    expect(sent[1].text).toBe(
      `🙋 *직원 확인 필요* ${ALL} · 스컬트라 금액 문의\n<https://liv-clinic.net/admin/chat/${SESSION_ID}|관리자 화면에서 열기>`
    );
  });

  it('직원 확인 필요 글을 올리지 못했으면 선점을 되돌린다 — 다음 🙋 에 멘션이 다시 붙게', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = useAdmin(ROOM_SESSION);
    postMock.mockResolvedValue({ ok: false, error: 'channel_not_found' });
    await relayAiTurnToSlack({ ...args, reply: null, staffNeeded: { reason: 'x' } });
    const updates = admin.ops.filter((o) => o.table === 'chat_sessions' && o.op === 'update');
    expect(updates).toHaveLength(2);
    expect(updates[1].payload).toEqual({ ai_handoff_at: null });
    expect(hasFilter(updates[1], 'id', SESSION_ID)).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it('답변 직원이 한 명도 없으면 🙋 멘션을 선점하지 않는다 (멘션할 사람이 생겼을 때 쓸 수 있게)', async () => {
    vi.mocked(loadStaffDirectory).mockResolvedValueOnce(parseStaffDirectory('', ''));
    const admin = useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack({ ...args, reply: null, staffNeeded: { reason: 'x' } });
    expect(admin.ops.filter((o) => o.table === 'chat_sessions' && o.op === 'update')).toHaveLength(0);
    expect(posts()[0].text).toBe('');
  });

  it('Slack 설정이 없으면 아무것도 하지 않는다. 게시가 실패해도 throw 하지 않는다', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    useAdmin(ROOM_SESSION);
    await relayAiTurnToSlack(args);
    expect(postMock).not.toHaveBeenCalled();

    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    postMock.mockResolvedValue({ ok: false, error: 'channel_not_found' });
    await expect(relayAiTurnToSlack(args)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});

describe('relayAiSummaryToSlack — 대화가 멈췄을 때의 요약 (스펙 2026-10-22 §2)', () => {
  const summary = {
    from: '2026-10-22T01:43:14Z',
    until: '2026-10-22T01:50:05Z',
    visitorMessages: 2,
    summary: { asked: '가격', answered: '안내', todo: '' },
    notes: [],
  };

  it('방이면 AI 응대 이름표로 방에, 멘션 없이. 올렸으면 true', async () => {
    const ok = await relayAiSummaryToSlack({ session: { slack_mode: 'room', slack_channel_id: 'C0ROOM', slack_thread_ts: null }, summary });
    expect(ok).toBe(true);
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ channelId: 'C0ROOM', username: 'AI 응대' });
    expect(String(posts()[0].text)).toContain('📝 *AI 응대 요약*');
    expect(String(posts()[0].text)).not.toContain('<@');
  });

  it('스레드면 글자만으로 스레드에. 방도 스레드도 없으면 올리지 않고 false', async () => {
    await relayAiSummaryToSlack({ session: { slack_mode: 'thread', slack_channel_id: 'C0FEED', slack_thread_ts: '1.1' }, summary });
    expect(posts()[0]).toMatchObject({ threadTs: '1.1', channelId: 'C0FEED' });
    postMock.mockClear();
    expect(await relayAiSummaryToSlack({ session: { slack_mode: null, slack_channel_id: null, slack_thread_ts: null }, summary })).toBe(false);
    expect(posts()).toHaveLength(0);
  });

  it('Slack 이 실패하면 false, throw 하지 않는다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    postMock.mockResolvedValue({ ok: false, error: 'channel_not_found' });
    expect(await relayAiSummaryToSlack({ session: { slack_mode: 'room', slack_channel_id: 'C0ROOM', slack_thread_ts: null }, summary })).toBe(false);
  });
});
