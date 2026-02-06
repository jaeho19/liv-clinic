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
  const body = await request.json();
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

  try {
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

    return NextResponse.json(toCamelCase(data));
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
