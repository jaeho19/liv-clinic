---
template: plan
version: 1.2
feature: header-layout-fix
date: 2026-05-19
author: jaeho19
project: LIV Plastic Surgery Website (liv-clinic)
version_project: 0.1.0
---

# header-layout-fix Planning Document

> **Summary**: 데스크톱(≥1024px) 헤더에서 네비게이션 메뉴 텍스트 간 겹침 및 우측 "이벤트/상담예약" 버튼 영역 겹침을 해소한다.
>
> **Project**: LIV Plastic Surgery Website (liv-clinic)
> **Version**: 0.1.0
> **Author**: jaeho19
> **Date**: 2026-05-19
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

`https://liv-clinic.net/ko` 상단 글로벌 헤더에서 다음 두 가지 시각적 결함을 제거한다.

1. 데스크톱 뷰포트(특히 1280~1440px)에서 네비게이션 메뉴 항목(예: "리브 소개", "시그니처", "리프팅", "안티에이징" 등)이 서로 가까이 붙어 텍스트가 겹쳐 보이는 현상.
2. 우측 영역 "이벤트" 메뉴와 "상담예약" CTA 버튼 박스가 시각적으로 겹쳐 보이는 현상(현 코드 기준 "events"는 nav 메뉴, 상담예약은 우측 버튼, 언어 전환 버튼 확대로 인해 압박이 가중됨).

### 1.2 Background

- 최근 커밋 `987e0a8 feat(header): 언어 선택 버튼 크기 확대 - 가독성·터치 영역 개선`으로 `LanguageSwitcher`가 `text-base md:text-lg`, `px-3 md:px-4`, 깃발+풀 라벨 표시로 약 120–140px 폭을 차지하게 됨.
- `Header.tsx`의 desktop nav는 한국어 라벨 8개(`about`, `signature`, `lifting`, `antiaging`, `laser`, `beforeAfter`, `medical`, `events`)를 노출하며 `gap-8`(32px)을 사용한다.
- 컨테이너는 `--container-max: 1280px`, 데스크톱 좌우 padding `80px`로 실제 사용 가능 폭은 약 **1120px**이다.
- 대략적 폭 합산:
  - Logo: 약 206px (h-10)
  - Desktop nav (텍스트 ~485px + gap 7×32px = 224px): **약 709px**
  - Right group (상담예약 ~120px + Admin 36px + LangSwitcher ~130px + gap-3/4): **약 320px**
  - 합계: **약 1235px > 1120px** → 가용 영역 초과로 항목 간 시각적 충돌·겹침 발생.

### 1.3 Related Documents

- 원본 컴포넌트: `liv-clinic/src/components/layout/Header.tsx`
- 언어 전환 컴포넌트: `liv-clinic/src/components/layout/LanguageSwitcher.tsx`
- 전역 스타일: `liv-clinic/src/app/globals.css`
- 디자인 시스템: `CLAUDE.md` (디자인 시스템 섹션)
- 최근 관련 커밋: `987e0a8`, `b2171e8`, `ae5f2e6`

---

## 2. Scope

### 2.1 In Scope

- [ ] `Header.tsx` 데스크톱 네비게이션 항목 간 간격/타이포 조정
- [ ] `Header.tsx` 우측 그룹(상담예약 CTA, Admin, LanguageSwitcher) 간격 및 패딩 조정
- [ ] `LanguageSwitcher.tsx` 데스크톱 표시 폭 축소(가독성·터치 영역은 유지)
- [ ] `lg`(1024px) ~ `xl`(1280px) ~ `2xl`(1536px) 브레이크포인트별 동작 검증
- [ ] 모바일/태블릿(≤1023px)에서 햄버거 메뉴 동작이 깨지지 않음을 확인
- [ ] 홈페이지(투명 헤더)·내부 페이지(불투명 헤더) 양쪽에서 모두 정상

### 2.2 Out of Scope

