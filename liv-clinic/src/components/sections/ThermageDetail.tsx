'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink } from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const RFIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// AccuREP Illustration
const AccuREPIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="accuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b4988d" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="energyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
    </defs>
    {/* Background circle */}
    <circle cx="100" cy="80" r="70" fill="url(#accuGrad)" />
    {/* Central chip/sensor */}
    <motion.rect
      x="70" y="50" width="60" height="60" rx="8"
      fill="url(#energyGrad)"
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: [0.9, 1, 0.9], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    {/* Signal waves */}
    <motion.path
      d="M60 80 Q50 70 60 60"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.path
      d="M50 80 Q35 65 50 50"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    />
    <motion.path
      d="M140 80 Q150 70 140 60"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.path
      d="M150 80 Q165 65 150 50"
      fill="none"
      stroke="#FF6B35"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
    />
    {/* Text */}
    <text x="100" y="85" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">AccuREP</text>
    {/* Data points */}
    <motion.circle cx="50" cy="120" r="4" fill="#FF6B35" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="100" cy="130" r="4" fill="#FF6B35" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
    <motion.circle cx="150" cy="120" r="4" fill="#FF6B35" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
  </svg>
);

// Comfort Plus Illustration
const ComfortPlusIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="comfortGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#b4988d" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    {/* Background */}
    <circle cx="100" cy="80" r="70" fill="url(#comfortGrad)" />
    {/* Vibration waves */}
    {[0, 1, 2].map((i) => (
      <motion.ellipse
        key={i}
        cx="100"
        cy="80"
        rx={30 + i * 15}
        ry={20 + i * 10}
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        strokeDasharray="5 5"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
    {/* Central comfort icon */}
    <motion.circle
      cx="100" cy="80" r="25"
      fill="#4ade80"
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    {/* Smile */}
    <path d="M90 85 Q100 95 110 85" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="92" cy="75" r="3" fill="white" />
    <circle cx="108" cy="75" r="3" fill="white" />
    {/* Text */}
    <text x="100" y="140" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">Comfort Pulse</text>
  </svg>
);

// Collagen Remodeling Illustration
const CollagenIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-full h-40">
    <defs>
      <linearGradient id="collagenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5e6df" />
        <stop offset="50%" stopColor="#d4b8a8" />
        <stop offset="100%" stopColor="#b4988d" />
      </linearGradient>
      <radialGradient id="heatRadial" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Skin layers */}
    <rect x="30" y="40" width="140" height="25" fill="#f5e6df" rx="4" />
    <rect x="30" y="65" width="140" height="35" fill="#e8d4c8" rx="4" />
    <rect x="30" y="100" width="140" height="30" fill="#d4b8a8" rx="4" />
    {/* Heat zones */}
    <motion.circle
      cx="70" cy="82"
      r="15"
      fill="url(#heatRadial)"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.circle
      cx="130" cy="82"
      r="15"
      fill="url(#heatRadial)"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
    {/* Collagen fibers (before/after) */}
    <g transform="translate(40, 75)">
      <motion.path
        d="M0 0 Q10 5 20 0 Q30 -5 40 0"
        fill="none"
        stroke="#b4988d"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </g>
    <g transform="translate(110, 75)">
      <motion.path
        d="M0 5 Q10 0 20 5 Q30 10 40 5"
        fill="none"
        stroke="#b4988d"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
    </g>
    {/* Labels */}
    <text x="100" y="150" fill="#6d4e42" fontSize="10" fontWeight="bold" textAnchor="middle">콜라겐 수축 & 재생</text>
  </svg>
);

