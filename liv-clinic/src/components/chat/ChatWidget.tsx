'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trackChatOpen } from '@/lib/analytics-events';
import ChatPanel from './ChatPanel';

interface Props {
  locale: 'en' | 'ja' | 'zh';
}

export default function ChatWidget({ locale }: Props) {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);

  // 방어적 안전장치: ko가 prop으로 들어오면 렌더 차단 (locale='ko' 시 layout에서 마운트 자체를 안 함)
  if ((locale as string) === 'ko') return null;

  return (
    <>
      {/* 토글 버튼 (좌하단) — 터치 타겟 ≥ 48×48 */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => {
            if (!v) trackChatOpen(locale);
            return !v;
          });
        }}
        aria-label={t('openButton')}
        aria-expanded={open}
        className="fixed left-2 sm:left-4 md:left-6 z-40 flex items-center justify-center gap-2 bg-[#b4988d] text-white shadow-lg hover:bg-[#a3877d] active:scale-[0.97] transition-all rounded-full min-w-[48px] min-h-[48px] px-3 sm:px-4 md:px-5"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.39 0-2.71-.27-3.86-.76L3 21l1.4-4.18A8.51 8.51 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="hidden md:inline text-sm font-medium whitespace-nowrap">{t('openButton')}</span>
      </button>

      <ChatPanel locale={locale} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
