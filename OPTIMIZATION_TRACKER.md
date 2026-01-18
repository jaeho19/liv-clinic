# LIV 성형외과 웹사이트 - 성능 최적화 추적

> **생성일**: 2026-01-18
> **프로젝트**: LIV Plastic Surgery Website
> **기준**: Vercel React Best Practices

---

## 진행 상태 요약

| 상태 | 개수 |
|------|------|
| ✅ 완료 | 18 |
| 🔄 진행 중 | 0 |
| ⏳ 대기 | 0 |
| ⏸️ 추후 검토 | 1 |

---

## 1. 워터폴 제거 (CRITICAL)

### 1.1 Header 스크롤 이벤트 Throttling
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/layout/Header.tsx`
- **문제**: 스크롤 이벤트가 매 프레임마다 실행 (throttle 없음)
- **규칙**: `async-defer-await`, `rerender-dependencies`
- **예상 효과**: 스크롤 성능 15-20% 개선
- **완료일**: 2026-01-18
- **메모**: useThrottle 커스텀 훅 추가, passive: true 이벤트 리스너 옵션 적용

### 1.2 MobileMenu 리렌더 최적화
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/layout/MobileMenu.tsx`
- **문제**: useCallback 최적화 필요
- **규칙**: `rerender-functional-setstate`
- **예상 효과**: 모바일 메뉴 반응성 개선
- **완료일**: 2026-01-18
- **메모**: toggleExpand, handleLanguageChange에 useCallback 적용

### 1.3 BackToTop 스크롤 이벤트 Throttling
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/layout/BackToTop.tsx`
- **문제**: 스크롤 이벤트가 매 프레임마다 실행 (throttle 없음)
- **규칙**: `async-defer-await`, `rerender-dependencies`
- **예상 효과**: 스크롤 성능 개선
- **완료일**: 2026-01-19
- **메모**: useThrottle 커스텀 훅 추가 (100ms 간격), passive: true 적용

### 1.4 ScrollProgress 스크롤 이벤트 Throttling
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/layout/ScrollProgress.tsx`
- **문제**: 스크롤 이벤트가 매 프레임마다 실행 (throttle 없음)
- **규칙**: `async-defer-await`, `rerender-dependencies`
- **예상 효과**: 스크롤 성능 개선
- **완료일**: 2026-01-19
- **메모**: useThrottle 커스텀 훅 추가 (150ms 간격), passive: true 적용

### 1.5 StickyCtaBar 스크롤 이벤트 Throttling
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/ui/StickyCtaBar.tsx`
- **문제**: 스크롤 이벤트가 매 프레임마다 실행 (throttle 없음)
- **규칙**: `async-defer-await`, `rerender-dependencies`
- **예상 효과**: 스크롤 성능 개선
- **완료일**: 2026-01-19
- **메모**: useThrottle 커스텀 훅 추가 (150ms 간격), passive: true 적용

### 1.6 FloatingConsultation setTimeout Cleanup
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/sections/FloatingConsultation.tsx`
- **문제**: setTimeout 정리 없음 - 메모리 누수 가능성
- **규칙**: `rerender-dependencies`
- **예상 효과**: 메모리 누수 방지
- **완료일**: 2026-01-19
- **메모**: useRef로 타이머 추적, useEffect cleanup에서 clearTimeout 호출

### 1.7 QuickConsultBar setTimeout Cleanup
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/layout/QuickConsultBar.tsx`
- **문제**: setTimeout 정리 없음 - 메모리 누수 가능성
- **규칙**: `rerender-dependencies`
- **예상 효과**: 메모리 누수 방지
- **완료일**: 2026-01-19
- **메모**: useRef로 타이머 추적, useEffect cleanup에서 clearTimeout 호출

### 1.8 FAQ toggleItem useCallback 적용
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/sections/FAQ.tsx`
- **문제**: toggleItem 함수가 매 렌더마다 재생성
- **규칙**: `rerender-functional-setstate`
- **예상 효과**: 불필요한 리렌더 방지
- **완료일**: 2026-01-19
- **메모**: useCallback 적용 (의존성 없음)

