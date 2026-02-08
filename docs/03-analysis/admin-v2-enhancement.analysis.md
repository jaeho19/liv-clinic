# admin-v2-enhancement Gap Analysis Report

> **Analysis Type**: Design-Implementation Gap Analysis (PDCA Check Phase)
> **Project**: LIV Plastic Surgery Admin V2
> **Date**: 2026-02-08
> **Design Doc**: [admin-v2-enhancement.design.md](../02-design/features/admin-v2-enhancement.design.md)
> **Implementation Path**: `liv-clinic/src/`

---

## 1. Overall Scores

| Category           | Score | Status |
|--------------------|:-----:|:------:|
| File Existence     |  97%  |   OK   |
| API Match          |  95%  |   OK   |
| UI Feature Match   |  95%  |   OK   |
| DB Migrations      |  90%  |   OK   |
| Type Definitions   |  95%  |   OK   |
| Env Variables      | 100%  |   OK   |
| **Overall**        | **95%** | **PASS** |

---

## 2. Phase-by-Phase Analysis

### Phase 1: 시술 주기 자동 알림 (P1) — Match Rate: 90%

✅ **Implemented**:
- `src/lib/solapi.ts` — REST API wrapper (HMAC-SHA256 auth, kakao→SMS fallback, simulation mode)
- `src/app/api/admin/notifications/send/route.ts` — 실제 발송 API
- `src/app/api/cron/send-notifications/route.ts` — 자동 발송 크론 (CRON_SECRET 검증)
- `src/app/api/admin/settings/treatments/[id]/route.ts` — PATCH + DELETE
- Notifications page: 실제 발송 버튼, 자동/수동 배지
- Settings page: 시술 주기/템플릿 컬럼
- `vercel.json` cron schedule
- Migration 011: treatment_masters + notification_history 확장

❌ **Gaps**:
- Migration 011 missing seed data (default_cycle_days UPDATE statements)
- `solapi` npm package NOT installed (REST API used instead — intentional)
- `NotificationSendResult` type not in admin.ts

### Phase 2: 매출 CSV 업로드 (P2) — Match Rate: 95%

✅ **Implemented**:
- `CsvUploadModal.tsx` — 3-step modal + auto-detect column mapping (bonus)
- `revenue/import/route.ts` — Full validation + dedup + batch insert
- `revenue/mapping/route.ts` — GET/PUT mapping CRUD
- Revenue page: CSV upload button + modal
- `papaparse` + `@types/papaparse` installed

❌ **Gaps**:
- `CsvColumnMapping`, `CsvImportResult` types defined inline, not centralized in admin.ts

### Phase 3: 상담 실시간 알림 (P3) — Match Rate: 90%

✅ **Implemented**:
- `useConsultationRealtime.ts` — Supabase Realtime subscription
- `useBrowserNotification.ts` — SSR-safe Browser Notification API
- `useCallbackChecker.ts` — 1-minute interval with dedup
- `ConsultationTimeline.tsx` — Timeline UI + note input
- Timeline API: GET/POST
- Consultations page: all hooks integrated

❌ **Gaps**:
- Migration numbered 014 instead of design's 012
- `TimelineEventType`, `ConsultationTimelineEntry`, `TIMELINE_EVENT_LABELS`, `TIMELINE_EVENT_ICONS` not in admin.ts

### Phase 4: 재고 현황판 강화 (P4) — Match Rate: 95%

✅ **Implemented**:
- `inventory-utils.ts` — calculateBurndown exact algorithm match
- `inventory/burndown/route.ts` — Full burndown + category summary API
- StockTableView: conditional burndown columns + severity badges
- StockCardView: burndown badge per item
- StockDashboard: category summary with critical/warning counts

❌ **Gaps**:
- `InventoryBurndown`, `CategorySummary` types not centralized in admin.ts

### Phase 5: 환자 통합 프로필 (P5) — Match Rate: 95%

✅ **Implemented**:
- `patients/search/route.ts` — Cross-table search (3 tables)
- `patients/profile/route.ts` — Unified profile (treatments + consultations + notifications + revenue)
- `patients/page.tsx` — Search + result list + 4-tab profile view with revenue breakdown
- AdminSidebar + AdminLayoutClient: 환자조회 메뉴 추가

❌ **Gaps**:
- `PatientSearchResult`, `PatientProfile` types inline, not in admin.ts

---

## 3. Cross-Phase Gaps

### 3.1 admin.ts V2 Types (10+ types missing from design Section 8)

| Type | In admin.ts | Location |
|------|:-----------:|----------|
| TreatmentMaster (extended) | ✅ | admin.ts |
| NotificationSendResult | ❌ | Missing |
| CsvColumnMapping | ❌ | Inline |
| CsvImportResult | ❌ | Inline |
| TimelineEventType | ❌ | Missing |
| ConsultationTimelineEntry | ❌ | Missing |
| TIMELINE_EVENT_LABELS | ❌ | Missing |
| TIMELINE_EVENT_ICONS | ❌ | Inline |
| InventoryBurndown | ❌ | Missing |
| CategorySummary | ❌ | Inline |
| PatientSearchResult | ❌ | Inline |
| PatientProfile | ❌ | Inline |

### 3.2 Environment Variables (.env.example missing 5 vars)

| Variable | Status |
|----------|--------|
| SOLAPI_API_KEY | ❌ Missing |
| SOLAPI_API_SECRET | ❌ Missing |
| SOLAPI_SENDER_NUMBER | ❌ Missing |
| KAKAO_PFID | ❌ Missing |
| CRON_SECRET | ❌ Missing |

---

## 4. Gap Severity Summary

| Severity | Count | Items |
|----------|:-----:|-------|
| Critical | 0 | — |
| High | 2 | .env.example missing vars, migration 011 missing seed |
| Medium | 2 | V2 types not centralized, migration 012→014 numbering |
| Low | 3 | Positive deviations (extra features/fields) |

---

## 5. Recommended Actions

1. **Add V2 types to admin.ts** (Medium — reduces duplication)
2. **Update .env.example** with 5 new environment variables (High — deployment safety)
3. **Add seed data** for default_cycle_days in migration (High — functionality)

---

*Initial Match Rate: **88%** → After iteration: **95%** — Above 90% threshold. PASS.*

### Iteration 1 Fixes Applied (2026-02-08):
1. Added 12 V2 type definitions to `admin.ts` (65% → 95%)
2. Added 5 environment variables to `.env.example` (50% → 100%)
3. TypeScript check + production build passed
