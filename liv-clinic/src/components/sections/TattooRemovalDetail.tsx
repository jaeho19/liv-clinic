'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { motion } from 'framer-motion';
import { AnimateOnScroll, PriceTable } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { LASER_EQUIPMENT } from '@/lib/constants';

// 피코초 vs 나노초 비교 일러스트레이션
interface PicoVsNanoProps {
  labels: {
    title: string;
    nanosecond: string;
    nanosecondDevice: string;
    picosecond: string;
    picosecondDevice: string;
    before: string;
    after: string;
    photothermal: string;
    photothermalResult: string;
    photoacoustic: string;
    photoacousticResult: string;
  };
}

const PicoVsNanoIllustration = ({ labels }: PicoVsNanoProps) => (
  <svg viewBox="0 0 500 300" className="w-full h-auto">
    <defs>
      <linearGradient id="inkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2c3e50" />
        <stop offset="100%" stopColor="#1a252f" />
      </linearGradient>
    </defs>

    {/* 배경 */}
    <rect x="0" y="0" width="500" height="300" fill="#fafafa" />

    {/* 제목 */}
    <text x="250" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">
      {labels.title}
    </text>

    {/* 나노초 섹션 */}
    <g transform="translate(30, 50)">
      <text x="100" y="15" fontSize="12" fill="#8a8a8a" textAnchor="middle" fontWeight="600">{labels.nanosecond}</text>
      <text x="100" y="30" fontSize="10" fill="#8a8a8a" textAnchor="middle">{labels.nanosecondDevice}</text>

      {/* 큰 잉크 입자 */}
      <g transform="translate(0, 50)">
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">{labels.before}</text>
        <circle cx="70" cy="40" r="25" fill="url(#inkGradient)" />
        <circle cx="130" cy="45" r="22" fill="url(#inkGradient)" />
      </g>

      {/* 화살표 */}
      <motion.path
        d="M 100 120 L 100 145"
        stroke="#8a8a8a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
      />
      <polygon points="95,143 100,153 105,143" fill="#8a8a8a" />

      {/* 중간 크기 입자 */}
      <g transform="translate(0, 160)">
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">{labels.after}</text>
        <circle cx="55" cy="35" r="12" fill="url(#inkGradient)" />
        <circle cx="85" cy="40" r="10" fill="url(#inkGradient)" />
        <circle cx="110" cy="32" r="11" fill="url(#inkGradient)" />
        <circle cx="140" cy="38" r="13" fill="url(#inkGradient)" />
      </g>

      {/* 결과 설명 */}
      <rect x="20" y="220" width="160" height="35" fill="#f5f5f5" rx="4" />
      <text x="100" y="238" fontSize="9" fill="#8a8a8a" textAnchor="middle">{labels.photothermal}</text>
      <text x="100" y="250" fontSize="9" fill="#8a8a8a" textAnchor="middle">{labels.photothermalResult}</text>
    </g>

    {/* VS 구분선 */}
    <line x1="250" y1="50" x2="250" y2="270" stroke="#e5e5e5" strokeWidth="2" strokeDasharray="5,5" />
    <circle cx="250" cy="160" r="18" fill="white" stroke="#b4988d" strokeWidth="2" />
    <text x="250" y="165" fontSize="11" fill="#b4988d" textAnchor="middle" fontWeight="600">VS</text>

    {/* 피코초 섹션 */}
    <g transform="translate(280, 50)">
      <text x="100" y="15" fontSize="12" fill="#b4988d" textAnchor="middle" fontWeight="600">{labels.picosecond}</text>
      <text x="100" y="30" fontSize="10" fill="#b4988d" textAnchor="middle">{labels.picosecondDevice}</text>

      {/* 큰 잉크 입자 */}
      <g transform="translate(0, 50)">
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">{labels.before}</text>
        <circle cx="70" cy="40" r="25" fill="url(#inkGradient)" />
        <circle cx="130" cy="45" r="22" fill="url(#inkGradient)" />
      </g>

      {/* 화살표 - 더 강조 */}
      <motion.path
        d="M 100 120 L 100 145"
        stroke="#b4988d"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
      />
      <polygon points="93,143 100,158 107,143" fill="#b4988d" />

      {/* 잔입자들 */}
      <g transform="translate(0, 160)">
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">{labels.after}</text>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* 매우 작은 입자들 */}
          <circle cx="45" cy="30" r="4" fill="url(#inkGradient)" />
          <circle cx="60" cy="42" r="3" fill="url(#inkGradient)" />
          <circle cx="72" cy="28" r="5" fill="url(#inkGradient)" />
          <circle cx="85" cy="38" r="3" fill="url(#inkGradient)" />
          <circle cx="95" cy="25" r="4" fill="url(#inkGradient)" />
          <circle cx="108" cy="40" r="3" fill="url(#inkGradient)" />
          <circle cx="120" cy="32" r="5" fill="url(#inkGradient)" />
          <circle cx="135" cy="45" r="3" fill="url(#inkGradient)" />
          <circle cx="148" cy="30" r="4" fill="url(#inkGradient)" />
          <circle cx="55" cy="50" r="3" fill="url(#inkGradient)" />
          <circle cx="78" cy="52" r="4" fill="url(#inkGradient)" />
          <circle cx="102" cy="55" r="3" fill="url(#inkGradient)" />
          <circle cx="128" cy="52" r="4" fill="url(#inkGradient)" />
        </motion.g>
      </g>

      {/* 결과 설명 */}
      <rect x="20" y="220" width="160" height="35" fill="#b4988d" opacity="0.1" rx="4" />
      <text x="100" y="238" fontSize="9" fill="#b4988d" textAnchor="middle" fontWeight="500">{labels.photoacoustic}</text>
      <text x="100" y="250" fontSize="9" fill="#b4988d" textAnchor="middle" fontWeight="500">{labels.photoacousticResult}</text>
    </g>
  </svg>
);

