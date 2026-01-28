'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';
import { Link } from '@/i18n/routing';

// TypeScript interfaces for translations
interface BodyAreaItem {
  area: string;
  sessions: string;
  interval: string;
  description: string;
}

interface AdvantageItem {
  title: string;
  description: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface WavelengthLabels {
  title: string;
  wavelength755: string;
  wavelength755Desc: string;
  wavelength1064: string;
  wavelength1064Desc: string;
  epidermis: string;
  dermis: string;
  lightSkin: string;
  darkSkin: string;
}

interface IntelliTrakLabels {
  title: string;
  description1: string;
  description2: string;
}

// 755nm vs 1064nm 파장 비교 일러스트레이션
interface WavelengthComparisonProps {
  labels: WavelengthLabels;
}

const WavelengthComparisonIllustration = ({ labels }: WavelengthComparisonProps) => (
  <svg viewBox="0 0 500 320" className="w-full h-auto">
    <defs>
      <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fce4d6" />
        <stop offset="40%" stopColor="#f5d5c8" />
        <stop offset="100%" stopColor="#e8c4b8" />
      </linearGradient>
      <linearGradient id="follicleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8b6914" />
        <stop offset="100%" stopColor="#5a4010" />
      </linearGradient>
    </defs>

    {/* 배경 */}
    <rect x="0" y="0" width="500" height="320" fill="#fafafa" />

    {/* 제목 */}
    <text x="250" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">
      {labels.title}
    </text>

    {/* 755nm 섹션 */}
    <g transform="translate(50, 45)">
      <text x="75" y="15" fontSize="12" fill="#b4988d" textAnchor="middle" fontWeight="600">{labels.wavelength755}</text>
      <text x="75" y="30" fontSize="10" fill="#8a8a8a" textAnchor="middle">{labels.wavelength755Desc}</text>

      {/* 피부 단면 */}
      <rect x="0" y="45" width="150" height="200" fill="url(#skinGradient)" rx="4" />

      {/* 표피/진피 라벨 */}
      <line x1="155" y1="75" x2="165" y2="75" stroke="#ccc" strokeWidth="1" />
      <text x="170" y="78" fontSize="8" fill="#8a8a8a">{labels.epidermis}</text>
      <line x1="155" y1="130" x2="165" y2="130" stroke="#ccc" strokeWidth="1" />
      <text x="170" y="133" fontSize="8" fill="#8a8a8a">{labels.dermis}</text>

      {/* 모낭 */}
      <ellipse cx="50" cy="180" rx="12" ry="35" fill="url(#follicleGradient)" />
      <ellipse cx="100" cy="175" rx="10" ry="30" fill="url(#follicleGradient)" />

      {/* 털 */}
      <line x1="50" y1="45" x2="50" y2="145" stroke="#4a3a10" strokeWidth="2" />
      <line x1="100" y1="45" x2="100" y2="145" stroke="#4a3a10" strokeWidth="2" />

      {/* 755nm 레이저 빔 - 얕은 침투 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.5, 0.9, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <path d="M 30 50 L 50 130" stroke="#b4988d" strokeWidth="15" opacity="0.4" strokeLinecap="round" />
        <path d="M 80 50 L 100 125" stroke="#b4988d" strokeWidth="15" opacity="0.4" strokeLinecap="round" />
        {/* 모낭 히팅 효과 */}
        <ellipse cx="50" cy="165" rx="18" ry="40" fill="none" stroke="#b4988d" strokeWidth="2" opacity="0.6" />
        <ellipse cx="100" cy="160" rx="15" ry="35" fill="none" stroke="#b4988d" strokeWidth="2" opacity="0.6" />
      </motion.g>
    </g>

    {/* 1064nm 섹션 */}
    <g transform="translate(280, 45)">
      <text x="75" y="15" fontSize="12" fill="#6d4e42" textAnchor="middle" fontWeight="600">{labels.wavelength1064}</text>
      <text x="75" y="30" fontSize="10" fill="#8a8a8a" textAnchor="middle">{labels.wavelength1064Desc}</text>

      {/* 피부 단면 */}
      <rect x="0" y="45" width="150" height="200" fill="url(#skinGradient)" rx="4" />

      {/* 모낭 */}
      <ellipse cx="50" cy="200" rx="12" ry="35" fill="url(#follicleGradient)" />
      <ellipse cx="100" cy="195" rx="10" ry="30" fill="url(#follicleGradient)" />

      {/* 털 */}
      <line x1="50" y1="45" x2="50" y2="165" stroke="#4a3a10" strokeWidth="2" />
      <line x1="100" y1="45" x2="100" y2="165" stroke="#4a3a10" strokeWidth="2" />

      {/* 1064nm 레이저 빔 - 깊은 침투 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.5, 0.9, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      >
        <path d="M 30 50 L 50 175" stroke="#6d4e42" strokeWidth="12" opacity="0.4" strokeLinecap="round" />
        <path d="M 80 50 L 100 170" stroke="#6d4e42" strokeWidth="12" opacity="0.4" strokeLinecap="round" />
        {/* 모낭 히팅 효과 */}
        <ellipse cx="50" cy="195" rx="18" ry="40" fill="none" stroke="#6d4e42" strokeWidth="2" opacity="0.6" />
        <ellipse cx="100" cy="190" rx="15" ry="35" fill="none" stroke="#6d4e42" strokeWidth="2" opacity="0.6" />
      </motion.g>
    </g>

    {/* VS 구분선 */}
    <line x1="250" y1="60" x2="250" y2="280" stroke="#e5e5e5" strokeWidth="2" strokeDasharray="5,5" />
    <circle cx="250" cy="170" r="20" fill="white" stroke="#e5e5e5" strokeWidth="2" />
    <text x="250" y="175" fontSize="12" fill="#8a8a8a" textAnchor="middle" fontWeight="600">VS</text>

    {/* 하단 설명 */}
    <g transform="translate(0, 290)">
      <rect x="60" y="0" width="130" height="24" fill="#b4988d" opacity="0.1" rx="12" />
      <text x="125" y="16" fontSize="10" fill="#b4988d" textAnchor="middle" fontWeight="500">{labels.lightSkin}</text>

      <rect x="310" y="0" width="130" height="24" fill="#6d4e42" opacity="0.1" rx="12" />
      <text x="375" y="16" fontSize="10" fill="#6d4e42" textAnchor="middle" fontWeight="500">{labels.darkSkin}</text>
    </g>
  </svg>
);

// IntelliTrak 기술 일러스트레이션
interface IntelliTrakIllustrationProps {
  labels: IntelliTrakLabels;
}

const IntelliTrakIllustration = ({ labels }: IntelliTrakIllustrationProps) => (
  <svg viewBox="0 0 400 250" className="w-full h-auto">
    <defs>
      <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#b4988d" />
        <stop offset="100%" stopColor="#6d4e42" />
      </linearGradient>
    </defs>

    {/* 배경 */}
    <rect x="0" y="0" width="400" height="250" fill="#fafafa" />

    {/* 제목 */}
    <text x="200" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">
      {labels.title}
    </text>

    {/* 피부 표면 */}
    <path d="M 50 100 Q 100 90 150 100 Q 200 110 250 100 Q 300 90 350 100" fill="none" stroke="#e8c4b8" strokeWidth="30" />

    {/* 모낭들 */}
    <g>
      <ellipse cx="100" cy="160" rx="8" ry="30" fill="#8b6914" />
      <ellipse cx="150" cy="155" rx="7" ry="25" fill="#8b6914" />
      <ellipse cx="200" cy="165" rx="9" ry="32" fill="#8b6914" />
      <ellipse cx="250" cy="158" rx="7" ry="28" fill="#8b6914" />
      <ellipse cx="300" cy="162" rx="8" ry="30" fill="#8b6914" />
    </g>

    {/* 스캐닝 레이저 헤드 */}
    <motion.g
      animate={{ x: [0, 200, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      <rect x="80" y="40" width="50" height="20" fill="#6d4e42" rx="3" />
      {/* 조사 빔 */}
      <motion.path
        d="M 105 60 L 105 130"
        stroke="url(#trackGradient)"
        strokeWidth="8"
        opacity="0.6"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
      {/* 추적 빔 (센서) */}
      <path d="M 95 60 L 85 80" stroke="#4CAF50" strokeWidth="2" opacity="0.8" />
      <path d="M 115 60 L 125 80" stroke="#4CAF50" strokeWidth="2" opacity="0.8" />
    </motion.g>

    {/* 설명 */}
    <g transform="translate(50, 200)">
      <rect x="0" y="0" width="300" height="40" fill="white" stroke="#e5e5e5" strokeWidth="1" rx="8" />
      <text x="150" y="18" fontSize="11" fill="#575756" textAnchor="middle" fontWeight="500">
        {labels.description1}
      </text>
      <text x="150" y="33" fontSize="10" fill="#8a8a8a" textAnchor="middle">
        {labels.description2}
      </text>
    </g>
  </svg>
);

// 부위별 제모 정보 카드
interface BodyAreaCardProps {
  area: string;
  sessions: string;
  interval: string;
  description: string;
  icon: React.ReactNode;
  labels: {
    sessions: string;
    interval: string;
  };
}

const BodyAreaCard = ({ area, sessions, interval, description, icon, labels }: BodyAreaCardProps) => (
  <motion.div
    className="bg-white rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all"
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2 }}
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-1">{area}</h4>
        <p className="text-sm text-[var(--color-mono)] mb-3">{description}</p>
        <div className="flex gap-4">
          <div>
            <span className="text-xs text-[var(--color-mono-light)]">{labels.sessions}</span>
            <p className="text-sm font-medium text-[var(--color-secondary)]">{sessions}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--color-mono-light)]">{labels.interval}</span>
            <p className="text-sm font-medium text-[var(--color-secondary)]">{interval}</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// 장점 카드
interface AdvantageCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const AdvantageCard = ({ title, description, icon }: AdvantageCardProps) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
      {icon}
    </div>
    <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">{title}</h4>
    <p className="text-sm text-[var(--color-mono)]">{description}</p>
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
        <p className="pb-5 text-[var(--color-mono)] leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
};

