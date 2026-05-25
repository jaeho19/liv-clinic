# 첫방문 1회 체험가 이벤트 페이지

> **Feature**: `first-visit-trial-events`
> **Phase**: Plan
> **Created**: 2026-05-25
> **Owner**: 리브성형외과 웹
> **Source**: `첫방문 체험가.docx` (카카오톡 수신, 2026-05)
> **연관**: 기존 `/events` (Supabase DB 기반), `PriceTable`/`lib/pricing.ts` 패턴, `docs/i18n-glossary.md`

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem (문제)** | 신규 고객 유입을 위한 **"첫방문 1회 체험가"** 프로모션(11개 시술, 정가 대비 33~47% 할인 + 제모 체험가 5,000원)이 존재하지만, 웹사이트에 노출할 채널이 없다. 기존 `/events`는 전부 Supabase DB로 관리되어 정적 가격표 콘텐츠를 담기에 부적합하고, 11개 로케일 다국어 고객에게 가격 혜택이 전달되지 않는다. |
| **Solution (해결)** | `/events/first-visit` **독립 정적 페이지**를 신설한다. 가격표 데이터는 코드(`lib/`)에 SSOT로 보관하고, 모든 텍스트는 `next-intl` 메시지로 분리해 **11개 로케일 완역**한다. 가격은 **정가 취소선 + 체험가 + 할인% 배지** 형식으로 표시하고, LIV 브랜드 토큰(더스티 로즈 `#b4988d`, Pretendard/Cormorant)을 유지한 채 `design-taste-frontend`의 구조·모션·anti-slop 규칙을 적용한다. |
| **Function·UX 효과** | 첫방문 고객이 한 화면에서 11개 시술의 할인 혜택을 직관적으로 비교·이해하고 상담 예약으로 전환된다. 언어 전환 시 시술명·설명·가격 단위가 자연스럽게 현지화된다. 카드/리스트형 가격표가 "정가→체험가" 절감액을 시각적으로 강조한다. |
| **Core Value (핵심 가치)** | **"첫방문 = 부담 없는 시작"** — 5,000원 제모부터 990,000원 울쎄라까지, 신규 고객의 진입 장벽을 가격으로 낮춰 내원·상담 전환을 끌어올린다. DB 변경 없이 버전관리되는 정적 콘텐츠로 안정성·속도 확보. |

---

## Context Anchor

| 키 | 값 |
|----|----|
| **WHY** | 첫방문 신규 고객 유치용 체험가 프로모션을 웹/다국어로 노출할 채널이 없다. 가격 혜택을 직관적·현지화하여 상담 전환을 높인다. |
| **WHO** | 첫 방문 예정 신규 고객(국내·해외). 11개 로케일(ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar) 글로벌 고객 포함. 모바일 비중 높음. |
| **RISK** | ① 의료 가격/문구의 **법적·임상 정확성**(부가세 별도·부작용 고지 필수) ② 11개 로케일 **의료 용어 번역 품질**(임상 검수 필요) ③ 정가→체험가 **가격 데이터 오타**(직접적 신뢰·법적 리스크) ④ 프로모션 **종료/가격 변경 시 유지보수**(정적이라 코드 수정 필요). |
| **SUCCESS** | 11개 시술 전부 정확한 정가/체험가/할인% 노출, 11개 로케일 완역(키 누락 0), 부작용·부가세 고지 포함, LIV 브랜드 정합, 모바일/데스크톱 반응형 정상, `/events`에서 진입 가능. |
| **SCOPE** | 신규 라우트 `/[locale]/events/first-visit` + 가격 데이터 SSOT + 11개 `messages/*.json` 키 + 가격표 UI 컴포넌트(정가 취소선·할인 배지) + `/events` 진입 링크. |

---

## 1. 배경 & 문제 정의

