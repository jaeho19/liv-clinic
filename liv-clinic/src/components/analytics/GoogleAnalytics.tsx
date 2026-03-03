'use client';

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
  const enhancedSetup = useRef(false);

  // SPA route change → re-send pageview
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof gtag === 'function' && id) {
      gtag('config', id, { page_path: pathname });
    }
  }, [pathname, id]);

  // Enhanced event tracking (scroll depth, outbound links, phone clicks, time on page)
  useEffect(() => {
    if (!id || enabled === false || enhancedSetup.current) return;
    if (typeof gtag !== 'function') return;
    enhancedSetup.current = true;

    // Scroll depth tracking (25%, 50%, 75%, 90%)
    const scrollThresholds = [25, 50, 75, 90];
    const scrollFired: Record<number, boolean> = {};
    const scrollHandler = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((window.scrollY / docHeight) * 100);
      scrollThresholds.forEach((threshold) => {
        if (scrollPercent >= threshold && !scrollFired[threshold]) {
          scrollFired[threshold] = true;
          gtag('event', 'scroll_depth', {
            percent_scrolled: threshold,
            page_path: window.location.pathname,
          });
        }
      });
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Outbound link + phone click tracking
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;

      if (link.href.startsWith('tel:')) {
        gtag('event', 'contact', {
          method: 'phone',
          page_path: window.location.pathname,
        });
      } else if (link.hostname !== window.location.hostname) {
        gtag('event', 'click', {
          event_category: 'outbound',
          event_label: link.href,
          transport_type: 'beacon',
        });
      }
    };
    document.addEventListener('click', clickHandler);

    // Time on page tracking (30s, 60s, 120s, 300s)
    const timers = [30, 60, 120, 300].map((seconds) =>
      setTimeout(() => {
        if (!document.hidden) {
          gtag('event', 'time_on_page', {
            seconds,
            page_path: window.location.pathname,
          });
        }
      }, seconds * 1000)
    );

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      document.removeEventListener('click', clickHandler);
      timers.forEach(clearTimeout);
    };
  }, [id, enabled]);

  if (!id || enabled === false) return null;

  return null;
}
