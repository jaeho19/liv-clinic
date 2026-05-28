# 홈페이지 첫방문 1회 체험가 배너 노출

> **Feature**: `home-first-visit-banner`
> **Phase**: Plan
> **Created**: 2026-05-29
> **Owner**: 리브성형외과 웹
> **Source**: 사용자 요청 — "리브성형외과 첫 페이지에서 [첫방문 1회 체험가] 배너로 띄워서 같이 보여주면 좋겠어"
> **연관**: 기존 `first-visit-trial-events` 피처(`/events/first-visit` 정식 페이지·`FirstVisitTrialSection`·`lib/firstVisitTrial.ts` SSOT·`firstVisit.*` i18n 키), 홈 `app/[locale]/page.tsx`(Hero→Equipment→Signature→CoreValues→Doctor→MediaNews→Location), `PopupManager`(DB 팝업 시스템·본 피처와 별개)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem (문제)** | 첫방문 1회 체험가 페이지(`/events/first-visit`)는 정식 구현되어 있으나, 홈페이지 메인 진입 지점에서는 **노출 채널이 없다**. 현재 홈에서 첫방문 콘텐츠로 진입하려면 메인 메뉴 → events → 페이지 상단 배너의 3단계 클릭이 필요하다. 첫 화면(LCP 영역)에서 신규 고객의 진입 장벽을 가격 혜택으로 낮출 기회를 놓치고 있다. |
| **Solution (해결)** | 홈에 **2단 펀넬 배너**를 추가한다. (1) **Hero 상단 슬림 띠배너(SlimBanner)** — 헤더 바로 아래 가로 1줄로 "첫방문 1회 체험가 / 최대 47% 할인 → 보기" 즉시 인지 유도. (2) **Equipment 다음 인라인 프로모 섹션(HomePromo)** — 스크롤 중 자연스럽게 등장하는 카드 섹션, 인기 시술 4개 가격 미리보기 + "전체 가격 보기" CTA. 두 컴포넌트 모두 `/events/first-visit`로 연결하여 인지→전환의 단일 펀넬을 구성한다. 모든 텍스트는 **기존 `firstVisit.*` 키 재사용** + 신규 `slimBanner`·`homePromo` 서브키 11개 로케일 완역. |
| **Function·UX 효과** | 신규 고객이 홈 진입 첫 화면에서 "체험가 프로모션 존재" 사실을 0클릭에 인지(SlimBanner)하고, 스크롤 중 한 번 더 마주쳐(HomePromo) "어떤 시술이 얼마인지" 미리 확인 후 전체 페이지로 전환한다. 11개 로케일 글로벌 고객도 모국어로 동일한 메시지를 받는다. LCP·CLS 영향은 SlimBanner(텍스트만, 이미지/비디오 無) + HomePromo(below-fold, dynamic import)로 최소화한다. |
| **Core Value (핵심 가치)** | **"홈 진입 = 첫방문 혜택 발견"** — 신규 고객이 이미 만들어진 `/events/first-visit` 페이지로 가는 동선을 3클릭에서 0~1클릭으로 단축한다. 기존 데이터·페이지·번역 자산을 100% 재사용하므로 가격 정확성·법적 리스크 신규 발생 없음. |

---

## Context Anchor

