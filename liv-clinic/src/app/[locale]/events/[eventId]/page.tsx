'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card } from '@/components/ui';
import { ScrollLink } from '@/components/ui';
import { EVENTS, getEventStatus, TREATMENTS } from '@/lib/constants';
import EventCard from '@/components/sections/EventCard';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations('events');
  const tNav = useTranslations('nav');
  const locale = useLocale() as 'ko' | 'en' | 'ja' | 'zh';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 현재 이벤트 찾기
  const event = useMemo(() => {
    return EVENTS.find((e) => e.id === eventId);
  }, [eventId]);

  // 관련 이벤트 (같은 카테고리, 현재 이벤트 제외)
  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return EVENTS.filter(
      (e) => e.id !== event.id && (e.category === event.category || e.category === 'all')
    ).slice(0, 3);
  }, [event]);

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  // 관련 시술 정보 가져오기
  const getRelatedTreatment = (href: string) => {
    const parts = href.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const category = parts[0] as keyof typeof TREATMENTS;
    const id = parts[1];
    return TREATMENTS[category]?.[id as keyof (typeof TREATMENTS)[typeof category]];
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h2 text-secondary mb-4">
            {locale === 'ko' ? '이벤트를 찾을 수 없습니다' :
             locale === 'ja' ? 'イベントが見つかりません' :
             locale === 'zh' ? '未找到活动' : 'Event not found'}
          </h1>
          <Link href="/events">
            <Button variant="primary">{t('backToList')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = getEventStatus(event);
  const isEnded = status === 'ended';

  return (
    <>
      {/* Breadcrumb */}
      <section className="pt-20 md:pt-24 bg-background">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-sm text-mono-light py-4">
            <Link href="/" className="hover:text-primary transition-colors">
              {locale === 'ko' ? '홈' : locale === 'ja' ? 'ホーム' : locale === 'zh' ? '首页' : 'Home'}
            </Link>
            <span>/</span>
            <Link href="/events" className="hover:text-primary transition-colors">
              {t('title')}
            </Link>
            <span>/</span>
            <span className="text-secondary">{event.title[locale]}</span>
          </nav>
        </div>
      </section>

      {/* Event Detail */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* 포스터 이미지 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl ${isEnded ? 'grayscale' : ''}`}>
                <Image
                  src={event.posterImage}
                  alt={event.title[locale]}
                  fill
                  className="object-cover"
                  priority
                />
                {/* 상태 배지 */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      isEnded ? 'bg-gray-500 text-white' : 'bg-primary text-white'
                    }`}
                  >
                    {t(`status.${status}`)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 이벤트 정보 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col"
            >
              {/* 카테고리 */}
              {event.category !== 'all' && (
                <span className="inline-block w-fit px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm mb-4">
                  {t(`categories.${event.category}`)}
                </span>
              )}

              {/* 제목 */}
              <h1 className="text-h2 md:text-h1 text-secondary mb-4">{event.title[locale]}</h1>

              {/* 기간 */}
              <div className="flex items-center gap-3 text-mono mb-6">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-h4">
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </span>
              </div>

              {/* 설명 */}
              <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
                <h2 className="text-h4 text-secondary mb-3">{t('eventDetails')}</h2>
                <p className="text-body text-mono leading-relaxed">{event.description[locale]}</p>
              </div>

              {/* 관련 시술 */}
              {event.relatedTreatments && event.relatedTreatments.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-h4 text-secondary mb-4">{t('relatedTreatments')}</h2>
                  <div className="flex flex-wrap gap-3">
                    {event.relatedTreatments.map((href) => {
                      const treatment = getRelatedTreatment(href);
                      if (!treatment) return null;
                      return (
                        <Link key={href} href={href}>
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors cursor-pointer">
                            {treatment.name}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA 버튼 */}
              <div className="flex flex-wrap gap-4 mt-auto">
                {!isEnded && (
                  <ScrollLink href="/contact">
                    <Button variant="primary" size="lg" className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {t('bookNow')}
                    </Button>
                  </ScrollLink>
                )}
                <a href="tel:02-797-2773">
                  <Button variant="outline" size="lg" className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    02-797-2773
                  </Button>
                </a>
              </div>

              {/* 목록으로 돌아가기 */}
              <Link href="/events" className="mt-6 inline-flex items-center gap-2 text-mono-light hover:text-primary transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('backToList')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 이미지 갤러리 (갤러리 이미지가 있는 경우에만 표시) */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          {/* 압토스 실리프팅: 심플 세로 스크롤 레이아웃 */}
          {event.id === 'aptos-thread-lifting' ? (
            <div className="max-w-[800px] mx-auto px-4">
              <div className="flex flex-col gap-4">
                {event.galleryImages.map((src, idx) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full"
                  >
                    <Image
                      src={src}
                      alt={`${event.title[locale]} - ${idx + 1}`}
                      width={800}
                      height={1000}
                      className="w-full h-auto rounded-lg"
                      sizes="(max-width: 800px) 100vw, 800px"
                      priority={idx < 2}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* 기본 갤러리 레이아웃 (2열 그리드) */
            <div className="container-custom">
              <AnimateOnScroll>
                <h2 className="text-h2 text-secondary mb-8">
                  {locale === 'ko' ? '이벤트 상세 이미지' :
                   locale === 'ja' ? 'イベント詳細画像' :
                   locale === 'zh' ? '活动详细图片' : 'Event Gallery'}
                </h2>
              </AnimateOnScroll>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {event.galleryImages.map((src, idx) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-300"
                    onClick={() => setSelectedImage(src)}
                  >
                    <Image
                      src={src}
                      alt={`${event.title[locale]} - ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-secondary shadow-lg">
                        {locale === 'ko' ? '크게 보기' :
                         locale === 'ja' ? '拡大表示' :
                         locale === 'zh' ? '放大查看' : 'View larger'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 이미지 라이트박스 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt={event.title[locale]}
                width={1200}
                height={900}
                className="object-contain w-full h-full max-h-[85vh] rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-primary transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* 갤러리 네비게이션 */}
              {event.galleryImages && event.galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {event.galleryImages.map((src, idx) => (
                    <button
                      key={src}
                      onClick={() => setSelectedImage(src)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        selectedImage === src ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 관련 이벤트 */}
      {relatedEvents.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container-custom">
            <AnimateOnScroll>
              <h2 className="text-h2 text-secondary mb-8">
                {locale === 'ko' ? '다른 이벤트' :
                 locale === 'ja' ? '他のイベント' :
                 locale === 'zh' ? '其他活动' : 'Other Events'}
              </h2>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((relatedEvent, index) => (
                <EventCard key={relatedEvent.id} event={relatedEvent} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h2 md:text-h1 mb-4">
                {locale === 'ko' ? '궁금한 점이 있으신가요?' :
                 locale === 'ja' ? 'ご質問がありますか？' :
                 locale === 'zh' ? '有疑问吗？' : 'Have questions?'}
              </h2>
              <p className="text-h4 opacity-80 mb-8">
                {locale === 'ko' ? '전문 상담사가 친절하게 답변해드립니다' :
                 locale === 'ja' ? '専門カウンセラーが丁寧にお答えします' :
                 locale === 'zh' ? '专业顾问将为您详细解答' : 'Our specialists will answer your questions'}
              </p>
              <ScrollLink href="/contact">
                <Button variant="primary" size="lg" className="bg-primary text-white hover:bg-primary/90">
                  {t('bookNow')}
                </Button>
              </ScrollLink>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
