'use client';

import { useState, useMemo } from 'react';
import type {
  ConsultationFunnelData,
  ProcedureStat,
  DoctorStat,
  DailyTrend,
} from '@/types/admin';

// ─── Mock 데이터 생성 ──────────────────────────────────
function generateMockData(year: number, month: number) {
  const funnel: ConsultationFunnelData = {
    total: 184,
    contacted: 156,
    reserved: 98,
    completed: 82,
    noShow: 7,
  };

  const procedures: ProcedureStat[] = [
    { name: '보톡스', category: '안티에이징', count: 45, revenue: 22500000 },
    { name: '울쎄라', category: '리프팅', count: 28, revenue: 56000000 },
    { name: '필러', category: '안티에이징', count: 35, revenue: 31500000 },
    { name: '써마지', category: '리프팅', count: 22, revenue: 33000000 },
    { name: '스킨부스터', category: '안티에이징', count: 30, revenue: 15000000 },
    { name: '실리프팅', category: '리프팅', count: 18, revenue: 27000000 },
    { name: '덴서티', category: '리프팅', count: 15, revenue: 18750000 },
    { name: '색소 레이저', category: '레이저', count: 20, revenue: 10000000 },
    { name: '인모드', category: '리프팅', count: 12, revenue: 14400000 },
    { name: '제모 레이저', category: '레이저', count: 25, revenue: 7500000 },
  ];

  const doctors: DoctorStat[] = [
    { name: '천원장', consultations: 98, procedures: 142, revenue: 148000000, conversionRate: 48.2 },
    { name: '김원장', consultations: 86, procedures: 108, revenue: 87650000, conversionRate: 41.5 },
  ];

  const daysInMonth = new Date(year, month, 0).getDate();
  const daily: DailyTrend[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const isWeekend = [0, 6].includes(new Date(year, month - 1, day).getDay());
    return {
      date: `${month}/${day}`,
      consultations: isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 8) + 3,
      procedures: isWeekend ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 10) + 4,
    };
  });

  const totalRevenue = procedures.reduce((s, p) => s + p.revenue, 0);
  const totalProcedures = procedures.reduce((s, p) => s + p.count, 0);
  const avgRevenuePerCase = totalProcedures > 0 ? Math.round(totalRevenue / totalProcedures) : 0;

  return { funnel, procedures, doctors, daily, totalRevenue, totalProcedures, avgRevenuePerCase };
}

