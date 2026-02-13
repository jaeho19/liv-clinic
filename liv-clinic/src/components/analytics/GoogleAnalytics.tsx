'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  function gtag(...args: unknown[]): void;
}

interface GoogleAnalyticsProps {
  trackingId?: string;
  enabled?: boolean;
}

export default function GoogleAnalytics({ trackingId, enabled }: GoogleAnalyticsProps) {
  const id = trackingId || process.env.NEXT_PUBLIC_GA_ID;
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // SPA 라우트 변경 시 페이지뷰 재전송
    if (typeof gtag === 'function') {
      gtag('config', id, { page_path: pathname });
    }
  }, [pathname, id]);

  if (!id || enabled === false) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_path: window.location.pathname,
            send_page_view: true,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>
    </>
  );
}
