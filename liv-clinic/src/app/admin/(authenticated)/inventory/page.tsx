'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  INVENTORY_CATEGORY_LABELS,
  NURSE_OPTIONS,
  PROCEDURE_NAMES,
  getStockStatus,
} from '@/types/admin';
import type {
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  ProcedureRecipe,
} from '@/types/admin';

import type { BurndownResult } from '@/lib/inventory-utils';

// ─── New visual components ─────────────────────
import StockDashboard from '@/components/admin/inventory/StockDashboard';
import StockTableView from '@/components/admin/inventory/StockTableView';
import StockCardView from '@/components/admin/inventory/StockCardView';
import StockGroupView from '@/components/admin/inventory/StockGroupView';
import AlertBanner from '@/components/admin/inventory/AlertBanner';
import HistoryTab from '@/components/admin/inventory/HistoryTab';
import RestockTab from '@/components/admin/inventory/RestockTab';
import DetailPanel from '@/components/admin/inventory/DetailPanel';

// ─── API fetch ──────────────────────────────────
async function fetchItems(): Promise<InventoryItem[]> {
  const res = await fetch('/api/admin/inventory');
  if (!res.ok) throw new Error('품목 목록을 불러오지 못했습니다.');
  return res.json();
}

async function fetchTransactions(): Promise<InventoryTransaction[]> {
  const res = await fetch('/api/admin/inventory/transactions?limit=200');
  if (!res.ok) throw new Error('사용 이력을 불러오지 못했습니다.');
  return res.json();
}

async function fetchRecipes(): Promise<ProcedureRecipe[]> {
  const res = await fetch('/api/admin/inventory/recipes');
  if (!res.ok) throw new Error('시술 레시피를 불러오지 못했습니다.');
  return res.json();
}

interface BurndownApiItem {
  itemId: string;
  dailyRate: number;
  daysUntilEmpty: number;
  estimatedDate: string;
  severity: 'safe' | 'warning' | 'critical';
}

interface BurndownApiResponse {
  items: BurndownApiItem[];
  categorySummary: { category: string; totalItems: number; totalValue: number; criticalCount: number; warningCount: number }[];
}

async function fetchBurndown(): Promise<BurndownApiResponse> {
  const res = await fetch('/api/admin/inventory/burndown');
  if (!res.ok) return { items: [], categorySummary: [] };
  return res.json();
}

// ─── Types ──────────────────────────────────────
type TabId = 'stock' | 'history' | 'restock';
type ViewMode = 'table' | 'card' | 'group';