// ─── 유틸 ──────────────────────────────────────────
function formatMoney(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.round(n / 10000).toLocaleString('ko-KR')}만`;
  return n.toLocaleString('ko-KR');
}

function formatMoneyFull(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

// ─── 메인 컴포넌트 ──────────────────────────────────
export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const data = useMemo(() => generateMockData(year, month), [year, month]);

  const conversionRate = data.funnel.total > 0
    ? ((data.funnel.completed / data.funnel.total) * 100).toFixed(1)
    : '0';

  const revenueTarget = 250000000; // 2.5억 목표
  const achievementRate = ((data.totalRevenue / revenueTarget) * 100).toFixed(1);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#6d4e42]">리포트</h2>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="월 매출"
          value={formatMoney(data.totalRevenue) + '원'}
          sub={`목표 달성률 ${achievementRate}%`}
          color="bg-blue-50 text-blue-700"
          progress={Math.min(100, Number(achievementRate))}
          progressColor="bg-blue-400"
        />
        <KpiCard
          label="상담 → 시술 전환율"
          value={`${conversionRate}%`}
          sub={`${data.funnel.completed}건 / ${data.funnel.total}건`}
          color="bg-emerald-50 text-emerald-700"
          progress={Number(conversionRate)}
          progressColor="bg-emerald-400"
        />
        <KpiCard
          label="총 시술 건수"
          value={`${data.totalProcedures}건`}
          sub={`일평균 ${(data.totalProcedures / new Date(year, month, 0).getDate()).toFixed(1)}건`}
          color="bg-purple-50 text-purple-700"
        />
        <KpiCard
          label="시술 건당 평균 매출"
          value={formatMoney(data.avgRevenuePerCase) + '원'}
          sub="전월 대비 +5.2%"
          color="bg-amber-50 text-amber-700"
        />
      </div>

      {/* 상담 퍼널 + 일별 트렌드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <FunnelChart funnel={data.funnel} />
        <DailyTrendChart daily={data.daily} />
      </div>

      {/* 시술 통계 + 의사 실적 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ProcedureTable procedures={data.procedures} />
        </div>
        <DoctorStats doctors={data.doctors} />
      </div>
    </div>
  );
}

// ─── KPI 카드 ──────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  color,
  progress,
  progressColor,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
      <p className="text-sm text-[#8a8a8a] mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color} inline-block px-2 py-0.5 rounded-lg mb-2`}>
        {value}
      </p>
      {progress !== undefined && progressColor && (
        <div className="w-full bg-[#f0f0f0] rounded-full h-1.5 mb-2">
          <div
            className={`h-1.5 rounded-full ${progressColor} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <p className="text-xs text-[#8a8a8a]">{sub}</p>
    </div>
  );
}

// ─── 상담 퍼널 차트 ──────────────────────────────────
function FunnelChart({ funnel }: { funnel: ConsultationFunnelData }) {
  const steps = [
    { label: '상담 신청', value: funnel.total, color: 'bg-blue-400' },
    { label: '컨택 완료', value: funnel.contacted, color: 'bg-sky-400' },
    { label: '예약 확정', value: funnel.reserved, color: 'bg-emerald-400' },
    { label: '시술 완료', value: funnel.completed, color: 'bg-green-500' },
    { label: '노쇼', value: funnel.noShow, color: 'bg-red-400' },
  ];

  const maxVal = funnel.total || 1;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-4">상담 전환 퍼널</h3>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = ((step.value / maxVal) * 100).toFixed(1);
          const convFromPrev = i > 0 && i < 4 && steps[i - 1].value > 0
            ? ((step.value / steps[i - 1].value) * 100).toFixed(0)
            : null;
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[#575756]">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#6d4e42]">{step.value}건</span>
                  {convFromPrev && (
                    <span className="text-xs text-[#8a8a8a]">({convFromPrev}%)</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-[#f0f0f0] rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${step.color} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
        <div className="flex justify-between text-xs text-[#8a8a8a]">
          <span>전체 전환율: {funnel.total > 0 ? ((funnel.completed / funnel.total) * 100).toFixed(1) : 0}%</span>
          <span>노쇼율: {funnel.reserved > 0 ? ((funnel.noShow / funnel.reserved) * 100).toFixed(1) : 0}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── 일별 트렌드 차트 ──────────────────────────────────
function DailyTrendChart({ daily }: { daily: DailyTrend[] }) {
  const maxVal = Math.max(...daily.map((d) => Math.max(d.consultations, d.procedures)), 1);

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-[#6d4e42]">일별 추이</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 상담
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 시술
          </span>
        </div>
      </div>
      <div className="flex items-end gap-px h-40 overflow-x-auto">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 min-w-[12px] flex flex-col items-center gap-px group relative">
            {/* 시술 바 */}
            <div
              className="w-full bg-emerald-400 rounded-t-sm min-h-[2px] transition-all"
              style={{ height: `${(d.procedures / maxVal) * 100}%` }}
            />
            {/* 상담 바 */}
            <div
              className="w-full bg-blue-400 rounded-t-sm min-h-[2px] transition-all"
              style={{ height: `${(d.consultations / maxVal) * 100}%` }}
            />
            {/* 툴팁 */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#6d4e42] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
              <p className="font-medium">{d.date}</p>
              <p>상담 {d.consultations} / 시술 {d.procedures}</p>
            </div>
          </div>
        ))}
      </div>
      {/* X축 날짜 라벨 */}
      <div className="flex gap-px mt-1 overflow-x-auto">
        {daily.map((d, i) => (
          <div key={d.date} className="flex-1 min-w-[12px] text-center">
            {i % 5 === 0 && (
              <span className="text-[9px] text-[#8a8a8a]">{d.date}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 시술 통계 테이블 ──────────────────────────────────
function ProcedureTable({ procedures }: { procedures: ProcedureStat[] }) {
  const sorted = [...procedures].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = sorted[0]?.revenue || 1;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e5e5e5]">
        <h3 className="font-bold text-sm text-[#6d4e42]">시술별 통계</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#f6f6f6]">
              <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium w-8">#</th>
              <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">시술명</th>
              <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">카테고리</th>
              <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">건수</th>
              <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">매출</th>
              <th className="py-3 px-4 text-[#8a8a8a] font-medium w-32">비중</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.name} className="border-b border-[#f0f0f0] last:border-0">
                <td className="py-3 px-4 text-[#8a8a8a] font-medium">{i + 1}</td>
                <td className="py-3 px-4 font-medium text-[#6d4e42]">{p.name}</td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#b4988d]/10 text-[#6d4e42]">
                    {p.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">{p.count}건</td>
                <td className="py-3 px-4 text-right font-medium">{formatMoneyFull(p.revenue)}</td>
                <td className="py-3 px-4">
                  <div className="w-full bg-[#f0f0f0] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#b4988d] transition-all"
                      style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 의사 실적 ──────────────────────────────────────
function DoctorStats({ doctors }: { doctors: DoctorStat[] }) {
  const totalRevenue = doctors.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-4">의사별 실적</h3>
      <div className="space-y-4">
        {doctors.map((doc) => {
          const revPct = totalRevenue > 0 ? ((doc.revenue / totalRevenue) * 100).toFixed(1) : '0';
          return (
            <div key={doc.name} className="border border-[#e5e5e5] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-[#6d4e42]">{doc.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#b4988d]/10 text-[#6d4e42]">
                  매출 비중 {revPct}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#8a8a8a] mb-0.5">상담 배정</p>
                  <p className="font-medium">{doc.consultations}건</p>
                </div>
                <div>
                  <p className="text-xs text-[#8a8a8a] mb-0.5">시술 건수</p>
                  <p className="font-medium">{doc.procedures}건</p>
                </div>
                <div>
                  <p className="text-xs text-[#8a8a8a] mb-0.5">매출</p>
                  <p className="font-medium text-blue-700">{formatMoney(doc.revenue)}원</p>
                </div>
                <div>
                  <p className="text-xs text-[#8a8a8a] mb-0.5">전환율</p>
                  <p className="font-medium text-emerald-700">{doc.conversionRate}%</p>
                </div>
              </div>
              {/* 매출 비중 바 */}
              <div className="mt-3 w-full bg-[#f0f0f0] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-[#b4988d] transition-all"
                  style={{ width: `${revPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 합계 */}
      <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
        <div className="flex justify-between text-sm">
          <span className="text-[#8a8a8a]">전체 매출</span>
          <span className="font-bold text-[#6d4e42]">{formatMoney(totalRevenue)}원</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-[#8a8a8a]">전체 시술</span>
          <span className="font-bold text-[#6d4e42]">{doctors.reduce((s, d) => s + d.procedures, 0)}건</span>
        </div>
      </div>
    </div>
  );
}