// Image Placeholder Component
const ImagePlaceholder = ({ label, aspectRatio = "square" }: { label: string; aspectRatio?: "square" | "wide" | "tall" }) => {
  const ratioClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    tall: "aspect-[3/4]"
  };

  return (
    <div className={`relative ${ratioClasses[aspectRatio]} rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <svg className="w-16 h-16 text-primary/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-mono-light text-sm text-center">{label}</p>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10" />
      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-secondary/10" />
    </div>
  );
};

// RF Energy Diagram Component
const RFEnergyDiagram = ({ skinLayers }: { skinLayers: Record<string, string> }) => (
  <div className="relative w-full max-w-xl mx-auto">
    <svg viewBox="0 0 400 280" className="w-full h-auto">
      {/* Background gradient */}
      <defs>
        <linearGradient id="rfSkinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e6df" />
          <stop offset="50%" stopColor="#e8d4c8" />
          <stop offset="100%" stopColor="#d4b8a8" />
        </linearGradient>
        <radialGradient id="rfHeatGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#FF6B35" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Handpiece */}
      <rect x="160" y="10" width="80" height="40" fill="#6d4e42" rx="8" />
      <rect x="175" y="50" width="50" height="20" fill="#8a7060" rx="4" />

      {/* RF waves from handpiece */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M180 70 Q200 ${90 + i * 20} 220 70`}
          fill="none"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      {/* Skin layers */}
      <rect x="50" y="100" width="300" height="30" fill="#f5e6df" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="130" width="300" height="50" fill="#e8d4c8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="180" width="300" height="40" fill="#d4b8a8" stroke="#e5e5e5" strokeWidth="1" rx="4" />
      <rect x="50" y="220" width="300" height="40" fill="#b4988d" stroke="#e5e5e5" strokeWidth="1" rx="4" />

      {/* Layer labels */}
      <text x="370" y="120" className="text-xs fill-mono" textAnchor="end">{skinLayers.epidermis}</text>
      <text x="370" y="160" className="text-xs fill-mono" textAnchor="end">{skinLayers.dermis}</text>
      <text x="370" y="205" className="text-xs fill-mono" textAnchor="end">{skinLayers.subcutaneous}</text>
      <text x="370" y="245" className="text-xs fill-mono" textAnchor="end">{skinLayers.fascia}</text>

      {/* Heat effect in dermis */}
      <motion.ellipse
        cx="200" cy="155"
        rx="80" ry="30"
        fill="url(#rfHeatGradient)"
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Collagen fibers tightening */}
      <motion.g initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
        <path d="M120 145 Q140 150 160 145 Q180 140 200 145" fill="none" stroke="#b4988d" strokeWidth="2" />
        <path d="M200 145 Q220 150 240 145 Q260 140 280 145" fill="none" stroke="#b4988d" strokeWidth="2" />
        <path d="M120 165 Q140 160 160 165 Q180 170 200 165" fill="none" stroke="#b4988d" strokeWidth="2" />
        <path d="M200 165 Q220 160 240 165 Q260 170 280 165" fill="none" stroke="#b4988d" strokeWidth="2" />
      </motion.g>

      {/* Temperature indicator */}
      <text x="200" y="95" fill="#FF6B35" fontSize="12" fontWeight="bold" textAnchor="middle">65-75°C</text>
    </svg>
  </div>
);