| 키 | 값 |
|----|----|
| **WHY** | 첫방문 체험가 페이지가 이미 구축되어 있으나 홈에서 진입 동선이 없어 신규 고객 전환 기회를 놓치고 있다. 홈 진입 직후·스크롤 중 2회 노출로 인지·전환을 동시 달성한다. |
| **WHO** | 홈(`/[locale]`)에 처음 진입하는 모든 방문자(신규/재방문 무관, 사용자 결정으로 항상 노출). 11개 로케일(ko/en/ja/zh/zh-TW/vi/th/ru/fr/mn/ar) 전부 대상. 모바일 비중 높음. |
| **RISK** | ① Hero 위 SlimBanner가 **LCP 후보(Hero)에 시각적 영향** — 텍스트 1줄로 제한해 레이아웃 시프트 최소화 필요. ② 11개 로케일 신규 키 미번역 시 키 노출(빈 문자열) — 모든 로케일 완역 필수. ③ "항상 노출" 결정 → 재방문자가 동일 배너 반복 노출에 피로감을 느낄 수 있음(미래 옵션으로 dismissible 추가 여지 남김). ④ **HomePromo의 4개 시술 선정 기준이 가격 정책과 맞지 않으면** 홍보 효과 저하 — Design 단계에서 병원과 합의 필요. ⑤ Hero 슬라이드 텍스트와 시각적 충돌 가능성(다크 그라데이션 위 배너 가독성). |
| **SUCCESS** | (a) Hero 위 SlimBanner 1줄 노출·클릭 시 `/events/first-visit` 이동, (b) Equipment 다음 HomePromo 섹션 노출·인기 4개 시술 가격 미리보기 + 전체보기 CTA 동작, (c) 11개 로케일 신규 키 누락 0, (d) Lighthouse Mobile Performance/LCP/CLS 회귀 없음(±5% 이내), (e) 기존 홈 컴포넌트(Hero/Equipment/Signature 등) **구조·스타일 무수정**으로 통합. |
| **SCOPE** | 신규 컴포넌트 2개(`HomeFirstVisitSlimBanner`, `HomeFirstVisitPromo`) + 홈 `page.tsx` 1곳 수정 + i18n 신규 서브키(`firstVisit.slimBanner.*`, `firstVisit.homePromo.*`) 11개 파일 + `firstVisitTrial.ts`에 "홈 미리보기 인기 4선" 선정 유틸 추가. 신규 라우트 無·DB 변경 無·`PopupManager` 변경 無. |

---

## 1. 배경 & 문제 정의

### 1.1 현재 상태 (코드 근거)

- **첫방문 페이지 이미 존재**: `liv-clinic/src/app/[locale]/events/first-visit/page.tsx` + `components/sections/FirstVisitTrialSection.tsx` (카테고리별 가격표, divide-y 테이블, rose primary 토큰, Cormorant serif). i18n: `firstVisit.*` 키 11개 로케일 완역(`ko.json:5455` 외).
- **데이터 SSOT 존재**: `lib/firstVisitTrial.ts` — 11개 시술 `FIRST_VISIT_TRIALS` 배열, `originalPrice`/`trialPrice`/`discountRate` 정수 표기. `groupByCategory()` 유틸 제공.
- **events 페이지 진입 배너 이미 존재**: `app/[locale]/events/page.tsx:80-101` — rose 톤 카드형 Link, `firstVisit.eyebrow` / `firstVisit.banner.title` / `firstVisit.banner.subtitle` i18n 키 사용 중. **홈에서도 동일 키 재사용 가능**.
- **홈 구조**: `app/[locale]/page.tsx` — `Hero` 정적 import, 나머지(`Equipment`/`Signature`/`CoreValues`/`Doctor`/`MediaNewsSection`/`Location`) 모두 `dynamic(() => import(...), { ssr: true })`로 코드 스플리팅. `Hero`는 `100vh`/`100dvh`/`85vh`(sm+) 풀스크린.
- **팝업 시스템 존재(별개)**: `components/layout/PopupManager.tsx` — Supabase `popups` 테이블 + 어드민 팝업관리. **본 피처와 무관**(사용자가 "배너"로 결정).
- **헤더는 fixed**: 헤더가 페이지 상단에 고정되어 있으므로, SlimBanner를 "헤더 바로 아래"에 두면 fixed 헤더 위치 조정 또는 Hero 위 inline 배치 중 선택 필요(Design 단계 결정).

### 1.2 결론

**기존 자산을 최대한 재사용**하면 신규 라우트·데이터·번역 작업 없이 홈 진입 동선만 추가하면 된다. 컴포넌트 2개와 i18n 신규 서브키만 추가하고, 가격 데이터·시술 카피·법적 고지는 이미 검증된 `firstVisitTrial.ts` / `firstVisit.*` 키를 그대로 사용한다. 디자인은 `events/page.tsx`의 기존 진입 배너 패턴(rose tone, 우측 화살표, `bg-primary/5`)을 SlimBanner에 차용해 브랜드 일관성을 유지한다.

