# Plan: 상단 헤더 네비게이션 간격 개선 (header-nav-spacing)

> **Feature**: header-nav-spacing
> **작성일**: 2026-05-30
> **Phase**: Plan
> **대상 파일**: `liv-clinic/src/components/layout/Header.tsx`, `liv-clinic/src/components/layout/LanguageSwitcher.tsx`
> **선행 참고**: `header-layout-fix.plan.md` (overflow/언어스위처 가시성 처리 — 이번 작업과 충돌 금지)

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | PC 상단 네비게이션 메뉴가 전체적으로 좁아 답답하고, 특히 로고↔'리브 소개', '이벤트'↔'상담예약' 구간이 붙어 보여 프리미엄 클리닉의 여유 있는 느낌이 약하다. |
| **Solution** | `xl`(1280px)+ 구간 위주로 nav `gap`을 중간 강도(+4~6px)로 확대하고, 로고↔nav·우측영역에 명시적 여백을 추가한다. `lg`(1024~1280px)는 9개 메뉴 overflow 방지를 위해 현재 수준을 유지한다. |
| **Function/UX Effect** | 메뉴 항목이 서로 분리되어 시각적 호흡이 생기고, 헤더 높이·폰트·색상 톤은 그대로 유지되어 디자인 일관성을 지킨다. |
| **Core Value** | 레이아웃 깨짐 없이 고급스럽고 여유 있는 상단 네비게이션 인상 — 톤/색상/높이 변경 없는 순수 간격 리파인. |

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 좁은 메뉴 간격이 프리미엄 브랜드 인상을 해친다. 여유 간격으로 고급스러움 강화. |
| **WHO** | livps.co.kr / liv-clinic.net 방문자 (PC 우선), 디자인 톤을 유지하려는 운영자. |
| **RISK** | 데스크톱 nav 항목이 **9개**로 많아, 간격 확대 시 1024~1280px에서 overflow → 햄버거 조기 전환 위험. `ja/fr/mn/ru`는 이미 compact-nav로 강제 햄버거 처리 중 (건드리지 말 것). |
| **SUCCESS** | `/ko` PC에서 메뉴가 붙어 보이지 않고, 로고↔소개·이벤트↔상담 여백 확보, 태블릿/모바일 무손상, `npm run build` 0 error. |
| **SCOPE** | Header.tsx의 nav `gap`·로고/우측 margin, LanguageSwitcher의 좌측 분리 여백. **헤더 높이·폰트 크기·색상·버튼 디자인은 변경 금지.** |

## 1. 배경 및 현재 상태

### 1.1 현재 레이아웃 구조 (`Header.tsx`)
- 헤더 컨테이너: `flex items-center justify-between` — 3개 영역(로고 / 데스크톱 nav / 우측[상담버튼 + 관리자 아이콘 + LanguageSwitcher])을 양끝 정렬.
- 데스크톱 nav 항목: **9개** — 소개·시그니처·리프팅·안티에이징·레이저·가격·전후·의료정보·이벤트.

### 1.2 현재 간격 값 (PC 기준)
| 구간 | 현재 클래스 | 실측 |
|------|------------|------|
| nav 항목 간 gap (상단) | `gap-5 xl:gap-6 2xl:gap-8` | 20 / 24 / 32px |
| nav 항목 간 gap (스크롤) | `gap-4 xl:gap-5 2xl:gap-6` | 16 / 20 / 24px |
| 로고 ↔ nav | (명시 없음, justify-between 의존) | 가변 |
| nav ↔ 우측영역 | (명시 없음, justify-between 의존) | 가변 |
| 우측영역 내부 gap | `gap-2 md:gap-3 xl:gap-4` | 8 / 12 / 16px |
| 상담버튼 패딩 (상단) | `py-2.5 px-4 xl:px-6` | — |
| 언어 스위처 패딩 | `lg:px-2 xl:px-2.5` | 8 / 10px |

### 1.3 문제 원인
`justify-between`은 양끝만 고정하고 가운데 nav가 넓어질수록 로고/우측과의 여백이 줄어든다. 9개 메뉴로 nav가 넓어 좌우 영역과 붙어 보인다.

## 2. 요구사항 (사용자 확정)

### 2.1 기능 요구사항
- **FR-1**: nav 항목 간 gap을 현재보다 여유 있게 확대 (중간 강도, +4~6px).
- **FR-2**: 로고와 첫 메뉴('리브 소개') 사이에 명시적 여백 추가.
- **FR-3**: '이벤트'↔'상담예약' 사이(=nav↔우측영역) 분리 여백 추가.
- **FR-4**: 상담예약 버튼과 언어선택(KR/KOR) 영역 사이 여백 확보.
- **FR-5**: 헤더 높이·폰트 크기·색상 톤·버튼 디자인 유지 (변경 금지).

