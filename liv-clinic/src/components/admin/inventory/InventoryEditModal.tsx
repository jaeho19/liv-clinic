'use client';

import { useState } from 'react';
import type { InventoryItem } from '@/types/admin';

interface InventoryEditModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function InventoryEditModal({ item, isOpen, onClose, onSaved }: InventoryEditModalProps) {
  const [newStock, setNewStock] = useState(item.current_stock.toString());
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const newQty = parseInt(newStock) || 0;
  const delta = newQty - item.current_stock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || delta === 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // adjust 트랜잭션 자동 생성을 위해 use API 활용
      if (delta > 0) {
        // 재고 증가 → restock
        const res = await fetch('/api/admin/inventory/restock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: item.id,
            quantity: delta,
            note: `[수량 수정] ${reason.trim()} (${item.current_stock} → ${newQty})`,
          }),
        });
        if (!res.ok) throw new Error('수정 실패');
      } else {
        // 재고 감소 → use
        const res = await fetch('/api/admin/inventory/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ item_id: item.id, quantity: Math.abs(delta) }],
            note: `[수량 수정] ${reason.trim()} (${item.current_stock} → ${newQty})`,
          }),
        });
        if (!res.ok) throw new Error('수정 실패');
      }
      onSaved();
    } catch {
      alert('수량 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div
        className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl border border-[#ebe7e4] max-h-[80vh] overflow-y-auto"
        style={{ boxShadow: '0 4px 12px rgba(109,78,66,0.08), 0 20px 48px rgba(109,78,66,0.12)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ebe7e4] bg-blue-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-700 tracking-tight">재고 수량 수정</h3>
            <p className="text-sm text-[#a09080] mt-0.5 truncate">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-blue-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4 text-[#a09080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showConfirm ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-[#faf8f7] rounded-xl p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#a09080]">현재 재고</span>
                <span className="font-bold text-[#6d4e42] tabular-nums">{item.current_stock} {item.unit}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                새 수량 ({item.unit}) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={e => setNewStock(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-shadow"
                required
              />
              {delta !== 0 && (
                <p className={`text-xs mt-1.5 font-semibold ${delta > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  차이: {delta > 0 ? '+' : ''}{delta} {item.unit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                수정 사유 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="입고 실수 보정, 소모량 오입력 수정 등"
                className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-shadow"
                required
              />
            </div>

            <div className="flex items-start gap-2 text-[11px] text-[#a09080] bg-[#faf8f7] rounded-xl p-3">
              <svg className="w-3.5 h-3.5 text-[#b4988d] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              수량 변경 시 조정 이력이 자동으로 기록됩니다.
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
                disabled={!reason.trim() || delta === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40"
              >
                수정 확인
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[#6d4e42] mb-1">정말 수정하시겠습니까?</p>
              <p className="text-xs text-[#a09080]">
                {item.current_stock} {item.unit} → {newQty} {item.unit} ({delta > 0 ? '+' : ''}{delta})
              </p>
              <p className="text-xs text-[#a09080] mt-1">사유: {reason}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-[#ebe7e4] rounded-xl text-sm text-[#a09080] hover:bg-[#faf8f7] transition-colors cursor-pointer font-medium"
              >
                아니오
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40"
              >
                {submitting ? '처리 중...' : '예, 수정합니다'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
