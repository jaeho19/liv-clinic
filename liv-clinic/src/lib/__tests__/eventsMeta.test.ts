import { describe, it, expect } from 'vitest';
import { LOCALES } from '@/i18n/routing';
import {
  EVENTS_META,
  EVENT_DESCRIPTION_MIN,
  buildEventMetaDescription,
  decodeEventSlug,
  eventsMetaFor,
} from '@/lib/eventsMeta';

describe('EVENTS_META', () => {
  it('covers every locale with a title of at least 15 characters (Bing title-too-short)', () => {
    for (const locale of LOCALES) {
      expect(EVENTS_META[locale].title.length, locale).toBeGreaterThanOrEqual(15);
      expect(EVENTS_META[locale].description.length, locale).toBeGreaterThanOrEqual(EVENT_DESCRIPTION_MIN);
    }
  });

  it('falls back to English for an unknown locale, never Korean', () => {
    expect(eventsMetaFor('xx')).toBe(EVENTS_META.en);
  });
});

describe('buildEventMetaDescription', () => {
  const generic = (l: string) => eventsMetaFor(l).description;

  it('keeps a long localized description as is', () => {
    const long = 'A'.repeat(EVENT_DESCRIPTION_MIN);
    expect(buildEventMetaDescription('en', { ko: '한국어', en: long })).toBe(long);
  });

  it('pads a short description with the generic events description (2026-08-promotion was 13–36 chars)', () => {
    const out = buildEventMetaDescription('ko', { ko: '리브성형외과 8월 프로모션' });
    expect(out.startsWith('리브성형외과 8월 프로모션. ')).toBe(true);
    expect(out.endsWith(generic('ko'))).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(EVENT_DESCRIPTION_MIN);
  });

  it('uses CJK punctuation when joining for ja/zh', () => {
    expect(buildEventMetaDescription('zh', { zh: 'LIV整形外科8月优惠活动' })).toBe(
      `LIV整形外科8月优惠活动。${generic('zh')}`,
    );
    expect(buildEventMetaDescription('ja', { ja: '8月プロモーション。' })).toBe(
      `8月プロモーション。 ${generic('ja')}`,
    );
  });

  it('never emits Korean on a non-ko page when only the Korean column exists (guerrilla-event)', () => {
    const koOnly = { ko: '원장님이 직접 설계한 보톡스&필러 1년 정기 관리 프로그램!' };
    for (const locale of LOCALES.filter((l) => l !== 'ko')) {
      expect(buildEventMetaDescription(locale, koOnly), locale).toBe(generic(locale));
    }
  });

  it('follows the existing fallback chain for locales without their own column (zh-TW → zh, vi → en)', () => {
    const content = { ko: '케이', en: 'English text about the event that is long enough to stand on its own.', zh: '中文' };
    expect(buildEventMetaDescription('vi', content)).toBe(content.en);
    expect(buildEventMetaDescription('zh-TW', content)).toBe(`中文。${generic('zh-TW')}`);
  });

  it('returns the generic description for empty content', () => {
    expect(buildEventMetaDescription('en', null)).toBe(generic('en'));
    expect(buildEventMetaDescription('ko', { ko: '   ' })).toBe(generic('ko'));
  });
});

describe('decodeEventSlug', () => {
  it('decodes percent-encoded Korean slugs and leaves plain or malformed ones alone', () => {
    expect(decodeEventSlug('6%EC%9B%94-%ED%94%84%EB%A1%9C%EB%AA%A8%EC%85%98')).toBe('6월-프로모션');
    expect(decodeEventSlug('6월-프로모션')).toBe('6월-프로모션');
    expect(decodeEventSlug('guerrilla-event')).toBe('guerrilla-event');
    expect(decodeEventSlug('%E0%A4%A')).toBe('%E0%A4%A');
  });
});
