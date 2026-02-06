'use client';

import Script from 'next/script';

const NAVER_WCS_ID = process.env.NEXT_PUBLIC_NAVER_WCS_ID;

export default function NaverAnalytics() {
  if (!NAVER_WCS_ID) {
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
          wcs_add["wa"] = "${NAVER_WCS_ID}";
          if(window.wcs) {
            wcs_do();
          }
        `}
      </Script>
    </>
  );
}
