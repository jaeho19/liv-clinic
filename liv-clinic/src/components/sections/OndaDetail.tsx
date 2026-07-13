'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink, Breadcrumb } from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';
import { getLocalizedTreatment, getRelatedTreatmentLabel } from '@/lib/treatmentsI18n';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// Layer diagram — 진피 20% / 피하지방 80% 에너지 분배
const EnergySplitDiagram = ({
  dermisLabel,
  dermisValue,
  fatLabel,
  fatValue,
}: {
  dermisLabel: string;
  dermisValue: string;
  fatLabel: string;
  fatValue: string;
}) => (
  <svg viewBox="0 0 220 180" className="w-full h-auto" role="presentation">
    <defs>
      <linearGradient id="ondaDermis" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#b4988d" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#b4988d" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="ondaFat" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6d4e42" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#6d4e42" stopOpacity="0.15" />
      </linearGradient>
    </defs>

    {/* 표피 (접촉 냉각으로 보호) */}
    <rect x="10" y="14" width="200" height="18" rx="6" fill="#ffffff" stroke="#e5e5e5" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <motion.circle
        key={`cool-${i}`}
        cx={28 + i * 33}
        cy={23}
        r="3"
        fill="#7db3c7"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}

    {/* 진피 — 약 20% */}
    <rect x="10" y="40" width="200" height="40" rx="8" fill="url(#ondaDermis)" stroke="#b4988d" strokeOpacity="0.4" />
    <text x="22" y="58" fill="#6d4e42" fontSize="11" fontWeight="600">{dermisLabel}</text>
    <text x="22" y="73" fill="#8a8a8a" fontSize="10">{dermisValue}</text>

    {/* 피하지방 — 약 80% */}
    <rect x="10" y="88" width="200" height="78" rx="8" fill="url(#ondaFat)" stroke="#6d4e42" strokeOpacity="0.4" />
    <text x="22" y="110" fill="#6d4e42" fontSize="11" fontWeight="600">{fatLabel}</text>
    <text x="22" y="125" fill="#8a8a8a" fontSize="10">{fatValue}</text>

    {/* 지방세포 */}
    {[0, 1, 2, 3].map((i) => (
      <motion.circle
        key={`fat-${i}`}
        cx={60 + i * 34}
        cy={146}
        r="9"
        fill="#6d4e42"
        fillOpacity="0.25"
        stroke="#6d4e42"
        strokeOpacity="0.5"
        animate={{ r: [9, 6, 9], fillOpacity: [0.25, 0.1, 0.25] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
      />
    ))}

    {/* 마이크로웨이브 진행 방향 */}
    <motion.path
      d="M186 40 L186 150"
      stroke="#b4988d"
      strokeWidth="2"
      strokeDasharray="6 4"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0.4 }}
      animate={{ pathLength: [0, 1, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />
  </svg>
);

// Mechanism step
const MechanismStep = ({ index, title, desc }: { index: number; title: string; desc: string }) => (
  <motion.div
    className="flex gap-4"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08 }}
  >
    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg">
      {index + 1}
    </span>
    <div>
      <h4 className="text-h4 text-secondary mb-1">{title}</h4>
      <p className="text-body text-mono-light leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

// Process step
const ProcessStep = ({ step, title, desc, isLast }: { step: number; title: string; desc: string; isLast?: boolean }) => (
  <motion.div
    className="relative flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: step * 0.1 }}
  >
    {!isLast && (
      <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary to-primary/30" />
    )}

    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-xl font-serif shadow-lg"
      whileHover={{ scale: 1.1 }}
    >
      {step}
    </motion.div>

    <div className="mt-4">
      <h4 className="text-h4 text-secondary mb-2">{title}</h4>
      <p className="text-small text-mono-light max-w-[150px]">{desc}</p>
    </div>
  </motion.div>
);

type ComparisonRow = { feature: string; onda: string; hifu: string; rf: string };

// Main Component
export default function OndaDetail() {
  const t = useTranslations('treatments');
  const locale = useLocale();
  const treatment = getLocalizedTreatment(TREATMENTS.lifting.onda, 'onda', locale);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const faqRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'onda')
  );

  const toggleFaq = useCallback((index: number) => {
    setExpandedFaq(index);

    requestAnimationFrame(() => {
      const el = faqRefs.current.get(index);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollOffset = 120; // 헤더 높이(96px) + 여유 공간(24px)
      const scrollTop = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    });
  }, []);

  const detail = t.raw('lifting.onda.detail') as {
    hero: {
      badge: string;
      title: string;
      description: string;
      deviceImageAlt: string;
      stats: Record<'frequency' | 'anesthesia' | 'downtime', { value: string; label: string }>;
      floatingBadges: Record<'cooling' | 'layers', { title: string; subtitle: string }>;
    };
    about: { sectionLabel: string; title: string; description: string };
    mechanism: {
      sectionLabel: string;
      title: string;
      subtitle: string;
      steps: { title: string; desc: string }[];
      energySplit: Record<'dermis' | 'fat', { label: string; value: string; desc: string }>;
      cooling: { title: string; desc: string };
    };
    positioning: {
      sectionLabel: string;
      title: string;
      subtitle: string;
      cards: Record<'onda' | 'hifuRf', { title: string; desc: string }>;
      comparison: {
        header: string;
        columns: { onda: string; hifu: string; rf: string };
        rows: Record<string, ComparisonRow>;
        note: string;
      };
    };
    durationByArea: {
      sectionLabel: string;
      title: string;
      items: { area: string; time: string }[];
      note: string;
    };
    livDifference: { sectionLabel: string; title: string; cards: Record<'specialist' | 'custom' | 'safety', { title: string; desc: string }> };
    processSection: { sectionLabel: string };
    treatmentInfo: { sectionLabel: string; title: string; labels: Record<'duration' | 'anesthesia' | 'recovery' | 'results', string> };
    faq: { sectionLabel: string; title: string; moreInfo: string; viewMedicalQA: string };
    extendedFaqs: { q: string; a: string }[];
    cta: { sectionLabel: string; title: string; description: string; bookConsultation: string; businessHours: string; location: string };
    related: { sectionLabel: string; title: string };
  };

  const extendedFaqs = [...treatment.faqs, ...detail.extendedFaqs];
  const comparisonRows = Object.values(detail.positioning.comparison.rows);

  return (
    <>
      <Breadcrumb items={[{ navKey: 'lifting', href: '/lifting' }, { navKey: 'onda' }]} />

      {/* Hero Section */}
      <section className="relative min-h-screen-dvh flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />

        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-primary/20 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-small font-medium text-secondary">{detail.hero.badge}</span>
                </motion.div>

                <p className="font-serif text-h2 text-primary mb-3 tracking-wide">ONDA</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  {detail.hero.title}
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p className="text-h4 text-mono leading-relaxed mb-8 max-w-lg" dangerouslySetInnerHTML={{ __html: detail.hero.description }} />

                <div className="flex gap-8 mt-2 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-primary font-serif">{detail.hero.stats.frequency.value}</p>
                    <p className="text-small text-mono-light">{detail.hero.stats.frequency.label}</p>
                  </div>
                  <div>
                    <p className="text-h2 text-primary font-serif">{detail.hero.stats.anesthesia.value}</p>
                    <p className="text-small text-mono-light">{detail.hero.stats.anesthesia.label}</p>
                  </div>
                  <div>
                    <p className="text-h2 text-primary font-serif">{detail.hero.stats.downtime.value}</p>
                    <p className="text-small text-mono-light">{detail.hero.stats.downtime.label}</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="relative">
                {/* 장비 이미지 — 투명 PNG를 브랜드 그라데이션 위에 배치 (고정 비율 컨테이너로 CLS 방지) */}
                <motion.div
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/25 via-background to-secondary/15"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.75),transparent_65%)]" />

                  <div className="relative w-full h-full flex items-center justify-center p-10">
                    <Image
                      src={TREATMENTS.lifting.onda.heroImage}
                      alt={detail.hero.deviceImageAlt}
                      width={189}
                      height={697}
                      priority
                      sizes="(max-width: 1024px) 60vw, 30vw"
                      className="h-full w-auto max-w-full object-contain drop-shadow-2xl"
                    />
                  </div>

                  {/* Premium corner accents */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
                </motion.div>

                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-small font-medium text-primary">{detail.hero.floatingBadges.cooling.title}</p>
                  <p className="text-xs text-mono-light">{detail.hero.floatingBadges.cooling.subtitle}</p>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-secondary text-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-small font-medium">{detail.hero.floatingBadges.layers.title}</p>
                  <p className="text-xs opacity-80">{detail.hero.floatingBadges.layers.subtitle}</p>
                </motion.div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center max-w-3xl mx-auto">
              <p className="font-serif text-h3 text-primary mb-2">{detail.about.sectionLabel}</p>
              <h2 className="text-h1 text-secondary mb-6">{detail.about.title}</h2>
              <p className="text-body text-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: detail.about.description }} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Mechanism Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{detail.mechanism.sectionLabel}</p>
              <h2 className="text-h1 text-secondary mb-4">{detail.mechanism.title}</h2>
              <p className="text-body text-mono-light">{detail.mechanism.subtitle}</p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg" hover={false}>
                <EnergySplitDiagram
                  dermisLabel={`${detail.mechanism.energySplit.dermis.label} · ${detail.mechanism.energySplit.dermis.value}`}
                  dermisValue={detail.mechanism.energySplit.dermis.desc}
                  fatLabel={`${detail.mechanism.energySplit.fat.label} · ${detail.mechanism.energySplit.fat.value}`}
                  fatValue={detail.mechanism.energySplit.fat.desc}
                />
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-small font-medium text-secondary mb-1">{detail.mechanism.cooling.title}</p>
                  <p className="text-small text-mono-light leading-relaxed">{detail.mechanism.cooling.desc}</p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-8">
                {detail.mechanism.steps.map((step, index) => (
                  <MechanismStep key={index} index={index} title={step.title} desc={step.desc} />
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Positioning Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{detail.positioning.sectionLabel}</p>
              <h2 className="text-h1 text-secondary mb-4">{detail.positioning.title}</h2>
              <p className="text-body text-mono-light">{detail.positioning.subtitle}</p>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <StaggerItem>
              <Card padding="lg" className="h-full border-t-4 border-t-primary">
                <h3 className="text-h4 text-primary mb-2">{detail.positioning.cards.onda.title}</h3>
                <p className="text-body text-mono-light leading-relaxed">{detail.positioning.cards.onda.desc}</p>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card padding="lg" className="h-full border-t-4 border-t-secondary">
                <h3 className="text-h4 text-secondary mb-2">{detail.positioning.cards.hifuRf.title}</h3>
                <p className="text-body text-mono-light leading-relaxed">{detail.positioning.cards.hifuRf.desc}</p>
              </Card>
            </StaggerItem>
          </StaggerChildren>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b-2 border-primary/20">
                      <th className="py-4 px-4 text-left text-h4 text-secondary">{detail.positioning.comparison.header}</th>
                      <th className="py-4 px-4 text-center text-h4 text-primary bg-primary/5 rounded-t-lg">
                        {detail.positioning.comparison.columns.onda}
                      </th>
                      <th className="py-4 px-4 text-center text-h4 text-mono">
                        {detail.positioning.comparison.columns.hifu}
                      </th>
                      <th className="py-4 px-4 text-center text-h4 text-mono">
                        {detail.positioning.comparison.columns.rf}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, index) => (
                      <motion.tr
                        key={index}
                        className="border-b border-border hover:bg-background/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="py-4 px-4 text-body font-medium text-secondary">{row.feature}</td>
                        <td className="py-4 px-4 text-center text-body text-primary bg-primary/5">{row.onda}</td>
                        <td className="py-4 px-4 text-center text-body text-mono">{row.hifu}</td>
                        <td className="py-4 px-4 text-center text-body text-mono">{row.rf}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-small text-mono-light leading-relaxed">
                {detail.positioning.comparison.note}
              </p>
            </Card>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Duration by Area Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 text-primary mb-2">{detail.durationByArea.sectionLabel}</p>
              <h2 className="text-h1 text-secondary">{detail.durationByArea.title}</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {detail.durationByArea.items.map((item, index) => (
                <StaggerItem key={index}>
                  <Card padding="lg" className="h-full text-center">
                    <p className="text-body text-mono-light mb-2">{item.area}</p>
                    <p className="text-h2 text-primary font-serif">{item.time}</p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
            <AnimateOnScroll>
              <p className="mt-6 text-center text-small text-mono-light">{detail.durationByArea.note}</p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* LIV Difference Section */}
      <section className="section-gap bg-gradient-to-b from-secondary/5 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{detail.livDifference.sectionLabel}</p>
              <h2 className="text-h1 text-secondary">{detail.livDifference.title}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <Card padding="lg" className="h-full border-t-4 border-t-primary">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{detail.livDifference.cards.specialist.title}</h3>
                  <p className="text-body text-mono-light">{detail.livDifference.cards.specialist.desc}</p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <Card padding="lg" className="h-full border-t-4 border-t-secondary">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{detail.livDifference.cards.custom.title}</h3>
                  <p className="text-body text-mono-light">{detail.livDifference.cards.custom.desc}</p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <Card padding="lg" className="h-full border-t-4 border-t-primary">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{detail.livDifference.cards.safety.title}</h3>
                  <p className="text-body text-mono-light">{detail.livDifference.cards.safety.desc}</p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{detail.processSection.sectionLabel}</p>
              <h2 className="text-h1 text-secondary">{t('common.process')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {treatment.process.map((step, index) => (
              <ProcessStep
                key={step.step}
                step={step.step}
                title={step.title}
                desc={step.desc}
                isLast={index === treatment.process.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Info Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 opacity-80 mb-2">{detail.treatmentInfo.sectionLabel}</p>
              <h2 className="text-h1">{detail.treatmentInfo.title}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimateOnScroll delay={0}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">{detail.treatmentInfo.labels.duration}</p>
                <p className="font-medium text-lg">{treatment.duration}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.1}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">{detail.treatmentInfo.labels.anesthesia}</p>
                <p className="font-medium text-lg">{treatment.anesthesia}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.2}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">{detail.treatmentInfo.labels.recovery}</p>
                <p className="font-medium text-lg">{treatment.recovery}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.3}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">{detail.treatmentInfo.labels.results}</p>
                <p className="font-medium text-lg">{treatment.results}</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Target & Ideal For Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('common.targetAreas')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {treatment.targetAreas.map((area, index) => (
                    <motion.span
                      key={index}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-body"
                      whileHover={{ scale: 1.05 }}
                    >
                      {area}
                    </motion.span>
                  ))}
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('common.recommended')}
                </h3>
                <ul className="space-y-3">
                  {treatment.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="text-primary mt-0.5"><CheckIcon /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Cautions Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl mx-auto">
              <Card padding="lg" className="border-2 border-primary/20">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t('common.precautions')}
                </h3>
                <ul className="space-y-3">
                  {treatment.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {caution}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{detail.faq.sectionLabel}</p>
              <h2 className="text-h1 text-secondary">{detail.faq.title}</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto space-y-4">
            {extendedFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  padding="none"
                  hover={false}
                  className="overflow-hidden"
                  id={`faq-${index}`}
                  ref={(el: HTMLDivElement | null) => {
                    if (el) faqRefs.current.set(index, el);
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-medium">Q</span>
                      </span>
                      <span className="text-h4 text-secondary pt-0.5">{faq.q}</span>
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-mono-light flex-shrink-0 mt-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5">
                          <div className="flex items-start gap-3 pt-3 border-t border-border">
                            <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-secondary font-serif font-medium">A</span>
                            </span>
                            <p className="text-body text-mono leading-relaxed pt-1">{faq.a}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          {relatedMedicalQA.length > 0 && (
            <AnimateOnScroll>
              <div className="text-center mt-12">
                <p className="text-body text-mono-light mb-4">
                  {detail.faq.moreInfo}
                </p>
                <Link href="/medical">
                  <Button variant="outline">
                    {detail.faq.viewMedicalQA}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-secondary via-secondary to-primary/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-serif text-h3 opacity-80 mb-4">{detail.cta.sectionLabel}</p>
              <h2 className="text-h1 mb-6">{detail.cta.title}</h2>
              <p className="text-h4 opacity-90 mb-10 leading-relaxed" dangerouslySetInnerHTML={{ __html: detail.cta.description }} />

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="ghost" size="lg" className="bg-white !text-secondary hover:bg-primary hover:!text-white w-full sm:w-auto">
                    {detail.cta.bookConsultation}
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button variant="outline" size="lg" className="border-white !text-white hover:bg-white/10 w-full sm:w-auto">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    02-797-2773
                  </Button>
                </a>
              </div>

              <div className="mt-10 pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-center items-center gap-6 text-small opacity-70">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {detail.cta.businessHours}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {detail.cta.location}
                </span>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related Treatments */}
      {treatment.relatedTreatments && treatment.relatedTreatments.length > 0 && (
        <section className="section-gap bg-white">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-16">
                <p className="font-serif text-h3 text-primary mb-2">{detail.related.sectionLabel}</p>
                <h2 className="text-h1 text-secondary">{detail.related.title}</h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {treatment.relatedTreatments.slice(0, 3).map((relatedId) => {
                const related =
                  TREATMENTS.lifting[relatedId as keyof typeof TREATMENTS.lifting] ||
                  TREATMENTS.antiaging[relatedId as keyof typeof TREATMENTS.antiaging] ||
                  TREATMENTS.laser[relatedId as keyof typeof TREATMENTS.laser];

                if (!related) return null;
                const l10n = getRelatedTreatmentLabel(relatedId, locale);

                return (
                  <AnimateOnScroll key={relatedId}>
                    <Link href={`/${related.category}/${related.id}`}>
                      <Card padding="lg" className="group cursor-pointer h-full">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-serif text-primary mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                              {l10n?.name ?? related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{l10n?.desc ?? related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </Card>
                    </Link>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
