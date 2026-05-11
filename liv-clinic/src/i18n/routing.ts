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
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
