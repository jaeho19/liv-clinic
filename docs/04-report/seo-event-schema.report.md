# PDCA Completion Report: seo-event-schema

> **Type**: Lightweight PDCA (Do → Check → Report only — no formal Plan/Design)
> **Trigger**: External finding — Google Search Console structured-data warnings
> **Verdict**: ✅ Completed (Match Rate 95%)

## Metadata

| Item | Value |
|------|-------|
| **Feature** | seo-event-schema |
| **Started** | 2026-05-12 |
| **Completed** | 2026-05-12 |
| **Duration** | Single session (~30 min) |
| **PDCA Path** | Do → Check → Report (Plan/Design skipped — surgical bug fix) |
| **Match Rate** | 95% (target ≥ 90%) ✅ |
| **Iterations** | 0 |
| **Files Changed** | 1 (`liv-clinic/src/app/[locale]/events/layout.tsx`) |
| **LOC Delta** | +21 / −5 |

---

## 1. Background & Problem Statement

Google Search Console reported two structured-data warnings on the events index page:

- **Missing field "offers"** — 2 affected Event items
- **Missing field "performer"** — 2 affected Event items

These are required fields per [Google's Event Rich Results requirements](https://developers.google.com/search/docs/appearance/structured-data/event). Without them, the events are ineligible for the Event Rich Result on Google Search, reducing organic visibility for LIV's promotional campaigns.

---

## 2. Plan & Design (Implicit)

No formal `docs/01-plan/` or `docs/02-design/` documents were created because the scope is a single-file schema patch with an externally-provided spec. The de-facto design came from:

1. **GSC warning list** — defined the two required fields to add
2. **User-provided JSON-LD template** — defined the exact shape and value sources for each field
3. **Google Event Rich Results spec** — defined the validation criteria

This is consistent with the project's existing pattern of bypassing PDCA Plan/Design for surgical fixes (see `golden-principles.md #9 HARD-GATE` exception for 1–2 file bug patches).

---

## 3. Implementation (Do)

### File Changed
`liv-clinic/src/app/[locale]/events/layout.tsx` — Event Schema generation inside `itemListElement[].item`

### Diff Summary

```diff
       item: {
         '@type': 'Event',
         name: event.title.ko,
         description: event.description.ko,
         startDate: event.startDate,
         endDate: event.endDate,
-        image: `${BASE_URL}${event.posterImage}`,
+        image: [`${BASE_URL}${event.posterImage}`],
         url: `${BASE_URL}/ko/events/${event.id}`,
         location: {
           '@type': 'Place',
           name: SITE_INFO.name,
           address: {
             '@type': 'PostalAddress',
-            streetAddress: SITE_INFO.address,
-            addressLocality: '서울',
+            streetAddress: SITE_INFO.address.ko,
+            addressLocality: '서초구',
+            addressRegion: '서울특별시',
+            postalCode: SITE_INFO.postalCode,
             addressCountry: 'KR',
           },
         },
+        performer: {
+          '@type': 'Organization',
+          name: SITE_INFO.name,
+          url: BASE_URL,
+        },
         organizer: {
           '@type': 'MedicalBusiness',
           name: SITE_INFO.name,
           url: BASE_URL,
         },
+        offers: {
+          '@type': 'Offer',
+          url: `${BASE_URL}/ko/events/${event.id}`,
+          price: '0',
+          priceCurrency: 'KRW',
+          availability: 'https://schema.org/InStock',
+          validFrom: event.startDate,
+        },
         eventStatus: 'https://schema.org/EventScheduled',
         eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
       },
```

### Change Breakdown

| Category | Change | Source |
|----------|--------|--------|
| **GSC fix** | Added `performer` (Organization) | GSC warning |
| **GSC fix** | Added `offers` (Offer, free event, KRW, InStock) | GSC warning |
| **Side-fix** | `image` string → array | schema.org recommendation |
| **Side-fix** | `streetAddress`: `{ko, en}` object → `SITE_INFO.address.ko` string | Pre-existing latent bug — object was serialized as `[object Object]` in JSON-LD |
| **Side-fix** | `addressLocality`: `'서울'` → `'서초구'` | Locality = district per schema.org |
| **Side-fix** | Added `addressRegion: '서울특별시'` | Recommended for ko-KR addresses |
| **Side-fix** | Added `postalCode: SITE_INFO.postalCode` (06536) | Recommended PostalAddress field |

The side-fixes were not in the GSC warning list but are part of producing a valid PostalAddress and Event schema. They were applied surgically without touching unrelated code.

---

## 4. Verification (Check)

### Automated
```
✅ npx tsc --noEmit              # No TypeScript errors
```

### Gap Analysis Result (from `docs/03-analysis/seo-event-schema.analysis.md`)

| Metric | Value |
|--------|-------|
| GSC blocking warnings resolved | 2 / 2 (100%) |
| Google Event required fields | 100% present |
| Google Event recommended fields | 100% present |
| User template adherence | 23 / 25 fields (92%) |
| Critical gaps | 0 |
| Minor gaps | 2 (no fix required — see G-01, G-02 below) |
| Info-only gaps | 2 (out of scope) |
| **Match Rate** | **95%** |

### Minor Gaps (No Action Required)
- **G-01**: `startDate`/`endDate` are date-only (`YYYY-MM-DD`); template suggested full ISO 8601 with time. Google accepts both for multi-day promotional events.
- **G-02**: `organizer.@type` is `MedicalBusiness` (more specific subtype of `Organization`). Acceptable per schema.org inheritance.

### Out-of-Scope Findings (Tracked Separately)
- **G-03**: All locales (`/en`, `/ja`, `/zh`) currently serve the Korean Event schema → consider new feature `events-locale-aware-schema`
- **G-04**: Individual event detail pages have no standalone Event JSON-LD → consider new feature `event-detail-schema`

### Manual Verification (Pending User)
- [ ] `cd liv-clinic && npm run dev`
- [ ] Visit `http://localhost:3000/ko/events`
- [ ] View page source → confirm `performer` + `offers` in `<script type="application/ld+json">`
- [ ] Paste rendered URL into [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] After deployment: Search Console → "Validate fix" on Events report

---

## 5. Lessons & Patterns

### What Worked
- **Single-source-of-truth for data**: `EventItem` interface + `EVENTS` constant made it trivial to map all required fields without per-event hardcoding.
- **Side-fix discipline**: While adding the two GSC-required fields, fixed only directly-related issues (PostalAddress validity). Did not "improve" unrelated parts of the same file.
- **External spec as design**: GSC warnings + Google docs + user template substituted for a formal Design doc, keeping the change surgical.

### What to Watch
- **`SITE_INFO.address` shape**: The constant uses `{ko, en}` for human-readable address strings, which is fine for UI but invalid as JSON-LD `streetAddress`. Any future Schema.org code touching addresses should explicitly pick `.ko` (or locale-derived value).
- **Schema localization**: As LIV expands to more locales, the layout-level schema needs to receive the route's `locale` param (currently hardcoded `ko`).

### Recurring Pattern Worth Noting
Multiple `layout.tsx` files in the project emit JSON-LD inline. Centralizing Event/Treatment/FAQ schema builders into `lib/seo.ts` (similar to existing `generateLocalBusinessSchema` etc.) would prevent drift between pages.

---

## 6. Follow-up Tasks (Suggested)

| ID | Priority | Title | Rationale |
|----|----------|-------|-----------|
| FU-01 | High | Manual GSC validation after next deploy | Confirms fix lands in production crawl |
| FU-02 | Medium | `events-locale-aware-schema` | G-03 — non-Korean locales currently serve Korean schema |
| FU-03 | Medium | `event-detail-schema` | G-04 — add Event JSON-LD on `[eventId]/page.tsx` |
| FU-04 | Low | Audit other `SITE_INFO.address` usages | Ensure no other code passes the object where a string is expected |
| FU-05 | Low | Centralize Event schema builder into `lib/seo.ts` | DRY + consistency for future schema additions |

---

## 7. Artifacts

| Document | Path |
|----------|------|
| Analysis | `docs/03-analysis/seo-event-schema.analysis.md` |
| Report | `docs/04-report/seo-event-schema.report.md` (this file) |
| Implementation | `liv-clinic/src/app/[locale]/events/layout.tsx` (lines 28–68) |

---

## 8. Final Status

```
📊 PDCA Status: seo-event-schema
─────────────────────────────
[Plan]   ⚪ skipped (surgical fix)
[Design] ⚪ skipped (external spec)
[Do]     ✅ 1 file, +21/−5 LOC
[Check]  ✅ 95% match rate
[Act]    ⚪ not needed (≥90%)
[Report] ✅ this document
─────────────────────────────
Phase: completed
```
