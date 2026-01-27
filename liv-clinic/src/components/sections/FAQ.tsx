'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AnimateOnScroll } from '@/components/ui';
import { SOCIAL_LINKS } from '@/lib/constants';

// 음성검색 최적화 FAQ 아이템 인터페이스
interface FAQItem {
  question: string;
  answer: string;
  // 음성검색용 한 문장 정답 (선택)
  shortAnswer?: string;
  // 구어체 질문 변형 (선택)
  questionVariants?: string[];
}

interface FAQProps {
  category?: 'general' | 'treatment' | 'reservation' | 'aftercare';
  // 외부에서 커스텀 FAQ 데이터 전달 가능 (MEDICAL_QA 등)
  customItems?: FAQItem[];
  // 섹션 제목 커스터마이징
  title?: string;
  subtitle?: string;
}

export default function FAQ({
  category = 'general',
  customItems,
  title,
  subtitle
}: FAQProps) {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  // 외부 데이터가 있으면 사용, 없으면 번역 파일 데이터 사용
  const faqItems: FAQItem[] = customItems || [
    { question: t('items.q1'), answer: t('items.a1') },
    { question: t('items.q2'), answer: t('items.a2') },
    { question: t('items.q3'), answer: t('items.a3') },
    { question: t('items.q4'), answer: t('items.a4') },
    { question: t('items.q5'), answer: t('items.a5') },
    { question: t('items.q6'), answer: t('items.a6') },
    { question: t('items.q7'), answer: t('items.a7') },
    { question: t('items.q8'), answer: t('items.a8') },
  ];

  // useCallback으로 메모이제이션 - 불필요한 리렌더 방지 (Vercel Best Practice)
  const toggleItem = useCallback((index: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const isAllExpanded = openIndices.size === faqItems.length;
  const toggleAll = () => {
    if (isAllExpanded) {
      setOpenIndices(new Set());
    } else {
      setOpenIndices(new Set(faqItems.map((_, i) => i)));
    }
  };

  const isOpen = (index: number) => openIndices.has(index);

  return (
    <section className="section-gap bg-background">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <p className="font-serif text-h3 text-primary mb-4">FAQ</p>
            <h2 className="text-h1 text-secondary mb-4">{title || t('title')}</h2>
            <p className="text-body text-mono-light max-w-2xl mx-auto">
              {subtitle || t('subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="max-w-3xl mx-auto">
          {/* Toggle All Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleAll}
              className="text-sm text-mono-light hover:text-primary transition-colors"
            >
              {isAllExpanded ? tCommon('collapseAll') : tCommon('expandAll')}
            </button>
          </div>

          {faqItems.map((item, index) => (
            <AnimateOnScroll key={index} delay={index * 0.05}>
              <div className="border-b border-border last:border-b-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full py-6 flex items-center justify-between text-left group"
                  aria-expanded={isOpen(index)}
                >
                  <span className={`text-h4 transition-colors pr-8 ${isOpen(index) ? 'text-primary' : 'text-secondary group-hover:text-primary'}`}>
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen(index) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen(index) ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </motion.span>
                </button>

                <AnimatePresence>
                  {isOpen(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pr-16 faq-answer">
                        {/* 음성검색용 한 문장 정답 (있는 경우 먼저 표시) */}
                        {item.shortAnswer && (
                          <p className="short-answer text-body text-primary font-medium mb-3 pb-3 border-b border-primary/20">
                            {item.shortAnswer}
                          </p>
                        )}
                        {/* 상세 답변 */}
                        <p className="text-body text-mono leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Contact CTA */}
        <AnimateOnScroll>
          <div className="mt-12 text-center">
            <p className="text-body text-mono-light mb-4">{t('moreQuestions')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {t('callUs')}
              </a>
              <a
                href={SOCIAL_LINKS.kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FEE500] text-[#3C1E1E] rounded-lg hover:bg-[#F6DC00] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.652 1.783 4.985 4.47 6.347-.145.53-.529 1.925-.606 2.226-.095.373.137.368.287.268.118-.079 1.878-1.238 2.645-1.745.387.055.783.084 1.204.084 5.523 0 10-3.463 10-7.691C20 6.463 17.523 3 12 3z" />
                </svg>
                {t('onlineConsult')}
              </a>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
