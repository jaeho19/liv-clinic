import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/inventory/recipes - 시술 레시피 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const procedureName = searchParams.get('procedure');
  const sql = getDb();

  try {
    const rows = await sql`
      SELECT
        r.id, r.procedure_name, r.item_id, r.default_qty, r.note,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'category', i.category,
          'unit', i.unit,
          'current_stock', i.current_stock
        ) as item
      FROM procedure_recipes r
      JOIN inventory_items i ON i.id = r.item_id
      WHERE ${procedureName ? sql`r.procedure_name = ${procedureName}` : sql`true`}
      ORDER BY r.procedure_name, r.id
    `;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory/recipes - 레시피 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const sql = getDb();

  try {
    const [recipe] = await sql`
      WITH new_recipe AS (
        INSERT INTO procedure_recipes (procedure_name, item_id, default_qty, note)
        VALUES (${body.procedure_name}, ${body.item_id}, ${body.default_qty || 1}, ${body.note || null})
        RETURNING *
      )
      SELECT
        r.id, r.procedure_name, r.item_id, r.default_qty, r.note,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'category', i.category,
          'unit', i.unit
        ) as item
      FROM new_recipe r
      JOIN inventory_items i ON i.id = r.item_id
    `;
    return NextResponse.json(recipe, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
