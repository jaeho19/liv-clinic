import { TREATMENTS } from '@/lib/constants';
import { guideLocalesFor, listGuides, publishedGuideSlugs } from '@/lib/guides';
import { GUIDE_LOCALES } from '@/lib/guides/types';

export type SitemapPath = {
  /** 로케일 접두사 뒤 경로. 홈은 ''. */
  path: string;
  priority: number;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
  /** 지정하면 해당 로케일에만 존재하는 페이지(다른 로케일은 리다이렉트된다). */
  locales?: readonly string[];
};

const STATIC_PATHS: SitemapPath[] = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about/staff', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about/equipment', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about/location', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/international', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/lifting', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/antiaging', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/laser', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/medical', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/signature', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/before-after', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/reviews', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/media', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/events', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/events/first-visit', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/antiaging/hilowave', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/antiaging/hilowave-v2', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/inquiry', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/consult-prep', priority: 0.5, changeFrequency: 'monthly' },
  // /wechat은 zh 전용 — 다른 로케일은 미들웨어가 /zh/wechat으로 보낸다
  { path: '/wechat', priority: 0.5, changeFrequency: 'yearly', locales: ['zh'] },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

// 레이저 카테고리 페이지 (다국어 검색 최적화)
const LASER_CATEGORIES = ['pigmentation', 'vascular', 'skintone', 'hair-removal', 'tattoo'];

/** 사이트맵에 넣을 모든 경로(정적 + 시술 상세 + 레이저 카테고리). 이벤트 상세는 DB에서 따로 붙인다. */
export function buildSitemapPaths(): SitemapPath[] {
  const treatments: SitemapPath[] = [
    ...Object.keys(TREATMENTS.lifting).map((id) => `/lifting/${id}`),
    ...Object.keys(TREATMENTS.antiaging).map((id) => `/antiaging/${id}`),
    ...LASER_CATEGORIES.map((id) => `/laser/${id}`),
  ].map((path) => ({ path, priority: 0.8, changeFrequency: 'monthly' as const }));

  // 가이드(P1-1): 게시본이 있는 언어에만. 허브는 게시 가이드가 1편 이상인 언어만.
  // 초안(draft)은 noindex라 사이트맵에 넣지 않는다.
  const hubLocales = GUIDE_LOCALES.filter((l) => listGuides(l).length > 0);
  const guides: SitemapPath[] = [
    ...(hubLocales.length > 0
      ? [{ path: '/guides', priority: 0.8, changeFrequency: 'weekly' as const, locales: hubLocales }]
      : []),
    ...publishedGuideSlugs().map((slug) => ({
      path: `/guides/${slug}`,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
      locales: guideLocalesFor(slug),
    })),
  ];

  // 정적 항목이 우선 — 같은 경로가 TREATMENTS에도 있으면 뒤 항목을 버린다
  const seen = new Set<string>();
  return [...STATIC_PATHS, ...treatments, ...guides].filter((p) => {
    if (seen.has(p.path)) return false;
    seen.add(p.path);
    return true;
  });
}
