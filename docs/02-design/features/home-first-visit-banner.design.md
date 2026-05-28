# Design — 홈페이지 첫방문 1회 체험가 배너 노출

> **Feature**: `home-first-visit-banner`
> **Phase**: Design
> **Created**: 2026-05-29
> **Architecture**: **Option C — Pragmatic Balance** (2개 컴포넌트 분리, getHomePromoPicks 불필요)
> **HomePromo Layout**: **상-하 분할** (Vertical Stack, 중앙정렬)
> **HomePromo Strategy**: **시술명/가격 미노출 — 호기심 유발 + 강한 CTA로 클릭 유도** ← 사용자 결정 2026-05-29
> **연관**: `docs/01-plan/features/home-first-visit-banner.plan.md`
> **이전 페이지**: `docs/02-design/features/first-visit-trial-events.design.md` (참고만)

---

## Context Anchor

| 키 | 값 |
|----|----|
| **WHY** | 첫방문 체험가 페이지가 이미 구축되어 있으나 홈에서 진입 동선이 없어 신규 고객 전환 기회를 놓치고 있다. 홈 진입 직후·스크롤 중 2회 노출로 인지·전환을 동시 달성한다. |
| **WHO** | 홈(`/[locale]`)에 처음 진입하는 모든 방문자(신규/재방문 무관). 11개 로케일(ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar) 전부 대상. 모바일 비중 높음. |
| **RISK** | LCP 영역 변경(R1) · 11개 로케일 미번역(R2) · 모바일 텍스트 잘림(R5) · 다크 그라데이션 위 색상 대비(R6) · 헤더 fixed 정합(R7) |
| **SUCCESS** | 11/11 로케일 노출 · `/{locale}/events/first-visit` 진입 3경로(SlimBanner / HomePromo 카드 / HomePromo CTA) 동작 · Lighthouse ±5% · 기존 컴포넌트 무수정 |
| **SCOPE** | 신규 컴포넌트 2개 + 홈 page.tsx 1곳 + i18n 신규 키(11개 파일) + sections/index.ts export. **`firstVisitTrial.ts` 변경 없음** (가격 데이터 미참조). |

---

## 1. Overview

### 1.1 본 Design의 핵심 결정 3가지

1. **D-Arch-C**: Option C 채택 — 컴포넌트 2개 분리(`HomeFirstVisitSlimBanner` + `HomeFirstVisitPromo`), 미니카드는 inline, `dismissible?: boolean` props 슬롯 인터페이스만 정의.
2. **D-Layout-Vertical**: HomePromo는 상-하 세로 스택 (제목 → 부제 → CTA). 데스크톱·모바일 동일 레이아웃으로 반응형 분기 최소화.
3. **D-NoPrice-Tease**: **HomePromo에 시술명·가격을 노출하지 않는다.** 대신 "11개 시술 · 최대 47% 할인" 요약 + 호기심 유발 카피 + 강한 CTA로 `/events/first-visit` 클릭을 유도한다. (사용자 결정 2026-05-29)

### 1.2 D-NoPrice-Tease가 다른 결정에 미치는 영향

| 항목 | 변경 전 (Plan 가정) | 변경 후 (Design 확정) |
|------|---------------------|----------------------|
| `getHomePromoPicks()` 유틸 | 추가 (Plan T1) | **❌ 불필요. `firstVisitTrial.ts` 변경 없음** |
| HomePromo가 참조하는 데이터 | `FIRST_VISIT_TRIALS` 4개 인덱스 | **i18n 텍스트만** |
| i18n 신규 키 | 6개 (slimBanner 3 + homePromo 3) | **7개로 조정** (homePromo 4개로 확장: highlight 추가) |
| `firstVisit.items.*` 키 재사용 | 4개 시술 name 재사용 | **재사용 없음** |
| HomePromo 클라이언트/서버 | 클라이언트(AnimateOnScroll + 4 카드 인터랙션) | **클라이언트** (AnimateOnScroll 유지, 인터랙션 단순) |
| 시술 변경 시 유지보수 | 4선 ID 수정 필요 | **카피만 수정** (가격 11개 → 9개로 줄어도 영향 0) |
| 가격 정확성 검증 부담 | 4개 가격 매번 확인 | **없음** (가격 미노출) |
| 클릭 유도 강도 | 가격 보고 만족 → 클릭 안 함 위험 | **호기심 유발 → 클릭률 증가 기대** |

---

## 2. Architecture

### 2.1 채택안: Option C — Pragmatic Balance

```
liv-clinic/src/
├── components/sections/
│   ├── HomeFirstVisitSlimBanner.tsx   (신규, ~60 lines, 'use client', 정적 import)
│   ├── HomeFirstVisitPromo.tsx        (신규, ~120 lines, 'use client', dynamic import)
│   └── index.ts                       (수정: 2개 export 추가)
├── app/[locale]/page.tsx              (수정: SlimBanner + Promo 통합)
└── messages/
    ├── ko.json, en.json, ja.json, zh.json, zh-TW.json,
    ├── vi.json, th.json, ru.json, fr.json, mn.json, ar.json
    └── (각 파일 firstVisit 네임스페이스에 slimBanner + homePromo 서브키 추가)
```

### 2.2 모듈 책임 분리

