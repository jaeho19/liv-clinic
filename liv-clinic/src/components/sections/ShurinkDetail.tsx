'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink, PriceTable, Breadcrumb } from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';
import { getLocalizedTreatment, getRelatedTreatmentLabel } from '@/lib/treatmentsI18n';

// 슈링크 HIFU 에너지 전달 일러스트
const HIFURapidFireIllustration = () => {
  const tUi = useTranslations('treatments.lifting.shurink.ui');
  return (
  <div className="relative w-full max-w-md mx-auto aspect-square">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      {/* 배경 그라데이션 */}
      <defs>
        <radialGradient id="shurinkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shurinkBeam" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="50%" stopColor="#0099CC" />
          <stop offset="100%" stopColor="#006699" />
        </linearGradient>
        <linearGradient id="skinLayer" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE4D6" />
          <stop offset="100%" stopColor="#FFCEB3" />
        </linearGradient>
      </defs>

      {/* 배경 빛 효과 */}
      <motion.circle
        cx="200"
        cy="100"
        r="80"
        fill="url(#shurinkGlow)"
        animate={{ r: [80, 100, 80], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* 핸드피스 */}
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* 핸드피스 몸체 */}
        <rect x="160" y="30" width="80" height="60" rx="10" fill="#2A2A2A" />
        <rect x="165" y="35" width="70" height="50" rx="8" fill="#3A3A3A" />

        {/* LED 표시등 */}
        <motion.circle
          cx="180"
          cy="50"
          r="4"
          fill="#00FF00"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <motion.circle
          cx="195"
          cy="50"
          r="4"
          fill="#00D4FF"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <motion.circle
          cx="210"
          cy="50"
          r="4"
          fill="#00D4FF"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
        />

        {/* 조사구 */}
        <rect x="175" y="90" width="50" height="30" rx="5" fill="#1A1A1A" />
        <rect x="180" y="95" width="40" height="20" rx="3" fill="#00D4FF" opacity="0.3" />
      </motion.g>

      {/* 고속 연사 HIFU 빔 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.g key={i}>
          <motion.line
            x1={185 + i * 8}
            y1="120"
            x2={185 + i * 8}
            y2="280"
            stroke="url(#shurinkBeam)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
            transition={{
              duration: 0.3,
              delay: i * 0.08,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
          {/* 빔 끝 에너지 포인트 */}
          <motion.circle
            cx={185 + i * 8}
            cy="280"
            r="6"
            fill="#00D4FF"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{
              duration: 0.4,
              delay: i * 0.08 + 0.2,
              repeat: Infinity,
              repeatDelay: 0.4,
            }}
          />
        </motion.g>
      ))}

      {/* 피부 레이어 */}
      <g>
        {/* 표피 */}
        <path
          d="M80 200 Q200 190 320 200 L320 220 Q200 210 80 220 Z"
          fill="#FFE4D6"
          opacity="0.9"
        />
        {/* 진피 */}
        <path
          d="M80 220 Q200 210 320 220 L320 260 Q200 250 80 260 Z"
          fill="#FFCEB3"
          opacity="0.9"
        />
        {/* SMAS층 */}
        <path
          d="M80 260 Q200 250 320 260 L320 300 Q200 290 80 300 Z"
          fill="#E5B89A"
          opacity="0.9"
        />
        {/* 근막 */}
        <path
          d="M80 300 Q200 290 320 300 L320 340 Q200 330 80 340 Z"
          fill="#D4A07A"
          opacity="0.9"
        />
      </g>

      {/* 레이어 라벨 */}
      <text x="340" y="215" fill="#666" fontSize="11" fontWeight="500">{tUi('layerEpidermis')}</text>
      <text x="340" y="245" fill="#666" fontSize="11" fontWeight="500">{tUi('layerDermis')}</text>
      <text x="340" y="285" fill="#666" fontSize="11" fontWeight="500">SMAS</text>
      <text x="340" y="325" fill="#666" fontSize="11" fontWeight="500">{tUi('layerFascia')}</text>

      {/* 에너지 집중점 표시 */}
      <motion.circle
        cx="200"
        cy="280"
        r="15"
        fill="none"
        stroke="#00D4FF"
        strokeWidth="2"
        strokeDasharray="4 2"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: '200px 280px' }}
      />

      {/* 고속 연사 표시 */}
      <motion.text
        x="200"
        y="380"
        textAnchor="middle"
        fill="#00D4FF"
        fontSize="14"
        fontWeight="600"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        ⚡ HIGH-SPEED SHOT
      </motion.text>
    </svg>
  </div>
  );
};

