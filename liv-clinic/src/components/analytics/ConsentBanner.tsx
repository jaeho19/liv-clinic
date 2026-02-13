'use client';

import { useState, useEffect } from 'react';

declare global {
  function gtag(...args: unknown[]): void;
}

const CONSENT_KEY = 'liv_analytics_consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Show banner after 1.5s delay (less intrusive)
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function handleAccept() {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
    } catch {}

    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        personalization_storage: 'granted',
      });
    }
    setVisible(false);
  }

  function handleDecline() {
    try {
      localStorage.setItem(CONSENT_KEY, 'denied');
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up"
    >
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white/95 backdrop-blur-md shadow-lg p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 text-sm text-[var(--color-mono)] leading-relaxed">
              <p className="font-medium text-[var(--color-secondary)] mb-1">
                개인정보 보호 안내
              </p>
              <p>
                더 나은 서비스 제공을 위해 쿠키와 분석 도구를 사용합니다.
                {' '}
                <span className="text-[var(--color-mono-light)]">
                  동의하시면 방문 분석 데이터가 수집됩니다.
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm text-[var(--color-mono-light)] hover:text-[var(--color-mono)] transition-colors rounded-lg"
              >
                거부
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors rounded-lg"
              >
                동의
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
