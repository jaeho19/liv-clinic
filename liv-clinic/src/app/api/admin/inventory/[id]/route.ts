import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

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
  const sql = getDb();

  try {
    const [updated] = await sql`
      UPDATE inventory_items SET
        name = COALESCE(${body.name ?? null}, name),
        category = COALESCE(${body.category ?? null}, category),
        sub_category = ${body.sub_category !== undefined ? body.sub_category : sql`sub_category`},
        specification = ${body.specification !== undefined ? body.specification : sql`specification`},
        unit = COALESCE(${body.unit ?? null}, unit),
        current_stock = COALESCE(${body.current_stock ?? null}::integer, current_stock),
        min_stock = COALESCE(${body.min_stock ?? null}::integer, min_stock),
        unit_price = COALESCE(${body.unit_price ?? null}::integer, unit_price),
        supplier = ${body.supplier !== undefined ? body.supplier : sql`supplier`},
        storage_note = ${body.storage_note !== undefined ? body.storage_note : sql`storage_note`},
        is_active = COALESCE(${body.is_active ?? null}::boolean, is_active)
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
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
  const sql = getDb();

  try {
    await sql`
      UPDATE inventory_items SET is_active = false WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
