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
