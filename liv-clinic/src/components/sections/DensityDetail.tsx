'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useRef } from 'react';
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

const DualEnergyIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
  </svg>
);

// Dual Energy Illustration (HIFU + RF)
const DualEnergyIllustration = () => (
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
    <text x="70" y="125" fill="#8B5CF6" fontSize="9" textAnchor="middle">초음파</text>
    <text x="130" y="125" fill="#06B6D4" fontSize="9" textAnchor="middle">고주파</text>
    <text x="100" y="150" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">Dual Energy Synergy</text>
  </svg>
);

// Multi Layer Illustration
const MultiLayerIllustration = () => (
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
    <text x="185" y="40" fill="#6d4e42" fontSize="8" textAnchor="start">표피 (RF)</text>
    <text x="185" y="70" fill="#6d4e42" fontSize="8" textAnchor="start">진피 (HIFU+RF)</text>
    <text x="185" y="105" fill="#6d4e42" fontSize="8" textAnchor="start">SMAS (HIFU)</text>
    {/* Title */}
    <text x="100" y="145" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">다층 타겟팅</text>
  </svg>
);

// Cooling System Illustration
const CoolingIllustration = () => (
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
    <text x="100" y="150" fill="#6d4e42" fontSize="11" fontWeight="bold" textAnchor="middle">쿨링 시스템</text>
  </svg>
);

