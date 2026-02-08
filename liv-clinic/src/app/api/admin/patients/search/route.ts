import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/patients/search?q=검색어
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ patients: [] });
  }

  const admin = createAdminClient();

  // Search across patient_treatments and operation_cases by name or phone
  const [treatmentsRes, operationsRes, consultationsRes] = await Promise.all([
    admin
      .from('patient_treatments')
      .select('patient_name, phone, treated_at')
      .or(`patient_name.ilike.%${q}%,phone.ilike.%${q}%`),
    admin
      .from('operation_cases')
      .select('patient_name, phone_number, price_krw, discount_krw, created_at')
      .or(`patient_name.ilike.%${q}%,phone_number.ilike.%${q}%`),
    admin
      .from('consultation_requests')
      .select('name, phone, created_at')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`),
  ]);

  // Aggregate by patient (name + phone as key)
  const patientMap = new Map<string, {
    name: string;
    phone: string;
    treatmentCount: number;
    consultationCount: number;
    lastVisit: string;
    totalSpent: number;
  }>();

  const getKey = (name: string, phone: string) => `${name}::${phone}`;

  const getOrCreate = (name: string, phone: string) => {
    const key = getKey(name, phone);
    if (!patientMap.has(key)) {
      patientMap.set(key, {
        name,
        phone,
        treatmentCount: 0,
        consultationCount: 0,
        lastVisit: '',
        totalSpent: 0,
      });
    }
    return patientMap.get(key)!;
  };

  // patient_treatments
  for (const t of treatmentsRes.data || []) {
    const p = getOrCreate(t.patient_name, t.phone);
    p.treatmentCount++;
    if (t.treated_at > p.lastVisit) p.lastVisit = t.treated_at;
  }

  // operation_cases (revenue data)
  for (const o of operationsRes.data || []) {
    const phone = o.phone_number || '';
    const p = getOrCreate(o.patient_name, phone);
    p.totalSpent += (o.price_krw || 0) - (o.discount_krw || 0);
    if (o.created_at > p.lastVisit) p.lastVisit = o.created_at;
  }

  // consultation_requests
  for (const c of consultationsRes.data || []) {
    const p = getOrCreate(c.name, c.phone);
    p.consultationCount++;
    if (c.created_at > p.lastVisit) p.lastVisit = c.created_at;
  }

  const patients = [...patientMap.values()]
    .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
    .slice(0, 30);

  return NextResponse.json({ patients });
}
