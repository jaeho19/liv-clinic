import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/settings/staff - 직원 목록
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT id, name, email, role, position, is_active, created_at
      FROM staff_members
      ORDER BY
        CASE role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'staff' THEN 3
        END,
        created_at ASC
    `;

    const staff = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      position: r.position,
      isActive: r.is_active,
      createdAt: typeof r.created_at === 'string'
        ? r.created_at.split('T')[0]
        : r.created_at instanceof Date
          ? r.created_at.toISOString().split('T')[0]
          : r.created_at,
    }));

    return NextResponse.json(staff);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/settings/staff - 직원 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const sql = getDb();

  try {
    const [row] = await sql`
      INSERT INTO staff_members (name, email, role, position, is_active)
      VALUES (${body.name}, ${body.email}, ${body.role || 'staff'}, ${body.position || ''}, ${body.isActive ?? true})
      RETURNING *
    `;

    return NextResponse.json({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      position: row.position,
      isActive: row.is_active,
      createdAt: row.created_at instanceof Date
        ? row.created_at.toISOString().split('T')[0]
        : String(row.created_at).split('T')[0],
    }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