---

## 2. 확정 요구사항 (사용자 결정, 2026-05-29)

### 2.1 노출 방식 — **B + C 동시 적용**

| 항목 | 결정 |
|------|------|
| **B. Hero 상단 슬림 띠배너** | Hero 섹션 **위쪽**에 헤더 바로 아래 가로 1줄로 노출. 텍스트 + 우측 화살표. 전체 클릭 시 `/events/first-visit` 이동. |
| **C. Equipment 다음 인라인 프로모 섹션** | `<Hero/>` → `<Equipment/>` → **`<HomePromo/>`** → `<Signature/>` 위치. 인기 4개 시술 가격 미리보기 + "전체 가격 보기" CTA. |
| **연결 동선** | 두 컴포넌트 모두 같은 `/events/first-visit` 페이지로 이동(같은 탭). 중복 노출이 아닌 **"인지(B) → 전환(C)" 2단 펀넬**. |

### 2.2 노출 대상 — **모든 방문자에게 항상 노출**

- 신규/재방문 구분 없음.
- 닫기 X 버튼 **없음**(영구 노출).
- 향후 dismissible 옵션이 필요할 경우 SlimBanner에 sessionStorage 기반 X 버튼 추가 여지를 컴포넌트 props로 남겨둠(`dismissible?: boolean`, 기본값 `false`).

### 2.3 다국어 노출 범위 — **전체 11개 로케일 모두**

- `ko, en, ja, zh, zh-TW, vi, th, ru, fr, mn, ar` 전부.
- 기존 `firstVisit.eyebrow` / `firstVisit.title` / `firstVisit.banner.*` 재사용 가능.
- 신규 추가 키: `firstVisit.slimBanner.text` / `firstVisit.slimBanner.cta` / `firstVisit.homePromo.eyebrow` / `firstVisit.homePromo.title` / `firstVisit.homePromo.subtitle` / `firstVisit.homePromo.viewAll`.

---

## 3. 비요구사항 (Out of Scope)

- DB 팝업 시스템(`PopupManager`) 수정 — 별개 운영 도구로 그대로 유지.
- 첫방문 페이지(`/events/first-visit`) **자체** 수정 — 이미 정식 구현됨.
- 새로운 가격/시술/카테고리 추가 — `firstVisitTrial.ts` SSOT 변경 없음.
- 이벤트 목록 페이지(`/events`) 변경 — 기존 진입 배너 유지.
- A/B 테스트, 노출 빈도 제어, 클릭 분석 이벤트 — 향후 Phase로 분리.
- SlimBanner 닫기/숨김 기능 — props 인터페이스만 열어두고 기본 동작은 영구 노출.
- 첫 방문자만 노출하는 사용자 식별 로직 — 사용자가 "항상 노출" 결정.
- Hero 슬라이드 4번째 추가 — 옵션 D는 채택하지 않음(클릭 타이밍 짧음).

---

## 4. 사용자 시나리오

### 4.1 신규 한국어 방문자 (모바일)

1. `https://livps.co.kr/ko` 진입.
2. 헤더 바로 아래에 **rose 톤 슬림 띠** "✨ 첫방문 1회 체험가 · 최대 47% 할인 → 보기" 텍스트가 1줄로 보임.
3. (선택) 띠를 즉시 탭 → `/ko/events/first-visit` 이동.
4. 또는 띠 무시하고 스크롤 → Hero → Equipment 통과 후 **rose 톤 인라인 카드** 등장: "First Visit Only" eyebrow + "첫방문 1회 체험가" 제목 + 4개 시술 가격 미리보기(예: 사각턱 보톡스 50U(국산) ₩36,000 / 리쥬란 2cc ₩195,000 / 인모드 ₩149,000 / 울쎄라 300샷 ₩990,000) + "전체 가격 보기" 버튼.
5. CTA 탭 → `/ko/events/first-visit` 이동.