| 모듈 | 책임 | 의존성 |
|------|------|--------|
| `HomeFirstVisitSlimBanner` | Hero 위 1줄 띠 노출, 모바일 짧은 카피 분기, `/events/first-visit` Link | `next-intl`, `@/i18n/routing` (Link) |
| `HomeFirstVisitPromo` | Equipment 다음 큰 카드 노출, 호기심 카피 + 메인 CTA, scroll-in 애니메이션 | `next-intl`, `@/i18n/routing`, `@/components/ui` (AnimateOnScroll, Button) |
| `messages/*.json` | 11개 로케일 카피·통화 단위 | 없음 |
| `app/[locale]/page.tsx` | 두 컴포넌트를 홈 흐름에 삽입 | 신규 2개 컴포넌트 |

### 2.3 데이터 흐름

```
홈 진입
  ↓
[SlimBanner — 정적 import, 즉시 노출]
  → useTranslations('firstVisit') → "slimBanner.text" / "slimBanner.textShort"(모바일) / "slimBanner.cta"
  → Link href="/events/first-visit" (next-intl 로케일 prefix 자동)
  ↓
[Hero] [Equipment] (기존)
  ↓
[HomePromo — dynamic import + ssr:true, AnimateOnScroll trigger]
  → useTranslations('firstVisit') → "homePromo.eyebrow" / "title"(기존) / "homePromo.subtitle" / "homePromo.highlight" / "homePromo.viewAll"
  → Link href="/events/first-visit" (next-intl Link)
  ↓
[Signature] [CoreValues] [Doctor] [MediaNewsSection] [Location] (기존)
```

### 2.4 비채택안과의 명시적 차이

- **Option A 미채택 이유**: 단일 파일 통합 시 정적 import(SlimBanner) + dynamic import(Promo) 분리 불가 → Plan D5/D6 위배.
- **Option B 미채택 이유**: 4개 컴포넌트 분리 + variants props는 가격/카드 미노출 결정(D-NoPrice-Tease) 후 의미가 더욱 줄어듦. HomePromo가 단순 텍스트 카드가 되므로 PromoCard/PromoGrid 분리는 과한 추상화.

---

## 3. Data Model

### 3.1 외부 데이터 의존성

**없음.** 본 피처는 가격 데이터(`FIRST_VISIT_TRIALS`)에 의존하지 않는다. 모든 노출 내용은 i18n 메시지 키로 제어된다.

### 3.2 i18n 메시지 스키마 (신규 추가)

`messages/*.json`의 기존 `firstVisit` 네임스페이스에 추가:

```jsonc
{
  "firstVisit": {
    // ── 기존 키 (유지) ──
    "eyebrow": "First Visit",
    "title": "첫방문 1회 체험가",
    "subtitle": "...",
    "banner": { /* events 페이지 진입 배너용, 기존 유지 */ },
    "items": { /* 기존 11개 시술 데이터, 미사용 */ },
    "categories": { /* 기존, 미사용 */ },

    // ── 신규 추가 (본 피처) ──
    "slimBanner": {
      "text": "첫방문 1회 체험가 · 최대 47% 할인",
      "textShort": "첫방문 체험가",          // 모바일 < 360px 폴백
      "cta": "보기"
    },
    "homePromo": {
      "eyebrow": "First Visit Only",       // 전 로케일 영문 통일 (브랜드 톤)
      "subtitle": "리브를 처음 만나는 분께 드리는 단 1회의 체험 혜택",
      "highlight": "11개 시술 · 최대 47% 할인",
      "viewAll": "전체 가격 보기"
    }
  }
}
```

### 3.3 키 사용 매핑

| 컴포넌트 | 사용 키 | 비고 |
|---------|---------|------|
| `HomeFirstVisitSlimBanner` | `firstVisit.slimBanner.text` (≥sm) / `firstVisit.slimBanner.textShort` (<sm) / `firstVisit.slimBanner.cta` | Tailwind `hidden sm:inline` 패턴으로 분기 |
| `HomeFirstVisitPromo` (eyebrow) | `firstVisit.homePromo.eyebrow` | 전 로케일 "First Visit Only" 영문 유지 |
| `HomeFirstVisitPromo` (title) | `firstVisit.title` (기존 재사용) | 신규 키 추가 없음 |
| `HomeFirstVisitPromo` (subtitle) | `firstVisit.homePromo.subtitle` | 신규 |
| `HomeFirstVisitPromo` (highlight) | `firstVisit.homePromo.highlight` | 신규, "11개 시술 · 최대 47% 할인" |
| `HomeFirstVisitPromo` (CTA) | `firstVisit.homePromo.viewAll` | 신규 |

### 3.4 11개 로케일 카피 가이드 (Do 단계에서 확정)