// 색상별 파장 타겟팅 일러스트레이션
interface ColorWavelengthProps {
  labels: {
    title: string;
    colors: {
      black: { name: string; wavelength: string; difficulty: string };
      red: { name: string; wavelength: string; difficulty: string };
      blue: { name: string; wavelength: string; difficulty: string };
      green: { name: string; wavelength: string; difficulty: string };
    };
    lucasNote: string;
  };
}

const ColorWavelengthIllustration = ({ labels }: ColorWavelengthProps) => (
  <svg viewBox="0 0 400 200" className="w-full h-auto">
    {/* 배경 */}
    <rect x="0" y="0" width="400" height="200" fill="#fafafa" />

    {/* 제목 */}
    <text x="200" y="25" fontSize="13" fill="#575756" textAnchor="middle" fontWeight="600">
      {labels.title}
    </text>

    {/* 색상 원들 */}
    <g transform="translate(0, 50)">
      {/* 검정 */}
      <g transform="translate(50, 0)">
        <circle cx="30" cy="50" r="28" fill="#1a1a1a" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">{labels.colors.black.name}</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">{labels.colors.black.wavelength}</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">{labels.colors.black.difficulty}</text>
      </g>

      {/* 빨강/주황 */}
      <g transform="translate(130, 0)">
        <circle cx="30" cy="50" r="28" fill="#e74c3c" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">{labels.colors.red.name}</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">{labels.colors.red.wavelength}</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">{labels.colors.red.difficulty}</text>
      </g>

      {/* 파랑/녹색 */}
      <g transform="translate(210, 0)">
        <circle cx="30" cy="50" r="28" fill="#3498db" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">{labels.colors.blue.name}</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">{labels.colors.blue.wavelength}</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">{labels.colors.blue.difficulty}</text>
      </g>

      {/* 녹색 */}
      <g transform="translate(290, 0)">
        <circle cx="30" cy="50" r="28" fill="#27ae60" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">{labels.colors.green.name}</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">{labels.colors.green.wavelength}</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">{labels.colors.green.difficulty}</text>
      </g>
    </g>

    {/* 하단 설명 */}
    <rect x="50" y="170" width="300" height="24" fill="#b4988d" opacity="0.1" rx="12" />
    <text x="200" y="186" fontSize="10" fill="#b4988d" textAnchor="middle" fontWeight="500">
      {labels.lucasNote}
    </text>
  </svg>
);

