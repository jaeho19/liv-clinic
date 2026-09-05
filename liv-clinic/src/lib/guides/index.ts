/** 서버 전용 — 생성물 전체를 import한다. 클라이언트 컴포넌트에서는 publicIndex.ts를 쓸 것. */
import { GUIDES } from './guides.generated';
import { isGuideLocale, type GuideDoc, type GuideLocale } from './types';

export function listGuides(locale: string, opts?: { includeDrafts?: boolean }): GuideDoc[] {
  if (!isGuideLocale(locale)) return [];
  return GUIDES.filter((g) => g.locale === locale && (opts?.includeDrafts || g.status === 'published'));
}

export function getGuide(locale: string, slug: string): GuideDoc | null {
  if (!isGuideLocale(locale)) return null;
  return GUIDES.find((g) => g.locale === locale && g.slug === slug) ?? null;
}

/** 이 slug가 게시된 로케일 — hreflang·사이트맵용. 초안은 포함하지 않는다. */
export function guideLocalesFor(slug: string): GuideLocale[] {
  return GUIDES.filter((g) => g.slug === slug && g.status === 'published').map((g) => g.locale);
}

/** generateStaticParams용 — 초안도 정적 생성한다(직접 URL 검수용). */
export function allGuideParams(): { locale: GuideLocale; slug: string }[] {
  return GUIDES.map((g) => ({ locale: g.locale, slug: g.slug }));
}

export function publishedGuideSlugs(): string[] {
  return [...new Set(GUIDES.filter((g) => g.status === 'published').map((g) => g.slug))];
}
