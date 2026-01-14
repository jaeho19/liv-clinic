import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ko', 'en', 'ja', 'zh'],
  defaultLocale: 'ko',
  localePrefix: 'always', // 모든 언어에 prefix 사용 (/ko, /en, /ja, /zh)
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
