'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { motion } from 'framer-motion';
import { AnimateOnScroll, PriceTable, Breadcrumb } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { LASER_EQUIPMENT } from '@/lib/constants';

// TypeScript interfaces for translations
interface SkinConcern {
  title: string;
  description: string;
  solution: string;
  equipment: string[];
}

interface TreatmentStep {
  step: number;
  title: string;
  equipment: string;
  description: string;
  sessions: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface AdvantageItem {
  title: string;
  desc: string;
}

interface IllustrationLabels {
  epidermis: string;
  dermis: string;
  deepDermis: string;
  laserHead: string;
  mechanismDesc: string;
  before: string;
  after: string;
  beforeDesc: string;
  afterDesc: string;
  laserToning: string;
  ulblanc: string;
}

// 레이저 토닝 메커니즘 일러스트레이션
interface ToningMechanismProps {
  labels: IllustrationLabels;
}

const ToningMechanismIllustration = ({ labels }: ToningMechanismProps) => (
  <svg viewBox="0 0 400 300" className="w-full h-auto">
    {/* 피부 단면 - 여러 층 */}
    <defs>
      <linearGradient id="skinLayerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fce4d6" />
        <stop offset="30%" stopColor="#f5d5c8" />
        <stop offset="60%" stopColor="#e8c4b8" />
        <stop offset="100%" stopColor="#d4a99a" />
      </linearGradient>
      <filter id="glowEffect">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* 배경 */}
    <rect x="0" y="0" width="400" height="300" fill="#fafafa" />

    {/* 피부 단면 */}
    <rect x="50" y="80" width="300" height="180" fill="url(#skinLayerGradient)" rx="4" />

    {/* 표피층 라벨 */}
    <text x="360" y="100" fontSize="10" fill="#8a8a8a" textAnchor="end">{labels.epidermis}</text>
    <text x="360" y="150" fontSize="10" fill="#8a8a8a" textAnchor="end">{labels.dermis}</text>
    <text x="360" y="220" fontSize="10" fill="#8a8a8a" textAnchor="end">{labels.deepDermis}</text>

    {/* 멜라닌 입자들 - 불규칙하게 분포 */}
    <g className="melanin-particles">
      {/* 표피층 멜라닌 */}
      <circle cx="100" cy="100" r="4" fill="#8b6914" opacity="0.8" />
      <circle cx="150" cy="95" r="5" fill="#8b6914" opacity="0.9" />
      <circle cx="200" cy="105" r="3" fill="#8b6914" opacity="0.7" />
      <circle cx="250" cy="98" r="4" fill="#8b6914" opacity="0.85" />
      <circle cx="300" cy="102" r="3" fill="#8b6914" opacity="0.75" />

      {/* 진피층 멜라닌 (더 깊음) */}
      <circle cx="120" cy="140" r="6" fill="#6d5010" opacity="0.9" />
      <circle cx="180" cy="155" r="5" fill="#6d5010" opacity="0.85" />
      <circle cx="230" cy="145" r="7" fill="#6d5010" opacity="0.9" />
      <circle cx="280" cy="160" r="4" fill="#6d5010" opacity="0.8" />

      {/* 심부 멜라닌 */}
      <circle cx="140" cy="200" r="5" fill="#5a4010" opacity="0.9" />
      <circle cx="200" cy="210" r="6" fill="#5a4010" opacity="0.85" />
      <circle cx="260" cy="195" r="5" fill="#5a4010" opacity="0.9" />
    </g>

    {/* 레이저 빔 - 저출력으로 넓게 조사 */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.8, 0.4, 0.8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* 넓은 레이저 조사 영역 */}
      <rect x="80" y="40" width="240" height="230" fill="#b4988d" opacity="0.15" rx="4" />

      {/* 레이저 빔 라인들 */}
      <line x1="100" y1="50" x2="100" y2="250" stroke="#b4988d" strokeWidth="1" opacity="0.4" />
      <line x1="150" y1="50" x2="150" y2="250" stroke="#b4988d" strokeWidth="1" opacity="0.4" />
      <line x1="200" y1="50" x2="200" y2="250" stroke="#b4988d" strokeWidth="1" opacity="0.4" />
      <line x1="250" y1="50" x2="250" y2="250" stroke="#b4988d" strokeWidth="1" opacity="0.4" />
      <line x1="300" y1="50" x2="300" y2="250" stroke="#b4988d" strokeWidth="1" opacity="0.4" />
    </motion.g>

