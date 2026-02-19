'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_SUBCATEGORY_LABELS,
  getStockStatus,
} from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';
import type { BurndownResult } from '@/lib/inventory-utils';
import type { StockFilter } from './DashboardStatsCards';
import StockTableView from './StockTableView';
import StockCardView from './StockCardView';
import AlertBanner from './AlertBanner';
import DetailPanel from './DetailPanel';
import type { InventoryTransaction } from '@/types/admin';

type ViewMode = 'table' | 'card';

interface CategoryDetailSectionProps {
  category: InventoryCategory;
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  burndownMap: Map<string, BurndownResult>;
  onStockModal: (v: { item: InventoryItem; type: 'in' | 'out' }) => void;
  dismissedAlertIds: Set<string>;
  onDismissAlert: (id: string) => void;
  onUndismissAlert: (id: string) => void;
  todayItemUsage?: Map<string, number>;
  stockFilter?: StockFilter;
  onAdjust?: (item: InventoryItem) => void;
}

export default function CategoryDetailSection({
  category,
  items,
  transactions,
  burndownMap,
  onStockModal,
  dismissedAlertIds,
  onDismissAlert,
  onUndismissAlert,
  todayItemUsage,
  stockFilter,
  onAdjust,
}: CategoryDetailSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expiryMap, setExpiryMap] = useState<Map<string, string>>(new Map());

  // Fetch expiry map for all items
  const fetchExpiryMap = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inventory/batches?all=true');
      if (res.ok) {
        const data = await res.json();
        if (data.expiryMap) {
          setExpiryMap(new Map(Object.entries(data.expiryMap)));
        }
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchExpiryMap(); }, [fetchExpiryMap]);

  const categoryItems = useMemo(() => {
    return items.filter(i => i.is_active && i.category === category);
  }, [items, category]);

  // Get unique subcategories for this category
  const subCategories = useMemo(() => {
    const subs = new Set<string>();
    for (const item of categoryItems) {
      if (item.sub_category) subs.add(item.sub_category);
    }
    return Array.from(subs).sort();
  }, [categoryItems]);

  const filtered = useMemo(() => {
    return categoryItems.filter(item => {
      if (stockFilter && stockFilter !== 'all') {
        const status = getStockStatus(item);
        if (stockFilter !== status) return false;
      }
      if (subCategoryFilter !== 'all' && item.sub_category !== subCategoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || (item.supplier || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [categoryItems, subCategoryFilter, searchQuery, stockFilter]);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const selectedTxs = useMemo(() => {
    if (!selectedItemId) return [];
    return transactions.filter(t => t.item_id === selectedItemId).slice(0, 15);
  }, [transactions, selectedItemId]);

  const label = INVENTORY_CATEGORY_LABELS[category];

  const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'card', label: '카드',
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    },
    {
      id: 'table', label: '테이블',
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>,
    },
  ];

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#6d4e42] tracking-tight">
          {label} <span className="text-sm font-normal text-[#a09080]">({filtered.length}개 품목)</span>
        </h3>
        <div className="flex gap-0.5 bg-[#f6f4f2] p-0.5 rounded-lg">
          {VIEW_MODES.map(vm => (
            <button
              key={vm.id}
              onClick={() => setViewMode(vm.id)}
              title={vm.label}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                viewMode === vm.id
                  ? 'bg-white text-[#6d4e42] shadow-sm'
                  : 'text-[#a09080] hover:text-[#575756]'
              }`}
            >
              {vm.icon}
              <span className="hidden sm:inline">{vm.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert banner for this category */}
      <AlertBanner
        items={categoryItems}
        dismissedIds={dismissedAlertIds}
        onDismiss={onDismissAlert}
        onUndismiss={onUndismissAlert}
        onStockModal={onStockModal}
      />

      {/* Subcategory filter chips + search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {subCategories.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSubCategoryFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                subCategoryFilter === 'all'
                  ? 'bg-[#6d4e42] text-white'
                  : 'bg-[#f6f4f2] text-[#a09080] hover:bg-[#ebe7e4]'
              }`}
            >
              전체
            </button>
            {subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSubCategoryFilter(subCategoryFilter === sub ? 'all' : sub)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  subCategoryFilter === sub
                    ? 'bg-[#6d4e42] text-white'
                    : 'bg-[#f6f4f2] text-[#a09080] hover:bg-[#ebe7e4]'
                }`}
              >
                {INVENTORY_SUBCATEGORY_LABELS[sub] || sub}
              </button>
            ))}
          </div>
        )}
        <div className="relative ml-auto">
          <svg className="w-4 h-4 text-[#c5b8b0] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#ebe7e4] rounded-xl pl-9 pr-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow placeholder:text-[#c5b8b0]"
          />
        </div>
      </div>

      {/* Items view + detail panel */}
      <div className="flex gap-5">
        <div className={selectedItemId ? 'flex-1 min-w-0' : 'w-full'}>
          {viewMode === 'card' ? (
            <StockCardView
              items={filtered}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
              onStockModal={onStockModal}
              burndownMap={burndownMap}
              todayItemUsage={todayItemUsage}
              expiryMap={expiryMap}
            />
          ) : (
            <StockTableView
              items={filtered}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
              onStockModal={onStockModal}
              burndownMap={burndownMap}
              expiryMap={expiryMap}
            />
          )}
        </div>

        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            txs={selectedTxs}
            onClose={() => setSelectedItemId(null)}
            onDelete={() => {}}
            onAdjust={onAdjust}
            expiryDate={expiryMap.get(selectedItem.id)}
          />
        )}
      </div>
    </div>
  );
}
