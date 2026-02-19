'use client';

import { useMemo } from 'react';
import { getStockStatus } from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';
import { ProgressBar } from './StockGauge';

export type StockFilter = 'all' | 'normal' | 'low' | 'out';

interface DashboardStatsCardsProps {
  items: InventoryItem[];
  todayCategoryUsage: Map<InventoryCategory, number>;
  alertItems: InventoryItem[];
  onAlertClick?: () => void;
  activeFilter?: StockFilter;
  onFilterChange?: (filter: StockFilter) => void;
}

export default function DashboardStatsCards({ items, todayCategoryUsage, alertItems, onAlertClick, activeFilter = 'all', onFilterChange }: DashboardStatsCardsProps) {
  const stats = useMemo(() => {
    const active = items.filter(i => i.is_active);
    const total = active.length;
    const normal = active.filter(i => getStockStatus(i) === 'normal').length;
    const low = active.filter(i => getStockStatus(i) === 'low').length;
    const out = active.filter(i => getStockStatus(i) === 'out').length;
    const healthPercent = total > 0 ? Math.round((normal / total) * 100) : 100;
    return { total, normal, low, out, healthPercent };
  }, [items]);

  const todayTotalUsage = useMemo(() => {
    let sum = 0;
    todayCategoryUsage.forEach(v => { sum += v; });
    return sum;
  }, [todayCategoryUsage]);

  const lowItemSummary = useMemo(() => {
    const lowItems = alertItems.filter(i => getStockStatus(i) === 'low');
    if (lowItems.length === 0) return null;
    if (lowItems.length === 1) return lowItems[0].name;
    return `${lowItems[0].name} 외 ${lowItems.length - 1}개`;
  }, [alertItems]);

  const outItemSummary = useMemo(() => {
    const outItems = alertItems.filter(i => getStockStatus(i) === 'out');
    if (outItems.length === 0) return null;
    if (outItems.length === 1) return outItems[0].name;
    return `${outItems[0].name} 외 ${outItems.length - 1}개`;
  }, [alertItems]);

  const handleClick = (filter: StockFilter) => {
    if (onFilterChange) {
      onFilterChange(activeFilter === filter ? 'all' : filter);
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {/* 총 품목 */}
      <button
        onClick={() => handleClick('all')}
        className={`text-left bg-gradient-to-br from-[#faf8f7] to-white rounded-2xl border p-5 transition-all cursor-pointer hover:shadow-md ${
          activeFilter === 'all' ? 'border-[#6d4e42] ring-2 ring-[#6d4e42]/20' : 'border-[#ebe7e4]'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#f6f4f2] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#6d4e42]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-xs text-[#a09080] font-medium">총 품목</span>
        </div>
        <div className="text-3xl font-bold text-[#6d4e42] tabular-nums mb-1">{stats.total}</div>
        {todayTotalUsage > 0 && (
          <span className="text-[11px] text-[#b4988d]">오늘 {todayTotalUsage}건 사용</span>
        )}
      </button>

      {/* 정상 재고 */}
      <button
        onClick={() => handleClick('normal')}
        className={`text-left bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border p-5 transition-all cursor-pointer hover:shadow-md ${
          activeFilter === 'normal' ? 'border-emerald-400 ring-2 ring-emerald-300' : 'border-[#ebe7e4]'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs text-[#a09080] font-medium">정상 재고</span>
        </div>
        <div className="text-3xl font-bold text-emerald-700 tabular-nums mb-2">{stats.normal}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ProgressBar current={stats.normal} min={0} max={stats.total || 1} height={5} animated={false} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 tabular-nums">{stats.healthPercent}%</span>
        </div>
      </button>

      {/* 부족 경고 */}
      <button
        onClick={() => handleClick('low')}
        className={`text-left bg-gradient-to-br from-amber-50/50 to-white rounded-2xl border p-5 transition-all cursor-pointer hover:shadow-md ${
          activeFilter === 'low'
            ? 'border-amber-400 ring-2 ring-amber-300'
            : stats.low > 0 ? 'border-[#ebe7e4] ring-1 ring-amber-200' : 'border-[#ebe7e4]'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center ${stats.low > 0 ? 'animate-pulse' : ''}`}>
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <span className="text-xs text-[#a09080] font-medium">부족 경고</span>
        </div>
        <div className="text-3xl font-bold text-amber-700 tabular-nums mb-1">{stats.low}</div>
        {lowItemSummary && (
          <span className="text-[11px] text-amber-600 truncate block">{lowItemSummary}</span>
        )}
      </button>

      {/* 긴급 소진 */}
      <button
        onClick={() => { handleClick('out'); if (onAlertClick) onAlertClick(); }}
        className={`text-left bg-gradient-to-br from-red-50/50 to-white rounded-2xl border p-5 transition-all cursor-pointer hover:shadow-md ${
          activeFilter === 'out'
            ? 'border-red-400 ring-2 ring-red-300'
            : stats.out > 0 ? 'border-[#ebe7e4] ring-1 ring-red-200' : 'border-[#ebe7e4]'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center ${stats.out > 0 ? 'animate-pulse' : ''}`}>
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <span className="text-xs text-[#a09080] font-medium">긴급 소진</span>
        </div>
        <div className="text-3xl font-bold text-red-700 tabular-nums mb-1">{stats.out}</div>
        {stats.out > 0 ? (
          <span className="text-[11px] text-red-600 font-semibold">
            {outItemSummary || '즉시 발주 필요'}
          </span>
        ) : (
          <span className="text-[11px] text-emerald-600">모두 정상</span>
        )}
      </button>
    </div>
  );
}