| 로케일 | slimBanner.text | slimBanner.textShort | slimBanner.cta | homePromo.subtitle | homePromo.highlight | homePromo.viewAll |
|--------|-----------------|---------------------|----------------|--------------------|--------------------|--------------------|
| ko | 첫방문 1회 체험가 · 최대 47% 할인 | 첫방문 체험가 | 보기 | 리브를 처음 만나는 분께 드리는 단 1회의 체험 혜택 | 11개 시술 · 최대 47% 할인 | 전체 가격 보기 |
| en | First Visit Trial · Up to 47% Off | First Visit Trial | View | A one-time trial offer for first-time guests at LIV | 11 Treatments · Up to 47% Off | View All Prices |
| ja | 初回限定 1回体験価格 · 最大47%OFF | 初回体験価格 | 見る | LIVに初めてお越しの方へ贈る1回限りの体験特典 | 11施術・最大47%OFF | 全価格を見る |
| zh | 首次体验价 · 最高优惠47% | 首次体验价 | 查看 | 致初次到访 LIV 的贵宾，仅限一次的体验礼遇 | 11项施术 · 最高47%优惠 | 查看全部价格 |
| zh-TW | 首次體驗價 · 最高優惠47% | 首次體驗價 | 查看 | 致首次蒞臨 LIV 的貴賓，僅限一次的體驗禮遇 | 11項療程 · 最高47%優惠 | 查看全部價格 |
| vi | Giá trải nghiệm lần đầu · Giảm tới 47% | Giá trải nghiệm | Xem | Ưu đãi trải nghiệm một lần dành cho khách đến LIV lần đầu | 11 thủ thuật · Giảm tới 47% | Xem tất cả giá |
| th | ราคาทดลองครั้งแรก · ลดสูงสุด 47% | ราคาทดลอง | ดู | ข้อเสนอทดลองหนึ่งครั้งสำหรับลูกค้าที่มาที่ LIV เป็นครั้งแรก | 11 หัตถการ · ลดสูงสุด 47% | ดูราคาทั้งหมด |
| ru | Цена первого визита · Скидка до 47% | Первый визит | Открыть | Разовое пробное предложение для впервые посетивших LIV | 11 процедур · Скидка до 47% | Все цены |
| fr | Tarif Première Visite · Jusqu'à -47% | Première visite | Voir | Une offre d'essai unique pour les nouveaux clients de LIV | 11 soins · Jusqu'à -47% | Voir tous les tarifs |
| mn | Анхны үзлэгийн үнэ · 47% хүртэл хямдрал | Анхны үнэ | Үзэх | LIV-д анх удаа ирсэн зочдод зориулсан нэг удаагийн санал | 11 эмчилгээ · 47% хүртэл хямдрал | Бүх үнийг харах |
| ar | سعر الزيارة الأولى · خصم حتى 47% | سعر الزيارة الأولى | عرض | عرض تجربة لمرة واحدة للزوار الجدد في LIV | 11 إجراءً · خصم حتى 47% | عرض جميع الأسعار |

> ⚠️ **번역 검증 책임**: 의료 광고 가이드라인 위배 표현(절대적 표현 "최고", "유일") 회피. 위 표는 1차 안이며 병원/언어 검수 후 확정.

---

## 4. API Contract

**해당 없음.** 본 피처는 신규 API 엔드포인트를 추가하지 않는다. 모든 데이터는 정적 i18n 메시지로 제공되며, 라우팅만 next-intl `Link`를 통해 `/{locale}/events/first-visit`로 이동한다.

---

## 5. Components

### 5.1 `HomeFirstVisitSlimBanner`

**파일**: `liv-clinic/src/components/sections/HomeFirstVisitSlimBanner.tsx`

**역할**: Hero 섹션 위에 위치하는 가로 1줄 띠배너. 헤더 직하 즉시 노출.

**Props 인터페이스**:
```tsx
type HomeFirstVisitSlimBannerProps = {
  /** 미래 확장 슬롯 — 기본값 false. true여도 v1에서는 동작 미구현 (Plan D3 결정). */
  dismissible?: boolean;
};
```

**렌더링 규칙**:
- 클라이언트 컴포넌트 (`'use client'`)
- 루트 `<Link href="/events/first-visit">` (next-intl routing Link, 같은 탭 이동)
- 배경: `bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5`
- 텍스트 색상: `text-secondary`
- 높이: `py-2.5 md:py-3` (대략 40~48px)
- z-index: 헤더보다 낮음(헤더가 fixed인 경우 헤더 아래로 자연스럽게 흐름)
- 좌측: `firstVisit.eyebrow` 아이콘+텍스트(작게) / 중앙: 메인 카피 / 우측: CTA + 화살표 SVG
- 모바일 폴백: `hidden sm:inline` / `sm:hidden` 패턴으로 `text` ↔ `textShort` 분기
- 호버: `hover:from-primary/20 hover:via-primary/15` (rose 톤 강화)
- 화살표: SVG `M13 7l5 5-5 5M5 12h13` (events 페이지 진입 배너 동일)
- RTL: `dir="auto"` 상속, 화살표는 `rtl:rotate-180` 또는 `start/end` 논리적 정렬

**접근성**:
- `<Link>` aria-label = `${firstVisit.slimBanner.text} - ${firstVisit.slimBanner.cta}`
- 화살표 SVG `aria-hidden="true"`
- 키보드 focus: `focus-visible:outline-2 focus-visible:outline-primary`

**모션**:
- 초기 노출은 정적 (LCP 영향 최소화). Hero보다 먼저 그려지므로 fade-in 애니메이션 없음.
- 호버 transition: `transition-colors duration-200`

**ASCII 레이아웃**:
```
┌────────────────────────────────────────────────────────────────┐
│ ✨ First Visit · 첫방문 1회 체험가 · 최대 47% 할인    보기 →   │  ← sm 이상
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│ ✨ 첫방문 체험가              → │  ← < sm (모바일, textShort)
└────────────────────────────────────┘
```

