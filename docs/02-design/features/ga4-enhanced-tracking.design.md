# Design: GA4 Enhanced Tracking & Google Analytics Direct Access

## 1. Overview

**Feature**: ga4-enhanced-tracking
**Plan Reference**: [ga4-enhanced-tracking.plan.md](../../01-plan/features/ga4-enhanced-tracking.plan.md)
**Date**: 2026-02-13

## 2. Architecture

### 2.1 Overall Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Admin Analytics Page                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  GA4 대시보드 바로가기 카드 (NEW)                            │  │
│  │  - 전체 대시보드 / 트래픽 획득 / 인구통계 / 실시간          │  │
│  │  - Search Console 바로가기                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  기존 KPI 카드 + 차트 (KEEP)                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  GA4 설정 체크리스트 (NEW)                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Naver Analytics 카드 (KEEP)                               │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    Public Pages (이벤트 추적)                      │
│                                                                    │
│  GoogleAnalytics.tsx ──── gtag config (enhanced)                  │
│                                                                    │
│  analytics-events.ts ──── trackEvent() 유틸리티                   │
│       │                                                            │
│       ├── FloatingCTA.tsx ───── contact (phone/kakao)             │
│       ├── contact/page.tsx ──── generate_lead (form submit)       │
│       └── 시술 상세 pages ───── view_item (treatment view)        │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow for GA4 Dashboard Links

```
.env.local                     Admin API                    Admin Page
┌──────────────┐   ┌──────────────────────────┐   ┌───────────────────────┐
│GA4_PROPERTY_ID│──▶│ /api/admin/analytics/    │──▶│ GA4 대시보드 링크 구성 │
│  (520053241)  │   │  google?period=30d       │   │ analytics.google.com/ │
│               │   │  응답에 propertyId 포함   │   │ #/p{propertyId}/...   │
└──────────────┘   └──────────────────────────┘   └───────────────────────┘
```

## 3. Functional Requirements (Checklist)

### FR-01: analytics-events.ts 유틸리티 생성

| ID | Item | Description |
|----|------|-------------|
| FR-01-01 | `trackEvent()` 함수 | `gtag('event', eventName, params)` 래퍼 |
| FR-01-02 | `trackContact()` 함수 | 전화/카카오/위챗 등 연락 이벤트 |
| FR-01-03 | `trackFormSubmit()` 함수 | 상담 폼 제출 이벤트 |
| FR-01-04 | `trackViewItem()` 함수 | 시술 상세 페이지 조회 이벤트 |
| FR-01-05 | gtag 존재 여부 체크 | `typeof gtag === 'function'` 가드 |

### FR-02: FloatingCTA 이벤트 추적

| ID | Item | Description |
|----|------|-------------|
| FR-02-01 | 전화 클릭 이벤트 | `trackContact('phone')` on tel: link click |
| FR-02-02 | 카카오톡 클릭 이벤트 | `trackContact('kakao')` on kakao link click |
| FR-02-03 | 기타 소셜 클릭 이벤트 | `trackContact('wechat'/'line')` if applicable |

### FR-03: Contact 페이지 이벤트 추적

| ID | Item | Description |
|----|------|-------------|
| FR-03-01 | 폼 제출 성공 이벤트 | `trackFormSubmit('consultation', treatment)` on successful submit |
| FR-03-02 | 전화 링크 클릭 | `trackContact('phone')` on tel: link |

### FR-04: GoogleAnalytics.tsx 개선

| ID | Item | Description |
|----|------|-------------|
| FR-04-01 | gtag config 보강 | `send_page_view: true`, `cookie_flags: 'SameSite=None;Secure'` |

### FR-05: Admin Analytics 페이지 - GA4 대시보드 바로가기

| ID | Item | Description |
|----|------|-------------|
| FR-05-01 | GA4 Property ID API 노출 | 기존 analytics API 응답에 `propertyId` 필드 추가 |
| FR-05-02 | 대시보드 메인 링크 | `analytics.google.com/analytics/web/#/p{id}/reports/` |
| FR-05-03 | 트래픽 획득 보고서 링크 | 트래픽 소스/매체/캠페인 상세 |
| FR-05-04 | 사용자 인구통계 링크 | 위치/국가/도시/성별/연령대 |
| FR-05-05 | 실시간 보고서 링크 | 현재 활성 사용자 |
| FR-05-06 | Search Console 링크 | search.google.com/search-console (키워드 데이터) |
| FR-05-07 | 외부 링크 아이콘 | 각 링크에 external link 아이콘 표시 |

### FR-06: Admin Analytics 페이지 - GA4 설정 가이드

| ID | Item | Description |
|----|------|-------------|
| FR-06-01 | Enhanced Measurement 안내 | GA4 속성 설정에서 활성화 방법 + 링크 |
| FR-06-02 | Search Console 연동 안내 | GA4 ↔ Search Console 연결 방법 + 링크 |
| FR-06-03 | 전환 이벤트 설정 안내 | generate_lead, contact 이벤트를 전환으로 표시 방법 |
| FR-06-04 | 데이터 보관 기간 안내 | 14개월 설정 권장 + 링크 |
| FR-06-05 | 접기/펼치기 UI | 기본 접힌 상태, 토글 가능 |

