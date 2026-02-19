'use client';

import { useState, useMemo } from 'react';
import { ProgressBar } from './StockGauge';
import { INVENTORY_CATEGORY_LABELS, getStockStatus } from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';

const STATUS_DOT = {
  normal: 'bg-emerald-400',
  low: 'bg-amber-400',
  out: 'bg-red-400',
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

interface StockGroupViewProps {
  items: InventoryItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onStockModal: (v: { item: InventoryItem; type: 'in' | 'out' }) => void;
}

export default function StockGroupView({
  items,
  selectedItemId,
  onSelectItem,
  onStockModal,
}: StockGroupViewProps) {
  const groups = useMemo(() => {
    const map = new Map<InventoryCategory, InventoryItem[]>();
    for (const item of items) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    const order: InventoryCategory[] = ['device_tip', 'injection', 'thread', 'consumable', 'skincare', 'medicine', 'sample'];
    return order
      .filter(cat => map.has(cat))
      .map(cat => ({
        category: cat,
        label: INVENTORY_CATEGORY_LABELS[cat],
        icon: CATEGORY_ICONS[cat],
        items: map.get(cat)!,
        normalCount: map.get(cat)!.filter(i => getStockStatus(i) === 'normal').length,
        lowCount: map.get(cat)!.filter(i => getStockStatus(i) === 'low').length,
        outCount: map.get(cat)!.filter(i => getStockStatus(i) === 'out').length,
      }));
  }, [items]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#a09080]">
        <span className="text-sm">검색 결과가 없습니다</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const isCollapsed = collapsed.has(group.category);
        return (
          <div key={group.category} className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            {/* Group header */}
            <button
              onClick={() => toggle(group.category)}
              className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-[#faf8f7] transition-colors cursor-pointer"
            >
              <span className="text-lg">{group.icon}</span>
              <span className="text-sm font-bold text-[#6d4e42] flex-1 text-left tracking-tight">
                {group.label}
              </span>
              {/* Mini status counts */}
              <div className="flex items-center gap-2">
                {group.normalCount > 0 && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    {group.normalCount} 정상
                  </span>
                )}
                {group.lowCount > 0 && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    {group.lowCount} 부족
                  </span>
                )}
                {group.outCount > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    {group.outCount} 소진
                  </span>
                )}
                <span className="text-[11px] text-[#a09080] font-medium tabular-nums">{group.items.length}개</span>
              </div>
              {/* Chevron */}
              <svg
                className={`w-4 h-4 text-[#c5b8b0] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Group items */}
            {!isCollapsed && (
              <div className="border-t border-[#f0eeec]">
                {group.items.map((item, idx) => {
                  const status = getStockStatus(item);
                  const isSelected = selectedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(isSelected ? null : item.id)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-150 ${
                        idx < group.items.length - 1 ? 'border-b border-[#f5f2f0]' : ''
                      } ${isSelected ? 'bg-[#b4988d]/[0.06]' : 'hover:bg-[#faf8f7]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
                      <span className="text-sm font-medium text-[#6d4e42] flex-1 truncate">{item.name}</span>
                      {item.specification && (
                        <span className="text-[10px] text-[#b4988d] bg-[#b4988d]/8 px-1.5 py-0.5 rounded-md flex-shrink-0 font-medium">
                          {item.specification}
                        </span>
                      )}
                      <div className="w-24 flex-shrink-0">
                        <ProgressBar current={item.current_stock} min={item.min_stock} />
                      </div>
                      <span className="text-xs text-[#575756] font-medium w-16 text-right flex-shrink-0 tabular-nums">
                        {item.current_stock}/{item.min_stock}
                      </span>
                      <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onStockModal({ item, type: 'in' })}
                          className="px-2 py-1 text-[10px] bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer font-semibold"
                        >
                          입고
                        </button>
                        <button
                          onClick={() => onStockModal({ item, type: 'out' })}
                          className="px-2 py-1 text-[10px] bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer font-semibold disabled:opacity-40"
                          disabled={item.current_stock <= 0}
                        >
                          출고
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
