'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

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
              href={`tel:${phoneNumber}`}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>전화상담</span>
            </a>

            {/* Kakao Button */}
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] py-3 rounded-xl font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.2.74-.72 2.68-.82 3.1-.13.5.18.49.38.36.16-.1 2.52-1.71 3.54-2.4.78.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              <span>카카오 상담</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
