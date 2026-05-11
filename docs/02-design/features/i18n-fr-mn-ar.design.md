# Design: 다국어 3개 추가 — 프랑스어 · 몽골어 · 아랍어 (RTL 도입)

> **Feature**: `i18n-fr-mn-ar`
> **Phase**: Design
> **Created**: 2026-05-11
> **Owner**: jaeho19@gmail.com
> **Plan**: `docs/01-plan/features/i18n-fr-mn-ar.plan.md`
> **Decisions (Plan §11 확정)**:
> - vi/th/ru/zh-TW의 `treatmentsI18n` 누락은 **별도 hotfix PDCA로 분리**
> - RTL 마이그레이션: **핵심 5종 컴포넌트** + 발견 즉시 hotfix
> - 번역: **LLM 1차 + 의료 용어집** + 출시 후 네이티브 검수
> - LanguageSwitcher 순서: `ko · zh · zh-TW · ja · en · fr · vi · th · mn · ru · ar`

---

## 1. 아키텍처 개요 (Architecture)

### 1.1 영향 영역

```
┌───────────────────────────────────────────────────────────────┐
│  i18n Single Source of Truth (SSOT)                           │
│  ┌─────────────────────┐         ┌──────────────────────────┐ │
│  │ routing.ts          │         │ locales-meta.ts          │ │
│  │  LOCALES[]  +3      │────────▶│  LOCALE_META  +3 entries │ │
│  │                     │         │  LOCALE_ORDER  +3 (재정렬) │ │
│  │                     │         │  dir: 'rtl' on `ar` 활성화│ │
│  └─────────────────────┘         └──────────────────────────┘ │
│           │                                  │                │
│           ▼ (auto-propagation)               ▼                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 자동 확장 (코드 변경 불필요)                              │   │
│  │  - app/sitemap.ts (LOCALES 직접 사용)                  │   │
│  │  - lib/seo.ts → buildHreflangMap (LOCALES 직접 사용)   │   │
│  │  - LanguageSwitcher.tsx (LOCALE_ORDER 직접 사용)       │   │
│  │  - request.ts (LOCALES 검증)                           │   │
│  └────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  콘텐츠/UI 레이어 (직접 작업 필요)                                │
│                                                               │
│  A. 번역 파일                                                  │
│     messages/{fr,mn,ar}.json (신규 3개, 약 5,600줄 × 3)        │
│                                                               │
│  B. 시술 i18n 오버라이드                                         │
│     lib/treatmentsI18n.ts                                     │
│       - FR, MN, AR LocaleMap 신규 (~80~100줄/locale)           │
│       - MAPS 객체에 등록                                        │
│       - RELATED_TREATMENTS_L10N 추가                            │
│                                                               │
│  C. SEO 메타데이터                                              │
│     lib/seo.ts                                                │
│       - seoConfig: fr/mn/ar 추가 (title/description/keywords)  │
│       - generateLocalBusinessSchema: NAMES 매핑 3개 추가         │
│       - generateWebSiteSchema: inLanguage 11개로 확장           │
│       - generateWebPageSchema: inLanguage 매핑 확장             │
│                                                               │
│  D. 폰트                                                       │
│     styles/fonts.ts                                           │
│       - Noto_Sans_Arabic 추가 (next/font/google)               │
│                                                               │
│  E. RTL 인프라                                                  │
│     app/[locale]/layout.tsx                                   │
│       - <html dir={...}> 동적 적용                             │
│       - locale === 'ar' 시 arabic 폰트 클래스 추가              │
│       - ChatWidget 노출 조건 재검토                              │
│                                                               │
│  F. RTL 핵심 5종 컴포넌트 logical properties 마이그레이션         │
│     - layout/Header.tsx                                       │
│     - layout/Footer.tsx                                       │
│     - layout/FloatingCTA.tsx                                  │
│     - layout/MobileMenu.tsx                                   │
│     - sections/Hero*.tsx                                      │
│                                                               │
│  G. 빌드 검증                                                   │
│     scripts/verify-locale-keys.mjs                            │
│       - LOCALES 하드코딩 배열 11개로 확장                        │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 데이터 흐름 (RTL 분기)

```
URL /ar/lifting/ulthera  →  [locale]/layout.tsx
                              │
                              ├─ params.locale = 'ar'
                              ├─ LOCALE_META['ar'].dir = 'rtl'
                              ├─ LOCALE_META['ar'].htmlLang = 'ar'
                              └─ <html lang="ar" dir="rtl" className="... font-arabic">
                                   │
                                   └─ Tailwind logical classes (ms-*, me-*, etc.)
                                        + 컴포넌트 내부 dir-aware 분기
                                        (Framer Motion x값 부호 등)
