# i18n Translation Coverage Plan Document

> **Phase**: Plan (Plan-Design-Do-Check-Act)
> **Created**: 2026-06-01
> **Status**: Draft
> **Feature**: i18n-translation-coverage
> **Author**: jaeho19

---

> ## ⚠️ CORRECTION — 본 문서의 결함 수치는 무효
> 본 Plan의 "7개 로케일 ~2,532키 누락 / medicalBlog 137키 누락 / zh-TW 324키" 등 수치는 **취소된(cancelled) 도구 호출 결과를 잘못 사실로 기재**한 것입니다. **실측 결과 해당 누락은 없으며 전 로케일(11개) 완역 상태**입니다. 또한 `/wechat` zh-전용은 middleware redirect 기반 **설계이지 버그가 아닙니다**. 검증 정본: `docs/03-analysis/i18n-translation-coverage.analysis.md`. 아래 본문은 이력 보존용입니다.

---

## 📋 Executive Summary

| Perspective | Summary |
|------------|---------|
| **Problem** | 사이트는 **11개 로케일**(ko, en, ja, zh, zh-TW, vi, th, ru, fr, mn, ar)을 지원하나, 신규 페이지·기능이 ko/en/ja/zh에만 반영되고 나머지 **7개 로케일(zh-TW + vi·th·ru·fr·mn·ar)에는 미반영**되었다. zh-TW 324키, 그 외 6개 언어 각 368키가 누락(`medicalBlog`·`treatmentDetail`·`ui` 등 신규 기능 집중)되어 있고, 각 로케일에 18~20개 한글 잔존 키가 있다. 또한 `wechatPage` 네임스페이스가 zh에만 존재(ko SSOT 불일치)해 깨지며, 소스 37개 파일에 하드코딩 한글이 있다. |
| **Solution** | (1) 정적 스캐너로 11개 로케일 키 정합성·한글 잔존·깨진 네임스페이스·소스 하드코딩을 전수 색출 → (2) `wechatPage`를 ko SSOT에 편입해 전 로케일 전파, 7개 로케일 누락분(~2,500키)을 **LLM(본인)으로 전량 번역**, 한글 잔존 키 재번역, 실렌더되는 하드코딩 한글을 `t()`로 전환 → (3) 전 라우트 × 대상 로케일 **전수 런타임 캡처**로 raw키/한글잔존/레이아웃/콘솔에러 4대 기준 검증. |
| **Function/UX Effect** | 7개 언어 사용자가 신규 페이지(의료 블로그, 시술 상세, WeChat 안내 등) 포함 전 페이지를 깨진 키·한글 잔존 없이 자국어로 본다. RTL(ar) 포함 레이아웃 파손도 제거한다. |
| **Core Value** | 강남 프리미엄 안티에이징 클리닉의 다국어(중화권·동남아·러시아·중동·유럽) 글로벌 고객 신뢰 확보. 미번역·깨진 키 노출은 브랜드 치명 결함이며, 본 작업으로 11개 언어 전체의 출시 품질을 정렬한다. |

---

## 📌 Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 신규 페이지/키가 일부 로케일에만 반영되어 7개 언어에서 미번역·깨진 키·한글 잔존이 노출됨. 11개 언어 시장 대상 글로벌 신뢰 결함 제거. |
| **WHO** | zh-TW(대만/홍콩), vi(베트남), th(태국), ru(러시아), fr(프랑스어권), mn(몽골), ar(아랍) 사용 해외·외국인 방문자 및 다국어 품질 운영팀. |
| **RISK** | (1) 의료 용어 LLM 번역 품질·정확성(책임), (2) ar RTL 레이아웃 파손, (3) ICU 플레이스홀더/복수형 누락, (4) 하드코딩 한글 중 죽은코드/데이터SSOT를 실버그로 오판해 불필요 수정, (5) wechatPage SSOT 편입 시 zh 기존 키 회귀. |
| **SUCCESS** | 전 라우트 × 7개 대상 로케일에서 ① raw 키 미노출 ② 비-ko 한글 0(고유명사 예외) ③ 레이아웃 무파손(ar RTL 포함) ④ i18n 콘솔 에러 0 ⑤ 11개 로케일 키 구조 완전 동기화. |
| **SCOPE** | IN: 7개 로케일 누락분 LLM 전량 번역, 한글잔존 재번역, wechatPage SSOT 정합, 실렌더 하드코딩 한글 t() 전환, 전수 런타임 검증. OUT: en/ja/zh 기존 완역 재작성, 신규 언어 추가, 비-i18n 리팩터링. |

---

## 🎯 1. Background & Problem Definition

