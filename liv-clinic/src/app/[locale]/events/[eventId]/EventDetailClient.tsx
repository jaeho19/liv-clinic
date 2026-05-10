'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { pickLocalized } from '@/lib/i18nFallback';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card } from '@/components/ui';
import { ScrollLink } from '@/components/ui';
import { getEventStatus, TREATMENTS, EventItem } from '@/lib/constants';
import { fetchEventBySlug, fetchPublishedEvents } from '@/lib/eventApi';
import EventCard from '@/components/sections/EventCard';
import EventHero from '@/components/sections/EventHero';

export default function EventDetailClient() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations('events');
  const tNav = useTranslations('nav');
  const locale = useLocale() as Locale;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [event, setEvent] = useState<EventItem | undefined>(undefined);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // API에서 이벤트 로드 (DB 전용 - 관리자에서 삭제한 이벤트 즉시 반영)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. 단일 이벤트 가져오기
      const apiEvent = await fetchEventBySlug(eventId);
      if (cancelled) return;

      if (apiEvent) {
        setEvent(apiEvent);
      }

      // 2. 관련 이벤트를 위해 전체 목록도 로드
      const { events: apiEvents, fromApi } = await fetchPublishedEvents();
      if (cancelled) return;

      if (fromApi) {
        setAllEvents(apiEvents);
      }

      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  // 관련 이벤트 (같은 카테고리, 현재 이벤트 제외)
  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return allEvents.filter(
      (e) => e.id !== event.id && (e.category === event.category || e.category === 'all')
    ).slice(0, 3);
  }, [event, allEvents]);

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
  const getRelatedTreatment = (href: string): { name: string } | null => {
    const parts = href.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const category = parts[0];
    const id = parts[1];
    const treatmentsMap = TREATMENTS as Record<string, Record<string, { name: string }>>;
    const treatment = treatmentsMap[category]?.[id];
    return treatment ? { name: treatment.name } : null;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 bg-background">
        <div className="container-custom">
          <div className="animate-pulse space-y-8">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-[2/3] bg-gray-200 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/4" />
                <div className="h-10 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-32 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-secondary">{pickLocalized(event.title, locale)}</span>
          </nav>
        </div>
      </section>

      {/* Event Detail */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* 포스터 이미지 — EventHero 공통 컴포넌트 */}
            <EventHero
              imageSrc={event.posterImage}
              imageAlt={pickLocalized(event.title, locale)}
              status={status}
              isEnded={isEnded}
              isPromotion={new Date(event.endDate).getFullYear() >= 2099}
            />

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
              <h1 className="text-h2 md:text-h1 text-secondary mb-4">{pickLocalized(event.title, locale)}</h1>

              {/* 기간 (홍보용은 표시 안 함) */}
              {new Date(event.endDate).getFullYear() < 2099 && (
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
              )}

              {/* 설명 */}
              <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
                <h2 className="text-h4 text-secondary mb-3">{t('eventDetails')}</h2>
                <p className="text-body text-mono leading-relaxed">{pickLocalized(event.description, locale)}</p>
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

      {/* 이미지 갤러리 - 모든 이벤트 동일한 세로 스크롤 레이아웃 */}
      {event.galleryImages && event.galleryImages.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-[800px] mx-auto px-4">
            <div className="flex flex-col gap-4">
              {event.galleryImages.map((src, idx) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4 }}
                  className="relative w-full cursor-pointer"
                  onClick={() => setSelectedImage(src)}
                >
                  <Image
                    src={src}
                    alt={`${pickLocalized(event.title, locale)} - ${idx + 1}`}
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
                alt={pickLocalized(event.title, locale)}
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
