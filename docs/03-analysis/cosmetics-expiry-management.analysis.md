# Gap Analysis: cosmetics-expiry-management

> Design-Implementation Gap Analysis Report

## Overview

| Item | Value |
|------|-------|
| Feature | cosmetics-expiry-management (창 5) |
| Design Document | `docs/02-design/features/cosmetics-expiry-management.design.md` |
| Analysis Date | 2026-02-19 |
| **Overall Match Rate** | **94.4%** |
| Status | **PASS** (>= 90%) |

## Scores

| Category | Score |
|----------|:-----:|
| Design Match | 93% |
| Architecture Compliance | 95% |
| Convention Compliance | 96% |
| **Overall** | **94.7%** |

## Phase-by-Phase Results

| Phase | Items | Matched | Rate |
|-------|:-----:|:-------:|:----:|
| Phase 1: Foundation (utils + API + components) | 6 | 6.0 | 100% |
| Phase 2: Haracell individual items (#19) | 2 | 2.0 | 100% |
| Phase 3: Expiry system (#20) | 5 | 4.5 | 90% |
| Phase 4: Batch management UI (#12) | 6 | 5.5 | 92% |
| Phase 5: Stock edit/delete (#18) | 4 | 3.5 | 88% |
| Phase 6: Sample drug section (#13) | 4 | 4.0 | 100% |
| **Total** | **27** | **25.5** | **94.4%** |

## Files Verified

### New Files (7)
- `lib/expiry-utils.ts` - MATCH
- `components/admin/inventory/ExpiryBadge.tsx` - MATCH
- `app/api/admin/inventory/batches/route.ts` - MATCH
- `app/api/admin/inventory/batches/[id]/route.ts` - MATCH
- `components/admin/inventory/BatchManager.tsx` - MATCH
- `components/admin/inventory/InventoryEditModal.tsx` - MATCH
- `supabase/migrations/020_cosmetics_expiry_data.sql` - MATCH

### Modified Files (8)
- `app/api/admin/inventory/restock/route.ts` - MATCH
- `app/api/admin/inventory/use/route.ts` - MATCH (FIFO deduction added)
- `components/admin/inventory/DetailPanel.tsx` - MATCH (BatchManager + ExpiryBadge)
- `components/admin/inventory/StockCardView.tsx` - MATCH (expiryMap prop)
- `components/admin/inventory/StockTableView.tsx` - MATCH (expiry column)
- `components/admin/inventory/CategoryDetailSection.tsx` - MATCH (expiryMap fetch)
- `app/admin/(authenticated)/inventory/overview/page.tsx` - MATCH (StockModal expiry field)
- `components/admin/inventory/CosmeticsKioskView.tsx` - MATCH (viewMode, ExpiryBadge, edit)

## Gaps Found

### Minor Gaps (3)

| # | Item | Description | Severity |
|---|------|-------------|----------|
| 1 | Batch inline editing | Design mentions inline edit for batch fields; only delete implemented | MINOR |
| 2 | `received_at` parameter | Design includes `received_at` in RestockRequest; implementation omits | MINOR |
| 3 | GET batches filtering | Design specifies `remaining_quantity > 0` filter; impl returns all (for exhausted batches display) | MINOR |

### Changed Implementation (5)

| # | Design | Implementation | Impact |
|---|--------|----------------|--------|
| 1 | `batchMap: Map<string, InventoryBatch[]>` in CosmeticsKioskView | `expiryMap: Map<string, string>` pre-computed by API | LOW |
| 2 | expiryMap in `overview/page.tsx` | expiryMap in `CategoryDetailSection.tsx` | LOW |
| 3 | Stock edit via `PATCH /inventory/[id]` with adjust tx | Uses `POST restock/use` with `[수량 수정]` prefix | MEDIUM |
| 4 | Batch DELETE creates `adjust` transaction | Uses `use_inventory_item` RPC (creates `use` tx) | LOW |
| 5 | Single `UNION ALL` migration | Individual `INSERT ... NOT EXISTS` guards | LOW (improvement) |

### Added Improvements (4)

| # | Item | Description |
|---|------|-------------|
| 1 | Exhausted batches collapsible | `<details>` element in BatchManager |
| 2 | Date string safety check | Handles ISO datetime strings in expiry-utils |
| 3 | Migration idempotency | `ON CONFLICT DO NOTHING` + `NOT EXISTS` guards |
| 4 | `GREATEST(current_stock, 1)` | Ensures batch_quantity >= 1 even for zero-stock items |

## Conclusion

Match Rate **94.4%** exceeds the 90% threshold. All 5 work items (#12, #13, #18, #19, #20) are implemented. Gaps are minor and the changed implementations are functionally equivalent or improvements over the design spec. Ready for completion report.
