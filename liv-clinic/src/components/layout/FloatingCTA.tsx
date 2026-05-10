'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { SITE_INFO, SOCIAL_LINKS } from '@/lib/constants';
import { trackContact } from '@/lib/analytics-events';
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
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
    color: 'bg-[#00B900] hover:bg-[#00A000]',
    textColor: 'text-white',
  },
  whatsapp: {
    id: 'whatsapp',
    label: { ko: 'WhatsApp', en: 'WhatsApp', ja: 'WhatsApp', zh: 'WhatsApp' },
    href: SOCIAL_LINKS.whatsapp,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: 'bg-[#25D366] hover:bg-[#1DA851]',
    textColor: 'text-white',
  },
  wechat: {
    id: 'wechat',
    label: { ko: 'WeChat', en: 'WeChat', ja: 'WeChat', zh: '微信' },
    href: '/zh/wechat',
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
  const buttonOrder =
    locale === 'ko' ? BUTTON_ORDER_KO : locale === 'zh' ? BUTTON_ORDER_ZH : BUTTON_ORDER_NON_KO;

  return (
    <div
      className="fixed right-2 sm:right-4 md:right-6 z-40 flex flex-col items-end gap-2"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
    >
      {buttonOrder.map((key, index) => {
        const button = ctaButtons[key];
        const isImageButton = !!button.image;
        const isExternal =
          button.href.startsWith('http') || button.href.startsWith('weixin');

        return (
          <motion.a
            key={button.id}
            href={button.href}
            target={isExternal ? '_blank' : undefined}
            rel={button.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            onClick={() => trackContact(button.id)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center ${
              isImageButton ? 'bg-white overflow-hidden' : `${button.color} ${button.textColor}`
            } transition-all`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={pickLocalized(button.label, locale)}
          >
            {isImageButton && button.image ? (
              <Image
                src={button.image.src}
                alt={button.image.alt}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              button.icon
            )}
          </motion.a>
        );
      })}
    </div>
  );
}
