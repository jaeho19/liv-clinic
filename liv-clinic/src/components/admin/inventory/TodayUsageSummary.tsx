'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { InventoryItem, InventoryTransaction } from '@/types/admin';
import type { UsageSession } from '@/lib/usage-session-utils';
import { formatTime, getTodayString, formatDateLabel } from '@/lib/usage-session-utils';

interface TodayUsageSummaryProps {
  sessions: UsageSession[];
  items: InventoryItem[];
  transactions: InventoryTransaction[];
}

export default function TodayUsageSummary({ sessions, items, transactions }: TodayUsageSummaryProps) {
  const [collapsed, setCollapsed] = useState(sessions.length > 5);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const todayStr = getTodayString();

  // 품목 ID → 이름 맵
  const itemMap = useMemo(() => {
    const m = new Map<string, InventoryItem>();
    for (const item of items) m.set(item.id, item);
    return m;
  }, [items]);

  // 세션별 상세 트랜잭션
  const sessionDetails = useMemo(() => {
    return sessions.map(session => {
      const txs = session.transactionIds
        .map(id => transactions.find(t => t.id === id))
        .filter((t): t is InventoryTransaction => !!t);
      return txs;
    });
  }, [sessions, transactions]);

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#ebe7e4] mb-5 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
      >
        <div className="px-5 py-3.5 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#b4988d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-bold text-[#6d4e42] tracking-tight">
            오늘의 물품 사용 ({formatDateLabel(todayStr)})
          </span>
        </div>
        <div className="flex flex-col items-center py-8 text-[#c5b8b0]">
          <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium mb-2">오늘 사용 기록이 아직 없습니다</p>
          <Link
            href="/admin/inventory"
            className="text-xs text-[#b4988d] hover:text-[#6d4e42] font-semibold transition-colors"
          >
            키오스크에서 물품 차감하기 &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ebe7e4] mb-5 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-3.5 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between cursor-pointer hover:bg-[#f6f4f2] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#b4988d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-bold text-[#6d4e42] tracking-tight">
            오늘의 물품 사용 ({formatDateLabel(todayStr)})
          </span>
          <span className="text-xs font-semibold text-[#b4988d] bg-[#b4988d]/10 px-2 py-0.5 rounded-full">
            {sessions.length}건
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-[#a09080] transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Sessions */}
      {!collapsed && (
        <div className="divide-y divide-[#f5f2f0]">
          {sessions.map((session, idx) => {
            const isExpanded = expandedIdx === idx;
            const details = sessionDetails[idx];
            return (
              <div key={idx}>
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#faf8f7] transition-colors cursor-pointer text-left"
                >
                  {/* Time */}
                  <span className="text-xs font-mono text-[#b4988d] w-12 flex-shrink-0 tabular-nums">
                    {formatTime(session.timestamp)}
                  </span>

                  {/* Procedure */}
                  <span className="text-sm font-bold text-[#6d4e42] truncate min-w-0 flex-1">
                    {session.procedureLabel}
                  </span>

                  {/* Patient */}
                  {session.patientName && (
                    <span className="text-xs text-[#a09080] flex-shrink-0 hidden sm:inline">
                      {session.patientName}
                      {session.chartNumber && <span className="text-[#c5b8b0] ml-1">#{session.chartNumber}</span>}
                    </span>
                  )}

                  {/* Nurse */}
                  {session.confirmedBy && (
                    <span className="text-xs text-[#a09080] bg-[#f6f4f2] px-2 py-0.5 rounded-md flex-shrink-0 hidden sm:inline">
                      {session.confirmedBy}
                    </span>
                  )}

                  {/* Item count */}
                  <span className="text-[10px] text-[#b4988d] font-semibold flex-shrink-0">
                    {session.itemCount}개 품목
                  </span>

                  {/* Expand icon */}
                  <svg
                    className={`w-3.5 h-3.5 text-[#c5b8b0] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && details.length > 0 && (
                  <div className="bg-[#faf8f7] px-5 py-3 ml-14 mr-5 mb-3 rounded-xl border border-[#f0eeec]">
                    <div className="border-l-2 border-[#ebe7e4] pl-4 space-y-1.5">
                      {details.map((tx) => {
                        const item = itemMap.get(tx.item_id);
                        return (
                          <div key={tx.id} className="flex items-center gap-2 text-xs">
                            <span className="text-orange-500 font-semibold tabular-nums">-{tx.quantity}</span>
                            <span className="text-[#6d4e42] font-medium truncate">{item?.name || tx.item_id}</span>
                            {item?.unit && (
                              <span className="text-[#c5b8b0]">{item.unit}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
