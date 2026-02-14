'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { InventoryTransaction } from '@/types/admin';

// ─── Types ──────────────────────────────────────
interface UsageSession {
  timestamp: string;
  procedureLabel: string;
  patientName: string;
  chartNumber: string;
  confirmedBy: string;
  itemCount: number;
}

interface DailyUsageLogProps {
  refetchKey: number;
  filterPrefix?: string;
}

// ─── Helpers ────────────────────────────────────
function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day} ${weekday}`;
}

function groupIntoSessions(txs: InventoryTransaction[]): UsageSession[] {
  if (txs.length === 0) return [];

  // Sort by created_at descending
  const sorted = [...txs].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const sessions: UsageSession[] = [];
  let currentGroup: InventoryTransaction[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(currentGroup[currentGroup.length - 1].created_at).getTime();
    const curr = new Date(sorted[i].created_at).getTime();
    const samePatient = sorted[i].patient_name === currentGroup[0].patient_name;

    // Same session if same patient and within 30 seconds
    if (samePatient && Math.abs(prev - curr) < 30_000) {
      currentGroup.push(sorted[i]);
    } else {
      sessions.push(buildSession(currentGroup));
      currentGroup = [sorted[i]];
    }
  }
  sessions.push(buildSession(currentGroup));

  return sessions;
}

function buildSession(txs: InventoryTransaction[]): UsageSession {
  const first = txs[0];
  let procedureLabel = first.note || '';
  // Remove known prefixes
  if (procedureLabel.startsWith('키오스크: ')) {
    procedureLabel = procedureLabel.replace('키오스크: ', '');
  } else if (procedureLabel.startsWith('화장품: ')) {
    procedureLabel = procedureLabel.replace('화장품: ', '');
  }

  return {
    timestamp: first.created_at,
    procedureLabel: procedureLabel || '직접 차감',
    patientName: first.patient_name || '',
    chartNumber: first.chart_number || '',
    confirmedBy: first.confirmed_by || '',
    itemCount: txs.length,
  };
}

// ─── Component ──────────────────────────────────
export default function DailyUsageLog({ refetchKey, filterPrefix }: DailyUsageLogProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStr, setTodayStr] = useState(getTodayString);
  const [collapsed, setCollapsed] = useState(false);

  const fetchTodayLogs = useCallback(async () => {
    const today = getTodayString();
    setTodayStr(today);
    try {
      const res = await fetch(
        `/api/admin/inventory/transactions?type=use&dateFrom=${today}&dateTo=${today}&limit=100`
      );
      if (res.ok) {
        let data: InventoryTransaction[] = await res.json();
        // Filter by note prefix if specified
        if (filterPrefix) {
          data = data.filter(tx => tx.note?.startsWith(filterPrefix));
        }
        setTransactions(data);
      }
    } catch {
      // Silent fail - non-critical UI
    } finally {
      setLoading(false);
    }
  }, [filterPrefix]);

  // Initial load + refetch on key change
  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs, refetchKey]);

  // Midnight detection: check every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getTodayString();
      if (now !== todayStr) {
        fetchTodayLogs();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [todayStr, fetchTodayLogs]);

  const sessions = useMemo(() => groupIntoSessions(transactions), [transactions]);

  if (loading) {
    return (
      <div className="mt-5 bg-white rounded-2xl border border-[#ebe7e4] p-5"
        style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
      >
        <div className="flex items-center gap-2 text-[#a09080] text-sm">
          <div className="w-4 h-4 border-2 border-[#b4988d]/30 border-t-[#b4988d] rounded-full animate-spin" />
          오늘의 기록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 bg-white rounded-2xl border border-[#ebe7e4] overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(109,78,66,0.04)' }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7] flex items-center justify-between cursor-pointer hover:bg-[#f6f4f2] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#b4988d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-bold text-[#6d4e42] tracking-tight">
            오늘의 사용 기록 ({formatDateLabel(todayStr)})
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

      {/* Content */}
      {!collapsed && (
        <div className="p-4">
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-[#c5b8b0]">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">오늘 사용 기록이 아직 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-[#faf8f7] rounded-xl p-3 border border-[#ebe7e4]"
                >
                  {/* Time */}
                  <span className="text-xs font-mono text-[#b4988d] w-11 flex-shrink-0 tabular-nums">
                    {formatTime(session.timestamp)}
                  </span>

                  {/* Procedure */}
                  <span className="text-sm font-bold text-[#6d4e42] truncate min-w-0 flex-1">
                    {session.procedureLabel}
                  </span>

                  {/* Patient */}
                  {session.patientName && (
                    <span className="text-xs text-[#a09080] flex-shrink-0">
                      {session.patientName}
                    </span>
                  )}

                  {/* Chart */}
                  {session.chartNumber && (
                    <span className="text-[10px] text-[#c5b8b0] flex-shrink-0 hidden sm:inline">
                      #{session.chartNumber}
                    </span>
                  )}

                  {/* Nurse */}
                  {session.confirmedBy && (
                    <span className="text-xs text-[#a09080] bg-[#f6f4f2] px-2 py-0.5 rounded-md flex-shrink-0">
                      {session.confirmedBy}
                    </span>
                  )}

                  {/* Item count */}
                  <span className="text-[10px] text-[#b4988d] font-semibold flex-shrink-0">
                    {session.itemCount}개 품목
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
