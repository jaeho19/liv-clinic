'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { SITE_INFO } from '@/lib/constants';
import {
  primaryMessengerFor,
  buildWhatsAppLink,
  LINE_LINK,
  WECHAT_DEEPLINK,
} from '@/lib/messengerLinks';

// Throttle 훅 - 스크롤 성능 최적화 (Vercel Best Practice)
function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }) as T,
    [callback, delay]
  ) as T;
}

interface StickyCtaBarProps {
  showAfterScroll?: number;
  phoneNumber?: string;
  kakaoUrl?: string;
  consultUrl?: string;
  className?: string;
}

/**
 * 모바일 전용 하단 고정 CTA 바
 * 스크롤 후 표시되며 전화/카카오 버튼 제공
 */
export default function StickyCtaBar({
  showAfterScroll = 500,
  phoneNumber = '02-515-1258',
  kakaoUrl = 'https://pf.kakao.com/_xkxjKxfG/chat',
  consultUrl,
  className = '',
}: StickyCtaBarProps) {
  const t = useTranslations('ui.stickyCta');
  const tCta = useTranslations('stickyCta');
  const tMsg = useTranslations('messengers');
  const locale = useLocale();
  const isKo = locale === 'ko';
  const [isVisible, setIsVisible] = useState(false);

  // 전화: 비-ko는 국제표기(+82)로 다이얼. 두 번째 버튼: ko=카카오, 비-ko=로케일 1순위 메신저.
  const phoneHref = isKo ? phoneNumber : SITE_INFO.phoneInternational;
  const phoneLabel = isKo ? t('phone') : tCta('call');
  const messenger = primaryMessengerFor(locale);
  const secondBtn = isKo
    ? { href: kakaoUrl, label: t('kakao'), bg: 'bg-[#FEE500]', fg: 'text-[#3C1E1E]', external: true }
    : messenger === 'line'
    ? { href: LINE_LINK, label: tCta('line'), bg: 'bg-[#00B900]', fg: 'text-white', external: true }
    : messenger === 'wechat'
    ? { href: WECHAT_DEEPLINK, label: tCta('wechat'), bg: 'bg-[#07C160]', fg: 'text-white', external: false }
    : { href: buildWhatsAppLink(tMsg('whatsappPrefill')), label: tCta('whatsapp'), bg: 'bg-[#25D366]', fg: 'text-white', external: true };

  // Throttled 스크롤 핸들러 (150ms 간격)
  const handleScroll = useThrottle(
    useCallback(() => {
      setIsVisible(window.scrollY > showAfterScroll);
    }, [showAfterScroll]),
    150
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`
            fixed bottom-0 left-0 right-0 z-50
            md:hidden
            backdrop-blur-xl bg-white/95 border-t border-gray-200
            px-4 py-3 safe-area-pb
            ${className}
          `}
        >
          <div className="flex gap-3">
            {/* Phone Button */}
            <a
              href={`tel:${phoneHref}`}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl font-medium min-h-[44px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>{phoneLabel}</span>
            </a>

            {/* Messenger Button (ko=카카오, 그 외=로케일 1순위 메신저) */}
            <a
              href={secondBtn.href}
              target={secondBtn.external ? '_blank' : undefined}
              rel={secondBtn.external ? 'noopener noreferrer' : undefined}
              className={`flex-1 flex items-center justify-center gap-2 ${secondBtn.bg} ${secondBtn.fg} py-3 rounded-xl font-medium min-h-[44px]`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.2.74-.72 2.68-.82 3.1-.13.5.18.49.38.36.16-.1 2.52-1.71 3.54-2.4.78.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              <span>{secondBtn.label}</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
