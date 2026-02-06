import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/reports?year=2026&month=1
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  try {
    // 병렬로 데이터 조회
    const [consultResult, opsResult] = await Promise.all([
      admin
        .from('consultation_requests')
        .select('status, assignee, created_at')
        .gte('created_at', startDate)
        .lt('created_at', endDate),
      admin
        .from('operation_cases')
        .select('procedure_name, treatment_type, doctor, status, created_at, price_krw, discount_krw, payment_status')
        .gte('created_at', startDate)
        .lt('created_at', endDate),
    ]);

    if (consultResult.error) throw consultResult.error;
    if (opsResult.error) throw opsResult.error;

    const consultations = consultResult.data || [];
    const operations = (opsResult.data || []).filter(
      (o) => o.status === 'IN_PROGRESS' || o.status === 'COMPLETED'
    );

    // ─── 1. 상담 퍼널 ─────────────────────────────
    const funnel = {
      total: consultations.length,
      contacted: consultations.filter((c) => c.status !== 'new').length,
      reserved: consultations.filter((c) =>
        ['reservation_confirmed', 'completed', 'no_show'].includes(c.status)
      ).length,
      completed: consultations.filter((c) => c.status === 'completed').length,
      noShow: consultations.filter((c) => c.status === 'no_show').length,
    };

    // ─── 2. 시술 통계 ─────────────────────────────
    const categoryMap: Record<string, string> = {
      CONSULT: '상담',
      SKINCARE: '피부관리',
      ANESTHESIA: '마취',
      PROCEDURE: '시술',
    };

    const procMap = new Map<string, { name: string; category: string; count: number; revenue: number }>();
    for (const op of operations) {
      const key = `${op.procedure_name}|${op.treatment_type}`;
      const netRevenue = op.payment_status === 'COMPLETED'
        ? ((op.price_krw as number) || 0) - ((op.discount_krw as number) || 0)
        : 0;
      const existing = procMap.get(key);
      if (existing) {
        existing.count++;
        existing.revenue += netRevenue;
      } else {
        procMap.set(key, {
          name: op.procedure_name as string,
          category: categoryMap[op.treatment_type as string] || (op.treatment_type as string),
          count: 1,
          revenue: netRevenue,
        });
      }
    }
    const procedures = Array.from(procMap.values())
      .sort((a, b) => b.count - a.count);

    // ─── 3. 의사 실적 ─────────────────────────────
    const doctorOps = new Map<string, { count: number; revenue: number }>();
    for (const op of operations) {
      const doc = op.doctor as string;
      if (!doc) continue;
      const netRevenue = op.payment_status === 'COMPLETED'
        ? ((op.price_krw as number) || 0) - ((op.discount_krw as number) || 0)
        : 0;
      const existing = doctorOps.get(doc);
      if (existing) {
        existing.count++;
        existing.revenue += netRevenue;
      } else {
        doctorOps.set(doc, { count: 1, revenue: netRevenue });
      }
    }

    const doctorConsults = new Map<string, number>();
    for (const c of consultations) {
      const assignee = c.assignee as string;
      if (assignee) doctorConsults.set(assignee, (doctorConsults.get(assignee) || 0) + 1);
    }

    const doctors = Array.from(doctorOps.entries())
      .map(([name, { count: procs, revenue }]) => {
        const consults = doctorConsults.get(name) || 0;
        return {
          name,
          consultations: consults,
          procedures: procs,
          revenue,
          conversionRate: consults > 0 ? parseFloat(((procs / consults) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.procedures - a.procedures);

    // ─── 4. 일별 트렌드 ─────────────────────────────
    const consultByDay: Record<number, number> = {};
    for (const c of consultations) {
      const day = new Date(c.created_at as string).getDate();
      consultByDay[day] = (consultByDay[day] || 0) + 1;
    }

    const opByDay: Record<number, number> = {};
    for (const o of operations) {
      const day = new Date(o.created_at as string).getDate();
      opByDay[day] = (opByDay[day] || 0) + 1;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({
      date: `${month}/${i + 1}`,
      consultations: consultByDay[i + 1] || 0,
      procedures: opByDay[i + 1] || 0,
    }));

    // ─── 집계 ─────────────────────────────────────
    const totalProcedures = procedures.reduce((s, p) => s + p.count, 0);
    const totalRevenue = procedures.reduce((s, p) => s + p.revenue, 0);
    const avgRevenuePerCase = totalProcedures > 0 ? Math.round(totalRevenue / totalProcedures) : 0;

    return NextResponse.json({
      funnel,
      procedures,
      doctors,
      daily,
      totalRevenue,
      totalProcedures,
      avgRevenuePerCase,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