---

### 5.2 `HomeFirstVisitPromo`

**파일**: `liv-clinic/src/components/sections/HomeFirstVisitPromo.tsx`

**역할**: Equipment 다음 위치하는 큰 인라인 프로모 섹션. 호기심 유발 + 강한 CTA로 `/events/first-visit` 클릭 유도.

**Props 인터페이스**:
```tsx
// v1은 props 없음. 미래 확장 시 추가:
// type HomeFirstVisitPromoProps = { variant?: 'rose' | 'cream'; align?: 'center' | 'start'; };
```

**렌더링 규칙**:
- 클라이언트 컴포넌트 (`'use client'`, `AnimateOnScroll` 사용)
- 섹션 wrapper: `<section className="py-16 md:py-24 bg-background">` (Plan에서 결정된 section gap 패턴 준수)
- 컨테이너: `container-custom`
- 카드: `<div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-white shadow-sm px-8 py-12 md:px-12 md:py-16 text-center">`
- 좌-중-우 분할 없음. **세로 스택**:
  1. `eyebrow` — `font-serif text-h4 md:text-h3 text-primary mb-2` (Cormorant)
  2. `title` (기존 firstVisit.title 재사용) — `text-h2 md:text-h1 text-secondary mb-3`
  3. `subtitle` — `text-body md:text-h4 text-mono leading-relaxed mb-5 max-w-xl mx-auto`
  4. `highlight` — `inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-small md:text-body font-medium text-primary mb-8` (체크 아이콘 + 텍스트, FirstVisitTrialSection의 trialOnceNote 배지 패턴 재사용)
  5. CTA Button — `<Button variant="primary" size="lg">` (기존 ui/Button 컴포넌트 재사용)
- CTA는 `<Link>`로 감싸 `/events/first-visit` 이동
- AnimateOnScroll로 스크롤 진입 시 fade-up

**접근성**:
- `<section aria-labelledby="home-first-visit-promo-title">`
- title에 `id="home-first-visit-promo-title"`
- CTA Link aria-label = `${firstVisit.homePromo.viewAll} - ${firstVisit.title}`

**모션**:
- `AnimateOnScroll` 기본 fade-up (`initial: opacity:0, y:30`, `animate: opacity:1, y:0`, `duration: 0.6`, threshold viewport 30%)
- `motion-reduce:transition-none` 자동 적용 (AnimateOnScroll 내장)

**ASCII 레이아웃** (상-하 분할, 사용자 선택 옵션):
```
┌─────────────────────────────────────────────┐
│                                             │
│            First Visit Only                 │ ← eyebrow (Cormorant)
│            첫방문 1회 체험가                │ ← title (기존 키 재사용)
│       리브를 처음 만나는 분께 드리는        │
│         단 1회의 체험 혜택                  │ ← subtitle
│                                             │
│       ✓ 11개 시술 · 최대 47% 할인          │ ← highlight 배지
│                                             │
│         [  전체 가격 보기  →  ]             │ ← Button CTA
│                                             │
└─────────────────────────────────────────────┘
```

---

### 5.3 `sections/index.ts` 변경

기존 export 목록 끝에 추가:
```ts
export { default as HomeFirstVisitSlimBanner } from './HomeFirstVisitSlimBanner';
export { default as HomeFirstVisitPromo } from './HomeFirstVisitPromo';
```

---

## 6. Page & Routing

### 6.1 `app/[locale]/page.tsx` 통합 (수정)

```tsx
import dynamic from 'next/dynamic';
import { Hero, HomeFirstVisitSlimBanner } from '@/components/sections';
// SlimBanner는 정적 import (Plan D6)

// Hero만 정적, 나머지는 dynamic (Plan D5, 기존 패턴 유지)
const HomeFirstVisitPromo = dynamic(
  () => import('@/components/sections/HomeFirstVisitPromo'),
  { ssr: true }
);
const Equipment = dynamic(() => import('@/components/sections/Equipment'), { ssr: true });
const Signature = dynamic(() => import('@/components/sections/Signature'), { ssr: true });
const CoreValues = dynamic(() => import('@/components/sections/CoreValues'), { ssr: true });
const Doctor = dynamic(() => import('@/components/sections/Doctor'), { ssr: true });
const MediaNewsSection = dynamic(() => import('@/components/sections/MediaNewsSection'), { ssr: true });
const Location = dynamic(() => import('@/components/sections/Location'), { ssr: true });

export default function HomePage() {
  return (
    <>
      <HomeFirstVisitSlimBanner />     {/* 신규 — Hero 위 */}
      <Hero />
      <Equipment />
      <HomeFirstVisitPromo />          {/* 신규 — Equipment 다음 */}
      <Signature />
      <CoreValues />
      <Doctor />
      <MediaNewsSection />
      <Location />
    </>
  );
}
```

### 6.2 라우팅 동작

| 진입점 | 클릭 대상 | next-intl Link href | 실제 이동 URL (ko 예) | 실제 이동 URL (en 예) |
|--------|-----------|---------------------|----------------------|----------------------|
| SlimBanner 전체 | `<Link>` 루트 | `/events/first-visit` | `/ko/events/first-visit` | `/en/events/first-visit` |
| HomePromo CTA 버튼 | `<Link>` 래퍼 | `/events/first-visit` | `/ko/events/first-visit` | `/en/events/first-visit` |

