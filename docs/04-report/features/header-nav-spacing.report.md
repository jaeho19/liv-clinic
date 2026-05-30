# Completion Report: 상단 헤더 네비게이션 간격 개선 (header-nav-spacing)

> **Feature**: header-nav-spacing
> **완료일**: 2026-05-30
> **Phase**: Completed
> **Match Rate**: 98%
> **사이클**: Plan → Design → Do → Check → Report (반복 0회, 1회 통과)

## 1. Executive Summary

### 1.1 개요
LIV 홈페이지 PC 상단 네비게이션의 좁은 메뉴 간격을 `xl`(1280px)+ 위주로 여유 있게 개선. 로고와 첫 메뉴, '이벤트'와 '상담예약'이 거의 붙어있던 문제를 해결하면서 헤더 높이·폰트·색상·반응형은 그대로 유지.

### 1.2 접근
- **Option A 최소 변경**: Tailwind 간격 클래스만 `xl:`/`2xl:` prefix로 수정 (git diff 5줄)
- **overflow 안전 설계**: 모든 변경을 `xl:`/`2xl:`로 한정해 `lg`(1024~1280px) 가로 합 불변 → 9개 메뉴 회귀 차단
- **런타임 검증 주도**: Playwright 다중 폭 정밀 측정으로 간격 수치·클리핑·줄바꿈을 실측

### 1.3 Value Delivered

| 관점 | 계획 | 실제 결과 (실측) |
|------|------|------------------|
| **Problem** | 로고↔소개·이벤트↔상담 붙어 보임 | logo→nav 0~2px → **16~32px**, event→consult 0~2px → **8~12px** |
| **Solution** | xl+ 간격 중간 강도 확대 | nav gap +4~6px, 로고/우측/상담 명시 여백 적용 |
| **Function/UX** | 여유롭고 고급스러운 네비 | 메뉴 분리 + 헤더 높이 80px·폰트·색상 불변 |
| **Core Value** | 레이아웃 깨짐 없는 프리미엄 인상 | 1280~1920px 클리핑/줄바꿈 0, 태블릿/모바일 무손상 |

## 2. 변경 내역

**파일**: `liv-clinic/src/components/layout/Header.tsx` (5줄 변경)

```diff
- nav:  gap-5 xl:gap-6 2xl:gap-8 (스크롤 gap-4 xl:gap-5 2xl:gap-6)
+ nav:  gap-5 xl:gap-7 2xl:gap-9 + xl:ms-4 2xl:ms-8 (스크롤 gap-4 xl:gap-6 2xl:gap-7)
- 우측: gap-2 md:gap-3 xl:gap-4
+ 우측: gap-2 md:gap-3 xl:gap-5
- 상담: btn-primary ...
+ 상담: btn-primary ... xl:ms-2 2xl:ms-3
```

## 3. Key Decisions & Outcomes

| 결정 | 출처 | 준수 | 결과 |
|------|------|:--:|------|
| Option A 최소 변경 | Plan | ✅ | 5줄 surgical, 추상화 없음 — 유지보수 부담 0 |
| `xl:`/`2xl:` 한정 변경 | Design | ✅ | lg 회귀 0, 1024px 영향 없음 |
| 버튼 크기·톤 유지 | Plan/Design | ✅ | 버튼 패딩·색상 미변경 |
| LanguageSwitcher 조건부 무변경 | Design §3.4 | ✅ | consult→lang 68→76px로 충분, 추가 변경 불필요 |

## 4. Success Criteria 최종 상태

| SC | 기준 | 상태 | 증거 |
|----|------|:--:|------|
| SC-1 | 메뉴 안 붙음 | ✅ | 1440px 16/8px |
| SC-2 | 로고↔소개 여백 | ✅ | 2→16~32px |
| SC-3 | 이벤트↔상담 여백 | ✅ | 2→8~12px |
| SC-4 | KR↔상담 분리 | ✅ | 68→76px |
| SC-5 | 1280px 한 줄 | ✅ | h=80, 클리핑 없음 |
| SC-6 | 태블릿/모바일 무손상 | ✅ | 햄버거 유지 |
| SC-7 | 높이·폰트·색상 불변 | ✅ | diff 검증 |
| SC-8 | build 0 error | ✅ | EXIT 0 |

**Success Rate: 8/8 (100%)**

## 5. Lessons Learned

- **측정 박스 함정**: 초기 `scrollWidth vs clientWidth(capped container)` 비교가 false-positive overflow를 냈음. 실제 실패 모드(`langSwitcher.right > viewport`, 행 높이 줄바꿈)를 직접 측정해야 정확. → 향후 헤더 overflow 검증은 요소 경계(getBoundingClientRect) 기준으로.
- **팝업 오염**: 첫방문 팝업(z-[9999])이 스크린샷을 가림. 측정 스크립트에서 오버레이 제거 후 캡처 필요.
- **기존 버그 발견**: 1024px에서 언어 스위처가 이미 클리핑됨(G-1). 본 작업과 무관하나 별도 처리 권장.

## 6. Carry Items (후속)

| 항목 | 우선순위 | 비고 |
|------|:--:|------|
| G-1: 1024px 언어 스위처 클리핑 수정 | Important | 사전 존재 버그. lg 구간 nav gap 축소 또는 compact-nav 확장 검토 |
| G-2: 1280px 우측 여유 보강(선택) | Minor | 현재 21px, 기능상 문제 없음 |

## 7. 검증 산출물

- 측정 스크립트: `headernav-measure.py`
- Before/After 스크린샷: `hn-baseline-*.png`, `hn-after-*.png` (1920/1440/1280/1024/768/375)
- 빌드 로그: `liv-clinic/build-headernav.log` (EXIT 0)

---
*PDCA 1회 통과 (반복 0). Match Rate 98%. report → archive 가능.*
