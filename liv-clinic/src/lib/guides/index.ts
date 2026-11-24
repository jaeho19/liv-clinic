/** 서버 전용 — 생성물 전체를 import한다. 클라이언트 컴포넌트에서는 publicIndex.ts를 쓸 것. */
import { GUIDES } from './guides.generated';
import { ARTICLE_LOCALES, type ArticleLocale, type GuideDoc } from './types';

/**
 * 원고 묶음에 대한 조회 함수들. 글은 그 언어 폴더에 원고가 있을 때만 존재하므로
 * 언어를 따로 걸러낼 필요가 없다(원고가 없는 언어는 빈 결과).
 */
export function createGuideStore(docs: readonly GuideDoc[]) {
  const published = docs.filter((g) => g.status === 'published');
  return {
    listGuides(locale: string, opts?: { includeDrafts?: boolean }): GuideDoc[] {
      return (opts?.includeDrafts ? docs : published).filter((g) => g.locale === locale);
    },
    getGuide(locale: string, slug: string): GuideDoc | null {
      return docs.find((g) => g.locale === locale && g.slug === slug) ?? null;
    },
    /** 이 slug가 게시된 로케일 — hreflang·사이트맵용. 초안은 포함하지 않는다. */
    guideLocalesFor(slug: string): ArticleLocale[] {
      return published.filter((g) => g.slug === slug).map((g) => g.locale);
    },
    /** generateStaticParams용 — 초안도 정적 생성한다(직접 URL 검수용). */
    allGuideParams(): { locale: ArticleLocale; slug: string }[] {
      return docs.map((g) => ({ locale: g.locale, slug: g.slug }));
    },
    publishedGuideSlugs(): string[] {
      return [...new Set(published.map((g) => g.slug))];
    },
    /** 게시본이 1편 이상 있는 언어 — 허브를 색인·사이트맵에 올릴 언어. */
    hubLocales(): ArticleLocale[] {
      return ARTICLE_LOCALES.filter((l) => published.some((g) => g.locale === l));
    },
  };
}

export type GuideStore = ReturnType<typeof createGuideStore>;

export const guideStore = createGuideStore(GUIDES);
export const { listGuides, getGuide, guideLocalesFor, allGuideParams, publishedGuideSlugs, hubLocales } = guideStore;
