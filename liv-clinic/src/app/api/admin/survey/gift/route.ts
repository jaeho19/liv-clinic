import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { giftCodeLastDay, giftCodeStatus, normalizeGiftCode, seoulDate } from '@/lib/survey/giftCode';
import { parseRecipient } from '@/lib/survey/giftRecipients';

/**
 * 답례품 번호 확인(데스크).
 *   GET  ?code=K7P3QD  → 번호 상태(없음·쓸 수 있음·이미 드림·기간 지남)
 *   POST { code, name, phone_last4 } → 「드림」 표시. 쓸 수 있는 번호일 때만 바뀐다(두 번 누르거나 동시에 눌러도 한 번만).
 *        받은 분(이름·휴대폰 뒤 4자리)은 「답례품 받은 분」 명단(048)에 따로 적는다 — 90일 동안 설문 링크를 다시 보내지 않으려고.
 *        명단에는 번호를 남기지 않는다. 번호 「드림」 뒤 명단 저장만 실패하면 recipient_saved: false 로 알린다.
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
    // 받은 분을 적지 않으면 「드림」 하지 않는다 — 명단이 비면 90일 규칙을 지킬 수 없다
    const recipient = parseRecipient(body);
    if (!recipient.ok) return NextResponse.json({ error: recipient.error }, { status: 400 });

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

    // 번호는 이미 「드림」이 됐다. 명단 저장이 실패해도 되돌리지 않고 화면에 직접 추가하라고 알린다.
    const saved = await admin
      .from('survey_gift_recipients')
      .insert({ ...recipient.value, given_on: seoulDate() });
    if (saved.error) console.error('POST /api/admin/survey/gift recipient insert failed:', saved.error);
    return NextResponse.json({ ...view(data, code), recipient_saved: !saved.error });
  } catch (e) {
    console.error('POST /api/admin/survey/gift error:', e);
    return NextResponse.json({ error: '「드림」 표시를 하지 못했습니다.' }, { status: 500 });
  }
}