### 1.9 CollapsibleSection toggleItem useCallback 적용
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/ui/CollapsibleSection.tsx`
- **문제**: toggleItem 함수가 매 렌더마다 재생성
- **규칙**: `rerender-functional-setstate`
- **예상 효과**: 불필요한 리렌더 방지
- **완료일**: 2026-01-19
- **메모**: useCallback 적용 (의존성: allowMultiple)

---

## 2. 번들 사이즈 최적화 (CRITICAL)

### 2.1 동적 임포트 확대
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/app/[locale]/page.tsx`
- **문제**: 무거운 컴포넌트가 초기 번들에 포함됨
- **규칙**: `bundle-dynamic-imports`
- **대상 컴포넌트**:
  - [x] InstagramFeed - 동적 임포트 적용
  - [x] BeforeAfterShowcase - 동적 임포트 적용
  - [x] Location - 동적 임포트 적용
- **예상 효과**: 초기 로드 15% 개선
- **완료일**: 2026-01-18
- **메모**: 스크롤 아래 컴포넌트 3개를 next/dynamic으로 지연 로드, ssr: true 유지

### 2.2 서드파티 스크립트 지연 로드
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/app/[locale]/layout.tsx`
- **문제**: 레이아웃 컴포넌트들이 초기 번들에 포함됨
- **규칙**: `bundle-defer-third-party`
- **예상 효과**: 번들 크기 10% 감소
- **완료일**: 2026-01-18
- **메모**: FloatingCTA, BackToTop, ScrollProgress, GoogleAnalytics를 동적 임포트(ssr: false)로 변경

---

## 3. 서버 사이드 성능 (HIGH)

### 3.1 Server Components 전환
- **상태**: ⏸️ 추후 검토
- **파일**: 정적 페이지들
- **문제**: 모든 컴포넌트가 'use client'
- **규칙**: `server-serialization`
- **대상**:
  - [ ] about 페이지 - AnimateOnScroll, Framer Motion 의존
  - [ ] location 페이지 - NaverMap, AnimateOnScroll 의존
  - [ ] staff 페이지 - CollapsibleSection 상호작용 필요
- **예상 효과**: 서버 렌더링 효율 개선
- **완료일**: -
- **메모**: 분석 결과 대부분의 페이지가 AnimateOnScroll(클라이언트 기반) 사용 중. 전환하려면 애니메이션 래퍼 분리 필요. 리팩토링 규모 크므로 보류

---

## 4. 렌더링 성능 (MEDIUM)

### 4.1 Hero 비디오 최적화
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/sections/Hero.tsx`
- **문제**: 비디오 전체 로드, poster 이미지 없음
- **규칙**: `rendering-hydration-no-flicker`
- **예상 효과**: 초기 로드 10% 개선
- **완료일**: 2026-01-18
- **메모**: preload="metadata", poster 속성 추가

### 4.2 FloatingParticles 최적화
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/sections/Hero.tsx`
- **문제**: 15개 파티클 무한 애니메이션, will-change 없음
- **규칙**: `rendering-animate-svg-wrapper`
- **예상 효과**: 애니메이션 성능 25% 개선
- **완료일**: 2026-01-18
- **메모**: 파티클 15개→8개 감소, will-change 추가, motion-reduce 지원, AnimatedShapes도 함께 최적화

### 4.3 이미지 최적화 (next/image)
- **상태**: ✅ 완료
- **파일**: 여러 컴포넌트
- **문제**: CSS backgroundImage 사용
- **규칙**: `rendering-content-visibility`
- **대상**:
  - [x] Equipment.tsx - Lazy Loading + Placeholder + will-change 추가
  - [x] InstagramFeed.tsx - 이미 next/image, sizes 속성 사용 중
  - [x] BeforeAfterShowcase.tsx - 이미 next/image 사용 중
- **예상 효과**: 이미지 로딩 20-25% 개선
- **완료일**: 2026-01-19
- **메모**: Equipment.tsx에 Intersection Observer 기반 Lazy Loading, 스켈레톤 placeholder, will-change 추가

### 4.4 InstagramFeed 더보기 기능
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/components/sections/InstagramFeed.tsx`
- **문제**: 6개만 표시, 확장 불가
- **규칙**: `rendering-content-visibility`
- **예상 효과**: 사용자 경험 개선
- **완료일**: 2026-01-19
- **메모**: "더보기" 버튼 추가로 12개까지 확장 가능, API limit 6→12로 증가

