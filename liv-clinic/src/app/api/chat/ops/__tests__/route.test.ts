import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/chat/businessHours', () => ({ isBusinessHours: vi.fn() }));
vi.mock('@/lib/chat/escalationRunner', () => ({ pruneSlackEvents: vi.fn(), runEscalations: vi.fn() }));
vi.mock('@/lib/chat/followupDigest', () => ({ runFollowupDigest: vi.fn() }));
vi.mock('@/lib/chat/ai/aiSummary', () => ({ runAiSummaries: vi.fn() }));

import { NextRequest } from 'next/server';
import { runAiSummaries } from '@/lib/chat/ai/aiSummary';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';
import { runFollowupDigest } from '@/lib/chat/followupDigest';
import { POST } from '../route';

// 스펙 2026-10-22 chat-ai-slack-transcript §2 — AI 응대 요약은 영업시간 밖에도 돈다.
const req = (auth = 'Bearer s3cret') =>
  new NextRequest('https://liv-clinic.net/api/chat/ops', { method: 'POST', headers: { authorization: auth } });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CHAT_OPS_SECRET = 's3cret';
  vi.mocked(pruneSlackEvents).mockResolvedValue(0 as never);
  vi.mocked(runEscalations).mockResolvedValue({ escalated: 0 } as never);
  vi.mocked(runFollowupDigest).mockResolvedValue({ window: null, listed: 0 });
  vi.mocked(runAiSummaries).mockResolvedValue({ summarized: 1, fallback: 0 });
});
afterEach(() => {
  delete process.env.CHAT_OPS_SECRET;
});

describe('POST /api/chat/ops', () => {
  it('영업시간 밖: 정리와 AI 응대 요약만 하고 끝난다', async () => {
    vi.mocked(isBusinessHours).mockReturnValue(false);
    const res = await POST(req());
    expect(await res.json()).toMatchObject({ ok: true, skipped: 'off_hours', summaries: { summarized: 1, fallback: 0 } });
    expect(runAiSummaries).toHaveBeenCalledTimes(1);
    expect(runEscalations).not.toHaveBeenCalled();
    expect(runFollowupDigest).not.toHaveBeenCalled();
  });

  it('영업시간 안: 요약 · 확대 알림 · 오늘 연락할 손님', async () => {
    vi.mocked(isBusinessHours).mockReturnValue(true);
    const res = await POST(req());
    expect(await res.json()).toMatchObject({ ok: true, summaries: { summarized: 1, fallback: 0 }, digest: { window: null, listed: 0 } });
    expect(runAiSummaries).toHaveBeenCalledTimes(1);
    expect(runEscalations).toHaveBeenCalledTimes(1);
    expect(runFollowupDigest).toHaveBeenCalledTimes(1);
  });

  it('시크릿이 틀리면 401, 아무것도 하지 않는다', async () => {
    const res = await POST(req('Bearer nope'));
    expect(res.status).toBe(401);
    expect(runAiSummaries).not.toHaveBeenCalled();
  });
});
