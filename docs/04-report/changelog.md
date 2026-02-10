# Changelog

All notable changes to the LIV Clinic project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [2026-02-10] - Analytics Admin Management Feature Complete

### Added
- **Analytics Admin Management Feature** (PDCA Cycle #1 Complete)
  - Admin settings page now supports Google Analytics / Naver Analytics tracking ID configuration
  - Database migration (`014_analytics_settings.sql`): 4 new columns in clinic_settings table
    - `ga_tracking_id` (text, default: '')
    - `naver_wcs_id` (text, default: '')
    - `ga_enabled` (boolean, default: true)
    - `naver_enabled` (boolean, default: true)
  - Analytics settings UI with toggle switches and text input fields in admin settings
  - Server-side `getAnalyticsSettings()` function for DB initialization in public layout
  - Full TypeScript type support for analytics configuration

### Changed
- `GoogleAnalytics.tsx`: Added optional `trackingId` and `enabled` props with environment variable fallback
- `NaverAnalytics.tsx`: Added optional `wcsId` and `enabled` props with environment variable fallback
- Admin API `/api/admin/settings/clinic`:
  - GET: Returns analytics object (gaTrackingId, naverWcsId, gaEnabled, naverEnabled)
  - PUT: Supports analytics field updates via dynamic PATCH pattern
- `src/app/[locale]/layout.tsx`: Fetches analytics settings from Supabase and passes to components

### Fixed
- Graceful error handling in layout: Returns null on DB error, triggers env variable fallback
- Type safety: Full TypeScript strict mode compliance

### Security
- Uses `createAdminClient()` (service role) for DB queries in public layout initialization
- Proper error handling prevents information leakage on DB failures
- Maintains backward compatibility with environment variable configuration

### Metrics
- **PDCA Cycle Status**: Complete (1 iteration, 0 required)
- **Gap Analysis Match Rate**: 100% (30/30 items pass)
- **Files Modified**: 7
- **Lines Added**: ~159
- **Build Status**: SUCCESS (0 TypeScript errors)
- **Deployment Ready**: Yes

---
