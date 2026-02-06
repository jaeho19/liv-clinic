import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// snake_case → camelCase 변환
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

// GET /api/admin/operations - 당일 운영 케이스 목록
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const targetDate = date || new Date().toISOString().split('T')[0];

  const dayStart = `${targetDate}T00:00:00+09:00`;
  const dayEnd = `${targetDate}T23:59:59+09:00`;

  try {
    const { data, error } = await admin
      .from('operation_cases')
      .select('*')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json((data || []).map(toCamelCase));
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/admin/operations - 새 케이스 생성
export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const body = await request.json();

  try {
    const { data, error } = await admin
      .from('operation_cases')
      .insert({
        room_id: body.roomId,
        patient_name: body.patientName,
        phone_number: body.phoneNumber || null,
        treatment_type: body.treatmentType,
        status: body.status || 'WAITING',
        location: body.location || 'LOUNGE',
        doctor: body.doctor,
        procedure_name: body.procedure,
        actual_start: body.actualStart || null,
        expected_duration_min: body.expectedDurationMin || 60,
        memo: body.memo || null,
        parent_case_id: body.parentCaseId || null,
        price_krw: body.priceKrw ?? null,
        discount_krw: body.discountKrw ?? 0,
        payment_method: body.paymentMethod ?? null,
        payment_status: body.paymentStatus ?? 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(toCamelCase(data), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
