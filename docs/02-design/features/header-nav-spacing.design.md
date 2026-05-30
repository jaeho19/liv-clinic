# Design: 상단 헤더 네비게이션 간격 개선 (header-nav-spacing)

> **Feature**: header-nav-spacing
> **작성일**: 2026-05-30
> **Phase**: Design
> **선택 아키텍처**: **Option A — 최소 변경 (Tailwind 클래스 직접 수정)**
> **대상 파일**: `liv-clinic/src/components/layout/Header.tsx` (주), `liv-clinic/src/components/layout/LanguageSwitcher.tsx` (조건부)

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 좁은 메뉴 간격이 프리미엄 브랜드 인상을 해친다. 여유 간격으로 고급스러움 강화. |
| **WHO** | PC 우선 방문자, 디자인 톤 유지 운영자. |
| **RISK** | 데스크톱 nav 9개 → 1024~1280px overflow 위험. `container-custom`은 `overflow-x: clip`이라 넘치면 잘림. `ja/fr/mn/ru` compact-nav 미변경. |
| **SUCCESS** | `/ko` PC 메뉴 분리, 로고↔소개·이벤트↔상담 여백, 태블릿/모바일 무손상, build 0 error. |
| **SCOPE** | nav gap·로고/우측 margin·우측 gap만 `xl:`/`2xl:` 한정 수정. 높이·폰트·색상·버튼 디자인 변경 금지. |

## 1. 개요

Plan 확정 방향대로 헤더 간격을 `xl`(1280px)+ 위주로 중간 강도 확대한다. 모든 변경은 Tailwind 반응형 프리픽스(`xl:`/`2xl:`)로 한정해 `lg`(1024~1280px) 좁은 데스크톱의 가로 합을 현행과 동일하게 유지하고, 9개 메뉴 overflow를 방지한다.

## 2. 선택 아키텍처 근거 (Option A)

- 일회성 surgical 간격 조정 → 새 추상화(CSS 변수/헬퍼) 불필요.
- Header에 이미 `gap-N xl:gap-N 2xl:gap-N` 반응형 패턴이 정착 → 동일 패턴 확장이 가장 일관적.
- 회귀 위험 최소 (DOM 구조·이벤트·색상 클래스 불변).

## 3. 상세 변경 명세

> 모든 값은 Do 단계에서 다중 폭 스크린샷으로 실측 후 ±2px 미세조정 가능.

### 3.1 데스크톱 nav 컨테이너 — `Header.tsx` L200~206

| 상태 | Before | After | 변화 |
|------|--------|-------|------|
| 상단(미스크롤) | `gap-5 xl:gap-6 2xl:gap-8` | `gap-5 xl:gap-7 2xl:gap-9` | xl 24→28, 2xl 32→36 |
| 스크롤 | `gap-4 xl:gap-5 2xl:gap-6` | `gap-4 xl:gap-6 2xl:gap-7` | xl 20→24, 2xl 24→28 |
| 로고 분리 여백 | (없음) | nav className에 `xl:ms-4 2xl:ms-8` 추가 | 로고↔'리브 소개' 분리 (FR-2) |

- `lg`(1024~1280px) base인 `gap-5`/`gap-4`, `ms-0`은 **불변** → overflow 영향 0.
- `ms-`(margin-inline-start)는 RTL(아랍어 등) 안전. 단, compact-nav locale은 nav가 `hidden`이라 영향 없음.

### 3.2 우측 영역 컨테이너 — `Header.tsx` L272

| Before | After | 변화 |
|--------|-------|------|
| `gap-2 md:gap-3 xl:gap-4` | `gap-2 md:gap-3 xl:gap-5` | xl 16→20 (상담↔관리자↔언어 분리, FR-4) |

### 3.3 상담예약 버튼 — `Header.tsx` L274~283

