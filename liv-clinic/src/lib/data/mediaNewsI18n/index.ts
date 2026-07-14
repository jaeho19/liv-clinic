/**
 * Locale overrides for Media & News article text.
 *
 * `mediaNewsData.ts` holds the Korean base (SSOT). Each locale file here supplies
 * per-item overrides for the reader-facing fields (badge, title, description,
 * source, body), so every locale renders the article text in its own language
 * while /ko keeps rendering the base data untouched.
 *
 * Pattern follows `src/lib/treatmentsI18n.ts` (getLocalizedTreatment):
 *   base (ko) + locale override → merged item. Missing keys fall back to Korean.
 *
 * Fallback policy matches `src/lib/i18nFallback.ts`:
 *   zh-TW → zh → en → ko · ja/zh → en → ko · vi/th/ru/fr/mn/ar → en → ko
 */
import type { Locale } from '@/i18n/routing';
import type { MediaNewsItem, FeaturedMediaCard } from '../mediaNewsData';
import type { MediaNewsL10n, MediaNewsLocaleMap } from './types';
import { EN } from './en';
import { JA } from './ja';
import { ZH } from './zh';
import { ZH_TW } from './zh-TW';
import { VI } from './vi';
import { TH } from './th';
import { RU } from './ru';
import { FR } from './fr';
import { MN } from './mn';
import { AR } from './ar';

const MAPS: Partial<Record<Locale, MediaNewsLocaleMap>> = {
  en: EN,
  ja: JA,
  zh: ZH,
  'zh-TW': ZH_TW,
  vi: VI,
  th: TH,
  ru: RU,
  fr: FR,
  mn: MN,
  ar: AR,
};

/** 로케일별 병합 순서(구체적인 로케일이 뒤에 와서 앞을 덮는다). ko는 오버라이드 없음 */
const FALLBACK_CHAIN: Record<Locale, readonly Locale[]> = {
  ko: [],
  en: ['en'],
  ja: ['en', 'ja'],
  zh: ['en', 'zh'],
  'zh-TW': ['en', 'zh', 'zh-TW'],
  vi: ['en', 'vi'],
  th: ['en', 'th'],
  ru: ['en', 'ru'],
  fr: ['en', 'fr'],
  mn: ['en', 'mn'],
  ar: ['en', 'ar'],
};

function resolveOverride(id: string, locale: Locale): MediaNewsL10n {
  const chain = FALLBACK_CHAIN[locale] ?? [];
  return chain.reduce<MediaNewsL10n>((acc, key) => ({ ...acc, ...MAPS[key]?.[id] }), {});
}

/**
 * Merge the locale override for an item over its Korean base.
 * `ko` returns the base object untouched (identity) — /ko is byte-for-byte unchanged.
 */
export function getLocalizedMediaItem<T extends MediaNewsItem | FeaturedMediaCard>(
  item: T,
  locale: Locale,
): T {
  if (locale === 'ko') return item;

  const override = resolveOverride(item.id, locale);
  const hasSource = 'source' in item && Boolean(item.source);
  const hasBody = 'body' in item && Boolean(item.body?.length);

  return {
    ...item,
    badge: override.badge ?? item.badge,
    title: override.title ?? item.title,
    description: override.description ?? item.description,
    ...(hasSource && override.source ? { source: override.source } : {}),
    ...(hasBody && override.body ? { body: [...override.body] } : {}),
  } as T;
}

export type { MediaNewsL10n, MediaNewsLocaleMap } from './types';
