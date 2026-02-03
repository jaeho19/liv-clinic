import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

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

  const sql = getDb();

  try {
    const [result] = await sql`
      SELECT restock_inventory_item(
        ${body.item_id}::uuid,
        ${body.quantity}::integer,
        ${body.note || null},
        ${session.user.email || null}
      ) as tx_id
    `;
    return NextResponse.json({ success: true, transaction_id: result.tx_id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