### 4.2 일본어 재방문자 (데스크톱)

1. `/ja` 진입. SlimBanner는 일본어로 "✨ 初回限定 1回体験価格 · 最大47%OFF → 見る".
2. 재방문이지만 동일하게 노출됨(사용자 결정).
3. HomePromo도 일본어로 자연스럽게 표시. 가격 단위는 `firstVisit.unit`("円")로 자동 변환.

### 4.3 아랍어 방문자 (RTL)

1. `/ar` 진입. SlimBanner의 화살표 방향과 텍스트 정렬이 RTL에 맞게 반전(기존 Hero·헤더와 동일하게 `dir="rtl"` 컨텍스트 상속).
2. HomePromo CTA 버튼도 RTL 정렬 유지.

---

## 5. 핵심 결정 (Decisions)

| # | 결정 | 사유 |
|---|------|------|
| D1 | **컴포넌트 2개 분리** (`HomeFirstVisitSlimBanner` + `HomeFirstVisitPromo`) | 단일 컴포넌트로 통합 시 책임 혼재. 각각 노출 위치·디자인·제어 시점이 다름. |
| D2 | **`firstVisit.*` 네임스페이스 재사용 + 서브키 확장** (`slimBanner`, `homePromo`) | 신규 네임스페이스 신설 시 번역 분산. 기존 카피·톤·용어 통일 자산을 그대로 활용. |
| D3 | **항상 노출, 닫기 버튼 없음** (사용자 결정) | 사용자 결정. 단 `dismissible?: boolean` props로 미래 확장 여지만 남김. |
| D4 | **HomePromo 인기 4선은 SSOT 유틸로 추출** (`getHomePromoPicks()`) | UI 컴포넌트가 `FIRST_VISIT_TRIALS` 배열 인덱스를 직접 참조하지 않도록 분리. 변경 시 한 곳만 수정. |
| D5 | **HomePromo는 `dynamic` import 유지** | 기존 홈 패턴(Equipment/Signature/...)과 동일. below-fold 코드 스플리팅. |
| D6 | **SlimBanner는 정적 import** | 헤더 바로 아래 즉시 노출 필요. Hero와 동일하게 FOLD 영역. 단 텍스트만이라 번들 영향 최소. |
| D7 | **HomePromo 위치 = Equipment 다음** | Hero 직후는 임팩트 충돌, Doctor·MediaNews 부근은 너무 늦음. Equipment(장비 신뢰) → 첫방문 혜택 흐름이 자연스러움. (Design 단계에서 A/B 옵션 재검토) |
| D8 | **SlimBanner 위치 = Hero 위 inline** | fixed 헤더 위에 더 fixed 요소 추가는 z-index/스크롤 충돌 위험. Hero 위 inline으로 일반 흐름에 포함. (Design 단계에서 fixed vs inline 옵션 재검토) |
| D9 | **데이터 미변경** | `firstVisitTrial.ts` 가격·할인율·시술명 무변경. 신규 유틸 함수만 추가. |
| D10 | **Hero 슬라이드 미수정** | 사용자가 옵션 D(Hero 슬라이드 추가)를 선택하지 않음. 기존 3장 슬라이드 유지. |

---

## 6. 작업 항목 (Tasks)

### 6.1 데이터 / 유틸 (Domain)

- [ ] **T1**. `lib/firstVisitTrial.ts`에 `getHomePromoPicks(): TrialItem[]` 추가
  - 홈 인라인 카드에 노출할 인기 시술 4선 반환.
  - 1차 가정(병원 검수 필요): `botoxKr`, `rejuran2cc`, `inmode`, `ulthera300` — 카테고리별 대표 1개씩(스킨케어 제외), 가격대 분포 다양화.
  - Design 단계에서 병원 합의 후 ID 목록 조정.
