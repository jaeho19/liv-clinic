import { NextRequest, NextResponse } from 'next/server';
import { runAiSummaries } from '@/lib/chat/ai/aiSummary';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';
import { runFollowupDigest } from '@/lib/chat/followupDigest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 운영 작업 라우트 — Netlify 예약 함수(chat-ops.mts)가 3분마다(매일 24시간 — 2026-10-22부터) 호출한다.
 * 공유 시크릿(CHAT_OPS_SECRET)으로만 접근.
 * 영업시간 밖(휴진일 포함): 정리 + AI 응대 요약(스펙 2026-10-22 chat-ai-slack-transcript §2 — AI는 밤에도 답한다)만 하고 끝난다.
 * 영업시간 중: AI 응대 요약과 미응답 확대 알림(기본 꺼짐 — CHAT_ESCALATION=on 일 때만)을 함께 → '오늘 연락할 손님' 요약(하루 두 번, 창 안에서만).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CHAT_OPS_SECRET;
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pruned = await pruneSlackEvents(now);
  if (!isBusinessHours(now)) {
    const summaries = await runAiSummaries(now);
    return NextResponse.json({ ok: true, skipped: 'off_hours', pruned, summaries });
  }

  // 예약 함수가 25초까지만 기다리므로 요약(AI 호출 최대 15초)과 확대 알림을 함께 돌린다
  const [summaries, result] = await Promise.all([runAiSummaries(now), runEscalations(now)]);
  const digest = await runFollowupDigest(now);
  return NextResponse.json({ ok: true, ...result, pruned, summaries, digest });
}
