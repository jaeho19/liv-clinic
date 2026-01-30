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
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={800}
          height={1200}
          className="w-full h-auto"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

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