### 6.3 헤더와 SlimBanner 정합 (R7 완화)

**현재 헤더**: `liv-clinic/src/components/layout/Header.tsx`(추정) — fixed 상단.

**Design 결정**:
- SlimBanner는 페이지의 **inline 일반 흐름**에 들어간다 (fixed 아님).
- 헤더가 fixed라면 SlimBanner는 헤더 **아래로 자연스럽게 가려진다**.
- → **헤더 fixed 동작과 SlimBanner inline은 충돌하므로, 다음 중 선택**:
  - **(a) SlimBanner를 fixed로 헤더 바로 아래 고정** — z-index 충돌·헤더 높이 계산 필요
  - **(b) 헤더 위에 SlimBanner 배치, 헤더가 SlimBanner를 덮지 않도록 페이지 상단 패딩 조정** — 헤더 변경 필요(Plan SC-10 위배)
  - **(c) 헤더가 스크롤 시 hide 동작이라면 SlimBanner는 Hero 안쪽 상단으로 흡수** — 헤더 동작 의존
  - **(d) SlimBanner를 fixed하되 헤더와 stack하여 z-index를 헤더보다 높게 → 헤더는 그 아래** — UX 검토 필요

**Do 단계에서 헤더 코드 확인 후 (a) 또는 (d) 채택 권장.** 일단 본 Design은 **(a) — SlimBanner를 fixed top-0 z-50 + 헤더 top-offset을 SlimBanner 높이만큼 추가**를 1차 가정으로 명시하되, 헤더가 어떻게 구현되어 있는지에 따라 (d)로 전환할 수 있음을 명시한다.

> **개방 결정 OD-1**: SlimBanner 고정 방식 (a/b/c/d) — Do 단계에서 헤더 코드 확인 후 확정.

---

## 7. UX/UI Detailed Spec

### 7.1 디자인 토큰 (기존 LIV 토큰 그대로)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#b4988d` | SlimBanner 배경 그라데이션, HomePromo eyebrow, highlight 배지, CTA |
| `--color-secondary` | `#6d4e42` | SlimBanner 텍스트, HomePromo title |
| `--color-mono` | `#575756` | HomePromo subtitle |
| `--color-mono-light` | `#8a8a8a` | (해당 없음, 가격 미노출) |
| `--color-background` | `#f6f6f6` | HomePromo 섹션 배경 |
| `--color-border` | `#e5e5e5` | (해당 없음, HomePromo 카드는 primary/20 border 사용) |
| 폰트 (eyebrow) | Cormorant Garamond (`font-serif`) | `firstVisit.homePromo.eyebrow` |
| 폰트 (본문) | Pretendard | 나머지 모두 |

### 7.2 반응형 브레이크포인트

| 뷰포트 | SlimBanner | HomePromo |
|--------|-----------|-----------|
| ≥ 1280px (xl) | 텍스트 1줄, eyebrow + main + CTA 한 줄 | `max-w-3xl`, `px-12 py-16` |
| ≥ 768px (md) | 텍스트 1줄, eyebrow + main + CTA 한 줄 | `max-w-3xl`, `px-12 py-16` |
| ≥ 640px (sm) | 텍스트 1줄 (`text`) + CTA | `px-8 py-12` |
| < 640px (모바일) | `textShort` 단축 카피 + 화살표만 | `px-6 py-10`, eyebrow `text-h4` (다운사이즈) |
| < 360px (극소형) | `textShort` truncate | (해당 없음, max-w-3xl 컨테이너 자동 축소) |

### 7.3 인터랙션 상태

| 상태 | SlimBanner | HomePromo CTA |
|------|-----------|---------------|
| Default | `bg-gradient-to-r from-primary/15 to-primary/5` | `bg-primary text-white` (Button variant=primary) |
| Hover | `from-primary/20 to-primary/10`, 화살표 `translate-x-1` | `bg-primary/90`, 화살표 `translate-x-1` |
| Active | (브라우저 기본 활성 색 + 0.5px shift) | (Button 기본 active) |
| Focus-visible | `outline-2 outline-primary outline-offset-2` | Button 내장 focus-visible |
| Disabled | (해당 없음) | (해당 없음) |
| Reduced motion | hover transform 비활성 | hover transform 비활성 |

### 7.4 다크 그라데이션 위 색상 대비 (R6 검증)

- SlimBanner는 Hero **위**(아닌 Hero 위에 inline)에 있으므로 Hero 다크 배경에 영향 없음.
- 단, **헤더가 Hero 위에 transparent로 떠 있는 경우** Hero 배경이 SlimBanner 위치까지 비칠 수 있음.
- → SlimBanner 배경은 **불투명(`bg-white` 또는 `bg-background`) 베이스 + primary 그라데이션 overlay**로 처리하여 Hero 비침 방지.
- WCAG AA 검증: `text-secondary (#6d4e42)` on `bg-primary/15 (≈#f4ece9)` 대비 ≈ 5.8 → ✅ AA 통과.

### 7.5 RTL (Arabic) 처리

