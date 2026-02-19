import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { DEVICE_INITIAL_SHOTS } from '@/types/admin';
import type { DeviceType } from '@/types/admin';

// GET /api/admin/inventory/shots — 팁 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const deviceType = searchParams.get('device_type') as DeviceType | null;
  const activeOnly = searchParams.get('active_only') !== 'false';
  const includeLogs = searchParams.get('include_logs') === 'true';

  const admin = createAdminClient();

  try {
    let query = admin
      .from('device_tip_shots' as any)
      .select('*')
      .order('registered_at', { ascending: false });

    if (deviceType) query = query.eq('device_type', deviceType);
    if (activeOnly) query = query.eq('is_active', true);

    const { data: tips, error } = await query as { data: any[] | null; error: any };
    if (error) throw new Error(error.message);

    if (includeLogs && tips && tips.length > 0) {
      const tipIds = tips.map((t: any) => t.id);
      const { data: logs, error: logErr } = await admin
        .from('device_shot_logs' as any)
        .select('*')
        .in('tip_id', tipIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logErr) throw new Error(logErr.message);

      return NextResponse.json({ tips, logs: logs ?? [] });
    }

    return NextResponse.json({ tips: tips ?? [], logs: [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory/shots — 새 팁 등록
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { item_id, tip_type, device_type } = body as {
    item_id: string;
    tip_type: string;
    device_type: DeviceType;
  };

  if (!item_id || !tip_type || !device_type) {
    return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
  }

  const initialShots = DEVICE_INITIAL_SHOTS[device_type]?.[tip_type];
  if (!initialShots) {
    return NextResponse.json(
      { error: `지원하지 않는 팁 종류입니다: ${device_type}/${tip_type}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('device_tip_shots' as any)
      .insert({
        item_id,
        tip_type,
        device_type,
        initial_shots: initialShots,
        remaining_shots: initialShots,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
