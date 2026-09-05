# 외국인 검색 노출 개선 P0(기반 정비) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **실행 결과 (2026-09-05):** Task 0~11 완료, master `51bd4df` 배포·프로덕션 검증 통과. Task 2 Step 5(GSC 404 목록)와 Task 12의 사용자 작업은 미완 — `docs/04-report/features/foreign-seo-p0.report.md` §5·§6 참조.

**Goal:** `docs/01-plan/features/foreign-seo-improvement.plan.md`의 P0 과제(T1–T13, S1–S4, S6, §2.7 용어)를 코드로 반영해 배포한다. 외국어 페이지의 검색 신호 충돌·옛 URL 손실·페이지 무게·용어 불일치를 없애는 것이 목적이다.

**Architecture:** 기존 구조를 유지한다. hreflang은 `generatePageMetadata`의 HTML 태그를 단일 진실 공급원으로 삼고 next-intl의 Link 헤더를 끈다. 옛 URL은 미들웨어(점 없는 경로)와 Netlify 규칙(점 있는 경로)으로 나눠 301 처리한다. 정적 자산은 파일을 직접 줄이고(이미지 리사이즈, 폰트 woff2 서브셋) 컴포넌트 경로만 바꾼다. 번역 JSON은 혼합 EOL이라 재직렬화하지 않고 값 문자열만 바이트 보존 치환한다.

**Tech Stack:** Next.js 16.1.1(App Router, Turbopack), next-intl 4.6, React 19, Tailwind 4, Supabase(anon 클라이언트), sharp 0.34(이미지), Python fontTools 4.63 + brotli(폰트 서브셋), Netlify(@netlify/plugin-nextjs), Vitest.

## Global Constraints

- 모든 npm 명령은 `D:\dev\LIV_homepage\liv-clinic`에서 실행한다(상위 폴더에는 package.json이 없다).
- 이 PC는 TLS 프록시 뒤에 있다. 빌드는 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, Node fetch·npx는 `NODE_TLS_REJECT_UNAUTHORIZED=0 npm_config_strict_ssl=false`, curl은 `-k`.
- `prebuild`가 `verify:i18n`을 실행한다. 번역 키를 추가·삭제하지 않는다(값만 바꾼다). 11개 파일 키 정합성을 깨면 빌드가 실패한다.
- `src/messages/*.json`은 혼합 EOL(\r\r\n, \r\n, \n, 고립 \r)이다. `JSON.parse → stringify` 재작성 금지. 값 치환은 원문 바이트에서 정확히 한 곳만 바꾸고, `git diff --numstat`으로 변경 줄 수가 편집 수와 같은지 확인한다.
- 리포 전체 eslint는 기존 오류 57건이 있다. lint 게이트는 변경 파일에만 `npx eslint <files>`로 적용한다.
- 브랜치 `feature/foreign-seo-p0`에서 작업하고 작업 파일만 `git add`한다. 워킹트리에 있는 무관한 수정(`CLAUDE.md`, `docs/04-report/features/marketing-attribution.report.md`, `src/lib/data/concernRules.generated.ts`)과 수많은 untracked 파일은 건드리지 않는다.
- 커밋 메시지는 한국어 요약 + `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- 병원명 정본: ko 리브성형외과 / en LIV Plastic Surgery(별칭 LIV Clinic) / ja LIV美容クリニック(alternateName リブ形成外科) / zh·zh-TW LIV整形外科. 신규 문구는 이 표기를 따른다.
- 의료광고 표현 금지: 최상급·보장·비교·할인 강조. 이 계획의 문구 변경은 지명·장비명·카테고리어 추가에 한정한다.
- 범위 제외(사유 기록): S5 번역 JSON 페이로드 축소 — 클라이언트 필수 네임스페이스가 123K/137K(90%)라 절감 10%뿐이고 `useTranslations()` 무인자 호출 5곳 때문에 누락 위험이 있다. P1 이후 라우트별 프로바이더로 재검토.

---

### Task 0: 브랜치·기준선

**Files:** 없음(git 상태만)

- [ ] **Step 1: 브랜치 생성**

```bash
cd /d/dev/LIV_homepage && git checkout -b feature/foreign-seo-p0
```

- [ ] **Step 2: 기준선 게이트 실행(모두 통과해야 시작)**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx tsc --noEmit && npx vitest run && npm run verify:i18n
```
Expected: tsc 오류 0, vitest 12 passed, verify:i18n 11개 로케일 동기화.

---

### Task 1: hreflang 단일화 (T1, T2)

**Files:**
- Modify: `liv-clinic/src/i18n/routing.ts`
- Modify: `liv-clinic/src/app/[locale]/events/[eventId]/page.tsx:1-115`
- Modify: `liv-clinic/src/app/[locale]/events/first-visit/page.tsx:1-45`
- Test: `liv-clinic/src/lib/__tests__/seo.test.ts` (신규)

**Interfaces:**
- Consumes: `buildHreflangMap(path: string): Record<string,string>`, `getSiteName(locale?: string): string`, `BASE_URL` — 모두 `@/lib/seo` 기존 export.
- Produces: 없음(동작 변경만).

- [ ] **Step 1: 실패하는 테스트 작성**

`liv-clinic/src/lib/__tests__/seo.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BASE_URL, buildHreflangMap, getSiteName } from '@/lib/seo';
import { LOCALES } from '@/i18n/routing';

describe('buildHreflangMap', () => {
  it('lists every locale with BCP-47 codes and x-default → /en', () => {
    const map = buildHreflangMap('/events/first-visit');
    expect(Object.keys(map)).toHaveLength(LOCALES.length + 1);
    expect(map['ko-KR']).toBe(`${BASE_URL}/ko/events/first-visit`);
    expect(map['zh-Hans-CN']).toBe(`${BASE_URL}/zh/events/first-visit`);
    expect(map['zh-Hant-TW']).toBe(`${BASE_URL}/zh-TW/events/first-visit`);
    expect(map['x-default']).toBe(`${BASE_URL}/en/events/first-visit`);
  });
});

describe('getSiteName', () => {
  it('uses the unified Japanese clinic name', () => {
    expect(getSiteName('ja')).toBe('LIV美容クリニック');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/__tests__/seo.test.ts`
Expected: `getSiteName` 케이스 FAIL(현재 'リブ形成外科'). `buildHreflangMap` 케이스는 PASS(회귀 방지용).

- [ ] **Step 3: routing.ts에 alternateLinks:false**

```ts
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'ko',
  localePrefix: 'always', // 모든 언어에 prefix 사용 (/ko, /en, /ja, /zh)
  // hreflang은 generatePageMetadata의 <link rel="alternate"> 태그가 단일 진실 공급원이다.
  // next-intl 기본값(true)은 HTTP Link 헤더에 bare code(ko, zh…)와 x-default→/ 를 덧붙여
  // HTML 태그(ko-KR, zh-Hans-CN…, x-default→/en)와 충돌시키므로 끈다.
  alternateLinks: false,
});
```

