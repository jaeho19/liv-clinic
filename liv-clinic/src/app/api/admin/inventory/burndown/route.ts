import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { calculateBurndown } from '@/lib/inventory-utils';

// GET /api/admin/inventory/burndown - 소진 예측 데이터
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // 1. All active inventory items
  const { data: items, error: itemsError } = await admin
    .from('inventory_items')
    .select('*')
    .eq('is_active', true)
    .order('category');

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // 2. Recent 30 days of 'use' transactions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions } = await admin
    .from('inventory_transactions')
    .select('item_id, tx_type, quantity, created_at')
    .eq('tx_type', 'use')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const txMap = new Map<string, { tx_type: string; quantity: number; created_at: string }[]>();
  for (const tx of transactions || []) {
    const list = txMap.get(tx.item_id) || [];
    list.push(tx);
    txMap.set(tx.item_id, list);
  }

  // 3. Calculate burndown for each item
  const burndownItems = (items || []).map((item) => {
    const itemTx = txMap.get(item.id) || [];
    const burndown = calculateBurndown(item.current_stock, itemTx, 30);
    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      minStock: item.min_stock,
      unitPrice: item.unit_price,
      unit: item.unit,
      ...burndown,
    };
  });

  // 4. Category summary
  const categoryMap = new Map<string, {
    totalItems: number;
    totalValue: number;
    criticalCount: number;
    warningCount: number;
  }>();

  for (const item of burndownItems) {
    const existing = categoryMap.get(item.category) || {
      totalItems: 0,
      totalValue: 0,
      criticalCount: 0,
      warningCount: 0,
    };
    existing.totalItems++;
    existing.totalValue += item.currentStock * item.unitPrice;
    if (item.severity === 'critical') existing.criticalCount++;
    if (item.severity === 'warning') existing.warningCount++;
    categoryMap.set(item.category, existing);
  }

  const categorySummary = [...categoryMap.entries()].map(([category, data]) => ({
    category,
    ...data,
  }));

  return NextResponse.json({
    items: burndownItems,
    categorySummary,
  });
}