```

---

## 2. 데이터 구조 (Data Schema)

### 2.1 `LOCALE_META` 신규 항목

```ts
// src/i18n/locales-meta.ts (LOCALE_META 객체에 추가)
fr: {
  code: 'fr',
  label: 'FRA',
  name: 'Français',
  flag: '🇫🇷',
  htmlLang: 'fr',
  ogLocale: 'fr_FR',
  hreflang: 'fr-FR',
},
mn: {
  code: 'mn',
  label: 'MNG',
  name: 'Монгол',          // 키릴 표기
  flag: '🇲🇳',
  htmlLang: 'mn',
  ogLocale: 'mn_MN',
  hreflang: 'mn-MN',
},
ar: {
  code: 'ar',
  label: 'ARA',
  name: 'العربية',          // 아랍어 표기
  flag: '🇸🇦',
  htmlLang: 'ar',
  ogLocale: 'ar_SA',
  hreflang: 'ar',           // 비지역화 표준 (MSA)
  fontVariant: undefined,   // 별도 처리 — layout.tsx에서 직접 클래스 적용
  dir: 'rtl',               // ⭐ RTL 활성화 키
},
```

### 2.2 `LOCALES` 배열

```ts
// src/i18n/routing.ts
export const LOCALES = [
  'ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru',
  'fr', 'mn', 'ar',                                    // +3
] as const;
```

### 2.3 `LOCALE_ORDER` 재정렬

```ts
// src/i18n/locales-meta.ts
// 의료관광 시장 우선순위 + RTL은 마지막 배치 (브라우저 reflow 최소화)
export const LOCALE_ORDER: Locale[] = [
  'ko', 'zh', 'zh-TW', 'ja', 'en',
  'fr',
  'vi', 'th',
  'mn',
  'ru',
  'ar',                                                 // RTL 마지막
];
```

### 2.4 번역 파일 키 구조 (mirror of `ko.json`)

```
messages/
├── ko.json          (마스터, 5,616줄, ~770 keys)
├── en.json, ja.json, zh.json, zh-TW.json, vi.json, th.json, ru.json
├── fr.json  ⭐ 신규
├── mn.json  ⭐ 신규
└── ar.json  ⭐ 신규
```

각 신규 파일은 `verify-locale-keys.mjs` 통과를 위해 `ko.json`의 모든 flat 키를 100% 포함해야 함. 누락 시 빌드 FAIL.

**최상위 키 (마스터 기준)**:
- `common`, `nav`, `hero`, `sections`, `footer`, `meta`, `contact`, `medical` 등 11개 네임스페이스
- 일부 locale-only 키(예: `wechatPage.*`는 zh, `chat.*`는 en/ja/zh)는 WARN만 발생, FAIL 아님

### 2.5 `treatmentsI18n.ts` LocaleMap 패턴

기존 `ZH`/`EN`/`JA`와 동일한 구조로 `FR`/`MN`/`AR` 신규 작성. 시술 9종(ulthera/thermage/shurink/inmode/density/thread/botox/filler/skinbooster) × 9 필드(targetAreas/idealFor/cautions/duration/anesthesia/recovery/results/process/faqs).

```ts
// src/lib/treatmentsI18n.ts (예시 — ulthera 항목)
const FR: LocaleMap = {
  ulthera: {
    tagline: 'Lifting HIFU certifié FDA – raffermissement en profondeur',
    shortDesc: 'Approuvé par la FDA américaine et le MFDS coréen, le standard mondial du lifting HIFU',
    targetAreas: ['Front', 'Contour des yeux', 'Joues', 'Ovale du visage', 'Cou'],
    idealFor: ['Personnes recherchant un lifting non chirurgical', '...'],
    cautions: ['Légers gonflements ou rougeurs possibles après le traitement', '...'],
    duration: '60-90 minutes',
    anesthesia: 'Crème anesthésiante (30 min)',
    recovery: 'Reprise immédiate des activités quotidiennes',
    results: 'Amélioration progressive sur 3-6 mois, durée 1-2 ans',
    process: [
      { step: 1, title: 'Consultation', desc: '...' },
      // ...
    ],
    faqs: [/* ... */],
  },
  // thermage, shurink, inmode, density, thread, botox, filler, skinbooster, laser
};

const MN: LocaleMap = { /* 키릴, 동일 구조 */ };
const AR: LocaleMap = { /* 아랍어, 동일 구조 */ };