- [ ] **Step 4: seo.ts 일본어 병원명 통일**

`liv-clinic/src/lib/seo.ts` — `CLINIC_NAME_BY_LOCALE.ja`를 `'LIV美容クリニック'`으로, `ALT_CLINIC_NAMES`를 아래로:
```ts
const ALT_CLINIC_NAMES = [SITE_INFO.nameEn, 'LIV美容クリニック', 'リブ形成外科', 'LIV整形外科'] as const;
```
(`buildAlternateNames`가 primary name을 걸러내므로 ja의 alternateName은 [LIV Plastic Surgery, リブ形成外科, LIV整形外科]가 된다.)

- [ ] **Step 5: 이벤트 상세 메타 교체**

`events/[eventId]/page.tsx`: import를 `import { BASE_URL, buildHreflangMap, getSiteName } from '@/lib/seo';`로 바꾸고 `SITE_INFO` import를 제거한다. `FALLBACK_TITLES.ja`를 `'イベント | LIV美容クリニック'`으로. `generateMetadata`의 return을 다음으로 교체:
```ts
  const siteName = getSiteName(locale);
  const fullTitle = `${title} | ${siteName}`;
  const pageUrl = `${BASE_URL}/${locale}/events/${eventId}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: pageUrl,
      siteName,
      type: 'article',
      images: [{ url: imageUrl, width: 800, height: 1200, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: pageUrl,
      // 11개 로케일 + x-default, BCP-47 — 사이트 공통 hreflang 맵과 동일
      languages: buildHreflangMap(`/events/${eventId}`),
    },
  };
```

- [ ] **Step 6: first-visit 페이지 hreflang**

`events/first-visit/page.tsx`: `import { BASE_URL, buildHreflangMap } from '@/lib/seo';`, `LOCALES` import 삭제, alternates를:
```ts
    alternates: {
      canonical: url,
      languages: buildHreflangMap('/events/first-visit'),
    },
```

- [ ] **Step 7: 테스트·타입 통과 확인**

Run: `npx vitest run && npx tsc --noEmit`
Expected: 모두 PASS, 타입 오류 0.

- [ ] **Step 8: 커밋**

```bash
git add liv-clinic/src/i18n/routing.ts liv-clinic/src/lib/seo.ts "liv-clinic/src/app/[locale]/events/[eventId]/page.tsx" "liv-clinic/src/app/[locale]/events/first-visit/page.tsx" liv-clinic/src/lib/__tests__/seo.test.ts
git commit -m "seo: hreflang 단일화 — next-intl Link 헤더 비활성, 이벤트 페이지 11개 로케일 맵, 일본어 병원명 통일"
```

---

### Task 2: 옛 URL 리다이렉트 (T3, T4, T5)

**Files:**
- Create: `liv-clinic/src/lib/legacyRedirects.ts`
- Modify: `liv-clinic/src/middleware.ts` (`export default async function middleware` 시작부)
- Modify: `liv-clinic/src/i18n/request.ts`
- Modify: `liv-clinic/netlify.toml` (WordPress 블록)
- Test: `liv-clinic/src/lib/__tests__/legacyRedirects.test.ts` (신규)

**Interfaces:**
- Produces: `legacyLangRedirectPath(pathname: string, lang: string | null): string | null` — `?lang=` 값이 지원 언어면 이동 경로, 아니면 null.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { legacyLangRedirectPath } from '@/lib/legacyRedirects';

describe('legacyLangRedirectPath', () => {
  it('maps WordPress ?lang= on the root to the locale home', () => {
    expect(legacyLangRedirectPath('/', 'en')).toBe('/en');
    expect(legacyLangRedirectPath('/', 'ja')).toBe('/ja');
    expect(legacyLangRedirectPath('/', 'zh')).toBe('/zh');
    expect(legacyLangRedirectPath('/', 'zh-tw')).toBe('/zh-TW');
  });
  it('replaces an existing locale prefix (the URL our old 307 produced)', () => {
    expect(legacyLangRedirectPath('/ko', 'en')).toBe('/en');
    expect(legacyLangRedirectPath('/ko/about', 'zh-TW')).toBe('/zh-TW/about');
    expect(legacyLangRedirectPath('/ko/about/', 'ja')).toBe('/ja/about');
  });
  it('ignores unknown or missing lang values', () => {
    expect(legacyLangRedirectPath('/', 'xx')).toBeNull();
    expect(legacyLangRedirectPath('/', null)).toBeNull();
    expect(legacyLangRedirectPath('/', '')).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/lib/__tests__/legacyRedirects.test.ts` → 모듈 없음으로 FAIL.

- [ ] **Step 3: 구현**

`liv-clinic/src/lib/legacyRedirects.ts`:
```ts
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
```

`middleware.ts` — import 추가 `import { legacyLangRedirectPath } from './lib/legacyRedirects';` 그리고 함수 본문 첫 줄(`const { pathname } = request.nextUrl;` 직후)에:
```ts
  // 옛 워드프레스 URL `?lang=xx` → 해당 로케일로 301 (구글에 아직 색인된 /?lang=en 등 회수).
  // lang 이외의 파라미터(utm 등)는 유지한다.
  const legacyLang = request.nextUrl.searchParams.get('lang');
  if (legacyLang) {
    const target = legacyLangRedirectPath(pathname, legacyLang);
    if (target) {
      const url = new URL(target, request.url);
      request.nextUrl.searchParams.forEach((value, key) => {
        if (key !== 'lang') url.searchParams.set(key, value);
      });
      return NextResponse.redirect(url, 301);
    }
  }
```

`src/i18n/request.ts` 전체 교체:
```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // 지원하지 않는 로케일(예: /index.php 같은 옛 URL 세그먼트)은 기본 로케일 메시지로 응답한다.
  // 404 판정은 [locale]/layout.tsx의 notFound()가 담당한다 — 여기서 notFound()를 부르면
  // 렌더 컨텍스트 밖이라 500이 났다(2026-09-05 /index.php 실측).
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

`netlify.toml` — `# WordPress admin/login - block gracefully` 블록 위에 추가:
```toml
# 옛 워드프레스 PHP 진입점 — 미들웨어는 점(.)이 있는 경로를 건너뛰므로 Netlify 규칙으로 처리
[[redirects]]
  from = "/index.php"
  to = "/ko"
  status = 301

[[redirects]]
  from = "/xmlrpc.php"
  to = "/ko"
  status = 301
```

- [ ] **Step 4: 테스트·타입 통과** — `npx vitest run && npx tsc --noEmit`.

