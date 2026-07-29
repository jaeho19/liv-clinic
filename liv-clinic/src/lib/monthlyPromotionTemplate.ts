import { RELATED_TREATMENT_OPTIONS } from '@/types/admin';

// 매달 프로모션 초안 — 원장님이 매월 손으로 만들던 이벤트를 월 하나로 생성한다.
// 브랜드명은 messages/{ko,en,ja,zh}.json 의 common.siteName 과 동일한 정본 문자열.
// is_published 는 일부러 넣지 않는다 — 이미지 업로드 전까지 미발행으로 남겨야 한다.

export interface MonthlyPromotionDraft {
  slug: string;
  title_ko: string;
  title_en: string;
  title_ja: string;
  title_zh: string;
  description_ko: string;
  description_en: string;
  description_ja: string;
  description_zh: string;
  start_date: string;
  end_date: string;
  category: string;
  featured: boolean;
  related_treatments: string[];
  sort_order: number;
}

const ENGLISH_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTH_INPUT_PATTERN = /^(\d{4})-(\d{2})$/;

const pad2 = (value: number) => String(value).padStart(2, '0');

/** 해당 월의 마지막 날 (윤년 포함) — day 0 은 이전 달의 마지막 날을 뜻한다. */
const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export function buildMonthlyPromotionDraft(year: number, month: number): MonthlyPromotionDraft {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`월은 1~12 사이의 정수여야 합니다: ${month}`);
  }

  const mm = pad2(month);
  const monthEn = ENGLISH_MONTH_NAMES[month - 1];

  return {
    slug: `${year}-${mm}-promotion`,
    title_ko: `${month}월 프로모션`,
    title_en: `${monthEn} Promotion`,
    title_ja: `${month}月プロモーション`,
    title_zh: `${month}月促销活动`,
    description_ko: `리브성형외과 ${month}월 프로모션`,
    description_en: `LIV Plastic Surgery ${monthEn} Promotion`,
    description_ja: `リブ形成外科${month}月プロモーション`,
    description_zh: `LIV整形外科${month}月优惠活动`,
    start_date: `${year}-${mm}-01`,
    end_date: `${year}-${mm}-${pad2(lastDayOfMonth(year, month))}`,
    category: 'all',
    featured: true,
    related_treatments: RELATED_TREATMENT_OPTIONS.map((opt) => opt.value),
    sort_order: 0,
  };
}

/** 기본 선택 월 = 다음 달 (12월이면 다음 해 1월). */
export function getDefaultPromotionMonth(today: Date = new Date()): { year: number; month: number } {
  const month = today.getMonth() + 2;
  if (month > 12) return { year: today.getFullYear() + 1, month: 1 };
  return { year: today.getFullYear(), month };
}

/** <input type="month"> 값('2026-09') 파싱 — 형식이나 범위가 어긋나면 null. */
export function parseMonthInputValue(value: string): { year: number; month: number } | null {
  const matched = MONTH_INPUT_PATTERN.exec(value);
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  if (month < 1 || month > 12) return null;

  return { year, month };
}

export function toMonthInputValue(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}