const MAPS: Partial<Record<Locale, LocaleMap>> = {
  ko: {},
  en: EN,
  zh: ZH,
  ja: JA,
  'zh-TW': {}, vi: {}, th: {}, ru: {},               // 기존 fallback 유지 (별도 hotfix PDCA)
  fr: FR,                                             // ⭐ 신규
  mn: MN,                                             // ⭐ 신규
  ar: AR,                                             // ⭐ 신규
};
```

### 2.6 `seoConfig` 신규 항목 (lib/seo.ts:28)

```ts
fr: {
  title: 'LIV Chirurgie Esthétique | Anti-âge premium non chirurgical à Sinsa Séoul',
  description: 'Clinique officielle certifiée Ultherapy Prime et Thermage FLX à Séoul, Corée. Solution de lifting Anti-Gravity au-delà de la gravité. À 1 min de la station Sinsa sortie 4. Spécialistes Botox, fillers, skin boosters, fils tenseurs, laser.',
  keywords: [
    'LIV Chirurgie Esthétique', 'clinique Séoul', 'chirurgie esthétique Corée',
    'lifting non chirurgical Séoul', 'Ultherapy Corée', 'Thermage Séoul',
    'Botox Séoul', 'filler Corée', 'skin booster', 'fils tenseurs Corée',
    'anti-âge premium Séoul', 'tourisme médical Corée', 'clinique K-beauty',
  ],
},
mn: {
  title: 'LIV Гоо Заслын Эмнэлэг | Шинса дахь премиум мэс заслын бус залуужуулалт',
  description: 'Ultherapy Prime, Thermage FLX-ийн албан ёсны баталгаажуулсан эмнэлэг. Таталцлаас давсан гоо сайхан, Anti-Gravity лифтинг шийдэл. Шинса метроны 4-р гарцаас 1 минутын зайтай.',
  keywords: [
    'LIV гоо заслын эмнэлэг', 'Сөүл лазер', 'Солонгос мэс заслын бус залуужуулалт',
    'Ultherapy Солонгос', 'Thermage Сөүл', 'Ботокс Солонгос', 'Филлер',
    'Утсан лифтинг', 'HIFU лифтинг', 'Премиум залуужуулалт', 'Анагаах ухааны аялал жуулчлал Солонгос',
  ],
},
ar: {
  title: 'مستشفى ليف للتجميل | مكافحة الشيخوخة المتقدمة بدون جراحة في سيول',
  description: 'مستشفى معتمد رسمياً لـ Ultherapy Prime و Thermage FLX في سيول، كوريا. حل شد بشرة Anti-Gravity متجاوزاً الجاذبية. على بُعد دقيقة واحدة من محطة سينسا، المخرج 4. متخصصون في البوتوكس والفيلر وحقن البشرة والخيوط والليزر.',
  keywords: [
    'مستشفى ليف للتجميل', 'تجميل كوريا', 'شد الوجه بدون جراحة سيول',
    'ألثيرابي كوريا', 'ثيرماج سيول', 'بوتوكس كوريا', 'فيلر سيول',
    'حقن البشرة', 'خيوط شد الوجه', 'HIFU كوريا',
    'مكافحة الشيخوخة سيول', 'السياحة العلاجية كوريا', 'عيادة K-beauty',
  ],
},
```

### 2.7 `NAMES` 매핑 (lib/seo.ts:211 - generateLocalBusinessSchema)

```ts
const NAMES: Record<string, string> = {
  ko: '리브성형외과',
  en: 'LIV Plastic Surgery',
  ja: 'リブ形成外科',
  zh: 'LIV整形外科',
  'zh-TW': 'LIV整形外科',
  vi: 'Phẫu thuật Thẩm mỹ LIV',
  th: 'ศัลยกรรมความงาม LIV',
  ru: 'Пластическая хирургия LIV',
  fr: 'LIV Chirurgie Esthétique',                     // ⭐ 신규
  mn: 'LIV Гоо Заслын Эмнэлэг',                       // ⭐ 신규
  ar: 'مستشفى ليف للتجميل',                            // ⭐ 신규
};
```

### 2.8 WebSite/WebPage 스키마 `inLanguage` 확장

```ts
// generateWebSiteSchema (line 661)
inLanguage: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW', 'vi-VN', 'th-TH', 'ru-RU', 'fr-FR', 'mn-MN', 'ar'],

