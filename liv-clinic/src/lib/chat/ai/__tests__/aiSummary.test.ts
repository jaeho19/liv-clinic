import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/chat/db', () => ({ createChatAdminClient: vi.fn() }));
vi.mock('@/lib/chat/slackRelay', () => ({ relayAiSummaryToSlack: vi.fn() }));
vi.mock('../openai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../openai')>()),
  callChatAi: vi.fn(),
}));

import { createChatAdminClient } from '@/lib/chat/db';
import { relayAiSummaryToSlack } from '@/lib/chat/slackRelay';
import { fakeAdmin, hasFilter, hasFilterOp, type FakeOp, type FakeResult } from '@/lib/chat/__tests__/fakeAdmin';
import { callChatAi } from '../openai';
import { buildSummaryMessages, parseSummary, runAiSummaries, segmentLines, type SegmentMessage } from '../aiSummary';

// 스펙 2026-10-22 chat-ai-slack-transcript §2 — 대화가 10분 멈추면 AI 응대 요약 1개.
const adminMock = vi.mocked(createChatAdminClient);
const relayMock = vi.mocked(relayAiSummaryToSlack);
const aiMock = vi.mocked(callChatAi);

const NOW = new Date('2026-10-22T02:10:00Z'); // 11:10 KST
const S = 'sess-1';
const LAST = '2026-10-22T01:50:05Z'; // 20분 전
const MSGS: Array<SegmentMessage & { id: string }> = [
  { id: 'm0', created_at: '2026-10-22T01:42:58Z', sender: 'system', source: 'app', original_text: 'Hello! How can we help?', translated_text: null },
  { id: 'm1', created_at: '2026-10-22T01:43:13Z', sender: 'visitor', source: 'app', original_text: 'How much is Ulthera?', translated_text: '울쎄라 얼마인가요?' },
  { id: 'm2', created_at: '2026-10-22T01:43:16Z', sender: 'operator', source: 'ai', original_text: '부위별 금액은 …', translated_text: 'Prices …' },
  { id: 'm3', created_at: '2026-10-22T01:49:28Z', sender: 'operator', source: 'slack', original_text: '확인해서 연락드리겠습니다.', translated_text: 'We will check.' },
  { id: 'm4', created_at: '2026-10-22T01:50:05Z', sender: 'operator', source: 'auto', original_text: '메시지 잘 받았습니다.', translated_text: 'Received.' },
];
const ROOM = { id: S, last_message_at: LAST, ai_summary_at: null, slack_mode: 'room', slack_channel_id: 'C0ROOM', slack_thread_ts: null };

describe('segmentLines — 요약할 구간의 글', () => {
  it('(after, until] 의 손님(번역) · AI · 직원 글만. 자동 안내 · 시스템 글은 뺀다', () => {
    expect(segmentLines(MSGS, null, LAST)).toEqual([
      { at: '2026-10-22T01:43:13Z', who: '손님', text: '울쎄라 얼마인가요?' },
      { at: '2026-10-22T01:43:16Z', who: 'AI', text: '부위별 금액은 …' },
      { at: '2026-10-22T01:49:28Z', who: '직원', text: '확인해서 연락드리겠습니다.' },
    ]);
    expect(segmentLines(MSGS, '2026-10-22T01:43:13Z', '2026-10-22T01:43:16Z').map((l) => l.who)).toEqual(['AI']);
  });

  it('손님 글의 번역이 없으면 원문, 빈 글은 뺀다', () => {
    const rows: SegmentMessage[] = [
      { created_at: '2026-10-22T01:00:00Z', sender: 'visitor', source: 'app', original_text: 'Hi', translated_text: null },
      { created_at: '2026-10-22T01:00:01Z', sender: 'visitor', source: 'app', original_text: '  ', translated_text: '' },
    ];
    expect(segmentLines(rows, null, '2026-10-22T02:00:00Z')).toEqual([{ at: '2026-10-22T01:00:00Z', who: '손님', text: 'Hi' }]);
  });
});

