'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  COSMETICS_SUBCATEGORIES,
  INVENTORY_SUBCATEGORY_LABELS,
  COSMETICS_STAFF_OPTIONS,
} from '@/types/admin';
import type { InventoryItem } from '@/types/admin';
import DailyUsageLog from './DailyUsageLog';
import ExpiryBadge from './ExpiryBadge';
import InventoryEditModal from './InventoryEditModal';

// ─── Types ──────────────────────────────────────
interface UsageItem {
  itemId: string;
  itemName: string;
  unit: string;
  currentStock: number;
  quantity: number;
}

type SubcategoryId = (typeof COSMETICS_SUBCATEGORIES)[number] | 'all';
type ViewMode = 'cosmetics' | 'sample';

const SUBCATEGORY_ORDER: { id: SubcategoryId; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: '📋' },
  { id: 'lotion', label: '로션', icon: '🧴' },
  { id: 'cream', label: '크림', icon: '🫧' },
  { id: 'serum', label: '앰플/세럼', icon: '💧' },
  { id: 'set', label: '세트', icon: '📦' },
  { id: 'mask', label: '마스크팩', icon: '🎭' },
  { id: 'cosmetics_etc', label: '기타', icon: '✨' },
];

// ─── Main Component ─────────────────────────────
interface CosmeticsKioskViewProps {
  items: InventoryItem[];
  loadData: () => Promise<void>;
}