### 1.1 현재 상태 (코드 근거)
- **`/events`는 100% DB 기반**: `events/page.tsx`가 `fetchPublishedEvents()`(`lib/eventApi.ts`)로 `/api/events`(Supabase) 호출. 관리자(`admin/(authenticated)/events`)에서 CRUD. 필터 탭은 **상태 기반**(전체/진행중/종료)이며, `EventItem.category`는 데이터엔 있으나 **UI 필터로 노출되지 않음**.
- **정적 가격표 패턴 존재**: `components/ui/PriceTable.tsx` + `lib/pricing.ts`(`PRICING` SSOT). 단, **단일 가격만** 표시(정가→할인가 미지원), i18n 키는 `pricing.labels.{treatmentId}.{rowKey}` 구조.
- **다국어**: 실제 로케일은 **11개**(`i18n/routing.ts` `LOCALES`): `ko, en, ja, zh, zh-TW, vi, th, ru, fr, mn, ar`. (CLAUDE.md의 "4개"는 구버전 기술)
- **번역 가이드**: `docs/i18n-glossary.md`에 보톡스/리쥬란/InMode/울쎄라/스킨케어 등 시술명이 8개 로케일(ko~ru)로 고정 표기되어 있음. fr/mn/ar은 `i18n-treatments-fr-mn-ar.plan.md` 참조.
- **브랜드 토큰**: `globals.css` `--color-primary:#b4988d`, `.container-custom`, `.text-h1/h2`, `font-serif`(Cormorant), `.section-gap-md` 확인.

### 1.2 결론
기존 DB 이벤트 시스템과 분리된 **정적 페이지**가 적합하다(사용자 결정). 가격표는 자주 안 바뀌고 법적 정확성이 중요하므로 코드 SSOT가 안전하다. 기존 `PriceTable`은 정가→할인가를 지원하지 않으므로 **확장 또는 신규 컴포넌트**가 필요하다(상세 구조는 Design 단계 A/B/C 옵션으로 결정).

---

## 2. 확정 요구사항 (사용자 결정, 2026-05-25)

| 항목 | 결정 |
|------|------|
| **구현 형태** | **독립 정적 페이지** (`/events/first-visit`). DB/Supabase 스키마 변경 없음. 가격표는 코드 SSOT. |
| **다국어 범위** | **11개 로케일 전체 완역** (ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar). |
| **번역 작성 주체** | **Claude가 번역 작성** (의료 용어집 준수). 단, 병원 **최종 임상/카피 검수 권고**를 문서·코드 주석에 명시. |
| **가격 표시** | **정가 취소선 + 체험가 + 할인% 배지** (예: ~~150,000원~~ **80,000원** `-47%`). 할인 없는 제모는 **"체험가 5,000원"**만. |
| **브랜드 토큰** | **LIV 토큰 유지** (더스티 로즈, Pretendard/Cormorant). `design-taste-frontend` 규칙은 토큰 내에서 적용. |

### 2.1 결정에서 파생되는 필수 보완 (자동 포함)
- **진입점**: 원 요청이 "위(`/events`) 페이지에 만들어달라"이므로, 독립 페이지여도 **`/events`에서 진입할 링크/배너 1개**가 반드시 필요하다(없으면 도달 불가). 최소 침습으로 추가하며, 불필요 시 제거 가능하도록 격리.
- **법적 고지**: 소스 disclaimer("부기·멍·염증 등 부작용 가능, 의료진 상담 필요, 부가세 별도")는 **페이지 하단 고정 노출** 필수(의료광고 규정).
- **SEO/메타**: 기존 `events/[eventId]`처럼 로케일별 `generateMetadata`(title/OG/hreflang) 제공.

---

## 3. 스코프

### 3.1 In Scope
1. **신규 라우트** `src/app/[locale]/events/first-visit/page.tsx` (+ 필요 시 client 컴포넌트 분리)
2. **가격 데이터 SSOT** — 11개 시술의 `{id, originalPrice?, trialPrice, discountRate?, isTrialOnly}` 구조 (신규 `lib/firstVisitTrial.ts` 또는 `pricing.ts` 확장 — Design에서 확정)
3. **가격표 UI** — 정가 취소선 + 체험가 + 할인% 배지 (PriceTable 확장 vs 신규 컴포넌트 — Design에서 확정)
4. **i18n 키 추가** — `firstVisit.*`(제목/부제/시술명/설명/단위/고지/CTA)를 **11개 `messages/*.json`** 에 완역
5. **`/events` 진입 링크/배너** 1개
6. **메타데이터** — 로케일별 title/description/OG/hreflang
7. **반응형·접근성·LIV 브랜드 정합 + design-taste 구조/모션 규칙**

