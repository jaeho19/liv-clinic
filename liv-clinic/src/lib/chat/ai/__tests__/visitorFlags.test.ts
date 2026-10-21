import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeAdmin, hasFilter } from '@/lib/chat/__tests__/fakeAdmin';
import { newSessionAiFlags, presenceAiFlags, sessionAiFlags } from '../visitorFlags';

// 스펙 2026-10-02 chat-ai-first-response §4.10 — 손님 화면이 "곧 답이 온다"를 아는 신호.
const SESSION = { id: '11111111-2222-3333-4444-555555555555', visitor_name: 'Emma' };
const TEST_SESSION = { ...SESSION, visitor_name: 'ai-test-1002' };
const OFF = { instantReply: false, assistantNotice: false };

const engaged = (value: string | null, more: { resolved_at?: string | null; status?: string } = {}) =>
  fakeAdmin((op) =>
    op.table === 'chat_sessions'
      ? { data: { staff_engaged_at: value, resolved_at: more.resolved_at ?? null, status: more.status ?? 'open' } }
      : { data: null }
  );

beforeEach(() => {
  delete process.env.CHAT_AI;
  delete process.env.CHAT_AI_NOTICE;
  process.env.OPENAI_API_KEY = 'sk-test';
});
afterEach(() => {
  delete process.env.CHAT_AI;
  delete process.env.CHAT_AI_NOTICE;
  delete process.env.OPENAI_API_KEY;
  vi.restoreAllMocks();
});

describe('presenceAiFlags — 대화가 정해지기 전(채팅 시작 화면)', () => {
  it('꺼져 있으면 둘 다 false', () => {
    expect(presenceAiFlags()).toEqual(OFF);
  });

  it('on 이고 키가 있으면 instantReply, 고지는 CHAT_AI_NOTICE=on 일 때만', () => {
    process.env.CHAT_AI = 'on';
    expect(presenceAiFlags()).toEqual({ instantReply: true, assistantNotice: false });
    process.env.CHAT_AI_NOTICE = 'on';
    expect(presenceAiFlags()).toEqual({ instantReply: true, assistantNotice: true });
  });

  it('시험 모드에서는 이름을 모르므로 false — 고지도 내지 않는다', () => {
    process.env.CHAT_AI = 'test';
    process.env.CHAT_AI_NOTICE = 'on';
    expect(presenceAiFlags()).toEqual(OFF);
  });

  it('키가 없으면 false', () => {
    process.env.CHAT_AI = 'on';
    delete process.env.OPENAI_API_KEY;
    expect(presenceAiFlags()).toEqual(OFF);
  });

  it('AI가 꺼져 있으면 고지 스위치만 켜도 고지는 나가지 않는다', () => {
    process.env.CHAT_AI_NOTICE = 'on';
    expect(presenceAiFlags()).toEqual(OFF);
  });
});

describe('newSessionAiFlags — 대화를 시작하는 순간 (직원이 맡았을 수 없다)', () => {
  it('on 이면 누구에게나, test 면 시험 이름에만', () => {
    process.env.CHAT_AI = 'on';
    expect(newSessionAiFlags('Emma').instantReply).toBe(true);
    expect(newSessionAiFlags(null).instantReply).toBe(true);
    process.env.CHAT_AI = 'test';
    expect(newSessionAiFlags('Emma')).toEqual(OFF);
    expect(newSessionAiFlags('AI-Test Emma').instantReply).toBe(true);
  });

  it('꺼져 있거나 키가 없으면 false', () => {
    expect(newSessionAiFlags('ai-test-1')).toEqual(OFF);
    process.env.CHAT_AI = 'on';
    delete process.env.OPENAI_API_KEY;
    expect(newSessionAiFlags('Emma')).toEqual(OFF);
  });
});

describe('sessionAiFlags — 진행 중인 대화', () => {
  it('꺼져 있으면 DB를 읽지 않는다', async () => {
    const admin = engaged(null);
    expect(await sessionAiFlags(admin as never, SESSION)).toEqual(OFF);
    expect(admin.ops).toHaveLength(0);
  });

  it('시험 모드에서 시험 이름이 아닌 대화도 DB를 읽지 않는다', async () => {
    process.env.CHAT_AI = 'test';
    const admin = engaged(null);
    expect(await sessionAiFlags(admin as never, SESSION)).toEqual(OFF);
    expect(admin.ops).toHaveLength(0);
  });

  it('직원이 맡지 않았으면 instantReply', async () => {
    process.env.CHAT_AI = 'on';
    const admin = engaged(null);
    expect(await sessionAiFlags(admin as never, SESSION)).toEqual({ instantReply: true, assistantNotice: false });
    expect(admin.ops[0].columns).toBe('staff_engaged_at, resolved_at, status');
    expect(hasFilter(admin.ops[0], 'id', SESSION.id)).toBe(true);
  });

  it('직원이 맡은 대화는 instantReply 가 꺼진다 — 고지는 남는다(앞에서 자동 응대가 답했다)', async () => {
    process.env.CHAT_AI = 'on';
    process.env.CHAT_AI_NOTICE = 'on';
    expect(await sessionAiFlags(engaged('2026-10-02T07:30:00Z') as never, SESSION)).toEqual({
      instantReply: false,
      assistantNotice: true,
    });
  });

  it('직원이 맡았더라도 완료(보관)했거나 종료한 대화면 instantReply — 손님이 다시 쓰면 AI가 다시 먼저 답한다', async () => {
    process.env.CHAT_AI = 'on';
    const at = '2026-10-02T07:30:00Z';
    expect((await sessionAiFlags(engaged(at, { resolved_at: '2026-10-02T09:00:00Z' }) as never, SESSION)).instantReply).toBe(true);
    expect((await sessionAiFlags(engaged(at, { status: 'closed' }) as never, SESSION)).instantReply).toBe(true);
    expect((await sessionAiFlags(engaged(at) as never, SESSION)).instantReply).toBe(false);
  });

  it('시험 모드의 시험 대화: instantReply 와 고지', async () => {
    process.env.CHAT_AI = 'test';
    process.env.CHAT_AI_NOTICE = 'on';
    expect(await sessionAiFlags(engaged(null) as never, TEST_SESSION)).toEqual({
      instantReply: true,
      assistantNotice: true,
    });
  });

  it('새 컬럼을 읽지 못하면(043 미적용) 둘 다 false — 화면은 지금처럼 보인다', async () => {
    process.env.CHAT_AI = 'on';
    process.env.CHAT_AI_NOTICE = 'on';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = fakeAdmin(() => ({ error: { code: '42703' } }));
    expect(await sessionAiFlags(admin as never, SESSION)).toEqual(OFF);
    expect(warn).toHaveBeenCalled();
  });
});