describe('buildSummaryMessages · parseSummary', () => {
  it('지시문(JSON 세 칸)과 시각 · 말한 이가 붙은 대화', () => {
    const [system, user] = buildSummaryMessages(segmentLines(MSGS, null, LAST));
    expect(system.role).toBe('system');
    expect(system.content).toContain('{"asked": "...", "answered": "...", "todo": "..."}');
    expect(user).toEqual({
      role: 'user',
      content: '[10:43] 손님: 울쎄라 얼마인가요?\n[10:43] AI: 부위별 금액은 …\n[10:49] 직원: 확인해서 연락드리겠습니다.',
    });
  });

  it('대화가 너무 길면 앞부분을 줄인다', () => {
    const long = Array.from({ length: 40 }, (_, i) => ({ at: '2026-10-22T01:00:00Z', who: '손님' as const, text: `${i} ${'가'.repeat(600)}` }));
    const [, user] = buildSummaryMessages(long);
    expect(user.content.startsWith('(앞부분 생략)\n')).toBe(true);
    expect(user.content.length).toBeLessThanOrEqual(12_000 + 20);
    expect(user.content).toContain('39 ');
  });

  it('parseSummary: asked · answered 가 있어야 한다. todo 는 없어도 된다. 다듬고 300자로 자른다', () => {
    expect(parseSummary('{"asked":" 가격 ","answered":"안내","todo":""}')).toEqual({ asked: '가격', answered: '안내', todo: '' });
    expect(parseSummary('{"asked":"가격","answered":"안내"}')).toEqual({ asked: '가격', answered: '안내', todo: '' });
    expect(parseSummary('{"asked":"","answered":"안내","todo":""}')).toBeNull();
    expect(parseSummary('not json')).toBeNull();
    expect(parseSummary('[1,2]')).toBeNull();
    expect(parseSummary(JSON.stringify({ asked: '가'.repeat(400), answered: 'b', todo: 1 }))).toEqual({
      asked: '가'.repeat(300),
      answered: 'b',
      todo: '',
    });
  });
});

