'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  INVENTORY_CATEGORY_LABELS,
  getStockStatus,
} from '@/types/admin';
import type { InventoryCategory, InventoryItem, StockLog } from '@/types/admin';

// ─── Mock 데이터 ──────────────────────────────────────────
const MOCK_ITEMS: InventoryItem[] = [
  // 주사제/시술재료
  { id: '1', name: '보톡스 (엘러간 100U)', category: 'injection', currentStock: 25, minStock: 10, unit: '바이알', unitPrice: 150000, supplier: '엘러간코리아', lastRestockedAt: '2026-01-25', memo: '냉장보관 필수' },
  { id: '2', name: '쥬비덤 볼류마 1ml', category: 'injection', currentStock: 8, minStock: 5, unit: '시린지', unitPrice: 280000, supplier: '엘러간코리아', lastRestockedAt: '2026-01-20' },
  { id: '3', name: '쥬비덤 볼벨라 1ml', category: 'injection', currentStock: 3, minStock: 5, unit: '시린지', unitPrice: 250000, supplier: '엘러간코리아', lastRestockedAt: '2026-01-15' },
  { id: '4', name: '리쥬란 힐러 2ml', category: 'injection', currentStock: 12, minStock: 8, unit: '시린지', unitPrice: 180000, supplier: '파마리서치', lastRestockedAt: '2026-01-22' },
  { id: '5', name: '쥬벨룩 볼륨 1ml', category: 'injection', currentStock: 0, minStock: 5, unit: '시린지', unitPrice: 200000, supplier: '에이미셀', lastRestockedAt: '2026-01-10' },
  { id: '6', name: '실리프팅 실 (PDO)', category: 'injection', currentStock: 40, minStock: 20, unit: '개', unitPrice: 35000, supplier: '메디스킨', lastRestockedAt: '2026-01-28' },
  // 소모품
  { id: '7', name: '마취 크림 (에멜라 5g)', category: 'consumable', currentStock: 45, minStock: 20, unit: '튜브', unitPrice: 8000, supplier: '한국메나리니', lastRestockedAt: '2026-01-27' },
  { id: '8', name: '일회용 니들 30G', category: 'consumable', currentStock: 200, minStock: 100, unit: '개', unitPrice: 500, supplier: '비디메디칼', lastRestockedAt: '2026-01-28' },
  { id: '9', name: '캐뉼라 25G', category: 'consumable', currentStock: 15, minStock: 20, unit: '개', unitPrice: 3500, supplier: '비디메디칼', lastRestockedAt: '2026-01-18' },
  { id: '10', name: '알코올 솜', category: 'consumable', currentStock: 500, minStock: 200, unit: '개', unitPrice: 50, supplier: '일반의료', lastRestockedAt: '2026-01-25' },
  { id: '11', name: '냉각젤 (울쎄라용)', category: 'consumable', currentStock: 6, minStock: 3, unit: '병', unitPrice: 45000, supplier: '머즈코리아', lastRestockedAt: '2026-01-20' },
  // 스킨케어
  { id: '12', name: '재생 크림 (시술 후)', category: 'skincare', currentStock: 30, minStock: 15, unit: '개', unitPrice: 25000, supplier: '더마코스', lastRestockedAt: '2026-01-22' },
  { id: '13', name: '선블록 SPF50+', category: 'skincare', currentStock: 20, minStock: 10, unit: '개', unitPrice: 18000, supplier: '더마코스', lastRestockedAt: '2026-01-20' },
  { id: '14', name: '진정 마스크팩', category: 'skincare', currentStock: 2, minStock: 10, unit: '박스', unitPrice: 35000, supplier: '더마코스', lastRestockedAt: '2026-01-05' },
  // 장비
  { id: '15', name: '울쎄라 카트리지 DS 7-3.0', category: 'equipment', currentStock: 4, minStock: 2, unit: '개', unitPrice: 850000, supplier: '머즈코리아', lastRestockedAt: '2026-01-15' },
  { id: '16', name: '써마지 팁 900샷', category: 'equipment', currentStock: 2, minStock: 1, unit: '개', unitPrice: 1200000, supplier: '솔타메디칼', lastRestockedAt: '2026-01-10' },
];

