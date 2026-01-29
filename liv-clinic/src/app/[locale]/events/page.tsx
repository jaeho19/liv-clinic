'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimateOnScroll, Button } from '@/components/ui';
import { ScrollLink } from '@/components/ui';
import EventCard from '@/components/sections/EventCard';
import { EVENTS, getEventStatus, EventCategory } from '@/lib/constants';

type TabType = 'active' | 'ended';

export default function EventsPage() {
  const t = useTranslations('events');
  const locale = useLocale() as 'ko' | 'en' | 'ja' | 'zh';
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');

  const categories: { id: EventCategory; label: string }[] = [
    { id: 'all', label: t('categories.all') },
    { id: 'lifting', label: t('categories.lifting') },
    { id: 'antiaging', label: t('categories.antiaging') },
    { id: 'laser', label: t('categories.laser') },
    { id: 'skincare', label: t('categories.skincare') },
  ];

  // 이벤트 필터링 (배열 순서 유지 - 압토스 실리프팅이 첫 번째)
  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      const status = getEventStatus(event);
      const matchesTab = activeTab === status;
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      return matchesTab && matchesCategory;
    });
  }, [activeTab, selectedCategory]);

  // 카운트
  const activeCount = EVENTS.filter((e) => getEventStatus(e) === 'active').length;
  const endedCount = EVENTS.filter((e) => getEventStatus(e) === 'ended').length;

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
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-background rounded-full">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === 'active'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-mono hover:text-primary'
                }`}
              >
                {t('activeTab')} ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('ended')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === 'ended'
                    ? 'bg-gray-500 text-white shadow-md'
                    : 'text-mono hover:text-secondary'
                }`}
              >
                {t('endedTab')} ({endedCount})
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-secondary text-white'
                      : 'bg-background text-mono hover:bg-secondary/10'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container-custom">
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
                  {activeTab === 'active' ? t('noEvents') : t('noEndedEvents')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeTab}-${selectedCategory}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* All Events - 동일한 세로 긴 레이아웃 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
