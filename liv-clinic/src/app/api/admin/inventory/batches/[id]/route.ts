import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// PATCH /api/admin/inventory/batches/[id] - 배치 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.remaining_quantity !== undefined) updates.remaining_quantity = body.remaining_quantity;
  if (body.expiry_date !== undefined) updates.expiry_date = body.expiry_date || null;
  if (body.note !== undefined) updates.note = body.note || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from('inventory_batches' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, batch: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/inventory/batches/[id] - 배치 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  try {
    // 1. 배치 정보 조회
    const { data: batch, error: fetchErr } = await admin
      .from('inventory_batches' as any)
      .select('item_id, remaining_quantity')
      .eq('id', id)
      .single() as { data: { item_id: string; remaining_quantity: number } | null; error: any };

    if (fetchErr || !batch) {
      return NextResponse.json({ error: '배치를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 잔여 수량이 있으면 재고에서 차감
    if (batch.remaining_quantity > 0) {
      const { error: adjustErr } = await admin.rpc('use_inventory_item', {
        p_item_id: batch.item_id,
        p_quantity: batch.remaining_quantity,
        p_note: `배치 삭제로 인한 재고 조정`,
        p_created_by: user.email ?? undefined,
      });
      if (adjustErr) throw new Error(adjustErr.message);
    }

    // 3. 배치 삭제
    const { error: delErr } = await admin
      .from('inventory_batches' as any)
      .delete()
      .eq('id', id);

    if (delErr) throw new Error(delErr.message);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
