'use client';

import Script from 'next/script';

interface NaverAnalyticsProps {
  wcsId?: string;
  enabled?: boolean;
}

export default function NaverAnalytics({ wcsId, enabled }: NaverAnalyticsProps) {
  const id = wcsId || process.env.NEXT_PUBLIC_NAVER_WCS_ID;

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