    {/* 레이저 헤드 */}
    <rect x="60" y="25" width="280" height="20" fill="#6d4e42" rx="3" />
    <text x="200" y="38" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">{labels.laserHead}</text>

    {/* 멜라닌 파괴 효과 */}
    <motion.g
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: [1, 1.5, 1], opacity: [0, 0.8, 0] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    >
      <circle cx="230" cy="145" r="15" fill="none" stroke="#b4988d" strokeWidth="2" filter="url(#glowEffect)" />
    </motion.g>

    {/* 설명 텍스트 */}
    <text x="200" y="285" fontSize="11" fill="#575756" textAnchor="middle">
      {labels.mechanismDesc}
    </text>
  </svg>
);

// Before/After 효과 일러스트레이션
interface BeforeAfterProps {
  labels: IllustrationLabels;
}

const BeforeAfterIllustration = ({ labels }: BeforeAfterProps) => (
  <svg viewBox="0 0 500 200" className="w-full h-auto">
    <defs>
      {/* Before - 불균일한 피부톤 */}
      <pattern id="unevenSkin" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#e8c4b8" />
        <circle cx="5" cy="5" r="3" fill="#c9a090" opacity="0.6" />
        <circle cx="15" cy="12" r="4" fill="#b08878" opacity="0.7" />
        <circle cx="8" cy="16" r="2" fill="#c9a090" opacity="0.5" />
      </pattern>

      {/* After - 균일한 피부톤 */}
      <linearGradient id="evenSkin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fce4d6" />
        <stop offset="100%" stopColor="#f5d5c8" />
      </linearGradient>
    </defs>

    {/* Before 섹션 */}
    <g>
      <text x="100" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">{labels.before}</text>
      <rect x="25" y="40" width="150" height="130" fill="url(#unevenSkin)" rx="75" />
      {/* 불균일한 색소 추가 */}
      <circle cx="60" cy="80" r="8" fill="#a08070" opacity="0.5" />
      <circle cx="120" cy="100" r="10" fill="#907060" opacity="0.6" />
      <circle cx="80" cy="130" r="6" fill="#a08070" opacity="0.4" />
      <circle cx="130" cy="70" r="7" fill="#907060" opacity="0.5" />
      <text x="100" y="190" fontSize="11" fill="#8a8a8a" textAnchor="middle">{labels.beforeDesc}</text>
    </g>

    {/* 화살표 */}
    <g>
      <motion.path
        d="M 200 105 L 280 105"
        stroke="#b4988d"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
      />
      <motion.polygon
        points="275,95 295,105 275,115"
        fill="#b4988d"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, delay: 1.2 }}
      />
      <text x="250" y="85" fontSize="10" fill="#b4988d" textAnchor="middle">{labels.laserToning}</text>
      <text x="250" y="125" fontSize="10" fill="#b4988d" textAnchor="middle">{labels.ulblanc}</text>
    </g>

    {/* After 섹션 */}
    <g>
      <text x="400" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">{labels.after}</text>
      <rect x="325" y="40" width="150" height="130" fill="url(#evenSkin)" rx="75" />
      {/* 균일하고 밝은 피부 표현 */}
      <ellipse cx="400" cy="105" rx="60" ry="50" fill="white" opacity="0.2" />
      <text x="400" y="190" fontSize="11" fill="#8a8a8a" textAnchor="middle">{labels.afterDesc}</text>
    </g>
  </svg>
);

// 치료 단계 카드
interface TreatmentStepProps {
  step: number;
  title: string;
  equipment: string;
  description: string;
  sessions: string;
  icon: React.ReactNode;
  sessionsLabel: string;
}

