'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { SITE_INFO, SOCIAL_LINKS } from '@/lib/constants';

// CTA 버튼 정의
const ctaButtons = {
  phone: {
    id: 'phone',
    label: { ko: '전화상담', en: 'Call', ja: '電話', zh: '电话' },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        />
      </svg>
    ),
    href: `tel:${SITE_INFO.phone}`,
    color: 'bg-primary hover:bg-primary/90',
    textColor: 'text-white',
  },
  kakao: {
    id: 'kakao',
    label: { ko: '카톡상담', en: 'KakaoTalk', ja: 'カカオ', zh: 'KakaoTalk' },
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3c-5.514 0-10 3.476-10 7.75 0 2.783 1.896 5.223 4.748 6.587-.164.609-.533 2.209-.61 2.552-.096.424.157.418.33.303.136-.09 2.168-1.472 3.05-2.07.791.115 1.614.175 2.482.175 5.514 0 10-3.476 10-7.75S17.514 3 12 3z" />
      </svg>
    ),
    href: SOCIAL_LINKS.kakao,
    color: 'bg-[#FEE500] hover:bg-[#E5CF00]',
    textColor: 'text-[#3C1E1E]',
  },
  wechat: {
    id: 'wechat',
    label: { ko: 'WeChat', en: 'WeChat', ja: 'WeChat', zh: '微信' },
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.036 2.533c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
      </svg>
    ),
    href: SOCIAL_LINKS.wechat,
    color: 'bg-[#07C160] hover:bg-[#06AD56]',
    textColor: 'text-white',
  },
  line: {
    id: 'line',
    label: { ko: 'LINE', en: 'LINE', ja: 'LINE', zh: 'LINE' },
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
    href: SOCIAL_LINKS.line,
    color: 'bg-[#00B900] hover:bg-[#00A000]',
    textColor: 'text-white',
  },
};

// 로케일별 버튼 순서 (첫 번째가 메인 CTA)
const buttonOrderByLocale: Record<string, (keyof typeof ctaButtons)[]> = {
  ko: ['kakao', 'phone', 'line', 'wechat'],
  en: ['phone', 'kakao', 'line', 'wechat'],
  ja: ['line', 'phone', 'kakao', 'wechat'],
  zh: ['wechat', 'phone', 'kakao', 'line'],
};

export default function FloatingCTA() {
  const locale = useLocale();
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const buttonOrder = buttonOrderByLocale[locale] || buttonOrderByLocale.ko;
  const [mainButton, ...secondaryButtons] = buttonOrder;
  const main = ctaButtons[mainButton];

  return (
    // bottom 값: 하단 고정 바(QuickConsultBar) 높이(약 76px) + 여유 공간 + safe-area
    <div className="fixed bottom-28 sm:bottom-[100px] right-3 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-3 safe-area-inset-bottom">
      {/* Secondary Buttons - 항상 표시 */}
      <div className="flex flex-col gap-2">
        {secondaryButtons.map((buttonKey, index) => {
          const button = ctaButtons[buttonKey];
          return (
            <motion.a
              key={button.id}
              href={button.href}
              target={button.href.startsWith('http') || button.href.startsWith('weixin') ? '_blank' : undefined}
              rel={button.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center ${button.color} ${button.textColor} transition-all`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={button.label[locale as keyof typeof button.label] || button.label.ko}
            >
              {button.icon}
            </motion.a>
          );
        })}
      </div>

      {/* Main CTA Button - 라벨 포함 */}
      <motion.a
        href={main.href}
        target={main.href.startsWith('http') || main.href.startsWith('weixin') ? '_blank' : undefined}
        rel={main.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`relative flex items-center gap-2 ${main.color} ${main.textColor} rounded-full shadow-lg transition-all pl-3 pr-4 sm:pl-4 sm:pr-5 h-11 sm:h-12`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={main.label[locale as keyof typeof main.label] || main.label.ko}
      >
        {/* Pulse Animation */}
        {showPulse && (
          <motion.span
            className={`absolute inset-0 rounded-full ${main.color.split(' ')[0]}`}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className="relative z-10">{main.icon}</span>
        <span className="font-semibold text-sm relative z-10">
          {main.label[locale as keyof typeof main.label] || main.label.ko}
        </span>
      </motion.a>
    </div>
  );
}
