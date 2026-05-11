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
    // PR #2: upgraded from 'zh-CN' to 'zh-Hans-CN' for explicit script disambiguation
    // now that 'zh-Hant-TW' is introduced as a separate locale.
    hreflang: 'zh-Hans-CN',
  },
  'zh-TW': {
    code: 'zh-TW',
    label: 'TWN',
    name: '繁體中文',
    flag: '🇹🇼',
    htmlLang: 'zh-TW',
    ogLocale: 'zh_TW',
    hreflang: 'zh-Hant-TW',
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
  vi: {
    code: 'vi',
    label: 'VIE',
    name: 'Tiếng Việt',
    flag: '🇻🇳',
    htmlLang: 'vi',
    ogLocale: 'vi_VN',
    hreflang: 'vi-VN',
  },
  th: {
    code: 'th',
    label: 'THA',
    name: 'ไทย',
    flag: '🇹🇭',
    htmlLang: 'th',
    ogLocale: 'th_TH',
    hreflang: 'th-TH',
    fontVariant: 'thai',
  },
  ru: {
    code: 'ru',
    label: 'RUS',
    name: 'Русский',
    flag: '🇷🇺',
    htmlLang: 'ru',
    ogLocale: 'ru_RU',
    hreflang: 'ru-RU',
  },
  fr: {
    code: 'fr',
    label: 'FRA',
    name: 'Français',
    flag: '🇫🇷',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    hreflang: 'fr-FR',
  },
  mn: {
    code: 'mn',
    label: 'MNG',
    name: 'Монгол',
    flag: '🇲🇳',
    htmlLang: 'mn',
    ogLocale: 'mn_MN',
    hreflang: 'mn-MN',
  },
  ar: {
    code: 'ar',
    label: 'ARA',
    name: 'العربية',
    flag: '🇸🇦',
    htmlLang: 'ar',
    ogLocale: 'ar_SA',
    hreflang: 'ar',
    dir: 'rtl',
  },
};

/**
 * Display order for locale switcher dropdowns.
 * Ordered by 2024 medical-tourism market priority for LIV:
 *   ko (domestic) → zh (mainland) → zh-TW (Taiwan, +550% YoY) →
 *   ja (largest visitor) → en → fr (European medical tourism) →
 *   vi → th → mn (anti-aging high spenders) → ru → ar (RTL last).
 */
export const LOCALE_ORDER: Locale[] = [
  'ko', 'zh', 'zh-TW', 'ja', 'en',
  'fr',
  'vi', 'th',
  'mn',
  'ru',
  'ar',
];
