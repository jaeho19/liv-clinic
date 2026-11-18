import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { addDays, seoulDate } from '@/lib/survey/giftCode';

/**
 * GET /api/admin/survey?from=YYYY-MM-DD&to=YYYY-MM-DD — 기간(서울 날짜, 양 끝 포함) 안의 설문 응답과
 * 답례품 번호 발급·지급 수. 숫자 계산은 화면이 lib/survey/summary.ts 로 한다.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ROWS = 5000;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const today = seoulDate();
    const to = searchParams.get('to') ?? today;
    const from = searchParams.get('from') ?? addDays(to, -29);
    if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
      return NextResponse.json({ error: '기간을 확인해 주세요.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const [responses, gifts] = await Promise.all([
      admin
        .from('survey_responses')
        .select('*')
        .gte('created_at', `${from}T00:00:00+09:00`)
        .lt('created_at', `${addDays(to, 1)}T00:00:00+09:00`)
        .order('created_at', { ascending: false })
        .limit(MAX_ROWS),
      admin
        .from('survey_gift_codes')
        .select('issued_on, redeemed_at')
        .gte('issued_on', from)
        .lte('issued_on', to)
        .limit(MAX_ROWS),
    ]);

    if (responses.error) {
      console.error('GET /api/admin/survey responses failed:', responses.error);
      return NextResponse.json({ error: '응답을 불러오지 못했습니다.' }, { status: 500 });
    }
    if (gifts.error) {
      console.error('GET /api/admin/survey gifts failed:', gifts.error);
    }

    const giftRows = gifts.data ?? [];
    return NextResponse.json({
      from,
      to,
      responses: responses.data ?? [],
      truncated: (responses.data?.length ?? 0) >= MAX_ROWS,
      gifts: {
        issued: giftRows.length,
        redeemed: giftRows.filter((g) => g.redeemed_at).length,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/survey error:', e);
    return NextResponse.json({ error: '응답을 불러오지 못했습니다.' }, { status: 500 });
  }
}
