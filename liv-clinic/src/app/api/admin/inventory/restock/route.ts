import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

interface RestockRequest {
  item_id: string;
  quantity: number;
  note?: string;
}

// POST /api/admin/inventory/restock - 입고 (재고 증가)
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: RestockRequest = await request.json();

  if (!body.item_id || !body.quantity || body.quantity <= 0) {
    return NextResponse.json({ error: '품목과 수량을 확인해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('restock_inventory_item', {
      p_item_id: body.item_id,
      p_quantity: body.quantity,
      p_note: body.note ?? undefined,
      p_created_by: session.user.email ?? undefined,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, transaction_id: data as string }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
