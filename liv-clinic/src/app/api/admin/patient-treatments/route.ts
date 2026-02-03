import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('patient_treatments')
    .select('*', { count: 'exact' })
    .order('treated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`patient_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // next_notification_at 자동 계산
  if (body.treated_at && body.notification_cycle_days) {
    const treatedDate = new Date(body.treated_at);
    treatedDate.setDate(treatedDate.getDate() + body.notification_cycle_days);
    body.next_notification_at = treatedDate.toISOString();
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('patient_treatments').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
