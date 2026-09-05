import { describe, it, expect } from 'vitest';
import { BASE_URL, buildHreflangMap, defaultOgImage, generatePageMetadata, getSiteName } from '@/lib/seo';
import { LOCALES } from '@/i18n/routing';

describe('buildHreflangMap', () => {
  it('lists every locale with BCP-47 codes and x-default → /en', () => {
    const map = buildHreflangMap('/events/first-visit');
    expect(Object.keys(map)).toHaveLength(LOCALES.length + 1);
    expect(map['ko-KR']).toBe(`${BASE_URL}/ko/events/first-visit`);
    expect(map['zh-Hans-CN']).toBe(`${BASE_URL}/zh/events/first-visit`);
    expect(map['zh-Hant-TW']).toBe(`${BASE_URL}/zh-TW/events/first-visit`);
    expect(map['x-default']).toBe(`${BASE_URL}/en/events/first-visit`);
  });

  it('uses the bare locale home for an empty path', () => {
    const map = buildHreflangMap('');
    expect(map['en-US']).toBe(`${BASE_URL}/en`);
    expect(map['ja-JP']).toBe(`${BASE_URL}/ja`);
  });
});

describe('getSiteName', () => {
  it('keeps the Korean legal name for ko', () => {
    expect(getSiteName('ko')).toBe('리브성형외과');
  });

  it('uses the unified Japanese clinic name', () => {
    expect(getSiteName('ja')).toBe('LIV美容クリニック');
  });

  it('falls back to the English name for unknown locales', () => {
    expect(getSiteName('xx')).toBe('LIV Plastic Surgery');
  });
});

describe('buildHreflangMap with a locale subset (guides)', () => {
  it('lists only the given locales and points x-default at en', () => {
    const map = buildHreflangMap('/guides/ultherapy-cost-seoul', ['en', 'ja', 'zh', 'zh-TW']);
    expect(Object.keys(map).sort()).toEqual(['en-US', 'ja-JP', 'x-default', 'zh-Hans-CN', 'zh-Hant-TW'].sort());
    expect(map['x-default']).toBe(`${BASE_URL}/en/guides/ultherapy-cost-seoul`);
  });

  it('falls back to the first locale for x-default when en is absent', () => {
    const map = buildHreflangMap('/guides/x', ['ja']);
    expect(map['x-default']).toBe(`${BASE_URL}/ja/guides/x`);
  });
});

describe('defaultOgImage', () => {
  it('uses the per-language 1200×630 image for guide locales', () => {
    expect(defaultOgImage('ja', 'x')).toMatchObject({ url: `${BASE_URL}/images/og/og-ja.jpg`, width: 1200, height: 630 });
    expect(defaultOgImage('zh-TW', 'x').url).toBe(`${BASE_URL}/images/og/og-zh-TW.jpg`);
  });

  it('keeps the shared og-image.jpg for other locales', () => {
    expect(defaultOgImage('ko', 'x')).toMatchObject({ url: `${BASE_URL}/images/og-image.jpg`, width: 1200, height: 800 });
    expect(defaultOgImage('vi', 'x').url).toBe(`${BASE_URL}/images/og-image.jpg`);
  });
});

describe('generatePageMetadata guide options', () => {
  it('threads alternateLocales and ogType through', () => {
    const meta = generatePageMetadata({
      locale: 'ja',
      title: 't',
      description: 'd',
      path: '/guides/x',
      alternateLocales: ['en', 'ja'],
      ogType: 'article',
    });
    expect(Object.keys(meta.alternates!.languages as Record<string, string>)).toHaveLength(3);
    expect((meta.openGraph as { type?: string }).type).toBe('article');
  });

  it('defaults to all locales and the website type', () => {
    const meta = generatePageMetadata({ locale: 'en', path: '/about' });
    expect(Object.keys(meta.alternates!.languages as Record<string, string>)).toHaveLength(LOCALES.length + 1);
    expect((meta.openGraph as { type?: string }).type).toBe('website');
  });
});