| Before | After | 변화 |
|--------|-------|------|
| `hidden md:inline-block whitespace-nowrap btn-primary ...` | `... + xl:ms-2 2xl:ms-3` | nav↔상담버튼 분리 (FR-3, '이벤트'↔'상담예약') |

- 버튼 패딩(`py-2.5 px-4 xl:px-6` / 스크롤 `py-2 px-3 xl:px-4`)·폰트·색상은 **불변** (버튼 크기 유지, FR-5/SC-7).

### 3.4 LanguageSwitcher — `LanguageSwitcher.tsx` (조건부)

- 3.2의 우측 gap 확대(`xl:gap-5`)로 상담↔언어 분리가 충분하면 **변경 없음**.
- Do 단계 스크린샷에서 부족 판단 시에만 버튼에 `lg:ms-1` 보강. 기본은 무변경.

### 3.5 변경하지 않는 것 (명시)
- 헤더 높이: `h-20`/`h-16` (스크롤) — 불변.
- nav 폰트: `text-sm xl:text-[15px]` 등 — 불변.
- 색상/배경: `bg-white/95`, `bg-secondary/95`, `text-mono`, `text-white` — 불변.
- compact-nav 분기: `COMPACT_NAV_LOCALES` 로직 — 불변.
- 드롭다운 AnimatePresence·해시 네비 로직 — 불변.

## 4. 데이터/상태 흐름

상태 변경 없음 (순수 presentational 클래스 수정). `isScrolled`/`useDarkStyle`/`activeDropdown` 기존 로직 그대로.

## 5. 반응형 매트릭스 (검증 대상)

| 폭 | 분기 | 기대 동작 |
|----|------|----------|
| 1920px (2xl) | 데스크톱 nav | gap-9, ms-8 적용 — 최대 여유 |
| 1440px (xl) | 데스크톱 nav | gap-7, ms-4 적용 — 여유 확보, 한 줄 유지 |
| 1280px (xl 시작) | 데스크톱 nav | xl 값 적용, **한 줄 유지 필수** (경계 검증) |
| 1024~1279px (lg) | 데스크톱 nav | **현행과 동일** (변경 없음) — overflow 없음 |
| 768px (md) | 햄버거 | 영향 없음 |
| 375px (mobile) | 햄버거 | 영향 없음 |

## 6. 테스트 계획 (Do/Check 단계)

- **T-1**: `/ko` 1440px·1920px 스크린샷 → before/after 간격 비교 (SC-1~4)
- **T-2**: `/ko` 1024px·1280px 스크린샷 → nav 한 줄 유지 확인 (SC-5)
- **T-3**: 768px·375px 스크린샷 → 햄버거 무손상 (SC-6)
- **T-4**: 코드 diff → height/text-/color 클래스 미변경 확인 (SC-7)
- **T-5**: `cd liv-clinic && npm run build` → 0 error (SC-8)
- **T-6**: `en`(짧은 라벨) 1280px 회귀 확인 — overflow 없음

## 7. 구현 가이드 (Implementation Guide)

### 7.1 구현 순서
1. `Header.tsx` nav 컨테이너 className 수정 (3.1)
2. `Header.tsx` 우측 컨테이너 gap 수정 (3.2)
3. `Header.tsx` 상담버튼 ms 추가 (3.3)
4. 개발 서버 다중 폭 스크린샷 → 실측 미세조정
5. (조건부) LanguageSwitcher 보강 (3.4)
6. `npm run build`

### 7.2 변경 파일
- `liv-clinic/src/components/layout/Header.tsx` (필수, ~4개 className)
- `liv-clinic/src/components/layout/LanguageSwitcher.tsx` (조건부)

### 7.3 Session Guide
단일 세션 완결 (변경 ~10줄, 모듈 분할 불필요).

## 8. 완료 기준

Plan §4 Success Criteria SC-1~SC-8 전부 충족 + 다중 폭 스크린샷 증빙.

---
*Surgical Changes 원칙: 간격 관련 클래스만 수정. 인접 코드·톤·높이·버튼 디자인 불변.*
