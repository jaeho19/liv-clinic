import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import getDb from '@/lib/db';

// GET /api/admin/reports?year=2026&month=1
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const sql = getDb();

  try {
    // ─── 1. 상담 퍼널 (consultation_requests) ─────────
    const [funnelRow] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status NOT IN ('new'))::int AS contacted,
        COUNT(*) FILTER (WHERE status IN ('reservation_confirmed', 'completed', 'no_show'))::int AS reserved,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'no_show')::int AS no_show
      FROM consultation_requests
      WHERE created_at >= ${startDate}::date
        AND created_at < ${endDate}::date
    `;

    const funnel = {
      total: funnelRow?.total || 0,
      contacted: funnelRow?.contacted || 0,
      reserved: funnelRow?.reserved || 0,
      completed: funnelRow?.completed || 0,
      noShow: funnelRow?.no_show || 0,
    };

    // ─── 2. 시술 통계 (operation_cases) ─────────────
    const procedureRows = await sql`
      SELECT
        procedure_name AS name,
        treatment_type AS category,
        COUNT(*)::int AS count
      FROM operation_cases
      WHERE created_at >= ${startDate}::date
        AND created_at < ${endDate}::date
        AND status IN ('IN_PROGRESS', 'COMPLETED')
      GROUP BY procedure_name, treatment_type
      ORDER BY count DESC
    `;

    const categoryMap: Record<string, string> = {
      CONSULT: '상담',
      SKINCARE: '피부관리',
      ANESTHESIA: '마취',
      PROCEDURE: '시술',
    };

    const procedures = procedureRows.map((r: Record<string, unknown>) => ({
      name: r.name as string,
      category: categoryMap[r.category as string] || (r.category as string),
      count: r.count as number,
      revenue: 0, // 매출 데이터는 별도 billing 시스템 필요
    }));

    // ─── 3. 의사 실적 (operation_cases + consultation_requests) ──
    const doctorOpRows = await sql`
      SELECT
        doctor AS name,
        COUNT(*)::int AS procedures
      FROM operation_cases
      WHERE created_at >= ${startDate}::date
        AND created_at < ${endDate}::date
        AND status IN ('IN_PROGRESS', 'COMPLETED')
      GROUP BY doctor
      ORDER BY procedures DESC
    `;

    const doctorConsultRows = await sql`
      SELECT
        assignee AS name,
        COUNT(*)::int AS consultations
      FROM consultation_requests
      WHERE created_at >= ${startDate}::date
        AND created_at < ${endDate}::date
        AND assignee IS NOT NULL
      GROUP BY assignee
    `;

    const consultMap: Record<string, number> = {};
    for (const r of doctorConsultRows) {
      consultMap[r.name as string] = r.consultations as number;
    }

    const doctors = doctorOpRows.map((r: Record<string, unknown>) => {
      const name = r.name as string;
      const procs = r.procedures as number;
      const consults = consultMap[name] || 0;
      return {
        name,
        consultations: consults,
        procedures: procs,
        revenue: 0,
        conversionRate: consults > 0 ? parseFloat(((procs / consults) * 100).toFixed(1)) : 0,
      };
    });

    // ─── 4. 일별 트렌드 ─────────────────────────────
    const dailyConsultRows = await sql`
      SELECT
        EXTRACT(DAY FROM created_at)::int AS day,
        COUNT(*)::int AS cnt
      FROM consultation_requests
      WHERE created_at >= ${startDate}::date
        AND created_at < ${endDate}::date
      GROUP BY day ORDER BY day
    `;

    const dailyOpRows = await sql`
      SELECT
        EXTRACT(DAY FROM created_at)::int AS day,
        COUNT(*)::int AS cnt
      FROM operation_cases
      WHERE created_at >= ${startDate}::date
        AND created_at < ${endDate}::date
        AND status IN ('IN_PROGRESS', 'COMPLETED')
      GROUP BY day ORDER BY day
    `;

    const consultByDay: Record<number, number> = {};
    for (const r of dailyConsultRows) consultByDay[r.day as number] = r.cnt as number;
    const opByDay: Record<number, number> = {};
    for (const r of dailyOpRows) opByDay[r.day as number] = r.cnt as number;

    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({
      date: `${month}/${i + 1}`,
      consultations: consultByDay[i + 1] || 0,
      procedures: opByDay[i + 1] || 0,
    }));

    // ─── 집계 ─────────────────────────────────────
    const totalProcedures = procedures.reduce((s: number, p: { count: number }) => s + p.count, 0);
    const totalRevenue = procedures.reduce((s: number, p: { revenue: number }) => s + p.revenue, 0);
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
