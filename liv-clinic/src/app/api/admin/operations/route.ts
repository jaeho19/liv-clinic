import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// DB 미설정 시 빈 배열 반환 여부
function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

// GET /api/admin/operations - 당일 운영 케이스 목록
export async function GET(request: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json([]);
  }

  const sql = getDb();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD, 기본값 오늘

  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const rows = await sql`
      SELECT
        id, room_id, patient_name, phone_number,
        treatment_type, status, location, doctor,
        procedure_name, actual_start, expected_duration_min,
        memo, parent_case_id, created_at, updated_at
      FROM operation_cases
      WHERE created_at >= ${targetDate + 'T00:00:00+09:00'}::timestamptz
        AND created_at < ${targetDate + 'T00:00:00+09:00'}::timestamptz + interval '1 day'
      ORDER BY created_at ASC
    `;

    // snake_case → camelCase 변환
    const cases = rows.map((r: Record<string, unknown>) => ({
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
    }));

    return NextResponse.json(cases);
  } catch {
    // DB 연결 실패 또는 테이블 미존재 시 빈 배열 반환
    return NextResponse.json([]);
  }
}

// POST /api/admin/operations - 새 케이스 생성
export async function POST(request: NextRequest) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const body = await request.json();
  const sql = getDb();

  try {
    const [row] = await sql`
      INSERT INTO operation_cases (
        room_id, patient_name, phone_number,
        treatment_type, status, location, doctor,
        procedure_name, actual_start, expected_duration_min,
        memo, parent_case_id
      ) VALUES (
        ${body.roomId},
        ${body.patientName},
        ${body.phoneNumber || null},
        ${body.treatmentType},
        ${body.status || 'WAITING'},
        ${body.location || 'LOUNGE'},
        ${body.doctor},
        ${body.procedure},
        ${body.actualStart || null},
        ${body.expectedDurationMin || 60},
        ${body.memo || null},
        ${body.parentCaseId || null}
      ) RETURNING *
    `;

    return NextResponse.json({
      id: row.id,
      roomId: row.room_id,
      patientName: row.patient_name,
      phoneNumber: row.phone_number,
      treatmentType: row.treatment_type,
      status: row.status,
      location: row.location,
      doctor: row.doctor,
      procedure: row.procedure_name,
      actualStart: row.actual_start,
      expectedDurationMin: row.expected_duration_min,
      memo: row.memo,
      parentCaseId: row.parent_case_id,
      createdAt: row.created_at,
    }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
