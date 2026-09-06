/**
 * 외국인 가이드(P1-1) 타입. 생성 모듈(guides.generated.ts)을 import하지 않으므로
 * 클라이언트 컴포넌트(Footer 등)에서도 안전하게 import할 수 있다.
 */
export const GUIDE_LOCALES = ['en', 'ja', 'zh', 'zh-TW'] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

export function isGuideLocale(locale: string): locale is GuideLocale {
  return (GUIDE_LOCALES as readonly string[]).includes(locale);
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
  | { type: 'note'; text: string };

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
}

export interface GuideDoc extends GuideFrontmatter {
  locale: GuideLocale;
  slug: string;
  blocks: GuideBlock[];
  faq: GuideFaq[];
  readingMinutes: number;
  /** 본문에 남은 [검수 필요 …] 표식 수. published면 0이어야 한다. */
  reviewMarkers: number;
}

export interface GuideIndexEntry {
  locale: GuideLocale;
  slug: string;
  status: GuideStatus;
  title: string;
  category: GuideCategory;
}
