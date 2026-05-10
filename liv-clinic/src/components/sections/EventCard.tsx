'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { pickLocalized } from '@/lib/i18nFallback';
import { EventItem, getEventStatus, EventStatus } from '@/lib/constants';

interface EventCardProps {
  event: EventItem;
  index?: number;
  featured?: boolean;
}

export default function EventCard({ event, index = 0, featured = false }: EventCardProps) {
  const t = useTranslations('events');
  const locale = useLocale() as Locale;
  const status: EventStatus = getEventStatus(event);
  const isEnded = status === 'ended';
  const isPlaceholder = !event.posterImage || event.posterImage.includes('placeholder');
  const isPromotion = new Date(event.endDate).getFullYear() >= 2099;

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/events/${event.id}`}>
        <div
          className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
            featured ? 'md:col-span-2' : ''
          }`}
        >
          {/* 이미지 영역 */}
          <div className={`relative overflow-hidden ${featured ? 'aspect-[16/9]' : 'aspect-[3/4]'}`}>
            {isPlaceholder ? (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-white/80 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-secondary/60 text-sm font-medium">
                  {locale === 'ko' ? '이미지 준비중' :
                   locale === 'ja' ? '画像準備中' :
                   locale === 'zh' ? '图片准备中' : 'Coming Soon'}
                </span>
              </div>
            ) : (
              <Image
                src={event.posterImage}
                alt={pickLocalized(event.title, locale)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: event.imagePosition || 'center top' }}
                sizes={featured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
              />
            )}

            {/* 상태 배지 — 이미지 우측 상단 */}
            {!isPromotion && (
              <div className="absolute top-4 right-4 z-10">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
                    isEnded
                      ? 'bg-gray-400 text-white'
                      : 'bg-primary text-white'
                  }`}
                >
                  {t(`status.${status}`)}
                </span>
              </div>
            )}
          </div>

          {/* 텍스트 영역 */}
          <div className="p-5">
            <h3 className={`font-medium text-secondary mb-2 ${featured ? 'text-h3' : 'text-h4'} line-clamp-2`}>
              {pickLocalized(event.title, locale)}
            </h3>
            <p className="text-sm text-mono-light line-clamp-2 mb-3">
              {pickLocalized(event.description, locale)}
            </p>
            {!isPromotion && (
              <div className="flex items-center gap-2 text-xs text-mono-light">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
