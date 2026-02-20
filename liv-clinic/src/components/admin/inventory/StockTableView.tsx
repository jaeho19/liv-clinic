'use client';

import { ProgressBar } from './StockGauge';
import { INVENTORY_CATEGORY_LABELS, getStockStatus } from '@/types/admin';
import type { InventoryItem } from '@/types/admin';
import { getDisplayName } from '@/lib/inventory-utils';
import ExpiryBadge from './ExpiryBadge';

const STOCK_STATUS_CONFIG = {
  normal: { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  low:    { label: '부족', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  out:    { label: '소진', bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-400' },
};

interface StockTableViewProps {
  items: InventoryItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onStockModal: (v: { item: InventoryItem; type: 'in' | 'out' }) => void;
  expiryMap?: Map<string, string>;
}

export default function StockTableView({
  items,
  selectedItemId,
  onSelectItem,
  onStockModal,
  expiryMap,
}: StockTableViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#ebe7e4]">
              <th className="text-left py-3.5 px-5 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">품목명</th>
              <th className="text-left py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">카테고리</th>
              <th className="text-left py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider w-36">재고 수준</th>
              <th className="text-right py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">현재 / 최소</th>
              <th className="text-center py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">상태</th>
              {expiryMap && <th className="text-center py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">유효기간</th>}
              <th className="text-left py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider">공급사</th>
              <th className="text-center py-3.5 px-4 text-[10px] text-[#a09080] font-semibold uppercase tracking-wider w-28">입출고</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7 + (expiryMap ? 1 : 0)} className="text-center py-20 text-[#a09080]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#f6f4f2] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-sm">검색 결과가 없습니다</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const status = getStockStatus(item);
                const cfg = STOCK_STATUS_CONFIG[status];
                const isSelected = selectedItemId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(isSelected ? null : item.id)}
                    className={`border-b border-[#f5f2f0] last:border-0 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#b4988d]/[0.06] border-l-[3px] border-l-[#b4988d]'
                        : 'hover:bg-[#faf8f7]'
                    }`}
                  >
                    {/* 품목명 */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className="font-semibold text-[#6d4e42]">{getDisplayName(item)}</span>
                        {item.is_refrigerated && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-sky-600 bg-sky-50 px-1 py-0.5 rounded">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
                            </svg>
                            냉장
                          </span>
                        )}
                        {item.specification && (
                          <span className="text-[10px] text-[#b4988d] bg-[#b4988d]/8 px-1.5 py-0.5 rounded-md font-medium">
                            {item.specification}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* 카테고리 */}
                    <td className="py-3.5 px-4 text-[#8a8a8a] text-xs">
                      {INVENTORY_CATEGORY_LABELS[item.category]}
                    </td>
                    {/* 재고 수준 progress bar */}
                    <td className="py-3.5 px-4">
                      <ProgressBar current={item.current_stock} min={item.min_stock} />
                    </td>
                    {/* 현재 / 최소 */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span className="font-semibold text-[#6d4e42]">{item.current_stock}</span>
                      <span className="text-[#c5b8b0] mx-0.5">/</span>
                      <span className="text-[#a09080]">{item.min_stock}</span>
                      <span className="text-[#c5b8b0] text-[10px] ml-0.5">{item.unit}</span>
                    </td>
                    {/* 상태 */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    {/* 유효기간 */}
                    {expiryMap && (
                      <td className="py-3.5 px-4 text-center">
                        {expiryMap.get(item.id) ? (
                          <ExpiryBadge expiryDate={expiryMap.get(item.id)!} size="sm" />
                        ) : (
                          <span className="text-xs text-[#c5b8b0]">-</span>
                        )}
                      </td>
                    )}
                    {/* 공급사 */}
                    <td className="py-3.5 px-4 text-[#a09080] text-xs">{item.supplier || '-'}</td>
                    {/* 입출고 */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onStockModal({ item, type: 'in' })}
                          className="px-2.5 py-1.5 text-[11px] bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer font-semibold"
                        >
                          입고
                        </button>
                        <button
                          onClick={() => onStockModal({ item, type: 'out' })}
                          className="px-2.5 py-1.5 text-[11px] bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer font-semibold disabled:opacity-40"
                          disabled={item.current_stock <= 0}
                        >
                          출고
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
