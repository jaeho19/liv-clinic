import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/inventory/transactions - 트랜잭션 이력 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const txType = searchParams.get('type');
  const itemId = searchParams.get('itemId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT
        tx.id, tx.item_id, tx.tx_type, tx.quantity,
        tx.patient_name, tx.chart_number, tx.note,
        tx.confirmed_by, tx.created_by, tx.created_at,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'category', i.category,
          'unit', i.unit
        ) as item
      FROM inventory_transactions tx
      JOIN inventory_items i ON i.id = tx.item_id
      WHERE true
        ${txType && txType !== 'all' ? sql`AND tx.tx_type = ${txType}` : sql``}
        ${itemId ? sql`AND tx.item_id = ${itemId}` : sql``}
        ${dateFrom ? sql`AND tx.created_at >= ${dateFrom + 'T00:00:00'}::timestamptz` : sql``}
        ${dateTo ? sql`AND tx.created_at <= ${dateTo + 'T23:59:59'}::timestamptz` : sql``}
      ORDER BY tx.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
