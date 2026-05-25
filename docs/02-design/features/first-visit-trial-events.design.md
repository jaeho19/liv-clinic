# 첫방문 1회 체험가 이벤트 페이지 — 설계

> **Feature**: `first-visit-trial-events`
> **Phase**: Design
> **Created**: 2026-05-25
> **Plan**: `docs/01-plan/features/first-visit-trial-events.plan.md`
> **선택 아키텍처**: **C — 실용 균형** / 레이아웃: **카테고리 섹션 + 테이블** (사용자 결정 2026-05-25)

---

## Context Anchor

| 키 | 값 |
|----|----|
| **WHY** | 첫방문 신규 고객용 체험가 프로모션을 웹/다국어로 노출해 상담 전환을 높인다. |
| **WHO** | 첫 방문 예정 신규 고객(국내·해외), 11개 로케일 글로벌 고객, 모바일 비중 높음. |
| **RISK** | 가격/문구 법적·임상 정확성, 11개 로케일 의료 번역 품질, 가격 오타, 프로모 종료 유지보수. |
| **SUCCESS** | 11개 시술 정확 노출, 11개 로케일 키 누락 0, 고지 포함, LIV 정합, 반응형 정상, `/events` 진입. |
| **SCOPE** | `/events/first-visit` 라우트 + 가격 SSOT + `firstVisit.*` 11개 메시지 + 전용 섹션 컴포넌트 + `/events` 진입 링크. |

---

## 1. Overview

`/events/first-visit` 신규 정적 페이지. 서버 컴포넌트 `page.tsx`(로케일별 `generateMetadata`)가 클라이언트 섹션 `FirstVisitTrialSection`을 렌더한다. 가격 데이터는 `lib/firstVisitTrial.ts` SSOT, 모든 텍스트는 `firstVisit.*` i18n 네임스페이스(11개 로케일). 공유 `PriceTable`/`pricing.ts`는 **건드리지 않는다**(회귀 위험 0). 레이아웃은 5개 카테고리 그룹 × `divide-y` 행, 우측에 정가 취소선 + 체험가 + 할인% 배지.

---

## 2. Architecture Decision

| | A 최소변경 | B 클린 | **C 실용균형 ✅** |
|--|--|--|--|
| 데이터 | pricing.ts 확장 | 신규 전용 | **신규 lib/firstVisitTrial.ts** |
| 컴포넌트 | PriceTable 수정 | 다수 프리미티브 | **단일 FirstVisitTrialSection** |
| i18n | pricing.* 재사용 | firstVisit.* | **firstVisit.*** |
| 회귀 위험 | ⚠️ 높음 | 없음 | **없음** |

**선택 근거**: 공유 PriceTable(15+ 시술상세 사용) 미수정으로 회귀 0, 전용 네임스페이스로 11개 번역 깔끔, 정가→체험가 할인 표시를 자유롭게 디자인, 파일 수 적당.

---

## 3. Data Model — `src/lib/firstVisitTrial.ts` (신규)