describe('runAiSummaries', () => {
  let ops: FakeOp[];
  function useAdmin(over: (op: FakeOp) => FakeResult | undefined = () => undefined) {
    const admin = fakeAdmin((op) => {
      const custom = over(op);
      if (custom) return custom;
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: [ROOM] };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: S }] };
      if (op.table === 'chat_messages' && op.columns === 'session_id, created_at') {
        return { data: [{ session_id: S, created_at: '2026-10-22T01:43:16Z' }] };
      }
      if (op.table === 'chat_messages') return { data: MSGS };
      if (op.table === 'chat_ai_turns') return { data: [{ created_at: '2026-10-22T01:43:17Z', staff_note_ko: '울쎄라 가격을 안내했습니다.' }] };
      return { data: null };
    });
    ops = admin.ops;
    adminMock.mockReturnValue(admin as never);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    process.env.SLACK_CHANNEL_ID = 'C0FEED';
    relayMock.mockResolvedValue(true);
    aiMock.mockResolvedValue({
      ok: true,
      content: '{"asked":"울쎄라 가격","answered":"부위별 가격 안내","todo":"연락"}',
      latencyMs: 900,
      usage: { promptTokens: 1, cachedTokens: 0, completionTokens: 1 },
    });
  });
  afterEach(() => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_CHANNEL_ID;
    delete process.env.CHAT_AI_SUMMARY;
    vi.restoreAllMocks();
  });

  it('10분 넘게 멈춘 · 24시간 안 · 열린 대화를 찾아, 선점하고, 요약을 방에 올린다', async () => {
    useAdmin();
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 1, fallback: 0 });
    const query = ops.find((o) => o.table === 'chat_sessions' && o.op === 'select')!;
    expect(hasFilter(query, 'status', 'open')).toBe(true);
    expect(hasFilterOp(query, 'resolved_at', 'is')).toBe(true);
    expect(query.filters).toContainEqual(['last_message_at', 'lt', '2026-10-22T02:00:00.000Z']);
    expect(query.filters).toContainEqual(['last_message_at', 'gte', '2026-10-21T02:10:00.000Z']);
    const claim = ops.find((o) => o.table === 'chat_sessions' && o.op === 'update')!;
    expect(claim.payload).toEqual({ ai_summary_at: LAST });
    expect(hasFilterOp(claim, 'ai_summary_at', 'is')).toBe(true);
    expect(relayMock).toHaveBeenCalledWith({
      session: ROOM,
      summary: {
        from: '2026-10-22T01:43:13Z',
        until: '2026-10-22T01:49:28Z',
        visitorMessages: 1,
        summary: { asked: '울쎄라 가격', answered: '부위별 가격 안내', todo: '연락' },
        notes: [],
      },
    });
    expect(aiMock.mock.calls[0][2]).toEqual({ timeoutMs: 15_000 });
  });

  it('지난 요약이 있으면 그 뒤 구간만, 선점은 읽은 값이 그대로일 때만', async () => {
    const prev = '2026-10-22T01:43:16Z';
    useAdmin((op) => (op.table === 'chat_sessions' && op.op === 'select' ? { data: [{ ...ROOM, ai_summary_at: prev }] } : undefined));
    // 지난 요약 뒤의 AI 글이 없으면 대상이 아니다
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(ops.some((o) => o.op === 'update')).toBe(false);

    useAdmin((op) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: [{ ...ROOM, ai_summary_at: prev }] };
      if (op.table === 'chat_messages' && op.columns === 'session_id, created_at') {
        return { data: [{ session_id: S, created_at: '2026-10-22T01:49:00Z' }] };
      }
      return undefined;
    });
    await runAiSummaries(NOW);
    const claim = ops.find((o) => o.op === 'update')!;
    expect(hasFilter(claim, 'ai_summary_at', prev)).toBe(true);
    expect(relayMock.mock.calls[0][0].summary.from).toBe('2026-10-22T01:49:28Z');
  });

  it('이미 요약한 지점이 마지막 글이면, 방도 스레드도 없으면 대상이 아니다', async () => {
    useAdmin((op) =>
      op.table === 'chat_sessions' && op.op === 'select'
        ? { data: [{ ...ROOM, ai_summary_at: LAST }, { ...ROOM, id: 's2', slack_mode: null, slack_channel_id: null }] }
        : undefined
    );
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(ops.some((o) => o.table === 'chat_messages')).toBe(false);
  });

  it('선점에 지면(다른 실행이 먼저) 올리지 않는다', async () => {
    useAdmin((op) => (op.table === 'chat_sessions' && op.op === 'update' ? { data: [] } : undefined));
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(relayMock).not.toHaveBeenCalled();
    expect(aiMock).not.toHaveBeenCalled();
  });

  it('AI 요약이 실패하면 그 구간 AI 차례들의 요지로 대신한다', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAdmin();
    aiMock.mockResolvedValueOnce({ ok: false, error: 'timeout', latencyMs: 15_000 });
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 1 });
    expect(relayMock.mock.calls[0][0].summary).toMatchObject({ summary: null, notes: ['울쎄라 가격을 안내했습니다.'] });
    const turns = ops.find((o) => o.table === 'chat_ai_turns')!;
    expect(turns.filters).toContainEqual(['reply_message_id', 'in', ['m2']]);

    aiMock.mockResolvedValueOnce({ ok: true, content: 'oops', latencyMs: 1, usage: { promptTokens: 1, cachedTokens: 0, completionTokens: 1 } });
    useAdmin();
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 1 });
  });

  it('한 번에 최대 3대화', async () => {
    const many = ['a', 'b', 'c', 'd'].map((id) => ({ ...ROOM, id }));
    useAdmin((op) => {
      if (op.table === 'chat_sessions' && op.op === 'select') return { data: many };
      if (op.table === 'chat_sessions' && op.op === 'update') return { data: [{ id: 'x' }] };
      if (op.table === 'chat_messages' && op.columns === 'session_id, created_at') {
        return { data: many.map((s) => ({ session_id: s.id, created_at: '2026-10-22T01:43:16Z' })) };
      }
      return undefined;
    });
    expect((await runAiSummaries(NOW)).summarized).toBe(3);
    expect(relayMock).toHaveBeenCalledTimes(3);
  });

  it('스위치 off · Slack 미설정이면 아무것도 하지 않는다. 조회 실패(045 전)는 경고만', async () => {
    useAdmin();
    process.env.CHAT_AI_SUMMARY = 'off';
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    delete process.env.CHAT_AI_SUMMARY;
    delete process.env.SLACK_BOT_TOKEN;
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(ops).toHaveLength(0);

    process.env.SLACK_BOT_TOKEN = 'xoxb-test';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAdmin((op) => (op.table === 'chat_sessions' && op.op === 'select' ? { error: { code: '42703' } } : undefined));
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
    expect(warn).toHaveBeenCalled();
  });

  it('긴 대화: 글을 최근 것부터 읽어(최대 300개) 시간 순으로 요약한다', async () => {
    useAdmin((op) =>
      op.table === 'chat_messages' && op.columns !== 'session_id, created_at' ? { data: [...MSGS].reverse() } : undefined
    );
    await runAiSummaries(NOW);
    expect(relayMock.mock.calls[0][0].summary).toMatchObject({ from: '2026-10-22T01:43:13Z', until: '2026-10-22T01:49:28Z' });
    expect(aiMock.mock.calls[0][0][1].content.startsWith('[10:43] 손님:')).toBe(true);
  });

  it('Slack 게시가 실패하면 센 수에 넣지 않는다(다시 시도하지 않는다)', async () => {
    useAdmin();
    relayMock.mockResolvedValueOnce(false);
    expect(await runAiSummaries(NOW)).toEqual({ summarized: 0, fallback: 0 });
  });
});