- [ ] **T2**. 가격 포맷 유틸은 `FirstVisitTrialSection`에 인라인된 `fmt` 패턴을 재사용 (별도 export 불필요, HomePromo 내부에서 동일 패턴 사용).

### 6.2 i18n (11개 로케일)

- [ ] **T3**. 11개 `messages/*.json` 모두에 `firstVisit.slimBanner` 신규 서브키 추가
  - `firstVisit.slimBanner.text`: "첫방문 1회 체험가 · 최대 47% 할인" (ko 예시)
  - `firstVisit.slimBanner.cta`: "보기" / "View" / "見る" / "查看" 등
- [ ] **T4**. 11개 `messages/*.json` 모두에 `firstVisit.homePromo` 신규 서브키 추가
  - `firstVisit.homePromo.eyebrow`: "First Visit Only" (전 로케일 공통 영문 유지, 또는 i18n 분리는 Design 단계 결정)
  - `firstVisit.homePromo.title`: 기존 `firstVisit.title` 재사용 가능 — 신규 키 추가 여부는 Design 단계 결정
  - `firstVisit.homePromo.subtitle`: 홈용 짧은 카피 (3~4줄)
  - `firstVisit.homePromo.viewAll`: "전체 가격 보기" / "View All Prices" / "全価格を見る" 등
- [ ] **T5**. 11개 로케일 키 누락 검증 (lint 또는 수동 grep)

### 6.3 컴포넌트 (UI)

- [ ] **T6**. `components/sections/HomeFirstVisitSlimBanner.tsx` 신규
  - 클라이언트 컴포넌트(`'use client'` — Link 인터랙션 + 다이내믹 텍스트).
  - 헤더 바로 아래·Hero 위 inline 띠. `bg-primary/10` 또는 `bg-gradient-to-r from-primary/15 to-primary/5` 톤.
  - 텍스트 1줄 + 우측 화살표 SVG. 전체 클릭(Link)으로 `/events/first-visit` 이동.
  - i18n: `firstVisit.slimBanner.text` + `firstVisit.slimBanner.cta`.
  - `dismissible?: boolean` props 인터페이스만 정의(기본 `false`, 내부 동작 미구현).
  - 모바일에서 텍스트 잘림 방지(`truncate` 또는 2단 분리).
- [ ] **T7**. `components/sections/HomeFirstVisitPromo.tsx` 신규
  - 클라이언트 컴포넌트(`AnimateOnScroll` 사용).
  - 큰 카드 형태(`rounded-2xl` `bg-white` `shadow-sm` `border border-primary/20`).
  - 좌: eyebrow + title + subtitle. 우(또는 하): 4개 시술 미니 카드 그리드(시술명 + 정가 취소선 + 체험가 + 할인 배지).
  - 하단 CTA 버튼 "전체 가격 보기 →" Link → `/events/first-visit`.
  - i18n: `firstVisit.homePromo.*` + 기존 `firstVisit.items.*`, `firstVisit.unit`, `firstVisit.originalLabel` 재사용.
  - 반응형: 모바일 1열, 태블릿 2열, 데스크톱 4열.
- [ ] **T8**. `components/sections/index.ts`에 두 신규 컴포넌트 export 추가.

### 6.4 페이지 통합

- [ ] **T9**. `app/[locale]/page.tsx` 수정
  - `import HomeFirstVisitSlimBanner from '@/components/sections/HomeFirstVisitSlimBanner'` (정적 import)
  - `const HomeFirstVisitPromo = dynamic(() => import('@/components/sections/HomeFirstVisitPromo'), { ssr: true })`
  - JSX: `<HomeFirstVisitSlimBanner />` → `<Hero />` → `<Equipment />` → `<HomeFirstVisitPromo />` → 기존 흐름
- [ ] **T10**. 헤더 컴포넌트와 SlimBanner 간 시각적 정합 확인(상단 여백·z-index·sticky 동작).

### 6.5 검증 / QA

