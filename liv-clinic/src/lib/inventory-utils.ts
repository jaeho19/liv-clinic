export interface BurndownResult {
  dailyRate: number;
  daysUntilEmpty: number;
  estimatedDate: string;
  severity: 'safe' | 'warning' | 'critical';
}

/**
 * Calculate estimated burndown based on recent transaction history.
 * @param currentStock - current stock level
 * @param recentTransactions - usage transactions within lookback period
 * @param lookbackDays - number of days to look back (default 30)
 */
export function calculateBurndown(
  currentStock: number,
  recentTransactions: { tx_type: string; quantity: number; created_at: string }[],
  lookbackDays: number = 30
): BurndownResult {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const usage = recentTransactions
    .filter((t) => t.tx_type === 'use' && new Date(t.created_at) >= cutoff)
    .reduce((sum, t) => sum + t.quantity, 0);

  const dailyRate = usage / lookbackDays;

  if (dailyRate <= 0) {
    return {
      dailyRate: 0,
      daysUntilEmpty: Infinity,
      estimatedDate: '-',
      severity: 'safe',
    };
  }

  const daysUntilEmpty = Math.floor(currentStock / dailyRate);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysUntilEmpty);

  return {
    dailyRate: Math.round(dailyRate * 100) / 100,
    daysUntilEmpty,
    estimatedDate: estimatedDate.toISOString().split('T')[0],
    severity: daysUntilEmpty <= 7 ? 'critical' : daysUntilEmpty <= 14 ? 'warning' : 'safe',
  };
}

/**
 * 물품 표시명 반환. volume_cc가 있으면 "이름 Ncc" 형태로 반환.
 * 예: { name: '리쥬란 힐러', volume_cc: 2 } → '리쥬란 힐러 2cc'
 */
export function getDisplayName(item: { name: string; volume_cc?: number | null }): string {
  if (item.volume_cc && item.volume_cc > 0) {
    return `${item.name} ${item.volume_cc}cc`;
  }
  return item.name;
}

export const BURNDOWN_SEVERITY_CONFIG = {
  safe: { label: '안전', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  warning: { label: '주의', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  critical: { label: '긴급', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
};