## 4. Detailed File Specifications

### 4.1 `src/lib/analytics-events.ts` (NEW)

```typescript
/**
 * GA4 커스텀 이벤트 추적 유틸리티
 *
 * 사용법:
 *   import { trackContact, trackFormSubmit, trackViewItem } from '@/lib/analytics-events';
 *   trackContact('phone', '/contact');
 */

declare global {
  function gtag(...args: unknown[]): void;
}

/** GA4 이벤트 전송 (gtag 존재 여부 자동 체크) */
export function trackEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

/** 연락 이벤트 (전화, 카카오, 위챗 등) */
export function trackContact(method: 'phone' | 'kakao' | 'wechat' | 'line' | 'naver_map' | 'kakao_map', pagePath?: string) {
  trackEvent('contact', {
    method,
    page_location: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
}

/** 상담 폼 제출 이벤트 */
export function trackFormSubmit(formType: string, treatment?: string) {
  trackEvent('generate_lead', {
    form_type: formType,
    ...(treatment && { treatment }),
  });
}

/** 시술 상세 조회 이벤트 */
export function trackViewItem(itemName: string, category: string) {
  trackEvent('view_item', {
    item_name: itemName,
    item_category: category,
  });
}
```

**구현 포인트:**
- `typeof window !== 'undefined'` 체크로 SSR 안전
- `typeof gtag === 'function'` 체크로 GA4 미설정 시 에러 방지
- GA4 권장 이벤트명 사용 (`generate_lead`, `contact`, `view_item`)

### 4.2 `src/components/layout/FloatingCTA.tsx` (MODIFY)

**변경 범위:** CTA 버튼 클릭 시 `trackContact()` 호출 추가

```typescript
// import 추가
import { trackContact } from '@/lib/analytics-events';

// 각 CTA 버튼의 onClick에 추가 (기존 로직 유지)
// phone 버튼:
onClick={() => trackContact('phone')}

// kakao 버튼:
onClick={() => trackContact('kakao')}
```

**주의:** `<a>` 태그의 기본 동작(href 이동)은 유지. onClick이 먼저 실행되고 href로 이동됨.
motion.a 사용 시 onClick 핸들러를 추가하되, 기존 href/target 속성 유지.

### 4.3 `src/app/[locale]/contact/page.tsx` (MODIFY)

**변경 범위:** 폼 제출 성공 시 `trackFormSubmit()`, 전화 링크에 `trackContact()`

```typescript
// import 추가
import { trackFormSubmit, trackContact } from '@/lib/analytics-events';

// onSubmit 핸들러 내 성공 시 (기존 API 호출 후):
trackFormSubmit('consultation', selectedTreatment);

// tel: 링크의 onClick에:
onClick={() => trackContact('phone', '/contact')}
```

### 4.4 `src/components/analytics/GoogleAnalytics.tsx` (MODIFY)

**변경 범위:** gtag config에 추가 옵션

```typescript
// 기존:
gtag('config', '${id}', {
  page_path: window.location.pathname,
});

// 변경:
gtag('config', '${id}', {
  page_path: window.location.pathname,
  send_page_view: true,
  cookie_flags: 'SameSite=None;Secure',
});
```

### 4.5 `src/app/api/admin/analytics/google/route.ts` (MODIFY)

**변경 범위:** API 응답에 `propertyId` 추가

```typescript
// 기존 응답:
return NextResponse.json({ overview, dailyTrend, topPages, sources, devices });

// 변경:
return NextResponse.json({
  overview, dailyTrend, topPages, sources, devices,
  propertyId: process.env.GA4_PROPERTY_ID || null,
});
```

### 4.6 `src/types/analytics.ts` (MODIFY)

**변경 범위:** `GA4AnalyticsData` 타입에 `propertyId` 추가

```typescript
export interface GA4AnalyticsData {
  overview: GA4Overview;
  dailyTrend: GA4DailyTrend[];
  topPages: GA4TopPage[];
  sources: GA4Source[];
  devices: GA4Device[];
  propertyId?: string | null;  // NEW
}
```

### 4.7 `src/app/admin/(authenticated)/analytics/page.tsx` (MODIFY)

**변경 범위 (3개 섹션 추가):**

#### A. GA4 대시보드 바로가기 카드 (헤더와 KPI 카드 사이에 삽입)