// generateWebPageSchema (line 700) — 헬퍼 함수로 리팩토링
function bcp47FromLocale(locale: string): string {
  return LOCALE_META[locale as Locale]?.hreflang ?? 'en-US';
}
// 호출: inLanguage: bcp47FromLocale(page.locale)
```

---

## 3. 핵심 컴포넌트 변경 명세 (RTL 마이그레이션)

### 3.1 `app/[locale]/layout.tsx` (최우선)

**현재 상태** (line 81~84):
```tsx
const htmlLang = LOCALE_META[locale as Locale]?.htmlLang ?? locale;
return (
  <html lang={htmlLang} className={`${pretendard.variable} ${cormorant.variable}`}>
```

**변경 후**:
```tsx
import { pretendard, cormorant, notoSansArabic } from '@/styles/fonts';

const meta = LOCALE_META[locale as Locale];
const htmlLang = meta?.htmlLang ?? locale;
const htmlDir = meta?.dir ?? 'ltr';

const fontClasses = [
  pretendard.variable,
  cormorant.variable,
  locale === 'ar' ? notoSansArabic.variable : '',
].filter(Boolean).join(' ');

return (
  <html lang={htmlLang} dir={htmlDir} className={fontClasses}>
```

**ChatWidget 노출 조건 확장** (line 164) — Design §10 결정에 따라 fr/mn/ar 모두 활성:
```tsx
// 변경 전
- {(locale === 'en' || locale === 'ja' || locale === 'zh') && (
-   <ChatWidget locale={locale} />
- )}

// 변경 후 — ko 제외 전체 활성 (운영자=ko, 환자=non-ko)
+ {locale !== 'ko' && <ChatWidget locale={locale} />}
```

> 주의: ChatWidget 내부 메시지 번역 키 (`chat.*` 네임스페이스)가 fr/mn/ar `messages/*.json`에도 포함되어야 함. `verify-locale-keys.mjs` 통과 시점에 자동 보장됨.
> 운영자 세션은 ko 고정이므로 fr/mn/ar 환자 메시지는 운영자가 별도 번역 도구로 응대 필요 — 운영 정책 별도 (Out of Scope).

### 3.2 `styles/fonts.ts`

```ts
// 기존 import 유지
import { Cormorant_Garamond, Noto_Sans_Arabic } from 'next/font/google';
import localFont from 'next/font/local';

export const pretendard = /* 기존 */;
export const cormorant = /* 기존 */;

// ⭐ 신규
export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
});
```

### 3.3 `app/globals.css` (RTL 폰트 우선순위)

`[lang="ar"]` 또는 `[dir="rtl"]` 셀렉터로 아랍어 글꼴 우선 적용:

```css
/* globals.css에 추가 */
:root {
  --font-sans-default: var(--font-pretendard), system-ui, sans-serif;
}

html[lang="ar"] body {
  font-family: var(--font-arabic), var(--font-pretendard), system-ui, sans-serif;
}

/* RTL에서 화살표 SVG 좌우 반전 */
[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}
```

### 3.4 핵심 5종 logical class 마이그레이션 매핑

| 기존 클래스 | logical 클래스 | 의미 |
|------------|---------------|------|
| `ml-*` | `ms-*` | margin-inline-start |
| `mr-*` | `me-*` | margin-inline-end |
| `pl-*` | `ps-*` | padding-inline-start |
| `pr-*` | `pe-*` | padding-inline-end |
| `text-left` | `text-start` | 시작 방향 정렬 |
| `text-right` | `text-end` | 끝 방향 정렬 |
| `border-l` | `border-s` | 시작 보더 |
| `border-r` | `border-e` | 끝 보더 |
| `rounded-l-*` | `rounded-s-*` | 시작 모서리 |
| `rounded-r-*` | `rounded-e-*` | 끝 모서리 |
| `left-*` (절대 위치) | `start-*` | inset-inline-start |
| `right-*` (절대 위치) | `end-*` | inset-inline-end |
| `space-x-*` | `space-x-*` (그대로, 시각 대칭) | gutter는 자동 RTL |

**예외 (그대로 유지)**:
- `left-0 right-0` 한 줄 = 전체 너비, 방향 무관
- 1/2 위치 (`left-1/2 -translate-x-1/2`) = 중앙 정렬, 방향 무관

### 3.5 `layout/Header.tsx` 마이그레이션 포인트

```tsx
// 변경 없음 (전체 너비)
className="fixed top-0 left-0 right-0 z-50 ..."

// dropdown 위치 (서브메뉴) - 변경
- className="absolute top-full left-0 pt-4"
+ className="absolute top-full start-0 pt-4"
```

### 3.6 `layout/Footer.tsx` 마이그레이션 포인트

전수 grep 후 `text-left`, `ml-*`, `pl-*` 변환. 소셜 아이콘 가로 정렬은 `gap-*` + `flex` 조합으로 RTL 자동.

### 3.7 `layout/FloatingCTA.tsx`

```tsx
// 변경 전
- className="fixed right-2 sm:right-4 md:right-6 z-40 flex flex-col items-end gap-2"
// 변경 후
+ className="fixed end-2 sm:end-4 md:end-6 z-40 flex flex-col items-end gap-2"
```

→ LTR에서는 우측, RTL에서는 좌측에 자동 배치됨. `items-end`는 부모 방향 따라감.

### 3.8 `layout/MobileMenu.tsx`

```tsx
// 변경 전 (오른쪽에서 슬라이드 인)
- className="fixed top-0 right-0 bottom-0 ..."
// 변경 후
+ className="fixed top-0 end-0 bottom-0 ..."

// Framer Motion 슬라이드 방향 분기
const isRtl = useDirection() === 'rtl';     // 헬퍼 훅 도입
<motion.div
  initial={{ x: isRtl ? '-100%' : '100%' }}
  animate={{ x: 0 }}
  exit={{ x: isRtl ? '-100%' : '100%' }}
/>
```

→ `useDirection()` 헬퍼 훅 신규 도입 필요 (다음 절 참조).

### 3.9 `sections/Hero*.tsx` (실제 파일명 확인 후 적용)

Hero 슬라이드의 Framer Motion `x` 값 부호 분기:

```tsx
const isRtl = useDirection() === 'rtl';
<motion.div
  initial={{ opacity: 0, x: isRtl ? -50 : 50 }}
  animate={{ opacity: 1, x: 0 }}
