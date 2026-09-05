import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Single Source of Truth for supported locales.
 *
 * Adding a locale: extend this array AND add a matching entry in
 * `./locales-meta.ts`. Type-level consumers derive `Locale` automatically.
 */
export const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'ko',
  localePrefix: 'always', // 모든 언어에 prefix 사용 (/ko, /en, /ja, /zh)
  // hreflang은 generatePageMetadata의 <link rel="alternate"> 태그가 단일 진실 공급원이다.
  // next-intl 기본값(true)은 HTTP Link 헤더에 bare code(ko, zh…)와 x-default→/ 를 덧붙여
  // HTML 태그(ko-KR, zh-Hans-CN…, x-default→/en)와 충돌시키므로 끈다. (2026-09-05 실측)
  alternateLinks: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