### 3.2 Out of Scope
- Supabase `events` 스키마/관리자 변경, DB 이벤트화
- `/events` 상태 필터 탭에 "체험가" 카테고리 통합
- 온라인 결제/예약 연동 (CTA는 기존 상담/전화로 연결)
- 기존 `PriceTable` 사용처(시술 상세 페이지) 동작 변경
- 프로모션 자동 종료(기간 만료) 로직 — 정적이므로 수동 관리

---

## 4. 소스 콘텐츠 (docx 파싱 결과 — 11개 항목)

| # | 시술 (ko) | 정가 | 체험가 | 할인 | 비고 |
|---|-----------|------|--------|------|------|
| 1 | 겨드랑이 제모 (1회만) | — | 5,000원 | 체험가 | originalPrice 없음 |
| 2 | 인중 제모 (1회만) | — | 5,000원 | 체험가 | originalPrice 없음 |
| 3 | 프리미엄 스킨케어 | 150,000 | 80,000 | -47% | 울블랑/물톡스/플라필 중 택1, 1인실 |
| 4 | 사각턱 보톡스 50U (국산) | 60,000 | 36,000 | -40% | |
| 5 | 사각턱 보톡스 50U (독일산) | 160,000 | 104,000 | -35% | |
| 6 | 사각턱 보톡스 50U (미국산) | 190,000 | 123,000 | -35% | |
| 7 | 리쥬란 힐러 2cc | 300,000 | 195,000 | -35% | |
| 8 | 리쥬란 힐러 2cc 3회 (12주 케어) | 920,000 | 560,000 | -39% | |
| 9 | 인모드 리프팅 (2가지 모드) | 250,000 | 149,000 | -40% | |
| 10 | 울쎄라피 프라임 300샷 | 1,470,000 | 990,000 | -33% | |
| 11 | 내맘대로 수액 | 50,000 | 29,000 | -42% | 맞춤 영양 수액 |

> 할인%는 소스 표기값을 **그대로 사용**(반올림 일치 확인 완료). 공통 고지: *"모든 시술은 개인에 따라 부기·멍·염증 등 부작용 가능, 의료진 상담 필요. (부가세 별도)"* · *"첫방문 1회만 적용"*.

각 시술 1줄 설명(소스 보유)도 i18n 키로 포함. 시술명 표기는 `i18n-glossary.md` 강제 적용(예: 보톡스→Botox/肉毒素/ボトックス…, 리쥬란→Rejuran/婴儿针…, 인모드→InMode 고정, 울쎄라→Ultherapy Prime/超声刀…).

---

## 5. i18n 전략

- **키 네임스페이스**: `firstVisit` (신규). 구조 예: `firstVisit.title`, `firstVisit.subtitle`, `firstVisit.items.{itemId}.name`, `.desc`, `firstVisit.priceNote`, `firstVisit.disclaimer`, `firstVisit.cta.*`, `firstVisit.unit.won` 등.
- **가격 숫자**: 데이터(SSOT)에 보관, **통화 단위 접미사만 i18n**(원/KRW/₩ 등 로케일별). 숫자 천단위 콤마는 코드 포맷.
- **번역 절차**: `docs/i18n-glossary.md` §10 프롬프트 템플릿 + 시술명/의학용어 테이블을 강제 적용. fr/mn/ar은 `i18n-treatments-fr-mn-ar.plan.md` 톤 준수.
- **검수 플래그**: 의료 문구·가격은 코드/문서에 `// 임상·카피 검수 필요(병원 확인)` 주석.
- **키 누락 가드**: ko 기준 키 셋을 11개 파일에 동일 적용(누락 0 검증).

---

