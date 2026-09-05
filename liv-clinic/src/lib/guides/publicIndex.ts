/** 클라이언트 안전 — 제목·상태만 담긴 작은 색인. 본문은 포함하지 않는다. */
import { GUIDE_INDEX } from './guides.index.generated';
import { isGuideLocale } from './types';

export function isGuidePublished(locale: string, slug: string): boolean {
  return GUIDE_INDEX.some((g) => g.locale === locale && g.slug === slug && g.status === 'published');
}

export function publishedGuideCount(locale: string): number {
  if (!isGuideLocale(locale)) return 0;
  return GUIDE_INDEX.filter((g) => g.locale === locale && g.status === 'published').length;
}
