'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PROCEDURE_NAMES,
} from '@/types/admin';
import type {
  InventoryItem,
  ProcedureRecipe,
} from '@/types/admin';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────
type Step = 'select' | 'adjust' | 'done';

interface UsageItem {
  itemId: string;
  itemName: string;
  unit: string;
  currentStock: number;
  quantity: number;
}

// ─── API ────────────────────────────────────────
async function fetchItems(): Promise<InventoryItem[]> {
  const res = await fetch('/api/admin/inventory');
  if (!res.ok) throw new Error('품목 목록 로드 실패');
  return res.json();
}

async function fetchRecipes(): Promise<ProcedureRecipe[]> {
  const res = await fetch('/api/admin/inventory/recipes');
  if (!res.ok) throw new Error('레시피 로드 실패');
  return res.json();
}

// ─── Main Component ─────────────────────────────
export default function KioskPage() {
  const [step, setStep] = useState<Step>('select');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<ProcedureRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [patientName, setPatientName] = useState('');
  const [chartNumber, setChartNumber] = useState('');
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, recipesData] = await Promise.all([fetchItems(), fetchRecipes()]);
      setItems(itemsData);
      setRecipes(recipesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
    setStep('adjust');
  }, [recipes, items]);

  const handleQtyChange = (idx: number, delta: number) => {
    setUsageItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const newQty = Math.max(0, item.quantity + delta);
      return { ...item, quantity: newQty };
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
          note: `키오스크: ${selectedProcedure}`,
        }),
      });

      if (res.ok) {
        setResult({ success: true, message: '재고 차감 완료!' });
      } else {
        const err = await res.json();
        setResult({ success: false, message: err.error || '차감 실패' });
      }
    } catch {
      setResult({ success: false, message: '네트워크 오류' });
    } finally {
      setSubmitting(false);
      setStep('done');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedProcedure('');
    setPatientName('');
    setChartNumber('');
    setUsageItems([]);
    setResult(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f4f2]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#b4988d]/30 border-t-[#b4988d] rounded-full animate-spin mb-4" />
          <p className="text-[#a09080] text-base">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f4f2]">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={loadData} className="px-6 py-3 bg-[#6d4e42] text-white rounded-xl text-sm font-semibold hover:bg-[#5a3d33] transition-colors cursor-pointer">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4f2]">
      {/* Minimal header */}
      <div className="bg-white border-b border-[#ebe7e4] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b4988d] to-[#6d4e42] flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-[#6d4e42]">물품 사용 키오스크</h1>
            <p className="text-[10px] text-[#a09080]">시술 선택 → 수량 확인 → 차감</p>
          </div>
        </div>
        <Link
          href="/admin/inventory"
          className="text-xs text-[#a09080] hover:text-[#6d4e42] transition-colors px-3 py-2 rounded-lg hover:bg-[#f6f4f2]"
        >
          관리 화면으로 돌아가기
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        {(['select', 'adjust', 'done'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step === s ? 'bg-[#6d4e42] text-white' :
              (['select', 'adjust', 'done'].indexOf(step) > idx) ? 'bg-[#b4988d] text-white' :
              'bg-[#ebe7e4] text-[#a09080]'
            }`}>
              {idx + 1}
            </div>
            {idx < 2 && <div className={`w-8 h-0.5 ${(['select', 'adjust', 'done'].indexOf(step) > idx) ? 'bg-[#b4988d]' : 'bg-[#ebe7e4]'}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Step 1: Select procedure */}
        {step === 'select' && (
          <div>
            <h2 className="text-center text-lg font-bold text-[#6d4e42] mb-6">시술을 선택하세요</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROCEDURE_NAMES.map(name => {
                const hasRecipe = recipes.some(r => r.procedure_name === name);
                return (
                  <button
                    key={name}
                    onClick={() => handleSelectProcedure(name)}
                    disabled={!hasRecipe}
                    className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      hasRecipe
                        ? 'bg-white border-[#ebe7e4] hover:border-[#b4988d] hover:shadow-md active:scale-[0.98]'
                        : 'bg-[#f6f4f2] border-[#ebe7e4] opacity-40 cursor-not-allowed'
                    }`}
                    style={hasRecipe ? { boxShadow: '0 1px 3px rgba(109,78,66,0.04)' } : undefined}
                  >
                    <div className="text-sm font-bold text-[#6d4e42] mb-1">{name}</div>
                    {hasRecipe ? (
                      <span className="text-[10px] text-[#b4988d]">
                        {recipes.filter(r => r.procedure_name === name).length}개 물품
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#c5b8b0]">레시피 미등록</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Adjust quantities */}
        {step === 'adjust' && (
          <div>
            <h2 className="text-center text-lg font-bold text-[#6d4e42] mb-2">{selectedProcedure}</h2>
            <p className="text-center text-sm text-[#a09080] mb-6">수량을 조절한 뒤 확인을 눌러주세요</p>

            {/* Patient info */}
            <div className="bg-white rounded-2xl border border-[#ebe7e4] p-5 mb-4"
              style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a09080] mb-1.5">환자명</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full border border-[#ebe7e4] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#a09080] mb-1.5">차트번호</label>
                  <input
                    type="text"
                    value={chartNumber}
                    onChange={e => setChartNumber(e.target.value)}
                    placeholder="차트번호"
                    className="w-full border border-[#ebe7e4] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#b4988d]/20 focus:border-[#b4988d]"
                  />
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2 mb-6">
              {usageItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#ebe7e4] p-8 text-center">
                  <p className="text-sm text-[#a09080]">이 시술에 등록된 레시피가 없습니다</p>
                </div>
              ) : (
                usageItems.map((usage, idx) => (
                  <div key={usage.itemId} className="bg-white rounded-2xl border border-[#ebe7e4] p-4 flex items-center gap-4"
                    style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#6d4e42] truncate">{usage.itemName}</div>
                      <div className="text-[10px] text-[#a09080] mt-0.5">
                        재고: {usage.currentStock}{usage.unit}
                        {usage.quantity > usage.currentStock && (
                          <span className="text-red-500 ml-2 font-semibold">재고 부족!</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQtyChange(idx, -1)}
                        className="w-12 h-12 rounded-xl bg-[#f6f4f2] text-[#6d4e42] text-xl font-bold hover:bg-[#ebe7e4] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-14 text-center text-lg font-bold text-[#6d4e42] tabular-nums">
                        {usage.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(idx, 1)}
                        className="w-12 h-12 rounded-xl bg-[#f6f4f2] text-[#6d4e42] text-xl font-bold hover:bg-[#ebe7e4] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[#a09080] w-8">{usage.unit}</span>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('select'); setSelectedProcedure(''); setUsageItems([]); }}
                className="flex-1 py-4 border-2 border-[#ebe7e4] rounded-2xl text-base font-semibold text-[#a09080] hover:bg-white transition-colors cursor-pointer"
              >
                뒤로
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || usageItems.filter(u => u.quantity > 0).length === 0}
                className="flex-[2] py-4 bg-[#6d4e42] text-white rounded-2xl text-base font-bold hover:bg-[#5a3d33] transition-all cursor-pointer disabled:opacity-40 active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    처리 중...
                  </span>
                ) : (
                  `차감 확인 (${usageItems.filter(u => u.quantity > 0).length}개 품목)`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && result && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
              result.success ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {result.success ? (
                <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h2 className={`text-xl font-bold mb-2 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
              {result.message}
            </h2>
            {result.success && (
              <p className="text-sm text-[#a09080] mb-8">
                {selectedProcedure} | {patientName || '환자명 미입력'}
              </p>
            )}
            <button
              onClick={handleReset}
              className="px-8 py-4 bg-[#6d4e42] text-white rounded-2xl text-base font-bold hover:bg-[#5a3d33] transition-all cursor-pointer active:scale-[0.98]"
            >
              새 시술 기록
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