- [ ] **T11**. Lighthouse Mobile 회귀 측정: LCP·CLS·Performance Score 기존 대비 ±5% 이내.
- [ ] **T12**. 11개 로케일 홈에서 SlimBanner·HomePromo 모두 표시되고 키 누락 없는지 확인(Playwright 또는 수동).
- [ ] **T13**. SlimBanner·HomePromo 클릭 시 정확히 `/{locale}/events/first-visit`로 이동.
- [ ] **T14**. 모바일 뷰포트(360px)에서 SlimBanner 텍스트 잘림·줄바꿈 검증.
- [ ] **T15**. RTL(ar) 로케일에서 화살표·정렬 검증.
- [ ] **T16**. 다크 그라데이션 Hero와 SlimBanner 색상 대비(WCAG AA) 확인.

---

## 7. Success Criteria (정량/정성 기준)

| SC | 검증 방법 | 통과 기준 |
|----|-----------|-----------|
| **SC-1** SlimBanner 노출 | 11개 로케일 홈 진입 시 헤더 직하 1줄 띠 렌더링 | 11/11 로케일 노출 + 키 누락 0 |
| **SC-2** HomePromo 노출 | Hero·Equipment 스크롤 후 인라인 카드 등장 | 인기 4개 시술 가격 정확 + CTA 동작 |
| **SC-3** 진입 동선 | SlimBanner / HomePromo / CTA 클릭 → `/events/first-visit` | 3개 진입 경로 모두 `/{locale}/events/first-visit` 이동 |
| **SC-4** i18n 완성도 | `messages/*.json` `firstVisit.slimBanner.*` + `firstVisit.homePromo.*` 키 존재 | 11/11 파일 + 빈 문자열 0 |
| **SC-5** 성능 회귀 없음 | Lighthouse Mobile 비교(전/후) | LCP/CLS/Performance 모두 ±5% 이내 |
| **SC-6** 모바일 가독성 | 360px / 768px / 1280px / 1920px 4단 뷰포트 캡처 | 잘림·줄겹침·오버플로우 0 |
| **SC-7** RTL 정합 | `/ar` 홈 캡처 | 화살표·정렬 RTL 반전 정상 |
| **SC-8** 브랜드 일관성 | rose primary 토큰·Pretendard·Cormorant 사용 | events/first-visit 페이지와 동일 톤 |
| **SC-9** 가격 정확성 | HomePromo 미리보기 4개 시술 가격 = `FIRST_VISIT_TRIALS` SSOT 값 | 100% 일치 (SSOT 직접 참조) |
| **SC-10** 기존 컴포넌트 무수정 | git diff 확인 | `Hero.tsx` / `Equipment.tsx` / `Signature.tsx` 등 무변경 |

---

## 8. 가정 사항 (Assumptions)

- **A1** SlimBanner 위치는 "Hero 위 inline"이 기본값. fixed 헤더와의 충돌은 Design 단계에서 재검토(헤더가 Hero를 덮는지/아닌지 확인 필요).
- **A2** HomePromo의 인기 4선은 1차 가정(`botoxKr` / `rejuran2cc` / `inmode` / `ulthera300`)으로 진행. 병원 마케팅 의도와 다르면 Design 단계에서 ID 조정.
- **A3** "First Visit Only" eyebrow는 영문 그대로 전 로케일 유지(브랜드 톤). 로케일별 분리가 필요하면 Design 단계에서 키 분리.
- **A4** SlimBanner 카피는 한국어 기준 "첫방문 1회 체험가 · 최대 47% 할인" 한 줄. 로케일별 길이 차이로 모바일 잘림 시 i18n 키에 짧은 버전 별도 제공.
- **A5** 다국어 번역은 기존 `firstVisit.*` 톤·용어를 따른다(`i18n-glossary.md` 준수). 신규 카피는 의료 광고 가이드라인을 위배하지 않도록 절대적 표현("최고", "유일") 회피.
- **A6** 부가세 별도·부작용 고지는 `/events/first-visit` 페이지 본문에 이미 있다는 전제. 홈 배너에는 단순 마케팅 메시지만 노출(필요 시 Design 단계에서 작은 면책 1줄 추가 결정).
- **A7** HomePromo의 시각 디자인은 events 페이지의 진입 배너 패턴(rose `bg-primary/5`, border `border-primary/30`)을 기반으로 확장. 정확한 그리드·간격·애니메이션은 Design 단계 A/B/C 옵션으로 제시.

