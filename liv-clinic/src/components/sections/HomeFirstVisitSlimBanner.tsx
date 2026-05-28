'use client';

// Design Ref: §5.1 — Hero 위 슬림 띠배너. 헤더(fixed h-16/sm:h-20) 영역은
// 자체 pt-16 sm:pt-20 으로 비워두어 Header.tsx 무수정 (Plan SC-10 / OD-1 option m).
// Plan SC-1: 11개 로케일 노출 / SC-3: /events/first-visit 진입 경로.

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

/** Design D3 — future slot. v1 에서는 미사용(영구 노출). */
export type HomeFirstVisitSlimBannerProps = {
  dismissible?: boolean;
};

export default function HomeFirstVisitSlimBanner() {
  const t = useTranslations('firstVisit');

  return (
    <Link
      href="/events/first-visit"
      aria-label={`${t('slimBanner.text')} – ${t('slimBanner.cta')}`}
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      {/* 헤더 fixed 영역만큼 위 여백 — 헤더는 transparent 상태이므로 비침 OK */}
      <div className="pt-16 sm:pt-20">
        <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 transition-colors duration-200 group-hover:from-primary/20 group-hover:via-primary/15">
          <div className="container-custom flex items-center justify-center gap-2.5 py-3 sm:gap-3.5 md:py-4">
            {/* eyebrow sparkle — OD-3: 이모지 미사용, 인라인 SVG */}
            <span aria-hidden="true" className="shrink-0 text-primary">
              <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
              </svg>
            </span>

            {/* 메인 카피 — 모바일은 textShort 폴백 (R5 완화) */}
            <span className="hidden text-base font-medium text-secondary sm:inline md:text-lg">
              {t('slimBanner.text')}
            </span>
            <span className="truncate text-base font-medium text-secondary sm:hidden">
              {t('slimBanner.textShort')}
            </span>

            <span className="whitespace-nowrap text-base font-semibold text-primary md:text-lg">
              {t('slimBanner.cta')}
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
          </div>
        </div>
      </div>
    </Link>
  );
}
