'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, ScrollLink } from '@/components/ui';

interface Treatment {
  id: string;
  name: string;
  nameEn: string;
  technology: string;
  duration: string;
  anesthesia: string;
  recovery: string;
  results: string;
  price: string;
  href: string;
}

const liftingTreatments: Treatment[] = [
  {
    id: 'ulthera',
    name: '울쎄라피 프라임',
    nameEn: 'Ultherapy Prime',
    technology: 'HIFU',
    duration: '60-90분',
    anesthesia: '마취 크림',
    recovery: '없음',
    results: '1-2년',
    price: '프리미엄',
    href: '/lifting/ulthera',
  },
  {
    id: 'thermage',
    name: '써마지 FLX',
    nameEn: 'Thermage',
    technology: 'RF',
    duration: '45-60분',
    anesthesia: '무마취',
    recovery: '없음',
    results: '1-2년',
    price: '프리미엄',
    href: '/lifting/thermage',
  },
  {
    id: 'density',
    name: '덴서티',
    nameEn: 'Density',
    technology: 'HIFU+RF',
    duration: '40-60분',
    anesthesia: '선택',
    recovery: '없음',
    results: '6개월-1년',
    price: '중간',
    href: '/lifting/density',
  },
  {
    id: 'shurink',
    name: '슈링크',
    nameEn: 'Shurink',
    technology: 'HIFU',
    duration: '30-45분',
    anesthesia: '선택',
    recovery: '없음',
    results: '3-6개월',
    price: '합리적',
    href: '/lifting/shurink',
  },
  {
    id: 'inmode',
    name: '인모드',
    nameEn: 'InMode',
    technology: 'RF+니들',
    duration: '30-90분',
    anesthesia: '시술별 상이',
    recovery: '0-5일',
    results: '6개월-1년',
    price: '시술별 상이',
    href: '/lifting/inmode',
  },
  {
    id: 'thread',
    name: '실리프팅',
    nameEn: 'Thread',
    technology: '녹는실',
    duration: '30-60분',
    anesthesia: '국소 마취',
    recovery: '3-7일',
    results: '1-2년',
    price: '중간',
    href: '/lifting/thread',
  },
];

export default function TreatmentComparison() {
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);

  return (
    <section className="section-gap bg-white">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <p className="font-serif text-h3 text-primary mb-4">Compare</p>
            <h2 className="text-h1 text-secondary mb-4">리프팅 시술 비교</h2>
            <p className="text-body text-mono-light max-w-2xl mx-auto">
              나에게 맞는 리프팅 시술을 찾아보세요
            </p>
          </div>
        </AnimateOnScroll>

        {/* Desktop Table */}
        <AnimateOnScroll>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background">
                  <th className="py-4 px-4 text-left text-sm font-medium text-mono-light border-b border-border">시술명</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">원리</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">시술 시간</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">마취</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">다운타임</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">효과 지속</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">가격대</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border"></th>
                </tr>
              </thead>
              <tbody>
                {liftingTreatments.map((treatment, index) => (
                  <motion.tr
                    key={treatment.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-background/50 transition-colors"
                  >
                    <td className="py-5 px-4 border-b border-border">
                      <div>
                        <span className="font-medium text-secondary">{treatment.name}</span>
                        <span className="ml-2 text-sm text-mono-light">{treatment.nameEn}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center border-b border-border">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        {treatment.technology}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{treatment.duration}</td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{treatment.anesthesia}</td>
                    <td className="py-5 px-4 text-center border-b border-border">
                      <span className={treatment.recovery === '없음' ? 'text-green-600' : 'text-mono'}>
                        {treatment.recovery}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{treatment.results}</td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{treatment.price}</td>
                    <td className="py-5 px-4 text-center border-b border-border">
                      <Link
                        href={treatment.href}
                        className="text-primary hover:text-secondary transition-colors text-sm font-medium"
                      >
                        자세히 →
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateOnScroll>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {liftingTreatments.map((treatment, index) => (
            <AnimateOnScroll key={treatment.id} delay={index * 0.05}>
              <div
                className={`border border-border rounded-xl overflow-hidden transition-all ${
                  selectedTreatment === treatment.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <button
                  onClick={() => setSelectedTreatment(
                    selectedTreatment === treatment.id ? null : treatment.id
                  )}
                  className="w-full p-4 flex items-center justify-between bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {treatment.technology}
                    </span>
                    <div className="text-left">
                      <span className="font-medium text-secondary">{treatment.name}</span>
                      <span className="ml-2 text-sm text-mono-light">{treatment.nameEn}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-mono-light transition-transform ${
                      selectedTreatment === treatment.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {selectedTreatment === treatment.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-background/50"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">시술 시간</span>
                        <span className="text-sm text-mono">{treatment.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">마취</span>
                        <span className="text-sm text-mono">{treatment.anesthesia}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">다운타임</span>
                        <span className={`text-sm ${treatment.recovery === '없음' ? 'text-green-600' : 'text-mono'}`}>
                          {treatment.recovery}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">효과 지속</span>
                        <span className="text-sm text-mono">{treatment.results}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">가격대</span>
                        <span className="text-sm text-mono">{treatment.price}</span>
                      </div>
                      <div className="pt-2">
                        <Link
                          href={treatment.href}
                          className="block w-full text-center py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll>
          <div className="mt-10 text-center">
            <p className="text-mono-light mb-4">어떤 시술이 적합한지 궁금하신가요?</p>
            <ScrollLink
              href="/contact"
              className="inline-block btn-primary"
            >
              무료 상담 받기
            </ScrollLink>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
