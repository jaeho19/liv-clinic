import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Database } from '@/types/supabase';
import { z } from 'zod';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];

// 지원 로케일 (11개) — i18n/routing.ts LOCALES와 일치
const LOCALE_ENUM = [
  'ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar',
] as const;

// 후기 제출 스키마 (reviews 테이블 제약 반영)
const reviewSubmitSchema = z.object({
  locale: z.enum(LOCALE_ENUM),
  author_name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  country: z.string().trim().max(60).optional(),
  rating: z.number().int().min(1).max(5),
  treatment_category: z.string().trim().min(1).max(60),
  content: z
    .string()
    .trim()
    .min(10, 'Review is too short')
    .max(2000, 'Review is too long'),
  consent: z.boolean().refine((v) => v === true, { message: 'Consent is required' }),
  // 서버에서 항상 'onsite'로 덮어쓰므로 클라이언트 값은 받되 무시한다.
  source: z.string().optional(),
  // 허니팟: 정상 사용자는 비워두는 숨김 필드 (아래에서 원본 body로 우선 검사)
  company: z.string().optional(),
});

// 모듈 레벨 인메모리 rate limit (best-effort; 서버리스에서는 인스턴스별로 유지됨)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10분
const RATE_LIMIT_MAX = 5;
const submissionLog = new Map<string, number[]>();

/** 최근 10분 내 제출 횟수가 한도를 넘으면 true. 통과 시 현재 타임스탬프를 기록한다. */
function registerAndCheckRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionLog.get(ip) ?? []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    submissionLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissionLog.set(ip, recent);
  return false;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() || 'unknown' : 'unknown';
}

// POST: 공개 후기 제출 (게시 전 모더레이션 대기 상태로 저장)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 허니팟: 숨김 필드(company)가 채워졌다면 봇 — 검증/삽입 없이 조용히 성공 응답
    if (typeof body?.company === 'string' && body.company.trim().length > 0) {
      return NextResponse.json({ success: true, message: 'pending' }, { status: 200 });
    }

    const parsed = reviewSubmitSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    // 검증을 통과한 실제 제출만 rate limit에 계상한다.
    if (registerAndCheckRateLimit(clientIp(request))) {
      return NextResponse.json({ success: false }, { status: 429 });
    }

    const data = parsed.data;
    const country = data.country && data.country.length > 0 ? data.country : null;

    const admin = createAdminClient();
    const { error } = await admin.from('reviews').insert({
      locale: data.locale,
      author_name: data.author_name,
      country,
      rating: data.rating,
      treatment_category: data.treatment_category,
      content: data.content,
      source: 'onsite', // 서버 강제: 공개 폼 제출은 항상 onsite
      is_published: false,
      is_verified: false,
    });

    if (error) {
      console.error('Review insert error:', error);
      return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }

    // 게시(모더레이션 승인) 후 노출된다는 의미
    return NextResponse.json({ success: true, message: 'pending moderation' }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

// GET: 공개 후기 목록 (게시된 항목만, 최신순)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limitRaw = Number.parseInt(searchParams.get('limit') ?? '12', 10);
    const offsetRaw = Number.parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 12;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
    const category = searchParams.get('category');

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    let query = supabase.from('reviews').select('*').eq('is_published', true);
    if (category) {
      query = query.eq('treatment_category', category);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Reviews GET error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    return NextResponse.json((data ?? []) as ReviewRow[], {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// OPTIONS 메서드 (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
  );
}
