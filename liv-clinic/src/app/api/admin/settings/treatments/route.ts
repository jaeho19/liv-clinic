import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

const CATEGORY_ORDER: Record<string, number> = { lifting: 1, antiaging: 2, laser: 3, skincare: 4 };

function formatTreatment(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    priceRange: r.price_range,
    duration: r.duration,
    isActive: r.is_active,
    defaultCycleDays: r.default_cycle_days ?? null,
    notificationTemplateId: r.notification_template_id ?? null,
  };
}

// GET /api/admin/settings/treatments - 시술 마스터 목록
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('treatment_masters')
      .select('id, name, category, price_range, duration, is_active, default_cycle_days, notification_template_id, created_at')
      .order('name', { ascending: true });

    if (error) throw error;

    // 카테고리 순서대로 정렬 (Supabase에서 CASE 정렬 불가 → JS에서 처리)
    const sorted = (data || []).sort((a, b) => {
      const ca = CATEGORY_ORDER[a.category as string] || 99;
      const cb = CATEGORY_ORDER[b.category as string] || 99;
      if (ca !== cb) return ca - cb;
      return (a.name as string).localeCompare(b.name as string, 'ko');
    });

    return NextResponse.json(sorted.map(formatTreatment));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/settings/treatments - 시술 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await request.json();

  try {
    const { data, error } = await admin
      .from('treatment_masters')
      .insert({
        name: body.name,
        category: body.category,
        price_range: body.priceRange || '-',
        duration: body.duration || 30,
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(formatTreatment(data), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