// 다양한 카트리지 일러스트
const CartridgeSystemIllustration = () => {
  const tUi = useTranslations('treatments.lifting.shurink.ui');
  return (
  <div className="relative w-full max-w-lg mx-auto aspect-[4/3]">
    <svg viewBox="0 0 500 380" className="w-full h-full">
      <defs>
        <linearGradient id="cartridge1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#0099CC" />
        </linearGradient>
        <linearGradient id="cartridge2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#0077AA" />
        </linearGradient>
        <linearGradient id="cartridge3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A8E8" />
          <stop offset="100%" stopColor="#005588" />
        </linearGradient>
        <linearGradient id="cartridge4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0088CC" />
          <stop offset="100%" stopColor="#004466" />
        </linearGradient>
      </defs>

      {/* 카트리지 1: 1.5mm */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <rect x="30" y="50" width="90" height="120" rx="10" fill="url(#cartridge1)" />
        <rect x="40" y="60" width="70" height="30" rx="5" fill="#fff" opacity="0.3" />
        <text x="75" y="82" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">1.5mm</text>
        <rect x="55" y="100" width="40" height="50" rx="5" fill="#1A1A1A" />
        <motion.rect
          x="60"
          y="105"
          width="30"
          height="40"
          rx="3"
          fill="#00D4FF"
          opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <text x="75" y="195" textAnchor="middle" fill="#333" fontSize="11" fontWeight="500">{tUi('layerEpidermisBox')}</text>
        <text x="75" y="210" textAnchor="middle" fill="#666" fontSize="10">{tUi('fineWrinklesPores')}</text>
      </motion.g>

      {/* 카트리지 2: 3.0mm */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <rect x="140" y="50" width="90" height="120" rx="10" fill="url(#cartridge2)" />
        <rect x="150" y="60" width="70" height="30" rx="5" fill="#fff" opacity="0.3" />
        <text x="185" y="82" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">3.0mm</text>
        <rect x="165" y="100" width="40" height="50" rx="5" fill="#1A1A1A" />
        <motion.rect
          x="170"
          y="105"
          width="30"
          height="40"
          rx="3"
          fill="#00BFFF"
          opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        <text x="185" y="195" textAnchor="middle" fill="#333" fontSize="11" fontWeight="500">{tUi('layerDermisBox')}</text>
        <text x="185" y="210" textAnchor="middle" fill="#666" fontSize="10">{tUi('collagenRegen')}</text>
      </motion.g>

      {/* 카트리지 3: 4.5mm */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <rect x="250" y="50" width="90" height="120" rx="10" fill="url(#cartridge3)" />
        <rect x="260" y="60" width="70" height="30" rx="5" fill="#fff" opacity="0.3" />
        <text x="295" y="82" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">4.5mm</text>
        <rect x="275" y="100" width="40" height="50" rx="5" fill="#1A1A1A" />
        <motion.rect
          x="280"
          y="105"
          width="30"
          height="40"
          rx="3"
          fill="#00A8E8"
          opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        />
        <text x="295" y="195" textAnchor="middle" fill="#333" fontSize="11" fontWeight="500">SMAS층</text>
        <text x="295" y="210" textAnchor="middle" fill="#666" fontSize="10">{tUi('liftingEffect')}</text>
      </motion.g>

      {/* 카트리지 4: 6.0mm/9.0mm */}
      <motion.g
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <rect x="360" y="50" width="110" height="120" rx="10" fill="url(#cartridge4)" />
        <rect x="370" y="60" width="90" height="30" rx="5" fill="#fff" opacity="0.3" />
        <text x="415" y="82" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">6.0/9.0mm</text>
        <rect x="390" y="100" width="50" height="50" rx="5" fill="#1A1A1A" />
        <motion.rect
          x="397"
          y="105"
          width="36"
          height="40"
          rx="3"
          fill="#0088CC"
          opacity="0.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
        />
        <text x="415" y="195" textAnchor="middle" fill="#333" fontSize="11" fontWeight="500">{tUi('layerDeepBox')}</text>
        <text x="415" y="210" textAnchor="middle" fill="#666" fontSize="10">{tUi('bodyDoubleChin')}</text>
      </motion.g>

      {/* 피부 단면 다이어그램 */}
      <g transform="translate(0, 230)">
        <rect x="30" y="20" width="440" height="120" rx="10" fill="#f8f4f0" stroke="#e0d8d0" strokeWidth="1" />

        {/* 레이어 */}
        <rect x="50" y="35" width="400" height="20" fill="#FFE4D6" rx="3" />
        <rect x="50" y="60" width="400" height="25" fill="#FFCEB3" rx="3" />
        <rect x="50" y="90" width="400" height="25" fill="#E5B89A" rx="3" />
        <rect x="50" y="120" width="400" height="15" fill="#D4A07A" rx="3" />

        {/* 깊이 화살표 */}
        <motion.line x1="95" y1="30" x2="95" y2="55" stroke="#00D4FF" strokeWidth="2" markerEnd="url(#arrowhead)"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.line x1="205" y1="30" x2="205" y2="85" stroke="#00BFFF" strokeWidth="2" markerEnd="url(#arrowhead)"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
        <motion.line x1="315" y1="30" x2="315" y2="115" stroke="#00A8E8" strokeWidth="2" markerEnd="url(#arrowhead)"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }} />
        <motion.line x1="430" y1="30" x2="430" y2="135" stroke="#0088CC" strokeWidth="2" markerEnd="url(#arrowhead)"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }} />
      </g>

      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  </div>
  );
};