// 문신 유형 카드
interface TattooTypeCardProps {
  type: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyLabel: string;
  sessions: string;
  notes: string;
  estimatedSessionsLabel: string;
}

const TattooTypeCard = ({ type, description, difficulty, difficultyLabel, sessions, notes, estimatedSessionsLabel }: TattooTypeCardProps) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700'
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all h-full"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-lg font-semibold text-[var(--color-secondary)]">{type}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[difficulty]}`}>
          {difficultyLabel}
        </span>
      </div>
      <p className="text-sm text-[var(--color-mono)] mb-4">{description}</p>
      <div className="pt-3 border-t border-[var(--color-border)]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[var(--color-mono-light)]">{estimatedSessionsLabel}</span>
          <span className="text-sm font-medium text-[var(--color-secondary)]">{sessions}</span>
        </div>
        <p className="text-xs text-[var(--color-mono-light)]">{notes}</p>
      </div>
    </motion.div>
  );
};

// 치료 단계 타임라인
interface TimelineStepProps {
  step: number;
  title: string;
  description: string;
  duration: string;
}

const TimelineStep = ({ step, title, description, duration }: TimelineStepProps) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-sm">
        {step}
      </div>
      {step < 4 && <div className="w-0.5 h-full bg-[var(--color-primary)]/20 mt-2" />}
    </div>
    <div className="pb-8">
      <h4 className="font-semibold text-[var(--color-secondary)] mb-1">{title}</h4>
      <p className="text-sm text-[var(--color-mono)] mb-2">{description}</p>
      <span className="text-xs text-[var(--color-primary)] font-medium">{duration}</span>
    </div>
  </div>
);

// FAQ 아이템
interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  id?: string;
}

const FAQItem = ({ question, answer, isOpen, onClick, id }: FAQItemProps) => {
  const handleClick = () => {
    onClick();
    // 열릴 때만 스크롤 (현재 닫혀있을 때)
    if (!isOpen) {
      requestAnimationFrame(() => {
        const el = id ? document.getElementById(id) : null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollOffset = 120; // 헤더 높이(96px) + 여유 공간(24px)
        const scrollTop = window.scrollY + rect.top - scrollOffset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      });
    }
  };

  return (
    <div id={id} className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={handleClick}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-[var(--color-secondary)] pr-4">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[var(--color-primary)] flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-[var(--color-mono)] leading-relaxed whitespace-pre-line">{answer}</p>
      </motion.div>
    </div>
  );
};

export default function TattooRemovalDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  // 번역된 데이터
  const detail = {
    breadcrumb: t('laser.tattoo.detail.breadcrumb'),
    hero: {
      title: t('laser.tattoo.detail.hero.title'),
      subtitle: t('laser.tattoo.detail.hero.subtitle'),
      description: t('laser.tattoo.detail.hero.description'),
    },
    picoTech: {
      badge: t('laser.tattoo.detail.picoTech.badge'),
      title: t('laser.tattoo.detail.picoTech.title'),
      description1: t('laser.tattoo.detail.picoTech.description1'),
      description2: t('laser.tattoo.detail.picoTech.description2'),
      benefits: [0, 1, 2].map(i => ({
        title: t(`laser.tattoo.detail.picoTech.benefits.${i}.title`),
        desc: t(`laser.tattoo.detail.picoTech.benefits.${i}.desc`),
      })),
      illustration: {
        title: t('laser.tattoo.detail.picoTech.illustration.title'),
        nanosecond: t('laser.tattoo.detail.picoTech.illustration.nanosecond'),
        nanosecondDevice: t('laser.tattoo.detail.picoTech.illustration.nanosecondDevice'),
        picosecond: t('laser.tattoo.detail.picoTech.illustration.picosecond'),
        picosecondDevice: t('laser.tattoo.detail.picoTech.illustration.picosecondDevice'),
        before: t('laser.tattoo.detail.picoTech.illustration.before'),
        after: t('laser.tattoo.detail.picoTech.illustration.after'),
        photothermal: t('laser.tattoo.detail.picoTech.illustration.photothermal'),
        photothermalResult: t('laser.tattoo.detail.picoTech.illustration.photothermalResult'),
        photoacoustic: t('laser.tattoo.detail.picoTech.illustration.photoacoustic'),
        photoacousticResult: t('laser.tattoo.detail.picoTech.illustration.photoacousticResult'),
      },
    },
    colorWavelength: {
      badge: t('laser.tattoo.detail.colorWavelength.badge'),
      title: t('laser.tattoo.detail.colorWavelength.title'),
      subtitle: t('laser.tattoo.detail.colorWavelength.subtitle'),
      illustrationTitle: t('laser.tattoo.detail.colorWavelength.illustrationTitle'),
      colors: {
        black: {
          name: t('laser.tattoo.detail.colorWavelength.colors.black.name'),
          wavelength: t('laser.tattoo.detail.colorWavelength.colors.black.wavelength'),
          difficulty: t('laser.tattoo.detail.colorWavelength.colors.black.difficulty'),
        },
        red: {
          name: t('laser.tattoo.detail.colorWavelength.colors.red.name'),
          wavelength: t('laser.tattoo.detail.colorWavelength.colors.red.wavelength'),
          difficulty: t('laser.tattoo.detail.colorWavelength.colors.red.difficulty'),
        },
        blue: {
          name: t('laser.tattoo.detail.colorWavelength.colors.blue.name'),
          wavelength: t('laser.tattoo.detail.colorWavelength.colors.blue.wavelength'),
          difficulty: t('laser.tattoo.detail.colorWavelength.colors.blue.difficulty'),
        },
        green: {
          name: t('laser.tattoo.detail.colorWavelength.colors.green.name'),
          wavelength: t('laser.tattoo.detail.colorWavelength.colors.green.wavelength'),
          difficulty: t('laser.tattoo.detail.colorWavelength.colors.green.difficulty'),
        },
      },
      lucasNote: t('laser.tattoo.detail.colorWavelength.lucasNote'),
      wavelengths: [0, 1, 2].map(i => ({
        wavelength: t(`laser.tattoo.detail.colorWavelength.wavelengths.${i}.wavelength`),
        colors: t(`laser.tattoo.detail.colorWavelength.wavelengths.${i}.colors`),
        note: t(`laser.tattoo.detail.colorWavelength.wavelengths.${i}.note`),
      })),
    },
    tattooTypes: {
      badge: t('laser.tattoo.detail.tattooTypes.badge'),
      title: t('laser.tattoo.detail.tattooTypes.title'),
      subtitle: t('laser.tattoo.detail.tattooTypes.subtitle'),
      estimatedSessions: t('laser.tattoo.detail.tattooTypes.estimatedSessions'),
      difficulty: {
        easy: t('laser.tattoo.detail.tattooTypes.difficulty.easy'),
        medium: t('laser.tattoo.detail.tattooTypes.difficulty.medium'),
        hard: t('laser.tattoo.detail.tattooTypes.difficulty.hard'),
      },
      types: [0, 1, 2, 3, 4, 5].map(i => ({
        type: t(`laser.tattoo.detail.tattooTypes.types.${i}.type`),
        description: t(`laser.tattoo.detail.tattooTypes.types.${i}.description`),
        sessions: t(`laser.tattoo.detail.tattooTypes.types.${i}.sessions`),
        notes: t(`laser.tattoo.detail.tattooTypes.types.${i}.notes`),
      })),
    },
    process: {
      badge: t('laser.tattoo.detail.process.badge'),
      title: t('laser.tattoo.detail.process.title'),
      steps: [0, 1, 2, 3].map(i => ({
        step: i + 1,
        title: t(`laser.tattoo.detail.process.steps.${i}.title`),
        description: t(`laser.tattoo.detail.process.steps.${i}.description`),
        duration: t(`laser.tattoo.detail.process.steps.${i}.duration`),
      })),
    },
    lucas: {
      title: t('laser.tattoo.detail.lucas.title'),
      subtitle: t('laser.tattoo.detail.lucas.subtitle'),
      specs: {
        pulseDuration: {
          label: t('laser.tattoo.detail.lucas.specs.pulseDuration.label'),
          value: t('laser.tattoo.detail.lucas.specs.pulseDuration.value'),
        },
        wavelength: {
          label: t('laser.tattoo.detail.lucas.specs.wavelength.label'),
          value: t('laser.tattoo.detail.lucas.specs.wavelength.value'),
        },
        repetitionRate: {
          label: t('laser.tattoo.detail.lucas.specs.repetitionRate.label'),
          value: t('laser.tattoo.detail.lucas.specs.repetitionRate.value'),
        },
        energy: {
          label: t('laser.tattoo.detail.lucas.specs.energy.label'),
          value: t('laser.tattoo.detail.lucas.specs.energy.value'),
        },
      },
      strengths: {
        title: t('laser.tattoo.detail.lucas.strengths.title'),
        items: [0, 1, 2].map(i => t(`laser.tattoo.detail.lucas.strengths.items.${i}`)),
      },
    },
    precautions: {
      before: {
        title: t('laser.tattoo.detail.precautions.before.title'),
        items: [0, 1, 2, 3].map(i => t(`laser.tattoo.detail.precautions.before.items.${i}`)),
      },
      after: {
        title: t('laser.tattoo.detail.precautions.after.title'),
        items: [0, 1, 2, 3].map(i => t(`laser.tattoo.detail.precautions.after.items.${i}`)),
      },
    },
    faq: [0, 1, 2, 3, 4, 5].map(i => ({
      question: t(`laser.tattoo.detail.faq.${i}.q`),
      answer: t(`laser.tattoo.detail.faq.${i}.a`),
    })),
    cta: {
      title: t('laser.tattoo.detail.cta.title'),
      description: t('laser.tattoo.detail.cta.description'),
    },
  };

  // 문신 유형별 난이도 매핑 (순서: easy, medium, hard, medium, medium, hard)
  const difficultyMap = ['easy', 'medium', 'hard', 'medium', 'medium', 'hard'] as const;

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-white to-[var(--color-background)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              {/* 브레드크럼 */}
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-mono-light)] mb-6">
                <Link href="/laser" className="hover:text-[var(--color-primary)] transition-colors">{t('common.laserCenter')}</Link>
                <span>/</span>
                <span className="text-[var(--color-secondary)]">{detail.breadcrumb}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-secondary)] mb-6">
                {detail.hero.title}
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium mb-4">
                {detail.hero.subtitle}
              </p>
              <p className="text-lg text-[var(--color-mono)] max-w-2xl mx-auto leading-relaxed">
                {detail.hero.description}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="tattoo" />

      {/* 피코레이저 원리 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 텍스트 */}
              <AnimateOnScroll animation="fadeInUp">
                <div>
                  <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                    {detail.picoTech.badge}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-6">
                    {detail.picoTech.title}
                  </h2>
                  <div className="space-y-4 text-[var(--color-mono)]">
                    <p className="leading-relaxed">
                      {detail.picoTech.description1}
                    </p>
                    <p className="leading-relaxed">
                      {detail.picoTech.description2}
                    </p>
                  </div>

                  {/* 핵심 장점 */}
                  <div className="mt-6 space-y-3">
                    {detail.picoTech.benefits.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <span className="font-medium text-[var(--color-secondary)]">{item.title}</span>
                          <span className="text-[var(--color-mono-light)]"> - {item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 일러스트레이션 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <PicoVsNanoIllustration labels={detail.picoTech.illustration} />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* 색상별 파장 섹션 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                {detail.colorWavelength.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.colorWavelength.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.colorWavelength.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-[var(--color-background)] rounded-2xl p-6">
              <ColorWavelengthIllustration labels={{
                title: detail.colorWavelength.illustrationTitle,
                colors: detail.colorWavelength.colors,
                lucasNote: detail.colorWavelength.lucasNote,
              }} />
            </div>
          </AnimateOnScroll>

          {/* 파장별 상세 */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            {detail.colorWavelength.wavelengths.map((item, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] text-center">
                  <div className="text-2xl font-bold text-[var(--color-primary)] mb-2">{item.wavelength}</div>
                  <p className="text-sm font-medium text-[var(--color-secondary)] mb-1">{item.colors}</p>
                  <p className="text-xs text-[var(--color-mono-light)]">{item.note}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 문신 유형별 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                {detail.tattooTypes.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.tattooTypes.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.tattooTypes.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {detail.tattooTypes.types.map((tattoo, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.05}>
                <TattooTypeCard
                  type={tattoo.type}
                  description={tattoo.description}
                  difficulty={difficultyMap[idx]}
                  difficultyLabel={detail.tattooTypes.difficulty[difficultyMap[idx]]}
                  sessions={tattoo.sessions}
                  notes={tattoo.notes}
                  estimatedSessionsLabel={detail.tattooTypes.estimatedSessions}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 치료 과정 섹션 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* 타임라인 */}
              <AnimateOnScroll animation="fadeInUp">
                <div>
                  <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                    {detail.process.badge}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-8">
                    {detail.process.title}
                  </h2>

                  <div>
                    {detail.process.steps.map((step, idx) => (
                      <TimelineStep key={idx} {...step} />
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 장비 소개 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/5 rounded-2xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold text-[var(--color-secondary)] mb-2">
                    {detail.lucas.title}
                  </h3>
                  <p className="text-[var(--color-primary)] font-medium mb-6">
                    {detail.lucas.subtitle}
                  </p>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">{detail.lucas.specs.pulseDuration.label}</span>
                        <span className="font-bold text-[var(--color-secondary)]">{detail.lucas.specs.pulseDuration.value}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">{detail.lucas.specs.wavelength.label}</span>
                        <span className="font-bold text-[var(--color-secondary)]">{detail.lucas.specs.wavelength.value}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">{detail.lucas.specs.repetitionRate.label}</span>
                        <span className="font-bold text-[var(--color-secondary)]">{detail.lucas.specs.repetitionRate.value}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">{detail.lucas.specs.energy.label}</span>
                        <span className="font-bold text-[var(--color-secondary)]">{detail.lucas.specs.energy.value}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                    <h4 className="font-semibold text-[var(--color-secondary)] mb-3">{detail.lucas.strengths.title}</h4>
                    <ul className="space-y-2 text-sm text-[var(--color-mono)]">
                      {detail.lucas.strengths.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* 주의사항 섹션 */}
      <section className="py-16 md:py-24 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t('common.precautions')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">{t('common.before').charAt(0)}</span>
                  {detail.precautions.before.title}
                </h3>
                <ul className="space-y-3 text-white/90">
                  {detail.precautions.before.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--color-primary)]">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">{t('common.after').charAt(0)}</span>
                  {detail.precautions.after.title}
                </h3>
                <ul className="space-y-3 text-white/90">
                  {detail.precautions.after.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--color-primary)]">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {tCommon('faq')}
              </h2>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              {detail.faq.map((faq, idx) => (
                <FAQItem
                  key={idx}
                  id={`faq-${idx}`}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === idx}
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                />
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[var(--color-background)] to-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.cta.title}
              </h2>
              <p className="text-[var(--color-mono)] mb-8 leading-relaxed">
                {detail.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  {t('common.freeConsultation')}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a
                  href="tel:02-797-2773"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-secondary)] px-8 py-4 rounded-full font-medium border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {t('common.phoneConsultation')} 02-797-2773
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}
