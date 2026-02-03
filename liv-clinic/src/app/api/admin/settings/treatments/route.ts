import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/settings/treatments - 시술 마스터 목록
export async function GET() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT id, name, category, price_range, duration, is_active, created_at
      FROM treatment_masters
      ORDER BY
        CASE category
          WHEN 'lifting' THEN 1
          WHEN 'antiaging' THEN 2
          WHEN 'laser' THEN 3
          WHEN 'skincare' THEN 4
        END,
        name ASC
    `;

    const treatments = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      priceRange: r.price_range,
      duration: r.duration,
      isActive: r.is_active,
    }));

    return NextResponse.json(treatments);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/settings/treatments - 시술 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const sql = getDb();

  try {
    const [row] = await sql`
      INSERT INTO treatment_masters (name, category, price_range, duration, is_active)
      VALUES (${body.name}, ${body.category}, ${body.priceRange || '-'}, ${body.duration || 30}, ${body.isActive ?? true})
      RETURNING *
    `;

    return NextResponse.json({
      id: row.id,
      name: row.name,
      category: row.category,
      priceRange: row.price_range,
      duration: row.duration,
      isActive: row.is_active,
    }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
