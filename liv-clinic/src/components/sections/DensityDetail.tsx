'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink, PriceTable } from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';
import { getLocalizedTreatment, getRelatedTreatmentLabel } from '@/lib/treatmentsI18n';

// TypeScript interfaces for translated data
interface TimelineItem {
  time: string;
  effect: string;
  desc: string;
  percent: number;
}

interface ComparisonRow {
  feature: string;
  density: string;
  ulthera: string;
  thermage: string;
}

interface ComparisonHeaders {
  feature: string;
  density: string;
  ulthera: string;
  thermage: string;
}

interface ExtendedFaq {
  q: string;
  a: string;
}

interface IllustrationLabels {
  dualEnergy: {
    hifu: string;
    rf: string;
    synergy: string;
  };
  multiLayer: {
    epidermis: string;
    dermis: string;
    smas: string;
    title: string;
  };
  cooling: {
    title: string;
  };
  diagram: {
    epidermis: string;
    dermis: string;
    subcutaneous: string;
    smas: string;
  };
}

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const DualEnergyIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
  </svg>
);

// Dual Energy Illustration (HIFU + RF)
const DualEnergyIllustration = ({ labels }: { labels: IllustrationLabels['dualEnergy'] }) => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="dualGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="hifuGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <linearGradient id="rfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    {/* Background */}
    <circle cx="100" cy="80" r="70" fill="url(#dualGrad)" />
    {/* HIFU circle */}
    <motion.circle
      cx="70" cy="80" r="30"
      fill="url(#hifuGrad)"
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.9, 1.05, 0.9] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <text x="70" y="85" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">HIFU</text>
    {/* RF circle */}
    <motion.circle
      cx="130" cy="80" r="30"
      fill="url(#rfGrad)"
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.9, 1.05, 0.9] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
    <text x="130" y="85" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">RF</text>
    {/* Synergy connection */}
    <motion.path
      d="M95 80 L105 80"
      stroke="#D4AF37"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
    {/* Plus sign */}
    <motion.g
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.8, 1.2, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <circle cx="100" cy="80" r="12" fill="#D4AF37" />
      <path d="M96 80 L104 80 M100 76 L100 84" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
    {/* Labels */}
    <text x="70" y="125" fill="#8B5CF6" fontSize="9" textAnchor="middle">{labels.hifu}</text>
    <text x="130" y="125" fill="#06B6D4" fontSize="9" textAnchor="middle">{labels.rf}</text>
    <text x="100" y="150" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">{labels.synergy}</text>
  </svg>
);

// Multi Layer Illustration
const MultiLayerIllustration = ({ labels }: { labels: IllustrationLabels['multiLayer'] }) => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="layerGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f5e6df" />
        <stop offset="100%" stopColor="#e8d4c8" />
      </linearGradient>
      <linearGradient id="layerGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e8d4c8" />
        <stop offset="100%" stopColor="#d4b8a8" />
      </linearGradient>
      <linearGradient id="layerGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#d4b8a8" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
    </defs>
    {/* Skin layers */}
    <rect x="30" y="25" width="140" height="25" fill="url(#layerGrad1)" rx="4" />
    <rect x="30" y="50" width="140" height="35" fill="url(#layerGrad2)" rx="4" />
    <rect x="30" y="85" width="140" height="30" fill="url(#layerGrad3)" rx="4" />
    {/* Energy points at different depths */}
    <motion.circle
      cx="70" cy="37" r="6"
      fill="#06B6D4"
      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.circle
      cx="100" cy="67" r="8"
      fill="#8B5CF6"
      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    />
    <motion.circle
      cx="130" cy="100" r="10"
      fill="#8B5CF6"
      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
    />
    {/* Layer labels */}
    <text x="185" y="40" fill="#6d4e42" fontSize="8" textAnchor="start">{labels.epidermis}</text>
    <text x="185" y="70" fill="#6d4e42" fontSize="8" textAnchor="start">{labels.dermis}</text>
    <text x="185" y="105" fill="#6d4e42" fontSize="8" textAnchor="start">{labels.smas}</text>
    {/* Title */}
    <text x="100" y="145" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">{labels.title}</text>
  </svg>
);

