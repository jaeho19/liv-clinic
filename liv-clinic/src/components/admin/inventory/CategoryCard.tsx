'use client';

import { useMemo, memo } from 'react';
import { getStockStatus } from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';

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

const CATEGORY_ICONS: Record<InventoryCategory, string> = {
  device_tip: '\u2699\uFE0F',
  injection: '\uD83D\uDC89',
  thread: '\u26A1',
  consumable: '\uD83E\uDDF4',
  skincare: '\u2728',
  medicine: '\uD83D\uDC8A',
  cosmetics: '\uD83D\uDC84',
  sample: '\uD83E\uDDEA',
};

// ─── Mini Sparkline ─────────────────────────────
function MiniSparkline({ data, color = '#b4988d', width = 80, height = 20 }: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2 || data.every(d => d === 0)) return null;

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const lastX = width;
  const lastY = height - (data[data.length - 1] / max) * (height - 4) - 2;

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

// ─── Category Card ──────────────────────────────
interface CategoryCardProps {
  category: InventoryCategory;
  label: string;
  items: InventoryItem[];
  isSelected: boolean;
  onClick: () => void;
  todayUsageCount?: number;
  weeklySparkline?: number[];
  topUsedItem?: string;
}

const CategoryCard = memo(function CategoryCard({
  category,
  label,
  items,
  isSelected,
  onClick,
  todayUsageCount,
  weeklySparkline,
  topUsedItem,
}: CategoryCardProps) {
  const stats = useMemo(() => {
    const total = items.length;
    const normal = items.filter(i => getStockStatus(i) === 'normal').length;
    const low = items.filter(i => getStockStatus(i) === 'low').length;
    const out = items.filter(i => getStockStatus(i) === 'out').length;
    const totalValue = items.reduce((sum, i) => sum + i.current_stock * i.unit_price, 0);
    const healthPercent = total > 0 ? Math.round((normal / total) * 100) : 100;
    return { total, normal, low, out, totalValue, healthPercent };
  }, [items]);

  const color = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-[#6d4e42] bg-[#6d4e42]/[0.03] shadow-md'
          : 'border-[#ebe7e4] bg-white hover:border-[#b4988d] hover:shadow-sm'
      }`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: color,
        boxShadow: isSelected ? undefined : '0 1px 3px rgba(109,78,66,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-bold text-[#6d4e42] tracking-tight">{label}</span>
        </div>
        <span className="text-xs text-[#a09080] font-medium tabular-nums">{stats.total} 품목</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-[#f0eeec] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${stats.healthPercent}%`,
            backgroundColor: stats.healthPercent >= 80 ? '#34d399' : stats.healthPercent >= 50 ? '#fbbf24' : '#ef4444',
          }}
        />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#a09080]">재고 건강도</span>
        <span className="text-xs font-bold tabular-nums" style={{
          color: stats.healthPercent >= 80 ? '#059669' : stats.healthPercent >= 50 ? '#d97706' : '#dc2626',
        }}>
          {stats.healthPercent}%
        </span>
      </div>

      {/* Status counts */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[#7a6b63]">정상 {stats.normal}</span>
        </span>
        {stats.low > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-amber-700 font-semibold">부족 {stats.low}</span>
          </span>
        )}
        {stats.out > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-red-700 font-semibold">소진 {stats.out}</span>
          </span>
        )}
      </div>

      {/* Sparkline + Today usage badge */}
      {(weeklySparkline || (todayUsageCount !== undefined && todayUsageCount > 0)) && (
        <div className="mt-3 pt-3 border-t border-[#f0eeec] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {todayUsageCount !== undefined && todayUsageCount > 0 && (
              <span className="text-[10px] text-[#b4988d] font-semibold flex-shrink-0">
                오늘 {todayUsageCount}건
              </span>
            )}
            {topUsedItem && (
              <span className="text-[10px] text-[#a09080] truncate">
                TOP: {topUsedItem}
              </span>
            )}
          </div>
          {weeklySparkline && (
            <MiniSparkline data={weeklySparkline} color={color} />
          )}
        </div>
      )}

      {/* Value - only show if no sparkline section */}
      {!weeklySparkline && !(todayUsageCount !== undefined && todayUsageCount > 0) && stats.totalValue > 0 && (
        <div className="mt-2 text-[10px] text-[#a09080]">
          재고가치 <span className="font-semibold text-[#6d4e42]">{(stats.totalValue / 10000).toFixed(0)}만원</span>
        </div>
      )}
    </button>
  );
});

export default CategoryCard;
export { CATEGORY_COLORS, CATEGORY_ICONS };