## 6. 디자인 방향 (LIV 토큰 + design-taste 규칙)

- **토큰 우선**: 색상 `#b4988d`(primary)/`#6d4e42`(secondary)/`#f6f6f6`(bg), 폰트 Pretendard(본문)·Cormorant(`font-serif`, 영문 헤더). 스킬 기본값(Geist/Satoshi, emerald/electric-blue, `rounded-[2.5rem]`)은 **미적용**.
- **적용할 design-taste 규칙**: 비중심 히어로(좌정렬), 3-동일카드 지양(가격표/지그재그), `min-h` 안정, 카드 남용 대신 `divide-y`/border 그룹핑, 할인 배지 미세 모션(스프링, MOTION_INTENSITY 6), 이모지 금지·아이콘은 인라인 SVG/Phosphor, picsum 등 안정적 자산만.
- **할인 강조**: 체험가는 secondary/primary 강조, 정가는 `line-through text-mono-light`, 할인% 배지는 primary 배경. 절감액의 시각적 위계 확보.
- **기존 UI 재사용**: `AnimateOnScroll`, `Button`, `ScrollLink`, `container-custom`, `section-gap-md`.

---

## 7. Success Criteria (측정 가능)

| # | 기준 | 검증 방법 |
|---|------|-----------|
| SC-1 | 11개 시술 정가/체험가/할인%가 소스와 100% 일치 | docx 표 ↔ 렌더 대조 |
| SC-2 | 11개 로케일 전부 `firstVisit.*` 키 누락 0 | 키 셋 diff 스크립트 |
| SC-3 | 부작용·부가세·"첫방문 1회" 고지 모든 로케일 노출 | 페이지 하단 확인 |
| SC-4 | 언어 전환 시 시술명/설명/단위 현지화 정상 | 11개 로케일 수동 전환 |
| SC-5 | `/events`에서 본 페이지로 진입 가능 | 링크 클릭 |
| SC-6 | 모바일(<768px)/데스크톱 반응형 깨짐 0, 가로 스크롤 0 | 반응형 점검 |
| SC-7 | LIV 토큰 정합(색/폰트), 이모지 0 | 코드/시각 점검 |
| SC-8 | 로케일별 메타/hreflang 정상, `npm run build` 통과 | 빌드 + 메타 확인 |

---

## 8. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 가격 데이터 오타 | 높음(신뢰·법적) | SSOT 단일 출처 + docx 대조 표(§4)로 교차검증 |
| 11개 로케일 의료 번역 품질 | 중 | 용어집 강제 + 검수 플래그 주석 + 병원 최종 검수 권고 |
| 의료광고 고지 누락 | 높음(규정) | disclaimer를 데이터/레이아웃 필수 요소로 강제 |
| 프로모션 종료 시 유지보수 | 중 | 정적 한계 명시, SSOT 1곳만 수정하면 되도록 설계 |
| 독립 페이지 도달 불가 | 중 | `/events` 진입 링크 필수 포함(§2.1) |

---

## 9. 구현 작업 분해 (예상)

| 작업 | 파일(예상) | 유형 |
|------|-----------|------|
| 가격 SSOT | `src/lib/firstVisitTrial.ts` (또는 `pricing.ts` 확장) | 신규 |
| 페이지 라우트 | `src/app/[locale]/events/first-visit/page.tsx` (+client) | 신규 |
| 가격표 UI | `components/ui/` 신규 or `PriceTable` 확장 | 신규/수정 |
| i18n 키 × 11 | `src/messages/{11개}.json` | 수정 |
| `/events` 진입 링크 | `src/app/[locale]/events/page.tsx` | 수정(최소) |
| 메타데이터 | 라우트 내 `generateMetadata` | 신규 |

> 정확한 컴포넌트 구조(PriceTable 확장 vs 신규)와 데이터 위치는 **Design 단계에서 A/B/C 옵션**으로 확정.

---

## 10. 다음 단계
`/pdca design first-visit-trial-events` — 3가지 아키텍처 옵션(최소변경 / 클린 / 실용균형) 제시 후 선택 → 구현.
