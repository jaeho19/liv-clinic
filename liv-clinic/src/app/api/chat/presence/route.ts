import { NextResponse } from 'next/server';
import { isBusinessHours, getBusinessHoursConfig } from '@/lib/chat/businessHours';

export const runtime = 'nodejs';

export async function GET() {
  const businessHours = isBusinessHours();
  const config = getBusinessHoursConfig();
  return NextResponse.json({
    online: businessHours, // MVP: presence = 운영시간 가정
    operatorCount: businessHours ? 1 : 0,
    businessHours,
    schedule: config,
  });
}