// 고속 연사 비교 일러스트
const RapidShotComparisonIllustration = () => {
  const tUi = useTranslations('treatments.lifting.shurink.ui');
  return (
  <div className="relative w-full max-w-2xl mx-auto">
    <svg viewBox="0 0 600 250" className="w-full h-auto">
      {/* 기존 방식 */}
      <g>
        <text x="150" y="30" textAnchor="middle" fill="#999" fontSize="14" fontWeight="600">{tUi('legacyHifu')}</text>
        <rect x="50" y="50" width="200" height="80" rx="10" fill="#f5f5f5" stroke="#ddd" strokeWidth="1" />

        {/* 느린 단일 샷 */}
        {[0, 1, 2].map((i) => (
          <motion.g key={i}>
            <motion.circle
              cx={100 + i * 50}
              cy="90"
              r="12"
              fill="#ccc"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 1.5, delay: i * 0.8, repeat: Infinity }}
            />
          </motion.g>
        ))}

        <text x="150" y="155" textAnchor="middle" fill="#999" fontSize="11">{tUi('shotsLegacy')}</text>
        <text x="150" y="175" textAnchor="middle" fill="#999" fontSize="11">{tUi('timeLegacy')}</text>
      </g>

      {/* 슈링크 방식 */}
      <g>
        <text x="450" y="30" textAnchor="middle" fill="#00D4FF" fontSize="14" fontWeight="600">{tUi('shurinkLabel')}</text>
        <rect x="350" y="50" width="200" height="80" rx="10" fill="#E6F9FF" stroke="#00D4FF" strokeWidth="1" />

        {/* 고속 연사 */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.g key={i}>
            <motion.circle
              cx={380 + i * 25}
              cy="90"
              r="10"
              fill="#00D4FF"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 0.3, delay: i * 0.1, repeat: Infinity, repeatDelay: 0.5 }}
            />
          </motion.g>
        ))}

        <text x="450" y="155" textAnchor="middle" fill="#00D4FF" fontSize="11" fontWeight="500">{tUi('shotsShurink')}</text>
        <text x="450" y="175" textAnchor="middle" fill="#00D4FF" fontSize="11" fontWeight="500">{tUi('timeShurink')}</text>
      </g>

      {/* 화살표 */}
      <motion.g
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <path d="M270 90 L310 90 L300 80 M310 90 L300 100" stroke="#00D4FF" strokeWidth="3" fill="none" />
      </motion.g>

      {/* 속도 향상 표시 */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <rect x="265" y="190" width="70" height="30" rx="15" fill="#00D4FF" />
        <text x="300" y="210" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{tUi('threeXFaster')}</text>
      </motion.g>
    </svg>
  </div>
  );
};

// Hero 레이블 타입 정의
interface HeroLabel {
  top: { title: string; subtitle: string };
  bottom: { title: string; subtitle: string };
}

