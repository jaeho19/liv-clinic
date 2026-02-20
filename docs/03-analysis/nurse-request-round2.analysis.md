# Gap Analysis: nurse-request-round2

> **Match Rate: 100%**
> **Date**: 2026-02-20
> **Design Doc**: `docs/02-design/features/nurse-request-round2.design.md`

## Overview

간호팀 2차 수정요청 — 예상소진 UI/로직 완전 삭제 + 마데카MD 수량 정정 + 긴급소진 UX 개선

## Per-File Results (11 files)

| # | File | Items | Match | Status |
|---|------|-------|-------|--------|
| 1 | `src/lib/inventory-utils.ts` | 4/4 | 100% | PASS |
| 2 | `src/hooks/useInventoryData.ts` | 8/8 | 100% | PASS |
| 3 | `burndown/route.ts` (deleted) | 1/1 | 100% | PASS |
| 4 | `StockCardView.tsx` | 7/7 | 100% | PASS |
| 5 | `StockTableView.tsx` | 7/7 | 100% | PASS |
| 6 | `CategoryDetailSection.tsx` | 5/5 | 100% | PASS |
| 7 | `RestockTab.tsx` | 11/11 | 100% | PASS |
| 8 | `DashboardStatsCards.tsx` | 2/2 | 100% | PASS |
| 9 | `StockDashboard.tsx` | 4/4 | 100% | PASS |
| 10 | `overview/page.tsx` | 4/4 | 100% | PASS |
| 11 | `022_madeca_stock_correction.sql` | 3/3 | 100% | PASS |

**Total: 56/56 items match**

## Completion Criteria (Design Section 6)

| Criterion | Status |
|-----------|--------|
| `npm run build` passes | PASS |
| No burndown UI elements remain | PASS |
| `calculateBurndown` completely deleted | PASS |
| `/api/admin/inventory/burndown` endpoint deleted | PASS |
| burndownMap prop chain completely removed | PASS |
| Madeca MD correction SQL created | PASS |
| 긴급소진 click = filter only (no tab switch) | PASS |
| "오늘 N개 사용" display still works | PASS |
| Stock overview page renders normally | PASS |

**9/9 criteria met**

## Positive Deviations

- Migration SQL uses exact matching (`WHERE name = '...' AND volume_cc = N AND category = 'cosmetics'`) instead of design's `LIKE '%마데카%200%'` — more precise and safer.

## Gaps Found

None.

## Conclusion

100% match rate. All 11 files conform to design. All burndown references removed from codebase. Ready for report phase.