- [ ] **Step 5: GSC 404 목록 검토(수동)** — Chrome MCP로 `https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fliv-clinic.net%2F` → "Not found (404)" 행 클릭 → `get_page_text`로 URL 표 수집 → 같은 접두사 3개 이상인 경로 패턴은 `netlify.toml`(점 있는 경로) 또는 `legacyRedirects.ts`(점 없는 경로)에 규칙 추가. 어떤 패턴이든 대상이 불명확하면 `/ko`로 301 대신 그대로 404를 유지한다(잘못된 301은 더 나쁘다). 수집 결과와 결정은 Task 12 보고서에 표로 남긴다.

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/legacyRedirects.ts liv-clinic/src/lib/__tests__/legacyRedirects.test.ts liv-clinic/src/middleware.ts liv-clinic/src/i18n/request.ts liv-clinic/netlify.toml
git commit -m "seo: 옛 워드프레스 URL 회수 — ?lang= 301, index.php 301, 미지원 로케일 500→404"
```

---

### Task 3: 사이트맵 보강 (T6)

**Files:**
- Create: `liv-clinic/src/lib/sitemapPaths.ts`
- Modify: `liv-clinic/src/app/sitemap.ts` (전체 교체)
- Test: `liv-clinic/src/lib/__tests__/sitemapPaths.test.ts` (신규)

**Interfaces:**
- Produces: `buildSitemapPaths(): SitemapPath[]`, `type SitemapPath = { path: string; priority: number; changeFrequency: 'weekly'|'monthly'|'yearly'; locales?: readonly string[] }`.

- [ ] **Step 1: 실패하는 테스트**

```ts
import { describe, it, expect } from 'vitest';
import { buildSitemapPaths } from '@/lib/sitemapPaths';