```ts
/**
 * 첫방문 1회 체험가 SSOT.
 * 가격은 정수(원). originalPrice=null 이면 '체험가만' 표기(제모).
 * discountRate는 소스(docx) 표기값을 그대로 사용(반올림 일치 확인).
 * ⚠️ 임상·카피·가격은 병원 최종 검수 필요.
 */
export type TrialCategory =
  | 'hairRemoval' | 'skincare' | 'botox' | 'injection' | 'lifting';

export type TrialItem = {
  id: string;                  // i18n: firstVisit.items.{id}.name / .desc
  category: TrialCategory;
  originalPrice: number | null;// null = 체험가 only
  trialPrice: number;
  discountRate: number | null; // 예: 47 → "-47%"
  hasOption?: boolean;         // true면 firstVisit.items.{id}.option 노출(프리미엄 스킨케어 택1 안내)
};

export const TRIAL_CATEGORY_ORDER: TrialCategory[] =
  ['hairRemoval', 'skincare', 'botox', 'injection', 'lifting'];

export const FIRST_VISIT_TRIALS: TrialItem[] = [
  { id: 'armpitHairRemoval', category: 'hairRemoval', originalPrice: null,    trialPrice: 5000,   discountRate: null },
  { id: 'lipHairRemoval',    category: 'hairRemoval', originalPrice: null,    trialPrice: 5000,   discountRate: null },
  { id: 'premiumSkincare',   category: 'skincare',    originalPrice: 150000,  trialPrice: 80000,  discountRate: 47, hasOption: true },
  { id: 'botoxKr',           category: 'botox',       originalPrice: 60000,   trialPrice: 36000,  discountRate: 40 },
  { id: 'botoxDe',           category: 'botox',       originalPrice: 160000,  trialPrice: 104000, discountRate: 35 },
  { id: 'botoxUs',           category: 'botox',       originalPrice: 190000,  trialPrice: 123000, discountRate: 35 },
  { id: 'rejuran2cc',        category: 'injection',   originalPrice: 300000,  trialPrice: 195000, discountRate: 35 },
  { id: 'rejuran2cc3x',      category: 'injection',   originalPrice: 920000,  trialPrice: 560000, discountRate: 39 },
  { id: 'ivCustom',          category: 'injection',   originalPrice: 50000,   trialPrice: 29000,  discountRate: 42 },
  { id: 'inmode',            category: 'lifting',     originalPrice: 250000,  trialPrice: 149000, discountRate: 40 },
  { id: 'ulthera300',        category: 'lifting',     originalPrice: 1470000, trialPrice: 990000, discountRate: 33 },
];

export const groupByCategory = (items = FIRST_VISIT_TRIALS) =>
  TRIAL_CATEGORY_ORDER
    .map((category) => ({ category, items: items.filter((i) => i.category === category) }))
    .filter((g) => g.items.length > 0);
```

**카테고리 매핑(5)**: 제모(2) · 스킨케어(1) · 보톡스(3) · 리쥬란·수액 주사(3: rejuran2cc / rejuran2cc3x / ivCustom) · 리프팅(2: inmode / ulthera300).

> **데이터 검증표**(docx 대조, SC-1): armpit/lip 5,000(체험가) · skincare 150k→80k(-47) · botoxKr 60k→36k(-40) · botoxDe 160k→104k(-35) · botoxUs 190k→123k(-35) · rejuran2cc 300k→195k(-35) · rejuran2cc3x 920k→560k(-39) · ivCustom 50k→29k(-42) · inmode 250k→149k(-40) · ulthera300 1,470k→990k(-33).

---

## 4. i18n Spec — `firstVisit.*` 네임스페이스 (11개 로케일)

