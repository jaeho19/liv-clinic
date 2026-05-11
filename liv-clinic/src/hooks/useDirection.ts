'use client';

import { useLocale } from 'next-intl';
import { LOCALE_META } from '@/i18n/locales-meta';
import type { Locale } from '@/i18n/routing';

export type Direction = 'ltr' | 'rtl';

/**
 * 현재 locale의 텍스트 방향을 반환한다.
 * LOCALE_META[locale].dir이 정의되어 있으면 그 값, 아니면 'ltr'.
 *
 * 사용 예 (Framer Motion 슬라이드 부호 분기):
 *   const dir = useDirection();
 *   <motion.div animate={{ x: dir === 'rtl' ? -50 : 50 }} />
 */
export function useDirection(): Direction {
  const locale = useLocale() as Locale;
  return LOCALE_META[locale]?.dir ?? 'ltr';
}