// Cooling System Illustration
const CoolingIllustration = ({ labels }: { labels: IllustrationLabels['cooling'] }) => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="coolGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#0891B2" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    {/* Background */}
    <circle cx="100" cy="80" r="65" fill="url(#coolGrad)" />
    {/* Snowflake pattern */}
    <motion.g
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 100 80)`}>
          <line x1="100" y1="45" x2="100" y2="65" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
          <line x1="100" y1="50" x2="92" y2="55" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
          <line x1="100" y1="50" x2="108" y2="55" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </motion.g>
    {/* Center circle */}
    <motion.circle
      cx="100" cy="80" r="20"
      fill="#06B6D4"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    {/* Temperature */}
    <text x="100" y="85" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">-5°C</text>
    {/* Cool waves */}
    {[0, 1, 2].map((i) => (
      <motion.circle
        key={i}
        cx="100" cy="80"
        r={30 + i * 15}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="1"
        strokeDasharray="5 5"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    {/* Label */}
    <text x="100" y="150" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">{labels.title}</text>
  </svg>
);

// Dual Energy Diagram Component
const DualEnergyDiagram = ({ labels }: { labels: IllustrationLabels['diagram'] }) => (
  <div className="relative w-full max-w-xl mx-auto">
    <svg viewBox="0 0 400 300" className="w-full h-auto">
      <defs>
        <linearGradient id="densitySkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e6df" />
          <stop offset="33%" stopColor="#e8d4c8" />
          <stop offset="66%" stopColor="#d4b8a8" />
          <stop offset="100%" stopColor="#b4988d" />
        </linearGradient>
        <radialGradient id="hifuRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rfRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Handpiece */}
      <rect x="160" y="10" width="80" height="50" fill="linear-gradient(180deg, #6d4e42, #8a7060)" rx="8" />
      <rect x="175" y="60" width="50" height="15" fill="#8a7060" rx="4" />

      {/* Energy beams */}
      <motion.path
        d="M180 75 L140 200"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeDasharray="8 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M200 75 L200 150"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeDasharray="8 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />
      <motion.path
        d="M220 75 L260 200"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeDasharray="8 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      />

      {/* Skin layers */}
      <rect x="50" y="100" width="300" height="30" fill="#f5e6df" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="130" width="300" height="50" fill="#e8d4c8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="180" width="300" height="40" fill="#d4b8a8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="220" width="300" height="50" fill="#b4988d" stroke="#e5e5e5" strokeWidth="1" rx="4" />

      {/* Layer labels */}
      <text x="370" y="120" className="text-xs fill-mono" textAnchor="end">{labels.epidermis}</text>
      <text x="370" y="160" className="text-xs fill-mono" textAnchor="end">{labels.dermis}</text>
      <text x="370" y="205" className="text-xs fill-mono" textAnchor="end">{labels.subcutaneous}</text>
      <text x="370" y="250" className="text-xs fill-mono" textAnchor="end">{labels.smas}</text>

      {/* RF effect in epidermis/dermis */}
      <motion.ellipse
        cx="200" cy="140"
        rx="60" ry="25"
        fill="url(#rfRadial)"
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* HIFU effect in SMAS */}
      <motion.ellipse
        cx="200" cy="245"
        rx="50" ry="20"
        fill="url(#hifuRadial)"
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />

      {/* Energy labels */}
      <g>
        <rect x="30" y="130" width="15" height="40" fill="#06B6D4" rx="2" />
        <text x="22" y="155" fill="#06B6D4" fontSize="10" fontWeight="bold" textAnchor="end">RF</text>
      </g>
      <g>
        <rect x="30" y="220" width="15" height="50" fill="#8B5CF6" rx="2" />
        <text x="22" y="250" fill="#8B5CF6" fontSize="10" fontWeight="bold" textAnchor="end">HIFU</text>
      </g>
    </svg>
  </div>
);

// Effect Timeline Component
const EffectTimeline = ({ items }: { items: TimelineItem[] }) => {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-[#8B5CF6]/30 via-[#06B6D4] to-[#8B5CF6]/30 rounded-full" />

      {/* Timeline points */}
      <div className="relative flex justify-between">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 }}
          >
            {/* Top label */}
            <div className="text-center mb-4 h-16">
              <p className="text-small font-medium text-secondary">{item.effect}</p>
              <p className="text-xs text-mono-light">{item.desc}</p>
            </div>

            {/* Circle indicator */}
            <motion.div
              className="w-4 h-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] border-4 border-white shadow-lg z-10"
              whileHover={{ scale: 1.5 }}
            />

            {/* Bottom label */}
            <div className="mt-4 text-center">
              <p className="text-small font-medium text-[#8B5CF6]">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Comparison Table Component
const ComparisonTable = ({ rows, headers }: { rows: ComparisonRow[]; headers: ComparisonHeaders }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-[#8B5CF6]/20">
            <th className="py-4 px-4 text-left text-h4 text-secondary">{headers.feature}</th>
            <th className="py-4 px-4 text-center bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10 rounded-t-lg">
              <span className="text-h4 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">{headers.density}</span>
            </th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">{headers.ulthera}</th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">{headers.thermage}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <motion.tr
              key={index}
              className="border-b border-border hover:bg-background/50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-4 px-4 text-body font-medium text-secondary">{row.feature}</td>
              <td className="py-4 px-4 text-center bg-gradient-to-r from-[#8B5CF6]/5 to-[#06B6D4]/5 text-body font-medium bg-clip-text" style={{ color: '#7C3AED' }}>{row.density}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.ulthera}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.thermage}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Process Step Component
const ProcessStep = ({ step, title, desc, isLast }: { step: number; title: string; desc: string; isLast?: boolean }) => (
  <motion.div
    className="relative flex flex-col items-center text-center"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: step * 0.1 }}
  >
    {/* Connector line */}
    {!isLast && (
      <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]/30" />
    )}

    {/* Step circle */}
    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] text-white flex items-center justify-center text-xl font-serif shadow-lg"
      whileHover={{ scale: 1.1 }}
    >
      {step}
    </motion.div>

    {/* Content */}
    <div className="mt-4">
      <h4 className="text-h4 text-secondary mb-2">{title}</h4>
      <p className="text-small text-mono-light max-w-[150px]">{desc}</p>
    </div>
  </motion.div>
);

// Main Component
export default function DensityDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const treatment = getLocalizedTreatment(TREATMENTS.lifting.density, 'density', locale);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const faqRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Get translated data from JSON files
  const illustrationLabels = t.raw('lifting.density.detail.illustrations') as IllustrationLabels;
  const timelineItems = t.raw('lifting.density.detail.timeline.items') as TimelineItem[];
  const comparisonRows = t.raw('lifting.density.detail.comparison.rows') as ComparisonRow[];
  const comparisonHeaders = t.raw('lifting.density.detail.comparison.headers') as ComparisonHeaders;
  const extendedFaqsData = t.raw('lifting.density.detail.extendedFaqs') as ExtendedFaq[];

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'density')
  );

  const toggleFaq = useCallback((index: number) => {
    setExpandedFaq(index);

    requestAnimationFrame(() => {
      const el = faqRefs.current.get(index);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollOffset = 120;
      const scrollTop = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    });
  }, []);

  // Extended FAQ data - combine treatment.faqs with translated extended FAQs
  const extendedFaqs = [
    ...treatment.faqs,
    ...extendedFaqsData
  ];

  return (
    <>
      {/* Hero Section - Premium Full Screen with Gold Accent */}
      <section className="relative min-h-screen-dvh flex items-center pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 via-background to-[#06B6D4]/5" />

        {/* Animated background elements */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#8B5CF6]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[#06B6D4]/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                {/* Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-[#D4AF37]/20 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-[#06B6D4]"><DualEnergyIcon /></span>
                  <span className="text-small font-medium text-secondary">{t('lifting.density.detail.hero.badge')}</span>
                </motion.div>

                <p className="font-serif text-h2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-3 tracking-wide">Density</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  {t('lifting.density.detail.hero.title')}
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {t('lifting.density.tagline')}
                </p>
                <p className="text-h4 text-mono leading-relaxed mb-8 max-w-lg" dangerouslySetInnerHTML={{ __html: t('lifting.density.detail.hero.description') }} />

{/* Quick stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-[#06B6D4] font-serif">{t('lifting.density.detail.hero.stats.energy.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.density.detail.hero.stats.energy.label')}</p>
                  </div>
                  <div>
                    <p className="text-h2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent font-serif">{t('lifting.density.detail.hero.stats.layers.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.density.detail.hero.stats.layers.label')}</p>
                  </div>
                  <div>
                    <p className="text-h2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent font-serif">{t('lifting.density.detail.hero.stats.effect.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.density.detail.hero.stats.effect.label')}</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right: Visual with Video */}
            <AnimateOnScroll animation="fadeInRight">
              <div className="relative">
                {/* Main visual with device video */}
                <motion.div
                  className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  {/* Premium gradient border */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#8B5CF6]/30 via-[#D4AF37]/20 to-[#06B6D4]/30 p-[2px]">
                    <div className="w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                      {/* Hero Video */}
                      <video
                        src="/images/lifting/grok-video-6d553fd0-24fc-4c62-9199-a28e21851279.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Glassmorphism overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                      {/* Premium corner accents */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#D4AF37]/50 rounded-tl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#D4AF37]/50 rounded-br-lg" />
                    </div>
                  </div>
                </motion.div>

                {/* Floating badges */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-small font-medium text-[#06B6D4]">{t('lifting.density.detail.hero.floatingBadges.rf.title')}</p>
                  <p className="text-xs text-mono-light">{t('lifting.density.detail.hero.floatingBadges.rf.subtitle')}</p>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-small font-medium">{t('lifting.density.detail.hero.floatingBadges.skin.title')}</p>
                  <p className="text-xs opacity-80">{t('lifting.density.detail.hero.floatingBadges.skin.subtitle')}</p>
                </motion.div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="density" />

      {/* About Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.about.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-6">{t('lifting.density.detail.about.title')}</h2>
              <p className="text-body text-mono max-w-3xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: t('lifting.density.detail.about.description') }} />
            </div>
          </AnimateOnScroll>

          {/* Technology explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimateOnScroll animation="fadeInLeft">
              <DualEnergyDiagram labels={illustrationLabels.diagram} />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                <h3 className="text-h2 text-secondary mb-4">
                  {t('lifting.density.detail.about.rfPrinciple.title')}
                </h3>

                <div className="space-y-4">
                  <Card padding="md" hover={false} className="border-l-4 border-l-[#06B6D4]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#06B6D4] font-serif font-bold">{t('lifting.density.detail.about.rfPrinciple.cards.rf.label')}</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">{t('lifting.density.detail.about.rfPrinciple.cards.rf.title')}</h4>
                        <p className="text-body text-mono-light">{t('lifting.density.detail.about.rfPrinciple.cards.rf.desc')}</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-[#b4988d]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-bold">{t('lifting.density.detail.about.rfPrinciple.cards.uniform.label')}</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">{t('lifting.density.detail.about.rfPrinciple.cards.uniform.title')}</h4>
                        <p className="text-body text-mono-light">{t('lifting.density.detail.about.rfPrinciple.cards.uniform.desc')}</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-gradient-to-r from-[#8B5CF6] to-[#06B6D4]" style={{ borderLeftColor: '#D4AF37' }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#06B6D4]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-secondary font-serif font-bold">{t('lifting.density.detail.about.rfPrinciple.cards.synergy.label')}</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">{t('lifting.density.detail.about.rfPrinciple.cards.synergy.title')}</h4>
                        <p className="text-body text-mono-light">{t('lifting.density.detail.about.rfPrinciple.cards.synergy.desc')}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Why Density Section */}
      <section className="section-gap bg-gradient-to-b from-background to-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.whyDensity.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{t('lifting.density.detail.whyDensity.title')}</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <DualEnergyIllustration labels={illustrationLabels.dualEnergy} />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">{t('lifting.density.detail.whyDensity.cards.rf.title')}</h3>
                  <p className="text-body text-mono-light leading-relaxed" dangerouslySetInnerHTML={{ __html: t('lifting.density.detail.whyDensity.cards.rf.desc') }} />
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <MultiLayerIllustration labels={illustrationLabels.multiLayer} />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">{t('lifting.density.detail.whyDensity.cards.affordable.title')}</h3>
                  <p className="text-body text-mono-light leading-relaxed" dangerouslySetInnerHTML={{ __html: t('lifting.density.detail.whyDensity.cards.affordable.desc') }} />
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <CoolingIllustration labels={illustrationLabels.cooling} />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">{t('lifting.density.detail.whyDensity.cards.cooling.title')}</h3>
                  <p className="text-body text-mono-light leading-relaxed" dangerouslySetInnerHTML={{ __html: t('lifting.density.detail.whyDensity.cards.cooling.desc') }} />
                </div>
              </Card>
            </StaggerItem>
          </StaggerChildren>

          {/* Clinical evidence banner */}
          <AnimateOnScroll>
            <div className="mt-16 p-8 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-3xl text-white text-center">
              <p className="font-serif text-h3 opacity-80 mb-4">{t('lifting.density.detail.whyDensity.clinicalBanner.label')}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-h1 font-serif">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.energy.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.energy.label')}</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.precision.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.precision.label')}</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.duration.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.duration.label')}</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.effect.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.density.detail.whyDensity.clinicalBanner.stats.effect.label')}</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Compare Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.compare.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-4">{t('lifting.density.detail.compare.title')}</h2>
              <p className="text-body text-mono-light">
                {t('lifting.density.detail.compare.subtitle')}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <ComparisonTable rows={comparisonRows} headers={comparisonHeaders} />
            </Card>
          </AnimateOnScroll>

          {/* Combination note */}
          <AnimateOnScroll>
            <div className="mt-12 p-6 bg-gradient-to-r from-[#8B5CF6]/5 to-[#06B6D4]/5 rounded-2xl border border-[#8B5CF6]/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#06B6D4]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-h4 text-secondary mb-2">{t('lifting.density.detail.compare.combinationNote.title')}</h4>
                  <p className="text-body text-mono-light">
                    {t('lifting.density.detail.compare.combinationNote.desc')}
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* LIV Section */}
      <section className="section-gap bg-gradient-to-b from-secondary/5 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.livDifference.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{t('lifting.density.detail.livDifference.title')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <Card padding="lg" className="h-full border-t-4" style={{ borderTopColor: '#8B5CF6' }}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{t('lifting.density.detail.livDifference.cards.custom.title')}</h3>
                  <p className="text-body text-mono-light">
                    {t('lifting.density.detail.livDifference.cards.custom.desc')}
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <Card padding="lg" className="h-full border-t-4" style={{ borderTopColor: '#06B6D4' }}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#06B6D4]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{t('lifting.density.detail.livDifference.cards.genuine.title')}</h3>
                  <p className="text-body text-mono-light">
                    {t('lifting.density.detail.livDifference.cards.genuine.desc')}
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-shadow">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{t('lifting.density.detail.livDifference.cards.specialist.title')}</h3>
                  <p className="text-body text-mono-light">
                    {t('lifting.density.detail.livDifference.cards.specialist.desc')}
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.timelineSection.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-4">{tCommon('timeline')}</h2>
              <p className="text-body text-mono-light">
                {t('lifting.density.detail.timelineSection.subtitle')}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="py-8 px-4 md:px-8">
              <EffectTimeline items={timelineItems} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.processSection.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{tCommon('process')}</h2>
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
      <section className="py-20 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 opacity-80 mb-2">{t('lifting.density.detail.treatmentInfo.sectionLabel')}</p>
              <h2 className="text-h1">{t('lifting.density.detail.treatmentInfo.title')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <AnimateOnScroll delay={0}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">{t('lifting.density.detail.treatmentInfo.labels.duration')}</p>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.density.detail.treatmentInfo.labels.anesthesia')}</p>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.density.detail.treatmentInfo.labels.recovery')}</p>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.density.detail.treatmentInfo.labels.results')}</p>
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
                  <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('common.targetAreas')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {treatment.targetAreas.map((area, index) => (
                    <motion.span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10 text-[#8B5CF6] rounded-full text-body"
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
                  <svg className="w-6 h-6 text-[#06B6D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('common.recommended')}
                </h3>
                <ul className="space-y-3">
                  {treatment.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="text-[#8B5CF6] mt-0.5"><CheckIcon /></span>
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
              <Card padding="lg" className="border-2 border-[#8B5CF6]/20">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t('common.precautions')}
                </h3>
                <ul className="space-y-3">
                  {treatment.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2 flex-shrink-0" />
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
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.faq.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{t('lifting.density.detail.faq.title')}</h2>
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
                      <span className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#8B5CF6] font-serif font-medium">Q</span>
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

          {/* Link to Medical Q&A */}
          {relatedMedicalQA.length > 0 && (
            <AnimateOnScroll>
              <div className="text-center mt-12">
                <p className="text-body text-mono-light mb-4">
                  {t('lifting.density.detail.faq.moreInfo')}
                </p>
                <Link href="/medical">
                  <Button variant="outline">
                    {t('lifting.density.detail.faq.viewMedicalQA')}
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
      <section className="py-24 bg-gradient-to-br from-secondary via-secondary to-[#8B5CF6]/80 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-serif text-h3 opacity-80 mb-4">{t('lifting.density.detail.cta.sectionLabel')}</p>
              <h2 className="text-h1 mb-6">{t('lifting.density.detail.cta.title')}</h2>
              <p className="text-h4 opacity-90 mb-10 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('lifting.density.detail.cta.description') }} />

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="ghost" size="lg" className="bg-white !text-secondary hover:bg-[#8B5CF6] hover:!text-white w-full sm:w-auto">
                    {t('lifting.density.detail.cta.bookConsultation')}
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
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
                  {t('lifting.density.detail.cta.businessHours')}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {t('lifting.density.detail.cta.location')}
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
                <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">{t('lifting.density.detail.related.sectionLabel')}</p>
                <h2 className="text-h1 text-secondary">{t('lifting.density.detail.related.title')}</h2>
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
                            <p className="font-serif text-[#8B5CF6] mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-[#8B5CF6] transition-colors">
                              {l10n?.name ?? related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{l10n?.desc ?? related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-[#8B5CF6] group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
