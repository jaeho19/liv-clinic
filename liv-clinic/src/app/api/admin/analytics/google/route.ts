import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { fetchGA4Analytics } from '@/lib/ga4-queries';
import type { AnalyticsPeriod, GA4AnalyticsData } from '@/types/analytics';

// 15-minute in-memory cache
let cache: { data: GA4AnalyticsData; expiresAt: number } | null = null;
let cachedPeriod: AnalyticsPeriod | null = null;

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') || '30d') as AnalyticsPeriod;

  if (!['7d', '30d', '90d'].includes(period)) {
    return NextResponse.json({ error: 'Invalid period. Use 7d, 30d, or 90d' }, { status: 400 });
  }

  // Check env vars
  if (!process.env.GA4_PROPERTY_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({
      error: 'GA4_NOT_CONFIGURED',
      message: 'Google Analytics 연동이 설정되지 않았습니다. .env.local에 GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY를 설정해주세요.',
    }, { status: 503 });
  }

  // Return cached data if valid
  if (cache && cachedPeriod === period && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  try {
    const data = await fetchGA4Analytics(period);

    // Update cache
    cache = { data, expiresAt: Date.now() + CACHE_TTL };
    cachedPeriod = period;

    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';

    if (msg === 'GA4_CREDENTIALS_MISSING' || msg === 'GA4_PROPERTY_ID_MISSING') {
      return NextResponse.json({
        error: 'GA4_NOT_CONFIGURED',
        message: 'Google Analytics 인증 정보가 누락되었습니다.',
      }, { status: 503 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
