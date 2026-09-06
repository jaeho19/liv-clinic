import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { adminReviewInputSchema, toReviewInsert } from '@/lib/reviews/adminReviewInput';
import { notifyIndexNow, reviewIndexNowUrls } from '@/lib/indexnow';

// 관리자 직접 등록(P1-4) — 환자에게 받은 후기를 관리자가 대신 입력한다. source는 항상 'onsite'.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = adminReviewInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin.from('reviews').insert(toReviewInsert(parsed.data)).select().single();
    if (error) {
      console.error('POST /api/admin/reviews failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 후기 페이지(와 후기 0건 로케일의 noindex 판정)를 갱신한다. 실패해도 등록은 성공으로 본다.
    try {
      revalidatePath('/', 'layout');
    } catch (revalidateError) {
      console.warn('revalidatePath after review insert failed:', revalidateError);
    }
    await notifyIndexNow(reviewIndexNowUrls()); // Bing 재크롤 요청 — 실패해도 등록은 성공
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/reviews error:', e);
    return NextResponse.json({ error: '후기 등록에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('reviews')
      .select('*')
      .order('is_published', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/admin/reviews failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/admin/reviews error:', e);
    return NextResponse.json({ error: '후기 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}
