'use client';

import { useTranslations } from 'next-intl';
import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll } from '@/components/ui';
import { LASER_EQUIPMENT, LASER_CATEGORIES } from '@/lib/constants';

// TypeScript interfaces for translation data
interface StatItem {
  label: string;
  value: string;
  desc: string;
}

interface CategoryItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  equipment: string[];
  icon: string;
}

interface EquipmentItem {
  name: string;
  nameKo: string;
  wavelength: string;
  feature: string;
  targets: string[];
  highlight: boolean;
}

interface SynergyBenefit {
  title: string;
  desc: string;
}

interface ProcessStep {
  step: number;
  title: string;
  desc: string;
}

interface FAQItem {
  q: string;
  a: string;
}

// 피부 고민별 카테고리 카드
interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    href: string;
    equipment: string[];
    icon: string;
  };
  index: number;
  viewMoreLabel: string;
}

const CategoryCard = ({ category, index, viewMoreLabel }: CategoryCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
  >
    <Link href={category.href}>
      <div className="group relative bg-white rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:shadow-lg transition-all h-full">
        {/* 아이콘 */}
        <div className="text-4xl mb-4">{category.icon}</div>

        {/* 카테고리명 */}
        <h3 className="text-xl font-bold text-[var(--color-secondary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-[var(--color-mono-light)] mb-3">{category.nameEn}</p>

        {/* 설명 */}
        <p className="text-sm text-[var(--color-mono)] mb-4 leading-relaxed">
          {category.description}
        </p>

        {/* 사용 장비 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {category.equipment.map((eq, idx) => (
            <span
              key={idx}
              className="text-xs bg-[var(--color-background)] px-2 py-1 rounded text-[var(--color-mono-light)]"
            >
              {eq}
            </span>
          ))}
        </div>

        {/* 화살표 */}
        <div className="flex items-center text-[var(--color-primary)] text-sm font-medium">
          <span>{viewMoreLabel}</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  </motion.div>
);

// 장비 카드 컴포넌트
interface EquipmentCardProps {
  name: string;
  nameKo: string;
  wavelength: string;
  feature: string;
  targets: string[];
  highlight?: boolean;
  labels: {
    wavelength: string;
    feature: string;
    indications: string;
  };
}

