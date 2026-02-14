import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/inventory/transactions - 트랜잭션 이력 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const txType = searchParams.get('type') ?? undefined;
  const itemId = searchParams.get('itemId') ?? undefined;
  const dateFrom = searchParams.get('dateFrom') ?? undefined;
  const dateTo = searchParams.get('dateTo') ?? undefined;
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('get_inventory_transactions', {
      p_type: txType,
      p_item_id: itemId,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
