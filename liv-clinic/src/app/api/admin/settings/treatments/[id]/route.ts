import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// PATCH /api/admin/settings/treatments/[id] - 시술 수정
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
      UPDATE treatment_masters SET
        name = COALESCE(${body.name ?? null}, name),
        category = COALESCE(${body.category ?? null}, category),
        price_range = COALESCE(${body.priceRange ?? null}, price_range),
        duration = COALESCE(${body.duration ?? null}::integer, duration),
        is_active = ${body.isActive !== undefined ? body.isActive : sql`is_active`}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      category: updated.category,
      priceRange: updated.price_range,
      duration: updated.duration,
      isActive: updated.is_active,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/settings/treatments/[id] - 시술 삭제
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
    await sql`DELETE FROM treatment_masters WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
