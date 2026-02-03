import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/inventory - 품목 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const stockStatus = searchParams.get('stockStatus');
  const showInactive = searchParams.get('showInactive');

  try {
    const items = await sql`
      SELECT * FROM inventory_items
      WHERE ${showInactive === 'true' ? sql`true` : sql`is_active = true`}
        ${category && category !== 'all' ? sql`AND category = ${category}` : sql``}
        ${search ? sql`AND name ILIKE ${'%' + search + '%'}` : sql``}
        ${stockStatus === 'out' ? sql`AND current_stock <= 0` : sql``}
        ${stockStatus === 'low' ? sql`AND current_stock > 0 AND current_stock <= min_stock` : sql``}
      ORDER BY category, sub_category, name
    `;
    return NextResponse.json(items);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory - 새 품목 등록
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const sql = getDb();

  try {
    const [item] = await sql`
      INSERT INTO inventory_items (
        name, category, sub_category, specification, unit,
        current_stock, min_stock, unit_price, supplier, storage_note
      ) VALUES (
        ${body.name}, ${body.category}, ${body.sub_category || null},
        ${body.specification || null}, ${body.unit || '개'},
        ${body.current_stock || 0}, ${body.min_stock || 0},
        ${body.unit_price || 0}, ${body.supplier || null},
        ${body.storage_note || null}
      ) RETURNING *
    `;
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
