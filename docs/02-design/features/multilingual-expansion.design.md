# Design: 다국어 7개 추가 확장 (Phase 1 — LTR 4 locale)

> **Feature**: `multilingual-expansion`
> **Phase**: Design
> **Created**: 2026-05-10
> **Plan**: `docs/01-plan/features/multilingual-expansion.plan.md`
> **Scope**: Phase 1 only (`zh-TW`, `vi`, `th`, `ru`)

---

## 1. 설계 개요 (Architecture Overview)

본 작업의 핵심은 **하드코딩된 4-locale union을 단일 출처(SSOT)로 통합**한 뒤, 그 출처에 4개 locale을 추가하는 것이다. 메시지 파일·폰트·SEO·sitemap은 모두 SSOT를 참조하도록 리팩터링된다.

### 변경 원칙

1. **Single Source of Truth (SSOT)**: 모든 locale 정의는 `src/i18n/routing.ts`의 `routing.locales`에서 시작
2. **Type 파생**: `Locale` 타입은 `routing.locales` 배열에서 자동 추출 (`typeof routing.locales[number]`)
3. **회귀 0**: 기존 4개 locale 동작은 변경 없이 보존 (URL, 메시지, SEO 모두)
4. **Phase 분리**: 본 design은 Phase 1만 다루며, RTL(아랍어)은 별도 design 문서로 분리

### 설계 후 데이터 흐름

```
src/i18n/routing.ts                      ← SSOT (locale 배열)
   │
   ├─ src/types/index.ts                ← typeof 추출로 Locale 타입 파생
   │     │
   │     ├─ src/i18n/request.ts         (메시지 동적 import)
   │     ├─ src/components/...          (LanguageSwitcher, MobileMenu, FloatingCTA, EventCard 등)
   │     └─ src/lib/treatmentsI18n.ts   (Locale 재export 사용)
   │
   ├─ src/lib/seo.ts                    ← alternates·hreflang·OG locale 자동 생성
   ├─ src/app/sitemap.ts                ← languages map 자동 생성
   └─ src/app/[locale]/layout.tsx       ← skipToContentText 키, 폰트 분기
```

---

## 2. 핵심 데이터 모델 (Core Data Model)

### 2-1. SSOT 구조: `routing.ts`

```ts
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const LOCALES = ['ko', 'zh', 'zh-TW', 'ja', 'en', 'vi', 'th', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'ko',
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Why**: `LOCALES`를 `as const` 배열로 두고 union type을 `typeof[number]`로 파생하면, 미래에 `es`, `mn`, `ar`을 추가할 때 배열 한 줄만 수정하면 되며, 컴파일러가 모든 사용처를 자동 검증한다.

### 2-2. Locale 메타데이터 테이블 (NEW)

```ts
// src/i18n/locales-meta.ts (NEW)
import type { Locale } from './routing';

export interface LocaleMeta {
  code: Locale;
  label: string;          // LanguageSwitcher 우측 약어 (KOR, CHN, ENG…)
  name: string;           // 풀네임 (한국어, 中文, …)
  flag: string;           // 이모지 (단순화)
  htmlLang: string;       // <html lang="..."> 값 (BCP 47)
  ogLocale: string;       // OpenGraph locale (ko_KR, zh_TW, …)
  hreflang: string;       // hreflang (ko-KR, zh-Hant-TW, …)
  fontVariant?: 'thai';   // 비-라틴 폰트가 필요한 locale 표식
  dir?: 'rtl';            // Phase 3에서 사용 (현재 미사용)
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  'ko':    { code: 'ko',    label: 'KOR', name: '한국어',  flag: '🇰🇷', htmlLang: 'ko',    ogLocale: 'ko_KR', hreflang: 'ko-KR' },
  'zh':    { code: 'zh',    label: 'CHN', name: '中文',    flag: '🇨🇳', htmlLang: 'zh-CN', ogLocale: 'zh_CN', hreflang: 'zh-Hans-CN' },
  'zh-TW': { code: 'zh-TW', label: 'TWN', name: '繁體中文', flag: '🇹🇼', htmlLang: 'zh-TW', ogLocale: 'zh_TW', hreflang: 'zh-Hant-TW' },
  'ja':    { code: 'ja',    label: 'JPN', name: '日本語',   flag: '🇯🇵', htmlLang: 'ja',    ogLocale: 'ja_JP', hreflang: 'ja-JP' },
  'en':    { code: 'en',    label: 'ENG', name: 'English', flag: '🇺🇸', htmlLang: 'en',    ogLocale: 'en_US', hreflang: 'en-US' },
  'vi':    { code: 'vi',    label: 'VIE', name: 'Tiếng Việt', flag: '🇻🇳', htmlLang: 'vi',  ogLocale: 'vi_VN', hreflang: 'vi-VN' },
  'th':    { code: 'th',    label: 'THA', name: 'ไทย',     flag: '🇹🇭', htmlLang: 'th',    ogLocale: 'th_TH', hreflang: 'th-TH', fontVariant: 'thai' },
  'ru':    { code: 'ru',    label: 'RUS', name: 'Русский', flag: '🇷🇺', htmlLang: 'ru',    ogLocale: 'ru_RU', hreflang: 'ru-RU' },
};

