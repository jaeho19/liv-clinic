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

/**
 * 언어 전환 시 목적지 경로(로케일 접두 없음). 가이드는 일부 언어에만 있으므로
 * 없는 언어로 바꾸면 404 대신 그 언어의 국제환자 페이지로, 같은 가이드가 그 언어에 미게시면 허브로 보낸다.
 * 가이드 밖 경로는 그대로 돌려준다.
 */
export function localeSwitchPath(pathname: string, targetLocale: string): string {
  if (!pathname.startsWith('/guides')) return pathname;
  if (!isGuideLocale(targetLocale)) return '/international';
  const slug = pathname.split('/')[2];
  if (!slug) return '/guides';
  return isGuidePublished(targetLocale, slug) ? pathname : '/guides';
}
