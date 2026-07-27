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
 * pickLocalized의 엄격(strict) 버전 — ko 폴백을 하지 않는다.
 *
 *   - locale === 'ko'  : ko 값 그대로 (없으면 null)
 *   - locale !== 'ko'  : 폴백 체인에서 'ko'를 건너뛰고 탐색, 하나도 없으면 null
 *
 * 예) ja → ja → en (ko 제외), vi → en (ko 제외)
 *
 * 용도: 한국어 원문/아트워크가 외국어 화면에 그대로 노출되면 안 되는 표면에서
 * "현지화된 자산이 있을 때만 노출"을 게이팅한다. 기존 pickLocalized의 동작은
 * 그대로 두고(대부분의 표면은 ko 폴백이라도 보여주는 편이 낫다) 이 함수는 추가분이다.
 */
export function pickLocalizedStrict(
  content: LegacyContent | null | undefined,
  locale: Locale
): string | null {
  if (!content) return null;
  const chain = FALLBACK_CHAIN[locale] ?? ['ko'];
  for (const key of chain) {
    if (locale !== 'ko' && key === 'ko') continue;
    const value = content[key];
    if (value) return value;
  }
  return null;
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