### 2.2 사용자 결정사항 (Checkpoint 확정)
| 결정 | 선택 | 근거 |
|------|------|------|
| 적용 폭 | **xl(1280px)+ 위주** | 넓은 화면에서 여유 확보, 1024~1280px는 현 수준 유지해 9개 메뉴 overflow 방지 |
| 간격 강도 | **중간 — 균형** | nav gap +4~6px, 로고/우측 명시 여백. 답답함 해소 + 안전 |
| 우측영역 분리 | **여백만 추가** | 구분선 없이 margin/gap으로만 분리, 디자인 톤 유지 |

### 2.3 비범위 (Out of Scope)
- 헤더 높이 변경, 폰트 크기 변경, 색상/배경 톤 변경.
- 상담버튼 크기·스타일 변경 (주변 여백만 확보).
- `ja/fr/mn/ru` compact-nav 동작 변경 (현행 유지).
- 모바일 햄버거 메뉴(`MobileMenu.tsx`) 내부 레이아웃 변경.

## 3. 제안 변경안 (Do 단계에서 확정)

> 아래는 방향 제안이며, Design/Do 단계에서 실측·미세조정한다.

### 3.1 `Header.tsx` — nav 컨테이너 (L200~206)
- 상단: `gap-5 xl:gap-6 2xl:gap-8` → `gap-5 xl:gap-7 2xl:gap-9` (xl 24→28, 2xl 32→36)
- 스크롤: `gap-4 xl:gap-5 2xl:gap-6` → `gap-4 xl:gap-6 2xl:gap-7` (xl 20→24, 2xl 24→28)
- nav에 로고 분리 여백 추가: `xl:ms-4 2xl:ms-8` (FR-2)

### 3.2 `Header.tsx` — 우측영역 / 상담버튼 (L272~283)
- 우측 컨테이너 gap: `gap-2 md:gap-3 xl:gap-4` → `gap-2 md:gap-3 xl:gap-5` (FR-4)
- 상담버튼에 좌측 분리 여백: `xl:ms-2 2xl:ms-3` (FR-3, nav↔상담 분리)

### 3.3 `LanguageSwitcher.tsx` — 좌측 분리 (필요 시)
- 우측 컨테이너 gap 확대로 상담↔언어 분리가 충분하면 변경 없음. 부족 시 버튼에 `lg:ms-1` 보강.

### 3.4 overflow 안전장치
- `lg`(1024~1280px) base gap·margin은 **변경하지 않음** → 9개 메뉴 가로 합이 현행과 동일하게 유지.
- 변경은 전부 `xl:`/`2xl:` 프리픽스로 한정해 좁은 데스크톱 영향 0.

## 4. Success Criteria (검증 기준)

| ID | 기준 | 검증 방법 |
|----|------|----------|
| SC-1 | `/ko` PC(1440/1920px)에서 메뉴가 붙어 보이지 않음 | 스크린샷 육안 + 간격 측정 |
| SC-2 | 로고↔'리브 소개' 여백 확보 | 스크린샷 비교 (before/after) |
| SC-3 | '이벤트'↔'상담예약' 여백 확보 | 스크린샷 비교 |
| SC-4 | KR/KOR 영역이 상담버튼과 분리 | 스크린샷 비교 |
| SC-5 | 1024/1280px 데스크톱에서 nav 한 줄 유지 (overflow 없음) | 다중 폭 스크린샷 |
| SC-6 | 태블릿(768px)/모바일(375px) 헤더 무손상 | 반응형 스크린샷 |
| SC-7 | 헤더 높이·폰트·색상 불변 | 코드 diff 검토 (height/text-/color 클래스 미변경) |
| SC-8 | `npm run build` 0 error | 빌드 로그 |

## 5. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| 9개 메뉴 overflow → 햄버거 조기 전환 | 중 | 변경을 `xl:`/`2xl:`로 한정, `lg` base 불변. 다중 폭 스크린샷 검증 |
| compact-nav locale 회귀 | 저 | `ja/fr/mn/ru` 분기 로직 미변경 |
| AnimatePresence 드롭다운 회귀 | 저 | gap/margin만 변경, 이벤트·DOM 구조 불변 |
| 스크롤 상태(h-16) 간격 불일치 | 저 | scrolled gap도 동일 비율로 조정 |

## 6. 다음 단계

- `/pdca design header-nav-spacing` — 3개 아키텍처 옵션 비교 후 확정 (간단 변경이므로 Option A 최소 변경 유력)
- 이후 `/pdca do header-nav-spacing` — 구현 + 다중 폭 스크린샷 + `npm run build`

---
*변경 철학: Surgical Changes — 간격 관련 클래스만 수정, 인접 코드·톤·높이 불변.*
