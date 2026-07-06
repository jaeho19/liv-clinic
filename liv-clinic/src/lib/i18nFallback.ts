/**
 * Localized content fallback helper for legacy Supabase columns
 * that only have ko/en/ja/zh fields (events, popups, before-after, etc.)
 *
 * Locale 정책 (i18n-glossary.md 합의):
 *   - zh-TW: zh (간체) → en → ko
 *   - vi/th/ru: en → ko
 *   - fr/mn/ar (i18n-fr-mn-ar PDCA): en → ko (의료관광 환자 영어 가독성 우선)
 */
import type { Locale } from '@/i18n/routing';

type LegacyLocaleKey = 'ko' | 'en' | 'ja' | 'zh';
type LegacyContent = Partial<Record<LegacyLocaleKey, string | null | undefined>>;

const FALLBACK_CHAIN: Record<Locale, readonly LegacyLocaleKey[]> = {
  ko: ['ko'],
  en: ['en', 'ko'],
  ja: ['ja', 'en', 'ko'],
  zh: ['zh', 'en', 'ko'],
  'zh-TW': ['zh', 'en', 'ko'],
  vi: ['en', 'ko'],
  th: ['en', 'ko'],
  ru: ['en', 'ko'],
  fr: ['en', 'ko'],
  mn: ['en', 'ko'],
  ar: ['en', 'ko'],
};

/**
 * Pick the best available localized string from a legacy ko/en/ja/zh content object.
 * Returns '' if no fallback is available (component should treat as empty).
 */
export function pickLocalized(content: LegacyContent | null | undefined, locale: Locale): string {
  if (!content) return '';
  const chain = FALLBACK_CHAIN[locale] ?? ['ko'];
  for (const key of chain) {
    const value = content[key];
    if (value) return value;
  }
  return '';
}

/**
 * 언어별 이미지 컨테이너 타입.
 * 단일 이미지(LocalizedImage)는 LegacyContent와 구조적으로 호환되므로
 * 기존 pickLocalized()를 그대로 재사용한다. 배열은 pickLocalizedImages() 사용.
 */
export type LocalizedImage = Partial<Record<'ko' | 'en' | 'ja' | 'zh', string | null>>;
export type LocalizedImageList = Partial<Record<'ko' | 'en' | 'ja' | 'zh', string[] | null>>;

/** 언어별 이미지 배열에서 현재 로케일에 맞는 배열 선택 (빈 배열은 미등록으로 간주, 폴백 체인 진행, 없으면 []) */
export function pickLocalizedImages(
  content: LocalizedImageList | null | undefined,
  locale: Locale
): string[] {
  if (!content) return [];
  const chain = FALLBACK_CHAIN[locale] ?? ['ko'];
  for (const key of chain) {
    const value = content[key];
    if (value && value.length > 0) return value;
  }
  return [];
}
