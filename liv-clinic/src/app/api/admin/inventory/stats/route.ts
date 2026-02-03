import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/inventory/stats - 대시보드 통계
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();

  try {
    const items = await sql`
      SELECT id, current_stock, min_stock, unit_price
      FROM inventory_items
      WHERE is_active = true
    `;

    let normal = 0;
    let low = 0;
    let out = 0;
    let totalValue = 0;
    const alertItemIds: string[] = [];

    for (const item of items) {
      totalValue += item.current_stock * item.unit_price;
      if (item.current_stock <= 0) {
        out++;
        alertItemIds.push(item.id);
      } else if (item.current_stock <= item.min_stock) {
        low++;
        alertItemIds.push(item.id);
      } else {
        normal++;
      }
    }

    return NextResponse.json({
      total: items.length,
      normal,
      low,
      out,
      totalValue,
      alertItemIds,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
