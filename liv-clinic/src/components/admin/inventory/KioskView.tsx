'use client';

import { useState, useCallback, useMemo, useEffect, memo } from 'react';
import {
  PROCEDURE_CATALOG,
  PROCEDURE_CATEGORY_LABELS,
  PROCEDURE_RECIPE_MAP,
  NURSE_OPTIONS,
} from '@/types/admin';
import type {
  InventoryItem,
  ProcedureRecipe,
  ProcedureType,
  ProcedureOption,
  ProcedureCategoryId,
} from '@/types/admin';
import Link from 'next/link';
import DailyUsageLog from './DailyUsageLog';

// ─── Types ──────────────────────────────────────
interface UsageItem {
  itemId: string;
  itemName: string;
  unit: string;
  currentStock: number;
  quantity: number;
}

// ─── Helpers ────────────────────────────────────
function groupByCategory(catalog: ProcedureType[]) {
  const groups: { category: ProcedureCategoryId; label: string; procedures: ProcedureType[] }[] = [];
  const categoryOrder: ProcedureCategoryId[] = ['lifting', 'antiaging', 'skinbooster'];

  for (const cat of categoryOrder) {
    const procs = catalog.filter(p => p.category === cat);
    if (procs.length > 0) {
      groups.push({
        category: cat,
        label: PROCEDURE_CATEGORY_LABELS[cat],
        procedures: procs,
      });
    }
  }
  return groups;
}

function getRecipeName(proc: ProcedureType, option?: ProcedureOption | null): string {
  if (option) return option.recipeName;
  return PROCEDURE_RECIPE_MAP[proc.id] ?? proc.name;
}

function getProcedureLabel(proc: ProcedureType, option?: ProcedureOption | null): string {
  if (option) return `${proc.name} ${option.label}`;
  return proc.name;
}

// ─── Memoized Sub-Components ─────────────────────
interface ProcedureButtonProps {
  proc: ProcedureType;
  isSelected: boolean;
  hasAnyRecipe: boolean;
  recipeCount: number;
  onSelect: (proc: ProcedureType) => void;
}

const ProcedureButton = memo(function ProcedureButton({
  proc, isSelected, hasAnyRecipe, recipeCount, onSelect,
}: ProcedureButtonProps) {
  return (
    <button
      onClick={() => onSelect(proc)}
      disabled={!hasAnyRecipe}
      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
        isSelected
          ? 'bg-[#6d4e42] border-[#6d4e42] text-white shadow-md'
          : hasAnyRecipe
            ? 'bg-white border-[#ebe7e4] hover:border-[#b4988d] hover:shadow-sm active:scale-[0.98]'
            : 'bg-[#f6f4f2] border-[#ebe7e4] opacity-40 cursor-not-allowed'
      }`}
    >
      <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-[#6d4e42]'}`}>
        {proc.name}
      </div>
      {hasAnyRecipe ? (
        <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#b4988d]'}`}>
          {proc.options.length > 0 ? `${proc.options.length}개 옵션` : `${recipeCount}개 물품`}
        </span>
      ) : (
        <span className="text-[10px] text-[#c5b8b0]">레시피 미등록</span>
      )}
    </button>
  );
});

interface UsageItemRowProps {
  usage: UsageItem;
  index: number;
  onQtyChange: (idx: number, delta: number) => void;
}

const UsageItemRow = memo(function UsageItemRow({
  usage, index, onQtyChange,
}: UsageItemRowProps) {
  const isOverStock = usage.quantity > usage.currentStock;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
        isOverStock
          ? 'bg-red-50/50 border-red-200'
          : usage.quantity === 0
            ? 'bg-[#faf8f7] border-[#ebe7e4] opacity-50'
            : 'bg-[#faf8f7] border-[#ebe7e4]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#6d4e42] truncate">{usage.itemName}</div>
        <div className="text-[10px] text-[#a09080] mt-0.5">
          재고: {usage.currentStock}{usage.unit}
          {isOverStock && (
            <span className="text-red-500 ml-2 font-semibold">재고 부족!</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQtyChange(index, -1)}
          className="w-11 h-11 rounded-xl bg-white border border-[#ebe7e4] text-[#6d4e42] text-lg font-bold hover:bg-[#f6f4f2] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          -
        </button>
        <span className="w-12 text-center text-lg font-bold text-[#6d4e42] tabular-nums">
          {usage.quantity}
        </span>
        <button
          onClick={() => onQtyChange(index, 1)}
          className="w-11 h-11 rounded-xl bg-white border border-[#ebe7e4] text-[#6d4e42] text-lg font-bold hover:bg-[#f6f4f2] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          +
        </button>
      </div>
      <span className="text-xs text-[#a09080] w-8 text-right">{usage.unit}</span>
    </div>
  );
});

// ─── Main Component ─────────────────────────────
interface KioskViewProps {
  items: InventoryItem[];
  recipes: ProcedureRecipe[];
  loadData: () => Promise<void>;
}