export const LOCALE_ORDER: Locale[] = ['ko', 'zh', 'zh-TW', 'ja', 'en', 'vi', 'th', 'ru'];
```

**Why**: 모든 locale 부가 정보를 한 파일에 모아 `LanguageSwitcher`, `MobileMenu`, `seo.ts`, `sitemap.ts`, `[locale]/layout.tsx` 등이 동일 출처를 참조하게 한다. 시장 규모 기반 정렬 순서(`LOCALE_ORDER`)도 분리한다 (FR-10).

### 2-3. `types/index.ts` 단순화

```ts
// src/types/index.ts
export type { Locale } from '@/i18n/routing';
export { LOCALES as locales } from '@/i18n/routing';
```

**Why**: 타입은 한 곳에서만 정의. 기존 `Locale = 'ko' | 'en' | 'ja' | 'zh'` 하드코딩 제거.

---

## 3. 컴포넌트 설계 (Component Design)

### 3-1. `LanguageSwitcher.tsx` 리팩터링

**Before**: `languages` 배열 인라인 정의 + 2곳에 `'ko' | 'en' | 'ja' | 'zh'` 하드코딩.

**After**:
```tsx
import { LOCALE_META, LOCALE_ORDER } from '@/i18n/locales-meta';
import type { Locale } from '@/i18n/routing';

