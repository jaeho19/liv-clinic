import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

function toCamelCase(r: Record<string, unknown>) {
  return {
    id: r.id,
    roomId: r.room_id,
    patientName: r.patient_name,
    phoneNumber: r.phone_number,
    treatmentType: r.treatment_type,
    status: r.status,
    location: r.location,
    doctor: r.doctor,
    procedure: r.procedure_name,
    actualStart: r.actual_start,
    expectedDurationMin: r.expected_duration_min,
    memo: r.memo,
    parentCaseId: r.parent_case_id,
    priceKrw: r.price_krw,
    discountKrw: r.discount_krw,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  };
}

// PATCH /api/admin/operations/[id] - 케이스 업데이트 (상태, 위치, 시작시간 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 요청에 포함된 필드만 업데이트 객체에 추가
  const updateObj: Record<string, unknown> = {};
  if (body.roomId !== undefined) updateObj.room_id = body.roomId;
  if (body.patientName !== undefined) updateObj.patient_name = body.patientName;
  if (body.phoneNumber !== undefined) updateObj.phone_number = body.phoneNumber;
  if (body.treatmentType !== undefined) updateObj.treatment_type = body.treatmentType;
  if (body.status !== undefined) updateObj.status = body.status;
  if (body.location !== undefined) updateObj.location = body.location;
  if (body.doctor !== undefined) updateObj.doctor = body.doctor;
  if (body.procedure !== undefined) updateObj.procedure_name = body.procedure;
  if (body.actualStart !== undefined) updateObj.actual_start = body.actualStart;
  if (body.expectedDurationMin !== undefined) updateObj.expected_duration_min = body.expectedDurationMin;
  if (body.memo !== undefined) updateObj.memo = body.memo;
  if (body.priceKrw !== undefined) updateObj.price_krw = body.priceKrw;
  if (body.discountKrw !== undefined) updateObj.discount_krw = body.discountKrw;
  if (body.paymentMethod !== undefined) updateObj.payment_method = body.paymentMethod;
  if (body.paymentStatus !== undefined) updateObj.payment_status = body.paymentStatus;

  try {
    // If completing, check current status first to prevent duplicate deduction
    let previousStatus: string | null = null;
    if (body.status === 'COMPLETED') {
      const { data: current } = await admin
        .from('operation_cases')
        .select('status')
        .eq('id', id)
        .single();
      previousStatus = current?.status ?? null;
    }

    const { data, error } = await admin
      .from('operation_cases')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }
      throw error;
    }

    // Auto-deduct inventory when case is completed
    let inventoryDeducted: { success: boolean; items: string[]; errors: string[] } | undefined;
    if (body.status === 'COMPLETED' && data.procedure_name && previousStatus !== 'COMPLETED') {
      inventoryDeducted = { success: true, items: [], errors: [] };
      try {
        const { data: recipes, error: recipeErr } = await admin.rpc('get_procedure_recipes', {
          p_procedure: data.procedure_name,
        });
        if (recipeErr) throw recipeErr;
        const recipeList = (recipes as { id: string; procedure_name: string; item_id: string; item_name: string; default_qty: number; note: string | null }[]) || [];

        for (const recipe of recipeList) {
          try {
            await admin.rpc('use_inventory_item', {
              p_item_id: recipe.item_id,
              p_quantity: recipe.default_qty,
              p_patient_name: data.patient_name ?? undefined,
              p_chart_number: undefined,
              p_note: `자동차감: ${data.procedure_name}`,
              p_confirmed_by: undefined,
              p_created_by: session.user.email ?? undefined,
            });
            inventoryDeducted.items.push(recipe.item_name || recipe.item_id);
          } catch (itemErr: unknown) {
            const itemMsg = itemErr instanceof Error ? itemErr.message : 'Unknown error';
            inventoryDeducted.errors.push(`${recipe.item_name || recipe.item_id}: ${itemMsg}`);
          }
        }
        if (inventoryDeducted.errors.length > 0) inventoryDeducted.success = false;
      } catch {
        // Recipe fetch failed — skip deduction, case completion still succeeds
        inventoryDeducted.success = false;
        inventoryDeducted.errors.push('레시피 조회 실패');
      }
    }

    const result = toCamelCase(data);
    return NextResponse.json(inventoryDeducted ? { ...result, inventoryDeducted } : result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/operations/[id] - 케이스 삭제
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
      .from('operation_cases')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