export default function KioskView({ items, recipes, loadData }: KioskViewProps) {
  const [selectedType, setSelectedType] = useState<ProcedureType | null>(null);
  const [selectedOption, setSelectedOption] = useState<ProcedureOption | null>(null);
  const [patientName, setPatientName] = useState('');
  const [chartNumber, setChartNumber] = useState('');
  const [confirmedBy, setConfirmedBy] = useState('');
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const procedureGroups = useMemo(() => groupByCategory(PROCEDURE_CATALOG), []);

  // ─── Pre-compute recipe counts per procedure (avoid filter in render) ──
  const recipeCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of procedureGroups) {
      for (const proc of group.procedures) {
        const recipeName = PROCEDURE_RECIPE_MAP[proc.id] ?? proc.name;
        map.set(proc.id, recipes.filter(r => r.procedure_name === recipeName).length);
      }
    }
    return map;
  }, [procedureGroups, recipes]);

  // ─── Load recipe items by name ────────────────
  const loadRecipeItems = useCallback((recipeName: string) => {
    const recipeItems = recipes
      .filter(r => r.procedure_name === recipeName)
      .map(r => {
        const item = items.find(i => i.id === r.item_id);
        return {
          itemId: r.item_id,
          itemName: item?.name || r.item_id,
          unit: item?.unit || '개',
          currentStock: item?.current_stock || 0,
          quantity: r.default_qty,
        };
      });
    setUsageItems(recipeItems);
  }, [recipes, items]);

  // ─── Check if a recipe exists for a procedure/option ──
  const hasRecipeFor = useCallback((proc: ProcedureType, option?: ProcedureOption): boolean => {
    const recipeName = option ? option.recipeName : (PROCEDURE_RECIPE_MAP[proc.id] ?? proc.name);
    return recipes.some(r => r.procedure_name === recipeName);
  }, [recipes]);

  // ─── Step 1: Select procedure type ────────────
  const handleSelectType = useCallback((proc: ProcedureType) => {
    if (selectedType?.id === proc.id) {
      // Toggle off
      setSelectedType(null);
      setSelectedOption(null);
      setUsageItems([]);
      return;
    }

    setSelectedType(proc);
    setSelectedOption(null);

    if (proc.options.length === 0) {
      // No options → load items directly
      const recipeName = getRecipeName(proc);
      loadRecipeItems(recipeName);
    } else {
      // Has options → wait for step 2
      setUsageItems([]);
    }
  }, [selectedType, loadRecipeItems]);

  // ─── Step 2: Select option ────────────────────
  const handleSelectOption = useCallback((option: ProcedureOption) => {
    setSelectedOption(option);
    loadRecipeItems(option.recipeName);
  }, [loadRecipeItems]);

  // ─── Quantity change (stable ref for memo children) ──
  const handleQtyChange = useCallback((idx: number, delta: number) => {
    setUsageItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, quantity: Math.max(0, item.quantity + delta) };
    }));
  }, []);

  // ─── Submit (Optimistic UI) ──────────────────
  const handleSubmit = async () => {
    const activeItems = usageItems.filter(u => u.quantity > 0);
    if (activeItems.length === 0 || !selectedType) return;

    setSubmitting(true);
    const label = getProcedureLabel(selectedType, selectedOption);
    const body = JSON.stringify({
      items: activeItems.map(u => ({ item_id: u.itemId, quantity: u.quantity })),
      patient_name: patientName.trim() || undefined,
      chart_number: chartNumber.trim() || undefined,
      confirmed_by: confirmedBy || undefined,
      note: `키오스크: ${label}`,
    });

    // Optimistic: 즉시 UI 초기화 (사용자 체감 즉각 반응)
    setToast({ message: `${label} - 재고 차감 완료!`, type: 'success' });
    setSelectedType(null);
    setSelectedOption(null);
    setPatientName('');
    setChartNumber('');
    setConfirmedBy('');
    setUsageItems([]);
    setRefetchKey(k => k + 1);

    try {
      const res = await fetch('/api/admin/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        // 백그라운드 데이터 동기화
        loadData();
      } else {
        const err = await res.json();
        setToast({ message: err.error || '차감 실패', type: 'error' });
        loadData(); // 서버 상태로 복원
      }
    } catch {
      setToast({ message: '네트워크 오류', type: 'error' });
      loadData(); // 서버 상태로 복원
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Reset ────────────────────────────────────
  const handleReset = () => {
    setSelectedType(null);
    setSelectedOption(null);
    setPatientName('');
    setChartNumber('');
    setConfirmedBy('');
    setUsageItems([]);
  };

  const activeCount = useMemo(() => usageItems.filter(u => u.quantity > 0).length, [usageItems]);
  const displayName = useMemo(() => selectedType
    ? selectedOption
      ? `${selectedType.name} - ${selectedOption.label}`
      : selectedType.name
    : '사용 물품', [selectedType, selectedOption]);
  const waitingForOption = useMemo(() =>
    selectedType && selectedType.options.length > 0 && !selectedOption,
    [selectedType, selectedOption]);

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all animate-[fadeInDown_0.3s_ease-out] ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' && (
            <svg className="w-4 h-4 inline mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Procedure selection (40%) */}
        <div className="lg:w-[40%] lg:flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7]">
              <h3 className="text-sm font-bold text-[#6d4e42] tracking-tight">시술 선택</h3>
              <p className="text-[10px] text-[#a09080] mt-0.5">시술을 탭하면 물품이 자동으로 로드됩니다</p>
            </div>
            <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              {procedureGroups.map(group => (
                <div key={group.category}>
                  <p className="text-[10px] font-semibold text-[#b4988d] uppercase tracking-wider px-1 mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {/* Procedure buttons grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {group.procedures.map(proc => {
                        const hasAnyRecipe = proc.options.length > 0
                          ? proc.options.some(opt => hasRecipeFor(proc, opt))
                          : hasRecipeFor(proc);

                        return (
                          <ProcedureButton
                            key={proc.id}
                            proc={proc}
                            isSelected={selectedType?.id === proc.id}
                            hasAnyRecipe={hasAnyRecipe}
                            recipeCount={recipeCountMap.get(proc.id) ?? 0}
                            onSelect={handleSelectType}
                          />
                        );
                      })}
                    </div>

                    {/* Step 2: Option pills (inline, below selected procedure) */}
                    {selectedType && group.procedures.some(p => p.id === selectedType.id) && selectedType.options.length > 0 && (
                      <div className="bg-[#faf8f7] rounded-xl p-3 border border-[#ebe7e4]">
                        <p className="text-[10px] font-semibold text-[#a09080] mb-2">
                          {selectedType.name} 옵션 선택
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedType.options.map(opt => {
                            const isOptSelected = selectedOption?.recipeName === opt.recipeName;
                            const hasRecipe = recipes.some(r => r.procedure_name === opt.recipeName);
                            return (
                              <button
                                key={opt.recipeName}
                                onClick={() => handleSelectOption(opt)}
                                disabled={!hasRecipe}
                                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                                  isOptSelected
                                    ? 'bg-[#6d4e42] text-white shadow-sm'
                                    : hasRecipe
                                      ? 'bg-white text-[#575756] border border-[#ebe7e4] hover:border-[#b4988d] hover:text-[#6d4e42]'
                                      : 'bg-[#f6f4f2] text-[#c5b8b0] border border-[#ebe7e4] opacity-40 cursor-not-allowed'
                                }`}
                              >
                                {opt.label}
                                {!hasRecipe && <span className="text-[9px] ml-1">(미등록)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Usage items + save (60%) */}
        <div className="lg:flex-1">
          <div className="bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
          >
            <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#6d4e42] tracking-tight">
                  {displayName}
                </h3>
                <p className="text-[10px] text-[#a09080] mt-0.5">
                  {waitingForOption
                    ? '옵션을 선택하세요'
                    : selectedType
                      ? `${activeCount}개 물품 선택됨`
                      : '좌측에서 시술을 선택하세요'
                  }
                </p>
              </div>
              {selectedType && (
                <button
                  onClick={handleReset}
                  className="text-xs text-[#a09080] hover:text-[#6d4e42] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[#f6f4f2]"
                >
                  초기화
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Patient info + nurse */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">환자명</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">차트번호</label>
                  <input
                    type="text"
                    value={chartNumber}
                    onChange={e => setChartNumber(e.target.value)}
                    placeholder="차트번호"
                    className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d] transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#a09080] mb-1.5 uppercase tracking-wider">간호사</label>
                  <div className="flex gap-1.5">
                    {NURSE_OPTIONS.map(name => (
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
                  <p className="text-sm font-medium">
                    {waitingForOption
                      ? '옵션을 선택하면 물품이 표시됩니다'
                      : '시술을 선택하면 물품이 표시됩니다'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usageItems.map((usage, idx) => (
                    <UsageItemRow
                      key={usage.itemId}
                      usage={usage}
                      index={idx}
                      onQtyChange={handleQtyChange}
                    />
                  ))}
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
                  `차감 완료 (${activeCount}개 품목)`
                ) : (
                  '차감 완료'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick link to overview */}
      <div className="mt-5 mb-3">
        <Link
          href="/admin/inventory/overview"
          className="flex items-center justify-between w-full px-5 py-3.5 bg-gradient-to-r from-[#faf8f7] to-white rounded-2xl border border-[#ebe7e4] hover:border-[#b4988d] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f6f4f2] flex items-center justify-center group-hover:bg-[#ebe7e4] transition-colors">
              <svg className="w-4 h-4 text-[#6d4e42]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-[#6d4e42]">재고 현황 보기</span>
              <p className="text-[10px] text-[#a09080]">카테고리별 재고 현황, 소진 예측, 사용 통계</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-[#c5b8b0] group-hover:text-[#6d4e42] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Daily usage log */}
      <DailyUsageLog refetchKey={refetchKey} filterPrefix="키오스크:" />
    </div>
  );
}