// HIFU 아이콘 컴포넌트
const HIFUIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ShurinkDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const treatment = getLocalizedTreatment(TREATMENTS.lifting.shurink, 'shurink', locale);
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);

  // 동적 레이블 데이터 (슈링크용)
  const heroLabels: HeroLabel[] = [
    {
      top: { title: t('lifting.shurink.detail.heroLabels.0.top.title'), subtitle: t('lifting.shurink.detail.heroLabels.0.top.subtitle') },
      bottom: { title: t('lifting.shurink.detail.heroLabels.0.bottom.title'), subtitle: t('lifting.shurink.detail.heroLabels.0.bottom.subtitle') }
    },
    {
      top: { title: t('lifting.shurink.detail.heroLabels.1.top.title'), subtitle: t('lifting.shurink.detail.heroLabels.1.top.subtitle') },
      bottom: { title: t('lifting.shurink.detail.heroLabels.1.bottom.title'), subtitle: t('lifting.shurink.detail.heroLabels.1.bottom.subtitle') }
    }
  ];

  // 동적 레이블 전환 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLabelIndex((prev) => (prev + 1) % heroLabels.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroLabels.length]);

  // 관련 Q&A 필터링
  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'shurink' || (id as string) === 'ulthera')
  );

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
    <>
      <Breadcrumb items={[{ navKey: 'lifting', href: '/lifting' }, { navKey: 'shurink' }]} />

      {/* Hero Section - Premium Full Screen (써마지/덴서티와 동일한 스타일) */}
      <section className="relative min-h-screen-dvh flex items-center pt-20 overflow-hidden">
        {/* Background gradient - 슈링크 색상 유지 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/10 via-background to-[#0099CC]/5" />

        {/* Animated background elements */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#00D4FF]/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[#0099CC]/5 blur-3xl"
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
                  <span className="text-[#00D4FF]"><HIFUIcon /></span>
                  <span className="text-small font-medium text-secondary">{t('lifting.shurink.detail.hero.badge')}</span>
                </motion.div>

                <p className="font-serif text-h2 text-[#00D4FF] mb-3 tracking-wide">Shurink</p>
                <h1 className="text-display text-secondary mb-4 leading-tight">
                  {t('lifting.shurink.detail.hero.title')}
                </h1>
                <p className="font-serif text-xl text-mono-light mb-6 italic">
                  {treatment.tagline}
                </p>
                <p
                  className="text-h4 text-mono leading-relaxed mb-8 max-w-lg"
                  dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.hero.description') }}
                />

                {/* Quick stats */}
                <div className="flex gap-8 mt-10 pt-8 border-t border-border/50">
                  <div>
                    <p className="text-h2 text-[#00D4FF] font-serif">{t('lifting.shurink.detail.hero.stats.speed.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.shurink.detail.hero.stats.speed.label')}</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#00D4FF] font-serif">{t('lifting.shurink.detail.hero.stats.time.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.shurink.detail.hero.stats.time.label')}</p>
                  </div>
                  <div>
                    <p className="text-h2 text-[#00D4FF] font-serif">{t('lifting.shurink.detail.hero.stats.cartridges.value')}</p>
                    <p className="text-small text-mono-light">{t('lifting.shurink.detail.hero.stats.cartridges.label')}</p>
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
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00D4FF]/30 via-[#D4AF37]/20 to-[#0099CC]/30 p-[2px]">
                    <div className="w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
                      {/* Hero Video */}
                      <video
                        src="/images/lifting/grok-video-1975e92a-fcdc-4070-8f5c-e36555261a40.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
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
                    <p className="text-small font-medium text-secondary">{heroLabels[currentLabelIndex]?.top.title}</p>
                    <p className="text-xs text-mono-light">{heroLabels[currentLabelIndex]?.top.subtitle}</p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`bottom-${currentLabelIndex}`}
                    className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-white rounded-2xl shadow-xl px-4 py-3"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: [0, 10, 0], scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      y: { duration: 3, repeat: Infinity, delay: 1 },
                      scale: { duration: 0.5 }
                    }}
                  >
                    <p className="text-small font-medium">{heroLabels[currentLabelIndex]?.bottom.title}</p>
                    <p className="text-xs opacity-80">{heroLabels[currentLabelIndex]?.bottom.subtitle}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Premium glow effect */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#00D4FF]/20 to-[#D4AF37]/20 blur-2xl opacity-50" />
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
          <svg className="w-6 h-6 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="shurink" />

      {/* About Section - 슈링크란? (써마지/덴서티와 동일한 구조) */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-[#00D4FF] mb-2">{t('lifting.shurink.detail.about.sectionLabel')}</p>
              <h2 className="text-h1 text-secondary mb-6">{t('lifting.shurink.detail.about.title')}</h2>
              <p
                className="text-body text-mono max-w-3xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.about.description') }}
              />
            </div>
          </AnimateOnScroll>

          {/* Technology explanation with HIFU illustration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimateOnScroll animation="fadeInLeft">
              <HIFURapidFireIllustration />
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="space-y-6">
                <h3 className="text-h2 text-secondary mb-4">
                  {t('lifting.shurink.detail.about.hifuPrinciple.title')}
                </h3>

                <div className="space-y-4">
                  <Card padding="md" hover={false} className="border-l-4 border-l-[#00D4FF]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00D4FF] font-serif font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">{t('lifting.shurink.detail.about.hifuPrinciple.steps.0.title')}</h4>
                        <p className="text-body text-mono-light">{t('lifting.shurink.detail.about.hifuPrinciple.steps.0.desc')}</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-[#00D4FF]/70">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00D4FF] font-serif font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">{t('lifting.shurink.detail.about.hifuPrinciple.steps.1.title')}</h4>
                        <p className="text-body text-mono-light">{t('lifting.shurink.detail.about.hifuPrinciple.steps.1.desc')}</p>
                      </div>
                    </div>
                  </Card>

                  <Card padding="md" hover={false} className="border-l-4 border-l-[#00D4FF]/50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#00D4FF]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00D4FF] font-serif font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="text-h4 text-secondary mb-1">{t('lifting.shurink.detail.about.hifuPrinciple.steps.2.title')}</h4>
                        <p className="text-body text-mono-light">{t('lifting.shurink.detail.about.hifuPrinciple.steps.2.desc')}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 슈링크 특장점 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
              <span className="text-xs tracking-[0.3em] text-[#D4AF37] uppercase font-medium">{t('lifting.shurink.detail.advantages.sectionLabel')}</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.advantages.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.shurink.detail.advantages.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {treatment.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-b from-[#E6F9FF] to-white border border-[#00D4FF]/10"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#00D4FF]/10 flex items-center justify-center">
                  <span className="text-2xl">
                    {index === 0 ? '⚡' : index === 1 ? '🎯' : index === 2 ? '✨' : '💰'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 고속 연사 비교 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.rapidShotSection.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.shurink.detail.rapidShotSection.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <RapidShotComparisonIllustration />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white rounded-xl shadow-sm"
            >
              <div className="text-4xl font-bold text-[#00D4FF] mb-2">{t('lifting.shurink.detail.rapidShotSection.stats.duration.value')}</div>
              <div className="text-gray-600">{t('lifting.shurink.detail.rapidShotSection.stats.duration.label')}</div>
              <div className="text-sm text-gray-400 mt-1">{t('lifting.shurink.detail.rapidShotSection.stats.duration.desc')}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 bg-white rounded-xl shadow-sm"
            >
              <div className="text-4xl font-bold text-[#00D4FF] mb-2">{t('lifting.shurink.detail.rapidShotSection.stats.shotsPerSec.value')}</div>
              <div className="text-gray-600">{t('lifting.shurink.detail.rapidShotSection.stats.shotsPerSec.label')}</div>
              <div className="text-sm text-gray-400 mt-1">{t('lifting.shurink.detail.rapidShotSection.stats.shotsPerSec.desc')}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-white rounded-xl shadow-sm"
            >
              <div className="text-4xl font-bold text-[#00D4FF] mb-2">{t('lifting.shurink.detail.rapidShotSection.stats.cartridges.value')}</div>
              <div className="text-gray-600">{t('lifting.shurink.detail.rapidShotSection.stats.cartridges.label')}</div>
              <div className="text-sm text-gray-400 mt-1">{t('lifting.shurink.detail.rapidShotSection.stats.cartridges.desc')}</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 카트리지 시스템 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.cartridgeSection.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.shurink.detail.cartridgeSection.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <CartridgeSystemIllustration />
          </motion.div>
        </div>
      </section>

      {/* 시술 부위 섹션 */}
      <section className="py-20 bg-gradient-to-b from-white to-[#E6F9FF]/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                {t('lifting.shurink.detail.targetAreas.title')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('lifting.shurink.detail.targetAreas.subtitle')}
              </p>

              <div className="space-y-4">
                {treatment.targetAreas.map((area, index) => (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#00D4FF]/10 flex items-center justify-center">
                      <span className="text-[#00D4FF]">✓</span>
                    </div>
                    <span className="text-gray-700 font-medium">{area}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative w-full max-w-[500px] mx-auto">
                <Image
                  src="/images/lifting/Gemini_Generated_Image_qy64jzqy64jzqy64.png"
                  alt={t('lifting.shurink.ui.diagramAlt')}
                  width={500}
                  height={600}
                  className="w-full h-auto object-contain"
                  quality={95}
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 시술 과정 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {t('common.process')}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* 연결선 */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00D4FF] to-[#0099CC] hidden md:block" />

              {treatment.process.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-20 pb-12 last:pb-0"
                >
                  <div className="absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.step}
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 시술 정보 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.treatmentInfo.title') }} />
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { label: t('lifting.shurink.detail.treatmentInfo.labels.duration'), value: treatment.duration, icon: '⏱️' },
              { label: t('lifting.shurink.detail.treatmentInfo.labels.anesthesia'), value: treatment.anesthesia, icon: '💉' },
              { label: t('lifting.shurink.detail.treatmentInfo.labels.recovery'), value: treatment.recovery, icon: '🔄' },
              { label: t('lifting.shurink.detail.treatmentInfo.labels.results'), value: treatment.results, icon: '✨' },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#00D4FF]/10 flex items-center justify-center text-2xl">
                  {info.icon}
                </div>
                <div>
                  <div className="text-sm text-gray-500">{info.label}</div>
                  <div className="text-lg font-medium text-gray-900">{info.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 울쎄라피 프라임 vs 슈링크 비교 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.comparison.title') }} />
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('lifting.shurink.detail.comparison.subtitle')}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-900 text-white">
                <div className="p-4 text-center font-medium">{t('lifting.shurink.detail.comparison.headers.feature')}</div>
                <div className="p-4 text-center font-medium border-l border-gray-700">{t('lifting.shurink.detail.comparison.headers.ulthera')}</div>
                <div className="p-4 text-center font-medium border-l border-gray-700 bg-[#00D4FF]">{t('lifting.shurink.detail.comparison.headers.shurink')}</div>
              </div>

              {(t.raw('lifting.shurink.detail.comparison.rows') as Array<{item: string; ulthera: string; shurink: string}>).map((row, index) => (
                <motion.div
                  key={row.item}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="p-4 font-medium text-gray-900">{row.item}</div>
                  <div className="p-4 text-center text-gray-600 border-l border-gray-100">{row.ulthera}</div>
                  <div className="p-4 text-center text-[#0099CC] font-medium border-l border-gray-100">{row.shurink}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 이런 분께 추천 섹션 */}
      <section className="py-20 bg-gradient-to-b from-[#E6F9FF]/30 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {t('common.recommended')}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            {treatment.idealFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#00D4FF] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.faq.title') }} />
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {treatment.faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-50 rounded-xl overflow-hidden"
              >
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <span className="text-[#00D4FF] transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>

          {/* 관련 의료정보 Q&A */}
          {relatedMedicalQA.length > 0 && (
            <div className="max-w-3xl mx-auto mt-12">
              <h3 className="text-xl font-medium text-gray-900 mb-6 text-center">
                {t('lifting.shurink.detail.faq.relatedQa')}
              </h3>
              <div className="space-y-4">
                {relatedMedicalQA.slice(0, 3).map((qa, index) => (
                  <motion.details
                    key={qa.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-[#E6F9FF]/50 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                      <span className="font-medium text-gray-900 pr-4">{qa.question}</span>
                      <span className="text-[#00D4FF] transform group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-gray-600">
                      {qa.answer}
                    </div>
                  </motion.details>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link
                  href="/medical"
                  className="text-[#00D4FF] hover:text-[#0099CC] font-medium inline-flex items-center gap-2"
                >
                  {t('lifting.shurink.detail.faq.moreLink')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 주의사항 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-8 text-center" dangerouslySetInnerHTML={{ __html: t('lifting.shurink.detail.cautions.title') }} />
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <ul className="space-y-4">
                {treatment.cautions.map((caution, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs">!</span>
                    </span>
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-[#00D4FF] to-[#0099CC]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              {t('lifting.shurink.detail.cta.title')}
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              {t('lifting.shurink.detail.cta.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white text-[#00D4FF] font-medium rounded-full hover:bg-gray-100 transition-colors"
              >
                {t('lifting.shurink.detail.cta.onlineButton')}
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                {t('lifting.shurink.detail.cta.phoneButton')} 02-797-2773
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Treatments */}
      {treatment.relatedTreatments && treatment.relatedTreatments.length > 0 && (
        <section className="section-gap-sm bg-white pb-24 md:pb-32">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-h1 text-secondary">{tCommon('relatedTreatments')}</h2>
              </div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
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
                            <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">{l10n?.name ?? related.name}</h3>
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