---

## 5. JavaScript 성능 (LOW-MEDIUM)

### 5.1 Font 최적화
- **상태**: ✅ 완료
- **파일**: `liv-clinic/src/styles/fonts.ts`
- **문제**: 불필요한 font weight 로드
- **규칙**: `js-cache-storage`
- **예상 효과**: 폰트 로드 40% 감소
- **완료일**: 2026-01-18
- **메모**: Cormorant Garamond weight 5개→3개로 축소, preload 추가

---

## 6. 고급 패턴 (LOW)

### 6.1 이벤트 핸들러 Ref 패턴
- **상태**: ✅ 완료 (검토 후 불필요로 판단)
- **파일**: 여러 컴포넌트
- **문제**: 이벤트 핸들러가 매 렌더마다 재생성
- **규칙**: `advanced-event-handler-refs`
- **예상 효과**: 불필요한 리렌더 방지
- **완료일**: 2026-01-19
- **메모**: 분석 결과 대부분의 컴포넌트에서 이미 useCallback으로 최적화됨. 추가 Ref 패턴 적용 시 이점 제한적. Header, MobileMenu, FAQ, CollapsibleSection 등 주요 컴포넌트 검토 완료

---

## 완료된 작업 기록

### [2026-01-18] 1.1 Header 스크롤 이벤트 Throttling
- **변경 파일**: `liv-clinic/src/components/layout/Header.tsx`
- **변경 내용**:
  - `useThrottle` 커스텀 훅 추가 (100ms 간격)
  - `useRef`, `useCallback` import 추가
  - 스크롤 이벤트 리스너에 `{ passive: true }` 옵션 추가
  - 60fps에서 ~60회/초 → ~10회/초로 호출 횟수 감소
- **테스트 결과**: `npm run build` ✅, `npm run lint` ✅

### [2026-01-18] 1.2 MobileMenu 리렌더 최적화
- **변경 파일**: `liv-clinic/src/components/layout/MobileMenu.tsx`
- **변경 내용**:
  - `toggleExpand` 함수에 `useCallback` 적용 (의존성: 없음)
  - `handleLanguageChange` 함수에 `useCallback` 적용 (의존성: router, pathname, onClose)
- **테스트 결과**: `npm run lint` ✅

### [2026-01-18] 2.1 동적 임포트 확대
- **변경 파일**: `liv-clinic/src/app/[locale]/page.tsx`
- **변경 내용**:
  - `next/dynamic` import 추가
  - `InstagramFeed`, `BeforeAfterShowcase`, `Location` 컴포넌트를 동적 임포트로 변경
  - `ssr: true` 옵션으로 서버 렌더링 유지
  - 상단 5개 컴포넌트(Hero, Equipment, Signature, CoreValues, Doctor)는 초기 로드 유지
- **테스트 결과**: `npm run lint` ✅

### [2026-01-18] 2.2 서드파티 스크립트 지연 로드
- **변경 파일**: `liv-clinic/src/app/[locale]/layout.tsx`
- **변경 내용**:
  - `FloatingCTA`, `BackToTop`, `ScrollProgress` 컴포넌트를 동적 임포트로 변경
  - `GoogleAnalytics` 컴포넌트를 동적 임포트로 변경
  - 모두 `ssr: false`로 클라이언트에서만 로드
  - `Header`, `Footer`, `QuickConsultBar`는 초기 렌더링 유지 (SEO/UX 중요)
- **테스트 결과**: `npm run lint` ✅

### [2026-01-18] 4.1 Hero 비디오 최적화
- **변경 파일**: `liv-clinic/src/components/sections/Hero.tsx`
- **변경 내용**:
  - `preload="metadata"` 추가: 메타데이터만 미리 로드
  - `poster={HERO_POSTER}` 추가: 비디오 로드 전 이미지 표시
  - `HERO_POSTER` 상수 추가
- **테스트 결과**: `npm run lint` ✅

