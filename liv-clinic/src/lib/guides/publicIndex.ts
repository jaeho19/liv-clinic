/** 클라이언트 안전 — 제목·상태만 담긴 작은 색인. 본문은 포함하지 않는다. */
import { GUIDE_INDEX } from './guides.index.generated';
import { COLUMN_LOCALE, type GuideIndexEntry } from './types';

type Index = readonly GuideIndexEntry[];

export function isGuidePublished(locale: string, slug: string, index: Index = GUIDE_INDEX): boolean {
  return index.some((g) => g.locale === locale && g.slug === slug && g.status === 'published');
}

export function publishedGuideCount(locale: string, index: Index = GUIDE_INDEX): number {
  return index.filter((g) => g.locale === locale && g.status === 'published').length;
}

/**
 * 상단 메뉴 「의료정보」 아래에 「칼럼」을 낼지 — 한국어이고 게시된 칼럼이 1편 이상일 때만.
 * (외국인 가이드는 푸터와 국제환자 페이지에서 잇는다.)
 */
export function hasKoreanColumns(locale: string, index: Index = GUIDE_INDEX): boolean {
  return locale === COLUMN_LOCALE && publishedGuideCount(locale, index) > 0;
}

/**
 * 언어 전환 시 목적지 경로(로케일 접두 없음). 글은 일부 언어에만 있으므로
 * 그 언어에 게시본이 하나도 없으면 404·빈 허브 대신 국제환자 페이지로,
 * 같은 글이 그 언어에 없으면 그 언어의 허브로 보낸다. 가이드 밖 경로는 그대로 돌려준다.
 */
export function localeSwitchPath(pathname: string, targetLocale: string, index: Index = GUIDE_INDEX): string {
  if (!pathname.startsWith('/guides')) return pathname;
  if (publishedGuideCount(targetLocale, index) === 0) return '/international';
  const slug = pathname.split('/')[2];
  if (!slug) return '/guides';
  return isGuidePublished(targetLocale, slug, index) ? pathname : '/guides';
}
