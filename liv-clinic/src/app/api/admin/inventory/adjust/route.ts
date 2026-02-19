import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

interface AdjustRequest {
  item_id: string;
  new_quantity: number;
  reason: string;
}

// POST /api/admin/inventory/adjust - 수량 보정 (직접 수정)
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: AdjustRequest = await request.json();

  if (!body.item_id || body.new_quantity == null || body.new_quantity < 0) {
    return NextResponse.json({ error: '품목 ID와 수량을 확인해주세요.' }, { status: 400 });
  }
  if (!body.reason || body.reason.trim().length === 0) {
    return NextResponse.json({ error: '수정 사유를 입력해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // 1. 현재 수량 조회
    const { data: item, error: fetchError } = await admin
      .from('inventory_items')
      .select('id, current_stock, name')
      .eq('id', body.item_id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: '해당 품목을 찾을 수 없습니다.' }, { status: 404 });
    }

    const oldQuantity = item.current_stock;
    const newQuantity = body.new_quantity;
    const diff = Math.abs(newQuantity - oldQuantity);

    if (diff === 0) {
      return NextResponse.json({ error: '현재 수량과 동일합니다.' }, { status: 400 });
    }

    // 2. 수량 업데이트
    const { error: updateError } = await admin
      .from('inventory_items')
      .update({ current_stock: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', body.item_id);

    if (updateError) throw new Error(updateError.message);

    // 3. 이력 기록
    const direction = newQuantity > oldQuantity ? '증가' : '감소';
    const note = `[보정] ${body.reason.trim()} (${oldQuantity} → ${newQuantity}, ${direction})`;

    const { data: tx, error: txError } = await admin
      .from('inventory_transactions')
      .insert({
        item_id: body.item_id,
        tx_type: 'adjust',
        quantity: diff,
        note,
        created_by: user.email ?? undefined,
      })
      .select('id')
      .single();

    if (txError) throw new Error(txError.message);

    return NextResponse.json({
      success: true,
      transaction_id: tx?.id,
      old_quantity: oldQuantity,
      new_quantity: newQuantity,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