- 모바일 메뉴(`MobileMenu.tsx`) 내부 구조 변경
- 네비 메뉴 항목 자체의 추가/삭제 (정보 구조 변경)
- 헤더 디자인 컨셉/색상 시스템 변경
- 다른 페이지의 레이아웃 변경

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 데스크톱 1440px 기준 헤더 한 줄에 로고 + 8개 nav + 상담예약 + Admin + LanguageSwitcher가 겹침 없이 모두 표시된다 | High | Pending |
| FR-02 | nav 메뉴 항목 간 최소 가시 간격 24px 이상 확보(스크롤 전 32px 유지, 스크롤 시 24px 이상) | High | Pending |
| FR-03 | 우측 CTA "상담예약" 버튼과 인접 요소(이벤트 메뉴/Admin/LanguageSwitcher) 사이 최소 16px 간격 확보 | High | Pending |
| FR-04 | LanguageSwitcher가 데스크톱에서 폭을 차지하지 않도록 폰트/패딩을 축소하되, 모바일에서는 기존 가독성·터치 영역(최소 48px) 유지 | High | Pending |
| FR-05 | 1280px / 1440px / 1920px 뷰포트 어디서도 가로 스크롤이나 텍스트 겹침이 발생하지 않는다 | High | Pending |
| FR-06 | 모바일·태블릿(<1024px)에서 햄버거 메뉴 표시·동작이 기존과 동일하게 유지된다 | High | Pending |
| FR-07 | 홈 hero 영역(투명 헤더) 위에서도 텍스트 가독성·대비가 유지된다 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 헤더 리렌더 비용 증가 없음 (현 throttle 로직 유지) | React DevTools Profiler / 변경 라인 수 검토 |
| Accessibility | nav 링크와 버튼의 키보드 포커스/탭 순서, ARIA 레이블 유지 | 수동 Tab 테스트, Lighthouse a11y |
| Responsive | lg(1024) / xl(1280) / 1440 / 2xl(1536) / 1920 모두 안전 | 브라우저 dev tools 디바이스 모드 |
| Visual Regression | 홈·서브 페이지 헤더 스크린샷 비교 | 1440px 기준 before/after PNG |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 1440px 데스크톱에서 헤더 모든 메뉴·버튼이 한 줄에, 항목 사이 가시 간격 ≥ 16px로 표시
- [ ] 1280px / 1920px에서도 겹침/오버플로우 없음
- [ ] `<1024px`에서 햄버거 메뉴 진입 정상
- [ ] `npm run lint` 통과
- [ ] `npm run build` 성공 (변경 파일 한정)
- [ ] before/after 스크린샷 첨부

### 4.2 Quality Criteria

- [ ] 변경 파일 수 ≤ 3 (Header.tsx, LanguageSwitcher.tsx, 필요 시 globals.css)
- [ ] 변경 라인 수 ≤ 80 lines (외과적 변경)
- [ ] 기존 throttle/scroll/hover 로직 보존
- [ ] Tailwind 유틸리티 클래스 외 새로운 글로벌 CSS 도입 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| LanguageSwitcher 축소 시 최근 UX 개선(가독성) 후퇴 | Medium | Medium | 모바일은 그대로 유지, 데스크톱만 `text-sm`/`px-2`로 조정. 풀 라벨 대신 코드(KO/EN/JA/ZH)만 노출하는 옵션 검토 |
| nav `text-[15px]` → 작아질 때 hero(투명 헤더) 위에서 가독성 저하 | Medium | Low | 명도/그림자(`text-shadow-light`) 유지, 폰트 사이즈는 14–15px 범위 |
| 1280px 미만에서 일부 항목이 여전히 겹침 | High | Medium | `xl:` 브레이크포인트 단계별 조정, 또는 1280px 미만에서는 `lg` 기준으로 약간 더 축소된 gap 사용 |
| 한 줄 유지 위해 `whitespace-nowrap` 추가로 작은 화면에서 가로 스크롤 발생 | High | Low | `lg:` 이상 영역에만 적용. 모바일은 hidden 유지(`hidden lg:flex`) |
| 변경이 모바일 메뉴 트리거에 영향 | Medium | Low | `MobileMenu` import/props 변경 없이 desktop 영역 클래스만 수정 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend (현 LIV 프로젝트) | ☑ |
| **Enterprise** | Strict layer separation, DI | High-traffic / complex | ☐ |

