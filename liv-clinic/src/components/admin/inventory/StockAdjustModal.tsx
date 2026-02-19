'use client';

import { useState } from 'react';
import type { InventoryItem } from '@/types/admin';
import { getDisplayName } from '@/lib/inventory-utils';

interface StockAdjustModalProps {
  item: InventoryItem;
  onSubmit: (newQuantity: number, reason: string) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
}

export default function StockAdjustModal({ item, onSubmit, onClose, submitting = false }: StockAdjustModalProps) {
  const [newQuantity, setNewQuantity] = useState(item.current_stock);
  const [reason, setReason] = useState('');

  const diff = newQuantity - item.current_stock;
  const hasChange = diff !== 0;
  const canSubmit = hasChange && reason.trim().length > 0 && newQuantity >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(newQuantity, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div
        className="bg-white rounded-2xl border border-[#ebe7e4] w-full max-w-sm mx-4"
        style={{ boxShadow: '0 4px 12px rgba(109,78,66,0.08), 0 20px 48px rgba(109,78,66,0.12)' }}
      >
        <div className="px-6 py-4 border-b border-[#ebe7e4] bg-blue-50/60">
          <h3 className="font-bold tracking-tight text-blue-700">수량 보정</h3>
          <p className="text-sm text-[#a09080] mt-0.5">{getDisplayName(item)}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              현재 재고: <span className="font-bold">{item.current_stock} {item.unit}</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              수정할 수량 ({item.unit}) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={newQuantity}
              onChange={(e) => setNewQuantity(Number(e.target.value))}
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-shadow"
              required
            />
            <p className={`text-xs mt-1.5 font-medium ${
              diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-[#a09080]'
            }`}>
              {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '변경 없음'}
              {diff !== 0 && ` ${item.unit}`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              수정 사유 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="입고 실수 보정, 재고 실사 등"
              className="w-full border border-[#ebe7e4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-shadow"
              required
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
              disabled={submitting || !canSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              {submitting ? '처리 중...' : '수량 보정 확인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
