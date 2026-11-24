import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { seoulDate } from '@/lib/survey/giftCode';
import {
  isValidGivenOn,
  oldestHeldGivenOn,
  parseRecipient,
  sendAgainOn,
  type GiftRecipientRow,
} from '@/lib/survey/giftRecipients';

/**
 * 답례품 받은 분 명단(관리자). 받은 날부터 90일 동안 설문 링크를 다시 보내지 않으려고 쓴다.
 *   GET              → 최근 90일 명단(받은 날 최신순). 90일 지난 줄은 이때 지운다.
 *   POST { name, phone_last4, given_on? } → 직접 추가(「드림」 때 저장하지 못했거나 잘못 적어 다시 넣을 때)
 *   DELETE ?id=      → 잘못 적은 줄 지우기
 * 「드림」과 함께 적는 것은 /api/admin/survey/gift POST 가 한다. 명단은 답례품 번호·설문 답과 연결되지 않는다.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

function view(row: GiftRecipientRow) {
  return { ...row, send_again_on: sendAgainOn(row.given_on) };
}

export async function GET() {
  try {
    if (!(await requireSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = seoulDate();
    const oldest = oldestHeldGivenOn(today);
    const admin = createAdminClient();

    // 90일이 지난 분은 더 적어 둘 이유가 없다 — 명단을 열 때마다 지운다
    const purge = await admin.from('survey_gift_recipients').delete().lt('given_on', oldest);
    if (purge.error) console.error('GET /api/admin/survey/recipients purge failed:', purge.error);

    const { data, error } = await admin
      .from('survey_gift_recipients')
      .select('id, name, phone_last4, given_on')
      .gte('given_on', oldest)
      .order('given_on', { ascending: false })
      .order('name', { ascending: true })
      .limit(2000);
    if (error) {
      console.error('GET /api/admin/survey/recipients failed:', error);
      return NextResponse.json({ error: '명단을 불러오지 못했습니다.' }, { status: 500 });
    }
    return NextResponse.json({ today, recipients: (data ?? []).map(view) });
  } catch (e) {
    console.error('GET /api/admin/survey/recipients error:', e);
    return NextResponse.json({ error: '명단을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = parseRecipient(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const today = seoulDate();
    const givenOn = body?.given_on ?? today;
    if (!isValidGivenOn(givenOn, today)) {
      return NextResponse.json({ error: '받은 날은 오늘부터 89일 전까지만 적을 수 있어요.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('survey_gift_recipients')
      .insert({ ...parsed.value, given_on: givenOn })
      .select('id, name, phone_last4, given_on')
      .single();
    if (error || !data) {
      console.error('POST /api/admin/survey/recipients failed:', error);
      return NextResponse.json({ error: '명단에 넣지 못했습니다.' }, { status: 500 });
    }
    return NextResponse.json(view(data), { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/survey/recipients error:', e);
    return NextResponse.json({ error: '명단에 넣지 못했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(request.url).searchParams.get('id') ?? '';
    if (!UUID_RE.test(id)) return NextResponse.json({ error: '지울 줄을 찾지 못했습니다.' }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin.from('survey_gift_recipients').delete().eq('id', id).select('id');
    if (error) {
      console.error('DELETE /api/admin/survey/recipients failed:', error);
      return NextResponse.json({ error: '지우지 못했습니다.' }, { status: 500 });
    }
    return NextResponse.json({ deleted: data?.length ?? 0 });
  } catch (e) {
    console.error('DELETE /api/admin/survey/recipients error:', e);
    return NextResponse.json({ error: '지우지 못했습니다.' }, { status: 500 });
  }
}