export default function CosmeticsKioskView({ items, loadData }: CosmeticsKioskViewProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryId>('all');
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);
  const [memo, setMemo] = useState('');
  const [confirmedBy, setConfirmedBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  // Mobile wizard step
  const [mobileStep, setMobileStep] = useState<'select' | 'items'>('select');
  // 화장품/샘플 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>('cosmetics');
  // 유효기간 맵
  const [expiryMap, setExpiryMap] = useState<Map<string, string>>(new Map());
  // 수량 수정 모달
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch expiry map
  const fetchExpiryMap = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inventory/batches?all=true');
      if (res.ok) {
        const data = await res.json();
        if (data.expiryMap) setExpiryMap(new Map(Object.entries(data.expiryMap)));
      }
    } catch { /* silent */ }
  }, []);
  useEffect(() => { fetchExpiryMap(); }, [fetchExpiryMap]);

  // Filter cosmetics items by sub_category (DB stores as 'skincare' category)
  const COSMETICS_SUBS = new Set<string>(COSMETICS_SUBCATEGORIES);
  const cosmeticsItems = useMemo(
    () => items.filter(i => i.is_active && i.sub_category && COSMETICS_SUBS.has(i.sub_category)),
    [items], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // 샘플 약물 아이템
  const sampleItems = useMemo(
    () => items.filter(i => i.is_active && i.category === 'sample'),
    [items],
  );

  // 현재 뷰 모드에 따른 아이템
  const activeItems = viewMode === 'cosmetics' ? cosmeticsItems : sampleItems;

  // Group by subcategory for count display
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of activeItems) {
      const sub = item.sub_category || 'cosmetics_etc';
      counts[sub] = (counts[sub] || 0) + 1;
    }
    counts['all'] = activeItems.length;
    return counts;
  }, [activeItems]);

  // Available subcategories (only show those with items)
  const visibleSubcategories = useMemo(
    () => SUBCATEGORY_ORDER.filter(s => (subcategoryCounts[s.id] || 0) > 0),
    [subcategoryCounts],
  );

  // ─── Step 1: Select subcategory → load items ──
  const handleSelectSubcategory = useCallback(
    (subId: SubcategoryId) => {
      setSelectedSubcategory(subId);
      const filtered =
        subId === 'all'
          ? activeItems
          : activeItems.filter(i => (i.sub_category || 'cosmetics_etc') === subId);

      setUsageItems(
        filtered.map(i => ({
          itemId: i.id,
          itemName: i.name,
          unit: i.unit,
          currentStock: i.current_stock,
          quantity: 0,
        })),
      );
      setMobileStep('items');
    },
    [activeItems],
  );

  // ─── Mobile: Back to category selection ────────
  const handleBackToSelect = useCallback(() => {
    setMobileStep('select');
  }, []);

  // Init: load all on first render when items are available
  useEffect(() => {
    if (activeItems.length > 0 && usageItems.length === 0) {
      handleSelectSubcategory('all');
    }
  }, [activeItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 뷰모드 전환 시 리셋
  useEffect(() => {
    setSelectedSubcategory('all');
    setMobileStep('select');
    if (activeItems.length > 0) {
      setUsageItems(
        activeItems.map(i => ({
          itemId: i.id,
          itemName: i.name,
          unit: i.unit,
          currentStock: i.current_stock,
          quantity: 0,
        })),
      );
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Quantity change ──────────────────────────
  const handleQtyChange = (idx: number, delta: number) => {
    setUsageItems(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }),
    );
  };

  // ─── Submit ───────────────────────────────────
  const handleSubmit = async () => {
    const activeItems = usageItems.filter(u => u.quantity > 0);
    if (activeItems.length === 0) return;

    setSubmitting(true);
    const itemNames = activeItems.map(u => u.itemName).join(', ');
    const label = activeItems.length > 1 ? `${activeItems[0].itemName} 외 ${activeItems.length - 1}건` : activeItems[0].itemName;

    try {
      const res = await fetch('/api/admin/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeItems.map(u => ({ item_id: u.itemId, quantity: u.quantity })),
          confirmed_by: confirmedBy || undefined,
          note: `${viewMode === 'sample' ? '샘플' : '화장품'}: ${itemNames}${memo.trim() ? ` (${memo.trim()})` : ''}`,
        }),
      });

      if (res.ok) {
        setToast({ message: `${label} - 차감 완료!`, type: 'success' });
        setMemo('');
        setConfirmedBy('');
        setMobileStep('select');
        setRefetchKey(k => k + 1);
        await loadData();
        fetchExpiryMap();
        // Re-apply current filter with refreshed data
        // items prop will be updated, usageItems will be rebuilt via effect below
      } else {
        const err = await res.json();
        setToast({ message: err.error || '차감 실패', type: 'error' });
      }
    } catch {
      setToast({ message: '네트워크 오류', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Re-sync usageItems when items (stock) refresh
  useEffect(() => {
    if (activeItems.length === 0) return;
    const filtered =
      selectedSubcategory === 'all'
        ? activeItems
        : activeItems.filter(i => (i.sub_category || 'cosmetics_etc') === selectedSubcategory);

    setUsageItems(
      filtered.map(i => ({
        itemId: i.id,
        itemName: i.name,
        unit: i.unit,
        currentStock: i.current_stock,
        quantity: 0,
      })),
    );
  }, [activeItems, selectedSubcategory]);

  // ─── Reset ────────────────────────────────────
  const handleReset = () => {
    setMemo('');
    setConfirmedBy('');
    setUsageItems(prev => prev.map(u => ({ ...u, quantity: 0 })));
    setMobileStep('select');
  };

  const activeCount = usageItems.filter(u => u.quantity > 0).length;
  const subcategoryLabel =
    viewMode === 'sample'
      ? '샘플 약물'
      : selectedSubcategory === 'all'
        ? '전체 화장품'
        : INVENTORY_SUBCATEGORY_LABELS[selectedSubcategory] || selectedSubcategory;

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all animate-[fadeInDown_0.3s_ease-out] ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' && (
            <svg className="w-4 h-4 inline mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* 화장품/샘플 뷰 모드 토글 */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setViewMode('cosmetics')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            viewMode === 'cosmetics'
              ? 'bg-[#6d4e42] text-white shadow-sm'
              : 'bg-white text-[#6d4e42] border border-[#ebe7e4] hover:bg-[#faf8f7]'
          }`}
        >
          화장품
        </button>
        <button
          onClick={() => setViewMode('sample')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            viewMode === 'sample'
              ? 'bg-[#6d4e42] text-white shadow-sm'
              : 'bg-white text-[#6d4e42] border border-[#ebe7e4] hover:bg-[#faf8f7]'
          }`}
        >
          샘플 약물
        </button>
      </div>

      {/* 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Subcategory selection (40%) - hidden on mobile when viewing items */}
        <div className={`lg:w-[40%] lg:flex-shrink-0 ${mobileStep !== 'select' ? 'hidden lg:block' : ''}`}>
          <div
            className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7]">
              <h3 className="text-sm font-bold text-[#6d4e42] tracking-tight">
                {viewMode === 'cosmetics' ? '카테고리 선택' : '샘플 약물'}
              </h3>
              <p className="text-[10px] text-[#a09080] mt-0.5">
                {viewMode === 'cosmetics' ? '카테고리를 탭하면 제품이 표시됩니다' : '샘플 약물 수량을 조정하세요'}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {visibleSubcategories.map(sub => {
                const isSelected = selectedSubcategory === sub.id;
                const count = subcategoryCounts[sub.id] || 0;

                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubcategory(sub.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6d4e42] border-[#6d4e42] text-white shadow-md'
                        : 'bg-white border-[#ebe7e4] hover:border-[#b4988d] hover:shadow-sm active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sub.icon}</span>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#6d4e42]'}`}>
                          {sub.label}
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#b4988d]'}`}>
                          {count}개 제품
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {activeItems.length === 0 && (
                <div className="text-center py-8 text-[#c5b8b0]">
                  <p className="text-sm">{viewMode === 'cosmetics' ? '등록된 화장품이 없습니다' : '등록된 샘플 약물이 없습니다'}</p>
                  <p className="text-xs mt-1">재고 현황에서 등록해주세요</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Usage items + save (60%) - hidden on mobile when selecting category */}
        <div className={`lg:flex-1 ${mobileStep !== 'items' ? 'hidden lg:block' : ''}`}>
          {/* Mobile: Back to category selection */}
          <button
            onClick={handleBackToSelect}
            className="lg:hidden flex items-center gap-2 mb-3 px-1 py-2 text-sm font-semibold text-[#6d4e42] active:opacity-70 transition-opacity cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{subcategoryLabel}</span>
          </button>

          <div
            className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#6d4e42] tracking-tight">{subcategoryLabel}</h3>
                <p className="text-[10px] text-[#a09080] mt-0.5">
                  {activeCount > 0 ? `${activeCount}개 제품 선택됨` : '수량을 조정하세요'}
                </p>
              </div>
              {activeCount > 0 && (
                <button
                  onClick={handleReset}
                  className="text-xs text-[#a09080] hover:text-[#6d4e42] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[#f6f4f2]"
                >
                  초기화
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Memo + nurse */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">
                    메모
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="환자명/차트번호"
                    className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">
                    담당
                  </label>
                  <div className="flex gap-1.5">
                    {COSMETICS_STAFF_OPTIONS.map(name => (
                      <button
                        key={name}
                        onClick={() => setConfirmedBy(confirmedBy === name ? '' : name)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          confirmedBy === name
                            ? 'bg-[#6d4e42] text-white shadow-sm'
                            : 'bg-[#f6f4f2] text-[#575756] hover:bg-[#ebe7e4]'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items list */}
              {usageItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#c5b8b0]">
                  <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm font-medium">{viewMode === 'cosmetics' ? '등록된 화장품이 없습니다' : '등록된 샘플 약물이 없습니다'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto">
                  {usageItems.map((usage, idx) => {
                    const isOverStock = usage.quantity > usage.currentStock;
                    return (
                      <div
                        key={usage.itemId}
                        className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
                          isOverStock
                            ? 'bg-red-50/50 border-red-200'
                            : usage.quantity > 0
                              ? 'bg-[#f0ebe8] border-[#d4c8c0]'
                              : 'bg-[#faf8f7] border-[#ebe7e4]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#6d4e42] truncate">{usage.itemName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const found = items.find(i => i.id === usage.itemId);
                                if (found) setEditItem(found);
                              }}
                              className="flex-shrink-0 w-6 h-6 rounded-lg hover:bg-blue-50 flex items-center justify-center cursor-pointer transition-colors"
                              title="수량 수정"
                            >
                              <svg className="w-3 h-3 text-[#b4988d] hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#a09080]">
                              재고: {usage.currentStock}{usage.unit}
                            </span>
                            {isOverStock && <span className="text-[10px] text-red-500 font-semibold">재고 부족!</span>}
                            {expiryMap.get(usage.itemId) && (
                              <ExpiryBadge expiryDate={expiryMap.get(usage.itemId)!} size="sm" showRemaining={false} />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQtyChange(idx, -1)}
                            className="w-11 h-11 rounded-xl bg-white border border-[#ebe7e4] text-[#6d4e42] text-lg font-bold hover:bg-[#f6f4f2] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className={`w-12 text-center text-lg font-bold tabular-nums ${usage.quantity > 0 ? 'text-[#6d4e42]' : 'text-[#c5b8b0]'}`}>
                            {usage.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(idx, 1)}
                            className="w-11 h-11 rounded-xl bg-white border border-[#ebe7e4] text-[#6d4e42] text-lg font-bold hover:bg-[#f6f4f2] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-[#a09080] w-8 text-right">{usage.unit}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || activeCount === 0}
                className="w-full py-4 bg-[#6d4e42] text-white rounded-2xl text-base font-bold hover:bg-[#5a3d33] transition-all cursor-pointer disabled:opacity-40 active:scale-[0.99] shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    처리 중...
                  </span>
                ) : activeCount > 0 ? (
                  `차감 완료 (${activeCount}개 제품)`
                ) : (
                  '차감 완료'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily usage log */}
      <DailyUsageLog refetchKey={refetchKey} filterPrefix={viewMode === 'sample' ? '샘플:' : '화장품:'} />

      {/* 수량 수정 모달 */}
      {editItem && (
        <InventoryEditModal
          item={editItem}
          isOpen={true}
          onClose={() => setEditItem(null)}
          onSaved={async () => {
            setEditItem(null);
            await loadData();
            fetchExpiryMap();
          }}
        />
      )}
    </div>
  );
}
