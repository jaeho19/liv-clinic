import { describe, it, expect } from 'vitest';
import { PRICING_FOREIGN } from '@/lib/pricingForeign';

const SIMPLIFIED =
  /[于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务预约线网针国际须区号层还问银韩现购买质专调结构题给开设础检备识别长变额颈脸颊选择剂达显确满师内两个卖财]/;

describe('PRICING_FOREIGN', () => {
  it('has 4 locales, 3–5 items each, VAT wording consistent with pricingGuide.notes.vat', () => {
    for (const locale of ['en', 'ja', 'zh', 'zh-TW'] as const) {
      const p = PRICING_FOREIGN[locale];
      expect(p.items.length).toBeGreaterThanOrEqual(3);
      expect(p.items.length).toBeLessThanOrEqual(5);
      expect(p.items.join(' ')).toMatch(/VAT/);
      const all = [p.heading, ...p.items, p.metaSuffix, p.ctaInternational, p.ctaGuides].join(' ');
      expect(all).not.toMatch(/[가-힯]/);
      expect(all).not.toMatch(/유치기관|discount|割引|折扣|优惠|優惠/i);
      expect(p.metaSuffix.length).toBeLessThan(120);
      if (locale === 'zh-TW') expect(all).not.toMatch(SIMPLIFIED);
    }
  });
});
