'use client';

// Design Ref: §5.1 — Hero 위 슬림 띠배너. 헤더(fixed h-16/sm:h-20) 영역은
// 자체 pt-16 sm:pt-20 으로 비워두어 Header.tsx 무수정 (Plan SC-10 / OD-1 option m).
// 채팅 지원 로케일(CHAT_VISITOR_LOCALES = ko 제외 해외 10개): 라이브챗 직접예약 5% 배너(클릭 시 채팅 오픈)
// / ko: 기존 첫방문 배너(/events/first-visit 링크).

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { CHAT_VISITOR_LOCALES, openLivChat } from '@/lib/chat/chatApi';
import { trackPromoClick } from '@/lib/analytics-events';

/** Design D3 — future slot. v1 에서는 미사용(영구 노출). */
export type HomeFirstVisitSlimBannerProps = {
  dismissible?: boolean;
};

const WRAPPER_CLASS =
  'group block w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary';

function SlimBannerBody({
  text,
  textShort,
  cta,
}: {
  text: string;
  textShort: string;
  cta: string;
}) {
  return (
    /* 헤더 fixed 영역만큼 위 여백 — 헤더는 transparent 상태이므로 비침 OK */
    <span className="block pt-16 sm:pt-20">
      <span className="block bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 transition-colors duration-200 group-hover:from-primary/20 group-hover:via-primary/15">
        <span className="block container-custom flex items-center justify-center gap-2.5 py-3 sm:gap-3.5 md:py-4">
          {/* eyebrow sparkle — OD-3: 이모지 미사용, 인라인 SVG */}
          <span aria-hidden="true" className="shrink-0 text-primary">
            <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
            </svg>
          </span>

          {/* 메인 카피 — 모바일은 textShort 폴백 (R5 완화) */}
          <span className="hidden text-base font-medium text-secondary sm:inline md:text-lg">
            {text}
          </span>
          <span className="truncate text-base font-medium text-secondary sm:hidden">
            {textShort}
          </span>

          <span className="whitespace-nowrap text-base font-semibold text-primary md:text-lg">
            {cta}
          </span>

          {/* 화살표 — RTL 자동 반전 */}
          <span
            aria-hidden="true"
            className="shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5-5 5M5 12h13" />
            </svg>
          </span>
        </span>
      </span>
    </span>
  );
}

export default function HomeFirstVisitSlimBanner() {
  const t = useTranslations('firstVisit');
  const locale = useLocale();

  // 채팅 지원 로케일: 첫방문 47% 대신 라이브챗 직접예약 5% 혜택으로 교체
  if ((CHAT_VISITOR_LOCALES as readonly string[]).includes(locale)) {
    return (
      <button
        type="button"
        onClick={() => {
          trackPromoClick('chat_direct_booking', 'home_slim_banner_click');
          openLivChat();
        }}
        aria-label={`${t('slimBanner.chatText')} – ${t('slimBanner.chatCta')}`}
        className={WRAPPER_CLASS}
      >
        <SlimBannerBody
          text={t('slimBanner.chatText')}
          textShort={t('slimBanner.chatTextShort')}
          cta={t('slimBanner.chatCta')}
        />
      </button>
    );
  }

  return (
    <Link
      href="/events/first-visit"
      aria-label={`${t('slimBanner.text')} – ${t('slimBanner.cta')}`}
      className={WRAPPER_CLASS}
    >
      <SlimBannerBody
        text={t('slimBanner.text')}
        textShort={t('slimBanner.textShort')}
        cta={t('slimBanner.cta')}
      />
    </Link>
  );
}
