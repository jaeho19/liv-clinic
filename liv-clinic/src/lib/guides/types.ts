/**
 * 가이드·칼럼 타입. 생성 모듈(guides.generated.ts)을 import하지 않으므로
 * 클라이언트 컴포넌트(Footer 등)에서도 안전하게 import할 수 있다.
 *
 * 언어 목록이 둘이다 — 뜻이 다르니 섞어 쓰지 말 것:
 *   GUIDE_LOCALES   외국인 가이드를 내는 언어. "외국인 대상 언어" 판정에도 쓴다
 *                   (InternationalNotice·가격 환산 줄·pricingForeign 등).
 *   ARTICLE_LOCALES 글이 있을 수 있는 언어 전체 = 한국어 칼럼 + 외국인 가이드.
 *                   라우트·색인·사이트맵·허브는 이 목록을 쓴다.
 */
export const GUIDE_LOCALES = ['en', 'ja', 'zh', 'zh-TW'] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

export function isGuideLocale(locale: string): locale is GuideLocale {
  return (GUIDE_LOCALES as readonly string[]).includes(locale);
}

/** 한국어 칼럼(국내 환자용). 같은 /guides 경로·같은 원고 형식을 쓰고 화면 이름만 「칼럼」이다. */
export const COLUMN_LOCALE = 'ko';
export const ARTICLE_LOCALES = [COLUMN_LOCALE, ...GUIDE_LOCALES] as const;
export type ArticleLocale = (typeof ARTICLE_LOCALES)[number];

export function isArticleLocale(locale: string): locale is ArticleLocale {
  return (ARTICLE_LOCALES as readonly string[]).includes(locale);
}

/**
 * 번역이 빠진 외국어판. 외국어판이 하나라도 있는 slug(외국인 가이드)에만 해당한다 —
 * 한국어 칼럼만 있는 slug는 번역 대상이 아니고, 한국어판은 외국인 가이드의 필수 번역이 아니다.
 */
export function missingGuideLocales(present: readonly string[]): GuideLocale[] {
  if (!present.some(isGuideLocale)) return [];
  return GUIDE_LOCALES.filter((l) => !present.includes(l));
}

export type GuideStatus = 'draft' | 'published';
export type GuideCategory = 'price' | 'booking' | 'comparison' | 'aftercare' | 'treatment';
/** 저자 표기. 기본 clinic. dr-kim은 원장이 실제 검수한 편에만 켠다. */
export type GuideReviewer = 'clinic' | 'dr-kim';

export type GuideBlock =
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'note'; text: string }
  /** 본문 그림. 파일은 public/images/guides/ 의 1600×900 (images.ts) */
  | { type: 'image'; src: string; alt: string; caption?: string };

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideFrontmatter {
  title: string;
  description: string;
  keywords: string[];
  category: GuideCategory;
  status: GuideStatus;
  /** YYYY-MM-DD — 화면의 "업데이트"와 Article.dateModified */
  updated: string;
  reviewer: GuideReviewer;
  /** 관련 시술 경로(로케일 접두 없음). 예: '/lifting/ulthera' */
  treatment?: string;
  /** 대표 사진 경로(/images/guides/…, 1600×900). 글 머리·목록 카드·공유 이미지에 쓴다. */
  cover?: string;
  /** 대표 사진 설명(대체 글). cover가 있으면 필수. */
  coverAlt?: string;
}

export interface GuideDoc extends GuideFrontmatter {
  locale: ArticleLocale;
  slug: string;
  blocks: GuideBlock[];
  faq: GuideFaq[];
  readingMinutes: number;
  /** 본문에 남은 [검수 필요 …] 표식 수. published면 0이어야 한다. */
  reviewMarkers: number;
}

export interface GuideIndexEntry {
  locale: ArticleLocale;
  slug: string;
  status: GuideStatus;
  title: string;
  category: GuideCategory;
}
