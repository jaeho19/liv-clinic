'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimateOnScroll, Button } from '@/components/ui';
import { ScrollLink } from '@/components/ui';
import EventCard from '@/components/sections/EventCard';
import { getEventStatus, EventItem } from '@/lib/constants';
import { fetchPublishedEvents } from '@/lib/eventApi';

type FilterStatus = 'all' | 'active' | 'ended';

export default function EventsPage() {
  const t = useTranslations('events');
  const locale = useLocale() as 'ko' | 'en' | 'ja' | 'zh';
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // API에서 이벤트 로드 (DB 전용 - 관리자에서 삭제한 이벤트 즉시 반영)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { events: apiEvents, fromApi } = await fetchPublishedEvents();
      if (cancelled) return;

      if (fromApi) {
        setAllEvents(apiEvents);
      } else {
        setLoadError(true);
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // 카운트
  const activeCount = allEvents.filter((e) => getEventStatus(e) === 'active').length;
  const endedCount = allEvents.filter((e) => getEventStatus(e) === 'ended').length;

  // 필터 탭 정의
  const filterTabs: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: t('allTab'), count: allEvents.length },
    { id: 'active', label: t('activeTab'), count: activeCount },
    { id: 'ended', label: t('endedTab'), count: endedCount },
  ];

  // 필터링 + 최신순 정렬 (startDate 내림차순)
  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((event) => {
        if (filterStatus === 'all') return true;
        return getEventStatus(event) === filterStatus;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [filterStatus, allEvents]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h4 md:text-h3 text-primary mb-2">Events</p>
              <h1 className="text-h2 md:text-h1 text-secondary mb-4">{t('title')}</h1>
              <p className="text-body md:text-h4 text-mono leading-relaxed">
                {t('subtitle')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-6 bg-white border-b border-border sticky top-16 z-30">
        <div className="container-custom">
          <div className="flex gap-2 p-1 bg-background rounded-full w-fit">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  filterStatus === tab.id
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-mono hover:text-secondary'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container-custom">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto mb-4 text-mono-light/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-h4 text-mono-light mb-4">
                {locale === 'ko' ? '이벤트를 불러오는 중 오류가 발생했습니다' :
                 locale === 'ja' ? 'イベントの読み込み中にエラーが発生しました' :
                 locale === 'zh' ? '加载活动时出错' : 'Error loading events'}
              </p>
              <button
                onClick={() => { setIsLoading(true); setLoadError(false); fetchPublishedEvents().then(({ events, fromApi }) => { if (fromApi) setAllEvents(events); else setLoadError(true); setIsLoading(false); }); }}
                className="px-6 py-2.5 bg-secondary text-white rounded-full text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                {locale === 'ko' ? '다시 시도' : locale === 'ja' ? '再試行' : locale === 'zh' ? '重试' : 'Retry'}
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredEvents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <svg
                    className="w-20 h-20 mx-auto mb-6 text-mono-light/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-h4 text-mono-light mb-2">
                    {t('noEvents')}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={filterStatus}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h2 md:text-h1 mb-4">
                {locale === 'ko' ? '맞춤 상담을 원하시나요?' :
                 locale === 'ja' ? 'カスタム相談をご希望ですか？' :
                 locale === 'zh' ? '需要定制咨询吗？' : 'Looking for personalized consultation?'}
              </h2>
              <p className="text-h4 opacity-80 mb-8">
                {locale === 'ko' ? '전문 상담사가 맞춤형 시술을 추천해드립니다' :
                 locale === 'ja' ? '専門カウンセラーがカスタマイズされた施術をお勧めします' :
                 locale === 'zh' ? '专业顾问将为您推荐定制项目' : 'Our specialists will recommend customized treatments for you'}
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <ScrollLink href="/contact">
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {t('bookNow')}
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10"
                  >
                    02-797-2773
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
