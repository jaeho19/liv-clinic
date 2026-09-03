import { NextRequest, NextResponse } from 'next/server';
import { isBusinessHours } from '@/lib/chat/businessHours';
import { pruneSlackEvents, runEscalations } from '@/lib/chat/escalationRunner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 운영 작업 라우트 — Netlify 예약 함수(chat-ops.mts)가 3분마다 호출한다.
 * 공유 시크릿(CHAT_OPS_SECRET)으로만 접근. 영업시간 밖에는 정리만 하고 즉시 끝난다.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CHAT_OPS_SECRET;
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const pruned = await pruneSlackEvents(now);
  if (!isBusinessHours(now)) return NextResponse.json({ ok: true, skipped: 'off_hours', pruned });

  const result = await runEscalations(now);
  return NextResponse.json({ ok: true, ...result, pruned });
}
