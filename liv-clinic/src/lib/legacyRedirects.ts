import { LOCALES, type Locale } from '@/i18n/routing';

/** 구 워드프레스(WPML) `?lang=` 값 → 현재 로케일. 대소문자 무시. */
const LEGACY_LANG_TO_LOCALE: Record<string, Locale> = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
  zh: 'zh',
  'zh-cn': 'zh',
  'zh-hans': 'zh',
  'zh-tw': 'zh-TW',
  'zh-hant': 'zh-TW',
};

const LOCALE_PREFIX_RE = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`);

/**
 * `/?lang=en` 같은 옛 URL이 들어오면 이동할 경로를 돌려준다.
 * 이미 로케일 접두사가 붙은 경로(`/ko/about?lang=ja` — 예전 307이 만든 형태)는 접두사를 바꾼다.
 * 지원하지 않는 값이면 null(일반 라우팅에 맡긴다).
 */
export function legacyLangRedirectPath(pathname: string, lang: string | null): string | null {
  if (!lang) return null;
  const locale = LEGACY_LANG_TO_LOCALE[lang.toLowerCase()];
  if (!locale) return null;
  const rest = pathname.replace(LOCALE_PREFIX_RE, '').replace(/\/+$/, '');
  return `/${locale}${rest}`;
}