- SlimBanner: `flex` 컨테이너에 `dir="auto"` 상속. 화살표는 `start/end` 논리적 클래스 또는 `rtl:rotate-180` 처리.
- HomePromo: 중앙정렬이라 RTL 영향 최소. CTA 버튼의 화살표만 `rtl:rotate-180`.
- 폰트: 기존 `[dir=rtl]` 글로벌 스타일 그대로 사용 (별도 폰트 로드 없음).

---

## 8. Test Plan

### 8.1 L1 — 정적 검증 (lint, build, type check)

| ID | 검증 항목 | 도구 | 통과 기준 |
|----|-----------|------|-----------|
| L1-1 | 11개 로케일 `firstVisit.slimBanner.{text,textShort,cta}` 키 존재 | grep / 스크립트 | 11/11 파일 모두 존재 |
| L1-2 | 11개 로케일 `firstVisit.homePromo.{eyebrow,subtitle,highlight,viewAll}` 키 존재 | grep / 스크립트 | 11/11 파일 모두 존재 |
| L1-3 | TypeScript 빌드 에러 0 | `npm run build` | exit 0 |
| L1-4 | ESLint 에러 0 | `npm run lint` | exit 0 |
| L1-5 | `firstVisit.title` 기존 키 그대로 존재 (재사용 검증) | grep | 11/11 파일 |

### 8.2 L2 — 컴포넌트 렌더링 (Playwright UI 테스트)

| ID | 시나리오 | URL | 기대 결과 |
|----|----------|-----|-----------|
| L2-1 | SlimBanner ko 노출 | `/ko` | `firstVisit.slimBanner.text` 텍스트가 페이지 상단 1줄로 보임 |
| L2-2 | SlimBanner ja 노출 | `/ja` | "初回限定 1回体験価格 · 最大47%OFF" 보임 |
| L2-3 | SlimBanner ar 노출 (RTL) | `/ar` | 텍스트 + 화살표 모두 RTL 반전 |
| L2-4 | HomePromo ko 노출 | `/ko` (스크롤 Equipment 통과) | eyebrow "First Visit Only" + title "첫방문 1회 체험가" + subtitle + highlight + CTA 보임 |
| L2-5 | HomePromo 미니카드 노출 안 함 (D-NoPrice-Tease) | `/ko` | 가격(`₩`, `원`) 문자가 HomePromo 섹션에 노출되지 않음 |
| L2-6 | 모바일(<640px) SlimBanner | `/ko` viewport 360px | `textShort` 표시, `text` 숨김 |

### 8.3 L3 — E2E 라우팅 (Playwright)

| ID | 시나리오 | 단계 | 기대 결과 |
|----|----------|------|-----------|
| L3-1 | SlimBanner 클릭 → first-visit 페이지 | `/ko` 진입 → SlimBanner 클릭 | URL = `/ko/events/first-visit`, `FirstVisitTrialSection` 렌더 |
| L3-2 | HomePromo CTA 클릭 → first-visit 페이지 | `/en` 진입 → 스크롤 → CTA 클릭 | URL = `/en/events/first-visit` |
| L3-3 | 로케일 보존 | `/ja` 진입 → SlimBanner 클릭 | URL = `/ja/events/first-visit` (`/ko`로 빠지지 않음) |

### 8.4 L4 — 성능 회귀 (Lighthouse Mobile)

| ID | 지표 | 기준 |
|----|------|------|
| L4-1 | LCP | 기존 대비 ±5% 이내 |
| L4-2 | CLS | < 0.1 절대값, 기존 대비 +0.02 이내 |
| L4-3 | Performance Score | 기존 대비 -3 이내 |
| L4-4 | Total Blocking Time | 기존 대비 +50ms 이내 |

### 8.5 L5 — 접근성 (axe-core)

| ID | 항목 | 기준 |
|----|------|------|
| L5-1 | 색상 대비 (SlimBanner) | WCAG AA |
| L5-2 | aria-label (SlimBanner Link, HomePromo CTA) | 존재 |
| L5-3 | 키보드 focus 가능 (Tab 키) | 정상 |
| L5-4 | landmark `<section>` | HomePromo에 존재 |

---

## 9. Performance & Accessibility

### 9.1 번들 영향 예상

| 항목 | 추정 |
|------|------|
| SlimBanner JS (gzip) | < 2 KB |
| HomePromo JS (gzip) | < 5 KB (AnimateOnScroll, Button 재사용) |
| 신규 CSS | 없음 (Tailwind utility 재사용) |
| 신규 이미지/폰트 | 없음 |
| i18n 파일 크기 증가 | 각 파일 +400~600 bytes × 11 = ~5KB 총합 |

### 9.2 LCP/CLS 영향

- **SlimBanner**: Hero 위 1줄, 텍스트만, 이미지·비디오 無. 페이지 첫 페인트 시 즉시 렌더되며 Hero가 LCP 후보일 경우 Hero가 ~48px 아래로 밀린다. → Hero 비디오/포스터 로드는 동일하므로 LCP 시점 미세 변동만 발생.
- **HomePromo**: dynamic import + Equipment(below-fold) 다음 위치. 초기 페인트에 미포함. CLS 영향은 AnimateOnScroll의 `initial: y:30 → 0` 변환 30px에서 발생할 수 있으나, viewport 진입 후 트리거되므로 above-the-fold 영향 없음.

### 9.3 접근성 체크리스트

