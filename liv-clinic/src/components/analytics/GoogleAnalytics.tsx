'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  trackingId?: string;
  enabled?: boolean;
}

export default function GoogleAnalytics({ trackingId, enabled }: GoogleAnalyticsProps) {
  const id = trackingId || process.env.NEXT_PUBLIC_GA_ID;

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
          });
        `}
      </Script>
    </>
  );
}
