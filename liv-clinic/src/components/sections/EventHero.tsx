'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { EventStatus } from '@/lib/constants';

interface EventHeroProps {
  imageSrc: string;
  imageAlt: string;
  status: EventStatus;
  isEnded: boolean;
  isPromotion?: boolean;
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
}: EventHeroProps) {
  const t = useTranslations('events');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        {/* 포스터를 원본 비율 그대로 표시 — 잘림 없음 */}
        {imageSrc && !imageSrc.includes('placeholder') ? (
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