/>
```

### 3.10 `useDirection()` 헬퍼 훅 신규

`src/hooks/useDirection.ts` 신규 생성:

```ts
'use client';
import { useLocale } from 'next-intl';
import { LOCALE_META } from '@/i18n/locales-meta';
import type { Locale } from '@/i18n/routing';

export type Direction = 'ltr' | 'rtl';

export function useDirection(): Direction {
  const locale = useLocale() as Locale;
  return LOCALE_META[locale]?.dir ?? 'ltr';
}
```

서버 컴포넌트에서는 `params.locale` 기반으로 `LOCALE_META[locale].dir`을 직접 참조.

---

## 4. 빌드/검증 변경

### 4.1 `scripts/verify-locale-keys.mjs`

```js
// line 19
- const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru'];
+ const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
```

향후 SSOT 통합을 위해 `routing.ts`에서 LOCALES를 dynamic import할 수도 있으나, 현재 .mjs 빌드 게이트는 ESM/TS 호환 이슈로 보류. **수동 동기화 유지**.

### 4.2 `package.json` prebuild 훅

이미 `verify-locale-keys` 가 `prebuild`에 wired되어 있다고 주석 명시(`verify-locale-keys.mjs:11`). 변경 없음.

### 4.3 TypeScript 검증

- `Locale` union이 자동으로 `'fr' | 'mn' | 'ar'` 포함 → 사용처 컴파일러 검증
- `MAPS` 객체에 새 키 추가 시 `Partial<Record<Locale, ...>>` 타입이 누락 잡아냄
- `NAMES`, `seoConfig` 등은 `Record<string, ...>` 라 컴파일러 보장 약함 → 수동 검토

---

## 5. 의료 용어집 (Translation Glossary)

LLM 1차 번역 품질 통일을 위해 **사전 정의 필수**. 신규 3개 locale 표준 표기:

| 한국어 (원문) | English | 中文 | 日本語 | Français | Монгол | العربية |
|--------------|---------|------|--------|----------|--------|---------|
| 보톡스 | Botox | 肉毒素 | ボトックス | Botox | Ботокс | البوتوكس |
| 필러 | Filler | 玻尿酸 | フィラー | Filler | Филлер | الفيلر |
| 스킨부스터 | Skin Booster | 水光针 | スキンブースター | Skin Booster | Арьс сэргээгч (Skin Booster) | حقن البشرة (Skin Booster) |
| 울쎄라피 프라임 | Ultherapy Prime | 超声刀Prime | ウルセラプライム | Ultherapy Prime | Ultherapy Prime | ألثيرابي برايم |
| 써마지 FLX | Thermage FLX | 热玛吉FLX | サーマジFLX | Thermage FLX | Thermage FLX | ثيرماج FLX |
| HIFU 리프팅 | HIFU Lifting | HIFU提升 | HIFUリフティング | Lifting HIFU | HIFU лифтинг | شد بـ HIFU |
| RF 고주파 리프팅 | RF Lifting | 射频提升 | RFリフティング | Lifting par radiofréquence (RF) | RF лифтинг | شد بالترددات الراديوية (RF) |
| 실리프팅 | Thread Lifting | 埋线提升 | 糸リフト | Lifting par fils tenseurs | Утсан лифтинг | شد بالخيوط |
| 안티에이징 | Anti-aging | 抗衰老 | アンチエイジング | Anti-âge | Залуужуулалт | مكافحة الشيخوخة |
| 신사역 4번 출구 | Sinsa Station Exit 4 | 新沙站4号出口 | 新沙駅4番出口 | Station Sinsa sortie 4 | Шинса метроны 4-р гарц | محطة سينسا، المخرج 4 |
| 도보 1분 | 1 min walk | 步行1分钟 | 徒歩1分 | 1 min à pied | Алхаад 1 минут | على بُعد دقيقة سيراً |
| 상담 예약 | Reservation / Consultation | 咨询预约 | 相談予約 | Réservation de consultation | Зөвлөгөө захиалга | حجز استشارة |
| 리브성형외과 | LIV Plastic Surgery | LIV整形外科 | リブ形成外科 | LIV Chirurgie Esthétique | LIV Гоо Заслын Эмнэлэг | مستشفى ليف للتجميل |

→ 위 표를 `docs/i18n-glossary.md`로 추출하여 LLM 번역 프롬프트에 항상 첨부.

---

## 6. 구현 순서 (Implementation Order)

### Step 1: i18n 인프라 (~30분)
- [ ] `routing.ts` LOCALES에 `'fr', 'mn', 'ar'` 추가
- [ ] `locales-meta.ts` LOCALE_META 3개 항목 추가, `ar.dir = 'rtl'`, LOCALE_ORDER 재정렬
- [ ] `verify-locale-keys.mjs` LOCALES 11개로 업데이트

### Step 2: RTL 인프라 (~30분)
- [ ] `styles/fonts.ts` `Noto_Sans_Arabic` 추가
- [ ] `app/[locale]/layout.tsx` `<html dir>` 동적 적용, 아랍어 폰트 클래스 분기
- [ ] `app/globals.css` RTL 셀렉터 + 화살표 반전 유틸리티
- [ ] `hooks/useDirection.ts` 신규 생성

### Step 3: 번역 파일 (~3~4시간, LLM 자동 + 검증)
- [ ] `docs/i18n-glossary.md` 의료 용어집 추출
- [ ] LLM 프롬프트로 `ko.json` → `fr.json` 생성
- [ ] LLM 프롬프트로 `ko.json` → `mn.json` 생성
- [ ] LLM 프롬프트로 `ko.json` → `ar.json` 생성
- [ ] `node scripts/verify-locale-keys.mjs` 통과 확인 (3개 locale 누락 키 0건)

### Step 4: SEO 메타데이터 (~1시간)
- [ ] `lib/seo.ts` `seoConfig`에 fr/mn/ar 추가
- [ ] `NAMES` 매핑 7개 누락 항목 보완(zh-TW/vi/th/ru/fr/mn/ar)
- [ ] `generateWebSiteSchema.inLanguage` 11개로 확장
- [ ] `generateWebPageSchema.inLanguage` 헬퍼화

### Step 5: 시술 i18n 오버라이드 (~2~3시간, LLM + 검증)
- [ ] `treatmentsI18n.ts` `FR` LocaleMap 작성 (9개 시술)
- [ ] `treatmentsI18n.ts` `MN` LocaleMap 작성
- [ ] `treatmentsI18n.ts` `AR` LocaleMap 작성
- [ ] `MAPS` 객체에 등록
- [ ] `RELATED_TREATMENTS_L10N` 3개 locale 추가

### Step 6: RTL 핵심 5종 컴포넌트 (~1~2시간)
- [ ] `layout/Header.tsx` logical class 변환
- [ ] `layout/Footer.tsx` logical class 변환
- [ ] `layout/FloatingCTA.tsx` `right-*` → `end-*`
- [ ] `layout/MobileMenu.tsx` `right-0` → `end-0`, Framer Motion `x` 분기
- [ ] **Hero 파일 식별**: `grep -rEn "Hero|slideshow|carousel" src/components/sections/` 실행 후 실제 슬라이드 컴포넌트 파일명 확인
- [ ] Hero 슬라이드 컴포넌트 Framer Motion `x` 부호 분기 적용
- [ ] `app/[locale]/layout.tsx` ChatWidget 조건 `locale !== 'ko'`로 확장

### Step 6.5: DB 콘텐츠 영어 fallback (~30분)
- [ ] `src/lib/contentFallback.ts` 신규 — `resolveContentLocale()` 헬퍼
- [ ] 이벤트·팝업 표시 컴포넌트 식별 (`grep -rEn "supabase.*events|supabase.*popups" src/`)
- [ ] 식별된 컴포넌트에 `resolveContentLocale(locale)` 적용

### Step 7: 빌드·타입체크·스모크 (~30분)
- [ ] `npm run lint` 0 errors
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npm run build` exit 0, missing key warning 0건
- [ ] 로컬 `npm run dev` 후 `/fr`, `/mn`, `/ar` 접속 시각 검수
- [ ] 기존 8개 locale 스모크 회귀
- [ ] `<html dir="rtl">` DOM 검증

