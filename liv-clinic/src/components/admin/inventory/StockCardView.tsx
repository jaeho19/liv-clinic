'use client';

import { INVENTORY_CATEGORY_LABELS, getStockStatus } from '@/types/admin';
import type { InventoryItem } from '@/types/admin';
import { BURNDOWN_SEVERITY_CONFIG, type BurndownResult } from '@/lib/inventory-utils';

const STOCK_STATUS_CONFIG = {
  normal: { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', stroke: '#34d399', trail: '#ecfdf5' },
  low:    { label: '부족', bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200',   stroke: '#f59e0b', trail: '#fffbeb' },
  out:    { label: '소진', bg: 'bg-red-50',      text: 'text-red-700',     ring: 'ring-red-200',     stroke: '#ef4444', trail: '#fef2f2' },
};

interface StockCardViewProps {
  items: InventoryItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onStockModal: (v: { item: InventoryItem; type: 'in' | 'out' }) => void;
  burndownMap?: Map<string, BurndownResult>;
}

export default function StockCardView({
  items,
  selectedItemId,
  onSelectItem,
  onStockModal,
  burndownMap,
}: StockCardViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#a09080]">
        <div className="w-14 h-14 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <span className="text-sm">검색 결과가 없습니다</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item) => {
        const status = getStockStatus(item);
        const cfg = STOCK_STATUS_CONFIG[status];
        const isSelected = selectedItemId === item.id;
        const pct = item.min_stock > 0
          ? Math.min(100, Math.round((item.current_stock / (item.min_stock * 3)) * 100))
          : (item.current_stock > 0 ? 100 : 0);

        // SVG gauge params
        const size = 68;
        const sw = 5;
        const r = (size - sw) / 2;
        const circ = 2 * Math.PI * r;
        const offset = circ - (pct / 100) * circ;

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(isSelected ? null : item.id)}
            className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-[#b4988d] ring-2 ring-[#b4988d]/15 shadow-md'
                : 'border-[#ebe7e4] hover:border-[#d5cdc7] hover:shadow-md'
            }`}
            style={{ boxShadow: isSelected ? undefined : '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            {/* Top row: name + status badge */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#6d4e42] truncate leading-tight">{item.name}</h4>
                <p className="text-[10px] text-[#a09080] mt-1">
                  {INVENTORY_CATEGORY_LABELS[item.category]}
                  {item.specification && (
                    <span className="ml-1.5 text-[#b4988d] bg-[#b4988d]/8 px-1 py-0.5 rounded">
                      {item.specification}
                    </span>
                  )}
                </p>
              </div>
              <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
            </div>

            {/* Gauge + numbers */}
            <div className="flex items-center gap-4">
              {/* Circular gauge */}
              <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))' }}>
                  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cfg.trail} strokeWidth={sw} />
                  <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={cfg.stroke} strokeWidth={sw} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-[#6d4e42] tabular-nums">{item.current_stock}</span>
                  <span className="text-[9px] text-[#a09080]">{item.unit}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a09080]">최소 재고</span>
                  <span className="text-[#575756] font-medium tabular-nums">{item.min_stock} {item.unit}</span>
                </div>
                {item.supplier && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a09080]">공급사</span>
                    <span className="text-[#575756] truncate ml-2">{item.supplier}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-[#a09080]">단가</span>
                  <span className="text-[#575756] tabular-nums">{item.unit_price.toLocaleString('ko-KR')}원</span>
                </div>
                {burndownMap && (() => {
                  const bd = burndownMap.get(item.id);
                  if (!bd || bd.daysUntilEmpty === Infinity) return null;
                  const scfg = BURNDOWN_SEVERITY_CONFIG[bd.severity];
                  return (
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-[#a09080]">예상 소진</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${scfg.bg} ${scfg.text} ${bd.severity === 'critical' ? 'animate-pulse' : ''}`}>
                        {bd.daysUntilEmpty}일 ({bd.dailyRate}/일)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-[#f0eeec]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onStockModal({ item, type: 'in' })}
                className="flex-1 py-2 text-[11px] bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer font-semibold"
              >
                입고
              </button>
              <button
                onClick={() => onStockModal({ item, type: 'out' })}
                className="flex-1 py-2 text-[11px] bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer font-semibold disabled:opacity-40"
                disabled={item.current_stock <= 0}
              >
                출고
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
