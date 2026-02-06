import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/admin/revenue?period=today|week|month|custom&startDate=&endDate=
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 기간 계산
  let startDate: string;
  let endDate: string;

  if (period === 'custom') {
    startDate = searchParams.get('startDate') || todayStr;
    endDate = searchParams.get('endDate') || todayStr;
  } else if (period === 'today') {
    startDate = todayStr;
    endDate = todayStr;
  } else if (period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    startDate = weekAgo.toISOString().split('T')[0];
    endDate = todayStr;
  } else {
    // month
    startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    endDate = todayStr;
  }

  const rangeStart = `${startDate}T00:00:00+09:00`;
  const rangeEnd = `${endDate}T23:59:59+09:00`;

  try {
    // 메인 데이터: 해당 기간 operation_cases
    const { data: cases, error } = await admin
      .from('operation_cases')
      .select('id, patient_name, procedure_name, doctor, treatment_type, price_krw, discount_krw, payment_method, payment_status, created_at')
      .gte('created_at', rangeStart)
      .lte('created_at', rangeEnd)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = cases || [];

    // KPI 계산용: 오늘/이번주/이번달 범위
    const todayStart = `${todayStr}T00:00:00+09:00`;
    const todayEnd = `${todayStr}T23:59:59+09:00`;

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekStart = `${weekAgo.toISOString().split('T')[0]}T00:00:00+09:00`;

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00+09:00`;

    // KPI용 전체 데이터 (이번달 범위)
    const { data: kpiCases } = await admin
      .from('operation_cases')
      .select('price_krw, discount_krw, payment_status, created_at')
      .gte('created_at', monthStart)
      .lte('created_at', todayEnd);

    const allKpi = kpiCases || [];

    function calcRevenue(items: typeof allKpi) {
      return items
        .filter((i) => i.payment_status === 'COMPLETED')
        .reduce((sum, i) => sum + ((i.price_krw || 0) - (i.discount_krw || 0)), 0);
    }

    function inRange(createdAt: string, start: string, end: string) {
      return createdAt >= start && createdAt <= end;
    }

    const todayCases = allKpi.filter((c) => inRange(c.created_at, todayStart, todayEnd));
    const weekCases = allKpi.filter((c) => inRange(c.created_at, weekStart, todayEnd));

    const completedAll = allKpi.filter((c) => c.payment_status === 'COMPLETED');

    const kpis = {
      todayRevenue: calcRevenue(todayCases),
      weekRevenue: calcRevenue(weekCases),
      monthRevenue: calcRevenue(allKpi),
      avgPerCase: completedAll.length > 0
        ? Math.round(calcRevenue(allKpi) / completedAll.length)
        : 0,
      totalCases: completedAll.length,
    };

    // 거래 내역 (camelCase 변환)
    const transactions = rows.map((r) => ({
      id: r.id,
      patientName: r.patient_name,
      procedure: r.procedure_name,
      priceKrw: r.price_krw,
      discountKrw: r.discount_krw,
      netAmount: ((r.price_krw || 0) - (r.discount_krw || 0)),
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      doctor: r.doctor,
      createdAt: r.created_at,
    }));

    // 일별 매출 추이 (최근 7일)
    const dailyTrend: { date: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayStart = `${ds}T00:00:00+09:00`;
      const dayEnd = `${ds}T23:59:59+09:00`;
      const dayCases = allKpi.filter((c) => inRange(c.created_at, dayStart, dayEnd));
      dailyTrend.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: calcRevenue(dayCases),
        count: dayCases.filter((c) => c.payment_status === 'COMPLETED').length,
      });
    }

    return NextResponse.json({ kpis, transactions, dailyTrend });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
