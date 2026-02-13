'use client';

import { useMemo } from 'react';
import { getStockStatus } from '@/types/admin';
import type { InventoryItem } from '@/types/admin';

interface CompactStatsBarProps {
  items: InventoryItem[];
}

export default function CompactStatsBar({ items }: CompactStatsBarProps) {
  const stats = useMemo(() => {
    const active = items.filter(i => i.is_active);
    const total = active.length;
    const normal = active.filter(i => getStockStatus(i) === 'normal').length;
    const low = active.filter(i => getStockStatus(i) === 'low').length;
    const out = active.filter(i => getStockStatus(i) === 'out').length;
    const totalValue = active.reduce((sum, i) => sum + i.current_stock * i.unit_price, 0);
    return { total, normal, low, out, totalValue };
  }, [items]);

  const entries = [
    { label: '총 품목', value: `${stats.total}`, color: 'text-[#6d4e42]' },
    { label: '정상', value: `${stats.normal}`, color: 'text-emerald-600', dot: 'bg-emerald-400' },
    { label: '부족', value: `${stats.low}`, color: 'text-amber-600', dot: 'bg-amber-400' },
    { label: '소진', value: `${stats.out}`, color: 'text-red-600', dot: 'bg-red-400' },
    { label: '총 가치', value: `${(stats.totalValue / 10000).toFixed(0)}만원`, color: 'text-[#6d4e42]' },
  ];

  return (
    <div
      className="bg-white rounded-2xl border border-[#ebe7e4] px-6 py-3.5 mb-5 flex items-center gap-6 flex-wrap"
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
    >
      {entries.map((entry, idx) => (
        <div key={entry.label} className="flex items-center gap-2">
          {entry.dot && <span className={`w-2 h-2 rounded-full ${entry.dot}`} />}
          <span className="text-xs text-[#a09080]">{entry.label}</span>
          <span className={`text-sm font-bold tabular-nums ${entry.color}`}>{entry.value}</span>
          {idx < entries.length - 1 && (
            <span className="text-[#ebe7e4] ml-4 hidden sm:inline">|</span>
          )}
        </div>
      ))}
    </div>
  );
}