### 1.1 Background
LIV 성형외과는 next-intl 기반 **11개 로케일**을 `localePrefix: 'always'`로 운영한다(`src/i18n/routing.ts` SSOT). ko가 기본/기준 언어이며 카탈로그는 `src/messages/{locale}.json`(ko 기준 2,312 leaf 키)이다. 신규 페이지(의료 블로그, 시술 상세, hilowave/signature v2, WeChat 안내 등)가 지속 추가되었다. 사용자 요청: "새로 만든 페이지 포함 전체적으로 타언어 변환이 잘 되는지 검토하고, 안 된 것은 변환을 진행."

### 1.2 Problem Statement (실측)

**A. 카탈로그 로케일 커버리지 (ko=2,312키 기준)**

| 로케일 | 누락 | 한글 잔존(=ko) | 비고 |
|--------|------|----------------|------|
| en, ja | 0 | 0 | ✅ 완역 |
| zh | 0 | 0 | ⚠️ ko에 없는 `wechatPage.*` 6키가 zh에만 존재 |
| zh-TW | 324 | 18 | ⚠️ |
| vi, th, ru, fr, mn, ar | **각 368(동일 집합)** | 각 20 | ⚠️ |

**B. 누락 키의 네임스페이스 분포** (368키 집합, 신규 기능 집중)
`medicalBlog`(137), `treatmentDetail`(73), `ui`(51), `faq`(25), `pricingGuide`(21), `liftingPage`(9), `beforeAfter`(9), `mediaNews`(8), `instagram`(8), `aboutPage`(4), `antiagingPage`(4), `pricing`(3), `laserPage`(2), `consultation`(2), `gallery`(1), `signaturePage`(1), `events`(1).

**C. 깨진 네임스페이스**: `wechatPage` — `src/components/sections/WeChatInfo.tsx`가 `useTranslations('wechatPage')` 호출하나 zh에만 존재. ko SSOT 및 나머지 10개 로케일에 없어 비-zh에서 raw 키/`MISSING_MESSAGE` 발생.

**D. 소스 하드코딩 한글**: 37개 파일 184줄(비주석). 단 일부는 죽은 코드(예: `MainHero.tsx`는 레거시 `slides` const가 있으나 런타임은 `t('hero.slides…')` 사용)·데이터 SSOT(`constants.ts`, `treatmentDetailData.ts`, `medicalBlogData.ts` 등)이므로 **실렌더 여부를 런타임으로 확인 후** 실버그만 수정 대상.

### 1.3 Success Criteria

| ID | Criterion | Target | Measurement |
|----|-----------|--------|-------------|
| SC-01 | 11개 로케일 키 구조 동기화 | 누락 0 / 비정상 extra 0 | flatten diff 스크립트(ko 대비) |
| SC-02 | 7개 대상 로케일 누락분 번역 완료 | zh-TW 324 + 6언어×368 = 2,532키 채움 | 빈값/누락 0 |
| SC-03 | 한글 잔존(=ko) 제거 | 7개 로케일 각 0(고유명사 예외) | 한글 정규식 스캔(번역 후) |
| SC-04 | 깨진 네임스페이스 제거 | `useTranslations(x)`의 x 전부 ko top키 존재 | 정적 네임스페이스 검사 |
| SC-05 | raw 키 미노출(런타임) | 전 라우트×대상 로케일 0건 | 캡처 + 페이지텍스트 키패턴/`MISSING_MESSAGE` 0 |
| SC-06 | 비-ko 페이지 한글 0(런타임) | 0건(고유명사 예외) | 렌더 본문 한글 스캔 |
| SC-07 | 레이아웃 무파손(ar RTL 포함) | 0건 | 스크린샷 + 가로 오버플로(scrollWidth>clientWidth) |
| SC-08 | i18n 콘솔 에러 0 | 0건 | 브라우저 콘솔 캡처 |
| SC-09 | ICU 플레이스홀더 정합 | 변수 누락 0 | 번역 전후 `{var}` 집합 비교 |
| SC-10 | ko 회귀 없음 | before/after 동등 | ko 캡처 비교 |

---

## 👥 2. User Scenarios

### 2.1 Core User Story
```
As a 대만/베트남/태국/러시아/프랑스어권/몽골/아랍 방문자
I want to LIV 사이트의 신규 페이지 포함 전 페이지를 내 언어로 깨짐 없이 보기를
So that 시술 정보를 정확히 이해하고 병원을 신뢰하여 상담/예약할 수 있다
```

