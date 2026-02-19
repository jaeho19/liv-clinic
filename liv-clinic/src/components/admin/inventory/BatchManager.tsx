'use client';

import { useState, useEffect, useCallback } from 'react';
import type { InventoryBatch } from '@/types/admin';
import ExpiryBadge from './ExpiryBadge';

interface BatchManagerProps {
  itemId: string;
  itemName: string;
  itemUnit: string;
}

export default function BatchManager({ itemId, itemName, itemUnit }: BatchManagerProps) {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQty, setNewQty] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editNote, setEditNote] = useState('');

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inventory/batches?item_id=${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [itemId]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(newQty);
    if (!qty || qty <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          batch_quantity: qty,
          expiry_date: newExpiry || null,
          note: newNote.trim() || null,
        }),
      });
      if (res.ok) {
        setNewQty('');
        setNewExpiry('');
        setNewNote('');
        setShowAddForm(false);
        await fetchBatches();
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm('이 배치를 삭제하시겠습니까? 잔여 수량이 재고에서 차감됩니다.')) return;
    try {
      const res = await fetch(`/api/admin/inventory/batches/${batchId}`, { method: 'DELETE' });
      if (res.ok) await fetchBatches();
    } catch { /* silent */ }
  };

  const startEdit = (batch: InventoryBatch) => {
    setEditingId(batch.id);
    setEditQty(String(batch.remaining_quantity));
    setEditExpiry(batch.expiry_date ? batch.expiry_date.split('T')[0] : '');
    setEditNote(batch.note || '');
  };

  const handleEditSave = async (batchId: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remaining_quantity: parseInt(editQty) || 0,
          expiry_date: editExpiry || null,
          note: editNote.trim() || null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchBatches();
      }
    } catch { /* silent */ }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
    return `${dt.getFullYear()}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getDate().toString().padStart(2, '0')}`;
  };

  const activeBatches = batches.filter(b => b.remaining_quantity > 0);
  const exhaustedBatches = batches.filter(b => b.remaining_quantity <= 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-xs font-bold text-[#6d4e42] tracking-tight">배치별 유효기간</h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[10px] text-[#b4988d] hover:text-[#6d4e42] font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-[#f6f4f2] transition-colors"
        >
          {showAddForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-[10px] text-[#a09080]">로딩 중...</div>
      ) : activeBatches.length === 0 && !showAddForm ? (
        <div className="text-center py-4 text-[10px] text-[#a09080] bg-[#faf8f7] rounded-xl">
          등록된 배치가 없습니다
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeBatches.map((batch, idx) => (
            <div key={batch.id} className="text-xs p-2.5 bg-[#faf8f7] rounded-xl">
              {editingId === batch.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#a09080] mb-0.5">잔여 수량</label>
                      <input
                        type="number"
                        min={0}
                        max={batch.batch_quantity}
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        className="w-full border border-[#ebe7e4] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#a09080] mb-0.5">유효기간</label>
                      <input
                        type="date"
                        value={editExpiry}
                        onChange={e => setEditExpiry(e.target.value)}
                        className="w-full border border-[#ebe7e4] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    placeholder="메모"
                    className="w-full border border-[#ebe7e4] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#b4988d]/30"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[10px] px-2 py-1 rounded-lg text-[#a09080] hover:bg-[#ebe7e4] cursor-pointer transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleEditSave(batch.id)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-[#6d4e42] text-white hover:bg-[#5a3d33] cursor-pointer transition-colors"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#a09080] w-5 text-center">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[#575756] font-medium">
                        {batch.remaining_quantity}/{batch.batch_quantity} {itemUnit}
                      </span>
                      {batch.expiry_date && (
                        <ExpiryBadge expiryDate={batch.expiry_date} size="sm" showRemaining={false} />
                      )}
                    </div>
                    <div className="text-[10px] text-[#a09080]">
                      입고: {formatDate(batch.received_at)}
                      {batch.note && <span className="ml-1.5">| {batch.note}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(batch)}
                    className="text-[10px] text-[#b4988d] hover:text-[#6d4e42] cursor-pointer px-1.5 py-1 rounded hover:bg-[#f6f4f2] transition-colors flex-shrink-0"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer px-1.5 py-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}

          {exhaustedBatches.length > 0 && (
            <details className="text-[10px]">
              <summary className="text-[#a09080] cursor-pointer py-1 hover:text-[#6d4e42]">
                소진된 배치 ({exhaustedBatches.length})
              </summary>
              <div className="mt-1 space-y-1">
                {exhaustedBatches.map(batch => (
                  <div key={batch.id} className="flex items-center gap-2 p-2 bg-[#f5f2f0] rounded-lg opacity-60">
                    <span className="text-[#a09080]">0/{batch.batch_quantity} {itemUnit}</span>
                    {batch.expiry_date && <span className="text-[#a09080]">{formatDate(batch.expiry_date)}</span>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="mt-2.5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/50 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#a09080] mb-1">수량 ({itemUnit}) *</label>
              <input
                type="number"
                min={1}
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#a09080] mb-1">유효기간</label>
              <input
                type="date"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#a09080] mb-1">메모</label>
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="정기 입고, 긴급 입고 등"
              className="w-full border border-[#ebe7e4] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newQty}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40"
          >
            {submitting ? '등록 중...' : '배치 등록'}
          </button>
        </form>
      )}
    </div>
  );
}
