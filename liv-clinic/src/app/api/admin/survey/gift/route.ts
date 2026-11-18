import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { giftCodeLastDay, giftCodeStatus, normalizeGiftCode, seoulDate } from '@/lib/survey/giftCode';

/**
 * 답례품 번호 확인(데스크).
 *   GET  ?code=K7P3QD  → 번호 상태(없음·쓸 수 있음·이미 드림·기간 지남)
 *   POST { code }      → 「드림」 표시. 쓸 수 있는 번호일 때만 바뀐다(두 번 누르거나 동시에 눌러도 한 번만).
 * 번호는 응답과 연결돼 있지 않아 여기서는 답 내용을 볼 수 없다.
 */

type GiftRow = { code: string; issued_on: string; redeemed_at: string | null };

function view(row: GiftRow | null, code: string) {
  if (!row) return { code, status: 'none' as const };
  return {
    code: row.code,
    status: giftCodeStatus(row, seoulDate()),
    issued_on: row.issued_on,
    last_day: giftCodeLastDay(row.issued_on),
    redeemed_at: row.redeemed_at,
  };
}

async function requireSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function findCode(code: string): Promise<{ row: GiftRow | null; error: unknown }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('survey_gift_codes')
    .select('code, issued_on, redeemed_at')
    .eq('code', code)
    .maybeSingle();
  return { row: data, error };
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const code = normalizeGiftCode(new URL(request.url).searchParams.get('code') ?? '');
    if (!code) return NextResponse.json({ error: '번호는 영문·숫자 6자리예요.' }, { status: 400 });

    const { row, error } = await findCode(code);
    if (error) {
      console.error('GET /api/admin/survey/gift failed:', error);
      return NextResponse.json({ error: '번호를 확인하지 못했습니다.' }, { status: 500 });
    }
    return NextResponse.json(view(row, code));
  } catch (e) {
    console.error('GET /api/admin/survey/gift error:', e);
    return NextResponse.json({ error: '번호를 확인하지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const code = normalizeGiftCode(typeof body?.code === 'string' ? body.code : '');
    if (!code) return NextResponse.json({ error: '번호는 영문·숫자 6자리예요.' }, { status: 400 });

    const { row, error } = await findCode(code);
    if (error) {
      console.error('POST /api/admin/survey/gift lookup failed:', error);
      return NextResponse.json({ error: '번호를 확인하지 못했습니다.' }, { status: 500 });
    }
    if (!row || giftCodeStatus(row, seoulDate()) !== 'unused') {
      return NextResponse.json(view(row, code), { status: 409 });
    }

    // redeemed_at IS NULL 조건으로 동시에 두 번 눌러도 한 번만 바뀐다
    const admin = createAdminClient();
    const { data, error: updateError } = await admin
      .from('survey_gift_codes')
      .update({ redeemed_at: new Date().toISOString() })
      .eq('code', code)
      .is('redeemed_at', null)
      .select('code, issued_on, redeemed_at')
      .maybeSingle();
    if (updateError) {
      console.error('POST /api/admin/survey/gift update failed:', updateError);
      return NextResponse.json({ error: '「드림」 표시를 하지 못했습니다.' }, { status: 500 });
    }
    if (!data) {
      const again = await findCode(code);
      return NextResponse.json(view(again.row, code), { status: 409 });
    }
    return NextResponse.json(view(data, code));
  } catch (e) {
    console.error('POST /api/admin/survey/gift error:', e);
    return NextResponse.json({ error: '「드림」 표시를 하지 못했습니다.' }, { status: 500 });
  }
}