// Collagen Effect Timeline Component
const CollagenTimeline = ({ items }: { items: TimelineItem[] }) => {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-[#FF6B35]/30 via-[#FF6B35] to-[#FF6B35]/30 rounded-full" />

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
              className="w-4 h-4 rounded-full bg-[#FF6B35] border-4 border-white shadow-lg z-10"
              whileHover={{ scale: 1.5 }}
            />

            {/* Bottom label */}
            <div className="mt-4 text-center">
              <p className="text-small font-medium text-primary">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Generation Comparison Table
const GenerationTable = ({
  rows,
  headers
}: {
  rows: ComparisonRow[];
  headers: { feature: string; flx: string; cpt: string; nxt: string };
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="py-4 px-4 text-left text-h4 text-secondary">{headers.feature}</th>
            <th className="py-4 px-4 text-center bg-[#FF6B35]/10 rounded-t-lg">
              <span className="text-h4 text-[#FF6B35]">{headers.flx}</span>
            </th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">{headers.cpt}</th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">{headers.nxt}</th>
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
              <td className="py-4 px-4 text-center bg-[#FF6B35]/5 text-body text-[#FF6B35] font-medium">{row.flx}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.cpt}</td>
              <td className="py-4 px-4 text-center text-body text-mono">{row.nxt}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Tip Types Component with Images
const TipTypes = ({ items }: { items: TipItem[] }) => {
  const tipImages: Record<string, string> = {
    '600': '/images/lifting/thermage/tips/total-tip-600.png',
    '225': '/images/lifting/thermage/tips/total-tip-225.png',
  };

  return (
    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
      {items.map((tip, index) => (
        <motion.div
          key={tip.shots}
          className="text-center group"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div className="relative w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#FF6B35]/10 to-primary/10">
            <img
              src={tipImages[tip.shots] || tipImages['600']}
              alt={`Total Tip ${tip.shots}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-white text-h3 font-serif font-bold drop-shadow-lg">{tip.shots}</span>
            </div>
          </div>
          <p className="text-h4 text-secondary font-medium">{tip.area}</p>
          <p className="text-small text-mono-light">{tip.desc}</p>
        </motion.div>
      ))}
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
      <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-[#FF6B35] to-[#FF6B35]/30" />
    )}

    {/* Step circle */}
    <motion.div
      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-primary text-white flex items-center justify-center text-xl font-serif shadow-lg"
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

// 타입 정의
interface HeroLabel {
  top: { title: string; subtitle: string };
  bottom: { title: string; subtitle: string };
}

interface TimelineItem {
  time: string;
  effect: string;
  desc: string;
}

interface ComparisonRow {
  feature: string;
  flx: string;
  cpt: string;
  nxt: string;
}

interface TipItem {
  shots: string;
  area: string;
  desc: string;
}

interface RFStep {
  num: string;
  title: string;
  desc: string;
}

interface ExtendedFaq {
  q: string;
  a: string;
}

// Main Component
export default function ThermageDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const treatment = TREATMENTS.lifting.thermage;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const faqRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 번역 데이터 가져오기
  const heroLabels = t.raw('lifting.thermage.detail.heroLabels') as HeroLabel[];
  const timelineItems = t.raw('lifting.thermage.detail.timeline.items') as TimelineItem[];
  const comparisonRows = t.raw('lifting.thermage.detail.comparison.rows') as ComparisonRow[];
  const tipItems = t.raw('lifting.thermage.detail.tips.items') as TipItem[];
  const skinLayers = t.raw('lifting.thermage.detail.skinLayers') as Record<string, string>;
  const rfSteps = t.raw('lifting.thermage.detail.about.rfPrinciple.steps') as RFStep[];
  const extendedFaqsData = t.raw('lifting.thermage.detail.faq.extendedFaqs') as ExtendedFaq[];

  // 동적 레이블 전환 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLabelIndex((prev) => (prev + 1) % heroLabels.length);
    }, 4000); // 4초마다 전환

    return () => clearInterval(interval);
  }, []);

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => id === 'thermage')
  );

  const toggleFaq = useCallback((index: number) => {
    // 항상 해당 FAQ를 열기 (이미 열려있어도)
    setExpandedFaq(index);

    // 해당 FAQ 요소로 스무스 스크롤
    requestAnimationFrame(() => {
      const el = faqRefs.current.get(index);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollOffset = 120; // 헤더 높이(96px) + 여유 공간(24px)
      const scrollTop = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    });
  }, []);

  // Extended FAQ data - merge treatment.faqs with translated extended FAQs
  const extendedFaqs = [
    ...treatment.faqs,
    ...extendedFaqsData
  ];

  return (
    <>
      {/* Hero Section - Premium Full Screen with Gold Accent */}
      <section className="relative min-h-screen-dvh flex items-center pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/10 via-background to-primary/5" />

        {/* Animated background elements */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#FF6B35]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl"
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity }}
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
                  <span className="text-[#FF6B35]"><RFIcon /></span>
                  <span className="text-small font-medium text-secondary">{t('lifting.thermage.detail.hero.badge')}</span>
                </motion.div>

                <p className="font-serif text-h2 text-[#FF6B35] mb-3 tracking-wide">Thermage FLX</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  {t('lifting.thermage.detail.hero.title')}
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p
                  className="text-h4 text-mono leading-relaxed mb-8 max-w-lg"
                  dangerouslySetInnerHTML={{ __html: t('lifting.thermage.detail.hero.description') }}
                />

{/* Quick stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-[#FF6B35] font-serif">{t('lifting.thermage.detail.hero.stats.treatments.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.thermage.detail.hero.stats.treatments.label')}</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#FF6B35] font-serif">{t('lifting.thermage.detail.hero.stats.time.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.thermage.detail.hero.stats.time.label')}</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#FF6B35] font-serif">{t('lifting.thermage.detail.hero.stats.satisfaction.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.thermage.detail.hero.stats.satisfaction.label')}</p>
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
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FF6B35]/30 via-[#D4AF37]/20 to-primary/30 p-[2px]">
                    <div className="w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                      {/* Hero Video */}
                      <video
                        src="/images/lifting/thermage/videos/thermage-flx-demo.mp4"
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

                {/* Floating badges - Dynamic Labels */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`top-${currentLabelIndex}`}
                    className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl px-4 py-3 border border-[#D4AF37]/20"
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      y: { duration: 3, repeat: Infinity },
                      scale: { duration: 0.5 }
                    }}
                  >
                    <p className="text-small font-medium text-secondary">{heroLabels[currentLabelIndex].top.title}</p>
                    <p className="text-xs text-mono-light">{heroLabels[currentLabelIndex].top.subtitle}</p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`bottom-${currentLabelIndex}`}
                    className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] text-white rounded-2xl shadow-xl px-4 py-3"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: [0, 10, 0], scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      y: { duration: 3, repeat: Infinity, delay: 1 },
                      scale: { duration: 0.5 }
                    }}
                  >
                    <p className="text-small font-medium">{heroLabels[currentLabelIndex].bottom.title}</p>
                    <p className="text-xs opacity-80">{heroLabels[currentLabelIndex].bottom.subtitle}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Premium glow effect */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#FF6B35]/20 to-[#D4AF37]/20 blur-2xl opacity-50" />
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
          <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section - 써마지란? */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.about.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-6">{t('lifting.thermage.detail.about.title')}</h2>
              <p
                className="text-body text-mono max-w-3xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t('lifting.thermage.detail.about.description') }}
              />
            </div>
          </AnimateOnScroll>

          {/* Technology explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimateOnScroll animation="fadeInLeft">
              <RFEnergyDiagram skinLayers={skinLayers} />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                <h3 className="text-h2 text-secondary mb-4">
                  {t('lifting.thermage.detail.about.rfPrinciple.title')}
                </h3>

                <div className="space-y-4">
                  {rfSteps.map((step, index) => (
                    <Card key={index} padding="md" hover={false} className={`border-l-4 ${index === 0 ? 'border-l-[#FF6B35]/50' : index === 1 ? 'border-l-[#FF6B35]/70' : 'border-l-[#FF6B35]'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-[#FF6B35]/10' : index === 1 ? 'bg-[#FF6B35]/20' : 'bg-[#FF6B35]/30'}`}>
                          <span className="text-[#FF6B35] font-serif font-bold text-lg">{step.num}</span>
                        </div>
                        <div>
                          <h4 className="text-h4 text-secondary mb-1">{step.title}</h4>
                          <p className="text-body text-mono-light">{step.desc}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Why Thermage Section */}
      <section className="section-gap bg-gradient-to-b from-background to-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.whyThermage.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{t('lifting.thermage.detail.whyThermage.title')}</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <AccuREPIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">{t('lifting.thermage.detail.whyThermage.cards.accuRep.title')}</h3>
                  <p
                    className="text-body text-mono-light leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t('lifting.thermage.detail.whyThermage.cards.accuRep.desc') }}
                  />
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <ComfortPlusIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">{t('lifting.thermage.detail.whyThermage.cards.comfortPulse.title')}</h3>
                  <p
                    className="text-body text-mono-light leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t('lifting.thermage.detail.whyThermage.cards.comfortPulse.desc') }}
                  />
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <CollagenIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">{t('lifting.thermage.detail.whyThermage.cards.collagenRemodeling.title')}</h3>
                  <p
                    className="text-body text-mono-light leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: t('lifting.thermage.detail.whyThermage.cards.collagenRemodeling.desc') }}
                  />
                </div>
              </Card>
            </StaggerItem>
          </StaggerChildren>

          {/* Clinical evidence banner */}
          <AnimateOnScroll>
            <div className="mt-16 p-8 bg-gradient-to-r from-[#FF6B35] to-primary rounded-3xl text-white text-center">
              <p className="font-serif text-h3 opacity-80 mb-4">{t('lifting.thermage.detail.whyThermage.globalTrust.title')}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-h1 font-serif">{t('lifting.thermage.detail.whyThermage.globalTrust.treatments.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.whyThermage.globalTrust.treatments.label')}</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">{t('lifting.thermage.detail.whyThermage.globalTrust.satisfaction.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.whyThermage.globalTrust.satisfaction.label')}</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">{t('lifting.thermage.detail.whyThermage.globalTrust.time.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.whyThermage.globalTrust.time.label')}</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">{t('lifting.thermage.detail.whyThermage.globalTrust.duration.value')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.whyThermage.globalTrust.duration.label')}</p>
                </div>
              </div>
              <p className="text-small opacity-60 mt-6">
                {t('lifting.thermage.detail.whyThermage.globalTrust.source')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Tips Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.tipsSection.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-4">{t('lifting.thermage.detail.tipsSection.title')}</h2>
              <p className="text-body text-mono-light">
                {t('lifting.thermage.detail.tipsSection.subtitle')}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <TipTypes items={tipItems} />
            </Card>
          </AnimateOnScroll>

          {/* Thermage Eye */}
          <AnimateOnScroll>
            <div className="mt-12 p-8 bg-gradient-to-r from-primary/5 to-[#FF6B35]/5 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.tipsSection.eye.sectionLabel')}</p>
                  <h3 className="text-h2 text-secondary mb-4">{t('lifting.thermage.detail.tipsSection.eye.title')}</h3>
                  <p className="text-body text-mono leading-relaxed mb-6">
                    {t('lifting.thermage.detail.tipsSection.eye.desc')}
                  </p>
                  <ul className="space-y-2">
                    {(t.raw('lifting.thermage.detail.tipsSection.eye.benefits') as string[]).map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-body text-mono">
                        <span className="text-[#FF6B35]"><CheckIcon /></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group">
                  <img
                    src="/images/lifting/thermage/treatment/thermage-eye.png"
                    alt={t('lifting.thermage.detail.tipsSection.eye.title')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Generation Compare Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.generationCompare.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-4">{t('lifting.thermage.detail.generationCompare.title')}</h2>
              <p className="text-body text-mono-light">
                {t('lifting.thermage.detail.generationCompare.subtitle')}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <GenerationTable
                rows={comparisonRows}
                headers={t.raw('lifting.thermage.detail.comparison.headers') as { feature: string; flx: string; cpt: string; nxt: string }}
              />
            </Card>
          </AnimateOnScroll>
        </div>
      </section>

      {/* LIV Section - 리브만의 써마지 */}
      <section className="section-gap bg-gradient-to-b from-secondary/5 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.livDifference.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{t('lifting.thermage.detail.livDifference.title')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll animation="fadeInUp" delay={0}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#FF6B35]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{t('lifting.thermage.detail.livDifference.cards.genuine.title')}</h3>
                  <p className="text-body text-mono-light">
                    {t('lifting.thermage.detail.livDifference.cards.genuine.desc')}
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#FF6B35]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{t('lifting.thermage.detail.livDifference.cards.transparent.title')}</h3>
                  <p className="text-body text-mono-light">
                    {t('lifting.thermage.detail.livDifference.cards.transparent.desc')}
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <Card padding="lg" className="h-full border-t-4 border-t-[#FF6B35]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{t('lifting.thermage.detail.livDifference.cards.specialist.title')}</h3>
                  <p className="text-body text-mono-light">
                    {t('lifting.thermage.detail.livDifference.cards.specialist.desc')}
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Collagen Timeline Section */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.timelineSection.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-4">{t('common.timeline')}</h2>
              <p className="text-body text-mono-light">
                {t('lifting.thermage.detail.timelineSection.subtitle')}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="py-8 px-4 md:px-8">
              <CollagenTimeline items={timelineItems} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.processSection.sectionLabel')}</p>
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
      <section className="py-20 bg-gradient-to-r from-[#FF6B35] to-primary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 opacity-80 mb-2">{t('lifting.thermage.detail.treatmentInfo.sectionLabel')}</p>
              <h2 className="text-h1">{t('lifting.thermage.detail.treatmentInfo.title')}</h2>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.thermage.detail.treatmentInfo.labels.duration')}</p>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.thermage.detail.treatmentInfo.labels.anesthesia')}</p>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.thermage.detail.treatmentInfo.labels.recovery')}</p>
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
                <p className="text-small opacity-70 mb-1">{t('lifting.thermage.detail.treatmentInfo.labels.results')}</p>
                <p className="font-medium text-lg">{treatment.results}</p>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Recommended shots info */}
          <AnimateOnScroll>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
              <h3 className="text-h4 mb-4 text-center">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.title')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.fullFace.shots')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.fullFace.label')}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.lowerFace.shots')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.lowerFace.label')}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.eye.shots')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.eye.label')}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-h3 font-serif">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.fullFaceNeck.shots')}</p>
                  <p className="text-small opacity-70">{t('lifting.thermage.detail.treatmentInfo.recommendedShots.fullFaceNeck.label')}</p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Target & Ideal For Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('common.targetAreas')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {treatment.targetAreas.map((area, index) => (
                    <motion.span
                      key={index}
                      className="px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full text-body"
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
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('common.recommended')}
                </h3>
                <ul className="space-y-3">
                  {treatment.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="text-[#FF6B35] mt-0.5"><CheckIcon /></span>
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
              <Card padding="lg" className="border-2 border-[#FF6B35]/20">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t('common.precautions')}
                </h3>
                <ul className="space-y-3">
                  {treatment.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mt-2 flex-shrink-0" />
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
              <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.faq.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary">{t('lifting.thermage.detail.faq.title')}</h2>
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
                      <span className="w-8 h-8 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF6B35] font-serif font-medium">Q</span>
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
                  {t('lifting.thermage.detail.faq.moreInfo')}
                </p>
                <Link href="/medical">
                  <Button variant="outline">
                    {t('lifting.thermage.detail.faq.viewMedicalQA')}
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
      <section className="py-24 bg-gradient-to-br from-secondary via-secondary to-[#FF6B35]/80 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="text-center max-w-2xl mx-auto">
              <p className="font-serif text-h3 opacity-80 mb-4">{t('lifting.thermage.detail.cta.sectionLabel')}</p>
              <h2 className="text-h1 mb-6">{t('lifting.thermage.detail.cta.title')}</h2>
              <p
                className="text-h4 opacity-90 mb-10 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t('lifting.thermage.detail.cta.description') }}
              />

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="ghost" size="lg" className="bg-white !text-secondary hover:bg-[#FF6B35] hover:!text-white w-full sm:w-auto">
                    {t('lifting.thermage.detail.cta.bookConsultation')}
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
                  {t('lifting.thermage.detail.cta.businessHours')}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {t('lifting.thermage.detail.cta.location')}
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
                <p className="font-serif text-h3 text-[#FF6B35] mb-2">{t('lifting.thermage.detail.related.sectionLabel')}</p>
                <h2 className="text-h1 text-secondary">{t('lifting.thermage.detail.related.title')}</h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {treatment.relatedTreatments.slice(0, 3).map((relatedId) => {
                const related =
                  TREATMENTS.lifting[relatedId as keyof typeof TREATMENTS.lifting] ||
                  TREATMENTS.antiaging[relatedId as keyof typeof TREATMENTS.antiaging] ||
                  TREATMENTS.laser[relatedId as keyof typeof TREATMENTS.laser];

                if (!related) return null;

                return (
                  <AnimateOnScroll key={relatedId}>
                    <Link href={`/${related.category}/${related.id}`}>
                      <Card padding="lg" className="group cursor-pointer h-full">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-serif text-[#FF6B35] mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-[#FF6B35] transition-colors">
                              {related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-[#FF6B35] group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
