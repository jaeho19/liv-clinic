import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/inventory/batches?item_id=xxx
// 또는 GET /api/admin/inventory/batches?all=true (전체 아이템 earliest expiry)
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');
  const all = searchParams.get('all');

  const admin = createAdminClient();

  try {
    if (itemId) {
      // 특정 아이템의 배치 목록 (FIFO 정렬)
      const { data, error } = await admin
        .from('inventory_batches' as any)
        .select('*')
        .eq('item_id', itemId)
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('received_at', { ascending: true });

      if (error) throw new Error(error.message);
      return NextResponse.json({ batches: data || [] });
    }

    if (all === 'true') {
      // 전체 배치 (잔여 수량 > 0만, earliest expiry 계산용)
      const { data, error } = await admin
        .from('inventory_batches' as any)
        .select('item_id, expiry_date, remaining_quantity')
        .gt('remaining_quantity', 0)
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true }) as { data: { item_id: string; expiry_date: string; remaining_quantity: number }[] | null; error: any };

      if (error) throw new Error(error.message);

      // 아이템별 earliest expiry 계산
      const expiryMap: Record<string, string> = {};
      for (const batch of data || []) {
        if (batch.expiry_date && !expiryMap[batch.item_id]) {
          expiryMap[batch.item_id] = batch.expiry_date;
        }
      }
      return NextResponse.json({ expiryMap });
    }

    return NextResponse.json({ error: 'item_id 또는 all=true 파라미터가 필요합니다.' }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory/batches - 새 배치 등록
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { item_id, batch_quantity, expiry_date, received_at, note } = body;

  if (!item_id || !batch_quantity || batch_quantity <= 0) {
    return NextResponse.json({ error: '품목 ID와 수량을 확인해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // 1. 배치 등록
    const { data: batch, error: batchErr } = await admin
      .from('inventory_batches' as any)
      .insert({
        item_id,
        batch_quantity,
        remaining_quantity: batch_quantity,
        expiry_date: expiry_date || null,
        received_at: received_at || new Date().toISOString().split('T')[0],
        note: note || null,
      })
      .select()
      .single();

    if (batchErr) throw new Error(batchErr.message);

    // 2. 재고 수량 증가 (restock RPC 호출)
    const { error: restockErr } = await admin.rpc('restock_inventory_item', {
      p_item_id: item_id,
      p_quantity: batch_quantity,
      p_note: `배치 입고${expiry_date ? ` (유효기간: ${expiry_date})` : ''}${note ? ` - ${note}` : ''}`,
      p_created_by: user.email ?? undefined,
    });

    if (restockErr) throw new Error(restockErr.message);

    return NextResponse.json({ success: true, batch }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
