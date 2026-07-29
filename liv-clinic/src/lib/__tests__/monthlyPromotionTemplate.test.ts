import { describe, it, expect } from 'vitest';
import {
  buildMonthlyPromotionDraft,
  getDefaultPromotionMonth,
  parseMonthInputValue,
  toMonthInputValue,
} from '../monthlyPromotionTemplate';
import { RELATED_TREATMENT_OPTIONS } from '@/types/admin';

describe('buildMonthlyPromotionDraft', () => {
  it('fills every approved string for 2026-09', () => {
    const draft = buildMonthlyPromotionDraft(2026, 9);
    expect(draft.slug).toBe('2026-09-promotion');
    expect(draft.title_ko).toBe('9월 프로모션');
    expect(draft.title_en).toBe('September Promotion');
    expect(draft.title_ja).toBe('9月プロモーション');
    expect(draft.title_zh).toBe('9月促销活动');
    expect(draft.description_ko).toBe('리브성형외과 9월 프로모션');
    expect(draft.description_en).toBe('LIV Plastic Surgery September Promotion');
    expect(draft.description_ja).toBe('リブ形成外科9月プロモーション');
    expect(draft.description_zh).toBe('LIV整形外科9月优惠活动');
    expect(draft.start_date).toBe('2026-09-01');
    expect(draft.end_date).toBe('2026-09-30');
  });

  it('applies the canonical event defaults', () => {
    const draft = buildMonthlyPromotionDraft(2026, 9);
    expect(draft.category).toBe('all');
    expect(draft.featured).toBe(true);
    expect(draft.sort_order).toBe(0);
  });

  it('zero-pads the month in slug and dates', () => {
    const draft = buildMonthlyPromotionDraft(2026, 1);
    expect(draft.slug).toBe('2026-01-promotion');
    expect(draft.start_date).toBe('2026-01-01');
    expect(draft.title_ko).toBe('1월 프로모션');
  });

  it('ends on the last calendar day of 31-day and 30-day months', () => {
    expect(buildMonthlyPromotionDraft(2026, 1).end_date).toBe('2026-01-31');
    expect(buildMonthlyPromotionDraft(2026, 4).end_date).toBe('2026-04-30');
    expect(buildMonthlyPromotionDraft(2026, 12).end_date).toBe('2026-12-31');
  });

  it('handles February in non-leap and leap years', () => {
    expect(buildMonthlyPromotionDraft(2026, 2).end_date).toBe('2026-02-28');
    expect(buildMonthlyPromotionDraft(2028, 2).end_date).toBe('2028-02-29');
  });

  it('selects every related treatment option', () => {
    const draft = buildMonthlyPromotionDraft(2026, 9);
    expect(draft.related_treatments).toHaveLength(RELATED_TREATMENT_OPTIONS.length);
    expect(draft.related_treatments).toContain('/lifting/ulthera');
    expect(draft.related_treatments).toContain('/laser');
  });

  it('rejects a month outside 1-12', () => {
    expect(() => buildMonthlyPromotionDraft(2026, 0)).toThrow();
    expect(() => buildMonthlyPromotionDraft(2026, 13)).toThrow();
    expect(() => buildMonthlyPromotionDraft(2026, 9.5)).toThrow();
  });
});

describe('getDefaultPromotionMonth', () => {
  it('returns the month after today', () => {
    expect(getDefaultPromotionMonth(new Date(2026, 6, 29))).toEqual({ year: 2026, month: 8 });
  });

  it('rolls December over into the next year', () => {
    expect(getDefaultPromotionMonth(new Date(2026, 11, 5))).toEqual({ year: 2027, month: 1 });
  });
});

describe('parseMonthInputValue', () => {
  it('parses a valid <input type="month"> value', () => {
    expect(parseMonthInputValue('2026-09')).toEqual({ year: 2026, month: 9 });
    expect(parseMonthInputValue('2026-01')).toEqual({ year: 2026, month: 1 });
  });

  it('returns null for empty or malformed values', () => {
    expect(parseMonthInputValue('')).toBeNull();
    expect(parseMonthInputValue('2026-13')).toBeNull();
    expect(parseMonthInputValue('2026-00')).toBeNull();
    expect(parseMonthInputValue('garbage')).toBeNull();
    expect(parseMonthInputValue('2026-9')).toBeNull();
  });
});

describe('toMonthInputValue', () => {
  it('formats a year/month pair for <input type="month">', () => {
    expect(toMonthInputValue(2026, 9)).toBe('2026-09');
    expect(toMonthInputValue(2026, 12)).toBe('2026-12');
  });

  it('round-trips with parseMonthInputValue', () => {
    expect(parseMonthInputValue(toMonthInputValue(2027, 1))).toEqual({ year: 2027, month: 1 });
  });
});
