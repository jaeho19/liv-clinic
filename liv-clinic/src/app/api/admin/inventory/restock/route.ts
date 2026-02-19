import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

interface RestockRequest {
  item_id: string;
  quantity: number;
  note?: string;
  expiry_date?: string;
}

// POST /api/admin/inventory/restock - 입고 (재고 증가)
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      p_created_by: user.email ?? undefined,
    });

    if (error) throw new Error(error.message);

    // 유효기간이 함께 전달되면 배치 자동 생성
    if (body.expiry_date) {
      await admin.from('inventory_batches' as any).insert({
        item_id: body.item_id,
        batch_quantity: body.quantity,
        remaining_quantity: body.quantity,
        expiry_date: body.expiry_date,
        received_at: new Date().toISOString().split('T')[0],
        note: body.note || null,
      });
    }

    return NextResponse.json({ success: true, transaction_id: data as string }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