const MOCK_LOGS: StockLog[] = [
  { id: 'l1', itemId: '1', type: 'in', quantity: 10, note: '정기 발주', createdAt: '2026-01-25T10:00:00' },
  { id: 'l2', itemId: '1', type: 'out', quantity: 3, note: '오전 시술 사용', createdAt: '2026-01-28T11:30:00' },
  { id: 'l3', itemId: '3', type: 'out', quantity: 2, note: '필러 시술', createdAt: '2026-01-29T14:00:00' },
  { id: 'l4', itemId: '5', type: 'out', quantity: 5, note: '시술 사용 완료', createdAt: '2026-01-28T16:00:00' },
  { id: 'l5', itemId: '9', type: 'out', quantity: 5, note: '필러 캐뉼라 사용', createdAt: '2026-01-29T10:00:00' },
  { id: 'l6', itemId: '14', type: 'out', quantity: 8, note: '시술 후 제공', createdAt: '2026-01-29T15:00:00' },
];

// ─── 유틸 ──────────────────────────────────────────
const STOCK_STATUS_CONFIG = {
  normal: { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  low: { label: '부족', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  out: { label: '소진', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

function formatPrice(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

// ─── 메인 컴포넌트 ──────────────────────────────────
export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [logs, setLogs] = useState<StockLog[]>(MOCK_LOGS);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockModal, setStockModal] = useState<{ item: InventoryItem; type: 'in' | 'out' } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 필터링
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && getStockStatus(item) !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.supplier.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, categoryFilter, statusFilter, searchQuery]);

  // 통계
  const stats = useMemo(() => {
    const total = items.length;
    const normal = items.filter((i) => getStockStatus(i) === 'normal').length;
    const low = items.filter((i) => getStockStatus(i) === 'low').length;
    const out = items.filter((i) => getStockStatus(i) === 'out').length;
    const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0);
    return { total, normal, low, out, totalValue };
  }, [items]);

  // 입출고 처리
  const handleStockChange = useCallback((itemId: string, type: 'in' | 'out', quantity: number, note: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newStock = type === 'in'
          ? item.currentStock + quantity
          : Math.max(0, item.currentStock - quantity);
        return {
          ...item,
          currentStock: newStock,
          ...(type === 'in' ? { lastRestockedAt: new Date().toISOString().split('T')[0] } : {}),
        };
      })
    );
    setLogs((prev) => [
      { id: crypto.randomUUID(), itemId, type, quantity, note, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  // 새 품목 추가
  const handleAddItem = useCallback((newItem: Omit<InventoryItem, 'id'>) => {
    setItems((prev) => [...prev, { ...newItem, id: crypto.randomUUID() }]);
  }, []);

  // 품목 삭제
  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setLogs((prev) => prev.filter((l) => l.itemId !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  }, [selectedItemId]);

  // 선택된 품목의 로그
  const selectedLogs = useMemo(() => {
    if (!selectedItemId) return [];
    return logs.filter((l) => l.itemId === selectedItemId).slice(0, 10);
  }, [logs, selectedItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#6d4e42]">재고관리</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#b4988d] text-white rounded-lg text-sm font-medium hover:bg-[#a08878] transition-colors cursor-pointer"
        >
          + 새 품목 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="총 품목" value={stats.total} unit="개" color="bg-blue-50 text-blue-700" />
        <StatCard label="정상 재고" value={stats.normal} unit="개" color="bg-emerald-50 text-emerald-700" />
        <StatCard label="부족 경고" value={stats.low} unit="개" color="bg-amber-50 text-amber-700" />
        <StatCard label="소진" value={stats.out} unit="개" color="bg-red-50 text-red-700" />
        <StatCard label="총 재고가치" value={stats.totalValue.toLocaleString('ko-KR')} unit="원" color="bg-purple-50 text-purple-700" />
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="품목명 또는 공급사 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
          >
            <option value="all">전체 카테고리</option>
            {(Object.entries(INVENTORY_CATEGORY_LABELS) as [InventoryCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
          >
            <option value="all">전체 상태</option>
            <option value="normal">정상</option>
            <option value="low">부족</option>
            <option value="out">소진</option>
          </select>
          <span className="text-sm text-[#8a8a8a] ml-auto">{filtered.length}개 품목</span>
        </div>
      </div>

      {/* 메인 영역: 테이블 + 상세 패널 */}
      <div className="flex gap-4">
        {/* 품목 테이블 */}
        <div className={`bg-white rounded-xl border border-[#e5e5e5] overflow-hidden ${selectedItemId ? 'flex-1' : 'w-full'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#f6f6f6]">
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">품목명</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">카테고리</th>
                  <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">현재 재고</th>
                  <th className="text-right py-3 px-4 text-[#8a8a8a] font-medium">최소 재고</th>
                  <th className="text-center py-3 px-4 text-[#8a8a8a] font-medium">상태</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">공급사</th>
                  <th className="text-center py-3 px-4 text-[#8a8a8a] font-medium">입출고</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#8a8a8a]">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const status = getStockStatus(item);
                    const cfg = STOCK_STATUS_CONFIG[status];
                    const isSelected = selectedItemId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                        className={`border-b border-[#f0f0f0] last:border-0 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#b4988d]/5' : 'hover:bg-[#f6f6f6]'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#6d4e42]">{item.name}</span>
                        </td>
                        <td className="py-3 px-4 text-[#8a8a8a]">
                          {INVENTORY_CATEGORY_LABELS[item.category]}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {item.currentStock} <span className="text-[#8a8a8a] font-normal">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-[#8a8a8a]">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#8a8a8a]">{item.supplier}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setStockModal({ item, type: 'in' })}
                              className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              입고
                            </button>
                            <button
                              onClick={() => setStockModal({ item, type: 'out' })}
                              className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors cursor-pointer"
                              disabled={item.currentStock <= 0}
                            >
                              출고
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 패널 */}
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            logs={selectedLogs}
            onClose={() => setSelectedItemId(null)}
            onDelete={() => handleDeleteItem(selectedItem.id)}
          />
        )}
      </div>

      {/* 입출고 모달 */}
      {stockModal && (
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onSubmit={(qty, note) => {
            handleStockChange(stockModal.item.id, stockModal.type, qty, note);
            setStockModal(null);
          }}
          onClose={() => setStockModal(null)}
        />
      )}

      {/* 새 품목 모달 */}
      {showAddModal && (
        <AddItemModal
          onAdd={(data) => {
            handleAddItem(data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ─── 통계 카드 ──────────────────────────────────────
function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#e5e5e5]">
      <p className="text-sm text-[#8a8a8a] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color} inline-block px-2 py-0.5 rounded-lg`}>
        {value}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ─── 상세 패널 ──────────────────────────────────────
function DetailPanel({
  item,
  logs,
  onClose,
  onDelete,
}: {
  item: InventoryItem;
  logs: StockLog[];
  onClose: () => void;
  onDelete: () => void;
}) {
  const status = getStockStatus(item);
  const cfg = STOCK_STATUS_CONFIG[status];

  return (
    <div className="w-80 bg-white rounded-xl border border-[#e5e5e5] flex-shrink-0">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
        <h3 className="font-bold text-sm text-[#6d4e42]">품목 상세</h3>
        <button onClick={onClose} className="text-[#8a8a8a] hover:text-[#6d4e42] cursor-pointer text-lg leading-none">&times;</button>
      </div>

      <div className="p-4 space-y-4">
        {/* 기본 정보 */}
        <div>
          <h4 className="font-medium text-[#6d4e42] mb-2">{item.name}</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-[#8a8a8a]">카테고리</div>
            <div>{INVENTORY_CATEGORY_LABELS[item.category]}</div>
            <div className="text-[#8a8a8a]">현재 재고</div>
            <div className="font-medium">{item.currentStock} {item.unit}</div>
            <div className="text-[#8a8a8a]">최소 재고</div>
            <div>{item.minStock} {item.unit}</div>
            <div className="text-[#8a8a8a]">상태</div>
            <div>
              <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <div className="text-[#8a8a8a]">단가</div>
            <div>{formatPrice(item.unitPrice)}</div>
            <div className="text-[#8a8a8a]">공급사</div>
            <div>{item.supplier}</div>
            <div className="text-[#8a8a8a]">최근 입고</div>
            <div>{item.lastRestockedAt}</div>
          </div>
          {item.memo && (
            <p className="text-xs text-[#b4988d] bg-[#b4988d]/5 rounded px-2 py-1 mt-2">{item.memo}</p>
          )}
        </div>

        {/* 입출고 내역 */}
        <div>
          <h4 className="font-medium text-sm text-[#6d4e42] mb-2">최근 입출고</h4>
          {logs.length === 0 ? (
            <p className="text-xs text-[#8a8a8a] text-center py-3">내역 없음</p>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-xs border-b border-[#f0f0f0] pb-1.5 last:border-0">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    log.type === 'in' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {log.type === 'in' ? '+' : '-'}{log.quantity}
                  </span>
                  <span className="text-[#575756] flex-1 truncate">{log.note}</span>
                  <span className="text-[#8a8a8a] flex-shrink-0">
                    {new Date(log.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 삭제 */}
        <button
          onClick={onDelete}
          className="w-full text-xs text-red-400 hover:text-red-600 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          품목 삭제
        </button>
      </div>
    </div>
  );
}

// ─── 입출고 모달 ──────────────────────────────────────
function StockModal({
  item,
  type,
  onSubmit,
  onClose,
}: {
  item: InventoryItem;
  type: 'in' | 'out';
  onSubmit: (qty: number, note: string) => void;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const isIn = type === 'in';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    if (!isIn && quantity > item.currentStock) return;
    onSubmit(quantity, note.trim() || (isIn ? '입고' : '출고'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-xl w-full max-w-sm mx-4">
        <div className={`px-6 py-4 border-b border-[#e5e5e5] ${isIn ? 'bg-emerald-50' : 'bg-orange-50'}`}>
          <h3 className={`font-bold ${isIn ? 'text-emerald-700' : 'text-orange-700'}`}>
            {isIn ? '입고 처리' : '출고 처리'}
          </h3>
          <p className="text-sm text-[#8a8a8a] mt-0.5">{item.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              현재 재고: <span className="font-bold">{item.currentStock} {item.unit}</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#575756] mb-1">
              수량 ({item.unit}) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={!isIn ? item.currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              required
            />
            {!isIn && quantity > item.currentStock && (
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
              className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer ${
                isIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isIn ? '입고 확인' : '출고 확인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 새 품목 모달 ──────────────────────────────────────
function AddItemModal({
  onAdd,
  onClose,
}: {
  onAdd: (data: Omit<InventoryItem, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<{
    name: string;
    category: InventoryCategory;
    currentStock: number;
    minStock: number;
    unit: string;
    unitPrice: number;
    supplier: string;
    memo: string;
  }>({
    name: '',
    category: 'injection',
    currentStock: 0,
    minStock: 5,
    unit: '개',
    unitPrice: 0,
    supplier: '',
    memo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.supplier.trim()) return;
    onAdd({
      name: form.name.trim(),
      category: form.category,
      currentStock: form.currentStock,
      minStock: form.minStock,
      unit: form.unit.trim() || '개',
      unitPrice: form.unitPrice,
      supplier: form.supplier.trim(),
      lastRestockedAt: new Date().toISOString().split('T')[0],
      memo: form.memo.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="font-bold text-[#6d4e42]">새 품목 등록</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 품목명 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#575756] mb-1">
                품목명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="보톡스 (엘러간 100U)"
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
                required
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as InventoryCategory }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              >
                {(Object.entries(INVENTORY_CATEGORY_LABELS) as [InventoryCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* 단위 */}
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">단위</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="개, 바이알, 박스 등"
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>

            {/* 초기 재고 */}
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">초기 재고</label>
              <input
                type="number"
                min={0}
                value={form.currentStock}
                onChange={(e) => setForm((f) => ({ ...f, currentStock: Number(e.target.value) }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>

            {/* 최소 재고 */}
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">최소 재고</label>
              <input
                type="number"
                min={0}
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>

            {/* 단가 */}
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">단가 (원)</label>
              <input
                type="number"
                min={0}
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
              />
            </div>

            {/* 공급사 */}
            <div>
              <label className="block text-sm font-medium text-[#575756] mb-1">
                공급사 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                placeholder="엘러간코리아"
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
                required
              />
            </div>

            {/* 메모 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#575756] mb-1">메모</label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="보관 조건, 유통기한 등"
                rows={2}
                className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#b4988d] text-white rounded-lg text-sm font-medium hover:bg-[#a08878] transition-colors cursor-pointer"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
