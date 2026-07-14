/**
 * Shared types for the media & news locale overrides.
 *
 * Mirrors `src/lib/treatmentsI18n.ts`: the base data module stays Korean-only
 * and each locale file supplies per-item text overrides keyed by item id.
 */

/** 항목 단위 텍스트 오버라이드 — 지정하지 않은 필드는 한국어 원본(mediaNewsData.ts)으로 폴백 */
export interface MediaNewsL10n {
  badge?: string;
  title?: string;
  description?: string;
  /** 매체명. 외부 기사만 해당(featuredMediaNews 카드에는 없음) */
  source?: string;
  /** 내부 소식 모달 본문(문단 배열). 원본과 문단 수를 맞춘다 */
  body?: readonly string[];
}

/** mediaNewsData.id / featuredMediaNews.id → 오버라이드 */
export type MediaNewsLocaleMap = Record<string, MediaNewsL10n>;
