'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card, ScrollLink } from '@/components/ui';
import { MedicalBlogSection } from '@/components/sections';
import { MEDICAL_QA, TREATMENTS } from '@/lib/constants';

export default function MedicalPage() {
  const t = useTranslations('common');
  const tMedical = useTranslations('medical');
  const tNav = useTranslations('nav');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const stickyHeaderRef = useRef<HTMLElement>(null);

  const categories = [
    { id: 'all', label: tMedical('categories.all') },
    { id: 'lifting', label: tMedical('categories.lifting') },
    { id: 'antiaging', label: tMedical('categories.antiaging') },
    { id: 'laser', label: tMedical('categories.laser') },
    { id: 'general', label: tMedical('categories.general') },
  ];

  const filteredQA = useMemo(() => {
    return MEDICAL_QA.filter((qa) => {
      const matchesCategory = selectedCategory === 'all' || qa.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = useCallback((id: string, element: HTMLElement | null) => {
    const isExpanding = expandedId !== id;
    setExpandedId(expandedId === id ? null : id);

    // 펼쳐질 때만 스크롤 (접을 때는 스크롤하지 않음)
    if (isExpanding && element) {
      // 애니메이션이 시작된 후 스크롤
      setTimeout(() => {
        // 동적으로 sticky 헤더 높이 + 네비게이션 헤더 높이 계산
        const navHeader = document.querySelector('header');
        const navHeight = navHeader?.offsetHeight || 80;
        const stickyHeight = stickyHeaderRef.current?.offsetHeight || 100;
        const totalOffset = navHeight + stickyHeight + 12; // 12px 추가 여백

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - totalOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [expandedId]);

  return (
    <>
      {/* Hero - 모바일에서 여백 축소 */}
      <section className="relative pt-24 pb-10 md:pt-32 md:pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-2 md:mb-4">Medical Info</p>
              <h1 className="text-h1 md:text-display text-secondary mb-3 md:mb-6">{tMedical('title')}</h1>
              <p className="text-body md:text-h4 text-mono leading-relaxed whitespace-pre-line">
                {tMedical('subtitle')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Search & Filter - 모바일에서 여백 축소 */}
      <section
        ref={stickyHeaderRef}
        className="py-4 md:py-8 bg-white border-b border-border sticky top-20 z-30"
      >
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mono-light"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tMedical('searchPlaceholder')}
                className="w-full pl-12 pr-4 py-2.5 md:py-3 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors text-body"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-small font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white'
                      : 'bg-background text-mono hover:bg-primary/10'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Q&A List - 모바일에서 여백 축소 */}
      <section className="py-6 md:py-16 bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-4 md:mb-8">
              <p className="text-small md:text-body text-mono-light">
                {t('total')} <span className="text-primary font-medium">{filteredQA.length}</span> {t('questions')}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            {filteredQA.length === 0 ? (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-mono-light/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-h4 text-mono-light mb-2">{t('noResults')}</p>
                <p className="text-body text-mono-light">{t('tryAnother')}</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredQA.map((qa, index) => (
                  <motion.div
                    key={qa.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card padding="none" hover={false} className="overflow-hidden">
                      {/* Question */}
                      <button
                        onClick={(e) => toggleExpand(qa.id, e.currentTarget.closest('.overflow-hidden'))}
                        className="w-full px-4 py-4 md:px-6 md:py-5 text-left flex items-start justify-between gap-3 md:gap-4 hover:bg-background/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 md:gap-4">
                          <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-serif text-primary text-sm md:text-base">Q</span>
                          </span>
                          <span className="text-sm md:text-body text-secondary font-medium pt-0.5 md:pt-1">
                            {qa.question}
                          </span>
                        </div>
                        <motion.svg
                          className="w-5 h-5 text-mono-light flex-shrink-0 mt-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={{ rotate: expandedId === qa.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                      </button>

                      {/* Answer */}
                      <AnimatePresence>
                        {expandedId === qa.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-border">
                              <div className="flex items-start gap-3 md:gap-4 pt-4 md:pt-5">
                                <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                  <span className="font-serif text-secondary text-sm md:text-base">A</span>
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm md:text-body text-mono leading-relaxed mb-3 md:mb-4">
                                    {qa.answer}
                                  </p>

                                  {/* Tags */}
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {qa.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-1 bg-background text-mono-light rounded text-small"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Related Treatments */}
                                  {qa.relatedTreatments.length > 0 && (
                                    <div className="pt-4 border-t border-border">
                                      <p className="text-small text-mono-light mb-3">
                                        {t('relatedTreatments')}:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {qa.relatedTreatments.map((treatmentId) => {
                                          const treatment =
                                            TREATMENTS.lifting[
                                              treatmentId as keyof typeof TREATMENTS.lifting
                                            ] ||
                                            TREATMENTS.antiaging[
                                              treatmentId as keyof typeof TREATMENTS.antiaging
                                            ] ||
                                            TREATMENTS.laser[
                                              treatmentId as keyof typeof TREATMENTS.laser
                                            ];

                                          if (!treatment) return null;

                                          return (
                                            <Link
                                              key={treatmentId}
                                              href={`/${treatment.category}/${treatment.id}`}
                                            >
                                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-small hover:bg-primary/20 transition-colors cursor-pointer">
                                                {treatment.name}
                                                <svg
                                                  className="w-3 h-3"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                  />
                                                </svg>
                                              </span>
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 네이버 블로그 섹션 */}
      <MedicalBlogSection />

      {/* CTA */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">{tMedical('cta.title')}</h2>
              <p className="text-h4 opacity-80 mb-8">
                {tMedical('cta.subtitle')}
              </p>
              <div className="flex justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-primary text-white hover:bg-secondary"
                  >
                    {tMedical('cta.reservation')}
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10"
                  >
                    {tMedical('cta.call')}
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/lifting/ulthera">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {tNav('ulthera')}
                    </h3>
                    <p className="text-body text-mono-light">Ultherapy Prime</p>
                  </div>
                  <svg
                    className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
            <Link href="/antiaging/botox">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {tNav('botox')}
                    </h3>
                    <p className="text-body text-mono-light">Botox</p>
                  </div>
                  <svg
                    className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
            <ScrollLink href="/contact">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {tNav('contact')}
                    </h3>
                    <p className="text-body text-mono-light">Contact</p>
                  </div>
                  <svg
                    className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </Card>
            </ScrollLink>
          </div>
        </div>
      </section>
    </>
  );
}