---

## 7. RTL 마이그레이션 grep 명령 (Do 단계 사용)

```powershell
# 핵심 5종 파일에서 LTR 클래스 전수 추출
cd C:\dev\LIV_homepage\liv-clinic
Get-Content -Raw `
  src/components/layout/Header.tsx,`
  src/components/layout/Footer.tsx,`
  src/components/layout/FloatingCTA.tsx,`
  src/components/layout/MobileMenu.tsx,`
  src/components/sections/Hero*.tsx `
  | Select-String -Pattern '(m[lr]|p[lr]|left|right|text-(left|right)|border-[lr]|rounded-[lr])-[0-9a-z]+' -AllMatches
```

또는 Bash:
```bash
cd liv-clinic
grep -rEn "(^|[\"' ])(m[lr]|p[lr]|left|right|text-(left|right)|border-[lr]|rounded-[lr])-[0-9a-z]+" \
  src/components/layout/Header.tsx \
  src/components/layout/Footer.tsx \
  src/components/layout/FloatingCTA.tsx \
  src/components/layout/MobileMenu.tsx \
  src/components/sections/Hero*.tsx
```

---

## 8. 폰트 결정 매트릭스

| Locale | 스크립트 | 폰트 결정 | 근거 |
|--------|---------|----------|------|
| `fr` | Latin + diacritics (é à ç ô ù) | **Pretendard Variable 그대로** | Latin glyph 완비, 추가 폰트 불필요 |
| `mn` | Cyrillic (Ө Ү ё) | **Pretendard Variable 그대로** (러시아어와 동일) | `ru` 도입 시 Cyrillic 글리프 검증 완료(가정), 재검증 필수 |
| `ar` | Arabic 28자 | **Noto Sans Arabic** + Pretendard fallback | Pretendard에 아랍어 글리프 없음, 별도 폰트 필수 |

