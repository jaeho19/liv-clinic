import { NextResponse } from 'next/server';
import { isBusinessHours, getBusinessHoursConfig, getNextOpenAt } from '@/lib/chat/businessHours';
import { getOnlineOperatorCount } from '@/lib/chat/operatorPresence';

export const runtime = 'nodejs';

export async function GET() {
  const businessHours = isBusinessHours();
  const config = getBusinessHoursConfig();

  let operatorCount = 0;
  let source: 'realtime' | 'businessHours' = 'realtime';

  try {
    operatorCount = await getOnlineOperatorCount();
  } catch (e) {
    // Throw-free: presence 조회 실패해도 200 응답 보장
    console.warn('[presence] heartbeat query failed, fallback to businessHours', e);
    source = 'businessHours';
  }

  // 운영자 카운트 0명이면 backward-compat 폴백 — 운영시간 내라면 online=true
  if (operatorCount === 0 && businessHours) {
    source = 'businessHours';
  }

  const online = operatorCount > 0 || (source === 'businessHours' && businessHours);

  return NextResponse.json({
    online,
    operatorCount,
    businessHours,
    nextOpenAt: getNextOpenAt()?.toISOString() ?? null, // 오프시간 캡처 블록의 복귀 시각 안내용
    schedule: config,
    source, // 신규 필드 (디버깅용, 기존 클라이언트는 무시)
  });
}