**키 구조 (ko 기준):**
```jsonc
"firstVisit": {
  "eyebrow": "First Visit",                 // 영문 serif eyebrow (Cormorant)
  "title": "첫방문 1회 체험가",
  "subtitle": "리브를 처음 방문하시는 분께 드리는 1회 체험 혜택",
  "trialOnceNote": "첫방문 1회만 적용됩니다",
  "trialBadge": "체험가",                    // originalPrice 없는 항목
  "unit": "원",                             // 통화 접미사(숫자 뒤에 부착)
  "originalLabel": "정가",                   // 접근성용(스크린리더)
  "categories": {
    "hairRemoval": "제모",
    "skincare": "스킨케어",
    "botox": "보톡스",
    "injection": "리쥬란·수액 주사",
    "lifting": "리프팅"
  },
  "items": {
    "armpitHairRemoval": { "name": "겨드랑이 제모 (1회)", "desc": "레이저로 겨드랑이 부위 모근을 선택적으로 파괴하는 시술입니다." },
    "lipHairRemoval":    { "name": "인중 제모 (1회)",    "desc": "인중 부위 잔털을 레이저로 제거해 깔끔한 인상을 만드는 시술입니다." },
    "premiumSkincare":   { "name": "프리미엄 스킨케어", "desc": "피부 타입에 맞춘 수분 공급·각질 정리·진정 맞춤 관리 프로그램입니다.", "option": "울블랑 초음파 / 물톡스 / 플라필 중 택1 · 1인실 제공" },
    "botoxKr":  { "name": "사각턱 보톡스 50U (국산)",   "desc": "과도하게 발달한 턱 근육(저작근) 부피를 일시적으로 줄여 하안면 라인을 개선합니다." },
    "botoxDe":  { "name": "사각턱 보톡스 50U (독일산)", "desc": "과도하게 발달한 턱 근육(저작근) 부피를 일시적으로 줄여 하안면 라인을 개선합니다." },
    "botoxUs":  { "name": "사각턱 보톡스 50U (미국산)", "desc": "과도하게 발달한 턱 근육(저작근) 부피를 일시적으로 줄여 하안면 라인을 개선합니다." },
    "rejuran2cc":   { "name": "리쥬란 힐러 재생주사 2cc", "desc": "연어 유래 성분(PN)을 진피층에 전달해 피부 자생력을 높이고 환경을 개선합니다." },
    "rejuran2cc3x": { "name": "리쥬란 힐러 2cc · 3회 (12주 케어)", "desc": "연어 유래 성분(PN)을 진피층에 전달해 피부 자생력을 높이고 환경을 개선합니다." },
    "ivCustom":     { "name": "내맘대로 수액", "desc": "개인 컨디션에 따라 필요한 비타민·영양 성분을 정맥으로 보충하는 요법입니다." },
    "inmode":       { "name": "인모드 리프팅 (2가지 모드)", "desc": "고주파 에너지로 불필요한 지방 세포 사멸과 콜라겐 생성을 동시에 유도합니다." },
    "ulthera300":   { "name": "울쎄라피 프라임 300샷", "desc": "고강도 집속 초음파(HIFU)를 피부 깊은 층까지 전달해 탄력 개선·리프팅 효과를 줍니다." }
  },
  "disclaimer": "모든 시술은 개인에 따라 부기·멍·염증 등 부작용이 나타날 수 있으므로 의료진과 충분한 상담이 필요합니다.",
  "vatNote": "표시 가격은 부가세 별도입니다.",
  "cta": { "title": "첫방문 상담을 예약하세요", "book": "상담 예약하기", "call": "전화 상담" },
  "meta": {
    "title": "첫방문 1회 체험가 | 리브성형외과",
    "description": "리브성형외과 첫방문 고객 전용 1회 체험가. 제모 5,000원부터 보톡스·리쥬란·인모드·울쎄라까지 최대 47% 할인 혜택을 확인하세요."
  }
}
```

**번역 규칙** (`docs/i18n-glossary.md` 강제):
- 시술명 표기: 보톡스→Botox/肉毒素/肉毒桿菌素/ボトックス/Botox/โบท็อกซ์/Ботокс; 리쥬란→Rejuran/婴儿针/嬰兒針/リジュラン/Rejuran/รีจูรัน/Реюран; 인모드→**InMode 고정**; 울쎄라→Ultherapy Prime/超声刀 Prime/超音波拉提/ウルセラプライム/…; 제모→Hair Removal/脱毛/脱毛/脫毛/Triệt lông/กำจัดขน/Эпиляция.
- fr/mn/ar: `i18n-treatments-fr-mn-ar.plan.md` 톤 준수, 시술명 영문 유지 + 현지 보조.
- 약어 HIFU/PN/RF/IU 영문 유지. 숫자/콤마는 코드 포맷, 통화 접미사만 `unit` 번역.
- **모든 의료 문구·가격: 코드 주석 `// 임상·카피 검수 필요(병원 확인)` + 본 문서 RISK 명시.**
- **키 누락 0**: ko 키 셋을 11개 파일에 동일 적용(SC-2). 누락 시 next-intl 폴백 없이 키 노출되므로 전수 추가.

---

## 5. Component Design — `src/components/sections/FirstVisitTrialSection.tsx` (신규, `'use client'`)

```
FirstVisitTrialSection
├─ Hero (좌정렬, anti-center)
│   ├─ <p font-serif text-primary>{eyebrow}</p>
│   ├─ <h1 text-h1 text-secondary>{title}</h1>
│   ├─ <p text-mono>{subtitle}</p>
│   └─ <span chip>{trialOnceNote}</span>
├─ TrialGroups (groupByCategory())
│   └─ for each group:
│       ├─ <h2 카테고리 헤더 + 카운트>           // border-b border-primary/30
│       └─ <ul divide-y divide-border>
│           └─ TrialRow (각 item)
│               ├─ 좌: name (text-secondary font-medium) + desc(text-small text-mono-light)
│               │        + option(있으면 text-xs primary)
│               └─ 우: PriceBlock
│                     ├─ originalPrice 있으면: <s text-mono-light>{정가}{unit}</s>
│                     ├─ <strong text-h4 text-secondary>{체험가}{unit}</strong>
│                     └─ 배지: discountRate 있으면 "-{rate}%"(bg-primary/10 text-primary)
│                              없으면 {trialBadge}(체험가) pill
├─ Disclaimer (bg-background, border-l-4 border-primary)
│   └─ disclaimer + vatNote + trialOnceNote (의료광고 고지 — 필수 노출)
└─ CTA (bg-secondary text-white): {cta.title} + [상담예약 ScrollLink /contact] [전화 tel:]
```

