import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// PATCH /api/admin/inventory/[id] - 품목 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('update_inventory_item_by_id', {
      p_id: id,
      p_data: body,
    });

    if (error) {
      if (error.message.includes('Item not found')) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/inventory/[id] - 품목 삭제 (비활성화)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('soft_delete_inventory_item', {
      p_id: id,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? { success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