// Dual Energy Diagram Component
const DualEnergyDiagram = () => (
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
      <text x="370" y="120" className="text-xs fill-mono" textAnchor="end">표피</text>
      <text x="370" y="160" className="text-xs fill-mono" textAnchor="end">진피</text>
      <text x="370" y="205" className="text-xs fill-mono" textAnchor="end">피하지방</text>
      <text x="370" y="250" className="text-xs fill-mono" textAnchor="end">SMAS</text>

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
const EffectTimeline = () => {
  const timelineData = [
    { time: '시술 직후', effect: '즉각적 탄력', desc: '콜라겐 수축', percent: 40 },
    { time: '2주', effect: '탄력 개선', desc: 'RF 효과 발현', percent: 55 },
    { time: '1개월', effect: '피부결 개선', desc: '콜라겐 재생 시작', percent: 70 },
    { time: '3개월', effect: '최대 효과', desc: 'RF 콜라겐 리모델링', percent: 100 },
    { time: '6개월+', effect: '효과 유지', desc: '정기 관리 권장', percent: 90 },
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-[#8B5CF6]/30 via-[#06B6D4] to-[#8B5CF6]/30 rounded-full" />

      {/* Timeline points */}
      <div className="relative flex justify-between">
        {timelineData.map((item, index) => (
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
const ComparisonTable = () => {
  const comparisonData = [
    { feature: '에너지 종류', density: 'RF (고주파)', ulthera: 'HIFU (초음파)', thermage: 'RF (고주파)' },
    { feature: '타겟 깊이', density: '진피층 중심', ulthera: 'SMAS 중심', thermage: '진피층 중심' },
    { feature: '에너지 분포', density: '균일하고 정밀', ulthera: '집속형', thermage: '광범위' },
    { feature: '통증', density: '낮음', ulthera: '중간~높음', thermage: '낮음' },
    { feature: '시술 시간', density: '30-40분', ulthera: '60-90분', thermage: '45-60분' },
    { feature: '가격대', density: '합리적', ulthera: '프리미엄', thermage: '프리미엄' },
    { feature: '추천 대상', density: '탄력/모공 관리', ulthera: '처짐 심한 경우', thermage: '탄력 저하' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b-2 border-[#8B5CF6]/20">
            <th className="py-4 px-4 text-left text-h4 text-secondary">비교 항목</th>
            <th className="py-4 px-4 text-center bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10 rounded-t-lg">
              <span className="text-h4 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">덴서티</span>
            </th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">울쎄라피 프라임</th>
            <th className="py-4 px-4 text-center text-h4 text-mono-light">써마지</th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((row, index) => (
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
  const treatment = TREATMENTS.lifting.density;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const faqRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'density')
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

  // Extended FAQ data
  const extendedFaqs = [
    ...treatment.faqs,
    {
      q: '덴서티는 한 번만 받아도 효과가 있나요?',
      a: '네, 1회 시술로도 즉각적인 리프팅 효과를 경험할 수 있습니다. 하지만 최적의 결과를 위해 피부 상태에 따라 3-6개월 간격으로 2-3회 시술을 권장합니다.'
    },
    {
      q: '덴서티 시술 후 다운타임이 있나요?',
      a: '일반적으로 다운타임이 거의 없습니다. 시술 직후 약간의 붉은기나 부기가 있을 수 있으나 대부분 당일 내 사라집니다. 바로 일상생활과 메이크업이 가능합니다.'
    },
    {
      q: '울쎄라피 프라임이나 써마지를 받았는데 덴서티도 받을 수 있나요?',
      a: '네, 가능합니다. 다만 이전 시술과 최소 3개월 이상 간격을 두는 것이 좋습니다. 상담을 통해 피부 상태를 확인하고 최적의 시술 시기를 결정합니다.'
    },
  ];

  return (
    <>
      {/* Hero Section - Premium Full Screen with Gold Accent */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
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
                  <span className="text-small font-medium text-secondary">RF 고주파 리프팅</span>
                </motion.div>

                <p className="font-serif text-h2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-3 tracking-wide">Density</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  덴서티
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p className="text-h4 text-mono leading-relaxed mb-8 max-w-lg">
                  고주파(RF) 에너지로 피부 속 콜라겐을 촘촘하게 리모델링.<br />
                  정밀하고 균일한 에너지로 탄력 있는 피부를 완성합니다.
                </p>

{/* Quick stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-[#06B6D4] font-serif">RF</p>
                    <p className="text-small text-mono-light">고주파 에너지</p>
                  </div>
                  <div>
                    <p className="text-h2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent font-serif">4층</p>
                    <p className="text-small text-mono-light">다층 타겟팅</p>
                  </div>
                  <div>
                    <p className="text-h2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent font-serif">즉각</p>
                    <p className="text-small text-mono-light">리프팅 효과</p>
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
                  <p className="text-small font-medium text-[#06B6D4]">RF</p>
                  <p className="text-xs text-mono-light">정밀 고주파</p>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white rounded-2xl shadow-lg px-4 py-3"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <p className="text-small font-medium">RF</p>
                  <p className="text-xs opacity-80">피부 탄력</p>
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

      {/* About Section - 덴서티란? */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">About Density</p>
              <h2 className="text-h1 text-secondary mb-6">덴서티란?</h2>
              <p className="text-body text-mono max-w-3xl mx-auto leading-relaxed">
                덴서티는 <strong className="text-secondary">고주파(RF)</strong> 에너지로 진피층을 정밀하게 자극하는 프리미엄 리프팅 장비입니다.
                써마지와 같은 고주파 계열로, 정밀하고 균일한 에너지 분포로 콜라겐 재생을 촉진하고 피부 탄력을 개선합니다.
              </p>
            </div>
          </AnimateOnScroll>

          {/* Technology explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimateOnScroll animation="fadeInLeft">
              <DualEnergyDiagram />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                <h3 className="text-h2 text-secondary mb-4">
                  RF 고주파의 원리
                </h3>

                <div className="space-y-4">
                  <Card padding="md" hover={false} className="border-l-4 border-l-[#06B6D4]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#06B6D4] font-serif font-bold">RF</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">고주파 에너지</h4>
                        <p className="text-body text-mono-light">진피층에 열 에너지를 정밀하게 전달하여 콜라겐 수축과 재생을 유도, 피부 탄력을 개선합니다.</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-[#b4988d]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-serif font-bold">균일</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">정밀한 에너지 분포</h4>
                        <p className="text-body text-mono-light">균일하고 정밀한 에너지 전달로 효과적인 콜라겐 리모델링을 이끌어냅니다.</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-gradient-to-r from-[#8B5CF6] to-[#06B6D4]" style={{ borderLeftColor: '#D4AF37' }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#06B6D4]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-secondary font-serif font-bold">+</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">시너지 효과</h4>
                        <p className="text-body text-mono-light">두 에너지의 동시 작용으로 단독 시술 대비 더욱 강력하고 지속적인 리프팅 효과를 경험할 수 있습니다.</p>
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
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">Why Density?</p>
              <h2 className="text-h1 text-secondary">왜 덴서티인가?</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <DualEnergyIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">RF 고주파</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    정밀한 고주파 에너지로 <strong className="text-secondary">진피층 콜라겐을 균일하게 자극</strong>하여 탄력과 피부결을 동시에 개선합니다.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <MultiLayerIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">합리적 가격</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    써마지와 같은 고주파 계열이지만 <strong className="text-secondary">보다 합리적인 비용</strong>으로 꾸준한 리프팅 관리가 가능합니다.
                  </p>
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="lg" className="h-full text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="mb-4">
                    <CoolingIllustration />
                  </div>
                  <h3 className="text-h3 text-secondary mb-4">쿨링 시스템</h3>
                  <p className="text-body text-mono-light leading-relaxed">
                    내장 쿨링 시스템으로 <strong className="text-secondary">시술 중 통증을 최소화</strong>하고 표피를 보호하여 편안한 시술이 가능합니다.
                  </p>
                </div>
              </Card>
            </StaggerItem>
          </StaggerChildren>

          {/* Clinical evidence banner */}
          <AnimateOnScroll>
            <div className="mt-16 p-8 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-3xl text-white text-center">
              <p className="font-serif text-h3 opacity-80 mb-4">RF Lifting Benefits</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-h1 font-serif">RF</p>
                  <p className="text-small opacity-70">고주파 에너지</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">정밀</p>
                  <p className="text-small opacity-70">균일한 분포</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">40분</p>
                  <p className="text-small opacity-70">빠른 시술</p>
                </div>
                <div>
                  <p className="text-h1 font-serif">즉각</p>
                  <p className="text-small opacity-70">효과 확인</p>
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
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">Comparison</p>
              <h2 className="text-h1 text-secondary mb-4">덴서티 vs 타 장비</h2>
              <p className="text-body text-mono-light">
                정밀한 RF 에너지로 탄력과 모공을 동시에 케어합니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <Card padding="lg" hover={false}>
              <ComparisonTable />
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
                  <h4 className="text-h4 text-secondary mb-2">HIFU와의 복합 시술</h4>
                  <p className="text-body text-mono-light">
                    덴서티(RF)는 울쎄라피 프라임, 슈링크(HIFU) 계열과 병행 시 다양한 층을 아우르는 복합 탄력 시술이 가능합니다.
                    합리적인 비용으로 꾸준한 리프팅 관리를 원하시는 분께 적합합니다.
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
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">LIV Difference</p>
              <h2 className="text-h1 text-secondary">리브만의 덴서티</h2>
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
                  <h3 className="text-h4 text-secondary mb-3">맞춤형 에너지 설정</h3>
                  <p className="text-body text-mono-light">
                    피부 상태와 고민에 따라 RF 에너지 강도를 최적화하여
                    개인 맞춤 시술을 진행합니다.
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
                  <h3 className="text-h4 text-secondary mb-3">정품 장비 사용</h3>
                  <p className="text-body text-mono-light">
                    정품 덴서티 장비로 안전하고 효과적인 시술을 제공합니다.
                    정기적인 장비 점검으로 최상의 상태를 유지합니다.
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
                  <h3 className="text-h4 text-secondary mb-3">전문의 직접 시술</h3>
                  <p className="text-body text-mono-light">
                    피부과/성형외과 전문의가 직접 상담부터 시술까지 진행합니다.
                    풍부한 경험으로 최적의 결과를 도출합니다.
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
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">Results Timeline</p>
              <h2 className="text-h1 text-secondary mb-4">{t('common.timeline')}</h2>
              <p className="text-body text-mono-light">
                덴서티 시술 후 즉각적 효과와 점진적 개선이 함께 나타납니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="py-8 px-4 md:px-8">
              <EffectTimeline />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">Treatment Process</p>
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
      <section className="py-20 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 opacity-80 mb-2">Treatment Info</p>
              <h2 className="text-h1">시술 정보</h2>
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
                <p className="text-small opacity-70 mb-1">시술 시간</p>
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
                <p className="text-small opacity-70 mb-1">마취</p>
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
                <p className="text-small opacity-70 mb-1">회복 기간</p>
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
                <p className="text-small opacity-70 mb-1">효과 지속</p>
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
              <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">FAQ</p>
              <h2 className="text-h1 text-secondary">자주 묻는 질문</h2>
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
                  더 많은 의료 정보가 궁금하신가요?
                </p>
                <Link href="/medical">
                  <Button variant="outline">
                    의료정보 Q&A 더보기
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
              <p className="font-serif text-h3 opacity-80 mb-4">Ready for Transformation?</p>
              <h2 className="text-h1 mb-6">덴서티 상담 예약</h2>
              <p className="text-h4 opacity-90 mb-10 leading-relaxed">
                전문 의료진과 1:1 맞춤 상담을 통해<br />
                나에게 맞는 최적의 시술 계획을 수립해보세요.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="ghost" size="lg" className="bg-white !text-secondary hover:bg-[#8B5CF6] hover:!text-white w-full sm:w-auto">
                    무료 상담 예약하기
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
                  평일 10:00-19:00
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  신사역 4번 출구 도보 3분
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
                <p className="font-serif text-h3 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">Related Treatments</p>
                <h2 className="text-h1 text-secondary">함께 보면 좋은 시술</h2>
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
                            <p className="font-serif text-[#8B5CF6] mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-[#8B5CF6] transition-colors">
                              {related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{related.shortDesc}</p>
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
