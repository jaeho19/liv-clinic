'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { SITE_INFO, SOCIAL_LINKS } from '@/lib/constants';
import { trackContact } from '@/lib/analytics-events';
import { buildWhatsAppLink } from '@/lib/messengerLinks';
import WeChatQRModal from '@/components/ui/WeChatQRModal';
import ChannelIcon from '@/components/ui/ChannelIcon';
import type { Locale } from '@/i18n/routing';
import { pickLocalized } from '@/lib/i18nFallback';
type ContactMethod = 'instagram' | 'youtube' | 'phone' | 'kakao' | 'line' | 'whatsapp' | 'wechat';

type CtaButton = {
  id: ContactMethod;
  // ko/en/ja/zh만 정의해도 OK — 신규 locale은 pickLocalized()로 fallback (en → ko).
  label: Partial<Record<Locale, string>>;
  href: string;
  color: string;
  textColor: string;
  icon?: React.ReactNode;
  image?: { src: string; alt: string };
};

const ctaButtons: Record<ContactMethod, CtaButton> = {
  instagram: {
    id: 'instagram',
    label: { ko: '인스타그램', en: 'Instagram', ja: 'インスタグラム', zh: 'Instagram' },
    href: 'https://www.instagram.com/livclinic_after/',
    image: { src: '/images/instagram.png', alt: 'Instagram' },
    color: 'bg-white hover:bg-gray-50',
    textColor: 'text-white',
  },
  youtube: {
    id: 'youtube',
    label: { ko: '유튜브', en: 'YouTube', ja: 'YouTube', zh: 'YouTube' },
    href: SOCIAL_LINKS.youtube,
    image: { src: '/images/youtube.png', alt: 'YouTube' },
    color: 'bg-white hover:bg-gray-50',
    textColor: 'text-white',
  },
  phone: {
    id: 'phone',
    label: { ko: '전화상담', en: 'Call', ja: '電話', zh: '电话' },
    href: `tel:${SITE_INFO.phone}`,
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
    color: 'bg-primary hover:bg-primary/90',
    textColor: 'text-white',
  },
  kakao: {
    id: 'kakao',
    label: { ko: '카톡상담', en: 'KakaoTalk', ja: 'カカオ', zh: 'KakaoTalk' },
    href: SOCIAL_LINKS.kakao,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3c-5.514 0-10 3.476-10 7.75 0 2.783 1.896 5.223 4.748 6.587-.164.609-.533 2.209-.61 2.552-.096.424.157.418.33.303.136-.09 2.168-1.472 3.05-2.07.791.115 1.614.175 2.482.175 5.514 0 10-3.476 10-7.75S17.514 3 12 3z" />
      </svg>
    ),
    color: 'bg-[#FEE500] hover:bg-[#E5CF00]',
    textColor: 'text-[#3C1E1E]',
  },
  line: {
    id: 'line',
    label: { ko: 'LINE', en: 'LINE', ja: 'LINE', zh: 'LINE' },
    href: SOCIAL_LINKS.line,
    icon: <ChannelIcon channel="line" className="w-5 h-5" />,
    color: 'bg-[#00B900] hover:bg-[#00A000]',
    textColor: 'text-white',
  },
  whatsapp: {
    id: 'whatsapp',
    label: { ko: 'WhatsApp', en: 'WhatsApp', ja: 'WhatsApp', zh: 'WhatsApp' },
    href: SOCIAL_LINKS.whatsapp,
    icon: <ChannelIcon channel="whatsapp" className="w-5 h-5" />,
    color: 'bg-[#25D366] hover:bg-[#1DA851]',
    textColor: 'text-white',
  },
  wechat: {
    id: 'wechat',
    label: { ko: 'WeChat', en: 'WeChat', ja: 'WeChat', zh: '微信' },
    // 모바일: weixin:// 앱 딥링크. 데스크톱: QR 모달로 대체(아래 렌더 분기).
    href: SOCIAL_LINKS.wechat,
    image: { src: '/images/wechat-icon.png', alt: 'WeChat' },
    color: 'bg-white hover:bg-gray-50',
    textColor: 'text-white',
  },
};

const BUTTON_ORDER_KO: ContactMethod[] = ['instagram', 'youtube', 'phone', 'kakao'];
// zh: LINE은 중국 본토에서 차단되어 제외, WeChat을 WhatsApp보다 앞에 배치
const BUTTON_ORDER_ZH: ContactMethod[] = ['instagram', 'youtube', 'phone', 'wechat', 'whatsapp'];
const BUTTON_ORDER_NON_KO: ContactMethod[] = [
  'instagram',
  'youtube',
  'phone',
  'line',
  'whatsapp',
];

export default function FloatingCTA() {
  const locale = useLocale() as Locale;
  const t = useTranslations('messengers');
  const buttonOrder =
    locale === 'ko' ? BUTTON_ORDER_KO : locale === 'zh' ? BUTTON_ORDER_ZH : BUTTON_ORDER_NON_KO;

  // 데스크톱(hover+fine pointer) 판정 — WeChat은 데스크톱에서 QR 모달, 모바일에선 딥링크.
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );
  const [wechatOpen, setWechatOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const buttonClass = (button: CtaButton, isImageButton: boolean) =>
    `w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center ${
      isImageButton ? 'bg-white overflow-hidden' : `${button.color} ${button.textColor}`
    } transition-all`;

  return (
    <>
      {/* Pinned physically by owner decision (chat left, socials right, all writing directions) — do not convert to logical properties. */}
      <div
        className="social-contact-links flex flex-wrap justify-center gap-3 px-4 pt-4 pb-44 md:fixed md:right-6 md:z-40 md:flex-col md:items-end md:gap-2 md:p-0"
      >
        {buttonOrder.map((key, index) => {
          const button = ctaButtons[key];
          const isImageButton = !!button.image;
          // M3a: whatsapp 링크를 렌더 시점에 로케일별 prefill로 조립.
          const href = key === 'whatsapp' ? buildWhatsAppLink(t('whatsappPrefill')) : button.href;
          const isHttp = href.startsWith('http');

          const content =
            isImageButton && button.image ? (
              <Image
                src={button.image.src}
                alt={button.image.alt}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              button.icon
            );

          // M3b: WeChat 데스크톱 — 죽은 weixin:// 딥링크 대신 QR 모달을 연다(모바일은 딥링크 유지).
          if (key === 'wechat' && isDesktop) {
            return (
              <motion.button
                key={button.id}
                type="button"
                onClick={() => {
                  trackContact('wechat');
                  setWechatOpen(true);
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={buttonClass(button, isImageButton)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={pickLocalized(button.label, locale)}
              >
                {content}
              </motion.button>
            );
          }

          return (
            <motion.a
              key={button.id}
              href={href}
              target={isHttp ? '_blank' : undefined}
              rel={isHttp ? 'noopener noreferrer' : undefined}
              data-analytics-contact={button.id}
              onClick={() => trackContact(button.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={buttonClass(button, isImageButton)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={pickLocalized(button.label, locale)}
            >
              {content}
            </motion.a>
          );
        })}
      </div>
      <WeChatQRModal open={wechatOpen} onClose={() => setWechatOpen(false)} />
    </>
  );
}