```
┌─────────────────────────────────────────────────────────────┐
│  Google Analytics 대시보드                                    │
│                                                               │
│  GA4에서 상세 분석을 확인하세요                                 │
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ 📊 대시보드  │ │ 🔍 트래픽   │ │ 🌍 인구통계  │            │
│  │ 전체 보고서  │ │ 획득 경로   │ │ 위치/국가    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌──────────────────────────────┐            │
│  │ ⚡ 실시간    │ │ 🔎 Search Console            │            │
│  │ 현재 방문자  │ │ 검색 키워드/노출/CTR          │            │
│  └─────────────┘ └──────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**링크 구성:**

| 버튼 | URL 패턴 | 설명 |
|------|---------|------|
| 대시보드 | `https://analytics.google.com/analytics/web/#/p{propertyId}/reports/dashboard` | GA4 메인 |
| 트래픽 획득 | `https://analytics.google.com/analytics/web/#/p{propertyId}/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-traffic-acquisition-v2` | 소스/매체/캠페인 |
| 인구통계 | `https://analytics.google.com/analytics/web/#/p{propertyId}/reports/explorer?params=_u..nav%3Dmaui&r=user-demographics-detail` | 위치/국가/성별/연령 |
| 실시간 | `https://analytics.google.com/analytics/web/#/p{propertyId}/reports/realtime` | 실시간 방문자 |
| Search Console | `https://search.google.com/search-console` | 검색 키워드/노출/CTR |

**디자인:**
- 배경: `bg-blue-50/50`, 테두리: `border-blue-200`
- Google 브랜드 컬러 (#4285F4) 활용
- 각 링크 카드: 호버 시 elevation 효과
- `propertyId`가 없으면 이 섹션 숨김 (not configured)

#### B. GA4 설정 가이드 (Naver Analytics 카드 위에 삽입)

```
┌─────────────────────────────────────────────────────────────┐
│  📋 GA4 설정 가이드                              [접기 ▲]    │
│                                                               │
│  ✅ 1. Enhanced Measurement 활성화                            │
│     GA4 속성 → 데이터 스트림 → 향상된 측정 켜기                │
│     [설정 바로가기 ↗]                                         │
│                                                               │
│  ✅ 2. Google Search Console 연동                             │
│     GA4 관리 → 제품 링크 → Search Console 연결                 │
│     → 검색 키워드, 노출수, CTR 데이터 확인 가능                 │
│     [Search Console 바로가기 ↗]                               │
│                                                               │
│  ✅ 3. 전환 이벤트 설정                                       │
│     GA4 → 이벤트 → generate_lead / contact를 전환으로 표시     │
│     → 상담 신청, 전화 클릭 전환율 추적                         │
│     [이벤트 설정 바로가기 ↗]                                   │
│                                                               │
│  ✅ 4. 데이터 보관 기간 (14개월 권장)                          │
│     GA4 관리 → 데이터 설정 → 데이터 보관 → 14개월              │
│     [데이터 보관 설정 ↗]                                       │
└─────────────────────────────────────────────────────────────┘
```

**디자인:**
- 기본 접힌 상태 (제목만 보임)
- 토글 클릭 시 내용 표시/숨김 (`useState` 사용)
- 배경: `bg-white`, 테두리: `border-[#e5e5e5]`
- 각 항목에 Google 도움말 링크 (외부 링크 아이콘)

**안내 링크:**

| 항목 | URL |
|------|-----|
| Enhanced Measurement | `https://support.google.com/analytics/answer/9216061` |
| Search Console 연동 | `https://support.google.com/analytics/answer/9379420` |
| 전환 이벤트 설정 | `https://support.google.com/analytics/answer/9267568` |
| 데이터 보관 기간 | `https://support.google.com/analytics/answer/7667196` |

## 5. Implementation Order

| Step | Task | Files | Depends On |
|------|------|-------|------------|
| 1 | analytics-events.ts 생성 | `src/lib/analytics-events.ts` | - |
| 2 | GoogleAnalytics.tsx 개선 | `src/components/analytics/GoogleAnalytics.tsx` | - |
| 3 | FloatingCTA 이벤트 추가 | `src/components/layout/FloatingCTA.tsx` | Step 1 |
| 4 | Contact 페이지 이벤트 추가 | `src/app/[locale]/contact/page.tsx` | Step 1 |
| 5 | Analytics API propertyId 추가 | `src/app/api/admin/analytics/google/route.ts` | - |
| 6 | Analytics 타입 업데이트 | `src/types/analytics.ts` | Step 5 |
| 7 | Admin 페이지 GA4 바로가기 | `src/app/admin/(authenticated)/analytics/page.tsx` | Step 5, 6 |
| 8 | Admin 페이지 설정 가이드 | `src/app/admin/(authenticated)/analytics/page.tsx` | - |

## 6. Non-Functional Requirements

| Requirement | Target | Approach |
|-------------|--------|----------|
| SSR 안전성 | 클라이언트 전용 이벤트 | `typeof window` 체크 |
| 성능 영향 | 0 추가 스크립트 | 기존 gtag.js만 사용 |
| 에러 내성 | GA4 미설정 시 무시 | `typeof gtag === 'function'` 가드 |
| 빌드 성공 | TypeScript 에러 0 | 타입 업데이트 포함 |
| 하위 호환 | 기존 기능 유지 | 추가만, 수정 최소화 |

## 7. Out of Scope

- GTM (Google Tag Manager) 도입
- 시술 상세 페이지별 `view_item` 이벤트 (개수 많아 별도 작업 권장)
- Naver Analytics 커스텀 이벤트 (API 미제공)
- GA4 BigQuery Export
- E-commerce 이벤트 (결제 기능 없음)
