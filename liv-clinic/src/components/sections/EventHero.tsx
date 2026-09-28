'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { EventStatus } from '@/lib/constants';

interface EventHeroProps {
  imageSrc: string;
  imageAlt: string;
  status: EventStatus;
  isEnded: boolean;
  isPromotion?: boolean;
  /**
   * 포스터를 새 탭에서 원본 크기로 보는 경로(로케일 접두사 없음, 예: `/events/<slug>/poster`).
   * 상세 갤러리 없이 포스터 1장에 모든 내용이 들어 있는 이벤트에서만 넘긴다 — 2단 레이아웃의
   * 포스터(약 600px)로는 글자가 작아 읽기 어렵다(2026-09-28 10월 프로모션). 없으면 포스터는 링크가 아니다.
   */
  zoomHref?: string;
}

/**
 * EventHero — 이벤트 상세 페이지 포스터 이미지 컴포넌트
 *
 * 모든 이벤트에서 동일한 레이아웃을 사용하며,
 * 포스터를 원본 비율 그대로 표시 (잘림 없음).
 */
export default function EventHero({
  imageSrc,
  imageAlt,
  status,
  isEnded,
  isPromotion = false,
  zoomHref,
}: EventHeroProps) {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');

  const hasPoster = Boolean(imageSrc) && !imageSrc.includes('placeholder');
  const zoomable = hasPoster && Boolean(zoomHref);

  // 포스터를 원본 비율 그대로 표시 — 잘림 없음
  const poster = hasPoster ? (
    <Image
      src={imageSrc}
      alt={imageAlt}
      width={800}
      height={1200}
      className="w-full h-auto"
      sizes="(max-width: 1024px) 100vw, 50vw"
      priority
    />
  ) : (
    <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex items-center justify-center">
      <div className="text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-secondary/50 text-sm">{imageAlt}</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        {zoomable ? (
          // 새 탭(target=_blank)이라 next/link 의 클라이언트 내비게이션·프리페치는 쓰지 않는다.
          <Link
            href={zoomHref!}
            target="_blank"
            rel="noopener"
            prefetch={false}
            aria-label={tCommon('viewLarger', { label: imageAlt })}
            className="group block cursor-zoom-in"
          >
            {poster}
            {/* 「크게 보기」 배지 — 호버가 없는 모바일에서도 링크임을 알 수 있게 항상 표시 */}
            <span className="pointer-events-none absolute bottom-4 end-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3.5 py-2 text-sm font-medium text-white shadow-md backdrop-blur-sm transition-colors group-hover:bg-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 7.5v6m-3-3h6M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
              </svg>
              {t('viewLarger')}
            </span>
          </Link>
        ) : (
          poster
        )}

        {/* 상태 배지 (홍보용은 표시 안 함) */}
        {!isPromotion && (
          <div className="absolute top-4 left-4 z-10">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                isEnded ? 'bg-gray-400 text-white' : 'bg-primary text-white'
              }`}
            >
              {t(`status.${status}`)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
