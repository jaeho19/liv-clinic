# Plan: GA4 Enhanced Tracking & Google Analytics Direct Access

## 1. Feature Overview

**Feature Name**: ga4-enhanced-tracking
**Description**: 관리자 대시보드의 한계(트래픽 획득 경로, 위치, 국가, 시간대, 키워드 등)를 해결하기 위해 GA4 추적을 강화하고, Google Analytics 대시보드로 바로 이동할 수 있는 연결을 제공
**Priority**: High
**Date**: 2026-02-13

## 2. Problem Analysis

### 현재 상황
- **Admin Analytics 대시보드**: GA4 Data API로 기본 지표만 표시 (세션, 사용자, PV, 이탈률, 유입경로, 기기별, TOP10 페이지)
- **한계점**:
  - 트래픽 획득 경로 상세 (소스/매체/캠페인) 미표시
  - 사용자 위치/국가/도시 정보 미표시
  - 시간대별 방문 패턴 미표시
  - 검색 키워드 데이터 미표시 (Google Search Console 연동 필요)
  - 사용자 흐름/행동 패턴 미표시
  - 전환(상담 신청 등) 추적 미설정

### 근본 원인
1. GA4 Data API로 모든 보고서를 재구현하는 것은 비현실적 → **Google Analytics 자체 대시보드 활용이 답**
2. 현재 gtag 설정이 기본(pageview만) → **Enhanced Measurement 및 커스텀 이벤트 부족**
3. Google Search Console과 GA4 연결 안내 없음 → **키워드 데이터 불가**

## 3. Solution Strategy

### 핵심 방향: "Admin = Quick Overview + GA4 대시보드 바로가기"

관리자 페이지에서는 핵심 KPI 요약만 보여주고, 상세 분석은 Google Analytics 대시보드에서 직접 수행하도록 유도. 동시에 GA4 추적을 강화하여 Google Analytics에서 볼 수 있는 데이터를 풍부하게 만든다.

## 4. Implementation Plan

### 4.1 Admin Analytics 페이지 개선

**File**: `src/app/admin/(authenticated)/analytics/page.tsx`

**변경 사항:**
1. **Google Analytics 대시보드 바로가기 카드** 추가 (페이지 상단 위치)
   - GA4 속성 대시보드 직접 링크: `https://analytics.google.com/analytics/web/#/p{PROPERTY_ID}/reports/`
   - 주요 보고서 직접 링크:
     - 트래픽 획득: `/reports/explorer?params=_u..nav%3Dmaui&r=lifecycle-traffic-acquisition-v2`
     - 사용자 인구통계: `/reports/explorer?params=_u..nav%3Dmaui&r=user-demographics-detail`
     - 실시간: `/reports/realtime`
   - 각 링크에 아이콘과 설명 포함
2. **Google Search Console 바로가기** 추가
   - Search Console 링크: `https://search.google.com/search-console`
   - 연결 방법 안내 (GA4 ↔ Search Console 연동 가이드)
3. **기존 KPI 카드 유지** (Quick Overview)
4. **하단에 Naver Analytics 카드 유지** (기존)

### 4.2 GA4 Enhanced Event Tracking 구현

**File**: `src/components/analytics/GoogleAnalytics.tsx`

**변경 사항:**
1. gtag config에 추가 설정:
   - `send_page_view: true` (명시적)
   - `cookie_flags: 'SameSite=None;Secure'` (크로스 사이트 호환)
2. Enhanced Measurement는 GA4 Property 설정에서 활성화 (코드 변경 불필요, 관리자 안내 제공)

### 4.3 커스텀 이벤트 추적 유틸리티

**New File**: `src/lib/analytics-events.ts`

**주요 이벤트:**
```typescript
// 상담 신청 완료
trackEvent('generate_lead', { form_type: 'consultation', treatment: '울쎄라' });

// 전화 클릭
trackEvent('contact', { method: 'phone', page: '/lifting/ulthera' });

// 카카오톡 클릭
trackEvent('contact', { method: 'kakao', page: '/contact' });

// 시술 상세 조회
trackEvent('view_item', { item_name: '울쎄라', category: 'lifting' });

// CTA 클릭 (상담 예약 버튼)
trackEvent('cta_click', { cta_type: 'consultation', location: 'hero' });
```

### 4.4 주요 컴포넌트에 이벤트 추가

| 컴포넌트 | 이벤트 | 목적 |
|----------|--------|------|
| `FloatingCTA.tsx` | `contact` (phone/kakao) | 전화/카카오 전환 추적 |
| `contact/page.tsx` | `generate_lead` | 상담 폼 제출 추적 |
| `lifting/[slug]/page.tsx` | `view_item` | 시술 상세 조회 추적 |
| `antiaging/[slug]/page.tsx` | `view_item` | 시술 상세 조회 추적 |
| `promotion/page.tsx` | `view_promotion` | 이벤트 조회 추적 |

### 4.5 GA4 설정 가이드 (Admin UI 내)

**File**: `src/app/admin/(authenticated)/analytics/page.tsx` (설정 가이드 섹션)

Admin Analytics 페이지 하단에 "GA4 설정 체크리스트" 카드 추가:
- [ ] GA4 Enhanced Measurement 활성화 확인
- [ ] Google Search Console ↔ GA4 연결
- [ ] 전환 이벤트 설정 (generate_lead, contact)
- [ ] 데이터 보관 기간 설정 (14개월 권장)
- 각 항목에 Google 공식 문서 링크

## 5. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `analytics/page.tsx` | Modify | GA 대시보드 바로가기 + 설정 가이드 추가 |
| `GoogleAnalytics.tsx` | Modify | gtag config 추가 설정 |
| `src/lib/analytics-events.ts` | Create | 커스텀 이벤트 추적 유틸리티 |
| `FloatingCTA.tsx` | Modify | 전화/카카오 이벤트 추적 추가 |
| `contact/page.tsx` | Modify | 상담 폼 전환 이벤트 추가 |
| 시술 상세 페이지들 | Modify | view_item 이벤트 추가 |

## 6. Expected Outcome

### Google Analytics에서 볼 수 있게 되는 데이터
- **트래픽 획득**: 소스/매체/캠페인별 세션 (GA4 기본)
- **위치/국가**: 사용자 지역 분석 (GA4 기본, Enhanced Geography)
- **시간대**: 시간별 방문 패턴 (GA4 기본)
- **키워드**: Search Console 연동 후 검색어 데이터
- **전환**: 상담 신청, 전화 클릭, 카카오톡 클릭 등 (커스텀 이벤트)
- **사용자 흐름**: 페이지 이동 경로 (GA4 기본)

### Admin 대시보드에서의 개선
- 핵심 KPI 빠른 확인 (기존 유지)
- Google Analytics 대시보드 원클릭 이동
- Google Search Console 원클릭 이동
- GA4 설정 상태 체크리스트

## 7. Risk & Considerations

- **개인정보**: GA4 IP 익명화는 기본 활성화됨 (추가 조치 불필요)
- **성능 영향**: gtag.js는 이미 로드 중이므로 추가 스크립트 없음
- **Search Console 연동**: Google 계정 설정 필요 (코드 아닌 관리자 작업)
- **기존 데이터**: 커스텀 이벤트는 추가 후부터 수집 시작 (과거 데이터 없음)

## 8. Out of Scope

- Google Tag Manager (GTM) 도입 → 현재 gtag.js로 충분
- GA4 BigQuery Export → 현재 트래픽 규모에서 불필요
- A/B 테스트 (Google Optimize 대체) → 별도 feature로 진행
- Admin 대시보드에 추가 차트 구현 → GA4 대시보드에서 확인
