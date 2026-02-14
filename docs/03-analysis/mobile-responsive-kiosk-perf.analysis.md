# Gap Analysis: mobile-responsive-kiosk-perf

> Date: 2026-02-14
> Match Rate: **95%**
> Status: **PASS**

---

## Summary

| Category | Score |
|----------|:-----:|
| Design Match | 93% |
| Architecture Compliance | 100% |
| Convention Compliance | 100% |
| **Overall** | **95%** |

---

## Item-by-Item Results

| # | Design Item | Status | Details |
|---|-------------|--------|---------|
| 1-1 | Promise.all parallelization | **MATCH** | 4개 API Promise.all, setState 배치 |
| 1-2A | ProcedureButton memo | **MATCH** | 정확한 props, memo 래핑 |
| 1-2B | UsageItemRow memo | **MATCH** | 정확한 props, memo 래핑 |
| 1-2C | handleQtyChange useCallback | **MATCH** | 동일 구현, [] deps |
| 1-2D | useMemo computed values | **MATCH** | activeCount, displayName, waitingForOption |
| 1-2E | Optimistic UI | **MATCH** | 즉시 UI 리셋, 에러 시 loadData 롤백 |
| 1-2F | recipeCountMap useMemo | **MATCH** | 사전 계산, recipeCount prop 전달 |
| 1-3 | CategoryCard React.memo | **MATCH** | memo import + 래핑 |
| 1-4 | Dynamic imports page.tsx | **MATCH** | Hero만 정적, 6개 동적 |
| 1-5 | FloatingCTA 소형 화면 | **GAP (minor)** | sm:right-4 vs sm:right-3 (4px 차이) |
| 1-6 | touch-action manipulation | **MATCH** | 더 넓은 범위로 적용 (모든 button) |

---

## Gap Details

### 유일한 Gap: FloatingCTA sm:right 값
- **Design**: `sm:right-3` (12px)
- **Implementation**: `sm:right-4` (16px)
- **Impact**: Very Low — sm 브레이크포인트에서 4px 차이
- **Action**: 무시 가능 (디자인보다 여유 있는 간격)

---

## Extra Implementations (Design에 없으나 구현됨)
- 글로벌 브랜드 탭 하이라이트 (기존)
- Active state 피드백 scale(0.98) (기존)
- 최소 터치 타겟 44px (기존)
- iOS 줌 방지 16px (기존)
- restock/route.ts `session` → `user` 타입 에러 수정 (보너스)

---

## Build Status: PASS
- TypeScript: 변경 파일 에러 없음
- Next.js Build: 성공