---

## 9. 위험 & 완화 (Risks & Mitigations)

| 위험 | 영향 | 완화 |
|------|------|------|
| **R1** Hero 위 SlimBanner가 LCP 영역 변경 → Performance Score 회귀 | M | 텍스트 1줄만 / 이미지·비디오·애니메이션 無 / Hero 위 inline(레이아웃 시프트 없음) / Lighthouse 전후 측정 |
| **R2** 11개 로케일 신규 키 미번역 | H (운영 신뢰) | T15에서 자동 grep `"slimBanner": {}` / `"homePromo": {}` 검증. 빈 문자열·`undefined` 0 확인 |
| **R3** 재방문자 노출 피로 → 클릭률 저하 | L | 사용자 결정으로 항상 노출 채택. `dismissible` props 인터페이스만 열어두어 향후 옵션화 가능 |
| **R4** HomePromo 4선이 병원 정책과 불일치 | M | T1에서 1차 가정만 제시. Design 단계에서 병원 합의 후 확정. SSOT 유틸 분리로 변경 비용 최소 |
| **R5** SlimBanner 텍스트가 모바일 360px에서 잘림 | M | Design 단계에서 짧은 버전 카피 분리 검토(`firstVisit.slimBanner.textShort`) |
| **R6** Hero 다크 그라데이션 위 SlimBanner 색상 대비 부족 | M | rose 강조 + white 텍스트 또는 light bg + secondary 텍스트 조합 비교 검증 |
| **R7** 헤더 fixed + SlimBanner inline 사이 스크롤 동작 차이 | M | Design 단계에서 헤더 동작(scroll up hide / sticky)과 정합 결정 |
| **R8** "최대 47% 할인" 카피가 향후 가격 변경 시 무효화 | L | i18n 키로 분리해 변경 시 한 곳만 수정 가능. 가격 변경 운영 절차 문서화는 별도 |

---

## 10. 마일스톤 & 다음 단계

| 단계 | 산출물 | 다음 명령 |
|------|--------|-----------|
| **Plan (현재)** | 본 문서 | `/pdca design home-first-visit-banner` |
| Design | 3가지 아키텍처 옵션(레이아웃·위치·dismissible 정책) 비교 + 선택 | `/pdca do home-first-visit-banner` |
| Do | 컴포넌트 2개 + i18n 11개 로케일 + 페이지 통합 구현 | `/pdca analyze home-first-visit-banner` |
| Check | gap-detector로 Design ↔ 구현 비교 + Lighthouse 회귀 | `/pdca iterate` 또는 `/pdca qa` |
| QA | L1-L3 테스트(라우팅·노출·다국어 키) | `/pdca report home-first-visit-banner` |
| Report | 완료 보고서 + 인기 4선 운영 가이드 | `/pdca archive home-first-visit-banner` |

---

## 11. 참고 자료

- **기존 피처 문서**: `docs/01-plan/features/first-visit-trial-events.plan.md`
- **데이터 SSOT**: `liv-clinic/src/lib/firstVisitTrial.ts`
- **기존 컴포넌트**: `liv-clinic/src/components/sections/FirstVisitTrialSection.tsx`
- **events 페이지 진입 배너 패턴**: `liv-clinic/src/app/[locale]/events/page.tsx:80-101`
- **i18n 용어 사전**: `docs/i18n-glossary.md`
- **i18n 키 베이스**: `liv-clinic/src/messages/ko.json:5455` (`firstVisit` 네임스페이스)
- **홈 페이지**: `liv-clinic/src/app/[locale]/page.tsx`
- **CLAUDE.md**: 프로젝트 폴더 구조·디자인 시스템·SEO 가이드
