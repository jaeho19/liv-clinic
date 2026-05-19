---
template: design
version: 1.2
feature: header-layout-fix
date: 2026-05-19
author: jaeho19
project: LIV Plastic Surgery Website (liv-clinic)
version_project: 0.1.0
---

# header-layout-fix Design Document

> **Summary**: 데스크톱 헤더(`lg:` 이상) 네비/우측 버튼 영역의 폭 초과로 인한 시각적 겹침을 Tailwind 반응형 단계화로 해소한다. surgical change (≤80 LoC, 2개 파일).
>
> **Project**: LIV Plastic Surgery Website (liv-clinic)
> **Version**: 0.1.0
> **Author**: jaeho19
> **Date**: 2026-05-19
> **Status**: Draft
> **Planning Doc**: [header-layout-fix.plan.md](../../01-plan/features/header-layout-fix.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A (UI-only) |
| Phase 2 | Coding Conventions | N/A (단일 컴포넌트 스타일) |
| Phase 3 | Mockup | N/A (기존 디자인 유지) |
| Phase 4 | API Spec | N/A |

---

## 1. Overview

### 1.1 Design Goals

1. **1440px 데스크톱 기준 헤더 한 줄에 모든 요소를 겹침 없이 표시** (필수)
2. **1280px / 1920px 에서도 동일하게 안전** (필수)
3. **모바일/태블릿(<1024px)의 기존 햄버거 메뉴 동작·터치 영역(48px) 유지** (회귀 방지)
4. **변경 외 영향 최소화** (Header.tsx + LanguageSwitcher.tsx 만 수정, 글로벌 CSS 변경 없음)
5. **홈(투명 헤더) / 서브(불투명 헤더) 양쪽 가독성 유지**

### 1.2 Design Principles

- **Tailwind 반응형 단계화**: 모든 폭 압박 요소(`gap`, `text size`, `padding`)를 `lg:` → `xl:` → `2xl:` 로 단계화
- **Surgical Change**: 추가 컴포넌트/유틸리티 추가 없이 기존 className 단일 라인 단위로 교체
- **Mobile-First Preservation**: `lg:` 미만 클래스는 절대 변경하지 않음 (모바일 회귀 0%)
- **Quantitative Spec**: 모든 변경값은 픽셀 계산표로 사전 검증

---

## 2. Architecture

### 2.1 Component Layout

```
┌──────────────────────── header (fixed, z-50) ──────────────────────┐
│  .container-custom (max-w-1280, padding 80px)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ flex justify-between (h-20 / h-16 scrolled)                  │  │
│  │ ┌─────┐  ┌───────── desktop nav (hidden lg:flex) ────────┐  │  │
│  │ │Logo │  │ about · signature · lifting · antiaging · ... │  │  │
│  │ │206px│  │  (8 items, gap-{lg:5 / xl:6 / 2xl:8})        │  │  │
│  │ └─────┘  └─────────────────────────────────────────────────┘  │  │
│  │                          ┌─── right group ────┐               │  │
│  │                          │ 상담예약 · Admin ·  │               │  │
│  │                          │ LanguageSwitcher · │               │  │
│  │                          │ Mobile menu btn    │               │  │
│  │                          └────────────────────┘               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Width Budget (1440px viewport)

| Region | Current (overflow ❌) | Target (safe ✅) | Δ |
|--------|----------------------|-----------------|---|
| Container content width | 1120 px (1280 - 80×2) | **1120 px** | 0 |
| Logo (h-10) | ~206 px | ~206 px | 0 |
| Desktop nav (8 items + 7 gap) | ~709 px (text 485 + gap 32×7=224) | **~614 px** (text 446 + gap 24×7=168) | **−95 px** |
| Right group (3 visible + Admin) | ~320 px (consultation 130 + Admin 36 + LangSwitch 130 + gap 4×3=12) | **~250 px** (consultation 120 + Admin 36 + LangSwitch 78 + gap 16×3=48) | **−70 px** |
| **Sum** | **~1235 px (overflow 115 px)** | **~1070 px (50 px safety)** | **−165 px** |

> 1280px 뷰포트는 container padding이 자동 축소되지 않고 max-w 도달 → 동일 budget. 1920px는 padding 80px 그대로, 추가 여유 240px.

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `Header.tsx` | `LanguageSwitcher`, `MobileMenu`, `MAIN_NAV` (constants), `next-intl` | Layout root |
| `LanguageSwitcher.tsx` | `LOCALE_META`, `LOCALE_ORDER`, `next-intl` | 언어 토글 |
| (변경 없음) `MobileMenu.tsx` | Header에서 props만 받음 | 모바일 메뉴 |

---

## 3. Data Model

> UI-only 작업이므로 데이터 모델 변경 없음. 참고용으로 LocaleMeta 구조만 인용.

```typescript
// 변경 없음. 기존 LOCALE_META.label = 'KOR' | 'CHN' | 'ENG' ... 3자 코드 유지.
interface LocaleMeta {
  code: Locale;
  label: string;   // 3-letter code, e.g., 'KOR'
  name: string;    // Full native name, dropdown only
  flag: string;    // emoji
  // ...
}
```

---

## 4. API Specification

N/A — UI 스타일 변경.

---

## 5. UI/UX Design

### 5.1 Header Layout Spec (변경 후)

#### 5.1.1 Desktop Navigation (`<nav>` element)

**Before** (현재):
```tsx
<nav className={`hidden lg:flex items-center transition-all duration-300 ${
  isScrolled ? 'gap-6' : 'gap-8'
}`}>
```

**After** (변경):
```tsx
<nav className={`hidden lg:flex items-center transition-all duration-300 ${
  isScrolled
    ? 'gap-4 xl:gap-5 2xl:gap-6'
    : 'gap-5 xl:gap-6 2xl:gap-8'
}`}>
```

| Breakpoint | Not scrolled | Scrolled |
|------------|--------------|----------|
| `lg` (1024–1279) | gap-5 (20px) | gap-4 (16px) |
| `xl` (1280–1535) | gap-6 (24px) | gap-5 (20px) |
| `2xl` (1536+) | gap-8 (32px) | gap-6 (24px) |

#### 5.1.2 Nav Link 텍스트 크기

**Before**:
```tsx
className={`... ${isScrolled ? 'text-sm' : 'text-[15px]'} ...`}
```

**After** (변경) — `whitespace-nowrap` 추가, 텍스트 단계화:
```tsx
className={`whitespace-nowrap font-medium tracking-[0.02em] transition-all duration-300 hover:text-primary ${
  isScrolled ? 'text-[13px] xl:text-sm' : 'text-sm xl:text-[15px]'
} ${
  useDarkStyle ? 'text-mono' : 'text-white text-shadow-light'
}`}
```

| Breakpoint | Not scrolled | Scrolled |
|------------|--------------|----------|
| `lg` (1024–1279) | 14px (text-sm) | 13px (text-[13px]) |
| `xl` (1280+) | 15px (text-[15px]) | 14px (text-sm) |

#### 5.1.3 Right Group container

**Before**:
```tsx
<div className="flex items-center gap-3 md:gap-4">
```

**After**:
```tsx
<div className="flex items-center gap-2 md:gap-3 lg:gap-3 xl:gap-4">
```

| Breakpoint | Gap |
|------------|-----|
| base / sm | 8px |
| md (768) | 12px |
| lg (1024) | 12px |
| xl (1280+) | 16px |

> 가로 폭이 풍부한 xl 이상에서는 가독성 위해 16px 유지. 협소한 lg에서는 12px로 절약.

#### 5.1.4 상담예약 버튼

**Before**:
```tsx
className={`hidden md:block btn-primary transition-all duration-300 ${
  isScrolled ? 'text-xs py-2 px-4' : 'text-sm py-2.5 px-6'
} ${...}`}
```

**After**:
```tsx
className={`hidden md:inline-block whitespace-nowrap btn-primary transition-all duration-300 ${
  isScrolled
    ? 'text-xs py-2 px-3 xl:px-4'
    : 'text-sm py-2.5 px-4 xl:px-6'
} ${...}`}
```

| Breakpoint | Not scrolled (px) | Scrolled (py / px) |
|------------|---------------------|--------------------|
| md / lg | 10px / 16px | 8px / 12px |
| xl+ | 10px / 24px | 8px / 16px |

> `inline-block` + `whitespace-nowrap` 으로 한 줄 유지.

#### 5.1.5 LanguageSwitcher (데스크톱 슬림화)

**Before** (`LanguageSwitcher.tsx` button):
```tsx
<button
  className={`flex items-center gap-2.5 md:gap-3 text-base md:text-lg font-medium transition-colors min-h-[48px] md:min-h-[52px] px-3 md:px-4 ${...}`}
>
  <span className="text-xl md:text-2xl leading-none">{currentLanguage.flag}</span>
  <span className="inline font-semibold tracking-wide">{currentLanguage.label}</span>
  <svg className="w-5 h-5 md:w-6 md:h-6 ..." />
</button>
```

**After** — 모바일 그대로, 데스크톱(`lg:` 이상)만 슬림:
```tsx
<button
  className={`flex items-center gap-2.5 md:gap-3 lg:gap-2 text-base md:text-lg lg:text-sm xl:text-[15px] font-medium transition-colors min-h-[48px] md:min-h-[52px] lg:min-h-[40px] px-3 md:px-4 lg:px-2 xl:px-2.5 ${
    isScrolled ? 'text-mono hover:text-primary' : 'text-white hover:text-white/80'
  }`}
>
  <span className="text-xl md:text-2xl lg:text-base xl:text-lg leading-none">{currentLanguage.flag}</span>
  <span className="inline font-semibold tracking-wide">{currentLanguage.label}</span>
  <svg
    className={`w-5 h-5 md:w-6 md:h-6 lg:w-4 lg:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
    ...
  />
</button>
```

**변경 요점**:
- `lg:` 이상에서 글자 크기 18px → **14px (lg) / 15px (xl)** 로 축소
- 깃발 이모지 24px → **16px (lg) / 18px (xl)**
- 좌우 패딩 16px → **8px (lg) / 10px (xl)**
- 셰브론 24px → **16px (lg+)**
- 컨테이너 min-h 52px → **40px (lg+)** (데스크톱에서는 메뉴와 동일한 높이감)
- 모바일/태블릿(`md:` 이하): **변경 없음 → 가독성·터치 영역 100% 보존**

**예상 폭** (lg+, 라벨 "KOR" 기준):
- 깃발 16px + gap 8px + 텍스트 ~28px + (gap 없음) + 셰브론 16px + 좌우 패딩 16px = **~84px** (xl 기준 ~90px)

#### 5.1.6 모바일 메뉴 버튼

**변경 없음**. (`lg:hidden`로 데스크톱에서는 표시되지 않으므로 영향 없음.)

### 5.2 Visual State Matrix

| Viewport | 홈(투명) Not scrolled | 홈 Scrolled | 서브(불투명) |
|----------|----------------------|-------------|--------------|
| 1024 (lg) | nav text 14px, gap 20px / right gap 12px | nav 13px, gap 16px | 동일(useDarkStyle) |
| 1280 (xl) | nav 15px, gap 24px / right gap 16px | nav 14px, gap 20px | 동일 |
| 1440 | (xl 기준 적용) | (xl 기준) | (xl 기준) |
| 1536 (2xl) | nav 15px, gap 32px | nav 14px, gap 24px | 동일 |
| 1920 | (2xl 기준 적용) | (2xl 기준) | (2xl 기준) |

### 5.3 User Flow (회귀 점검)

```
1. (≥1024) 데스크톱 진입 → 모든 nav 항목 표시 → hover 시 드롭다운 정상
2. (<1024) 모바일 진입 → 햄버거 버튼만 표시 → 클릭 시 MobileMenu 정상
3. 스크롤 50px 초과 → 헤더 h-20 → h-16, 배경 white/95 전환, 텍스트/패딩 단계화 적용
4. 다국어 토글 → LanguageSwitcher 드롭다운 정상 → 라벨 코드(KOR→ENG 등) 즉시 반영
```

### 5.4 Component List

| Component | Location | Responsibility | 변경 유형 |
|-----------|----------|----------------|----------|
| `Header.tsx` | `liv-clinic/src/components/layout/` | desktop nav + right group container | **수정** (className 단계화) |
| `LanguageSwitcher.tsx` | `liv-clinic/src/components/layout/` | 언어 토글 버튼 | **수정** (button className 데스크톱 슬림화) |
| `MobileMenu.tsx` | 동일 | 모바일 메뉴 | **변경 없음** |
| `globals.css` | `liv-clinic/src/app/` | 컨테이너 변수 | **변경 없음** (옵션 제외) |

---

## 6. Error Handling

UI 컴포넌트로 런타임 에러 처리 변경 없음.

| Scenario | Mitigation |
|----------|-----------|
| 새 언어 추가로 `label`이 3자 초과 | `LOCALE_META.label`은 규약상 3자 코드. 검증은 PR 리뷰에서 보장 |
| 다국어 라벨 길이 차이로 일부 viewport에서 압박 | `whitespace-nowrap` + budget 50px 안전 마진 |
| 한국어/중국어 폰트 폭 차이 | `tracking-[0.02em]`, `font-medium` 유지로 시각적 균형 보존 |

---

## 7. Security Considerations

- [x] 사용자 입력 처리 없음 (UI 스타일만)
- [x] 외부 데이터 페치 없음
- [x] XSS 영향 없음 (정적 라벨, i18n 키만 사용)
- [x] 인증/권한 영향 없음

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Visual Regression (manual) | 1024 / 1280 / 1440 / 1536 / 1920 폭 헤더 스크린샷 비교 | Chrome DevTools device mode |
| 회귀 (manual) | 모바일 햄버거 메뉴 진입 (375 / 768) | 동일 |
| Lint | 변경 파일 ESLint | `npm run lint` |
| Build | 변경 파일 컴파일 | `npm run build` |
| (선택) Type | TS 타입 체크 | `tsc --noEmit` |

### 8.2 Test Cases (필수)

- [ ] **TC-01** (FR-01,05): 1440px / 홈 / not-scrolled → 8 nav 항목 + 로고 + 상담예약 + Admin + LanguageSwitcher 모두 한 줄, 가로 스크롤 0
- [ ] **TC-02** (FR-01): 1440px / 홈 / scrolled → 동일하게 겹침 없음
- [ ] **TC-03** (FR-05): 1280px / 서브(/about) → 겹침 0
- [ ] **TC-04** (FR-05): 1920px → 좌우 여백 균형, 겹침 0
- [ ] **TC-05** (FR-06): 1023px (≤lg-1) → 햄버거 메뉴만 표시, desktop nav `hidden`
- [ ] **TC-06** (FR-06): 375px (모바일) → 햄버거 + 언어 버튼 풀 사이즈(touch 48px) 유지
- [ ] **TC-07** (FR-04): 모바일 LanguageSwitcher → flag 24px + label `text-lg` 그대로
- [ ] **TC-08** (FR-07): 홈 hero 위 투명 헤더에서 흰색 텍스트 + text-shadow 가독성 유지
- [ ] **TC-09**: 다국어 토글 ko→en→ja→zh → 각 라벨에서도 겹침 없음
- [ ] **TC-10**: 드롭다운(about, lifting 등) hover 동작 정상

---

## 9. Clean Architecture

### 9.1 Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `Header.tsx` | Presentation | `src/components/layout/` |
| `LanguageSwitcher.tsx` | Presentation | `src/components/layout/` |

본 작업은 **Presentation 레이어 내부 스타일 조정만** 수행. Application/Domain/Infrastructure 어떤 레이어도 변경하지 않음.

### 9.2 Dependency Rules

- 변경 컴포넌트가 import하는 외부 의존성(`next-intl`, `framer-motion`, `next/link`, `next/image`) 모두 기존과 동일.
- `lib/constants.ts`, `i18n/locales-meta.ts` **수정 없음**.

---

## 10. Coding Convention Reference

### 10.1 Naming

| Target | Rule | Example (본 작업) |
|--------|------|------------------|
| Component file | PascalCase.tsx | `Header.tsx` (유지) |
| className 토큰 | Tailwind kebab utility | `lg:gap-5`, `xl:text-[15px]` |
| 임시 변수 추가 | (불필요) | 없음 |

### 10.2 Import Order

- 본 작업은 신규 import 추가 없음 → 기존 import 순서 그대로.

### 10.3 Environment Variables

- 영향 없음.

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|--------------------|
| Tailwind 단계화 | `lg: → xl: → 2xl:` 순으로만 사용 (1024/1280/1536) |
| Magic number | 14px/15px/16px 같은 디자인 시스템 외 값은 `text-[15px]`처럼 명시 |
| Whitespace 보호 | nav 링크와 상담예약 버튼에 `whitespace-nowrap` 적용 |
| 모바일 변경 금지 | `md:` 이하 클래스 절대 변경 금지 (회귀 방지) |

---

## 11. Implementation Guide

### 11.1 변경 대상 파일

```
liv-clinic/src/components/layout/
├── Header.tsx              ★ 수정 (3개 className 블록)
└── LanguageSwitcher.tsx    ★ 수정 (button className 1개 블록)
```

### 11.2 변경 라인 예상치

| 파일 | 수정 LoC | 추가 LoC | 삭제 LoC | 총 변경 |
|------|---------:|---------:|---------:|--------:|
| Header.tsx | ~12 | 0 | 0 | ~12 |
| LanguageSwitcher.tsx | ~6 | 0 | 0 | ~6 |
| **합계** | **~18** | **0** | **0** | **~18 (<<80 한도)** |

### 11.3 Implementation Order

1. [ ] **Step 1**: `Header.tsx` — desktop nav `<nav>` 컨테이너 className 교체 (`gap-6/gap-8` → `gap-4 xl:gap-5 2xl:gap-6 / gap-5 xl:gap-6 2xl:gap-8`)
2. [ ] **Step 2**: `Header.tsx` — nav `<Link>` className 교체 (텍스트 사이즈 단계화 + `whitespace-nowrap`)
3. [ ] **Step 3**: `Header.tsx` — 우측 그룹 컨테이너 `<div>` className 교체 (`gap-3 md:gap-4` → `gap-2 md:gap-3 xl:gap-4`)
4. [ ] **Step 4**: `Header.tsx` — 상담예약 `<Link>` className 교체 (`px-4/px-6` 단계화 + `whitespace-nowrap`)
5. [ ] **Step 5**: `LanguageSwitcher.tsx` — button className 데스크톱 슬림 클래스 추가 (`lg:text-sm xl:text-[15px] lg:px-2 xl:px-2.5 lg:min-h-[40px] lg:gap-2`)
6. [ ] **Step 6**: `LanguageSwitcher.tsx` — flag span `text-2xl` → `lg:text-base xl:text-lg`
7. [ ] **Step 7**: `LanguageSwitcher.tsx` — chevron svg `lg:w-4 lg:h-4`
8. [ ] **Step 8**: `npm run dev` 실행 → 1024 / 1280 / 1440 / 1536 / 1920 폭에서 수동 확인
9. [ ] **Step 9**: 모바일(375 / 768) 햄버거 메뉴 회귀 확인
10. [ ] **Step 10**: `npm run lint` (변경 파일 한정)
11. [ ] **Step 11**: `npm run build` 성공 확인
12. [ ] **Step 12**: before/after 스크린샷을 `screenshots/header-fix/`에 저장

### 11.4 Acceptance Checklist (Definition of Done 매핑)

| Plan FR | Design 보장 방식 | 검증 단계 |
|---------|------------------|----------|
| FR-01 | width budget 1235→1070, 50px safety | TC-01,02 |
| FR-02 | nav gap-5/24px 보장 (xl+) | TC-01 |
| FR-03 | right gap-4/16px (xl+) + 상담예약 whitespace-nowrap | TC-01 |
| FR-04 | `md:` 이하 클래스 보존, `lg:` 이상 슬림 적용 | TC-06,07 |
| FR-05 | 1280/1440/1920 단계별 클래스 적용 | TC-03,04 |
| FR-06 | `<lg` 영역 변경 0 | TC-05,06 |
| FR-07 | `text-shadow-light` + 흰색 텍스트 유지 | TC-08 |

---

## 12. Rollback Plan

| 시나리오 | 대응 |
|---------|------|
| 운영 배포 후 일부 viewport에서 텍스트 잘림 | `git revert <commit>` 또는 LanguageSwitcher만 부분 롤백 |
| 모바일에서 의도치 않은 변화 발견 | `md:` 이하 클래스가 변경됐는지 PR diff 확인 → 즉시 fix-forward |
| 1280px에서 여전히 한 줄에 안 맞음 | `xl:gap-5` → `xl:gap-4`로 한 단계 축소, 또는 상담예약을 `xl:inline-block 2xl:`로 늦게 노출 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-19 | Initial draft (단계화 클래스 + width budget 검증 + 11단계 구현 순서) | jaeho19 |