const TreatmentStepCard = ({ step, title, equipment, description, sessions, icon, sessionsLabel }: TreatmentStepProps) => (
  <motion.div
    className="relative bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] h-full"
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
  >
    {/* 단계 번호 */}
    <div className="absolute -top-3 left-6 bg-[var(--color-primary)] text-white text-sm font-medium px-3 py-1 rounded-full">
      STEP {step}
    </div>

    {/* 아이콘 */}
    <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mb-4 mt-2">
      {icon}
    </div>

    {/* 내용 */}
    <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-1">{title}</h4>
    <p className="text-sm text-[var(--color-primary)] font-medium mb-3">{equipment}</p>
    <p className="text-[var(--color-mono)] text-sm leading-relaxed mb-4">{description}</p>

    {/* 권장 횟수 */}
    <div className="pt-4 border-t border-[var(--color-border)]">
      <span className="text-xs text-[var(--color-mono-light)]">{sessionsLabel}</span>
      <p className="text-sm font-medium text-[var(--color-secondary)]">{sessions}</p>
    </div>
  </motion.div>
);

// 피부 고민 타입 카드
interface SkinConcernCardProps {
  title: string;
  description: string;
  solution: string;
  equipment: string[];
  solutionLabel: string;
}

const SkinConcernCard = ({ title, description, solution, equipment, solutionLabel }: SkinConcernCardProps) => (
  <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
    <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">{title}</h4>
    <p className="text-sm text-[var(--color-mono)] mb-3">{description}</p>
    <div className="bg-[var(--color-background)] rounded-lg p-3">
      <p className="text-xs text-[var(--color-mono-light)] mb-1">{solutionLabel}</p>
      <p className="text-sm text-[var(--color-primary)] font-medium">{solution}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {equipment.map((eq, idx) => (
          <span key={idx} className="text-xs bg-white px-2 py-0.5 rounded text-[var(--color-mono-light)]">
            {eq}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// 장비 카드 컴포넌트
interface EquipmentLabels {
  wavelength: string;
  feature: string;
  advantage: string;
  indications: string;
}

interface EquipmentCardProps {
  equipment: {
    name: string;
    nameEn: string;
    wavelength: string;
    feature: string;
    advantage: string;
    targets: string[];
    sessions: string;
  };
  labels: EquipmentLabels;
  highlight?: boolean;
}

const EquipmentCard = ({ equipment, labels, highlight = false }: EquipmentCardProps) => (
  <motion.div
    className={`relative rounded-2xl p-6 h-full ${
      highlight
        ? 'bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border-2 border-[var(--color-primary)]/30'
        : 'bg-white border border-[var(--color-border)]'
    }`}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.3 }}
  >
    {highlight && (
      <div className="absolute -top-3 right-6 bg-[var(--color-primary)] text-white text-xs font-medium px-3 py-1 rounded-full">
        MAIN
      </div>
    )}

    {/* 장비명 */}
    <h4 className="text-xl font-bold text-[var(--color-secondary)] mb-1">{equipment.name}</h4>
    <p className="text-sm text-[var(--color-mono-light)] mb-4">{equipment.nameEn}</p>

    {/* 스펙 */}
    <div className="space-y-3 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[var(--color-secondary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-[var(--color-mono-light)]">{labels.wavelength}</p>
          <p className="text-sm font-medium text-[var(--color-secondary)]">{equipment.wavelength}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-[var(--color-mono-light)]">{labels.feature}</p>
          <p className="text-sm text-[var(--color-mono)]">{equipment.feature}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-[var(--color-mono-light)]">{labels.advantage}</p>
          <p className="text-sm text-[var(--color-mono)]">{equipment.advantage}</p>
        </div>
      </div>
    </div>

    {/* 적응증 */}
    <div className="pt-4 border-t border-[var(--color-border)]">
      <p className="text-xs text-[var(--color-mono-light)] mb-2">{labels.indications}</p>
      <div className="flex flex-wrap gap-1">
        {equipment.targets.map((target, idx) => (
          <span
            key={idx}
            className={`text-xs px-2 py-1 rounded ${
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

export default function SkinToneDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  // Load translations
  const detail = {
    hero: {
      title: t('laser.skintone.detail.hero.title'),
      subtitle: t('laser.skintone.detail.hero.subtitle'),
      description: t.raw('laser.skintone.detail.hero.description') as string,
    },
    concernsSection: {
      title: t('laser.skintone.detail.concernsSection.title'),
      subtitle: t('laser.skintone.detail.concernsSection.subtitle'),
      customSolution: t('laser.skintone.detail.concernsSection.customSolution'),
      concerns: t.raw('laser.skintone.detail.concernsSection.concerns') as SkinConcern[],
    },
    toningSection: {
      badge: t('laser.skintone.detail.toningSection.badge'),
      title: t('laser.skintone.detail.toningSection.title'),
      description1: t.raw('laser.skintone.detail.toningSection.description1') as string,
      description2: t.raw('laser.skintone.detail.toningSection.description2') as string,
      effectsTitle: t('laser.skintone.detail.toningSection.effectsTitle'),
      effects: t.raw('laser.skintone.detail.toningSection.effects') as { title: string; desc: string }[],
    },
    beforeAfterSection: {
      title: t('laser.skintone.detail.beforeAfterSection.title'),
      subtitle: t('laser.skintone.detail.beforeAfterSection.subtitle'),
    },
    equipmentSection: {
      badge: t('laser.skintone.detail.equipmentSection.badge'),
      title: t('laser.skintone.detail.equipmentSection.title'),
      subtitle: t('laser.skintone.detail.equipmentSection.subtitle'),
      labels: {
        wavelength: t('laser.skintone.detail.equipmentSection.labels.wavelength'),
        feature: t('laser.skintone.detail.equipmentSection.labels.feature'),
        advantage: t('laser.skintone.detail.equipmentSection.labels.advantage'),
        indications: t('laser.skintone.detail.equipmentSection.labels.indications'),
        recommendedSessions: t('laser.skintone.detail.equipmentSection.labels.recommendedSessions'),
      },
      toning: {
        name: t('laser.skintone.detail.equipmentSection.toning.name'),
        nameEn: t('laser.skintone.detail.equipmentSection.toning.nameEn'),
        wavelength: t('laser.skintone.detail.equipmentSection.toning.wavelength'),
        feature: t('laser.skintone.detail.equipmentSection.toning.feature'),
        advantage: t('laser.skintone.detail.equipmentSection.toning.advantage'),
        targets: t.raw('laser.skintone.detail.equipmentSection.toning.targets') as string[],
      },
      ulblanc: {
        name: t('laser.skintone.detail.equipmentSection.ulblanc.name'),
        nameEn: t('laser.skintone.detail.equipmentSection.ulblanc.nameEn'),
        wavelength: t('laser.skintone.detail.equipmentSection.ulblanc.wavelength'),
        feature: t('laser.skintone.detail.equipmentSection.ulblanc.feature'),
        advantage: t('laser.skintone.detail.equipmentSection.ulblanc.advantage'),
        targets: t.raw('laser.skintone.detail.equipmentSection.ulblanc.targets') as string[],
      },
      synergyTitle: t('laser.skintone.detail.equipmentSection.synergyTitle'),
      synergyDesc: t.raw('laser.skintone.detail.equipmentSection.synergyDesc') as string,
    },
    protocolSection: {
      badge: t('laser.skintone.detail.protocolSection.badge'),
      title: t('laser.skintone.detail.protocolSection.title'),
      subtitle: t('laser.skintone.detail.protocolSection.subtitle'),
      steps: t.raw('laser.skintone.detail.protocolSection.steps') as TreatmentStep[],
    },
    advantagesSection: {
      title: t('laser.skintone.detail.advantagesSection.title'),
      subtitle: t('laser.skintone.detail.advantagesSection.subtitle'),
      items: t.raw('laser.skintone.detail.advantagesSection.items') as AdvantageItem[],
    },
    faq: {
      items: t.raw('laser.skintone.detail.faq.items') as FAQItem[],
    },
    illustrationLabels: t.raw('laser.skintone.detail.illustrationLabels') as IllustrationLabels,
    cta: {
      title: t('laser.skintone.detail.cta.title'),
      description: t.raw('laser.skintone.detail.cta.description') as string,
      buttonConsult: t('laser.skintone.detail.cta.buttonConsult'),
    },
  };

  // Treatment step icons (static, not translatable)
  const stepIcons = [
    (
      <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    (
      <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    (
      <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  ];

  // Advantage icons (static)
  const advantageIcons = ['⚡', '⏱️', '✨', '💎'];

  // 장비 데이터
  const toningEquipment = {
    name: detail.equipmentSection.toning.name,
    nameEn: detail.equipmentSection.toning.nameEn,
    wavelength: detail.equipmentSection.toning.wavelength,
    feature: detail.equipmentSection.toning.feature,
    advantage: detail.equipmentSection.toning.advantage,
    targets: detail.equipmentSection.toning.targets,
    sessions: LASER_EQUIPMENT.toning.sessions
  };

  const ulblancEquipment = {
    name: detail.equipmentSection.ulblanc.name,
    nameEn: detail.equipmentSection.ulblanc.nameEn,
    wavelength: detail.equipmentSection.ulblanc.wavelength,
    feature: detail.equipmentSection.ulblanc.feature,
    advantage: detail.equipmentSection.ulblanc.advantage,
    targets: detail.equipmentSection.ulblanc.targets,
    sessions: LASER_EQUIPMENT.ulblanc.sessions
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <Breadcrumb items={[{ navKey: 'laser', href: '/laser' }, { label: t('laser.skintone.name') }]} />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-white to-[var(--color-background)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="max-w-4xl mx-auto text-center">
              {/* 브레드크럼 */}
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-mono-light)] mb-6">
                <Link href="/laser" className="hover:text-[var(--color-primary)] transition-colors">{t('laser.center.name')}</Link>
                <span>/</span>
                <span className="text-[var(--color-secondary)]">{t('laser.skintone.name')}</span>
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

      {/* Price Table Section */}
      <PriceTable treatmentId="skintone" />

      {/* 피부톤 고민 해결 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.concernsSection.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.concernsSection.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {detail.concernsSection.concerns.map((concern, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <SkinConcernCard
                  title={concern.title}
                  description={concern.description}
                  solution={concern.solution}
                  equipment={concern.equipment}
                  solutionLabel={detail.concernsSection.customSolution}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 레이저 토닝 원리 섹션 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 텍스트 */}
              <AnimateOnScroll animation="fadeInUp">
                <div>
                  <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                    {detail.toningSection.badge}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-6">
                    {detail.toningSection.title}
                  </h2>
                  <div className="space-y-4 text-[var(--color-mono)]">
                    <p
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: detail.toningSection.description1 }}
                    />
                    <p
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: detail.toningSection.description2 }}
                    />
                    <div className="bg-[var(--color-background)] rounded-xl p-5 mt-6">
                      <h4 className="font-semibold text-[var(--color-secondary)] mb-3">{detail.toningSection.effectsTitle}</h4>
                      <ul className="space-y-2">
                        {detail.toningSection.effects.map((effect, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span><strong>{effect.title}</strong> - {effect.desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 일러스트레이션 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-[var(--color-background)] rounded-2xl p-6">
                  <ToningMechanismIllustration labels={detail.illustrationLabels} />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.beforeAfterSection.title}
              </h2>
              <p className="text-[var(--color-mono)]">
                {detail.beforeAfterSection.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
              <BeforeAfterIllustration labels={detail.illustrationLabels} />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 보유 장비 섹션 */}
      <section className="py-16 md:py-24 bg-white">
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

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <EquipmentCard equipment={toningEquipment} labels={detail.equipmentSection.labels} highlight />
            </AnimateOnScroll>
            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <EquipmentCard equipment={ulblancEquipment} labels={detail.equipmentSection.labels} />
            </AnimateOnScroll>
          </div>

          {/* 시너지 효과 */}
          <AnimateOnScroll animation="fadeInUp" delay={0.3}>
            <div className="max-w-4xl mx-auto mt-8 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">
                    {detail.equipmentSection.synergyTitle}
                  </h4>
                  <p
                    className="text-[var(--color-mono)] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: detail.equipmentSection.synergyDesc }}
                  />
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 치료 프로토콜 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                {detail.protocolSection.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {detail.protocolSection.title}
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                {detail.protocolSection.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {detail.protocolSection.steps.map((step, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <TreatmentStepCard
                  step={step.step}
                  title={step.title}
                  equipment={step.equipment}
                  description={step.description}
                  sessions={step.sessions}
                  icon={stepIcons[idx]}
                  sessionsLabel={detail.equipmentSection.labels.recommendedSessions}
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 장점 섹션 */}
      <section className="py-16 md:py-24 bg-[var(--color-secondary)]">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {detail.advantagesSection.title}
              </h2>
              <p className="text-white/80">
                {detail.advantagesSection.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {detail.advantagesSection.items.map((item, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <div className="text-center">
                  <div className="text-4xl mb-3">{advantageIcons[idx]}</div>
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                {tCommon('faq')}
              </h2>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-[var(--color-background)] rounded-2xl p-6 md:p-8">
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
