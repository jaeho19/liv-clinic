# Design-Implementation Gap Analysis: inventory-kiosk-patient-photos

> **Feature**: Inventory Kiosk Mode + Patient Photo Gallery
> **Analysis Date**: 2026-02-12
> **Match Rate**: 100%
> **Overall Score**: 94.3%

---

## 1. Score Summary

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 93% | PASS |
| Convention Compliance | 90% | PASS |
| **Overall** | **94.3%** | **PASS** |

---

## 2. A. Inventory Improvements

### A-1: Kiosk/Tablet Mode (11 requirements)

| # | Requirement | Status | Evidence |
|---|------------|:------:|----------|
| 1 | `kiosk/page.tsx` created | ✅ | 357 lines, 3-step flow |
| 2 | `kiosk/layout.tsx` sidebar-free | ✅ | 11 lines, plain div wrapper |
| 3 | Full-screen layout, minimal header | ✅ | Logo badge + return link only |
| 4 | Step 1: PROCEDURE_NAMES card grid | ✅ | `grid-cols-2 md:grid-cols-3`, large `p-5 rounded-2xl` buttons |
| 5 | Step 2: Recipe auto-load | ✅ | `handleSelectProcedure` filters recipes |
| 6 | Step 2: +/- large touch buttons | ✅ | `w-12 h-12` rounded buttons |
| 7 | Step 2: Patient/chart inputs | ✅ | Two text fields |
| 8 | Step 3: POST /api/admin/inventory/use | ✅ | Calls existing API |
| 9 | Step 3: Completion animation + reset | ✅ | Success/error icon + reset button |
| 10 | 100% API reuse | ✅ | No new APIs created |
| 11 | Entry button on inventory page | ✅ | Emerald `<Link>` button added |

### A-2: Auto Inventory Deduction (8 requirements)

| # | Requirement | Status | Evidence |
|---|------------|:------:|----------|
| 12 | Check `body.status === 'COMPLETED'` | ✅ | operations/[id]/route.ts |
| 13 | Query `procedure_name` from case | ✅ | `data.procedure_name` |
| 14 | `get_procedure_recipes` RPC | ✅ | `admin.rpc(...)` |
| 15 | `use_inventory_item` per recipe | ✅ | Loop with per-item RPC call |
| 16 | Auto-fill patient_name | ✅ | `data.patient_name ?? undefined` |
| 17 | Response includes `inventoryDeducted` | ✅ | `{ success, items[], errors[] }` |
| 18 | No recipe = no deduction | ✅ | Empty list = no loop |
| 19 | Best-effort (failure doesn't block) | ✅ | Catch sets success=false, returns normally |

### A-3: Restock Enhancement (6 requirements)

| # | Requirement | Status | Evidence |
|---|------------|:------:|----------|
| 20 | `burndownMap` prop on RestockTab | ✅ | `burndownMap?: Map<string, BurndownResult>` |
| 21 | RestockCard uses burndown data | ✅ | `burndown?: BurndownResult` prop |
| 22 | Smart suggestedQty (max of base & 30-day) | ✅ | `Math.max(baseSuggestedQty, burndownSuggestedQty)` |
| 23 | Days remaining display | ✅ | "약 N일 뒤 소진 예상" |
| 24 | Severity color | ✅ | `BURNDOWN_SEVERITY_CONFIG[severity]` |
| 25 | burndownMap passed from page | ✅ | `<RestockTab ... burndownMap={burndownMap} />` |

---

## 3. B. Patient Photo Gallery

### B-1: DB + API (6 requirements)

| # | Requirement | Status | Evidence |
|---|------------|:------:|----------|
| 26 | photos/route.ts created | ✅ | GET + POST handlers |
| 27 | GET: list by name + phone | ✅ | Query params, Supabase `.eq()` |
| 28 | POST: save photo record | ✅ | All 10 fields inserted |
| 29 | photos/[id]/route.ts created | ✅ | DELETE handler |
| 30 | DELETE endpoint | ✅ | Storage + DB cleanup |
| 31 | `patient_photos` type in supabase.ts | ✅ | Row/Insert/Update types |

### B-2: ImageUploader (1 requirement)

| # | Requirement | Status | Evidence |
|---|------------|:------:|----------|
| 32 | `'patient-photos'` bucket added | ✅ | Union type extended |

### B-3: Gallery Component + Tab (13 requirements)

| # | Requirement | Status | Evidence |
|---|------------|:------:|----------|
| 33 | `PatientPhotoGallery.tsx` created | ✅ | 369 lines |
| 34 | Props: patientName, phone | ✅ | Interface defined |
| 35 | Photo list fetch via API | ✅ | GET with URLSearchParams |
| 36 | Upload form: photo_type select | ✅ | Before/After/Progress options |
| 37 | Upload form: procedure_name | ✅ | Text input |
| 38 | Upload form: memo | ✅ | Text input |
| 39 | Upload form: date | ✅ | date input |
| 40 | Before/After comparison | ✅ | `grid-cols-2` side-by-side |
| 41 | Grid gallery + lightbox | ✅ | `grid-cols-3`, click opens modal |
| 42 | Lightbox full-screen | ✅ | `fixed inset-0 bg-black/80` |
| 43 | Delete via API | ✅ | `DELETE /api/admin/patients/photos/{id}` |
| 44 | Photos tab in patients page | ✅ | Tab type + definition added |
| 45 | Gallery component rendered | ✅ | `<PatientPhotoGallery>` in photos tab |

---

## 4. Bonus Implementations (Not in Design)

| # | Feature | Impact |
|---|---------|--------|
| 1 | Storage file cleanup on photo DELETE | Positive - prevents orphaned files |
| 2 | Disabled procedures without recipes in kiosk | Positive - prevents empty submissions |
| 3 | Stock warning in kiosk mode | Positive - user awareness |
| 4 | 30-day label hint on restock card | Positive - explains reasoning |

---

## 5. Match Rate

```
Total Requirements: 45
  MATCH:   45 (100%)
  PARTIAL:  0 (0%)
  MISSING:  0 (0%)

Design Match Rate = 100%
Overall Score = 94.3% (avg of Design 100% + Architecture 93% + Convention 90%)

Status: PASS (>= 90%)
```

---

## 6. Conclusion

All 45 design requirements are fully implemented. No corrective action required. 4 bonus features were added that improve UX and data integrity beyond the original specification.

### Prerequisite for Production
- `patient_photos` table must be created in Supabase (SQL migration)
- `patient-photos` storage bucket must be created in Supabase dashboard