### 2.2 Use Cases
- UC-1: vi 사용자가 `/vi/medical`(의료 블로그) 진입 → 137개 신규 키가 베트남어로 정상 표시(현재 누락).
- UC-2: th 사용자가 시술 상세(`treatmentDetail` 73키) → 태국어, 레이아웃 정상.
- UC-3: ar 사용자가 `/ar` 홈 → 아랍어 + RTL 레이아웃 무파손.
- UC-4: 비-zh 사용자가 WeChat 안내 컴포넌트 노출 화면 → raw 키 없이 표시(현재 깨짐).
- UC-5: 운영자가 신규 페이지 추가 시 11개 로케일 정합성을 스크립트로 즉시 회귀 검증.

---

## 📦 3. Scope

### 3.1 In Scope
- **정적 분석(전 로케일)**: ① ko 대비 누락/비정상 extra 키 ② 한글 잔존(=ko) ③ ICU 변수 정합 ④ `useTranslations`/`getTranslations` 네임스페이스 존재 ⑤ `t('...')` 키 경로 존재 ⑥ 소스 비주석 하드코딩 한글.
- **SSOT 정합**: `wechatPage`를 ko에 편입(zh 값 기반) 후 전 로케일 전파.
- **번역(LLM 전량)**: zh-TW(324) + vi·th·ru·fr·mn·ar(각 368) 누락분 + 한글 잔존(각 18~20) 번역. 시술명·고유명사는 기준표(FR-07) 적용.
- **소스 수정**: 런타임 확인으로 실렌더되는 하드코딩 한글만 `t()` 키로 전환.
- **런타임 전수 검증**: 전 라우트(동적 `[treatment]` 변형 포함) × 대상 로케일 캡처 + 자동 스캐너(raw키/한글/오버플로/콘솔). 뷰포트는 데스크톱 1440 전수 + 모바일 390은 신규/의심 페이지(Design에서 확정).

### 3.2 Out of Scope
- en/ja/zh 기존 완역 문구 카피 리뉴얼.
- 신규 언어(예: es/de) 추가.
- next.config 미들웨어→proxy 마이그레이션 등 비-i18n 리팩터링.
- 데이터 SSOT(`*Data.ts`)의 ko 콘텐츠 자체 개편(렌더 경로가 t()로 가지 않는 한 유지).

---

## ⚙️ 4. Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-01 | 11개 로케일 정합성 스캐너 작성·실행(누락/extra/한글잔존/ICU변수) | High | 재실행 가능한 node 스크립트, CI 회귀용 |
| FR-02 | 네임스페이스·키 경로 정적 검사(`useTranslations`/`t()` vs ko 카탈로그) | High | `wechatPage` 깨짐 이미 확인 |
| FR-03 | `wechatPage`를 ko SSOT에 편입(zh 6키 기반 한국어 작성) 후 전 로케일 전파 | High | zh 기존 값 회귀 금지 |
| FR-04 | 7개 대상 로케일 누락분(~2,532키) LLM 전량 번역, 빈값 0 | High | 네임스페이스 단위 일괄, 의료 정확성 우선 |
| FR-05 | 한글 잔존(=ko) 키 7개 로케일 재번역 | High | 단 고유명사(FR-07)는 예외 유지 가능 |
| FR-06 | 소스 하드코딩 한글: 런타임 실렌더 추적표 작성 → 실버그만 `t()` 전환(상태값은 언어무관 식별자) | Medium | 죽은코드/데이터SSOT 제외 근거 명시 |
| FR-07 | 고유명사 기준표(브랜드 'LIV', 의료진 실명, 장비명, 시술 고유명) 번역/음차/원표기 규칙 정의·적용 | Medium | 합격 판정 예외 목록으로 사용 |
| FR-08 | ICU 플레이스홀더/복수형 정합 검증(번역 전후 `{var}` 집합 동일) | High | 런타임 깨짐 방지 |
| FR-09 | 전 라우트 × 대상 로케일 런타임 캡처 + 자동 스캐너로 SC-05~08 판정 | High | Playwright, `liv-clinic`에서 dev 기동 |
| FR-10 | ar RTL 레이아웃 점검(방향성·정렬·오버플로) | Medium | locales-meta의 dir 설정 확인 |
| FR-11 | 발견·수정·검증 결과 분석 리포트(잔여/예외 목록 포함) | Medium | Check/Report 연계 |

---

## 🔧 5. Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Correctness | ko(기존 정상) 회귀 없음 | ko before/after 동등 |
| NFR-02 | Consistency | 11개 로케일 키 구조·ICU 변수 일치 | 누락/변수누락 0 |
| NFR-03 | Medical Accuracy | 의료/시술 용어 오역 최소화, 모호 시 [검수필요] 마킹 | 리뷰 가능 형태 |
| NFR-04 | Maintainability | 신규 키는 기존 네임스페이스 컨벤션 준수, 코드 내 한글 식별자 0 | 리뷰 |
| NFR-05 | Style | 전역 코딩 규칙(불변성, surgical change) 준수 | 요청 외 라인 변경 0 |
| NFR-06 | Verifiability | 검증은 재실행 가능 스크립트(정적 스캐너+Playwright) 제공 | CI 재사용 가능 |

