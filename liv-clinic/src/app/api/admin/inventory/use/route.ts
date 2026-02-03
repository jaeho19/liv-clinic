import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

interface UseItem {
  item_id: string;
  quantity: number;
}

interface UseRequest {
  items: UseItem[];
  patient_name?: string;
  chart_number?: string;
  note?: string;
  confirmed_by?: string;
}

// POST /api/admin/inventory/use - 물품 사용 (재고 차감)
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: UseRequest = await request.json();

  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: '사용 품목을 선택해주세요.' }, { status: 400 });
  }

  const sql = getDb();
  const txIds: string[] = [];
  const errors: string[] = [];

  for (const item of body.items) {
    try {
      const [result] = await sql`
        SELECT use_inventory_item(
          ${item.item_id}::uuid,
          ${item.quantity}::integer,
          ${body.patient_name || null},
          ${body.chart_number || null},
          ${body.note || null},
          ${body.confirmed_by || null},
          ${session.user.email || null}
        ) as tx_id
      `;
      txIds.push(result.tx_id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`${item.item_id}: ${msg}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: '일부 품목 처리 실패', details: errors, successful: txIds },
      { status: errors.length === body.items.length ? 500 : 207 }
    );
  }

  return NextResponse.json({ success: true, transaction_ids: txIds }, { status: 201 });
}
