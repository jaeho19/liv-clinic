'use client';

import { useState, useMemo } from 'react';
import { ProgressBar } from './StockGauge';
import { getStockStatus, INVENTORY_CATEGORY_LABELS } from '@/types/admin';
import type { InventoryItem, InventoryTransaction } from '@/types/admin';
import type { BurndownResult } from '@/lib/inventory-utils';
import { BURNDOWN_SEVERITY_CONFIG } from '@/lib/inventory-utils';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

interface RestockTabProps {
  transactions: InventoryTransaction[];
  items: InventoryItem[];
  alertItems: InventoryItem[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onUndismiss: (id: string) => void;
  onStockModal: (v: { item: InventoryItem; type: 'in' }) => void;
  burndownMap?: Map<string, BurndownResult>;
}

export default function RestockTab({ transactions, items, alertItems, dismissedIds, onDismiss, onUndismiss, onStockModal, burndownMap }: RestockTabProps) {
  const restockTxs = useMemo(() => {
    return transactions
      .filter(t => t.tx_type === 'restock')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions]);

  const activeAlerts = alertItems.filter(i => !dismissedIds.has(i.id));
  const dismissedAlerts = alertItems.filter(i => dismissedIds.has(i.id));
  const outItems = activeAlerts.filter(i => getStockStatus(i) === 'out');
  const lowItems = activeAlerts.filter(i => getStockStatus(i) === 'low');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Restock recommendations */}
      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-[#ebe7e4]"
          style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
        >
          <div className="px-5 py-3.5 border-b border-[#ebe7e4] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#6d4e42] tracking-tight">발주 추천</h3>
            <div className="flex items-center gap-2">
              {activeAlerts.length > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                  {activeAlerts.length}개 품목
                </span>
              )}
            </div>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-[#a09080]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-emerald-600">발주 필요 품목 없음</span>
              {dismissedAlerts.length > 0 && (
                <span className="text-xs text-[#a09080] mt-1">(무시 처리 {dismissedAlerts.length}건)</span>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#f0eeec] max-h-[500px] overflow-y-auto">
              {outItems.map(item => (
                <RestockCard key={item.id} item={item} urgency="critical" burndown={burndownMap?.get(item.id)} onRestock={() => onStockModal({ item, type: 'in' })} onDismiss={() => onDismiss(item.id)} />
              ))}
              {lowItems.map(item => (
                <RestockCard key={item.id} item={item} urgency="warning" burndown={burndownMap?.get(item.id)} onRestock={() => onStockModal({ item, type: 'in' })} onDismiss={() => onDismiss(item.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Dismissed items in restock tab */}
        {dismissedAlerts.length > 0 && (
          <DismissedSection items={dismissedAlerts} onUndismiss={onUndismiss} />
        )}
      </div>

      {/* Recent restock history */}
      <div className="bg-white rounded-2xl border border-[#ebe7e4]"
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
      >
        <div className="px-5 py-3.5 border-b border-[#ebe7e4]">
          <h3 className="font-bold text-sm text-[#6d4e42] tracking-tight">최근 입고 내역</h3>
        </div>
        {restockTxs.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-[#a09080]">
            <div className="w-12 h-12 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <span className="text-sm">입고 내역이 없습니다</span>
          </div>
        ) : (
          <div className="divide-y divide-[#f0eeec] max-h-[500px] overflow-y-auto">
            {restockTxs.map(tx => {
              const item = items.find(i => i.id === tx.item_id);
              return (
                <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#faf8f7] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#6d4e42] truncate">{item?.name || '-'}</span>
                      <span className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-2 tabular-nums">
                        +{tx.quantity}{item?.unit}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#a09080] mt-0.5">
                      {formatDate(tx.created_at)}
                      {tx.note && ` | ${tx.note}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Restock card ────────────────────────────────
function RestockCard({
  item,
  urgency,
  burndown,
  onRestock,
  onDismiss,
}: {
  item: InventoryItem;
  urgency: 'critical' | 'warning';
  burndown?: BurndownResult;
  onRestock: () => void;
  onDismiss: () => void;
}) {
  const isCritical = urgency === 'critical';
  const baseSuggestedQty = Math.max(item.min_stock * 2 - item.current_stock, item.min_stock);
  const burndownSuggestedQty = burndown && burndown.dailyRate > 0
    ? Math.ceil(burndown.dailyRate * 30)
    : 0;
  const suggestedQty = Math.max(baseSuggestedQty, burndownSuggestedQty);

  const daysText = burndown && burndown.dailyRate > 0
    ? burndown.daysUntilEmpty === Infinity
      ? null
      : `약 ${burndown.daysUntilEmpty}일 뒤 소진 예상`
    : null;

  const severityCfg = burndown ? BURNDOWN_SEVERITY_CONFIG[burndown.severity] : null;

  return (
    <div className={`px-5 py-4 ${isCritical ? 'bg-red-50/20' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isCritical ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {isCritical ? (
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[#6d4e42] truncate">{item.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isCritical ? '소진' : '부족'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#a09080] mb-2.5">
            <span>{INVENTORY_CATEGORY_LABELS[item.category]}</span>
            {item.supplier && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-[#d5cdc7]" />
                <span>{item.supplier}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1">
              <ProgressBar current={item.current_stock} min={item.min_stock} height={5} />
            </div>
            <span className="text-xs font-medium text-[#575756] tabular-nums">
              {item.current_stock}/{item.min_stock} {item.unit}
            </span>
          </div>
          {daysText && severityCfg && (
            <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg text-[10px] font-semibold ${severityCfg.bg} ${severityCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${severityCfg.dot}`} />
              {daysText}
              {burndown && burndown.dailyRate > 0 && (
                <span className="ml-auto opacity-75">일 {burndown.dailyRate.toFixed(1)}{item.unit} 사용</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#b4988d] tabular-nums">
              권장 발주량: {suggestedQty}{item.unit}
              {burndownSuggestedQty > baseSuggestedQty && (
                <span className="ml-1 text-[#a09080]">(30일치)</span>
              )}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={onDismiss}
                className="px-2.5 py-1.5 text-xs text-[#a09080] hover:text-[#575756] rounded-lg hover:bg-[#f0eeec] transition-colors cursor-pointer"
              >
                발주 불필요
              </button>
              <button
                onClick={onRestock}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                  isCritical
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                입고 처리
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dismissed section ──────────────────────────
function DismissedSection({
  items,
  onUndismiss,
}: {
  items: InventoryItem[];
  onUndismiss: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(109,78,66,0.03)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 flex items-center gap-2.5 cursor-pointer hover:bg-[#faf8f7] transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
        <span className="text-xs text-[#a09080] font-medium flex-1 text-left">
          발주 불필요 ({items.length})
        </span>
        <svg
          className={`w-3.5 h-3.5 text-[#c5b8b0] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-[#f0eeec] divide-y divide-[#f5f2f0]">
          {items.map(item => {
            const status = getStockStatus(item);
            return (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3 opacity-60 hover:opacity-80 transition-opacity">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  status === 'out' ? 'bg-red-300' : 'bg-amber-300'
                }`} />
                <span className="text-sm text-[#8a8a8a] flex-1 truncate">{item.name}</span>
                <span className="text-xs text-[#a09080] tabular-nums">{item.current_stock}/{item.min_stock}</span>
                <button
                  onClick={() => onUndismiss(item.id)}
                  className="text-[10px] text-[#b4988d] hover:text-[#6d4e42] font-semibold cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#f6f4f2] transition-colors"
                >
                  복원
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
