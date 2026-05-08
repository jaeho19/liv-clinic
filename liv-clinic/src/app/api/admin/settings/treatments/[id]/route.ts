import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { TablesUpdate } from '@/types/supabase';

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
  const admin = createAdminClient();

  const updateObj: TablesUpdate<'treatment_masters'> = {};
  if (body.name !== undefined) updateObj.name = body.name;
  if (body.category !== undefined) updateObj.category = body.category;
  if (body.priceRange !== undefined) updateObj.price_range = body.priceRange;
  if (body.duration !== undefined) updateObj.duration = body.duration;
  if (body.isActive !== undefined) updateObj.is_active = body.isActive;
  if (body.defaultCycleDays !== undefined) updateObj.default_cycle_days = body.defaultCycleDays;
  if (body.notificationTemplateId !== undefined) updateObj.notification_template_id = body.notificationTemplateId;

  try {
    const { data, error } = await admin
      .from('treatment_masters')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      category: data.category,
      priceRange: data.price_range,
      duration: data.duration,
      isActive: data.is_active,
      defaultCycleDays: data.default_cycle_days ?? null,
      notificationTemplateId: data.notification_template_id ?? null,
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
  const admin = createAdminClient();

  try {
    const { error } = await admin
      .from('treatment_masters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