**가격 포맷 헬퍼**(컴포넌트 내):
```ts
const fmt = (n: number) => `${n.toLocaleString('en-US')}${t('unit')}`; // 80,000원 / 80,000KRW
```
콤마는 로케일 무관 `en-US`(천단위)로 통일, 단위만 i18n.

**TrialRow 반응형**: 데스크톱 `flex items-center justify-between gap-6`; 모바일(<640px) 가격 블록이 좁으면 `flex-wrap` 없이 우측 정렬 유지(가격 짧음). desc는 2줄 클램프(`line-clamp-2`) 없이 자연 줄바꿈. **가로 스크롤 0** 보장.

**design-taste 적용(LIV 토큰 내)**: 좌정렬 히어로(anti-center), 카드 남용 대신 `divide-y` 그룹핑(VISUAL_DENSITY 4), 단일 accent=rose primary(THE LILA BAN 준수), 이모지 0(인라인 SVG만), 순흑 금지(secondary/mono 사용), 배지·행 hover에 `transition-colors`/미세 `AnimateOnScroll` 스태거(MOTION_INTENSITY 6, 스프링은 기존 AnimateOnScroll 사용), `picsum` 등 외부 이미지 불필요(텍스트 기반).

---

## 6. Page & Routing — `src/app/[locale]/events/first-visit/page.tsx` (신규, 서버)

```tsx
import { getTranslations } from 'next-intl/server';
import { BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';
import FirstVisitTrialSection from '@/components/sections/FirstVisitTrialSection';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'firstVisit.meta' });
  const url = `${BASE_URL}/${locale}/events/first-visit`;
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description'), url, siteName: SITE_INFO.name, type: 'website',
      images: [{ url: `${BASE_URL}/images/placeholder-event.jpg`, width: 800, height: 1200, alt: t('title') }] },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
    alternates: { canonical: url, languages: Object.fromEntries(
      ['ko','en','ja','zh','zh-TW','vi','th','ru','fr','mn','ar'].map(l => [l, `${BASE_URL}/${l}/events/first-visit`])) },
  };
}

export default function FirstVisitPage() {
  return <FirstVisitTrialSection />;
}
```

기존 `events/[eventId]/page.tsx` 메타 패턴과 정합. OG 이미지는 기존 `placeholder-event.jpg` 재사용(전용 OG는 향후).

---

## 7. `/events` 진입점 (필수, 최소 침습)

`events/page.tsx` Hero 직후 **프로모 배너 1개** 삽입:
```tsx
import { Link } from '@/i18n/routing';
// Hero <section> 다음:
<section className="py-4 bg-background">
  <div className="container-custom">
    <Link href="/events/first-visit"
      className="group flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-6 py-5 transition-colors hover:bg-primary/10">
      <div>
        <p className="font-serif text-primary text-small">First Visit</p>
        <p className="text-h4 text-secondary">{t('firstVisitBanner.title')}</p>{/* events.firstVisitBanner.* */}
        <p className="text-small text-mono-light">{t('firstVisitBanner.subtitle')}</p>
      </div>
      <span className="shrink-0 text-primary group-hover:translate-x-1 transition-transform" aria-hidden>→ SVG</span>
    </Link>
  </div>
</section>
```
→ `events.firstVisitBanner.{title,subtitle}` 키도 11개 로케일 추가(또는 `firstVisit.bannerTitle` 재사용). **결정: `firstVisit.banner.{title,subtitle}`로 통합**(한 네임스페이스 유지).

> events/page.tsx는 `'use client'`이며 이미 `useTranslations('events')` 사용. 배너 텍스트는 `useTranslations('firstVisit')` 추가 훅으로 접근.

---

## 8. Design Tokens (고정)

