import { describe, it, expect } from 'vitest';
import { BASE_URL, buildHreflangMap, getSiteName } from '@/lib/seo';
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