- [x] 모든 인터랙티브 요소(Link, Button)에 명확한 텍스트 또는 aria-label
- [x] 색상 대비 WCAG AA
- [x] 키보드 네비게이션 (Tab → SlimBanner → Header → Hero CTA → ... → HomePromo CTA)
- [x] `motion-reduce` 자동 적용 (AnimateOnScroll 내장)
- [x] RTL 정합 (start/end 논리 속성)
- [x] 의미 있는 HTML (`<section>`, `<h2>` 또는 적절한 heading level)

---

## 10. i18n Spec

### 10.1 키 추가 위치 (각 파일 동일)

각 `messages/{locale}.json`의 기존 `"firstVisit": { ... }` 블록 내부 끝에 추가. JSON 파싱 안정성을 위해 다른 키 사이에 끼우지 말고 `items` 또는 `categories` 다음에 배치.

### 10.2 키 누락 검증 스크립트 (Do 단계 사용)

```bash
# liv-clinic/ 에서 실행
for locale in ko en ja zh zh-TW vi th ru fr mn ar; do
  for key in "slimBanner.text" "slimBanner.textShort" "slimBanner.cta" \
             "homePromo.eyebrow" "homePromo.subtitle" "homePromo.highlight" "homePromo.viewAll"; do
    if ! jq -e ".firstVisit.${key%.*}.${key#*.}" "src/messages/${locale}.json" > /dev/null 2>&1; then
      echo "MISSING: ${locale} -> firstVisit.${key}"
    fi
  done
done
```

### 10.3 카피 톤 가이드라인 (의료 광고법)

- ❌ 절대적 표현 회피: "최고", "유일", "1위", "완벽한", "100%"
- ✅ 사실 기반: "최대 47% 할인" (특정 시술 기준), "11개 시술 · 첫방문 1회 체험가"
- ✅ 부가세/부작용 고지: 본 페이지(`/events/first-visit`)에서 처리, 배너에 미노출
- ✅ "단 1회" / "first visit only" 명시로 오해 방지

---

## 11. Implementation Guide

### 11.1 작업 순서 (권장)

1. **데이터 (Domain) — 변경 없음**
   - `lib/firstVisitTrial.ts` 수정 없음 확인 (Plan T1 무효화, D-NoPrice-Tease)
2. **i18n (11개 파일)**
   - `messages/ko.json`부터 7개 키 추가 후 다른 10개 파일에 복제·번역
   - 11.2 키 표 그대로 적용
3. **컴포넌트 작성**
   - `HomeFirstVisitSlimBanner.tsx` 작성
   - `HomeFirstVisitPromo.tsx` 작성
   - `sections/index.ts`에 export 추가
4. **페이지 통합**
   - `app/[locale]/page.tsx` 수정 — SlimBanner는 정적 import, Promo는 dynamic
5. **헤더 정합 확인 (OD-1)**
   - `components/layout/Header.tsx` 코드 확인 후 SlimBanner를 fixed(a) 또는 inline 처리 결정
6. **검증 (L1~L5)**
   - 11개 로케일 키 누락 확인 (L1-1/2)
   - `npm run build` / `npm run lint` (L1-3/4)
   - 데스크탑(1280px) / 모바일(360px) / RTL(ar) 캡처 (L2-1~6)
   - Playwright E2E 3개 (L3-1~3)
   - Lighthouse 회귀 측정 (L4)

### 11.2 변경 파일 목록 (정확)

| 파일 | 변경 종류 | 예상 라인 수 |
|------|-----------|-------------|
| `liv-clinic/src/components/sections/HomeFirstVisitSlimBanner.tsx` | 신규 | ~60 |
| `liv-clinic/src/components/sections/HomeFirstVisitPromo.tsx` | 신규 | ~120 |
| `liv-clinic/src/components/sections/index.ts` | 수정 (export 2개 추가) | +2 |
| `liv-clinic/src/app/[locale]/page.tsx` | 수정 (import + JSX) | +3, -0 |
| `liv-clinic/src/messages/ko.json` | 수정 (firstVisit에 신규 키 7개) | +9 |
| `liv-clinic/src/messages/en.json` | 수정 | +9 |
| `liv-clinic/src/messages/ja.json` | 수정 | +9 |
| `liv-clinic/src/messages/zh.json` | 수정 | +9 |
| `liv-clinic/src/messages/zh-TW.json` | 수정 | +9 |
| `liv-clinic/src/messages/vi.json` | 수정 | +9 |
| `liv-clinic/src/messages/th.json` | 수정 | +9 |
| `liv-clinic/src/messages/ru.json` | 수정 | +9 |
| `liv-clinic/src/messages/fr.json` | 수정 | +9 |
| `liv-clinic/src/messages/mn.json` | 수정 | +9 |
| `liv-clinic/src/messages/ar.json` | 수정 | +9 |
| (잠재) `liv-clinic/src/components/layout/Header.tsx` | OD-1 결정에 따라 0 또는 일부 수정 | 0 ~ +5 |

**총합**: 신규 2 + 수정 13(또는 14) = **15~16개 파일**

### 11.3 Session Guide

#### Module Map

