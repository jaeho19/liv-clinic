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
  const previousPath = useRef(pathname);

  // SPA route change → re-send pageview
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (enabled !== false && typeof gtag === 'function' && id) {
      gtag('config', id, { page_path: pathname });
    }
  }, [pathname, id, enabled]);

  // Enhanced event tracking (scroll depth, outbound links, phone clicks, time on page)
  useEffect(() => {
    if (!id || enabled === false) return;
    return setupPageEngagementTracking(pathname);
  }, [pathname, id, enabled]);

  return null;
}

/** One page's listeners and timers, with a matching cleanup for navigation/remounts. */
export function setupPageEngagementTracking(pagePath: string) {
  // Scroll depth tracking (25%, 50%, 75%, 90%)
  const scrollThresholds = [25, 50, 75, 90];
  const scrollFired: Record<number, boolean> = {};
  const scrollHandler = () => {
    if (typeof gtag !== 'function') return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const scrollPercent = Math.round((window.scrollY / docHeight) * 100);
    scrollThresholds.forEach((threshold) => {
      if (scrollPercent >= threshold && !scrollFired[threshold]) {
        scrollFired[threshold] = true;
        gtag('event', 'scroll_depth', {
          percent_scrolled: threshold,
          page_path: pagePath,
        });
      }
    });
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });

  // Outbound link + phone click tracking
  const clickHandler = (e: MouseEvent) => {
    if (typeof gtag !== 'function') return;
    const target = e.target as Element | null;
    const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link) return;

    if (link.href.startsWith('tel:')) {
      // These links already call trackContact in their React click handler.
      if (link.dataset.analyticsContact === 'phone') return;
      gtag('event', 'contact', {
        method: 'phone',
        page_path: pagePath,
      });
    } else if (['http:', 'https:'].includes(link.protocol) && link.hostname !== window.location.hostname) {
      gtag('event', 'click', {
        event_category: 'outbound',
        // Drop query/fragment text, including prefilled messages and email addresses.
        event_label: `${link.origin}${link.pathname}`,
        page_path: pagePath,
        transport_type: 'beacon',
      });
    }
  };
  document.addEventListener('click', clickHandler);

  // Time on page tracking (30s, 60s, 120s, 300s)
  const timers = [30, 60, 120, 300].map((seconds) =>
    setTimeout(() => {
      if (!document.hidden && typeof gtag === 'function') {
        gtag('event', 'time_on_page', {
          seconds,
          page_path: pagePath,
        });
      }
    }, seconds * 1000)
  );

  return () => {
    window.removeEventListener('scroll', scrollHandler);
    document.removeEventListener('click', clickHandler);
    timers.forEach(clearTimeout);
  };
}
