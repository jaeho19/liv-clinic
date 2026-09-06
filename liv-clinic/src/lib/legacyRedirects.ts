import { LOCALES, type Locale } from '@/i18n/routing';

/**
 * 옛 워드프레스 사이트(WPML `?lang=`, kboard 게시판, 팝업 경로)의 URL을 현재 사이트로 보내는 규칙.
 *
 * 미들웨어가 매 요청의 맨 앞에서 `resolveLegacyRequest()`를 부른다. 로케일은
 * `?lang=` 별칭 → URL에 이미 붙은 로케일 접두 → `ko` 순서로 정하고, 쿠키나
 * Accept-Language는 보지 않는다(크롤러에게 결정적인 301을 주기 위해서다. 옛 사이트의
 * 기본 언어는 한국어였다). 2026-09-06 GSC 404 221건 중 `/notice?…&lang=cn` 형태가
 * 168건이었고, `cn/tw/jp/kr/vn`이 매핑되지 않아 직전 쿠키 로케일로 흘러가고 있었다.
 */

/** 구 사이트(WPML)·흔한 표기의 `?lang=` 값 → 현재 로케일. 소문자 비교. */
const LEGACY_LANG_TO_LOCALE: Record<string, Locale> = {
  ko: 'ko',
  kr: 'ko',
  'ko-kr': 'ko',
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  ja: 'ja',
  jp: 'ja',
  'ja-jp': 'ja',
  zh: 'zh',
  cn: 'zh',
  'zh-cn': 'zh',
  'zh-hans': 'zh',
  'zh-tw': 'zh-TW',
  tw: 'zh-TW',
  'zh-hant': 'zh-TW',
  'zh-hk': 'zh-TW',
  hk: 'zh-TW',
  vi: 'vi',
  vn: 'vi',
  th: 'th',
  ru: 'ru',
  fr: 'fr',
  mn: 'mn',
  ar: 'ar',
};

export function legacyLangToLocale(lang: string | null | undefined): Locale | null {
  if (!lang) return null;
  return LEGACY_LANG_TO_LOCALE[lang.trim().toLowerCase()] ?? null;
}

const LOCALE_PREFIX_RE = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`);

/** 옛 경로(로케일 접두 제거 후) → 새 경로(로케일 접두 없음). 위에서부터 첫 일치. */
const LEGACY_PATH_RULES: ReadonlyArray<{ test: RegExp; to: string }> = [
  { test: /^\/index\.php$/i, to: '' }, // 옛 진입점 → 로케일 홈 (`?lang=` 존중). Netlify 301은 예비로 남겨 둔다
  { test: /^\/notice(?:\/.*)?$/i, to: '/media' }, // kboard 공지·소식 게시판 (`?pageid=&mod=document&uid=`)
  { test: /^\/review(?:\/.*)?$/i, to: '/reviews' },
  { test: /^\/staff$/i, to: '/about/staff' },
  { test: /^\/equipment$/i, to: '/about/equipment' },
  { test: /^\/location$/i, to: '/about/location' },
  { test: /^\/promotion$/i, to: '/events' }, // 은퇴한 프로모션 페이지
  { test: /^\/layer_popup(?:\/.*)?$/i, to: '/events' }, // 옛 이벤트 팝업
  { test: /^\/(?:덴서티-이벤트|직원픽-이벤트)$/, to: '/events' },
];

/** 더 이상 존재하지 않는 워드프레스 잔재 — 301 대신 410으로 색인에서 지운다. */
const GONE_PATH_RE =
  /^\/(?:archive(?:\/.*)?|feed(?:\/.*)?|sample-page|wp-admin(?:\/.*)?|wp-content(?:\/.*)?|wp-includes(?:\/.*)?|wp-json(?:\/.*)?|wp-[a-z0-9-]+\.php|xmlrpc\.php)$/i;
const GONE_QUERY_KEYS = ['kboard_content_redirect'] as const;

export type LegacyResolution =
  | {
      kind: 'redirect';
      /** 로케일 접두를 포함한 목적지 경로(쿼리 없음) */
      path: string;
      /** strip-lang: `lang`만 빼고 유지 / utm-only: 게시판 파라미터는 버리고 `utm_*`만 유지 */
      query: 'strip-lang' | 'utm-only';
    }
  | { kind: 'gone' };

function normalizePathname(raw: string): string {
  let pathname = raw;
  try {
    pathname = decodeURIComponent(raw);
  } catch {
    // 잘못된 퍼센트 인코딩은 원문 그대로 비교한다
  }
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/**
 * 요청 경로·쿼리를 보고 옛 URL이면 301 목적지 또는 410을 돌려준다. 옛 URL이 아니면 null.
 * `?lang=`과 레거시 경로는 직렬로 처리된다 — `/notice?…&lang=cn` → `/zh/media`.
 */
export function resolveLegacyRequest(
  rawPathname: string,
  search: URLSearchParams | string = '',
): LegacyResolution | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const pathname = normalizePathname(rawPathname);

  const prefixMatch = pathname.match(LOCALE_PREFIX_RE);
  const prefixLocale = prefixMatch ? (prefixMatch[1] as Locale) : null;
  const rest = (prefixMatch ? pathname.slice(prefixMatch[0].length) : pathname) || '/';

  if (GONE_QUERY_KEYS.some((key) => params.has(key)) || GONE_PATH_RE.test(rest)) {
    return { kind: 'gone' };
  }

  const langParam = params.get('lang');
  const rule = LEGACY_PATH_RULES.find((r) => r.test.test(rest));
  if (!rule && langParam === null) return null;

  const locale = legacyLangToLocale(langParam) ?? prefixLocale ?? 'ko';
  const target = rule ? rule.to : rest === '/' ? '' : rest;
  return { kind: 'redirect', path: `/${locale}${target}`, query: rule ? 'utm-only' : 'strip-lang' };
}
