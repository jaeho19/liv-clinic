# Plan: Naver Analytics 연결 수정

## 1. 개요

네이버 애널리틱스(WCS) 스크립트가 프로덕션 사이트에서 제대로 동작하지 않는 문제를 진단하고 수정합니다.

**WCS ID**: `16b70780eac2fd0`

## 2. 현재 상태 분석

### 코드 구조 (정상)
- `NaverAnalytics.tsx` 컴포넌트 존재 (`src/components/analytics/`)
- `layout.tsx`에서 컴포넌트 렌더링 (line 109)
- Supabase `clinic_settings` 테이블에서 `naver_wcs_id`, `naver_enabled` 조회
- Fallback: `process.env.NEXT_PUBLIC_NAVER_WCS_ID`

### 환경변수 (로컬 정상)
- `.env.local`: `NEXT_PUBLIC_NAVER_WCS_ID=16b70780eac2fd0` 설정됨

### 발견된 문제점

#### 문제 1: SPA 라우트 변경 시 페이지뷰 미추적 (Critical)
현재 `NaverAnalytics.tsx`는 최초 로드 시 한 번만 `wcs_do()`를 호출합니다.
Next.js는 SPA이므로 클라이언트 사이드 네비게이션 시 `wcs_do()`가 다시 호출되지 않아
**첫 페이지 외에는 페이지뷰가 추적되지 않습니다.**

```
현재: 첫 페이지 로드 → wcs_do() 호출 → 이후 페이지 이동 시 추적 안됨
목표: 모든 페이지 이동 시 → wcs_do() 호출 → 전체 페이지뷰 추적
```

#### 문제 2: Netlify 환경변수 미확인
Netlify 배포 시 `NEXT_PUBLIC_NAVER_WCS_ID` 환경변수가 설정되어 있지 않을 수 있음.
DB fallback이 있지만, 빌드 시점에 Supabase 연결 실패하면 스크립트가 아예 누락됨.

#### 문제 3: 정적 빌드 시 DB 값 고정
`layout.tsx`가 `generateStaticParams()`로 정적 생성되므로, `getAnalyticsSettings()`는
빌드 시점에만 실행됨. 빌드 시 DB에 값이 없으면 프로덕션에서도 누락됨.

## 3. 수정 계획

### Task 1: NaverAnalytics 컴포넌트 - SPA 라우트 추적 추가
**파일**: `src/components/analytics/NaverAnalytics.tsx`

`next/navigation`의 `usePathname()`을 사용하여 경로 변경 감지 후 `wcs_do()` 재호출:

```tsx
'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function NaverAnalytics({ wcsId, enabled }) {
  const id = wcsId || process.env.NEXT_PUBLIC_NAVER_WCS_ID;
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    // 최초 렌더링은 Script 태그가 처리하므로 건너뜀
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    // SPA 라우트 변경 시 wcs_do() 재호출
    if (window.wcs) {
      wcs_do();
    }
  }, [pathname]);

  if (!id || enabled === false) return null;

  return (
    <>
      <Script src="//wcs.pstatic.net/wcslog.js" strategy="afterInteractive" />
      <Script id="naver-analytics" strategy="afterInteractive">
        {`
          if(!wcs_add) var wcs_add = {};
          wcs_add["wa"] = "${id}";
          if(window.wcs) { wcs_do(); }
        `}
      </Script>
    </>
  );
}
```

### Task 2: GoogleAnalytics 컴포넌트도 동일 패턴 적용
**파일**: `src/components/analytics/GoogleAnalytics.tsx`

동일하게 SPA 라우트 변경 시 `gtag('config', ...)` 재호출 추가.

### Task 3: Netlify 환경변수 확인 안내
- Netlify 대시보드에서 `NEXT_PUBLIC_NAVER_WCS_ID=16b70780eac2fd0` 설정 확인
- 또는 Supabase `clinic_settings` 테이블에 `naver_wcs_id` 값 확인

## 4. 영향 범위

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/analytics/NaverAnalytics.tsx` | SPA 라우트 추적 추가 |
| `src/components/analytics/GoogleAnalytics.tsx` | SPA 라우트 추적 추가 |

## 5. 검증 방법

1. 개발서버에서 페이지 이동 시 브라우저 Network 탭에서 `wcs.pstatic.net` 요청 확인
2. 네이버 애널리틱스 대시보드에서 실시간 방문자 확인
3. 여러 페이지 이동 후 각 페이지뷰가 기록되는지 확인
