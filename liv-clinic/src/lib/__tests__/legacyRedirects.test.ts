import { describe, it, expect } from 'vitest';
import { legacyLangRedirectPath } from '@/lib/legacyRedirects';

describe('legacyLangRedirectPath', () => {
  it('maps WordPress ?lang= on the root to the locale home', () => {
    expect(legacyLangRedirectPath('/', 'en')).toBe('/en');
    expect(legacyLangRedirectPath('/', 'ja')).toBe('/ja');
    expect(legacyLangRedirectPath('/', 'zh')).toBe('/zh');
    expect(legacyLangRedirectPath('/', 'zh-tw')).toBe('/zh-TW');
    expect(legacyLangRedirectPath('/', 'EN')).toBe('/en');
  });

  it('replaces an existing locale prefix (the URL our old 307 produced)', () => {
    expect(legacyLangRedirectPath('/ko', 'en')).toBe('/en');
    expect(legacyLangRedirectPath('/ko/about', 'zh-TW')).toBe('/zh-TW/about');
    expect(legacyLangRedirectPath('/ko/about/', 'ja')).toBe('/ja/about');
    expect(legacyLangRedirectPath('/zh-TW/lifting', 'ja')).toBe('/ja/lifting');
  });

  it('keeps a non-locale path and just prefixes it', () => {
    expect(legacyLangRedirectPath('/lifting/ulthera', 'en')).toBe('/en/lifting/ulthera');
  });

  it('ignores unknown or missing lang values', () => {
    expect(legacyLangRedirectPath('/', 'xx')).toBeNull();
    expect(legacyLangRedirectPath('/', null)).toBeNull();
    expect(legacyLangRedirectPath('/', '')).toBeNull();
  });
});
