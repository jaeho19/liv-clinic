'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useInventoryData } from '@/hooks/useInventoryData';
import { getStockStatus, INVENTORY_CATEGORY_LABELS } from '@/types/admin';
import type { InventoryItem, InventoryCategory } from '@/types/admin';
import DashboardStatsCards, { type StockFilter } from '@/components/admin/inventory/DashboardStatsCards';
import TodayUsageSummary from '@/components/admin/inventory/TodayUsageSummary';
import CategoryGrid from '@/components/admin/inventory/CategoryGrid';
import CategoryDetailSection from '@/components/admin/inventory/CategoryDetailSection';
import HistoryTab from '@/components/admin/inventory/HistoryTab';
import RestockTab from '@/components/admin/inventory/RestockTab';
import StockAdjustModal from '@/components/admin/inventory/StockAdjustModal';
import AddItemModal from '@/components/admin/inventory/AddItemModal';
import type { NewItemData } from '@/components/admin/inventory/AddItemModal';

type TabId = 'stock' | 'history' | 'restock';

// ─── Modal components (reused from inventory page) ─────
// StockModal is needed for the detail section's stock operations
function StockModal({
  item,
  type,
  onSubmit,
  onClose,
  submitting = false,
}: {
  item: InventoryItem;
  type: 'in' | 'out';
  onSubmit: (qty: number, note: string, expiryDate?: string) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const isIn = type === 'in';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (!isIn && quantity > item.current_stock) return;
    onSubmit(quantity, note.trim() || (isIn ? '입고' : '출고'), expiryDate || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl border border-[#ebe7e4] w-full max-w-sm mx-4"
        style={{ boxShadow: '0 4px 12px rgba(109,78,66,0.08), 0 20px 48px rgba(109,78,66,0.12)' }}
      >
        <div className={`px-6 py-4 border-b border-[#ebe7e4] ${isIn ? 'bg-emerald-50/60' : 'bg-orange-50/60'}`}>
          <h3 className={`font-bold tracking-tight ${isIn ? 'text-emerald-700' : 'text-orange-700'}`}>
            {isIn ? '입고 처리' : '출고 처리'}
          </h3>
          <p className="text-sm text-[#a09080] mt-0.5">{item.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              현재 재고: <span className="font-bold">{item.current_stock} {item.unit}</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              수량 ({item.unit}) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={!isIn ? item.current_stock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
              required
            />
            {!isIn && quantity > item.current_stock && (
              <p className="text-xs text-red-500 mt-1">현재 재고보다 많이 출고할 수 없습니다.</p>
            )}
          </div>
          {isIn && (
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">유효기간</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
              />
              <p className="text-[10px] text-[#a09080] mt-1">입력 시 배치가 자동 생성됩니다</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">사유</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isIn ? '정기 발주, 긴급 입고 등' : '시술 사용, 폐기 등'}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#ebe7e4] rounded-xl text-sm text-[#a09080] hover:bg-[#faf8f7] transition-colors cursor-pointer font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-40 ${
                isIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {submitting ? '처리 중...' : (isIn ? '입고 확인' : '출고 확인')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────
export default function InventoryOverviewPage() {
  const {
    items, transactions, loading, error, burndownMap, alertItems, loadData,
    todayUsageSessions, todayCategoryUsage, todayItemUsage, weeklyItemUsage,
  } = useInventoryData();
  const [activeTab, setActiveTab] = useState<TabId>('stock');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);
  const [stockModal, setStockModal] = useState<{ item: InventoryItem; type: 'in' | 'out' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  const handleExportCSV = useCallback(() => {
    const STATUS_LABELS: Record<string, string> = { normal: '정상', low: '부족', out: '소진' };
    const headers = ['품목명', '카테고리', '현재재고', '최소재고', '단위', '상태', '공급사', '냉장여부'];
    const rows = items.map(item => [
      item.name,
      INVENTORY_CATEGORY_LABELS[item.category] || item.category,
      item.current_stock,
      item.min_stock,
      item.unit,
      STATUS_LABELS[getStockStatus(item)] || '',
      item.supplier || '',
      item.is_refrigerated ? 'Y' : '',
    ]);

    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `재고현황_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const consumptionData = useMemo(() => {
    const useTxs = transactions.filter(t => t.tx_type === 'use');
    const byItem: Record<string, number> = {};
    for (const tx of useTxs) {
      byItem[tx.item_id] = (byItem[tx.item_id] || 0) + tx.quantity;
    }
    return Object.entries(byItem)
      .map(([itemId, qty]) => ({
        item: items.find(i => i.id === itemId),
        quantity: qty,
      }))
      .filter(d => d.item)
      .sort((a, b) => b.quantity - a.quantity);
  }, [transactions, items]);

  // Dismissed alert IDs (persisted in localStorage)
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const saved = localStorage.getItem('inv_dismissed_alerts');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const handleDismissAlert = useCallback((id: string) => {
    setDismissedAlertIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('inv_dismissed_alerts', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleUndismissAlert = useCallback((id: string) => {
    setDismissedAlertIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem('inv_dismissed_alerts', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleStockChange = useCallback(async (itemId: string, type: 'in' | 'out', quantity: number, note: string, expiryDate?: string) => {
    setSubmitting(true);
    try {
      const endpoint = type === 'in' ? '/api/admin/inventory/restock' : '/api/admin/inventory/use';
      const body = type === 'in'
        ? { item_id: itemId, quantity, note, expiry_date: expiryDate }
        : { items: [{ item_id: itemId, quantity }], note };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '처리에 실패했습니다.');
      }
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [loadData]);

  const handleAdjust = useCallback(async (itemId: string, newQuantity: number, reason: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, new_quantity: newQuantity, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '처리에 실패했습니다.');
      }
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [loadData]);

  const handleAddItem = useCallback(async (data: NewItemData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '등록에 실패했습니다.');
      }
      setShowAddItem(false);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-[3px] border-[#b4988d]/30 border-t-[#b4988d] rounded-full animate-spin mb-4" />
          <p className="text-[#a09080] text-sm">재고 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#6d4e42] text-white rounded-xl text-sm font-medium hover:bg-[#5a3d33] transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 lg:mb-7">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42] tracking-tight">
            재고 현황
          </h2>
          <p className="text-xs text-[#a09080] mt-1">
            카테고리별 재고 현황을 한눈에 확인합니다
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 border border-[#ebe7e4] text-[#6d4e42] rounded-xl text-sm font-semibold hover:bg-[#faf8f7] transition-all duration-150 flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all duration-150 flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            새 물품 추가
          </button>
          <Link
            href="/admin/inventory"
            className="px-4 py-2.5 bg-[#6d4e42] text-white rounded-xl text-sm font-semibold hover:bg-[#5a3d33] transition-all duration-150 flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            물품 사용 기록
          </Link>
        </div>
      </div>

      {/* Dashboard stats */}
      <DashboardStatsCards
        items={items}
        todayCategoryUsage={todayCategoryUsage}
        alertItems={alertItems}
        onAlertClick={() => setActiveTab('restock')}
        activeFilter={stockFilter}
        onFilterChange={setStockFilter}
      />

      {/* Tab Navigation */}
      <div className="flex gap-0.5 bg-[#f6f4f2] p-1 rounded-xl w-fit mb-5">
        {([
          { id: 'stock' as TabId, label: '재고 현황', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
          { id: 'history' as TabId, label: '사용 이력', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { id: 'restock' as TabId, label: '입고 관리', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#6d4e42] shadow-sm'
                : 'text-[#a09080] hover:text-[#575756]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && (
        <>
          {/* Today usage summary */}
          <TodayUsageSummary
            sessions={todayUsageSessions}
            items={items}
            transactions={transactions}
          />

          {/* Category grid */}
          <CategoryGrid
            items={items}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            todayCategoryUsage={todayCategoryUsage}
            weeklyItemUsage={weeklyItemUsage}
            todayItemUsage={todayItemUsage}
            stockFilter={stockFilter}
          />

          {/* Category detail section */}
          {selectedCategory && (
            <CategoryDetailSection
              category={selectedCategory}
              items={items}
              transactions={transactions}
              burndownMap={burndownMap}
              onStockModal={setStockModal}
              dismissedAlertIds={dismissedAlertIds}
              onDismissAlert={handleDismissAlert}
              onUndismissAlert={handleUndismissAlert}
              todayItemUsage={todayItemUsage}
              stockFilter={stockFilter}
              onAdjust={setAdjustModal}
            />
          )}
        </>
      )}

      {activeTab === 'history' && (
        <HistoryTab
          transactions={transactions}
          items={items}
          consumptionData={consumptionData}
        />
      )}

      {activeTab === 'restock' && (
        <RestockTab
          transactions={transactions}
          items={items}
          alertItems={alertItems}
          dismissedIds={dismissedAlertIds}
          onDismiss={handleDismissAlert}
          onUndismiss={handleUndismissAlert}
          onStockModal={setStockModal}
          burndownMap={burndownMap}
        />
      )}

      {/* Stock modal */}
      {stockModal && (
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onSubmit={(qty, note, expiryDate) => {
            handleStockChange(stockModal.item.id, stockModal.type, qty, note, expiryDate);
            setStockModal(null);
          }}
          onClose={() => setStockModal(null)}
          submitting={submitting}
        />
      )}

      {/* Adjust modal */}
      {adjustModal && (
        <StockAdjustModal
          item={adjustModal}
          onSubmit={async (newQty, reason) => {
            await handleAdjust(adjustModal.id, newQty, reason);
            setAdjustModal(null);
          }}
          onClose={() => setAdjustModal(null)}
          submitting={submitting}
        />
      )}

      {/* Add item modal */}
      {showAddItem && (
        <AddItemModal
          onSubmit={handleAddItem}
          onClose={() => setShowAddItem(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
