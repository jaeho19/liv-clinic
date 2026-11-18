import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { surveySubmissionSchema, toSurveyResponseInsert } from '@/lib/survey/schema';
import { generateGiftCode } from '@/lib/survey/giftCode';

/**
 * POST /api/survey — 내원객 만족도 설문 제출(익명). 응답을 저장하고 답례품 번호를 하나 발급한다.
 *
 * - 답례품 번호는 응답과 따로 저장한다(survey_gift_codes 에 응답 id 없음) — 데스크에서 번호를 확인해도
 *   그 손님이 어떤 답을 했는지 알 수 없게.
 * - 같은 휴대폰의 다시 내기는 화면이 막는다(localStorage). 여기서는 봇·연타만 막는다:
 *   허니팟(website) + IP당 10분 20건. 병원 와이파이는 손님들이 같은 IP 라 후기(10분 5건)보다 넉넉하게 둔다.
 */

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const submissionLog = new Map<string, number[]>();

function registerAndCheckRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionLog.get(ip) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
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

const UNIQUE_VIOLATION = '23505';

async function issueGiftCode(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateGiftCode();
    const { error } = await admin.from('survey_gift_codes').insert({ code });
    if (!error) return code;
    if (error.code !== UNIQUE_VIOLATION) {
      console.error('survey gift code insert failed:', error);
      return null;
    }
  }
  console.error('survey gift code: 5 collisions in a row');
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    // 허니팟: 숨김 칸이 채워졌으면 봇 — 저장 없이 성공처럼 답한다
    if (body && typeof body.website === 'string' && body.website.trim().length > 0) {
      return NextResponse.json({ success: true, code: null }, { status: 201 });
    }

    const parsed = surveySubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'invalid' }, { status: 400 });
    }

    if (registerAndCheckRateLimit(clientIp(request))) {
      return NextResponse.json({ success: false, error: 'rate_limited' }, { status: 429 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('survey_responses').insert(toSurveyResponseInsert(parsed.data));
    if (error) {
      console.error('survey response insert failed:', error);
      return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
    }

    // 번호 발급이 실패해도 응답은 저장됐으므로 성공으로 답한다(화면이 「데스크에 이 화면을 보여 주세요」를 띄운다)
    const code = await issueGiftCode(admin);
    return NextResponse.json({ success: true, code }, { status: 201 });
  } catch (error) {
    console.error('POST /api/survey error:', error);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