// 컴포넌트 내부
const languages = LOCALE_ORDER.map((code) => LOCALE_META[code]);
// router.replace 시 cast 제거: { locale: langCode as Locale } — Locale은 SSOT 파생이라 안전
```

**드롭다운 UX 변화**:
- 8개 항목 → 드롭다운 높이 증가. `max-h-[80vh] overflow-y-auto` 추가하여 모바일 스크롤 가능.
- 항목 클릭 영역 `min-h-[44px]` 유지 (터치 타겟 NFR).

### 3-2. `MobileMenu.tsx` (75행 cast 제거)

`MobileMenu.tsx:75`의 `langCode as 'ko' | 'en' | 'ja' | 'zh'`를 `langCode as Locale`로 통합. 기타 메뉴 로직은 변경 없음.

### 3-3. `[locale]/layout.tsx` (skipToContentText 다국어 확장)

**Before**: 4개 locale 하드코딩 객체 + `as 'ko' | 'en' | 'ja' | 'zh'` cast.

**After**: 메시지 키로 이전.
```ts
// messages/{locale}.json
"common": {
  "skipToContent": "본문으로 건너뛰기"  // ← 신규 키
}
```
```tsx
// layout.tsx
const t = await getTranslations({ locale, namespace: 'common' });
<a href="#main-content" className="skip-link">{t('skipToContent')}</a>
```

**Why**: 신규 4개 locale에 자동으로 적용되며, 기존 객체 매핑 + cast가 함께 사라진다.

**locale validation cast도 제거**:
```ts
// Before
if (!routing.locales.includes(locale as 'ko' | 'en' | 'ja' | 'zh')) notFound();
// After
if (!routing.locales.includes(locale as Locale)) notFound();
```

### 3-4. `FloatingCTA.tsx` (9행 type alias 제거)

자체 `type Locale = 'ko' | 'en' | 'ja' | 'zh'` 선언을 `import type { Locale } from '@/i18n/routing'`로 교체. `buttonOrderByLocale`은 4개 추가 locale에서도 동일 순서(`['instagram', 'youtube', 'phone']`) 적용 — Phase 1 범위 내 단순화.

### 3-5. `EventCard.tsx`, `events/page.tsx`, `events/[eventId]/EventDetailClient.tsx`, `before-after/page.tsx`

모두 동일 패턴 — `useLocale() as 'ko' | 'en' | 'ja' | 'zh'` → `useLocale() as Locale`로 교체.

⚠️ **이벤트·팝업 fallback 처리**: 이 컴포넌트들은 Supabase에서 단일 언어 콘텐츠를 가져온다. 신규 locale에서는 다음 정책을 적용한다:

| 신규 locale | Fallback 우선순위 |
|-------------|-------------------|
| `zh-TW`     | `zh` → `en` → `ko` |
| `vi`, `th`, `ru` | `en` → `ko` |

구현 위치: `EventCard.tsx`/`EventDetailClient.tsx` 내 콘텐츠 선택 분기 로직. Supabase 컬럼은 `title`, `title_en`, `title_zh`, `title_ja`만 존재하므로 본 PDCA에서는 **컬럼 추가 없이 fallback 전략**만 적용 (DB 다국어화는 별도 PDCA).

---

## 4. 메시지 파일 설계 (Translation Files)

### 4-1. 키 동기화 전략

`ko.json`을 master로 두고, **모든 locale 파일이 동일한 키 트리**를 가진다. 이를 강제하기 위한 빌드-전 검증 스크립트를 신규 추가:

```js
// scripts/verify-locale-keys.mjs (NEW)
import fs from 'node:fs';
import path from 'node:path';

const LOCALES = ['ko', 'zh', 'zh-TW', 'ja', 'en', 'vi', 'th', 'ru'];
const MASTER = 'ko';

function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v)
      ? flatKeys(v, key)
      : [key];
  });
}

const masterKeys = new Set(flatKeys(JSON.parse(fs.readFileSync(`src/messages/${MASTER}.json`, 'utf8'))));
let failed = false;

for (const loc of LOCALES) {
  if (loc === MASTER) continue;
  const keys = new Set(flatKeys(JSON.parse(fs.readFileSync(`src/messages/${loc}.json`, 'utf8'))));
  const missing = [...masterKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !masterKeys.has(k));
  if (missing.length || extra.length) {
    console.error(`[${loc}] missing: ${missing.length}, extra: ${extra.length}`);
    if (missing.length) console.error('  missing:', missing.slice(0, 10));
    if (extra.length) console.error('  extra:', extra.slice(0, 10));
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('✓ All locale files in sync.');
```

`package.json` 수정:
```json
{
  "scripts": {
    "verify:i18n": "node scripts/verify-locale-keys.mjs",
    "prebuild": "npm run verify:i18n"
  }
}
```

**Why**: 빌드 시 누락 키 에러로 즉시 차단 → 부분 번역 상태로 배포되는 것을 막는다 (NFR-03).

### 4-2. 신규 4개 메시지 파일 생성 절차

1. `src/messages/ko.json`을 baseline으로 복사 → `src/messages/{zh-TW,vi,th,ru}.json`
2. 각 파일을 LLM 1차 번역 (체크리스트):
   - 의료 전문 용어집(separate file): 울쎄라피 / 써마지 / 보톡스 / 필러 / HIFU / RF / Anti-aging 등 표준 번역 고정
   - 고유명사 보존: 시술명 영문 표기, 병원명 `LIV`, `리브성형외과`
   - 키 구조 100% 보존 (`scripts/verify-locale-keys.mjs` 통과)
3. `treatmentsI18n.ts`에 4개 locale block 추가 (별도 작업, ~9개 시술 × 4 locale)

**번역 워크플로우 (별도 합의 사항)**:
- 1차: Claude/GPT를 활용한 일괄 자동 번역
- 2차(권장): 각 locale 네이티브 1회 검수 (의료 용어 위주)
- 본 PDCA에서는 1차까지 완료 → 스테이징 배포 → 후속 검수 트래킹은 별도 이슈

### 4-3. 폰트 분기 (태국어 예외)

태국어 글리프는 Pretendard에 미포함되므로 별도 폰트 추가:

```ts
// src/styles/fonts.ts (수정)
import { Cormorant_Garamond, Noto_Sans_Thai } from 'next/font/google';
import localFont from 'next/font/local';

export const pretendard = localFont({ /* 기존 그대로 */ });
export const cormorant = Cormorant_Garamond({ /* 기존 그대로 */ });

export const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-thai',
  display: 'swap',
});
```

```tsx
// [locale]/layout.tsx (수정)
import { pretendard, cormorant, notoSansThai } from '@/styles/fonts';

