'use client';

import { useState } from 'react';
import { ProgressBar } from './StockGauge';
import { getStockStatus, INVENTORY_CATEGORY_LABELS } from '@/types/admin';
import type { InventoryItem } from '@/types/admin';

interface AlertBannerProps {
  items: InventoryItem[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onUndismiss: (id: string) => void;
  onStockModal: (v: { item: InventoryItem; type: 'in' }) => void;
}

export default function AlertBanner({
  items,
  dismissedIds,
  onDismiss,
  onUndismiss,
  onStockModal,
}: AlertBannerProps) {
  const outItems = items.filter(i => getStockStatus(i) === 'out' && !dismissedIds.has(i.id));
  const lowItems = items.filter(i => getStockStatus(i) === 'low' && !dismissedIds.has(i.id));
  const dismissedItems = items.filter(i =>
    dismissedIds.has(i.id) && (getStockStatus(i) === 'out' || getStockStatus(i) === 'low')
  );

  const activeCount = outItems.length + lowItems.length;
  const [expanded, setExpanded] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);

  if (activeCount === 0 && dismissedItems.length === 0) return null;

  return (
    <div className="mb-5 space-y-2.5">
      {/* Summary bar */}
      {activeCount > 0 && (
        <div className={`bg-white rounded-2xl overflow-hidden border ${
          outItems.length > 0 ? 'border-red-200' : 'border-amber-200'
        }`}
          style={{ boxShadow: outItems.length > 0
            ? '0 1px 3px rgba(239,68,68,0.06), 0 4px 12px rgba(239,68,68,0.04)'
            : '0 1px 3px rgba(245,158,11,0.06), 0 4px 12px rgba(245,158,11,0.04)'
          }}
        >
          {/* Collapsed summary header */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-[#faf8f7] transition-colors"
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              outItems.length > 0 ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <svg className={`w-4.5 h-4.5 ${outItems.length > 0 ? 'text-red-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            {/* Summary text */}
            <div className="flex-1 text-left">
              <span className="text-sm font-bold text-[#6d4e42] tracking-tight">
                재고 확인 필요
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {outItems.length > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    소진 {outItems.length}
                  </span>
                )}
                {lowItems.length > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    부족 {lowItems.length}
                  </span>
                )}
                {dismissedItems.length > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    무시 {dismissedItems.length}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <svg
              className={`w-4 h-4 text-[#c5b8b0] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expanded detail list */}
          {expanded && (
            <div className="border-t border-[#f0eeec]">
              {/* Out-of-stock items */}
              {outItems.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-red-50/60">
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                      소진 — 즉시 발주 필요
                    </span>
                  </div>
                  {outItems.map(item => (
                    <AlertRow
                      key={item.id}
                      item={item}
                      urgency="critical"
                      onDismiss={() => onDismiss(item.id)}
                      onRestock={() => onStockModal({ item, type: 'in' })}
                    />
                  ))}
                </div>
              )}

              {/* Low-stock items */}
              {lowItems.length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-amber-50/60">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      부족 — 발주 검토 필요
                    </span>
                  </div>
                  {lowItems.map(item => (
                    <AlertRow
                      key={item.id}
                      item={item}
                      urgency="warning"
                      onDismiss={() => onDismiss(item.id)}
                      onRestock={() => onStockModal({ item, type: 'in' })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dismissed items (collapsed by default) */}
      {dismissedItems.length > 0 && (
        <div className="bg-white border border-[#ebe7e4] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 2px rgba(109,78,66,0.03)' }}
        >
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className="w-full px-5 py-3 flex items-center gap-2.5 cursor-pointer hover:bg-[#faf8f7] transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
            <span className="text-xs text-[#a09080] font-medium flex-1 text-left">
              발주 불필요 처리된 품목 ({dismissedItems.length})
            </span>
            <svg
              className={`w-3.5 h-3.5 text-[#c5b8b0] transition-transform duration-200 ${showDismissed ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDismissed && (
            <div className="border-t border-[#f0eeec]">
              {dismissedItems.map(item => {
                const status = getStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className="px-5 py-3 flex items-center gap-3 border-b border-[#f5f2f0] last:border-0 opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === 'out' ? 'bg-red-300' : 'bg-amber-300'
                    }`} />
                    <span className="text-sm text-[#8a8a8a] flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-[#a09080] tabular-nums">
                      {item.current_stock}/{item.min_stock} {item.unit}
                    </span>
                    <button
                      onClick={() => onUndismiss(item.id)}
                      className="text-[10px] text-[#b4988d] hover:text-[#6d4e42] font-semibold cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#f6f4f2] transition-colors"
                    >
                      알림 복원
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* No active alerts, only dismissed */}
      {activeCount === 0 && dismissedItems.length > 0 && !showDismissed && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3"
          style={{ boxShadow: '0 1px 3px rgba(16,185,129,0.06)' }}
        >
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-emerald-700 font-semibold">
            발주 필요 품목 없음
          </span>
          <span className="text-xs text-emerald-500">
            (무시 처리 {dismissedItems.length}건)
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Alert Row ──────────────────────────────────
function AlertRow({
  item,
  urgency,
  onDismiss,
  onRestock,
}: {
  item: InventoryItem;
  urgency: 'critical' | 'warning';
  onDismiss: () => void;
  onRestock: () => void;
}) {
  const isCritical = urgency === 'critical';
  const suggestedQty = Math.max(item.min_stock * 2 - item.current_stock, item.min_stock);

  return (
    <div className={`px-5 py-3.5 flex items-center gap-3 border-b border-[#f5f2f0] last:border-0 hover:bg-[#faf8f7] transition-colors ${
      isCritical ? 'bg-red-50/20' : ''
    }`}>
      {/* Status dot + name */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        isCritical ? 'bg-red-500' : 'bg-amber-500'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#6d4e42] truncate">{item.name}</span>
          {item.specification && item.specification !== '-' && (
            <span className="text-[10px] text-[#b4988d] bg-[#b4988d]/8 px-1 py-0.5 rounded-md flex-shrink-0 font-medium">
              {item.specification}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#a09080]">{INVENTORY_CATEGORY_LABELS[item.category]}</span>
          {item.supplier && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-[#d5cdc7]" />
              <span className="text-[10px] text-[#a09080]">{item.supplier}</span>
            </>
          )}
        </div>
      </div>

      {/* Progress + stock numbers */}
      <div className="w-20 flex-shrink-0">
        <ProgressBar current={item.current_stock} min={item.min_stock} height={4} />
      </div>
      <span className="text-xs text-[#575756] font-medium w-16 text-right flex-shrink-0 tabular-nums">
        {item.current_stock}/{item.min_stock}
      </span>

      {/* Suggested qty */}
      <span className="text-[10px] text-[#b4988d] w-16 text-right flex-shrink-0 hidden lg:block tabular-nums">
        +{suggestedQty} 권장
      </span>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={onRestock}
          className={`px-2.5 py-1.5 text-[10px] rounded-lg font-semibold transition-colors cursor-pointer ${
            isCritical
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          입고
        </button>
        <button
          onClick={onDismiss}
          className="px-2 py-1.5 text-[10px] text-[#a09080] hover:text-[#575756] rounded-lg hover:bg-[#f0eeec] transition-colors cursor-pointer"
          title="발주 불필요 - 알림 무시"
        >
          무시
        </button>
      </div>
    </div>
  );
}
