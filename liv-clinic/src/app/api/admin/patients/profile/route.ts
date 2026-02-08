import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/patients/profile?name=김OO&phone=010-1234-5678
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const name = request.nextUrl.searchParams.get('name')?.trim();
  const phone = request.nextUrl.searchParams.get('phone')?.trim();
  if (!name) {
    return NextResponse.json({ error: 'name 파라미터가 필요합니다.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [treatmentsRes, consultationsRes, operationsRes] = await Promise.all([
    // 1. patient_treatments - treatment history
    admin
      .from('patient_treatments')
      .select('id, phone, treatment_name, treatment_category, doctor, treated_at, notification_sent, notification_cycle_days, next_notification_at')
      .eq('patient_name', name)
      .then(res => {
        if (phone && res.data) {
          return { ...res, data: res.data.filter(r => r.phone === phone) };
        }
        return res;
      }),
    // 2. consultation_requests - consultation history
    admin
      .from('consultation_requests')
      .select('id, phone, status, procedure_tags, treatment_type, message, assignee, created_at')
      .eq('name', name)
      .then(res => {
        if (phone && res.data) {
          return { ...res, data: res.data.filter(r => r.phone === phone) };
        }
        return res;
      }),
    // 3. operation_cases - revenue data
    admin
      .from('operation_cases')
      .select('id, procedure_name, doctor, price_krw, discount_krw, payment_method, payment_status, created_at')
      .eq('patient_name', name)
      .order('created_at', { ascending: false }),
  ]);

  // Filter operations by phone if provided
  // (phone_number field - query separately since we need the filter)
  let operations = operationsRes.data || [];
  if (phone) {
    const opsWithPhone = await admin
      .from('operation_cases')
      .select('id, procedure_name, doctor, price_krw, discount_krw, payment_method, payment_status, phone_number, created_at')
      .eq('patient_name', name)
      .eq('phone_number', phone)
      .order('created_at', { ascending: false });
    if (opsWithPhone.data && opsWithPhone.data.length > 0) {
      operations = opsWithPhone.data;
    }
  }

  const treatments = (treatmentsRes.data || []).sort(
    (a, b) => b.treated_at.localeCompare(a.treated_at)
  );

  const consultations = (consultationsRes.data || []).sort(
    (a, b) => b.created_at.localeCompare(a.created_at)
  );

  // 4. notification_history via patient_treatment IDs
  const treatmentIds = treatments.map(t => t.id);
  let notifications: { id: string; channel: string; status: string; sent_at: string; notes: string | null }[] = [];
  if (treatmentIds.length > 0) {
    const { data } = await admin
      .from('notification_history')
      .select('id, channel, status, sent_at, notes')
      .in('patient_treatment_id', treatmentIds)
      .order('sent_at', { ascending: false });
    notifications = data || [];
  }

  // Revenue summary
  const totalSpent = operations.reduce((sum, o) => sum + (o.price_krw || 0) - (o.discount_krw || 0), 0);
  const visitCount = operations.length;
  const avgPerVisit = visitCount > 0 ? Math.round(totalSpent / visitCount) : 0;

  // Procedure breakdown
  const procMap = new Map<string, { count: number; total: number }>();
  for (const o of operations) {
    const key = o.procedure_name;
    const existing = procMap.get(key) || { count: 0, total: 0 };
    existing.count++;
    existing.total += (o.price_krw || 0) - (o.discount_krw || 0);
    procMap.set(key, existing);
  }
  const procedures = [...procMap.entries()]
    .map(([procName, data]) => ({ name: procName, ...data }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    patient: { name, phone: phone || '' },
    treatments: treatments.map(t => ({
      id: t.id,
      treatmentName: t.treatment_name,
      category: t.treatment_category,
      doctor: t.doctor,
      treatedAt: t.treated_at,
      notificationSent: t.notification_sent,
      cycleDays: t.notification_cycle_days,
      nextNotification: t.next_notification_at,
    })),
    consultations: consultations.map(c => ({
      id: c.id,
      status: c.status,
      procedureTags: c.procedure_tags || [],
      treatmentType: c.treatment_type,
      message: c.message,
      assignee: c.assignee,
      createdAt: c.created_at,
    })),
    notifications: notifications.map(n => ({
      id: n.id,
      channel: n.channel,
      status: n.status,
      sentAt: n.sent_at,
      notes: n.notes,
    })),
    revenue: {
      totalSpent,
      visitCount,
      avgPerVisit,
      procedures,
    },
  });
}