본 작업은 단일 컴포넌트 스타일 조정으로 아키텍처 레벨 변경 없음.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 16 (App Router) | Next.js 16 | 기존 스택 유지 |
| Styling | Tailwind 4.x + CSS Variables | Tailwind | `gap-*`, `text-*`, `px-*` 유틸리티만으로 해결 가능 |
| Responsive 전략 | breakpoint별 utility (`lg:`, `xl:`, `2xl:`) | Tailwind 반응형 | 1024 / 1280 / 1536 단계별 미세 조정 |
| Layout primitive | flex `justify-between` + gap | 현 구조 유지 | 변경 최소화 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic
Folder Structure (변경 없음):
  liv-clinic/src/components/layout/
    ├── Header.tsx          ← 주 변경
    ├── LanguageSwitcher.tsx ← 부 변경
    └── MobileMenu.tsx       (변경 없음)
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md`에 컬러/타이포/스페이싱 시스템 명시
- [x] Tailwind 설정 존재 (`tailwind.config.ts`)
- [x] TypeScript 설정 존재 (`tsconfig.json`)
- [x] ESLint 설정 존재

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| Naming | exists | 변경 없음 | - |
| Folder structure | exists | 변경 없음 | - |
| 반응형 브레이크포인트 | exists (`lg:`, `md:`) | `xl:` 활용 명시화 | Medium |
| 헤더 nav 간격 표준 | implicit | `gap-8` (32px) 기본, 스크롤 시 `gap-6` (24px), `xl:` 미만에서 `gap-5` (20px) | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| (없음) | 본 작업은 환경변수 영향 없음 | - | ☐ |

### 7.4 Pipeline Integration

해당 작업은 9-phase Pipeline의 Phase 6(UI Integration) 후속 fix에 해당. Phase 단위 산출물 새로 만들지 않음.

---

## 8. Approach & Solution Outline

설계(`design` 단계)에서 상세 확정할 가설:

1. **데스크톱 nav 폭 절감**
   - `lg:`(1024–1279) 구간에서 `gap-5` (20px), `xl:`(1280+) 에서 `gap-6` (24px) 적용
   - `text-[15px]` → `lg:text-sm xl:text-[15px]` 단계화
   - nav 컨테이너에 `whitespace-nowrap` 적용해 줄바꿈으로 인한 시각적 겹침 방지

2. **우측 그룹 간격 확보**
   - `gap-3 md:gap-4` → `md:gap-4 xl:gap-5` 로 1280+ 에서 20px 확보
   - 상담예약 버튼: `text-sm py-2.5 px-6` → `lg:px-5 xl:px-6` 단계화

3. **LanguageSwitcher 데스크톱 최적화**
   - 데스크톱: `text-base md:text-lg` → `md:text-base lg:text-sm xl:text-sm`
   - padding: `px-3 md:px-4` → `lg:px-2 xl:px-3`
   - 라벨 표기: 데스크톱 `lg:` 이상에서는 `label` 대신 `code` (`KO`, `EN`, `JA`, `ZH`)로 축약 (모바일은 풀 라벨 유지)
   - 폭: 약 130px → 약 70–80px (~50% 절감)

4. **컨테이너 패딩 검토 (옵션)**
   - 현 데스크톱 `--container-padding: 80px`가 과해 보일 경우 헤더에 한해 `lg:px-10 xl:px-16`으로 축소(전역 변경 없이 헤더만)

5. **방어적 처리**
   - nav `<nav>` 부모에 `min-w-0`, 자식 링크에 `truncate`로 극단 시나리오에서도 줄바꿈/겹침 방지

---

## 9. Verification Plan

설계 후 구현·검증 단계에서 수행:

- [ ] dev server `npm run dev`로 `http://localhost:3000/ko` 진입
- [ ] Chrome DevTools 디바이스 모드: 1024 / 1280 / 1440 / 1536 / 1920 폭에서 각각 스크롤 전/후 상태 캡처
- [ ] `/`(홈, 투명 헤더) 와 `/about`, `/lifting`(불투명 헤더) 양쪽 확인
- [ ] `<1024px` 모바일 메뉴 진입 확인
- [ ] 다국어 라벨 길이 차이 점검: ko/en/ja/zh 토글
- [ ] `npm run lint`, 변경 파일 한정 `npm run build`

---

## 10. Next Steps

1. [ ] 본 Plan에 대한 사용자 확인 후 `/pdca design header-layout-fix` 실행
2. [ ] Design 문서에서 정확한 클래스명/픽셀값 확정 후 `/pdca do header-layout-fix`로 구현
3. [ ] `/pdca analyze header-layout-fix`로 1440px 스크린샷 기반 Gap 분석
4. [ ] >= 90% 매칭 시 `/pdca report`로 마무리

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-19 | Initial draft (header desktop 1440px 겹침 이슈 분석 및 수정 계획) | jaeho19 |