| Module | Scope | 파일 | 의존성 |
|--------|-------|------|--------|
| **M1-i18n** | 11개 로케일 키 추가 | `messages/*.json` 11개 | 없음 (독립 진행 가능) |
| **M2-slim** | SlimBanner 컴포넌트 | `HomeFirstVisitSlimBanner.tsx` + `sections/index.ts`(부분) | M1-i18n |
| **M3-promo** | HomePromo 컴포넌트 | `HomeFirstVisitPromo.tsx` + `sections/index.ts`(부분) | M1-i18n |
| **M4-page** | 홈 페이지 통합 + 헤더 정합 | `app/[locale]/page.tsx` (+ 잠재 `Header.tsx`) | M2-slim, M3-promo |
| **M5-verify** | L1-L5 검증 | 변경 없음, 측정만 | M4-page |

#### Recommended Session Plan

**Session 1 (단일 세션 완결 권장 — 컨텍스트 50%룰 충족 가능)**
- `/pdca do home-first-visit-banner` → M1 + M2 + M3 + M4 일괄 진행
- 11개 i18n 파일 추가는 반복 작업이지만 패턴 동일, 한 세션 처리 가능

**대안: 2 세션 분할**
- Session 1: `/pdca do home-first-visit-banner --scope M1-i18n,M2-slim,M3-promo`
- Session 2: `/pdca do home-first-visit-banner --scope M4-page,M5-verify`

---

## 12. Risks & Open Decisions

### 12.1 Risks (Plan에서 이관 + Design 단계 신규)

| ID | 위험 | 영향 | 완화 |
|----|------|------|------|
| R1 | LCP 영역 변경 | M | SlimBanner 텍스트만, 이미지·애니메이션 無 |
| R2 | 11개 로케일 신규 키 미번역 | H | L1-1/L1-2 자동 grep + 스크립트(10.2) |
| R3 | 재방문자 노출 피로 | L | `dismissible` props 슬롯 존재, 향후 옵션화 가능 |
| **R4'** | ~~인기 4선 정책 불일치~~ | ~~M~~ | **D-NoPrice-Tease로 무효화** ✅ |
| R5 | 모바일 SlimBanner 텍스트 잘림 | M | `slimBanner.textShort` 별도 키 + `hidden sm:inline` 분기 |
| R6 | 다크 그라데이션 색상 대비 | M | SlimBanner 불투명 베이스 처리, WCAG AA 검증 (7.4) |
| R7 | 헤더 fixed 정합 | M | OD-1로 Do 단계 결정, 헤더 코드 확인 후 a/b/c/d 선택 |
| R8 | 카피 의료 광고법 위배 가능성 | M | 10.3 톤 가이드라인 + 병원/언어 검수 (Do 단계) |
| **R9-신규** | 11개 로케일 카피 길이 차이로 SlimBanner 1줄 깨짐 | M | 가장 긴 카피(러시아어/베트남어) 기준 모바일에서 `textShort` 사용 강제, 데스크톱은 `truncate` 적용 |
| **R10-신규** | HomePromo가 가격 미노출이라 클릭 동기 약함 | M | `highlight` 배지에 "최대 47% 할인" 구체 수치 노출하여 클릭 동기 보강 |

### 12.2 Open Decisions (Do 단계 확정)

| OD | 결정 사항 | 1차 가정 | 확정 시점 |
|----|-----------|----------|-----------|
| **OD-1** | SlimBanner 위치 (fixed vs inline) | (a) fixed top-0 z-50, 헤더는 SlimBanner 아래로 | Do 시 헤더 코드 확인 후 |
| **OD-2** | 11개 로케일 카피 최종 확정 | 3.4 표 그대로 | Do 시 병원/언어 검수 |
| **OD-3** | SlimBanner 좌측 eyebrow 아이콘 (✨ 또는 SVG) | 인라인 SVG (이모지 미사용 — first-visit-trial-events.design.md 지침과 일치) | Do |
| **OD-4** | HomePromo 배경 (`bg-background` vs `bg-white`) | `bg-background` (홈 다른 섹션과 통일) | Do |

---

## 13. 참고 자료

- **Plan**: `docs/01-plan/features/home-first-visit-banner.plan.md`
- **이전 피처 Design**: `docs/02-design/features/first-visit-trial-events.design.md`
- **데이터 SSOT (참조만)**: `liv-clinic/src/lib/firstVisitTrial.ts`
- **첫방문 페이지**: `liv-clinic/src/app/[locale]/events/first-visit/page.tsx`
- **기존 진입 배너 패턴**: `liv-clinic/src/app/[locale]/events/page.tsx:80-101`
- **UI 컴포넌트**: `liv-clinic/src/components/ui/` (Button, AnimateOnScroll)
- **i18n routing Link**: `liv-clinic/src/i18n/routing.ts`
- **홈 페이지**: `liv-clinic/src/app/[locale]/page.tsx`
- **i18n 용어 사전**: `docs/i18n-glossary.md`
- **사용자 결정 기록**:
  - 2026-05-29 노출 방식: B + C 동시 적용
  - 2026-05-29 노출 대상: 모든 방문자에게 항상 노출
  - 2026-05-29 다국어 범위: 전체 11개 로케일
  - 2026-05-29 아키텍처: Option C — Pragmatic Balance
  - 2026-05-29 HomePromo 레이아웃: 상-하 분할 (세로)
  - **2026-05-29 HomePromo 시술 노출: 시술명·가격 미노출, 클릭 유도형으로 변경** (D-NoPrice-Tease)
