import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

// PATCH /api/admin/operations/[id] - 케이스 업데이트 (상태, 위치, 시작시간 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json();
  const sql = getDb();

  try {
    const [updated] = await sql`
      UPDATE operation_cases SET
        room_id = COALESCE(${body.roomId ?? null}, room_id),
        patient_name = COALESCE(${body.patientName ?? null}, patient_name),
        phone_number = ${body.phoneNumber !== undefined ? body.phoneNumber : sql`phone_number`},
        treatment_type = COALESCE(${body.treatmentType ?? null}::treatment_type, treatment_type),
        status = COALESCE(${body.status ?? null}::case_status, status),
        location = COALESCE(${body.location ?? null}::case_location, location),
        doctor = COALESCE(${body.doctor ?? null}, doctor),
        procedure_name = COALESCE(${body.procedure ?? null}, procedure_name),
        actual_start = ${body.actualStart !== undefined ? body.actualStart : sql`actual_start`},
        expected_duration_min = COALESCE(${body.expectedDurationMin ?? null}::integer, expected_duration_min),
        memo = ${body.memo !== undefined ? body.memo : sql`memo`}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      roomId: updated.room_id,
      patientName: updated.patient_name,
      phoneNumber: updated.phone_number,
      treatmentType: updated.treatment_type,
      status: updated.status,
      location: updated.location,
      doctor: updated.doctor,
      procedure: updated.procedure_name,
      actualStart: updated.actual_start,
      expectedDurationMin: updated.expected_duration_min,
      memo: updated.memo,
      parentCaseId: updated.parent_case_id,
      createdAt: updated.created_at,
    });
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
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { id } = await params;
  const sql = getDb();

  try {
    await sql`DELETE FROM operation_cases WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
