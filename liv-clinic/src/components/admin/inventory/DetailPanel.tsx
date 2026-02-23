'use client';

import { INVENTORY_CATEGORY_LABELS, INVENTORY_SUBCATEGORY_LABELS, INVENTORY_TX_LABELS, getStockStatus } from '@/types/admin';
import type { InventoryItem, InventoryTransaction, InventoryTxType } from '@/types/admin';
import { getDisplayName } from '@/lib/inventory-utils';
import BatchManager from './BatchManager';
import ExpiryBadge from './ExpiryBadge';

const STOCK_STATUS_CONFIG = {
  normal: { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', stroke: '#34d399', trail: '#ecfdf5' },
  low:    { label: '부족', bg: 'bg-amber-50',   text: 'text-amber-700',   stroke: '#f59e0b', trail: '#fffbeb' },
  out:    { label: '소진', bg: 'bg-red-50',      text: 'text-red-700',     stroke: '#ef4444', trail: '#fef2f2' },
};

const TX_COLORS: Record<InventoryTxType, string> = {
  use: 'bg-orange-50 text-orange-700',
  restock: 'bg-emerald-50 text-emerald-700',
  adjust: 'bg-blue-50 text-blue-700',
  dispose: 'bg-red-50 text-red-700',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

interface DetailPanelProps {
  item: InventoryItem;
  txs: InventoryTransaction[];
  onClose: () => void;
  onDelete?: () => void;
  onAdjust?: (item: InventoryItem) => void;
  expiryDate?: string | null;
}

export default function DetailPanel({ item, txs, onClose, onDelete, onAdjust, expiryDate }: DetailPanelProps) {
  const status = getStockStatus(item);
  const cfg = STOCK_STATUS_CONFIG[status];

  // Gauge
  const size = 100;
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = item.min_stock > 0
    ? Math.min(100, Math.round((item.current_stock / (item.min_stock * 3)) * 100))
    : (item.current_stock > 0 ? 100 : 0);
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="w-80 bg-white rounded-2xl border border-[#ebe7e4] flex-shrink-0 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 8px 24px rgba(109,78,66,0.06)' }}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#ebe7e4] flex items-center justify-between bg-[#faf8f7]">
        <h3 className="font-bold text-sm text-[#6d4e42] tracking-tight">품목 상세</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-[#ebe7e4] flex items-center justify-center cursor-pointer transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-[#a09080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Name + gauge */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.06))' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cfg.trail} strokeWidth={sw} />
              <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={cfg.stroke} strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-[#6d4e42] tabular-nums">{item.current_stock}</span>
              <span className="text-[10px] text-[#a09080]">{item.unit}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#6d4e42] mb-1.5 truncate">{getDisplayName(item)}</h4>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
            <p className="text-[10px] text-[#a09080] mt-1.5">
              최소 재고: {item.min_stock} {item.unit}
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="bg-[#faf8f7] rounded-xl p-4">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs">
            <div className="text-[#a09080]">카테고리</div>
            <div className="text-[#575756] font-medium">{INVENTORY_CATEGORY_LABELS[item.category]}</div>
            {item.sub_category && (
              <>
                <div className="text-[#a09080]">세부 분류</div>
                <div className="text-[#575756]">{INVENTORY_SUBCATEGORY_LABELS[item.sub_category] || item.sub_category}</div>
              </>
            )}
            {item.specification && item.specification !== '-' && (
              <>
                <div className="text-[#a09080]">규격</div>
                <div className="text-[#575756]">{item.specification}</div>
              </>
            )}
            <div className="text-[#a09080]">단가</div>
            <div className="text-[#575756] font-medium tabular-nums">{formatPrice(item.unit_price)}</div>
            <div className="text-[#a09080]">재고 가치</div>
            <div className="text-[#575756] font-medium tabular-nums">{formatPrice(item.current_stock * item.unit_price)}</div>
            {item.supplier && (
              <>
                <div className="text-[#a09080]">공급사</div>
                <div className="text-[#575756]">{item.supplier}</div>
              </>
            )}
            {item.is_refrigerated && (
              <>
                <div className="text-[#a09080]">보관</div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
                    </svg>
                    냉장 보관
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expiry badge */}
        {expiryDate && (
          <div className="bg-[#faf8f7] rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a09080]">유효기간</span>
              <ExpiryBadge expiryDate={expiryDate} size="md" />
            </div>
          </div>
        )}

        {/* Batch Manager */}
        <BatchManager itemId={item.id} itemName={item.name} itemUnit={item.unit} />

        {item.storage_note && (
          <div className="flex items-start gap-2.5 text-xs bg-[#b4988d]/5 rounded-xl p-3">
            <svg className="w-3.5 h-3.5 text-[#b4988d] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[#b4988d]">{item.storage_note}</span>
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <h4 className="text-xs font-bold text-[#6d4e42] mb-2.5 tracking-tight">최근 입출고</h4>
          {txs.length === 0 ? (
            <p className="text-xs text-[#a09080] text-center py-5 bg-[#faf8f7] rounded-xl">내역 없음</p>
          ) : (
            <div className="space-y-1">
              {txs.map((tx) => {
                const isNeg = tx.tx_type === 'use' || tx.tx_type === 'dispose';
                return (
                  <div key={tx.id} className="flex items-center gap-2 text-xs py-2 border-b border-[#f5f2f0] last:border-0">
                    <span className={`px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${TX_COLORS[tx.tx_type]}`}>
                      {isNeg ? '-' : '+'}{tx.quantity}
                    </span>
                    <span className="text-[#575756] flex-1 truncate">
                      {tx.patient_name || tx.note || INVENTORY_TX_LABELS[tx.tx_type]}
                    </span>
                    <span className="text-[#a09080] flex-shrink-0 tabular-nums">{formatDate(tx.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {onAdjust && (
            <button
              onClick={() => onAdjust(item)}
              className="w-full text-xs text-blue-600 hover:text-blue-800 py-2.5 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer font-medium"
            >
              수량 보정
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full text-xs text-red-400 hover:text-red-600 py-2.5 border border-red-200 rounded-xl hover:bg-red-50 transition-colors cursor-pointer font-medium"
            >
              품목 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