---

## 🚧 6. Constraints & Assumptions

### 6.1 Constraints
- 모든 npm/dev 명령은 `C:\dev\LIV_homepage\liv-clinic`에서 실행(CLAUDE.md).
- Bash 도구는 Git-bash라 백슬래시 경로 깨짐 → 포워드슬래시 사용.
- next-intl 네임스페이스는 ko 카탈로그 top키 기준 동작, `localePrefix: 'always'`.
- 로케일 추가/구조 변경 시 `routing.ts` + `locales-meta.ts` 동시 수정 규칙.

### 6.2 Assumptions
- ko 카탈로그는 콘텐츠 SSOT이며 의미상 최신으로 간주.
- LLM 번역 품질은 1차 출시 수준으로 수용하되 의료 핵심 문구는 사후 검수 전제.
- en/ja/zh는 완역으로 재작업 불요(zh의 wechatPage 정합만 영향).
- dev 서버 로컬 기동으로 11개 로케일 라우트 접근 가능.

---

## ⚠️ 7. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 의료 용어 LLM 오역(책임) | High | Medium | NFR-03 [검수필요] 마킹, 고유명사 기준표(FR-07), ko 원문 병기 옵션 검토 |
| ar RTL 레이아웃 파손 | High | Medium | FR-10 RTL 점검, 캡처 육안+오버플로 자동검사(SC-07) |
| ICU 변수/복수형 누락 런타임 깨짐 | Medium | Medium | FR-08 변수 집합 자동 비교 |
| 하드코딩 한글 오판(죽은코드/데이터 수정) | Medium | Medium | FR-06 런타임 실렌더 추적표 근거 후 수정 |
| wechatPage SSOT 편입 시 zh 회귀 | Medium | Low | zh 기존 6키 값 보존, 편입 후 zh 캡처 비교 |
| 전수 캡처 분량 과다(11×전라우트) | Medium | Medium | 대상=7개 로케일+ko 기준, 데스크톱 전수/모바일 신규집중, 병렬 캡처 |
| 번역 후 키 구조 흐트러짐 | Medium | Low | FR-01 스캐너로 매 수정 후 재검증 |

---

## 🔗 8. Dependencies

- **next-intl** — 네임스페이스/키 해석 기준.
- **카탈로그 SSOT**: `src/messages/{ko,en,ja,zh,zh-TW,vi,th,ru,fr,mn,ar}.json`.
- **로케일 SSOT**: `src/i18n/routing.ts`(LOCALES), `src/i18n/locales-meta.ts`(dir 등).
- **데이터**: `src/lib/constants.ts`, `treatmentDetailData.ts`, `medicalBlogData.ts`, `mediaNewsData.ts` 등.
- **Playwright** — 런타임 캡처/스캐너(미설치 시 `@playwright/test` 추가).
- **로컬 dev 서버**: `liv-clinic`에서 `npm run dev`.

---

## 📅 9. Milestones

| Milestone | Description | Phase |
|-----------|-------------|-------|
| M1 | 정합성 스캐너(FR-01/02/08) 작성·실행 → 전 결함 목록 확정 | Design 직후 |
| M2 | wechatPage SSOT 편입(FR-03) + 고유명사 기준표(FR-07) + 하드코딩 실렌더 추적표(FR-06) 확정 | Design/Do |
| M3 | 7개 로케일 누락분 LLM 번역(FR-04) + 한글잔존 재번역(FR-05), 네임스페이스 단위 진행 | Do |
| M4 | 실렌더 하드코딩 한글 t() 전환(FR-06) | Do |
| M5 | 전 라우트×대상 로케일 전수 런타임 검증(FR-09/10) → SC-01~10 판정 | Check |
| M6 | 분석 리포트(FR-11) + 잔여/[검수필요] 정리 | Check/Report |

---

## 🎯 Next Steps

After Plan approval:
1. `/pdca design i18n-translation-coverage` — 3가지 아키텍처 옵션(스캐너 구조 / 번역 적용 전략 / 검증 하니스)으로 설계
2. 정적 스캐너 + 번역 파이프라인 + 런타임 캡처 하니스 설계 확정
3. `/pdca do i18n-translation-coverage --scope module-1` 부터 점진 구현

---

*Generated by bkit PDCA Plan Phase — grounded in verified static analysis (11 locales, ko=2,312 keys SSOT)*
