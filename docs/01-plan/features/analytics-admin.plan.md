# Plan: Analytics Admin Management (GA/NA)

## 1. Feature Overview

**Feature Name**: analytics-admin
**Description**: 관리자 설정 페이지에서 Google Analytics / Naver Analytics 추적 ID를 관리하는 기능
**Priority**: Medium
**Date**: 2026-02-10

## 2. Current State Analysis

### Already Implemented
- `GoogleAnalytics.tsx` 컴포넌트 (gtag.js 로딩, `NEXT_PUBLIC_GA_ID` 사용)
- `NaverAnalytics.tsx` 컴포넌트 (wcslog.js 로딩, `NEXT_PUBLIC_NAVER_WCS_ID` 사용)
- 두 컴포넌트 모두 `[locale]/layout.tsx`에서 `<head>` 내에 로딩 중
- `.env.local`에 실제 tracking ID 설정됨

### Missing
- 관리자 설정 페이지에서 analytics tracking ID 조회/수정 기능 없음
- DB(Supabase)에 analytics 설정 저장 없음 (현재 env 변수만 사용)

## 3. Implementation Plan

### Approach: DB 저장 + env fallback

Analytics ID를 Supabase `clinic_settings` 테이블에 저장하고, 관리자가 수정 가능하게 함.
Layout에서 서버 컴포넌트로 DB 조회 → 환경변수 fallback → analytics 컴포넌트에 props로 전달.

### 3.1 Admin Settings UI 변경

**File**: `src/app/admin/(authenticated)/settings/page.tsx`

- 새 탭 `analytics` 추가 (기본정보 탭 옆)
- 입력 필드:
  - Google Analytics Tracking ID (예: G-XXXXXXXXXX)
  - Naver Analytics WCS ID (예: 16b70780eac2fd0)
  - 각각 활성화/비활성화 토글
- 저장 시 `/api/admin/settings/clinic` API 사용 (기존 clinic 설정 PATCH)

### 3.2 API 변경

**File**: `src/app/api/admin/settings/clinic/route.ts`

- clinic_settings 테이블에 `ga_tracking_id`, `naver_wcs_id`, `ga_enabled`, `naver_enabled` 컬럼 활용
- GET: 기존 응답에 analytics 필드 추가
- PUT: analytics 관련 필드 저장 지원

### 3.3 Analytics 컴포넌트 변경

**Files**: `GoogleAnalytics.tsx`, `NaverAnalytics.tsx`

- props로 trackingId를 받도록 수정 (기존 env 변수는 fallback)
- enabled prop 추가

### 3.4 Layout 변경

**File**: `src/app/[locale]/layout.tsx`

- 서버 컴포넌트에서 Supabase로 analytics 설정 조회
- DB 값 → env fallback → analytics 컴포넌트에 props 전달

## 4. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `settings/page.tsx` | Modify | analytics 탭 추가 |
| `api/admin/settings/clinic/route.ts` | Modify | analytics 필드 CRUD |
| `GoogleAnalytics.tsx` | Modify | props 지원 + env fallback |
| `NaverAnalytics.tsx` | Modify | props 지원 + env fallback |
| `[locale]/layout.tsx` | Modify | DB에서 analytics 설정 조회 후 전달 |
| `clinic_settings` table | Check | analytics 관련 컬럼 존재 확인 |

## 5. Risk & Considerations

- **SEO 영향 없음**: 스크립트 로딩 방식은 동일 (`afterInteractive`)
- **Fallback 안전성**: DB 조회 실패 시 env 변수 사용으로 서비스 중단 없음
- **성능**: clinic_settings 조회는 이미 layout에서 수행 가능 (서버 컴포넌트)