const fontClassName = locale === 'th'
  ? `${notoSansThai.variable} ${cormorant.variable}`
  : `${pretendard.variable} ${cormorant.variable}`;

return (
  <html lang={LOCALE_META[locale as Locale].htmlLang} className={fontClassName}>
    ...
  </html>
);
```

```css
/* globals.css (수정) */
:root {
  --font-sans: var(--font-pretendard), var(--font-noto-thai), system-ui, sans-serif;
}
/* :lang(th) 분기는 자동 — body 폰트가 var(--font-sans)를 따라가므로 fallback 체인 동작 */
```

**Why**: 태국어 페이지에서만 `Noto Sans Thai`를 메인 폰트로 사용하고, 나머지 locale은 Pretendard 그대로. 베트남어·러시아어는 Pretendard Variable의 라틴/Cyrillic 글리프로 커버 가능 (사전 검증 필요).

### 4-4. 베트남어·러시아어 폰트 검증 (구현 전 체크)

| Locale | 검증 방법 | 폴백 |
|--------|-----------|------|
| `vi` | Pretendard에 베트남어 diacritics(á, ấ, ự, ặ, ọ̟ 등) 글리프 확인 | 누락 시 `Be Vietnam Pro` 추가 |
| `ru` | Pretendard에 Cyrillic 글리프 확인 | 누락 시 `Inter` 또는 시스템 sans |

검증 절차: 빌드 후 스테이징에서 `/vi`, `/ru` 메인 페이지 시각 확인. 글리프 누락 발견 시 Phase 1 안에서 폰트 추가.

---

## 5. SEO·sitemap 설계

### 5-1. `seo.ts` 리팩터링

**Before**: `seoConfig`, `alternates.languages`, `og.locale`, `generateLocalBusinessSchema`의 `descriptions`/`names`가 모두 4개 locale 하드코딩.

**After**:
```ts
// src/lib/seo.ts (수정)
import { LOCALES, type Locale } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';

export const seoConfig: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  // 기존 4개 + 4개 신규 추가
  ko: { /* 기존 */ },
  en: { /* 기존 */ },
  ja: { /* 기존 */ },
  zh: { /* 기존 */ },
  'zh-TW': { /* 신규 — 번체 중국어 */ },
  vi: { /* 신규 */ },
  th: { /* 신규 */ },
  ru: { /* 신규 */ },
};

// alternates.languages — LOCALE_META에서 자동 생성
function buildHreflangMap(path: string): Record<string, string> {
  return Object.fromEntries(
    LOCALES.map((code) => [LOCALE_META[code].hreflang, `${BASE_URL}/${code}${path}`])
  );
}

// generatePageMetadata 수정
alternates: {
  canonical: url,
  languages: buildHreflangMap(path),
},

