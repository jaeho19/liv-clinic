import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// PATCH /api/admin/settings/staff/[id] - 직원 수정
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
      UPDATE staff_members SET
        name = COALESCE(${body.name ?? null}, name),
        email = COALESCE(${body.email ?? null}, email),
        role = COALESCE(${body.role ?? null}, role),
        position = COALESCE(${body.position ?? null}, position),
        is_active = ${body.isActive !== undefined ? body.isActive : sql`is_active`}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      position: updated.position,
      isActive: updated.is_active,
      createdAt: updated.created_at instanceof Date
        ? updated.created_at.toISOString().split('T')[0]
        : String(updated.created_at).split('T')[0],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
