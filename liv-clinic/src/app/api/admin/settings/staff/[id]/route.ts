import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

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
  const admin = createAdminClient();

  const updateObj: Record<string, unknown> = {};
  if (body.name !== undefined) updateObj.name = body.name;
  if (body.email !== undefined) updateObj.email = body.email;
  if (body.role !== undefined) updateObj.role = body.role;
  if (body.position !== undefined) updateObj.position = body.position;
  if (body.isActive !== undefined) updateObj.is_active = body.isActive;

  try {
    const { data, error } = await admin
      .from('staff_members')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
      }
      throw error;
    }

    const createdAt = data.created_at;
    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      position: data.position,
      isActive: data.is_active,
      createdAt: typeof createdAt === 'string'
        ? createdAt.split('T')[0]
        : String(createdAt).split('T')[0],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