const EquipmentCard = ({ name, nameKo, wavelength, feature, targets, highlight = false, labels }: EquipmentCardProps) => (
  <motion.div
    className={`relative rounded-2xl p-6 h-full ${
      highlight
        ? 'bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border-2 border-[var(--color-primary)]/30'
        : 'bg-white border border-[var(--color-border)]'
    }`}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
  >
    {highlight && (
      <div className="absolute -top-3 right-6 bg-[var(--color-primary)] text-white text-xs font-medium px-3 py-1 rounded-full">
        PREMIUM
      </div>
    )}

    <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">{nameKo}</h4>
    <p className="text-sm text-[var(--color-mono-light)] mb-4">{name}</p>

    <div className="space-y-3 mb-4">
      <div>
        <span className="text-xs text-[var(--color-mono-light)]">{labels.wavelength}</span>
        <p className="text-sm font-medium text-[var(--color-secondary)]">{wavelength}</p>
      </div>
      <div>
        <span className="text-xs text-[var(--color-mono-light)]">{labels.feature}</span>
        <p className="text-sm text-[var(--color-mono)]">{feature}</p>
      </div>
    </div>

    <div className="pt-3 border-t border-[var(--color-border)]">
      <span className="text-xs text-[var(--color-mono-light)]">{labels.indications}</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {targets.slice(0, 3).map((target, idx) => (
          <span
            key={idx}
            className={`text-xs px-2 py-0.5 rounded ${
              highlight
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-secondary)]'
                : 'bg-[var(--color-background)] text-[var(--color-mono)]'
            }`}
          >
            {target}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

// 장비 매트릭스 일러스트레이션
interface MatrixIllustrationProps {
  chartTitle: string;
  equipment: string[];
  concerns: string[];
}

const EquipmentMatrixIllustration = ({ chartTitle, equipment, concerns }: MatrixIllustrationProps) => (
  <svg viewBox="0 0 600 400" className="w-full h-auto">
    <defs>
      <linearGradient id="matrixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b4988d" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#6d4e42" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* 배경 */}
    <rect x="0" y="0" width="600" height="400" fill="#fafafa" rx="16" />

    {/* 제목 */}
    <text x="300" y="35" fontSize="16" fill="#575756" textAnchor="middle" fontWeight="600">
      {chartTitle}
    </text>

    {/* 헤더 - 장비 */}
    <g transform="translate(150, 60)">
      {equipment.map((eq, idx) => (
        <g key={idx} transform={`translate(${idx * 110}, 0)`}>
          <rect x="0" y="0" width="100" height="35" fill="#6d4e42" rx="8" />
          <text x="50" y="22" fontSize="11" fill="white" textAnchor="middle" fontWeight="500">
            {eq}
          </text>
        </g>
      ))}
    </g>

    {/* 행 - 피부 고민 */}
    {[
      { checks: [true, true, true, false] },
      { checks: [true, false, false, false] },
      { checks: [false, false, true, true] },
      { checks: [true, false, false, false] },
      { checks: [false, true, false, false] }
    ].map((row, rowIdx) => (
      <g key={rowIdx} transform={`translate(0, ${110 + rowIdx * 55})`}>
        {/* 고민명 */}
        <rect x="20" y="0" width="120" height="45" fill="url(#matrixGradient)" rx="8" />
        <text x="80" y="28" fontSize="12" fill="#575756" textAnchor="middle" fontWeight="500">
          {concerns[rowIdx]}
        </text>

        {/* 체크박스들 */}
        {row.checks.map((checked, colIdx) => (
          <g key={colIdx} transform={`translate(${150 + colIdx * 110}, 0)`}>
            <rect x="0" y="0" width="100" height="45" fill="white" stroke="#e5e5e5" strokeWidth="1" rx="8" />
            {checked && (
              <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: rowIdx * 0.1 + colIdx * 0.05 }}
              >
                <circle cx="50" cy="22" r="15" fill="#b4988d" opacity="0.2" />
                <path
                  d="M 40 22 L 47 29 L 60 16"
                  stroke="#b4988d"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>
            )}
          </g>
        ))}
      </g>
    ))}
  </svg>
);

export default function LaserCenterDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  // Load translation data
  const detail = {
    hero: {
      title: t('laser.center.detail.hero.title'),
      subtitle: t('laser.center.detail.hero.subtitle'),
      description: t('laser.center.detail.hero.description'),
    },
    viewMore: t('laser.center.detail.viewMore'),
    stats: t.raw('laser.center.detail.stats') as StatItem[],
    categories: {
      title: t('laser.center.detail.categories.title'),
      subtitle: t('laser.center.detail.categories.subtitle'),
      items: t.raw('laser.center.detail.categories.items') as CategoryItem[],
    },
    matrix: {
      badge: t('laser.center.detail.matrix.badge'),
      title: t('laser.center.detail.matrix.title'),
      subtitle: t('laser.center.detail.matrix.subtitle'),
      chartTitle: t('laser.center.detail.matrix.chartTitle'),
      equipment: t.raw('laser.center.detail.matrix.equipment') as string[],
      concerns: t.raw('laser.center.detail.matrix.concerns') as string[],
    },
    equipmentSection: {
      badge: t('laser.center.detail.equipmentSection.badge'),
      title: t('laser.center.detail.equipmentSection.title'),
      subtitle: t('laser.center.detail.equipmentSection.subtitle'),
      labels: t.raw('laser.center.detail.equipmentSection.labels') as {
        wavelength: string;
        feature: string;
        indications: string;
      },
      items: t.raw('laser.center.detail.equipmentSection.items') as EquipmentItem[],
    },
    synergy: {
      badge: t('laser.center.detail.synergy.badge'),
      title: t('laser.center.detail.synergy.title'),
      subtitle: t('laser.center.detail.synergy.subtitle'),
      benefits: t.raw('laser.center.detail.synergy.benefits') as SynergyBenefit[],
    },
    process: {
      title: t('laser.center.detail.process.title'),
      steps: t.raw('laser.center.detail.process.steps') as ProcessStep[],
    },
    faq: {
      title: t('laser.center.detail.faq.title'),
      items: t.raw('laser.center.detail.faq.items') as FAQItem[],
    },
    cta: {
      title: t('laser.center.detail.cta.title'),
      description: t('laser.center.detail.cta.description'),
      buttonConsult: t('laser.center.detail.cta.buttonConsult'),
    },
  };

  // Add hrefs to category items
  const categoriesWithHrefs = detail.categories.items.map(cat => ({
    ...cat,
    href: `/laser/${cat.id}`,
  }));

  // FAQ 토글 시 스크롤
  const handleFaqToggle = useCallback((index: number, e: React.MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.closest('details') as HTMLDetailsElement;
    if (!details) return;

    // details가 열릴 때만 스크롤 (열리기 전 상태가 closed일 때)
    if (!details.open) {
      requestAnimationFrame(() => {
        const rect = details.getBoundingClientRect();
        const scrollOffset = 120; // 헤더 높이(96px) + 여유 공간(24px)
        const scrollTop = window.scrollY + rect.top - scrollOffset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-white to-[var(--color-background)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-6">
                LASER CENTER
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-secondary)] mb-6">
                {detail.hero.title}
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium mb-4">
                {detail.hero.subtitle}
              </p>
              <p
                className="text-lg text-[var(--color-mono)] max-w-2xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: detail.hero.description }}
              />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 강점 하이라이트 */}
      <section className="py-12 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {detail.stats.map((stat, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/80 text-sm">{stat.label}</div>
                  <div className="text-white/60 text-xs">{stat.desc}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 피부 고민별 카테고리 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.categories.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.categories.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categoriesWithHrefs.map((category, idx) => (
              <CategoryCard key={category.id} category={category} index={idx} viewMoreLabel={detail.viewMore} />
            ))}
          </div>
        </div>
      </section>

      {/* 장비-고민 매트릭스 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                {detail.matrix.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.matrix.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.matrix.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-4xl mx-auto bg-[var(--color-background)] rounded-2xl p-6 overflow-x-auto">
              <EquipmentMatrixIllustration
                chartTitle={detail.matrix.chartTitle}
                equipment={detail.matrix.equipment}
                concerns={detail.matrix.concerns}
              />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 보유 장비 소개 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                {detail.equipmentSection.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.equipmentSection.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.equipmentSection.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {detail.equipmentSection.items.map((equipment, idx) => (
              <AnimateOnScroll key={equipment.name} animation="fadeInUp" delay={0.1 + idx * 0.1}>
                <EquipmentCard
                  name={equipment.name}
                  nameKo={equipment.nameKo}
                  wavelength={equipment.wavelength}
                  feature={equipment.feature}
                  targets={equipment.targets}
                  highlight={equipment.highlight}
                  labels={detail.equipmentSection.labels}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Clarity II + Lucas 시너지 */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <AnimateOnScroll animation="fadeInUp">
              <div className="text-center mb-12">
                <span className="inline-block bg-white text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                  {detail.synergy.badge}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                  {detail.synergy.title}
                </h2>
                <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                  {detail.synergy.subtitle}
                </p>
              </div>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-6">
              {detail.synergy.benefits.map((benefit, idx) => {
                const icons = [
                  <svg key="icon1" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>,
                  <svg key="icon2" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>,
                  <svg key="icon3" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>,
                ];
                return (
                  <AnimateOnScroll key={idx} animation="fadeInUp" delay={0.1 + idx * 0.1}>
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {icons[idx]}
                      </div>
                      <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">{benefit.title}</h4>
                      <p className="text-sm text-[var(--color-mono)]" dangerouslySetInnerHTML={{ __html: benefit.desc }} />
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 시술 프로세스 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.process.title}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {detail.process.steps.map((item, idx) => (
                <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                  <div className="text-center">
                    <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-[var(--color-secondary)] mb-2">{item.title}</h4>
                    <p className="text-sm text-[var(--color-mono)]">{item.desc}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 자주 묻는 질문 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.faq.title}
              </h2>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto space-y-4">
              {detail.faq.items.map((faq, idx) => (
                <details key={idx} className="group bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <summary
                    onClick={(e) => handleFaqToggle(idx, e)}
                    className="flex items-center justify-between p-5 cursor-pointer"
                  >
                    <span className="font-medium text-[var(--color-secondary)]">{faq.q}</span>
                    <span className="text-[var(--color-primary)] group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-[var(--color-mono)]">{faq.a}</div>
                </details>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 md:py-24 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {detail.cta.title}
              </h2>
              <p
                className="text-white/80 mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: detail.cta.description }}
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  {detail.cta.buttonConsult}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a
                  href="tel:02-547-0118"
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-full font-medium border-2 border-white/50 hover:border-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  02-547-0118
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}
