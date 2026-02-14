'use client';

import { useState, useMemo } from 'react';
import type { InventoryItem, InventoryTransaction, InventoryTxType } from '@/types/admin';
import { DonutChart, type DonutSegment } from './StockGauge';

const TX_TYPE_CONFIG: Record<InventoryTxType, { label: string; color: string; icon: string; dotColor: string }> = {
  use:     { label: '사용', color: 'bg-orange-50 text-orange-700',  icon: '\u2193', dotColor: 'bg-orange-400' },
  restock: { label: '입고', color: 'bg-emerald-50 text-emerald-700', icon: '\u2191', dotColor: 'bg-emerald-400' },
  adjust:  { label: '조정', color: 'bg-blue-50 text-blue-700',     icon: '\u2194', dotColor: 'bg-blue-400' },
  dispose: { label: '폐기', color: 'bg-red-50 text-red-700',       icon: '\u2717', dotColor: 'bg-red-400' },
};

const CHART_COLORS = [
  '#6d4e42', '#b4988d', '#d4b5a5', '#e8d5cc',
  '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899',
  '#10b981', '#6b7280',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ─── Usage Heatmap ─────────────────────────────
function UsageHeatmap({ transactions }: { transactions: InventoryTransaction[] }) {
  const heatData = useMemo(() => {
    const now = new Date();
    const SLOTS = ['9-12', '12-15', '15-18', '18-21'];
    const dayLabels: string[] = [];
    const data: number[][] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      dayLabels.push(weekdays[d.getDay()]);
      data.push([0, 0, 0, 0]);

      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      for (const tx of transactions) {
        if (tx.tx_type !== 'use' || !tx.created_at.startsWith(dateStr)) continue;
        const hour = new Date(tx.created_at).getHours();
        if (hour >= 9 && hour < 12) data[data.length - 1][0]++;
        else if (hour >= 12 && hour < 15) data[data.length - 1][1]++;
        else if (hour >= 15 && hour < 18) data[data.length - 1][2]++;
        else if (hour >= 18 && hour < 21) data[data.length - 1][3]++;
      }
    }

    const maxVal = Math.max(...data.flat(), 1);
    return { SLOTS, dayLabels, data, maxVal };
  }, [transactions]);

  const { SLOTS, dayLabels, data, maxVal } = heatData;
  const COLORS = ['#f6f4f2', '#e8d5cc', '#d4b5a5', '#b4988d', '#6d4e42'];

  function getColor(val: number) {
    if (val === 0) return COLORS[0];
    const level = Math.min(4, Math.ceil((val / maxVal) * 4));
    return COLORS[level];
  }

  const cellSize = 24;
  const gap = 3;
  const labelW = 20;
  const headerH = 16;
  const svgW = labelW + SLOTS.length * (cellSize + gap);
  const svgH = headerH + dayLabels.length * (cellSize + gap);

  return (
    <div className="bg-white rounded-2xl border border-[#ebe7e4] p-4 mb-4 hidden md:block"
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
    >
      <h4 className="text-xs font-bold text-[#6d4e42] mb-3 tracking-tight">시간대별 사용 패턴 (최근 7일)</h4>
      <svg width={svgW} height={svgH} className="mx-auto">
        {/* Header labels */}
        {SLOTS.map((slot, i) => (
          <text
            key={slot}
            x={labelW + i * (cellSize + gap) + cellSize / 2}
            y={12}
            textAnchor="middle"
            className="fill-[#a09080]"
            fontSize={9}
          >
            {slot}
          </text>
        ))}
        {/* Rows */}
        {dayLabels.map((day, rowIdx) => (
          <g key={rowIdx}>
            <text
              x={0}
              y={headerH + rowIdx * (cellSize + gap) + cellSize / 2 + 3}
              className="fill-[#a09080]"
              fontSize={10}
              fontWeight={600}
            >
              {day}
            </text>
            {data[rowIdx].map((val, colIdx) => (
              <rect
                key={colIdx}
                x={labelW + colIdx * (cellSize + gap)}
                y={headerH + rowIdx * (cellSize + gap)}
                width={cellSize}
                height={cellSize}
                rx={4}
                fill={getColor(val)}
              />
            ))}
            {data[rowIdx].map((val, colIdx) => val > 0 ? (
              <text
                key={`t${colIdx}`}
                x={labelW + colIdx * (cellSize + gap) + cellSize / 2}
                y={headerH + rowIdx * (cellSize + gap) + cellSize / 2 + 3}
                textAnchor="middle"
                className="fill-white"
                fontSize={9}
                fontWeight={700}
              >
                {val}
              </text>
            ) : null)}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Main HistoryTab ────────────────────────────
interface HistoryTabProps {
  transactions: InventoryTransaction[];
  items: InventoryItem[];
  consumptionData: { item: InventoryItem | undefined; quantity: number }[];
}

export default function HistoryTab({ transactions, items, consumptionData }: HistoryTabProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTxs = useMemo(() => {
    let filtered = transactions;
    if (filterType === 'use') filtered = filtered.filter(t => t.tx_type === 'use');
    else if (filterType === 'restock') filtered = filtered.filter(t => t.tx_type === 'restock');
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transactions, filterType]);

  const groupedTxs = useMemo(() => {
    const groups: { date: string; txs: InventoryTransaction[] }[] = [];
    for (const tx of filteredTxs) {
      const dateStr = formatDate(tx.created_at);
      const existing = groups.find(g => g.date === dateStr);
      if (existing) {
        existing.txs.push(tx);
      } else {
        groups.push({ date: dateStr, txs: [tx] });
      }
    }
    return groups;
  }, [filteredTxs]);

  // Donut chart data
  const donutSegments: DonutSegment[] = useMemo(() => {
    return consumptionData.slice(0, 10).map(({ item, quantity }, idx) => ({
      label: item?.name || '-',
      value: quantity,
      color: CHART_COLORS[idx],
    }));
  }, [consumptionData]);

  const totalConsumption = useMemo(
    () => consumptionData.reduce((s, d) => s + d.quantity, 0),
    [consumptionData],
  );

  const filters: { value: string; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'use', label: '사용' },
    { value: 'restock', label: '입고' },
  ];

  return (
    <div>
      {/* Heatmap */}
      <UsageHeatmap transactions={transactions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
        >
          <div className="px-5 py-3.5 border-b border-[#ebe7e4] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#6d4e42] tracking-tight">입출고 내역</h3>
            <div className="flex gap-0.5 bg-[#f6f4f2] p-0.5 rounded-lg">
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    filterType === f.value
                      ? 'bg-white text-[#6d4e42] shadow-sm'
                      : 'text-[#a09080] hover:text-[#575756]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {groupedTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a09080]">
                <div className="w-12 h-12 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm">내역이 없습니다</span>
              </div>
            ) : (
              groupedTxs.map(group => (
                <div key={group.date}>
                  <div className="sticky top-0 z-10 px-5 py-2.5 bg-[#faf8f7] border-b border-[#f0eeec]">
                    <span className="text-[11px] font-bold text-[#a09080] uppercase tracking-wider">{group.date}</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[26px] top-0 bottom-0 w-px bg-[#ebe7e4]" />
                    {group.txs.map((tx) => {
                      const item = items.find(i => i.id === tx.item_id);
                      const cfg = TX_TYPE_CONFIG[tx.tx_type];
                      const isNegative = tx.tx_type === 'use' || tx.tx_type === 'dispose';
                      return (
                        <div key={tx.id} className="relative flex items-start gap-3 px-5 py-3 hover:bg-[#faf8f7] transition-colors">
                          <div className={`relative z-10 w-3 h-3 rounded-full ${cfg.dotColor} ring-2 ring-white flex-shrink-0 mt-1`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <span className="text-sm font-medium text-[#6d4e42] truncate">{item?.name || '-'}</span>
                              <span className={`text-sm font-bold tabular-nums ${isNegative ? 'text-orange-600' : 'text-emerald-600'}`}>
                                {isNegative ? '-' : '+'}{tx.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#a09080]">
                              <span className="tabular-nums">{formatTime(tx.created_at)}</span>
                              {tx.patient_name && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-[#d5cdc7]" />
                                  <span>{tx.patient_name}{tx.chart_number ? `/${tx.chart_number}` : ''}</span>
                                </>
                              )}
                              {tx.confirmed_by && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-[#d5cdc7]" />
                                  <span>{tx.confirmed_by}</span>
                                </>
                              )}
                              {tx.note && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-[#d5cdc7]" />
                                  <span className="truncate max-w-40">{tx.note}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Donut + Ranking */}
        <div className="bg-white rounded-2xl border border-[#ebe7e4] p-5"
          style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04), 0 4px 12px rgba(109,78,66,0.03)' }}
        >
          <h3 className="font-bold text-sm text-[#6d4e42] mb-4 tracking-tight">품목별 소모량 TOP 10</h3>
          {consumptionData.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-[#a09080]">
              <div className="w-10 h-10 rounded-xl bg-[#f6f4f2] flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <span className="text-xs">데이터 없음</span>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div className="flex justify-center mb-5">
                <DonutChart
                  segments={donutSegments}
                  size={130}
                  strokeWidth={18}
                  centreValue={totalConsumption}
                  centreLabel="총 사용량"
                />
              </div>

              {/* Ranking list */}
              <div className="space-y-2.5">
                {consumptionData.slice(0, 10).map(({ item, quantity }, idx) => (
                  <div key={item?.id || idx} className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                      idx < 3 ? 'bg-[#6d4e42] text-white' : 'bg-[#f0eeec] text-[#a09080]'
                    }`}>
                      {idx + 1}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx] }}
                    />
                    <span className="text-xs text-[#575756] truncate flex-1 font-medium">{item?.name}</span>
                    <span className="text-xs font-bold text-[#6d4e42] flex-shrink-0 tabular-nums">{quantity}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
