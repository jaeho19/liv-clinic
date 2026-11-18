import { addDays } from './giftCode';

/** 관리자 화면 기간 단추 — 모두 서울 날짜(YYYY-MM-DD), 양 끝 포함. */
export type PeriodKey = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  this_month: '이번 달',
  last_month: '지난달',
  last_3_months: '최근 3개월',
  this_year: '올해',
  custom: '직접 고르기',
};

function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(date: string, months: number): string {
  const [y, m] = date.slice(0, 7).split('-').map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function periodRange(key: Exclude<PeriodKey, 'custom'>, today: string): { from: string; to: string } {
  switch (key) {
    case 'this_month':
      return { from: monthStart(today), to: today };
    case 'last_month': {
      const from = shiftMonth(today, -1);
      return { from, to: addDays(monthStart(today), -1) };
    }
    case 'last_3_months':
      return { from: shiftMonth(today, -2), to: today };
    case 'this_year':
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
  }
}
