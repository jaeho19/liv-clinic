/**
 * Locale metadata - Single Source of Truth for per-locale UI/SEO attributes.
 *
 * All consumers (LanguageSwitcher, MobileMenu, seo.ts, sitemap.ts, layout.tsx)
 * read locale presentation data from here so adding a new locale is a single
 * edit (LOCALES in routing.ts + one entry below).
 */

import type { Locale } from './routing';

export interface LocaleMeta {
  code: Locale;
  /** LanguageSwitcher right-side abbreviation (KOR, CHN, ENG…) */
  label: string;
  /** Full native name displayed in dropdown items */
  name: string;
  /** Flag emoji shown next to the name */
  flag: string;
  /** <html lang="..."> attribute value (BCP 47) */
  htmlLang: string;
  /** OpenGraph locale tag (ko_KR, zh_CN, …) */
  ogLocale: string;
  /** hreflang attribute value for SEO alternates */
  hreflang: string;
  /** Optional non-Latin font variant (Phase 2 hook for Thai etc.) */
  fontVariant?: 'thai';
  /** Optional RTL marker (Phase 3 hook for Arabic) */
  dir?: 'rtl';
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  ko: {
    code: 'ko',
    label: 'KOR',
    name: '한국어',
    flag: '🇰🇷',
    htmlLang: 'ko',
    ogLocale: 'ko_KR',
    hreflang: 'ko-KR',
  },
  zh: {
    code: 'zh',
    label: 'CHN',
    name: '中文',
    flag: '🇨🇳',
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    // PR #1: keep legacy 'zh-CN' to ensure zero SEO regression.
    // PR #2 may upgrade to 'zh-Hans-CN' once 'zh-Hant-TW' is introduced.
    hreflang: 'zh-CN',
  },
  ja: {
    code: 'ja',
    label: 'JPN',
    name: '日本語',
    flag: '🇯🇵',
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    hreflang: 'ja-JP',
  },
  en: {
    code: 'en',
    label: 'ENG',
    name: 'English',
    flag: '🇺🇸',
    htmlLang: 'en',
    ogLocale: 'en_US',
    hreflang: 'en-US',
  },
};

/**
 * Display order for locale switcher dropdowns.
 * Ordered by current LIV market priority: ko → zh → ja → en.
 * Phase 2 will insert zh-TW after zh, vi/th/ru after en.
 */
export const LOCALE_ORDER: Locale[] = ['ko', 'zh', 'ja', 'en'];
