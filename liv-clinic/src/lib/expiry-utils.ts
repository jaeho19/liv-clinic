// ─── 유통기한/유효기간 유틸리티 ──────────────────────

export type ExpiryStatus = 'normal' | 'warning' | 'critical' | 'expired';

export const EXPIRY_STYLES: Record<ExpiryStatus, {
  label: string;
  bg: string;
  text: string;
  dot: string;
}> = {
  normal:   { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  warning:  { label: '임박', bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  critical: { label: '긴급', bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
  expired:  { label: '만료', bg: 'bg-red-100',    text: 'text-red-800',     dot: 'bg-red-600' },
};

/** 유통기한 상태 계산: 6개월 미만=warning, 3개월 미만=critical, 만료=expired */
export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return 'normal';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + (expiryDate.includes('T') ? '' : 'T00:00:00'));
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'expired';
  if (diffDays < 90) return 'critical';
  if (diffDays < 180) return 'warning';
  return 'normal';
}

/** YYYY.MM.DD 포맷 */
export function formatExpiryDate(date: string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date + (date.includes('T') ? '' : 'T00:00:00'));
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

/** 잔여 기간 텍스트 */
export function getRemainingText(expiryDate: string | null | undefined): string {
  if (!expiryDate) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + (expiryDate.includes('T') ? '' : 'T00:00:00'));
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}일 경과`;
  if (diffDays === 0) return '오늘 만료';
  if (diffDays < 30) return `${diffDays}일 남음`;
  const months = Math.floor(diffDays / 30);
  return `약 ${months}개월 남음`;
}

/** 배치 배열에서 가장 빠른 유효기간 반환 (잔여 수량 > 0인 것만) */
export function getEarliestExpiry(
  batches: { expiry_date: string | null; remaining_quantity: number }[],
): string | null {
  const valid = batches
    .filter(b => b.expiry_date && b.remaining_quantity > 0)
    .map(b => b.expiry_date!)
    .sort();
  return valid[0] || null;
}
