'use client';

import { useMemo } from 'react';
import { DonutChart, MiniBar } from './StockGauge';
import { INVENTORY_CATEGORY_LABELS, getStockStatus } from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';

interface CategoryBurndownSummary {
  category: string;
  totalItems: number;
  totalValue: number;
  criticalCount: number;
  warningCount: number;
}

interface StockDashboardProps {
  items: InventoryItem[];
  categorySummary?: CategoryBurndownSummary[];
}

const CATEGORY_COLORS: Record<InventoryCategory, string> = {
  device_tip: '#8b5cf6',
  injection: '#3b82f6',
  thread: '#f59e0b',
  consumable: '#6b7280',
  skincare: '#ec4899',
  medicine: '#10b981',
  cosmetics: '#f472b6',
  sample: '#a78bfa',
};

export default function StockDashboard({ items, categorySummary }: StockDashboardProps) {
  const activeItems = useMemo(() => items.filter(i => i.is_active), [items]);

  const stats = useMemo(() => {
    const total = activeItems.length;
    const normal = activeItems.filter(i => getStockStatus(i) === 'normal').length;
    const low = activeItems.filter(i => getStockStatus(i) === 'low').length;
    const out = activeItems.filter(i => getStockStatus(i) === 'out').length;
    const totalValue = activeItems.reduce((sum, i) => sum + i.current_stock * i.unit_price, 0);
    return { total, normal, low, out, totalValue };
  }, [activeItems]);

  const categoryDist = useMemo(() => {
    const map: Partial<Record<InventoryCategory, number>> = {};
    for (const item of activeItems) {
      map[item.category] = (map[item.category] || 0) + 1;
    }
    return Object.entries(map)
      .map(([cat, count]) => ({
        category: cat as InventoryCategory,
        label: INVENTORY_CATEGORY_LABELS[cat as InventoryCategory],
        count: count as number,
        color: CATEGORY_COLORS[cat as InventoryCategory],
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeItems]);

  const maxCategoryCount = categoryDist.length > 0 ? categoryDist[0].count : 1;

  const donutSegments = useMemo(() => [
    { label: '정상', value: stats.normal, color: '#34d399' },
    { label: '부족', value: stats.low, color: '#fbbf24' },
    { label: '소진', value: stats.out, color: '#ef4444' },
  ], [stats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* Donut + status legend */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#ebe7e4] p-6 flex items-center gap-6"
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
      >
        <DonutChart
          segments={donutSegments}
          size={120}
          strokeWidth={18}
          centreValue={stats.total}
          centreLabel="총 품목"
        />
        <div className="flex-1 space-y-3">
          {donutSegments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2.5 group">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-sm text-[#7a6b63] flex-1">{seg.label}</span>
              <span className="text-sm font-bold text-[#6d4e42] tabular-nums">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards — elevated with subtle gradients */}
      <div className="lg:col-span-4 grid grid-cols-2 gap-3">
        <StatTile
          label="부족 경고"
          value={stats.low}
          unit="품목"
          accent="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          }
        />
        <StatTile
          label="소진"
          value={stats.out}
          unit="품목"
          accent="red"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
        <StatTile
          label="정상 재고"
          value={stats.normal}
          unit="품목"
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatTile
          label="총 재고가치"
          value={stats.totalValue.toLocaleString('ko-KR')}
          unit="원"
          accent="rose"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
      </div>

      {/* Category distribution + burndown summary */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#ebe7e4] p-6"
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
      >
        <h3 className="text-sm font-bold text-[#6d4e42] mb-4 tracking-tight">카테고리별 분포</h3>
        <div className="space-y-2.5">
          {categoryDist.map(({ category, label, count, color }) => {
            const summary = categorySummary?.find((s) => s.category === category);
            return (
              <div key={category}>
                <MiniBar label={label} value={count} maxValue={maxCategoryCount} color={color} />
                {summary && (summary.criticalCount > 0 || summary.warningCount > 0) && (
                  <div className="flex gap-2 ml-1 mt-0.5">
                    {summary.criticalCount > 0 && (
                      <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-semibold">
                        긴급 {summary.criticalCount}
                      </span>
                    )}
                    {summary.warningCount > 0 && (
                      <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-semibold">
                        주의 {summary.warningCount}
                      </span>
                    )}
                    {summary.totalValue > 0 && (
                      <span className="text-[9px] text-[#8a8a8a]">
                        {(summary.totalValue / 10000).toFixed(0)}만원
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Tile ───────────────────────────────────
const ACCENT_MAP: Record<string, {
  bg: string;
  iconBg: string;
  text: string;
  border: string;
}> = {
  amber:   { bg: 'bg-gradient-to-br from-amber-50 to-orange-50/50', iconBg: 'bg-amber-100/80 text-amber-600', text: 'text-amber-700', border: 'border-amber-100' },
  red:     { bg: 'bg-gradient-to-br from-red-50 to-rose-50/50', iconBg: 'bg-red-100/80 text-red-500', text: 'text-red-600', border: 'border-red-100' },
  emerald: { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50/50', iconBg: 'bg-emerald-100/80 text-emerald-600', text: 'text-emerald-700', border: 'border-emerald-100' },
  rose:    { bg: 'bg-gradient-to-br from-[#faf6f4] to-[#f5eeea]', iconBg: 'bg-[#b4988d]/15 text-[#b4988d]', text: 'text-[#6d4e42]', border: 'border-[#ebe7e4]' },
  purple:  { bg: 'bg-gradient-to-br from-purple-50 to-violet-50/50', iconBg: 'bg-purple-100/80 text-purple-600', text: 'text-purple-700', border: 'border-purple-100' },
  blue:    { bg: 'bg-gradient-to-br from-blue-50 to-sky-50/50', iconBg: 'bg-blue-100/80 text-blue-600', text: 'text-blue-700', border: 'border-blue-100' },
};

function StatTile({
  label,
  value,
  unit,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  unit: string;
  accent: string;
  icon: React.ReactNode;
}) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.blue;
  return (
    <div className={`${a.bg} rounded-2xl p-4 flex flex-col gap-2 border ${a.border} transition-shadow duration-200 hover:shadow-md`}
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#8a8a8a] font-medium tracking-wide uppercase">{label}</span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.iconBg}`}>
          {icon}
        </span>
      </div>
      <div>
        <span className={`text-2xl font-bold ${a.text} tabular-nums tracking-tight`}>{value}</span>
        <span className="text-[10px] text-[#a09080] ml-1">{unit}</span>
      </div>
    </div>
  );
}