// ─── Main Component ─────────────────────────────
export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [recipes, setRecipes] = useState<ProcedureRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('stock');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [stockModal, setStockModal] = useState<{ item: InventoryItem; type: 'in' | 'out' } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [burndownMap, setBurndownMap] = useState<Map<string, BurndownResult>>(new Map());
  const [categorySummary, setCategorySummary] = useState<BurndownApiResponse['categorySummary']>([]);

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

  // ─── Data Load ────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [itemsData, txData, recipesData, burndownData] = await Promise.all([
        fetchItems(),
        fetchTransactions(),
        fetchRecipes(),
        fetchBurndown(),
      ]);
      setItems(itemsData);
      setTransactions(txData);
      setRecipes(recipesData);

      // Build burndown map
      const map = new Map<string, BurndownResult>();
      for (const bd of burndownData.items) {
        map.set(bd.itemId, {
          dailyRate: bd.dailyRate,
          daysUntilEmpty: bd.daysUntilEmpty,
          estimatedDate: bd.estimatedDate,
          severity: bd.severity,
        });
      }
      setBurndownMap(map);
      setCategorySummary(burndownData.categorySummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtering ────────────────────────────────
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!item.is_active) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && getStockStatus(item) !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || (item.supplier || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, categoryFilter, statusFilter, searchQuery]);

  // Alert items
  const alertItems = useMemo(() => {
    return items.filter(i => i.is_active && (getStockStatus(i) === 'out' || getStockStatus(i) === 'low'));
  }, [items]);

  // Selected item data
  const selectedTxs = useMemo(() => {
    if (!selectedItemId) return [];
    return transactions.filter((t) => t.item_id === selectedItemId).slice(0, 15);
  }, [transactions, selectedItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // Consumption data for history tab
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

  // ─── API Handlers ─────────────────────────────
  const handleUseItems = useCallback(async (data: {
    patientName: string;
    chartNumber: string;
    confirmedBy: string;
    note: string;
    usageItems: { itemId: string; quantity: number }[];
  }) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: data.usageItems.map(u => ({ item_id: u.itemId, quantity: u.quantity })),
          patient_name: data.patientName,
          chart_number: data.chartNumber,
          note: data.note,
          confirmed_by: data.confirmedBy,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '사용 기록 저장에 실패했습니다.');
      }
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [loadData]);

  const handleStockChange = useCallback(async (itemId: string, type: 'in' | 'out', quantity: number, note: string) => {
    setSubmitting(true);
    try {
      const endpoint = type === 'in' ? '/api/admin/inventory/restock' : '/api/admin/inventory/use';
      const body = type === 'in'
        ? { item_id: itemId, quantity, note }
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

  const handleAddItem = useCallback(async (newItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '품목 등록에 실패했습니다.');
      }
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [loadData]);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (!confirm('이 품목을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '삭제에 실패했습니다.');
      }
      if (selectedItemId === id) setSelectedItemId(null);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    }
  }, [selectedItemId, loadData]);

  // ─── Tabs & View modes ────────────────────────
  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'stock', label: '재고 현황',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    },
    {
      id: 'history', label: '사용 이력',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      id: 'restock', label: '입고 관리',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>,
    },
  ];

  const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'table', label: '테이블',
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>,
    },
    {
      id: 'card', label: '카드',
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    },
    {
      id: 'group', label: '그룹',
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
  ];

  // ─── Loading / Error ──────────────────────────
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
            onClick={() => { setLoading(true); loadData(); }}
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
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42] tracking-tight">재고관리</h2>
          <p className="text-xs text-[#a09080] mt-1">품목 재고 현황을 한눈에 확인하고 관리합니다</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowUseModal(true)}
            className="px-4 py-2.5 bg-[#6d4e42] text-white rounded-xl text-sm font-semibold hover:bg-[#5a3d33] transition-all duration-150 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            물품 사용 기록
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#b4988d] text-white rounded-xl text-sm font-semibold hover:bg-[#a08878] transition-all duration-150 cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            새 품목 등록
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <StockDashboard items={items} categorySummary={categorySummary} />

      {/* Alerts */}
      <AlertBanner
        items={items.filter(i => i.is_active)}
        dismissedIds={dismissedAlertIds}
        onDismiss={handleDismissAlert}
        onUndismiss={handleUndismissAlert}
        onStockModal={setStockModal}
      />

      {/* Tab Navigation */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex gap-0.5 bg-[#f6f4f2] p-1 rounded-xl">
          {TABS.map(tab => (
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

        {/* View mode toggle (stock tab only) */}
        {activeTab === 'stock' && (
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
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && (
        <>
          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-[#ebe7e4] p-4 mb-5"
            style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <svg className="w-4 h-4 text-[#c5b8b0] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="품목명 또는 공급사 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-[#ebe7e4] rounded-xl pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow placeholder:text-[#c5b8b0]"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] text-[#575756] transition-shadow"
              >
                <option value="all">전체 카테고리</option>
                {(Object.entries(INVENTORY_CATEGORY_LABELS) as [InventoryCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] text-[#575756] transition-shadow"
              >
                <option value="all">전체 상태</option>
                <option value="normal">정상</option>
                <option value="low">부족</option>
                <option value="out">소진</option>
              </select>
              <span className="text-xs text-[#a09080] ml-auto font-medium tabular-nums">{filtered.length}개 품목</span>
            </div>
          </div>

          {/* Main area: view + detail panel */}
          <div className="flex gap-5">
            <div className={selectedItemId ? 'flex-1 min-w-0' : 'w-full'}>
              {viewMode === 'table' && (
                <StockTableView
                  items={filtered}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onStockModal={setStockModal}
                  burndownMap={burndownMap}
                />
              )}
              {viewMode === 'card' && (
                <StockCardView
                  items={filtered}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onStockModal={setStockModal}
                  burndownMap={burndownMap}
                />
              )}
              {viewMode === 'group' && (
                <StockGroupView
                  items={filtered}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onStockModal={setStockModal}
                />
              )}
            </div>

            {/* Detail panel */}
            {selectedItem && (
              <DetailPanel
                item={selectedItem}
                txs={selectedTxs}
                onClose={() => setSelectedItemId(null)}
                onDelete={() => handleDeleteItem(selectedItem.id)}
              />
            )}
          </div>
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
        />
      )}

      {/* ─── Modals ──────────────────────────────── */}
      {showUseModal && (
        <UseItemModal
          items={items.filter(i => i.is_active)}
          recipes={recipes}
          onSubmit={(data) => {
            handleUseItems(data);
            setShowUseModal(false);
          }}
          onClose={() => setShowUseModal(false)}
          submitting={submitting}
        />
      )}

      {stockModal && (
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onSubmit={(qty, note) => {
            handleStockChange(stockModal.item.id, stockModal.type, qty, note);
            setStockModal(null);
          }}
          onClose={() => setStockModal(null)}
          submitting={submitting}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onAdd={(data) => {
            handleAddItem(data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal Components (kept in page for simplicity)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── UseItemModal ───────────────────────────────
function UseItemModal({
  items,
  recipes,
  onSubmit,
  onClose,
  submitting = false,
}: {
  items: InventoryItem[];
  recipes: ProcedureRecipe[];
  onSubmit: (data: {
    patientName: string;
    chartNumber: string;
    confirmedBy: string;
    note: string;
    usageItems: { itemId: string; quantity: number }[];
  }) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}) {
  const [patientName, setPatientName] = useState('');
  const [chartNumber, setChartNumber] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [confirmedBy, setConfirmedBy] = useState('');
  const [note, setNote] = useState('');
  const [usageItems, setUsageItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [addItemId, setAddItemId] = useState('');

  const handleProcedureChange = (procedureName: string) => {
    setSelectedProcedure(procedureName);
    if (!procedureName) {
      setUsageItems([]);
      return;
    }
    const recipeItems = recipes
      .filter(r => r.procedure_name === procedureName)
      .map(r => ({ itemId: r.item_id, quantity: r.default_qty }));
    setUsageItems(recipeItems);
    setNote(procedureName);
  };

  const handleQtyChange = (idx: number, qty: number) => {
    setUsageItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const handleRemoveItem = (idx: number) => {
    setUsageItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    if (!addItemId) return;
    if (usageItems.some(u => u.itemId === addItemId)) return;
    setUsageItems(prev => [...prev, { itemId: addItemId, quantity: 1 }]);
    setAddItemId('');
  };

  const canSubmit = patientName.trim() && chartNumber.trim() && usageItems.length > 0;

  const getStockWarning = (itemId: string, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return null;
    if (item.current_stock < qty) return `재고 부족 (현재: ${item.current_stock})`;
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      patientName: patientName.trim(),
      chartNumber: chartNumber.trim(),
      confirmedBy,
      note: note.trim(),
      usageItems,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl border border-[#ebe7e4] w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 4px 12px rgba(109,78,66,0.08), 0 20px 48px rgba(109,78,66,0.12)' }}
      >
        <div className="px-6 py-4 border-b border-[#ebe7e4] bg-[#faf8f7]">
          <h3 className="font-bold text-[#6d4e42] tracking-tight">물품 사용 기록</h3>
          <p className="text-xs text-[#a09080] mt-0.5">환자 시술 시 사용한 물품을 기록하면 재고가 자동 차감됩니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                환자명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="홍길동"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                차트번호 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={chartNumber}
                onChange={(e) => setChartNumber(e.target.value)}
                placeholder="차트번호"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">시술 선택 (레시피 자동 로드)</label>
            <select
              value={selectedProcedure}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
            >
              <option value="">직접 선택</option>
              {PROCEDURE_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#575756] mb-2">
              사용 물품 {usageItems.length > 0 && `(${usageItems.length}개)`}
            </label>
            {usageItems.length === 0 ? (
              <p className="text-xs text-[#a09080] bg-[#faf8f7] rounded-xl p-3.5 text-center">
                시술을 선택하거나 아래에서 물품을 추가하세요.
              </p>
            ) : (
              <div className="space-y-2 mb-3">
                {usageItems.map((usage, idx) => {
                  const item = items.find(i => i.id === usage.itemId);
                  const warning = getStockWarning(usage.itemId, usage.quantity);
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-[#faf8f7] rounded-xl px-3 py-2.5">
                      <span className="text-sm text-[#575756] flex-1 truncate font-medium">{item?.name || '알 수 없는 품목'}</span>
                      <span className="text-[10px] text-[#a09080] tabular-nums">재고: {item?.current_stock}</span>
                      <input
                        type="number"
                        min={1}
                        value={usage.quantity}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-16 border border-[#ebe7e4] rounded-lg px-2 py-1 text-sm text-center tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-600 text-sm cursor-pointer"
                      >
                        &times;
                      </button>
                      {warning && <span className="text-xs text-red-500">{warning}</span>}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <select
                value={addItemId}
                onChange={(e) => setAddItemId(e.target.value)}
                className="flex-1 border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              >
                <option value="">+ 물품 추가...</option>
                {items
                  .filter(i => !usageItems.some(u => u.itemId === i.id))
                  .map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.current_stock}{i.unit})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!addItemId}
                className="px-3.5 py-2 text-sm bg-[#f6f4f2] text-[#6d4e42] rounded-xl hover:bg-[#ebe7e4] transition-colors cursor-pointer disabled:opacity-40 font-medium"
              >
                추가
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">확인 간호사</label>
              <select
                value={confirmedBy}
                onChange={(e) => setConfirmedBy(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              >
                <option value="">선택</option>
                {NURSE_OPTIONS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">메모</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="시술 관련 메모"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
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
              disabled={!canSubmit || submitting}
              className="flex-1 py-2.5 bg-[#6d4e42] text-white rounded-xl text-sm font-semibold hover:bg-[#5a3d33] transition-colors cursor-pointer disabled:opacity-40"
            >
              {submitting ? '저장 중...' : '사용 기록 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── StockModal ─────────────────────────────────
function StockModal({
  item,
  type,
  onSubmit,
  onClose,
  submitting = false,
}: {
  item: InventoryItem;
  type: 'in' | 'out';
  onSubmit: (qty: number, note: string) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const isIn = type === 'in';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (!isIn && quantity > item.current_stock) return;
    onSubmit(quantity, note.trim() || (isIn ? '입고' : '출고'));
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

// ─── AddItemModal ───────────────────────────────
function AddItemModal({
  onAdd,
  onClose,
  submitting = false,
}: {
  onAdd: (data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    category: 'device_tip' as InventoryCategory,
    sub_category: '',
    specification: '',
    current_stock: 0,
    min_stock: 5,
    unit: '개',
    unit_price: 0,
    supplier: '',
    storage_note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      name: form.name.trim(),
      category: form.category,
      sub_category: form.sub_category || undefined,
      specification: form.specification || undefined,
      unit: form.unit.trim() || '개',
      current_stock: form.current_stock,
      min_stock: form.min_stock,
      unit_price: form.unit_price,
      supplier: form.supplier.trim() || undefined,
      storage_note: form.storage_note.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl border border-[#ebe7e4] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 4px 12px rgba(109,78,66,0.08), 0 20px 48px rgba(109,78,66,0.12)' }}
      >
        <div className="px-6 py-4 border-b border-[#ebe7e4] bg-[#faf8f7]">
          <h3 className="font-bold text-[#6d4e42] tracking-tight">새 품목 등록</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#575756] mb-1">
                품목명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="울쎄라 카트리지 DS 7-3.0"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value as InventoryCategory }))}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              >
                {(Object.entries(INVENTORY_CATEGORY_LABELS) as [InventoryCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">규격</label>
              <input
                type="text"
                value={form.specification}
                onChange={(e) => setForm(f => ({ ...f, specification: e.target.value }))}
                placeholder="3.0mm, 600팁, 100U 등"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">단위</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="개, 바이알, 시린지 등"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">초기 재고</label>
              <input
                type="number"
                min={0}
                value={form.current_stock}
                onChange={(e) => setForm(f => ({ ...f, current_stock: Number(e.target.value) }))}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">최소 재고</label>
              <input
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">단가 (원)</label>
              <input
                type="number"
                min={0}
                value={form.unit_price}
                onChange={(e) => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">공급사</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm(f => ({ ...f, supplier: e.target.value }))}
                placeholder="엘러간코리아"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#575756] mb-1">보관 조건</label>
              <input
                type="text"
                value={form.storage_note}
                onChange={(e) => setForm(f => ({ ...f, storage_note: e.target.value }))}
                placeholder="냉장보관, 상온보관 등"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm transition-shadow"
              />
            </div>
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
              className="flex-1 py-2.5 bg-[#b4988d] text-white rounded-xl text-sm font-semibold hover:bg-[#a08878] transition-colors cursor-pointer disabled:opacity-40"
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