// og.locale 수정
openGraph: {
  // ...
  locale: LOCALE_META[locale as Locale]?.ogLocale ?? 'en_US',
},
```

`generateLocalBusinessSchema`도 동일 패턴으로 LOCALE_META에서 description/name을 lookup. 단 시장 규모상 `name`(병원명)은 ko/en/ja/zh 4개만 의미가 있으므로 신규 locale은 영문 `LIV Plastic Surgery` fallback으로 충분.

### 5-2. `sitemap.ts` 리팩터링

```ts
// src/app/sitemap.ts (수정)
import { LOCALES } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';

const languagesMap = (path: string) =>
  Object.fromEntries(LOCALES.map((code) => [code, `${BASE_URL}/${code}${path}`]));

// for-loop에서 alternates.languages: languagesMap(page.path)로 교체
```

**예상 sitemap entries**:
- 현재: 4 locale × 73 페이지 ≈ 292 entries
- Phase 1 후: 8 locale × 73 페이지 ≈ 584 entries (+292)
- Google Search Console 신규 sitemap 제출 필요

### 5-3. hreflang 표준 (BCP 47)

| Locale | hreflang | 비고 |
|--------|----------|------|
| `ko`     | `ko-KR`         | (기존) |
| `en`     | `en-US`         | (기존, 미국 영어) |
| `ja`     | `ja-JP`         | (기존) |
| `zh`     | `zh-Hans-CN`    | (변경) 기존 `zh-CN`에서 명시적 간체 표기로 강화 |
| `zh-TW`  | `zh-Hant-TW`    | 신규 — 번체 명시 |
| `vi`     | `vi-VN`         | 신규 |
| `th`     | `th-TH`         | 신규 |
| `ru`     | `ru-RU`         | 신규 |

`x-default`는 `ko` 또는 `en` 중 하나 추가 검토(현재는 누락 — design 단계에서 추가 권장).

---

## 6. 구현 순서 (Implementation Order)

> 각 단계는 **독립적으로 빌드 가능**해야 하며, 한 단계가 깨지면 다음으로 진행하지 않는다.

### Step 1 — SSOT 통합 (회귀 0, 신규 locale 미추가)
1. `src/i18n/locales-meta.ts` 신규 생성 (4개 locale만, 기존 패턴)
2. `src/i18n/routing.ts`에 `LOCALES`, `Locale` 추출 추가 (배열 내용은 4개 그대로)
3. `src/types/index.ts`를 re-export로 단순화
4. 9개 사용처에서 하드코딩 union → `Locale` 교체
5. `seo.ts`·`sitemap.ts`에서 `LOCALE_META` 참조로 변환 (4개 그대로 동작)
6. `[locale]/layout.tsx`에서 `skipToContent`를 메시지 키로 전환 + 4개 locale에 키 추가

**검증**: `npx tsc --noEmit` → 0 errors / `npm run build` → 정상 / 기존 4개 locale URL 모두 동작.

### Step 2 — locale 배열 확장 + 메시지 파일 추가
1. `LOCALES` 배열에 `'zh-TW', 'vi', 'th', 'ru'` 추가
2. `LOCALE_META`에 4개 신규 entry 추가
3. `seoConfig`에 4개 신규 (title/description/keywords) 추가
4. `messages/{zh-TW,vi,th,ru}.json` 4개 파일 LLM 1차 번역으로 생성
5. `scripts/verify-locale-keys.mjs` 신규 + `prebuild` 훅 등록

**검증**: `npm run verify:i18n` 통과 / `npm run build` 통과 / 신규 4개 URL `/zh-TW`, `/vi`, `/th`, `/ru` 메인 페이지 정상 렌더.

### Step 3 — 시술 데이터 locale override 확장
1. `treatmentsI18n.ts`에 `ZH_TW`, `VI`, `TH`, `RU` LocaleMap 4개 추가
2. 각 LocaleMap에 9개 시술(`ulthera`, `thermage`, `shurink`, `inmode`, `density`, `thread`, `botox`, `filler`, `skinbooster`) override 작성

**검증**: 8개 detail 컴포넌트(`UltheraDetail` 등)에서 신규 locale 시 현지어 렌더 / 한국어 fallback 잔존 0건.

### Step 4 — 폰트 분기 (태국어)
1. `src/styles/fonts.ts`에 `notoSansThai` 추가
2. `[locale]/layout.tsx`에서 locale === 'th' 분기 적용
3. `globals.css`에서 `--font-sans` fallback 체인 업데이트

**검증**: `/th` 페이지에서 ก-ฮ, ◌ิ◌ี◌ู◌ู 글리프 정상 / `/vi`, `/ru` 글리프 시각 검증 (누락 시 Be Vietnam Pro / Inter 추가)

### Step 5 — Supabase 콘텐츠 fallback
1. `EventCard.tsx`, `EventDetailClient.tsx`에 fallback 함수 적용
2. before-after / events 목록에서 동일 처리

**검증**: `/zh-TW/events`에서 zh 콘텐츠 표시 / `/vi/events`에서 en 콘텐츠 표시 / 콘솔 에러 0건.

### Step 6 — 빌드·SEO·sitemap 최종 점검
1. `npm run build` → 0 errors / 8 locale × 73 page 모두 prerender 정상
2. sitemap.xml 8 locale × 73 page entries 확인
3. hreflang 메타 태그 8개 alternate 확인 (HTML head)
4. Lighthouse SEO ≥90 (각 locale 메인)

---

## 7. 핵심 파일 변경 요약

| 파일 | 변경 유형 | 핵심 수정 |
|------|-----------|----------|
| `src/i18n/routing.ts` | 수정 | `LOCALES` 상수 + `Locale` 타입 export, 배열 8개로 확장 |
| `src/i18n/locales-meta.ts` | **신규** | `LOCALE_META`, `LOCALE_ORDER` |
| `src/types/index.ts` | 수정 | `Locale` re-export로 단순화 |
| `src/messages/zh-TW.json` | **신규** | 번체 중국어 번역 (~4,000줄) |
| `src/messages/vi.json` | **신규** | 베트남어 번역 |
| `src/messages/th.json` | **신규** | 태국어 번역 |
| `src/messages/ru.json` | **신규** | 러시아어 번역 |
| `src/messages/{ko,en,ja,zh}.json` | 수정 | `common.skipToContent` 키 추가 |
| `src/lib/treatmentsI18n.ts` | 수정 | `Locale` import, 4개 locale block 추가 |
| `src/lib/seo.ts` | 수정 | `LOCALE_META` 사용, `seoConfig` 4개 추가, alternates 자동 생성 |
| `src/app/sitemap.ts` | 수정 | `LOCALES` 동적 사용 |
| `src/app/[locale]/layout.tsx` | 수정 | `skipToContent` 메시지 키, 폰트 분기, locale validation cast 단순화 |
| `src/styles/fonts.ts` | 수정 | `notoSansThai` 추가 |
| `src/app/globals.css` | 수정 (조건부) | `--font-sans` fallback 체인 |
| `src/components/layout/LanguageSwitcher.tsx` | 수정 | `LOCALE_META` 사용, 8개 항목 |
| `src/components/layout/MobileMenu.tsx` | 수정 | locale cast 단순화 |
| `src/components/layout/FloatingCTA.tsx` | 수정 | `Locale` SSOT 사용 |
| `src/components/sections/EventCard.tsx` | 수정 | locale cast + Supabase fallback |
| `src/app/[locale]/events/page.tsx` | 수정 | 동일 |
| `src/app/[locale]/events/[eventId]/EventDetailClient.tsx` | 수정 | 동일 |
| `src/app/[locale]/before-after/page.tsx` | 수정 | locale cast 단순화 |
| `scripts/verify-locale-keys.mjs` | **신규** | 빌드 전 키 sync 검증 |
| `package.json` | 수정 | `prebuild` 훅 + `verify:i18n` 스크립트 |

**총 변경 파일 수**: ~22개 (그 중 신규 6개)

---

## 8. 검증 전략

### 8-1. 정적 검증 (CI 단계)
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors
- `npm run verify:i18n` → 키 동기화 통과
- `npm run build` → exit 0, missing translation key warning 0건

### 8-2. 회귀 검증 (4개 기존 locale)
- `/ko`, `/en`, `/ja`, `/zh` 메인 페이지 시각 확인 — 현재와 동일 렌더
- 시술 상세 8개 (`/ko/lifting/ulthera` 등) — TREATMENTS 데이터 그대로
- 이벤트·팝업·플로팅 CTA 모두 동작
- hreflang 메타에 새 locale 추가되었지만 기존 4개 alternate URL 동일

### 8-3. 신규 locale 검증
| 검증 항목 | 방법 |
|-----------|------|
| URL 라우팅 | `/zh-TW`, `/vi`, `/th`, `/ru` 메인·시술·about·contact 모두 200 OK |
| 메시지 렌더 | Footer/Header/MobileMenu 텍스트가 현지어 |
| 시술 데이터 | `targetAreas`, `process`, `faqs` 현지어 (KOR/ENG 잔존 0건) |
| 폰트 | 태국어 글리프 정상, 베트남어 diacritics, 러시아어 Cyrillic 깨짐 0건 |
| LanguageSwitcher | 8개 노출, 정렬 순서, 클릭 시 동일 경로 이동 |
| sitemap | `<url>` 8개 locale × 73개 페이지 |
| hreflang | `<link rel="alternate">` 8개 |
| Supabase fallback | 이벤트·팝업이 신규 locale에서 영어 또는 한국어로 fallback (정책대로) |
| Lighthouse SEO | 각 신규 locale 메인 페이지 ≥90 |

### 8-4. 수동 스모크 시나리오 (배포 전)
1. `/zh-TW`로 접속 → LanguageSwitcher에서 `vi`로 전환 → `/vi/...` 동일 경로 이동 확인
2. `/th/lifting/ulthera` → 태국어 글리프 + Process step + FAQ 현지어
3. `/ru/contact` → 폼 라벨, 동의 텍스트, 에러 메시지 모두 러시아어
4. `/zh-TW/events` → fallback이 `zh`(간체) 또는 `en`으로 정상 표시
5. 모바일(<375px) 햄버거 메뉴 — 8개 언어 스크롤 가능

---

## 9. 리스크 매트릭스 및 완화 (Design 단계 보강)

| 리스크 | 영향도 | 발생 가능성 | 완화 |
|--------|--------|-------------|------|
| LLM 번역 의료 용어 오역 | High | High | 용어집 사전 정의 (`docs/i18n-glossary.md` 신규) + 네이티브 1회 검수 |
| 빌드 시 키 누락 미감지 | High | Medium | `verify-locale-keys.mjs` + prebuild 훅으로 강제 |
| 베트남어 diacritics 깨짐 | Medium | Medium | 스테이징에서 시각 확인. 누락 시 `Be Vietnam Pro` 추가 (Step 4 안에서 처리) |
| 태국어 폰트 로딩 지연 | Low | Low | `display: 'swap'` + Noto Sans Thai subsets:['thai'] |
| 러시아어 Cyrillic 미커버 | Medium | Low | 동일 검증 |
| Supabase fallback 누락 — 신규 locale에서 한국어 노출 | Medium | High | EventCard·EventDetailClient·before-after 3곳에 fallback 함수 강제 적용. 코드 리뷰 체크리스트 항목으로 등록 |
| zh-TW URL의 검색엔진 캐노니컬 충돌 | Low | Medium | hreflang `zh-Hant-TW` 명시 + `zh-CN` → `zh-Hans-CN` 명시화로 두 locale 분리 |
| Phase 2/3에서 SSOT 한계 노출 (예: locale별 메뉴 차이) | Low | Low | `LOCALE_META` 확장 가능 구조이므로 Phase 2 시 필요 필드 추가만 |
| sitemap URL 폭증으로 크롤링 부담 | Low | Low | Search Console에서 신규 locale 인덱싱 추적. priority 차등 검토 |
| 번역 외주 미완으로 일부 locale이 영어 잔존 | Medium | Medium | `verify-locale-keys.mjs`는 키만 체크 — 값 품질은 별도 검수. **베이스라인 = LLM 번역**을 명시하고 후속 검수는 별도 이슈 |

---

## 10. 합의 사항 (Confirmed Decisions, 2026-05-10)

| # | 항목 | 결정 | 영향 |
|---|------|------|------|
| 1 | **번역 워크플로우** | **LLM 1차 번역만 사용** (Claude로 일괄 번역 후 별도 검수 없이 배포) | 일정 단축, 외주 비용 0. 출시 후 사용자 피드백 기반으로 점진 수정 |
| 2 | **Supabase fallback** | **방법 A — 영어 fallback** | 신규 locale(`zh-TW`/`vi`/`th`/`ru`)에서 이벤트·팝업이 `_en` 컬럼 우선 표시. `_en` 부재 시 한국어. |
| 3 | **의료 용어** | **`docs/i18n-glossary.md` 용어집을 LLM 프롬프트에 주입** | 시술명·기기명 표준 표기 강제. 영문 제품명(Thermage FLX, InMode)은 그대로 유지 |
| 4 | **브랜드명** | **LIV 통일** | 4개 신규 locale 모두 `LIV` 또는 `LIV Plastic Surgery`/`LIV 整形外科`(zh-TW). `seo.ts`의 `names` 매핑 단순 확장 |
| 5 | **PR 전략** | **옵션 B — 2개 PR 분리** | **PR #1**: Step 1(SSOT 리팩터링, 회귀 0) / **PR #2**: Step 2~6(4개 locale 추가) |

### 5번 결정에 따른 작업 분할 명세

#### PR #1 — SSOT 리팩터링 (사용자 노출 변화 0)
- `src/i18n/locales-meta.ts` 신규 (4개 locale만, 기존 그대로)
- `src/i18n/routing.ts`에 `LOCALES`, `Locale` export 추가
- `src/types/index.ts` re-export로 단순화
- 9곳 하드코딩 union → `Locale` 교체
- `seo.ts`·`sitemap.ts`에서 `LOCALE_META` 참조 (출력은 동일)
- `[locale]/layout.tsx`에서 `skipToContent` 메시지 키로 전환 + 4개 locale `common.skipToContent` 추가
- **검증**: 기존 4개 locale 회귀 0 (URL·메시지·SEO·sitemap 모두 동일 출력)
- **머지 후**: 즉시 프로덕션 배포 가능 (사용자 영향 0)

#### PR #2 — 4개 locale 추가 (Step 2~6)
- `LOCALES` 배열에 `'zh-TW', 'vi', 'th', 'ru'` 추가 + `LOCALE_META` 4개 entry
- `messages/{zh-TW,vi,th,ru}.json` 4개 신규 (Claude로 ko.json 일괄 번역, 용어집 적용)
- `treatmentsI18n.ts`에 4개 locale block 추가 (9 시술 × 4 locale)
- `seoConfig` 4개 신규 (title/description/keywords)
- 폰트 분기 (`Noto Sans Thai` 추가, 베트남어/러시아어는 검증 후 결정)
- Supabase 콘텐츠에 영어 fallback 적용 (`EventCard`, `EventDetailClient`, `before-after`)
- `scripts/verify-locale-keys.mjs` 신규 + `prebuild` 훅
- **검증**: 신규 4개 URL 정상, sitemap·hreflang 8 locale 노출, Lighthouse SEO ≥90

---

## 11. 다음 단계

- **합의 사항 5건 확정** 후 → `/pdca do multilingual-expansion`
- Do 단계: Step 1~6 순차 구현 (Step 1만 먼저 PR로 분리 가능)
- 이후 `/pdca analyze multilingual-expansion`으로 수용 기준 기반 Gap 분석

---

## 12. 참고

- Plan 문서: `docs/01-plan/features/multilingual-expansion.plan.md`
- 선행 PDCA: `docs/01-plan/features/zh-i18n-fix.plan.md` (treatmentsI18n.ts 패턴 도입)
- 기존 i18n 구조: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/types/index.ts`
- next-intl 공식 문서: <https://next-intl.dev/docs/getting-started/app-router>
- BCP 47 hreflang 표준: <https://www.w3.org/International/articles/language-tags/>
