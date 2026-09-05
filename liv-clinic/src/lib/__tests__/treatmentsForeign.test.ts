import { describe, it, expect } from 'vitest';
import {
  TREATMENT_FOREIGN_IDS,
  FOREIGN_COMMON,
  getTreatmentForeignInfo,
  getTreatmentForeignFaqs,
} from '@/lib/treatmentsForeign';

const LOCALES = ['en', 'ja', 'zh', 'zh-TW'] as const;
const HANGUL = /[가-힯]/;
// P0 zh-tw-international-fix.py의 간체 전용 글자 + P1에서 추가 발견한 글자
const SIMPLIFIED =
  /[于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务预约线网针国际须区号层还问银韩现购买质专调结构题给开设础检备识别长变额颈脸颊选择剂达显确满师内两个卖财]/;

describe('treatmentsForeign', () => {
  it('covers all 17 treatment pages in all 4 locales without Korean text', () => {
    expect(TREATMENT_FOREIGN_IDS).toHaveLength(17);
    for (const id of TREATMENT_FOREIGN_IDS) {
      for (const locale of LOCALES) {
        const info = getTreatmentForeignInfo(id, locale);
        expect(info, `${id}/${locale}`).not.toBeNull();
        expect(info!.name.length).toBeGreaterThan(1);
        expect(info!.duration.length).toBeGreaterThan(1);
        expect(info!.stay.length).toBeGreaterThan(3);
        expect(info!.faqs).toHaveLength(2);
        const strings = [info!.name, info!.duration, info!.stay, ...info!.faqs.flatMap((f) => [f.q, f.a])];
        for (const s of strings) {
          expect(s, `${id}/${locale}: ${s}`).not.toMatch(HANGUL);
          if (locale === 'zh-TW') expect(s, `${id}/zh-TW: ${s}`).not.toMatch(SIMPLIFIED);
        }
      }
    }
  });

  it('returns null / [] for non-guide locales', () => {
    expect(getTreatmentForeignInfo('ulthera', 'ko')).toBeNull();
    expect(getTreatmentForeignFaqs('ulthera', 'vi')).toEqual([]);
  });

  it('common strings never mention 유치기관 or discounts and carry no Korean', () => {
    for (const locale of LOCALES) {
      const common = FOREIGN_COMMON[locale];
      const all = Object.values(common)
        .map((v) => (typeof v === 'function' ? JSON.stringify(v('X', '60 min', 'same day')) : v))
        .join(' ');
      expect(all).not.toMatch(/유치기관|discount|割引|折扣|优惠|優惠/i);
      expect(all).not.toMatch(HANGUL);
      if (locale === 'zh-TW') expect(all).not.toMatch(SIMPLIFIED);
    }
  });

  it('links a treatment to its guide only through a known slug', () => {
    const slugs = new Set([
      'ultherapy-cost-seoul',
      'book-seoul-clinic-foreigner',
      'ultherapy-vs-thermage-vs-shurink',
      'botox-filler-cost-seoul',
      'tattoo-removal-pico-seoul',
      'downtime-flight-travel-plan',
    ]);
    for (const id of TREATMENT_FOREIGN_IDS) {
      const info = getTreatmentForeignInfo(id, 'en')!;
      if (info.guideSlug) expect(slugs.has(info.guideSlug), `${id} → ${info.guideSlug}`).toBe(true);
    }
  });
});
