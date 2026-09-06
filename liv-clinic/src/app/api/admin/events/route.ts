import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { eventIndexNowUrls, notifyIndexNow } from '@/lib/indexnow';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin.from('events').insert(body).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 발행된 이벤트면 Bing(IndexNow)에 새 페이지를 알린다 — 실패해도 응답은 막지 않는다
  if (data?.is_published) await notifyIndexNow(eventIndexNowUrls(data.slug));
  return NextResponse.json(data, { status: 201 });
}
