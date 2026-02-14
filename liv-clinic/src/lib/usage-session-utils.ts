import type { InventoryTransaction } from '@/types/admin';

// ─── Types ──────────────────────────────────────
export interface UsageSession {
  timestamp: string;
  procedureLabel: string;
  patientName: string;
  chartNumber: string;
  confirmedBy: string;
  itemCount: number;
  transactionIds: string[];
}

// ─── Helpers ────────────────────────────────────
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getDay()];
  return `${month}/${day} ${weekday}`;
}

// ─── Session Grouping ───────────────────────────
export function buildSession(txs: InventoryTransaction[]): UsageSession {
  const first = txs[0];
  let procedureLabel = first.note || '';
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
    transactionIds: txs.map(t => t.id),
  };
}

export function groupIntoSessions(txs: InventoryTransaction[]): UsageSession[] {
  if (txs.length === 0) return [];

  const sorted = [...txs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const sessions: UsageSession[] = [];
  let currentGroup: InventoryTransaction[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(currentGroup[currentGroup.length - 1].created_at).getTime();
    const curr = new Date(sorted[i].created_at).getTime();
    const samePatient = sorted[i].patient_name === currentGroup[0].patient_name;

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
