'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    wcs: unknown;
    wcs_add: Record<string, string>;
  }
  function wcs_do(): void;
}

interface NaverAnalyticsProps {
  wcsId?: string;
  enabled?: boolean;
}

export default function NaverAnalytics({ wcsId, enabled }: NaverAnalyticsProps) {
  const id = wcsId || process.env.NEXT_PUBLIC_NAVER_WCS_ID;
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // SPA 라우트 변경 시 wcs_do() 재호출
    if (typeof wcs_do === 'function' && window.wcs) {
      wcs_do();
    }
  }, [pathname]);

  if (!id || enabled === false) {
    return null;
  }

  return (
    <>
      <Script
        src="//wcs.pstatic.net/wcslog.js"
        strategy="afterInteractive"
      />
      <Script id="naver-analytics" strategy="afterInteractive">
        {`
          if(!wcs_add) var wcs_add = {};
          wcs_add["wa"] = "${id}";
          if(window.wcs) {
            wcs_do();
          }
        `}
      </Script>
    </>
  );
}
