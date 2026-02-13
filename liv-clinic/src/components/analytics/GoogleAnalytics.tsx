'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  function gtag(...args: unknown[]): void;
  interface Window {
    dataLayer: unknown[];
  }
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
    // SPA route change -> re-send pageview
    if (typeof gtag === 'function') {
      gtag('config', id, { page_path: pathname });
    }
  }, [pathname, id]);

  if (!id || enabled === false) {
    return null;
  }

  return (
    <>
      {/* GA4 gtag.js */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />

      {/* GA4 config with enhanced measurement */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_path: window.location.pathname,
            send_page_view: true,
            cookie_flags: 'SameSite=None;Secure',

            // Enhanced Measurement
            enhanced_measurement: true,

            // Custom dimensions for clinic
            custom_map: {
              'dimension1': 'treatment_category',
              'dimension2': 'language',
              'dimension3': 'user_type',
            },

            // Language tracking
            language: document.documentElement.lang || 'ko',
          });

          // Enhanced scroll depth tracking (25%, 50%, 75%, 90%)
          var scrollThresholds = [25, 50, 75, 90];
          var scrollFired = {};
          window.addEventListener('scroll', function() {
            var scrollPercent = Math.round(
              (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            scrollThresholds.forEach(function(threshold) {
              if (scrollPercent >= threshold && !scrollFired[threshold]) {
                scrollFired[threshold] = true;
                gtag('event', 'scroll_depth', {
                  percent_scrolled: threshold,
                  page_path: window.location.pathname,
                });
              }
            });
          }, { passive: true });

          // Outbound link click tracking
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href]');
            if (link && link.hostname !== window.location.hostname) {
              gtag('event', 'click', {
                event_category: 'outbound',
                event_label: link.href,
                transport_type: 'beacon',
              });
            }
          });

          // Phone call click tracking
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a[href^="tel:"]');
            if (link) {
              gtag('event', 'contact', {
                method: 'phone',
                page_path: window.location.pathname,
              });
            }
          });

          // Time on page tracking (30s, 60s, 120s, 300s)
          var timeThresholds = [30, 60, 120, 300];
          timeThresholds.forEach(function(seconds) {
            setTimeout(function() {
              if (!document.hidden) {
                gtag('event', 'time_on_page', {
                  seconds: seconds,
                  page_path: window.location.pathname,
                });
              }
            }, seconds * 1000);
          });
        `}
      </Script>
    </>
  );
}
