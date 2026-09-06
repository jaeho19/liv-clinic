import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { eventIndexNowUrls, notifyIndexNow } from '@/lib/indexnow';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('events')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 수정·발행·비공개 전환 모두 재크롤 대상 — 비공개는 상세가 404가 되므로 그것도 알린다
  await notifyIndexNow(eventIndexNowUrls(data?.slug));
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // 삭제 전에 슬러그를 확보해야 사라진 상세 URL을 IndexNow에 알릴 수 있다
  const { data: existing } = await admin.from('events').select('slug').eq('id', id).maybeSingle();
  const { error } = await admin.from('events').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await notifyIndexNow(eventIndexNowUrls(existing?.slug));
  return NextResponse.json({ success: true });
}