export default function HairRemovalDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  // Load translations
  const detail = {
    hero: {
      title: t('laser.hairRemoval.detail.hero.title'),
      subtitle: t('laser.hairRemoval.detail.hero.subtitle'),
      description: t('laser.hairRemoval.detail.hero.description'),
    },
    claritySection: {
      badge: t('laser.hairRemoval.detail.claritySection.badge'),
      title: t('laser.hairRemoval.detail.claritySection.title'),
      subtitle: t('laser.hairRemoval.detail.claritySection.subtitle'),
      description1: t('laser.hairRemoval.detail.claritySection.description1'),
      description2: t('laser.hairRemoval.detail.claritySection.description2'),
      specs: {
        wavelength: t('laser.hairRemoval.detail.claritySection.specs.wavelength'),
        wavelengthValue: t('laser.hairRemoval.detail.claritySection.specs.wavelengthValue'),
        spotSize: t('laser.hairRemoval.detail.claritySection.specs.spotSize'),
        spotSizeValue: t('laser.hairRemoval.detail.claritySection.specs.spotSizeValue'),
        pulseTime: t('laser.hairRemoval.detail.claritySection.specs.pulseTime'),
        pulseTimeValue: t('laser.hairRemoval.detail.claritySection.specs.pulseTimeValue'),
        cooling: t('laser.hairRemoval.detail.claritySection.specs.cooling'),
        coolingValue: t('laser.hairRemoval.detail.claritySection.specs.coolingValue'),
      },
    },
    intellitrakSection: {
      badge: t('laser.hairRemoval.detail.intellitrakSection.badge'),
      title: t('laser.hairRemoval.detail.intellitrakSection.title'),
    },
    bodyAreas: {
      title: t('laser.hairRemoval.detail.bodyAreas.title'),
      subtitle: t('laser.hairRemoval.detail.bodyAreas.subtitle'),
      labels: {
        sessions: t('laser.hairRemoval.detail.bodyAreas.labels.sessions'),
        interval: t('laser.hairRemoval.detail.bodyAreas.labels.interval'),
      },
      items: t.raw('laser.hairRemoval.detail.bodyAreas.items') as BodyAreaItem[],
    },
    advantages: {
      title: t('laser.hairRemoval.detail.advantages.title'),
      subtitle: t('laser.hairRemoval.detail.advantages.subtitle'),
      items: t.raw('laser.hairRemoval.detail.advantages.items') as AdvantageItem[],
    },
    faq: {
      title: t('laser.hairRemoval.detail.faq.title'),
      items: t.raw('laser.hairRemoval.detail.faq.items') as FAQItem[],
    },
    cta: {
      title: t('laser.hairRemoval.detail.cta.title'),
      description: t('laser.hairRemoval.detail.cta.description'),
      buttonConsult: t('laser.hairRemoval.detail.cta.buttonConsult'),
    },
  };

  // Wavelength comparison illustration labels
  const wavelengthLabels: WavelengthLabels = {
    title: t('laser.hairRemoval.detail.wavelengthIllustration.title'),
    wavelength755: t('laser.hairRemoval.detail.wavelengthIllustration.wavelength755'),
    wavelength755Desc: t('laser.hairRemoval.detail.wavelengthIllustration.wavelength755Desc'),
    wavelength1064: t('laser.hairRemoval.detail.wavelengthIllustration.wavelength1064'),
    wavelength1064Desc: t('laser.hairRemoval.detail.wavelengthIllustration.wavelength1064Desc'),
    epidermis: t('laser.hairRemoval.detail.wavelengthIllustration.epidermis'),
    dermis: t('laser.hairRemoval.detail.wavelengthIllustration.dermis'),
    lightSkin: t('laser.hairRemoval.detail.wavelengthIllustration.lightSkin'),
    darkSkin: t('laser.hairRemoval.detail.wavelengthIllustration.darkSkin'),
  };

  // IntelliTrak illustration labels
  const intellitrakLabels: IntelliTrakLabels = {
    title: t('laser.hairRemoval.detail.intellitrakIllustration.title'),
    description1: t('laser.hairRemoval.detail.intellitrakIllustration.description1'),
    description2: t('laser.hairRemoval.detail.intellitrakIllustration.description2'),
  };

  // IntelliTrak features
  const intellitrakFeatures = t.raw('laser.hairRemoval.detail.intellitrakFeatures') as Array<{ title: string; desc: string }>;

  // Process steps
  const processSteps = t.raw('laser.hairRemoval.detail.processSteps') as Array<{ step: number; title: string; desc: string }>;

  // Body area icons
  const bodyAreaIcons = [
    <svg key="0" className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>,
    <svg key="1" className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>,
    <svg key="2" className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>,
    <svg key="3" className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    <svg key="4" className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    <svg key="5" className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>,
  ];

  // Advantage icons
  const advantageIcons = [
    <svg key="0" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
    <svg key="1" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>,
    <svg key="2" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    <svg key="3" className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>,
  ];

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-white to-[var(--color-background)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              {/* 브레드크럼 */}
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-mono-light)] mb-6">
                <Link href="/laser" className="hover:text-[var(--color-primary)] transition-colors">{t('laser.center.name')}</Link>
                <span>/</span>
                <span className="text-[var(--color-secondary)]">{t('laser.hairRemoval.name')}</span>
              </div>

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

      {/* Clarity II 소개 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 텍스트 */}
              <AnimateOnScroll animation="fadeInUp">
                <div>
                  <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                    {detail.claritySection.badge}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-6">
                    {detail.claritySection.title}
                  </h2>
                  <p className="text-lg text-[var(--color-primary)] font-medium mb-4">
                    {detail.claritySection.subtitle}
                  </p>
                  <div className="space-y-4 text-[var(--color-mono)]">
                    <p
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: detail.claritySection.description1 }}
                    />
                    <p
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: detail.claritySection.description2 }}
                    />
                  </div>

                  {/* 핵심 스펙 */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">{detail.claritySection.specs.wavelength}</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">{detail.claritySection.specs.wavelengthValue}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">{detail.claritySection.specs.spotSize}</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">{detail.claritySection.specs.spotSizeValue}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">{detail.claritySection.specs.pulseTime}</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">{detail.claritySection.specs.pulseTimeValue}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">{detail.claritySection.specs.cooling}</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">{detail.claritySection.specs.coolingValue}</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 일러스트레이션 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <WavelengthComparisonIllustration labels={wavelengthLabels} />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* IntelliTrak 기술 섹션 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                {detail.intellitrakSection.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.intellitrakSection.title}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <div className="bg-[var(--color-background)] rounded-2xl p-6 mb-8">
                <IntelliTrakIllustration labels={intellitrakLabels} />
              </div>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-6">
              {intellitrakFeatures.map((item, idx) => (
                <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                  <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] text-center">
                    <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-[var(--color-primary)]">{idx + 1}</span>
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

      {/* Clarity II 장점 섹션 */}
      <section className="py-16 md:py-24 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {detail.advantages.title}
              </h2>
              <p className="text-white/80">
                {detail.advantages.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {detail.advantages.items.map((adv, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <AdvantageCard title={adv.title} description={adv.description} icon={advantageIcons[idx]} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 부위별 제모 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.bodyAreas.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.bodyAreas.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {detail.bodyAreas.items.map((area, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.05}>
                <BodyAreaCard
                  area={area.area}
                  sessions={area.sessions}
                  interval={area.interval}
                  description={area.description}
                  icon={bodyAreaIcons[idx]}
                  labels={detail.bodyAreas.labels}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 시술 과정 섹션 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {tCommon('process')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {processSteps.map((item, idx) => (
                <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
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

      {/* FAQ 섹션 */}
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
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              {detail.faq.items.map((faq, idx) => (
                <FAQItem
                  key={idx}
                  id={`faq-${idx}`}
                  question={faq.q}
                  answer={faq.a}
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
              <p
                className="text-[var(--color-mono)] mb-8 leading-relaxed"
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
                  className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-secondary)] px-8 py-4 rounded-full font-medium border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
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
