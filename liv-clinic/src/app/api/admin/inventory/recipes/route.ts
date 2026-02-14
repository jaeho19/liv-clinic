import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/inventory/recipes - 시술 레시피 조회
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const procedureName = searchParams.get('procedure') ?? undefined;

  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('get_procedure_recipes', {
      p_procedure: procedureName,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/inventory/recipes - 레시피 추가
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  try {
    const { data, error } = await admin.rpc('create_procedure_recipe', {
      p_procedure_name: body.procedure_name,
      p_item_id: body.item_id,
      p_default_qty: body.default_qty || 1,
      p_note: body.note ?? undefined,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
