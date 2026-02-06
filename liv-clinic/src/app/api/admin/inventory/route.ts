import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/inventory - 품목 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const stockStatus = searchParams.get('stockStatus') ?? undefined;
  const showInactive = searchParams.get('showInactive') === 'true';

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('get_inventory_items', {
      p_category: category,
      p_search: search,
      p_stock_status: stockStatus,
      p_show_inactive: showInactive,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory - 새 품목 등록
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('create_inventory_item', {
      p_data: {
        name: body.name,
        category: body.category,
        sub_category: body.sub_category || undefined,
        specification: body.specification || undefined,
        unit: body.unit || '개',
        current_stock: body.current_stock || 0,
        min_stock: body.min_stock || 0,
        unit_price: body.unit_price || 0,
        supplier: body.supplier || undefined,
        storage_note: body.storage_note || undefined,
      },
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