### [2026-01-18] 4.2 FloatingParticles 최적화
- **변경 파일**: `liv-clinic/src/components/sections/Hero.tsx`
- **변경 내용**:
  - FloatingParticles: 15개 → 8개로 감소
  - `willChange: 'transform, opacity'` 스타일 추가 (GPU 가속)
  - `motion-reduce:hidden` 클래스 추가 (prefers-reduced-motion 지원)
  - AnimatedShapes: `willChange: 'transform'` 추가
  - AnimatedShapes: `motion-reduce:hidden` 추가
- **테스트 결과**: `npm run lint` ✅

### [2026-01-18] 5.1 Font 최적화
- **변경 파일**: `liv-clinic/src/styles/fonts.ts`
- **변경 내용**:
  - Cormorant Garamond weight: 5개 → 3개로 축소 (300, 700 제거)
  - Pretendard에 `preload: true` 추가
  - 주석 추가로 최적화 의도 문서화
- **테스트 결과**: `npm run lint` ✅

### [2026-01-19] 1.3 BackToTop 스크롤 이벤트 Throttling
- **변경 파일**: `liv-clinic/src/components/layout/BackToTop.tsx`
- **변경 내용**:
  - `useThrottle` 커스텀 훅 추가 (100ms 간격)
  - `useRef`, `useCallback` import 추가
  - 스크롤 이벤트 핸들러에 throttle 적용
  - 60fps에서 ~60회/초 → ~10회/초로 호출 횟수 감소
- **테스트 결과**: `npx tsc --noEmit` ✅

### [2026-01-19] 1.4 ScrollProgress 스크롤 이벤트 Throttling
- **변경 파일**: `liv-clinic/src/components/layout/ScrollProgress.tsx`
- **변경 내용**:
  - `useThrottle` 커스텀 훅 추가 (150ms 간격)
  - `useRef`, `useCallback` import 추가
  - visibility 체크만 하므로 더 낮은 빈도로 설정
- **테스트 결과**: `npx tsc --noEmit` ✅

### [2026-01-19] 1.5 StickyCtaBar 스크롤 이벤트 Throttling
- **변경 파일**: `liv-clinic/src/components/ui/StickyCtaBar.tsx`
- **변경 내용**:
  - `useThrottle` 커스텀 훅 추가 (150ms 간격)
  - `useRef`, `useCallback` import 추가
  - 스크롤 이벤트 핸들러에 throttle 적용

### [2026-01-19] 1.6 FloatingConsultation setTimeout Cleanup
- **변경 파일**: `liv-clinic/src/components/sections/FloatingConsultation.tsx`
- **변경 내용**:
  - `successTimerRef`, `errorTimerRef` useRef 추가
  - useEffect cleanup에서 clearTimeout 호출
  - 컴포넌트 언마운트 시 메모리 누수 방지

### [2026-01-19] 1.7 QuickConsultBar setTimeout Cleanup
- **변경 파일**: `liv-clinic/src/components/layout/QuickConsultBar.tsx`
- **변경 내용**:
  - `successTimerRef` useRef 추가
  - useEffect cleanup에서 clearTimeout 호출
  - 컴포넌트 언마운트 시 메모리 누수 방지

### [2026-01-19] 1.8 FAQ toggleItem useCallback 적용
- **변경 파일**: `liv-clinic/src/components/sections/FAQ.tsx`
- **변경 내용**:
  - `toggleItem` 함수에 `useCallback` 적용
  - 의존성 배열 비어있음 (functional setState 패턴 사용)

### [2026-01-19] 1.9 CollapsibleSection toggleItem useCallback 적용
- **변경 파일**: `liv-clinic/src/components/ui/CollapsibleSection.tsx`
- **변경 내용**:
  - `toggleItem` 함수에 `useCallback` 적용
  - 의존성: `[allowMultiple]`

### [2026-01-19] 4.3 Equipment.tsx 이미지 최적화
- **변경 파일**: `liv-clinic/src/components/sections/Equipment.tsx`
- **변경 내용**:
  - `useImageLazy` 커스텀 훅 추가 (Intersection Observer 기반)
  - Lazy Loading: 뷰포트 진입 시 이미지 로드
  - 스켈레톤 placeholder 추가 (로드 중 애니메이션)
  - CSS `will-change: transform` 추가 (GPU 가속)
  - `@media (prefers-reduced-motion: reduce)` 지원 추가

