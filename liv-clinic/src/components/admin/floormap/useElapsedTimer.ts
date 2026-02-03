import { useState, useEffect } from 'react';

/**
 * 전역 tick 기반 경과시간 갱신 훅
 * 개별 방마다 타이머를 두지 않고, 전역 tick 하나로 모든 오버레이를 리렌더한다.
 * intervalMs 기본값 30초 (30000ms)
 */
export function useElapsedTimer(intervalMs = 30000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}

export function getElapsedMinutes(isoStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000));
}

export function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}시간 ${m}분`;
}

export type TimeUrgency = 'normal' | 'warning' | 'critical';

export function getTimeUrgency(
  elapsedMinutes: number,
  warningMinutes: number,
  criticalMinutes: number,
): TimeUrgency {
  if (elapsedMinutes >= criticalMinutes) return 'critical';
  if (elapsedMinutes >= warningMinutes) return 'warning';
  return 'normal';
}

// ─── V2: Progress helpers ────────────────────────────────
export interface CaseProgress {
  percent: number;
  elapsed: number;
  remaining: number;
  isOvertime: boolean;
  estimatedEndTime: string | null;
}

export function getCaseProgress(actualStart: string | undefined, expectedMin: number): CaseProgress {
  if (!actualStart) return { percent: 0, elapsed: 0, remaining: expectedMin, isOvertime: false, estimatedEndTime: null };
  const startMs = new Date(actualStart).getTime();
  const elapsed = getElapsedMinutes(actualStart);
  const percent = expectedMin > 0 ? Math.min((elapsed / expectedMin) * 100, 150) : 0;
  const remaining = Math.max(0, expectedMin - elapsed);
  const isOvertime = elapsed > expectedMin;
  const endTime = new Date(startMs + expectedMin * 60 * 1000);
  const estimatedEndTime = endTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { percent, elapsed, remaining, isOvertime, estimatedEndTime };
}

export function getProgressColor(percent: number): string {
  if (percent >= 120) return '#ef4444'; // red
  if (percent >= 100) return '#f59e0b'; // amber
  return '#22c55e'; // green
}