**검증 절차**:
- `npm run dev` 후 `/fr/about` 접속 → "présentation, médecins, équipements" 등 diacritics 시각 확인
- `/mn/about` 접속 → "Танилцуулга, Эмч нар, Тоног төхөөрөмж" 시각 확인 (Ө, Ү 글리프 미흡 시 추가 폰트 검토)
- `/ar/about` 접속 → "نبذة, الأطباء, المعدات" 아랍어 글리프 렌더 확인 (tofu 없음, 자동 연결자 정상)

---

## 9. 리스크 완화 검증

### 9.1 RTL 시각 검수 체크리스트 (`/ar` 접속 시)

- [ ] `<html dir="rtl">` DOM 확인
- [ ] 메인 페이지 hero 텍스트 우측 정렬
- [ ] Header 로고 우측 / 메뉴 좌측
- [ ] LanguageSwitcher 드롭다운 좌측 정렬 (RTL 기준 "start")
- [ ] FloatingCTA 좌측 하단 (LTR에서는 우측 하단)
- [ ] MobileMenu가 좌측에서 슬라이드 인
- [ ] Footer 콘텐츠 정렬 자연스러움
- [ ] 시술 상세 페이지 process 단계 인디케이터 좌→우 vs 우→좌 (디자인 의도 확인)
- [ ] 페이지 스크롤 가로 overflow 0건

### 9.2 회귀 방지 (기존 8개 locale)

- [ ] `/ko`, `/en`, `/ja`, `/zh`, `/zh-TW`, `/vi`, `/th`, `/ru` 메인 페이지 정상
- [ ] LanguageSwitcher 11개 항목 노출, 클릭 시 정확한 locale 이동
- [ ] FloatingCTA `right-*` → `end-*` 변환 후 LTR locale에서도 우측 하단 유지
- [ ] MobileMenu 슬라이드 인 방향 LTR에서 우측 유지

---

## 10. 확정 결정사항 (Resolved Decisions)

| # | 항목 | 결정 | 구현 방침 |
|---|------|------|----------|
| 1 | `Hero*.tsx` 실제 파일 식별 | **Do 단계에서 grep으로 탐색** | `grep -rEn "(^\|\\W)(motion|Hero|slideshow)" src/components/sections/` 로 Hero 컴포넌트 식별 후 Framer Motion `x` 부호 분기 적용 |
| 2 | ChatWidget fr/mn/ar 지원 | **3개 locale 모두 활성** | `app/[locale]/layout.tsx`에서 `locale !== 'ko'` 조건으로 단순화. 운영자(ko) ↔ 환자(non-ko) 페어링. `chat.*` 번역 키는 `messages/*.json` 동기화로 자동 보장 |
| 3 | DB 콘텐츠(이벤트·팝업) fallback | **영어 fallback (en → ko)** | Supabase 이벤트·팝업 표시 컴포넌트에서 `locale ∈ {fr, mn, ar}` 시 영어 콘텐츠 우선 사용, 영어 미존재 시 ko fallback. 본 PDCA에서 fallback 헬퍼 함수 1개만 추가 (해당 컴포넌트 식별 후 Do 단계 적용) |
| 4 | RTL Hero 슬라이드 방향 | **방향 분기 적용** | `useDirection()`으로 `x` 부호 분기 (LTR: `x: 50 → 0`, RTL: `x: -50 → 0`). 디자인 의도와 충돌 시 시각 검수 후 hotfix |
| 5 | Tailwind 4.x logical properties | **표준 지원 사용, 플러그인 불필요** | `ms-*/me-*/ps-*/pe-*/start-*/end-*` 직접 사용 |

### 10.1 ChatWidget 확장 영향

- `messages/{fr,mn,ar}.json`에 `chat.*` 네임스페이스 누락 시 런타임 에러 가능 → `verify-locale-keys.mjs`에서 사전 차단
- ChatWidget의 RTL 시각 검수: `/ar` 접속 후 채팅창 정렬·말풍선 꼬리 방향 확인 (시각 검수 체크리스트 §9.1에 추가됨)

### 10.2 DB fallback 헬퍼 패턴

Do 단계에서 이벤트·팝업 표시 컴포넌트 식별 후 다음 패턴 적용:

```ts
// 새 헬퍼 (예: src/lib/contentFallback.ts)
const FALLBACK_LOCALES = new Set(['fr', 'mn', 'ar']);

export function resolveContentLocale(requestedLocale: string): 'ko' | 'en' {
  return FALLBACK_LOCALES.has(requestedLocale) ? 'en' : (requestedLocale as 'ko' | 'en');
}
```