| 토큰 | 값 | 용도 |
|------|----|----|
| `--color-primary` | #b4988d | eyebrow, 배지, 강조, hover |
| `--color-secondary` | #6d4e42 | 제목, 체험가 |
| `--color-mono` / `-light` | #575756 / #8a8a8a | 본문 / 정가 취소선·보조 |
| `--color-background` | #f6f6f6 | 섹션 배경, disclaimer |
| `font-serif` (Cormorant) | — | 영문 eyebrow |
| Pretendard | — | 본문 전체 |
| `.container-custom` / `.section-gap-md` / `.text-h1~h4` | — | 레이아웃/타이포 |

스킬 기본값(Geist/Satoshi, emerald/blue, `rounded-[2.5rem]`) **미사용**.

---

## 9. Test Plan (Check 단계 입력)

- **L1 (정합/빌드)**: `npm run build` exit 0; `/ko/events/first-visit` 200; 11개 로케일 라우트 200.
- **L2 (UI/i18n)**: 11개 로케일 전환 시 `firstVisit.*` 키 누락(raw key) 0; 11개 시술 정가/체험가/할인% docx 일치(SC-1); disclaimer·vat·1회 고지 노출(SC-3); `/events` 배너 클릭→이동(SC-5).
- **L3 (반응형/접근성)**: 모바일 360px 가로 스크롤 0(SC-6); 정가 취소선에 `aria-label=정가`; 배지 색 대비; 이모지 0(SC-7).
- **키 누락 가드 스크립트**: ko 키 셋 ⊆ 각 로케일(누락 목록 출력).

---

## 10. File Change Map

| 파일 | 유형 | 비고 |
|------|------|------|
| `src/lib/firstVisitTrial.ts` | 신규 | 가격 SSOT + 타입 + groupByCategory |
| `src/components/sections/FirstVisitTrialSection.tsx` | 신규 | 전용 섹션(client) |
| `src/components/sections/index.ts` | 수정 | export 추가(있으면) |
| `src/app/[locale]/events/first-visit/page.tsx` | 신규 | 서버 page + generateMetadata |
| `src/app/[locale]/events/page.tsx` | 수정(최소) | 프로모 배너 1개 |
| `src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,fr,mn,ar}.json` | 수정 ×11 | `firstVisit.*` 추가 |

공유 `PriceTable.tsx`/`pricing.ts` **미변경**.

---

## 11. Implementation Guide

### 11.1 구현 순서
1. `lib/firstVisitTrial.ts` (데이터 SSOT) — docx 대조 검증
2. `messages/ko.json` `firstVisit.*` 추가(원본 카피) → 나머지 10개 로케일 번역(용어집 적용)
3. `FirstVisitTrialSection.tsx` (히어로+그룹테이블+고지+CTA)
4. `events/first-visit/page.tsx` (서버+메타)
5. `events/page.tsx` 프로모 배너
6. 검증: build + 11개 로케일 + 반응형 + 키 누락 스크립트

### 11.2 Code Comment Convention
- 파일 헤더: `// Design Ref: §3 데이터 모델` / `§5 컴포넌트`
- 가격 데이터: `// Plan SC-1: docx 가격 일치` + `// 임상·카피·가격 검수 필요(병원 확인)`

### 11.3 Session Guide

**Module Map**
| 모듈 | scope 키 | 파일 | 의존 |
|------|----------|------|------|
| M1 데이터 | `data` | firstVisitTrial.ts | — |
| M2 i18n | `i18n` | messages ×11 | M1(키 정합) |
| M3 UI | `ui` | FirstVisitTrialSection.tsx | M1, M2 |
| M4 라우트 | `route` | events/first-visit/page.tsx | M3, M2 |
| M5 진입 | `entry` | events/page.tsx | M2 |

**권장 세션 분할**
- **세션 1**: M1 + M2(ko/en/ja/zh) + M3 + M4 — 핵심 동작 페이지 완성(4개 로케일)
  - `/pdca do first-visit-trial-events --scope data,i18n,ui,route`
- **세션 2**: M2 나머지 7개 로케일(zh-TW/vi/th/ru/fr/mn/ar) 완역 + M5 진입 배너
  - `/pdca do first-visit-trial-events --scope i18n,entry`
- (단일 세션 진행도 가능: 전체 한 번에)

---

## 12. 다음 단계
`/pdca do first-visit-trial-events` (전체) 또는 `--scope data,i18n,ui,route`(세션 1).