describe('buildSitemapPaths', () => {
  const paths = buildSitemapPaths();
  const byPath = Object.fromEntries(paths.map((p) => [p.path, p]));

  it('includes pages that were missing from the sitemap', () => {
    for (const p of ['/antiaging/hilowave', '/antiaging/hilowave-v2', '/events/first-visit', '/inquiry', '/consult-prep']) {
      expect(byPath[p], p).toBeDefined();
    }
  });
  it('keeps the WeChat page zh-only', () => {
    expect(byPath['/wechat'].locales).toEqual(['zh']);
  });
  it('has no duplicates and every path starts with /', () => {
    expect(new Set(paths.map((p) => p.path)).size).toBe(paths.length);
    expect(paths.every((p) => p.path === '' || p.path.startsWith('/'))).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인** — 모듈 없음 FAIL.

- [ ] **Step 3: sitemapPaths.ts**

```ts
import { TREATMENTS } from '@/lib/constants';

export type SitemapPath = {
  /** 로케일 접두사 뒤 경로. 홈은 ''. */
  path: string;
  priority: number;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
  /** 지정하면 해당 로케일에만 존재하는 페이지(다른 로케일은 리다이렉트). */
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
  { path: '/wechat', priority: 0.5, changeFrequency: 'yearly', locales: ['zh'] },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

const LASER_CATEGORIES = ['pigmentation', 'vascular', 'skintone', 'hair-removal', 'tattoo'];

/** 사이트맵에 넣을 모든 경로(정적 + 시술 상세 + 레이저 카테고리). 이벤트 상세는 DB에서 따로 붙인다. */
export function buildSitemapPaths(): SitemapPath[] {
  const treatments: SitemapPath[] = [
    ...Object.keys(TREATMENTS.lifting).map((id) => `/lifting/${id}`),
    ...Object.keys(TREATMENTS.antiaging).map((id) => `/antiaging/${id}`),
    ...LASER_CATEGORIES.map((id) => `/laser/${id}`),
  ].map((path) => ({ path, priority: 0.8, changeFrequency: 'monthly' as const }));

  const seen = new Set<string>();
  return [...STATIC_PATHS, ...treatments].filter((p) => {
    if (seen.has(p.path)) return false;
    seen.add(p.path);
    return true;
  });
}
```
(`TREATMENTS.antiaging`에 `hilowave`/`skincare` 키가 이미 있으면 중복 제거 필터가 정적 항목을 살리고 뒤 항목을 버린다 — 테스트의 "no duplicates"가 이를 보장.)

- [ ] **Step 4: sitemap.ts 교체**

```ts
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { LOCALES } from '@/i18n/routing';
import { BASE_URL, buildHreflangMap } from '@/lib/seo';
import { buildSitemapPaths } from '@/lib/sitemapPaths';

// 이벤트 목록이 바뀌면 1시간 안에 반영
export const revalidate = 3600;

type PublishedEvent = { slug: string; updated_at: string | null };

async function fetchPublishedEvents(): Promise<PublishedEvent[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('is_published', true);
    if (error) throw error;
    return (data ?? []) as PublishedEvent[];
  } catch (err) {
    console.error('sitemap: events fetch failed', err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // 정적·시술 페이지 — lastmod는 실제 수정일을 알 수 없으므로 생략(빌드 시각을 넣으면 구글이 lastmod를 불신한다)
  for (const page of buildSitemapPaths()) {
    const locales = page.locales ?? LOCALES;
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        // 단일 로케일 페이지는 대체 언어가 없다
        ...(page.locales ? {} : { alternates: { languages: buildHreflangMap(page.path) } }),
      });
    }
  }

  // 발행 중인 이벤트 상세 — 실제 updated_at을 lastmod로
  for (const event of await fetchPublishedEvents()) {
    const path = `/events/${event.slug}`;
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        ...(event.updated_at ? { lastModified: event.updated_at } : {}),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: buildHreflangMap(path) },
      });
    }
  }

  return entries;
}
```

- [ ] **Step 5: 테스트·타입** — `npx vitest run && npx tsc --noEmit`.

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/src/lib/sitemapPaths.ts liv-clinic/src/lib/__tests__/sitemapPaths.test.ts liv-clinic/src/app/sitemap.ts
git commit -m "seo: 사이트맵 누락 페이지 6종·이벤트 상세 동적 포함, 가짜 lastmod 제거"
```

---

### Task 4: robots.txt 정리 (T7)

**Files:**
- Modify: `liv-clinic/src/app/robots.ts` (전체 교체)
- Test: `liv-clinic/src/lib/__tests__/robots.test.ts` (신규)

- [ ] **Step 1: 실패하는 테스트**

```ts
import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

describe('robots.txt', () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  it('never blocks static assets or JSON for any crawler', () => {
    for (const rule of rules) {
      const disallow = ([] as string[]).concat(rule.disallow ?? []);
      expect(disallow).not.toContain('/_next/');
      expect(disallow.some((d) => d.includes('.json'))).toBe(false);
    }
  });
  it('keeps admin and api blocked for every crawler', () => {
    for (const rule of rules) {
      const disallow = ([] as string[]).concat(rule.disallow ?? []);
      expect(disallow).toContain('/admin');
      expect(disallow).toContain('/api');
    }
  });
  it('names Yandex explicitly for the ru locale', () => {
    expect(rules.some((r) => r.userAgent === 'YandexBot')).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인** — `/_next/` 포함으로 FAIL.

- [ ] **Step 3: robots.ts 교체**

```ts
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net';

// 관리자·API만 차단한다. /_next/(CSS·JS)나 *.json을 막으면 이름을 명시하지 않은 크롤러
// (Yandex·Applebot·DuckDuckBot 등)가 페이지를 렌더링하지 못한다.
const BLOCKED_PATHS = ['/admin', '/api', '/private/'];

// 시장별 검색 크롤러 (ko: Yeti, ru: YandexBot, zh: Baiduspider, 애플·DDG 포함)
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'Yeti', 'Baiduspider', 'YandexBot', 'Applebot', 'DuckDuckBot'];

// AI / LLM 크롤러 — AI 답변에 노출되도록 명시 허용 (GEO/AEO)
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: BLOCKED_PATHS },
      ...[...SEARCH_BOTS, ...AI_CRAWLERS].map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: BLOCKED_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run`.

- [ ] **Step 5: 커밋**

```bash
git add liv-clinic/src/app/robots.ts liv-clinic/src/lib/__tests__/robots.test.ts
git commit -m "seo: robots.txt에서 /_next/·*.json 차단 제거, Yandex·Applebot·DuckDuckBot 명시"
```

---

### Task 5: 홈 이미지 다이어트 (S1, S2)

**Files:**
- Create: `liv-clinic/scripts/optimize-static-images.mjs`
- Modify(바이너리, 제자리 축소): `liv-clinic/public/images/aptos/presentation-mips.jpg`, `presentation.jpg`, `certification-ceremony.jpg`
- Create(신규 WebP)/Delete(PNG): `liv-clinic/public/images/signature/*.png` → `*.webp`
- Modify: `liv-clinic/src/components/sections/Signature.tsx:9-27`, `liv-clinic/src/components/sections/SignatureDetail.tsx:149-175`

- [ ] **Step 1: 스크립트 작성**

```js
// 정적 이미지 다이어트 — 재실행 가능. JPG는 같은 경로에 축소본을 덮어쓰고, PNG는 WebP 형제 파일을 만든다.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

// CSS background / <img>로 원본이 그대로 나가는 사진 (next/image 최적화를 타지 않는 것들)
const JPEG_IN_PLACE = [
  { file: 'aptos/presentation-mips.jpg', maxWidth: 1600 },
  { file: 'aptos/presentation.jpg', maxWidth: 1600 },
  { file: 'aptos/certification-ceremony.jpg', maxWidth: 1200 },
];
// 시그니처 카드 일러스트 — PNG 1MB → WebP
const PNG_TO_WEBP_DIRS = ['signature'];

const kb = (p) => Math.round(fs.statSync(p).size / 1024);

for (const job of JPEG_IN_PLACE) {
  const abs = path.join(IMAGES, job.file);
  const meta = await sharp(abs).metadata();
  if ((meta.width ?? 0) <= job.maxWidth && kb(abs) < 400) { console.log('skip', job.file); continue; }
  const before = kb(abs);
  const buf = await sharp(abs).rotate().resize({ width: job.maxWidth, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  fs.writeFileSync(abs, buf);
  console.log(`${job.file}: ${before}KB → ${kb(abs)}KB`);
}

for (const dir of PNG_TO_WEBP_DIRS) {
  const abs = path.join(IMAGES, dir);
  for (const name of fs.readdirSync(abs).filter((n) => n.toLowerCase().endsWith('.png'))) {
    const src = path.join(abs, name);
    const out = src.replace(/\.png$/i, '.webp');
    await sharp(src).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    console.log(`${dir}/${name}: ${kb(src)}KB → ${path.basename(out)} ${kb(out)}KB`);
  }
}
```

- [ ] **Step 2: 실행**

Run: `cd liv-clinic && node scripts/optimize-static-images.mjs`
Expected: aptos JPG 3장 각 400KB 이하, signature/*.webp 생성(각 150KB 이하).

- [ ] **Step 3: 참조 교체**

`Signature.tsx` 13·19·25행 `.png` → `.webp`. `SignatureDetail.tsx` 149–175행의 `/images/signature/*.png` 참조 전부 `.webp`. 확인: `grep -rn "images/signature/.*\.png" src` → 0건.

- [ ] **Step 4: PNG 삭제·확인**

```bash
git rm -q liv-clinic/public/images/signature/*.png
ls -la liv-clinic/public/images/signature liv-clinic/public/images/aptos
```

- [ ] **Step 5: 화면 확인** — `NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev`로 `/ko`·`/ko/signature`를 열어 시그니처 카드·의료진 갤러리 이미지가 보이는지 확인(Playwright 스크린샷 `LIV_homepage/p0-images-home.png`).

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/scripts/optimize-static-images.mjs liv-clinic/public/images/aptos liv-clinic/public/images/signature liv-clinic/src/components/sections/Signature.tsx liv-clinic/src/components/sections/SignatureDetail.tsx
git commit -m "perf: 홈 원본 사진 3장 제자리 축소(6.6MB→<1MB), 시그니처 PNG→WebP"
```

---

### Task 6: 폰트 다이어트 (S3, S4)

**Files:**
- Create: `liv-clinic/scripts/build-paperlogy-woff2.sh`
- Create: `liv-clinic/public/fonts/Paperlogy-{4Regular,6SemiBold,7Bold}-{latin,hangul}.woff2`
- Delete: `liv-clinic/public/fonts/Paperlogy-*.ttf`
- Modify: `liv-clinic/src/app/globals.css:3-26`
- Modify: `liv-clinic/src/styles/fonts.ts:6-12`

- [ ] **Step 1: 서브셋 스크립트**

```bash
#!/usr/bin/env bash
# Paperlogy TTF(680KB×3, 힌팅 포함) → 라틴/한글 woff2 서브셋. 재실행 가능. 요구: python fontTools + brotli.
set -euo pipefail
cd "$(dirname "$0")/../public/fonts"
LATIN="U+0000-024F,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+2600-26FF,U+FB00-FB4F"
HANGUL="U+1100-11FF,U+3000-303F,U+3130-318F,U+AC00-D7A3,U+FF00-FFEF"
for w in 4Regular 6SemiBold 7Bold; do
  pyftsubset "Paperlogy-$w.ttf" --unicodes="$LATIN"  --flavor=woff2 --no-hinting --desubroutinize --layout-features='*' --output-file="Paperlogy-$w-latin.woff2"
  pyftsubset "Paperlogy-$w.ttf" --unicodes="$HANGUL" --flavor=woff2 --no-hinting --desubroutinize --layout-features='*' --output-file="Paperlogy-$w-hangul.woff2"
done
ls -la Paperlogy-*
```

- [ ] **Step 2: 실행** — `bash scripts/build-paperlogy-woff2.sh`. Expected: latin 각 30KB 이하, hangul 각 500KB 이하(TTF 680KB보다 작아야 함. 크면 `--desubroutinize` 제거 후 재시도).

- [ ] **Step 3: globals.css @font-face 교체(3–26행)**

```css
/* Paperlogy 폰트 — 라틴/한글 서브셋 woff2 (unicode-range로 필요한 조각만 내려받는다) */
@font-face {
  font-family: 'Paperlogy';
  src: url('/fonts/Paperlogy-4Regular-latin.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-024F, U+0300-036F, U+1E00-1EFF, U+2000-206F, U+20A0-20CF, U+2100-214F, U+2190-21FF, U+2200-22FF, U+25A0-25FF, U+2600-26FF, U+FB00-FB4F;
}
@font-face {
  font-family: 'Paperlogy';
  src: url('/fonts/Paperlogy-4Regular-hangul.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+1100-11FF, U+3000-303F, U+3130-318F, U+AC00-D7A3, U+FF00-FFEF;
}
```
같은 형태로 600(`6SemiBold`)·700(`7Bold`) 각 2블록 — 총 6블록.

- [ ] **Step 4: Pretendard preload 해제**

`fonts.ts`:
```ts
// Pretendard Variable(2MB) — globals.css에서 아랍어 페이지 폴백(html[lang="ar"] body)에만 쓰인다.
// preload를 켜면 모든 로케일이 2MB를 내려받으므로 끈다(브라우저가 필요할 때만 가져온다).
export const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '300 700',
  display: 'swap',
  preload: false,
});
```

- [ ] **Step 5: TTF 삭제·검증**

```bash
git rm -q liv-clinic/public/fonts/Paperlogy-*.ttf
grep -rn "Paperlogy-.*\.ttf" liv-clinic/src liv-clinic/public 2>/dev/null   # 0건이어야 함
```
dev 서버에서 `/ko`(한글 렌더)와 `/en`(라틴 렌더)을 열어 폰트가 Paperlogy로 뜨는지 스크린샷으로 확인하고, 네트워크에서 `/en`이 `-hangul.woff2`를 받지 않는지 확인(Playwright `page.on('response')`로 woff2 URL 수집).

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/scripts/build-paperlogy-woff2.sh liv-clinic/public/fonts liv-clinic/src/app/globals.css liv-clinic/src/styles/fonts.ts
git commit -m "perf: Paperlogy woff2 라틴/한글 서브셋(unicode-range), Pretendard 2MB preload 해제"
```

---

### Task 7: 얇은 페이지 처리 (T8, T9)

**Files:**
- Create: `liv-clinic/src/app/[locale]/events/EventsPageClient.tsx` (기존 page.tsx 본문 이동)
- Modify: `liv-clinic/src/app/[locale]/events/page.tsx` (서버 컴포넌트로 교체)
- Modify: `liv-clinic/src/app/[locale]/reviews/page.tsx:19-22`

**Interfaces:**
- Produces: `EventsPageClient({ initialEvents: EventItem[]; loadFailed: boolean })`.
- Consumes: `eventRowToEventItem(row: EventRow): EventItem` (`@/lib/eventApi`), `EventRow` (`@/types/admin`), `fetchPublishedEvents()` (재시도 버튼용).

- [ ] **Step 1: EventsPageClient.tsx 생성**

현재 `events/page.tsx` 내용을 그대로 옮기되:
- 시그니처: `export default function EventsPageClient({ initialEvents, loadFailed }: { initialEvents: EventItem[]; loadFailed: boolean })`
- `useEffect` 블록 삭제. 상태 초기값: `const [allEvents, setAllEvents] = useState<EventItem[]>(initialEvents); const [isLoading, setIsLoading] = useState(false); const [loadError, setLoadError] = useState(loadFailed);`
- 재시도 버튼의 onClick은 그대로(`fetchPublishedEvents`) 유지.
- `import { useState, useMemo } from 'react';`로 정리(useEffect 제거).

- [ ] **Step 2: page.tsx를 서버 컴포넌트로**

```tsx
import { createClient } from '@supabase/supabase-js';
import type { EventRow } from '@/types/admin';
import { eventRowToEventItem } from '@/lib/eventApi';
import EventsPageClient from './EventsPageClient';

// 이벤트 카드를 서버에서 렌더링해 검색엔진이 목록을 읽게 한다.
// 관리자 변경은 1분 안에 반영(이벤트 상세 페이지와 같은 주기).
export const revalidate = 60;

async function getPublishedEvents(): Promise<{ events: ReturnType<typeof eventRowToEventItem>[]; ok: boolean }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('start_date', { ascending: false });
    if (error) throw error;
    return { events: ((data ?? []) as EventRow[]).map(eventRowToEventItem), ok: true };
  } catch (err) {
    console.error('events page fetch error:', err);
    return { events: [], ok: false };
  }
}

export default async function EventsPage() {
  const { events, ok } = await getPublishedEvents();
  return <EventsPageClient initialEvents={events} loadFailed={!ok} />;
}
```

- [ ] **Step 3: 후기 0건 로케일 noindex**

`reviews/page.tsx`의 `generateMetadata` 교체:
```ts
async function countPublishedReviews(locale: string): Promise<number> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('locale', locale);
  if (error) {
    console.error('reviews count error:', error);
    return 1; // 오류 시에는 색인 상태를 바꾸지 않는다
  }
  return count ?? 0;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = await buildLocalizedMetadata(locale, 'reviews', '/reviews');
  const published = await countPublishedReviews(locale);
  if (published > 0) return base;
  // 후기가 아직 없는 로케일은 빈 페이지다 — 색인은 막고 링크는 따라가게 둔다
  return { ...base, robots: { index: false, follow: true } };
}
```
(실행 전 `ReviewsList`와 `/api/reviews`가 `locale` 컬럼으로 거르는지 확인해 같은 기준을 쓴다.)

- [ ] **Step 4: 검증** — `npx tsc --noEmit`; dev 서버에서 `curl -s localhost:3000/en/events | grep -c "/en/events/2026-09-promotion"` ≥ 1(SSR HTML에 이벤트 링크), `curl -s localhost:3000/en/reviews | grep -o '<meta name="robots"[^>]*>'` → `noindex, follow`; `/ko/reviews`는 `index, follow`.

- [ ] **Step 5: 커밋**

```bash
git add "liv-clinic/src/app/[locale]/events/page.tsx" "liv-clinic/src/app/[locale]/events/EventsPageClient.tsx" "liv-clinic/src/app/[locale]/reviews/page.tsx"
git commit -m "seo: 이벤트 목록 서버 렌더링, 후기 없는 로케일 noindex"
```

---

### Task 8: 언어 링크·설명형 앵커 (T10, T11)

**Files:**
- Modify: `liv-clinic/src/components/layout/Footer.tsx` (import + 하단 언어 목록)
- Modify: `liv-clinic/src/components/sections/Signature.tsx:~136`, `Equipment.tsx:~409`, `ConcernPathways.tsx:~41`, `SignatureDetail.tsx:~653,~826`

- [ ] **Step 1: Footer 언어 링크**

import 추가:
```ts
import { Link, usePathname } from '@/i18n/routing';
import { LOCALE_META, LOCALE_ORDER } from '@/i18n/locales-meta';
```
컴포넌트 안 `const pathname = usePathname();` 추가(로케일 접두사 없는 경로). Main Footer `</div>`(grid 닫힘) 뒤, Bottom Bar 앞에:
```tsx
        {/* 언어 버전 링크 — hreflang 대체 페이지를 크롤러가 따라갈 수 있는 실제 <a> (언어 전환기는 JS 이동이라 링크가 아니다) */}
        <nav aria-label="Languages" className="mt-10 border-t border-white/10 pt-6">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {LOCALE_ORDER.map((code) => {
              const meta = LOCALE_META[code];
              const href = `/${code}${pathname === '/' ? '' : pathname}`;
              const isCurrent = code === locale;
              return (
                <li key={code}>
                  <a
                    href={href}
                    hrefLang={meta.htmlLang}
                    lang={meta.htmlLang}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={isCurrent ? 'text-white' : 'text-white/60 hover:text-white transition-colors'}
                  >
                    {meta.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
```

- [ ] **Step 2: 앵커에 대상 이름 추가**

각 "Learn More" 링크 안에 시각적으로 숨긴 이름을 넣는다(앵커 텍스트가 "Ultherapy Prime Learn More"가 된다). 예 `Signature.tsx`:
```tsx
<span className="sr-only">{t(`programs.${program.id}.title`)} — </span>
<span>{tCommon('learnMore')}</span>
```
실행 시 각 파일에서 링크 스코프에 있는 이름 변수(프로그램 제목·장비명·고민 라벨)를 확인해 같은 패턴으로 넣는다. 이름 변수가 없으면 링크의 `aria-label`에 `${name} – ${learnMore}`를 추가하는 것으로 대신한다.

- [ ] **Step 3: 검증** — `npx tsc --noEmit`, dev 서버 `/en` 하단 언어 목록 11개 `<a href="/xx">`, `/en/lifting/ulthera` 하단은 `/ja/lifting/ulthera` 형태인지 curl로 확인. Lighthouse link-text는 배포 후 확인.

- [ ] **Step 4: 커밋**

```bash
git add liv-clinic/src/components/layout/Footer.tsx liv-clinic/src/components/sections/Signature.tsx liv-clinic/src/components/sections/Equipment.tsx liv-clinic/src/components/sections/ConcernPathways.tsx liv-clinic/src/components/sections/SignatureDetail.tsx
git commit -m "seo: 푸터 11개 언어 <a> 링크, Learn More 앵커에 대상 이름 추가"
```

---

### Task 9: 용어·브랜드명·간체 누출 교정 (§2.7)

**Files:**
- Create: `liv-clinic/scripts/_i18n-work/apply-value-edits.mjs` (바이트 보존 값 치환기)
- Create: `liv-clinic/scripts/_i18n-work/value-edits.p0.json` (편집 목록)
- Create: `liv-clinic/scripts/_i18n-work/zh-tw-international-fix.mjs` (간체→번체 변환)
- Modify: `liv-clinic/src/messages/ja.json`, `zh-TW.json`, `en.json` (값만)
- Modify: `liv-clinic/src/lib/seo.ts` (`seoConfig.ja`, `seoConfig.en.keywords`, `seoConfig['zh-TW']`)
- Modify: `liv-clinic/src/app/[locale]/events/layout.tsx` (`EVENTS_META.ja`)

- [ ] **Step 1: 치환기 작성**

```js
// 사용: node scripts/_i18n-work/apply-value-edits.mjs scripts/_i18n-work/value-edits.p0.json
// 각 편집은 { file, find, replace } — find는 원문 바이트에서 정확히 1회 나타나야 한다(0회·2회면 중단).
// JSON 문자열 안의 텍스트를 다루므로 find/replace 둘 다 JSON 이스케이프된 형태로 쓴다(따옴표는 \" ).
import fs from 'node:fs';
import path from 'node:path';

const listPath = process.argv[2];
const edits = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..', 'src', 'messages');

const byFile = new Map();
for (const e of edits) (byFile.get(e.file) ?? byFile.set(e.file, []).get(e.file)).push(e);

for (const [file, list] of byFile) {
  const abs = path.join(root, file);
  const original = fs.readFileSync(abs, 'utf8');
  let raw = original;
  for (const { find, replace } of list) {
    const count = raw.split(find).length - 1;
    if (count !== 1) throw new Error(`${file}: expected 1 match, got ${count} for ${find.slice(0, 60)}`);
    raw = raw.replace(find, () => replace);
  }
  JSON.parse(raw); // 무결성
  fs.writeFileSync(abs, raw, 'utf8');
  const changedLines = original.split('\n').filter((l, i) => l !== raw.split('\n')[i]).length;
  console.log(`${file}: ${list.length} edits, ${changedLines} lines changed`);
}
```
(`find` 값이 여러 줄에 걸치면 안 된다. 각 편집은 한 줄 안의 부분 문자열로 만든다.)

- [ ] **Step 2: 편집 목록 작성** — `value-edits.p0.json`. 원문은 실행 시 `grep -n` 으로 정확히 확인해 옮긴다. 포함 항목:

ja.json
1. `"LIV美容外科"` → `"LIV美容クリニック"` — 11곳이라 치환기 대신 실행 시 `sed`가 아닌 Node로 `split/join` 전체 치환(고유 1회 제약 예외, 개수 11 확인).
2. `metaSeo.thermage.title`: `サーマジFLX | 高周波 肌弾力リフト | LIV美容クリニック（江南）` → `サーマクール（サーマジ）FLX | 韓国・江南の高周波リフト | LIV美容クリニック`
3. `metaSeo.thermage.description`: 앞부분 `サーマジFLX認定パートナー` → `サーマクール（サーマジ）FLX認定パートナー`; 끝 `新沙駅徒歩1分。` → `料金は韓国人と同一。新沙駅徒歩1分。`
4. `metaSeo.thermage.keywords`: `"サーマジFLX 韓国"` → `"サーマクール 韓国"`, `"サーマジ 料金"` → `"サーマクール 料金 韓国"`
5. `metaSeo.lifting.title`: `ウルセラ・サーマジ・糸リフト` → `ウルセラ・サーマクール・糸リフト`
6. `metaSeo.lifting.description`: `サーマジFLX、糸リフト` → `サーマクール（サーマジ）FLX、糸リフト`
7. `metaSeo.location.title`: `新沙駅4番出口から徒歩1分 | LIV美容クリニック` → `新沙駅4番出口徒歩1分・カロスキル | LIV美容クリニック`
8. `metaSeo.location.description`: `新沙駅4番出口から徒歩1分。駐車場` → `新沙駅4番出口から徒歩1分、カロスキル（新沙洞街路樹通り）入口すぐ。駐車場`
9. `metaSeo.about.title`: `ブランド紹介 | LIV美容クリニック（江南・新沙）` → `ブランド紹介 | 江南・新沙の美容皮膚科 LIV美容クリニック`
10. `international.hero.subtitle`: `新沙(シンサ)駅から徒歩1分の江南` → `新沙(シンサ)駅から徒歩1分・カロスキルすぐの江南`

zh-TW.json
11. `metaSeo.thermage.title`: `熱瑪吉FLX | 射頻緊膚提升 | LIV整形外科（江南）` → `鳳凰電波 Thermage FLX（熱瑪吉·電波拉提） | 首爾江南 | LIV整形外科`
12. `metaSeo.thermage.description`: `熱瑪吉FLX認證合作診所` → `鳳凰電波（熱瑪吉）Thermage FLX認證合作診所`; `射頻提升。新沙站` → `電波拉提。外國人同價。新沙站`
13. `metaSeo.thermage.keywords`: `"熱瑪吉FLX 首爾"` → `"鳳凰電波 首爾"`, `"熱瑪吉 價格"` → `"電波拉提 韓國 價格"`
14. `metaSeo.lifting.title`: `提升 | 超聲刀·熱瑪吉·線雕` → `拉提 | 音波拉提·鳳凰電波·埋線拉提`
15. `metaSeo.laserTattoo.title`: `紋身去除 | 皮秒激光洗紋身 | LIV整形外科（江南）` → `除刺青·洗紋身 | 皮秒雷射（激光） | 首爾江南 LIV整形外科`
16. `metaSeo.laserTattoo.description`: `紋身去除。皮秒激光將紋身色素` → `除刺青（洗紋身）。皮秒雷射將刺青色素`; `可處理彩色紋身` → `可處理彩色刺青`
17. `metaSeo.laserTattoo.keywords`: `"紋身去除 首爾"` → `"除刺青 首爾"`, `"皮秒激光 紋身"` → `"皮秒雷射 刺青"`
18. `metaSeo.location.title`: `新沙站4號出口步行1分鐘 | LIV整形外科` → `新沙站4號出口步行1分鐘·林蔭道 | LIV整形外科`
19. `metaSeo.location.description`: `新沙站4號出口步行1分鐘。附停車與公共交通信息。` → `新沙站4號出口步行1分鐘，林蔭道（新沙洞林蔭大道）入口旁。附停車與公共交通資訊。`
20. `metaSeo.about.title`: `品牌介紹 | LIV整形外科（首爾江南·新沙）` → `品牌介紹 | 首爾江南·新沙 醫美抗衰診所 LIV整形外科`

en.json
21. `metaSeo.location.title`: `Directions | LIV Clinic — 1 min from Sinsa Station, Gangnam` → `Directions | 1 min from Sinsa Station, next to Garosu-gil, Gangnam | LIV Clinic`
22. `metaSeo.location.description`: `one minute from Sinsa Station Exit 4. See parking` → `one minute from Sinsa Station Exit 4, next to Garosu-gil (Sinsa-dong's tree-lined street). See parking`
23. `metaSeo.about.description`: `one minute from Sinsa Station. Board-certified` → `one minute from Sinsa Station, next to Garosu-gil. Board-certified`
24. `international.hero.subtitle`: `one minute from Sinsa Station. Consultations` → `one minute from Sinsa Station, next to Garosu-gil. Consultations`

- [ ] **Step 3: zh-TW `international` 네임스페이스 간체→번체**

`zh-tw-international-fix.mjs`: `pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org opencc-python-reimplemented` 후 Python으로 `international` 아래 문자열 값 80개를 `s2twp`(대만 관용구 포함)로 변환한 목록(`{find, replace}` 형태, JSON 이스케이프 적용)을 생성 → 위 치환기로 적용. 변환 후 손수 보정: `肉毒素`→`肉毒桿菌素`, `填充`은 유지, `项目/項目`→`療程`, `在线`→`線上`, `视频/視頻`→`影片`. 마지막으로 `international.hero.subtitle`에 `（林蔭道旁）`를 `新沙站步行1分鐘` 뒤에 삽입. 검증 스크립트: `international` 값에 간체 전용 글자(于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务)가 0개.

- [ ] **Step 4: seo.ts·events/layout.tsx 코드 문구**

- `seoConfig.ja.title`: `LIV美容クリニック | ソウル新沙・カロスキルの美容皮膚科 非手術アンチエイジング`
- `seoConfig.ja.description`: `ウルセラ・サーマクール（サーマジFLX）公式認証クリニック。新沙駅4番出口徒歩1分、カロスキルすぐ。日本語相談対応、料金は韓国人と同一。ボトックス・フィラー・スキンブースター・糸リフト・レーザー専門。`
- `seoConfig.ja.keywords`에 추가: `'韓国 サーマクール 料金', '韓国 ウルセラ 値段', '新沙 美容皮膚科 日本語', 'カロスキル 皮膚科', '江南 美容皮膚科 日本語対応'`
- `seoConfig.en.keywords`에 추가: `'Garosu-gil skin clinic', 'Sinsa Garosu-gil clinic', 'skin clinic Seoul English', 'same price for foreigners Korea clinic'`
- `seoConfig['zh-TW']`(있으면) title: `LIV整形外科 | 首爾新沙·林蔭道 醫美抗衰診所（音波拉提·鳳凰電波）`, description: `音波拉提（Ultherapy）、鳳凰電波（Thermage FLX）官方認證診所。新沙站4號出口步行1分鐘、林蔭道旁。提供中文諮詢，外國人與韓國人同價。`, keywords 추가 `'韓國 音波拉提 價格', '韓國 電波拉提 價格', '首爾 醫美 中文', '林蔭道 醫美', '首爾 除刺青'`. 없으면 `zh` 항목 형태로 신설.
- `events/layout.tsx` `EVENTS_META.ja`: title `イベント | LIV美容クリニック`, description의 `リブ形成外科の` → `LIV美容クリニックの`, `サーマジ` → `サーマクール（サーマジ）`, keywords `'リブ形成外科イベント'` → `'LIV美容クリニック イベント'`, `'サーマジ割引'` → `'サーマクール割引'`.

- [ ] **Step 5: 검증**

```bash
node -e "for (const f of ['ja','zh-TW','en']) JSON.parse(require('fs').readFileSync('src/messages/'+f+'.json','utf8')); console.log('json ok')"
npm run verify:i18n
git diff --numstat -- src/messages/   # 파일별 +N/-N 이 편집 줄 수와 같아야 한다(전 라인 diff면 EOL 손상)
npx tsc --noEmit && npx vitest run
```
dev 서버: `curl -s localhost:3000/ja/lifting/thermage | grep -o '<title>[^<]*'` → サーマクール 포함; `/zh-TW/international` 본문에 간체 없음; `/ja` 타이틀 LIV美容クリニック.

- [ ] **Step 6: 커밋**

```bash
git add liv-clinic/scripts/_i18n-work/apply-value-edits.mjs liv-clinic/scripts/_i18n-work/value-edits.p0.json liv-clinic/scripts/_i18n-work/zh-tw-international-fix.mjs liv-clinic/src/messages/ja.json liv-clinic/src/messages/zh-TW.json liv-clinic/src/messages/en.json liv-clinic/src/lib/seo.ts "liv-clinic/src/app/[locale]/events/layout.tsx"
git commit -m "i18n(seo): 일본어 サーマクール·カロスキル·美容皮膚科, 번체 鳳凰電波·林蔭道·刺青 + 국제환자 페이지 간체 누출 수정, 영어 Garosu-gil"
```

---

### Task 10: 통합 검증 (빌드·린트·로컬 Lighthouse)

- [ ] **Step 1: 게이트**

```bash
cd /d/dev/LIV_homepage/liv-clinic
npx tsc --noEmit && npx vitest run && npm run verify:i18n
npx eslint $(git diff --name-only master -- 'liv-clinic/src/**/*.ts' 'liv-clinic/src/**/*.tsx' | sed 's#^liv-clinic/##')
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build
```
Expected: 오류 0, 빌드 성공(정적 페이지 수는 이전 385 이상).

- [ ] **Step 2: 프로덕션 빌드 로컬 실행 + 헤더·무게 확인**

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run start &   # localhost:3000
curl -sI http://localhost:3000/en | grep -i '^link:' || echo "no Link header (OK)"
curl -sI "http://localhost:3000/?lang=ja" | head -3        # 301 → /ja
curl -sI "http://localhost:3000/ko/about?lang=zh-tw" | head -3   # 301 → /zh-TW/about
curl -s http://localhost:3000/robots.txt | grep -c "_next" # 0
curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"   # 385 + 5×11 + zh wechat 1 + 이벤트 N×11
NODE_TLS_REJECT_UNAUTHORIZED=0 npm_config_strict_ssl=false npx --yes lighthouse@12 http://localhost:3000/en --output=json --output-path=../lh-p0-local.json --only-categories=performance,seo --chrome-flags="--headless=new" --quiet
```
Lighthouse JSON에서 `total-byte-weight` ≤ 3,000KiB, `link-text` 통과 확인. 미달이면 원인 자산을 찾아 Task 5·6로 돌아간다.

---

### Task 11: 머지·배포·프로덕션 검증

- [ ] **Step 1: 머지·푸시**

```bash
cd /d/dev/LIV_homepage && git checkout master && git merge --no-ff feature/foreign-seo-p0 -m "Merge branch 'feature/foreign-seo-p0'" && git push origin master
```

- [ ] **Step 2: 배포 완료 감지(60초 × 최대 25회)** — 새 자산이 마커: `curl -k -s -o /dev/null -w "%{http_code}" https://liv-clinic.net/fonts/Paperlogy-4Regular-latin.woff2` 가 200이 되면 배포 완료.

- [ ] **Step 3: 프로덕션 검증 표(보고서에 그대로 옮긴다)**

```bash
curl -k -sI https://liv-clinic.net/en | grep -i '^link:' || echo "no Link header"
curl -k -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://liv-clinic.net/?lang=en"
curl -k -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://liv-clinic.net/ko?lang=ja"
curl -k -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://liv-clinic.net/index.php
curl -k -s -o /dev/null -w "%{http_code}\n" https://liv-clinic.net/no-such-locale.txt   # 404
curl -k -s https://liv-clinic.net/robots.txt | grep -c "_next"                            # 0
curl -k -s https://liv-clinic.net/sitemap.xml | grep -c "<loc>"
curl -k -s https://liv-clinic.net/en/events | grep -c "events/2026-09-promotion"          # ≥1
curl -k -s https://liv-clinic.net/en/reviews | grep -o '<meta name="robots"[^>]*>'
curl -k -s https://liv-clinic.net/ja/lifting/thermage | grep -o '<title>[^<]*'
curl -k -s https://liv-clinic.net/zh-TW/international | grep -c "位于"                     # 0
```
그리고 로컬 Lighthouse를 프로덕션 `https://liv-clinic.net/en`으로 재실행해 총 전송량 비교(사내 프록시 영향은 절대값이 아니라 변화폭으로 판단).

- [ ] **Step 4: 워크트리 정리는 하지 않는다**(`LIV_homepage-slack-rooms`는 다른 작업용).

---

### Task 12: 보고서·사용자 액션 목록·메모리

**Files:**
- Create: `docs/04-report/features/foreign-seo-p0.report.md`
- Modify: 메모리 `liv-foreign-seo-audit-2026-09.md`(배포 커밋·검증 결과 한 줄)

- [ ] **Step 1: 보고서** — 변경 항목(T/S 번호별), 프로덕션 검증 표, Lighthouse 전후, GSC 404 검토 결과, 제외 항목(S5) 사유, 그리고 **사용자만 할 수 있는 작업** 표:

| # | 작업 | 방법 |
|---|---|---|
| U1 | Bing Webmaster Tools 등록 | https://www.bing.com/webmasters → "Import from Google Search Console" → liv-clinic.net 선택. 5분. ChatGPT 검색이 Bing 색인을 쓴다 |
| U2 | Yandex Webmaster 등록 | https://webmaster.yandex.com → 사이트 추가 → HTML 메타 인증(`NEXT_PUBLIC_YANDEX_VERIFICATION` env로 넣어주면 코드 반영) |
| U3 | GA4 속성 소유권 이관 | 측정 ID G-CFDDPRHZ6C가 속한 속성 소유자(대행사 추정)에게 jaeho19@gmail.com 편집자 권한 요청 |
| U4 | 외부 플랫폼 병원명 "LV"→"LIV Plastic Surgery" | 강남언니 글로벌(hospitals/4150) 병원 계정, Yeoshin(hospitals/4667), iCloudHospital 각 관리자 문의 |
| U5 | GSC 사이트맵 재제출 | Search Console → Sitemaps → `https://liv-clinic.net/sitemap.xml` 재제출 |
| U6 | GBP 영문명·언어 확인 | Google Business Profile 관리 화면에서 이름 "LIV Plastic Surgery (리브성형외과)", 언어 속성 English/日本語/中文 |

- [ ] **Step 2: 커밋(문서)**

```bash
git add docs/04-report/features/foreign-seo-p0.report.md docs/superpowers/plans/2026-09-05-foreign-seo-p0.md
git commit -m "docs: 외국인 SEO P0 완료 보고서·실행 계획"
git push origin master
```