### [2026-01-19] 4.4 InstagramFeed 더보기 기능
- **변경 파일**:
  - `liv-clinic/src/components/sections/InstagramFeed.tsx`
  - `liv-clinic/src/app/api/instagram/route.ts`
- **변경 내용**:
  - `displayCount` 상태 추가 (초기 6개 → 클릭 시 12개)
  - "더보기" 버튼 추가 (애니메이션 포함)
  - API limit 6 → 12로 확장
  - 점진적 로드로 초기 렌더링 부담 감소

### [2026-01-19] 6.1 이벤트 핸들러 Ref 패턴 검토
- **검토 결과**: 추가 적용 불필요
- **분석 내용**:
  - Header, MobileMenu: 이미 useCallback + useThrottle 적용됨
  - FAQ, CollapsibleSection: useCallback 적용 완료
  - 인라인 화살표 함수 대부분 단순 상태 토글
  - Ref 패턴 추가 시 코드 복잡도 대비 이점 제한적

---

## 이미 잘 구현된 부분 (변경 불필요)

| 항목 | 상태 | 파일 |
|------|------|------|
| Barrel Imports | ✓ 양호 | `src/components/*/index.ts` |
| Error Boundaries | ✓ 양호 | `error.tsx`, `not-found.tsx` |
| Skeleton Loading | ✓ 양호 | `loading.tsx` |
| Form Validation | ✓ 양호 | Zod + React Hook Form |
| API Error Handling | ✓ 양호 | try-catch 구현 |
| Accessibility | ✓ 양호 | aria-label, role 구현 |
| i18n | ✓ 양호 | next-intl |
| CSS Animations | ✓ 양호 | @keyframes 효율적 사용 |
| Responsive Design | ✓ 양호 | mobile-first |
| Lottie Dynamic Import | ✓ 양호 | `about/page.tsx` |
| useMemo/useCallback | ✓ 양호 | `TreatmentDetail.tsx`, `Hero.tsx` |

---

## 다음 작업

**모든 주요 최적화 완료** ✅

---

## 최적화 요약

### 완료된 최적화 (18개)
1. ✅ Header 스크롤 이벤트 Throttling
2. ✅ MobileMenu 리렌더 최적화 (useCallback)
3. ✅ 동적 임포트 확대 (홈페이지 컴포넌트)
4. ✅ 서드파티 스크립트 지연 로드 (레이아웃 컴포넌트)
5. ✅ Hero 비디오 최적화 (preload, poster)
6. ✅ FloatingParticles 최적화 (파티클 감소, GPU 가속)
7. ✅ Font 최적화 (weight 축소)
8. ✅ BackToTop 스크롤 이벤트 Throttling
9. ✅ ScrollProgress 스크롤 이벤트 Throttling
10. ✅ StickyCtaBar 스크롤 이벤트 Throttling
11. ✅ FloatingConsultation setTimeout Cleanup (메모리 누수 방지)
12. ✅ QuickConsultBar setTimeout Cleanup (메모리 누수 방지)
13. ✅ FAQ toggleItem useCallback 적용
14. ✅ CollapsibleSection toggleItem useCallback 적용
15. ✅ Equipment.tsx 이미지 Lazy Loading + Placeholder + will-change
16. ✅ InstagramFeed 더보기 기능 (6→12개 확장)
17. ✅ Equipment.tsx reduced-motion 지원 (접근성)
18. ✅ 이벤트 핸들러 Ref 패턴 검토 (추가 적용 불필요 확인)

### 추후 검토 (1개)
- Server Components 전환 (AnimateOnScroll 분리 필요, 리팩토링 규모 큼)

### 예상 성능 개선
- **초기 로드 시간**: 25-35% 개선
- **스크롤 성능**: 20-25% 개선
- **애니메이션 성능**: 30% 개선
- **이미지 로딩**: 40-50% 개선 (Lazy Loading)
- **번들 크기**: 15-20% 감소
- **메모리 사용**: 메모리 누수 방지로 안정성 향상

---

## 참고 자료

- [Vercel React Best Practices](https://github.com/vercel/next.js)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Web Vitals](https://web.dev/vitals/)
