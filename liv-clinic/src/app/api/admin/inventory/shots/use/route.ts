import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

interface UseShotsRequest {
  tip_id: string;
  shots_used: number;
  patient_name?: string;
  chart_number?: string;
  procedure_area?: string;
  note?: string;
}

// POST /api/admin/inventory/shots/use — 샷 차감
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: UseShotsRequest = await request.json();

  if (!body.tip_id || !body.shots_used || body.shots_used <= 0) {
    return NextResponse.json({ error: '팁 ID와 사용 샷 수(>0)가 필요합니다.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('use_device_shots' as any, {
      p_tip_id: body.tip_id,
      p_shots_used: body.shots_used,
      p_patient_name: body.patient_name ?? null,
      p_chart_number: body.chart_number ?? null,
      p_procedure_area: body.procedure_area ?? null,
      p_note: body.note ?? null,
      p_created_by: user.email ?? null,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, log_id: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const isInsufficientShots = msg.includes('Insufficient shots');
    const isTipNotFound = msg.includes('Active tip not found');
    const status = isInsufficientShots || isTipNotFound ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
