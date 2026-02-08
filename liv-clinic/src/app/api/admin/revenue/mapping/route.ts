import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/revenue/mapping - 매핑 설정 조회
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('clinic_settings')
    .select('csv_column_mapping')
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ mapping: {} });
  }

  return NextResponse.json({ mapping: data?.csv_column_mapping || {} });
}

// PUT /api/admin/revenue/mapping - 매핑 설정 저장
export async function PUT(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await request.json();
  const { mapping } = body;

  if (!mapping || typeof mapping !== 'object') {
    return NextResponse.json({ error: 'mapping 객체가 필요합니다.' }, { status: 400 });
  }

  const { error } = await admin
    .from('clinic_settings')
    .update({ csv_column_mapping: mapping })
    .eq('id', 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mapping });
}