→ 이벤트·팝업 SELECT 쿼리에서 표시 언어 결정 시 호출. 본 PDCA는 헬퍼 추가만, 실제 DB 스키마 다국어화는 별도 PDCA.

---

## 11. Diff 요약 (예상)

| 파일 | 변경 라인 (대략) | 유형 |
|------|---------------|------|
| `src/i18n/routing.ts` | +1 | 수정 |
| `src/i18n/locales-meta.ts` | +30 (3개 META + ORDER 재정렬) | 수정 |
| `src/messages/fr.json` | +5,616 | **신규** |
| `src/messages/mn.json` | +5,616 | **신규** |
| `src/messages/ar.json` | +5,616 | **신규** |
| `src/lib/treatmentsI18n.ts` | +250~300 (FR+MN+AR + MAPS) | 수정 |
| `src/lib/seo.ts` | +80 (seoConfig 3개 + NAMES 보완 + inLanguage 확장) | 수정 |
| `src/styles/fonts.ts` | +10 (Noto_Sans_Arabic) | 수정 |
| `src/app/[locale]/layout.tsx` | +15 (dir + font 분기) | 수정 |
| `src/app/globals.css` | +15 (RTL 셀렉터) | 수정 |
| `src/hooks/useDirection.ts` | +10 | **신규** |
| `src/lib/contentFallback.ts` | +15 (resolveContentLocale 헬퍼) | **신규** |
| `src/components/layout/Header.tsx` | ~5 변경 | 수정 |
| `src/components/layout/Footer.tsx` | ~10 변경 | 수정 |
| `src/components/layout/FloatingCTA.tsx` | ~3 변경 | 수정 |
| `src/components/layout/MobileMenu.tsx` | ~5 변경 | 수정 |
| `src/components/sections/Hero*.tsx` | ~5 변경 (확인 후) | 수정 |
| `scripts/verify-locale-keys.mjs` | +1 | 수정 |
| `docs/i18n-glossary.md` | +50 | **신규** |

**총합**: 신규 **6** 파일(이전 5 → +contentFallback.ts), 수정 약 13~14 파일, 예상 라인 변경 ~17,500줄 (대부분 번역 JSON).

> P1 보정 사항 (design-validator 검증 결과):
> - 추가 logical class 매핑(필요 시 Do에서 보강): `inset-x-* → inset-i-*`, `divide-x-* → divide-x-*`(LTR/RTL 대칭이라 그대로 사용 가능)
> - NFR-07 (Lighthouse SEO ≥90) 검증: §6 Step 7에서 빌드 후 Chrome Lighthouse 실행 항목으로 처리
> - Hero 파일 식별은 Do Step 6에서 grep 자동 수행 (§3.9·§6 참조)

---

## 12. 수용 기준 매핑 (Plan FR/NFR ↔ Design)

| Plan ID | Design 구현 위치 |
|---------|-----------------|
| FR-01 | §2.1, §2.2, §2.3 (routing/meta/order 확장) |
| FR-02 | §2.3 (LOCALE_ORDER) + 기존 LanguageSwitcher 자동 |
| FR-03 | §2.4 (번역 파일) + §5 (용어집) |
| FR-04 | §3.1 (layout.tsx dir 동적 적용) |
| FR-05 | §3.4~§3.9 (5종 컴포넌트 logical 변환) |
| FR-06 | §2.1 (dir 미설정 시 'ltr' 자동) |
| FR-07 | 자동 (sitemap.ts의 LOCALES 사용) |
| FR-08 | 자동 (seo.ts buildHreflangMap) |
| FR-09 | §2.5 (treatmentsI18n MAPS 등록) |
| FR-10 | §2.4 (메시지 키) |
| FR-11 | §2.5 (시술 9종 LocaleMap) |
| FR-12 | §3.3 (rtl-flip 유틸) |
| FR-13 | §3.8, §3.9, §3.10 (useDirection 훅) |
| FR-14 | §2.3 (LOCALE_ORDER) |
| NFR-01 | dynamic import 유지로 자동 |
| NFR-02 | next/font/google 자동 서브셋팅 |
| NFR-03 | §4.1 (verify-locale-keys 통과) |
| NFR-04 | §8 (폰트 매트릭스) |
| NFR-05 | TypeScript 컴파일 |
| NFR-06 | §9.2 (회귀 체크리스트) |
| NFR-07 | 자동 (sitemap + hreflang) |
| NFR-08 | §9.1 (RTL 시각 검수) |
| NFR-09 | §3.2 (`display: 'swap'` + `preload: true`) |

---

## 13. 다음 단계

```bash
/pdca do i18n-fr-mn-ar
```

Do 단계는 본 Design 문서의 **§6 구현 순서**를 그대로 따라 Step 1 → Step 7 순차 실행. 각 Step 완료 시 TodoWrite로 추적, 빌드/타입체크는 Step 7에서 일괄 검증.
