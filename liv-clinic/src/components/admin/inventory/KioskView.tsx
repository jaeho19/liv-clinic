'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  PROCEDURE_NAMES,
  NURSE_OPTIONS,
} from '@/types/admin';
import type {
  InventoryItem,
  ProcedureRecipe,
} from '@/types/admin';

// ─── Types ──────────────────────────────────────
interface UsageItem {
  itemId: string;
  itemName: string;
  unit: string;
  currentStock: number;
  quantity: number;
}

// Procedure categories for the grid grouping
const PROCEDURE_GROUPS: { label: string; filter: (name: string) => boolean }[] = [
  { label: '리프팅/레이저', filter: (n) => /써마지|아이써마지/.test(n) },
  { label: '필러', filter: (n) => /필러/.test(n) },
  { label: '보톡스', filter: (n) => /보톡스/.test(n) },
  { label: '스킨부스터/기타', filter: (n) => /리쥬란|스컬트라|쥬베룩/.test(n) },
];

function groupProcedures(names: readonly string[]) {
  const result: { label: string; procedures: string[] }[] = [];
  const used = new Set<string>();

  for (const group of PROCEDURE_GROUPS) {
    const matching = names.filter(n => group.filter(n) && !used.has(n));
    if (matching.length > 0) {
      result.push({ label: group.label, procedures: matching });
      matching.forEach(n => used.add(n));
    }
  }

  const remaining = names.filter(n => !used.has(n));
  if (remaining.length > 0) {
    result.push({ label: '기타', procedures: [...remaining] });
  }

  return result;
}

// ─── Main Component ─────────────────────────────
interface KioskViewProps {
  items: InventoryItem[];
  recipes: ProcedureRecipe[];
  loadData: () => Promise<void>;
}

export default function KioskView({ items, recipes, loadData }: KioskViewProps) {
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [patientName, setPatientName] = useState('');
  const [chartNumber, setChartNumber] = useState('');
  const [confirmedBy, setConfirmedBy] = useState('');
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const procedureGroups = useMemo(() => groupProcedures(PROCEDURE_NAMES), []);

  const handleSelectProcedure = useCallback((procedureName: string) => {
    setSelectedProcedure(procedureName);
    const recipeItems = recipes
      .filter(r => r.procedure_name === procedureName)
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

  const handleQtyChange = (idx: number, delta: number) => {
    setUsageItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, quantity: Math.max(0, item.quantity + delta) };
    }));
  };

  const handleSubmit = async () => {
    const activeItems = usageItems.filter(u => u.quantity > 0);
    if (activeItems.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeItems.map(u => ({ item_id: u.itemId, quantity: u.quantity })),
          patient_name: patientName.trim() || undefined,
          chart_number: chartNumber.trim() || undefined,
          confirmed_by: confirmedBy || undefined,
          note: `키오스크: ${selectedProcedure}`,
        }),
      });

      if (res.ok) {
        setToast({ message: `${selectedProcedure} - 재고 차감 완료!`, type: 'success' });
        // Auto reset
        setSelectedProcedure('');
        setPatientName('');
        setChartNumber('');
        setConfirmedBy('');
        setUsageItems([]);
        await loadData();
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

  const handleReset = () => {
    setSelectedProcedure('');
    setPatientName('');
    setChartNumber('');
    setConfirmedBy('');
    setUsageItems([]);
  };

  const activeCount = usageItems.filter(u => u.quantity > 0).length;

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

      {/* Header */}
      <div className="flex items-center justify-between mb-5 lg:mb-7">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42] tracking-tight">
            물품 사용 기록
          </h2>
          <p className="text-xs text-[#a09080] mt-1">
            시술 선택 → 수량 확인 → 차감 완료
          </p>
        </div>
        <Link
          href="/admin/inventory/overview"
          className="px-4 py-2.5 bg-white border border-[#ebe7e4] text-[#6d4e42] rounded-xl text-sm font-semibold hover:bg-[#faf8f7] transition-all duration-150 flex items-center gap-2"
          style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          재고 현황 보기
        </Link>
      </div>

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
                <div key={group.label}>
                  <p className="text-[10px] font-semibold text-[#b4988d] uppercase tracking-wider px-1 mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.procedures.map(name => {
                      const hasRecipe = recipes.some(r => r.procedure_name === name);
                      const isSelected = selectedProcedure === name;
                      const recipeCount = recipes.filter(r => r.procedure_name === name).length;
                      return (
                        <button
                          key={name}
                          onClick={() => handleSelectProcedure(name)}
                          disabled={!hasRecipe}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#6d4e42] border-[#6d4e42] text-white shadow-md'
                              : hasRecipe
                                ? 'bg-white border-[#ebe7e4] hover:border-[#b4988d] hover:shadow-sm active:scale-[0.98]'
                                : 'bg-[#f6f4f2] border-[#ebe7e4] opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-[#6d4e42]'}`}>
                            {name}
                          </div>
                          {hasRecipe ? (
                            <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-[#b4988d]'}`}>
                              {recipeCount}개 물품
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#c5b8b0]">레시피 미등록</span>
                          )}
                        </button>
                      );
                    })}
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
                  {selectedProcedure || '사용 물품'}
                </h3>
                <p className="text-[10px] text-[#a09080] mt-0.5">
                  {selectedProcedure ? `${activeCount}개 물품 선택됨` : '좌측에서 시술을 선택하세요'}
                </p>
              </div>
              {selectedProcedure && (
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
                  <p className="text-sm font-medium">시술을 선택하면 물품이 표시됩니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usageItems.map((usage, idx) => {
                    const isOverStock = usage.quantity > usage.currentStock;
                    return (
                      <div
                        key={usage.itemId}
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
                            onClick={() => handleQtyChange(idx, -1)}
                            className="w-11 h-11 rounded-xl bg-white border border-[#ebe7e4] text-[#6d4e42] text-lg font-bold hover:bg-[#f6f4f2] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-12 text-center text-lg font-bold text-[#6d4e42] tabular-nums">
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
                  `차감 완료 (${activeCount}개 품목)`
                ) : (
                  '차감 완료'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
