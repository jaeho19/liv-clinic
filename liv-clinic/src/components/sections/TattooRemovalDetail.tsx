'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';
import { LASER_EQUIPMENT } from '@/lib/constants';

// 피코초 vs 나노초 비교 일러스트레이션
const PicoVsNanoIllustration = () => (
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
      잉크 입자 파쇄 메커니즘
    </text>

    {/* 나노초 섹션 */}
    <g transform="translate(30, 50)">
      <text x="100" y="15" fontSize="12" fill="#8a8a8a" textAnchor="middle" fontWeight="600">나노초 (10⁻⁹초)</text>
      <text x="100" y="30" fontSize="10" fill="#8a8a8a" textAnchor="middle">기존 Q-Switch 레이저</text>

      {/* 큰 잉크 입자 */}
      <g transform="translate(0, 50)">
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">Before</text>
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
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">After</text>
        <circle cx="55" cy="35" r="12" fill="url(#inkGradient)" />
        <circle cx="85" cy="40" r="10" fill="url(#inkGradient)" />
        <circle cx="110" cy="32" r="11" fill="url(#inkGradient)" />
        <circle cx="140" cy="38" r="13" fill="url(#inkGradient)" />
      </g>

      {/* 결과 설명 */}
      <rect x="20" y="220" width="160" height="35" fill="#f5f5f5" rx="4" />
      <text x="100" y="238" fontSize="9" fill="#8a8a8a" textAnchor="middle">열작용 (Photothermal)</text>
      <text x="100" y="250" fontSize="9" fill="#8a8a8a" textAnchor="middle">큰 입자 → 중간 입자</text>
    </g>

    {/* VS 구분선 */}
    <line x1="250" y1="50" x2="250" y2="270" stroke="#e5e5e5" strokeWidth="2" strokeDasharray="5,5" />
    <circle cx="250" cy="160" r="18" fill="white" stroke="#b4988d" strokeWidth="2" />
    <text x="250" y="165" fontSize="11" fill="#b4988d" textAnchor="middle" fontWeight="600">VS</text>

    {/* 피코초 섹션 */}
    <g transform="translate(280, 50)">
      <text x="100" y="15" fontSize="12" fill="#b4988d" textAnchor="middle" fontWeight="600">피코초 (10⁻¹²초)</text>
      <text x="100" y="30" fontSize="10" fill="#b4988d" textAnchor="middle">Lucas 레이저</text>

      {/* 큰 잉크 입자 */}
      <g transform="translate(0, 50)">
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">Before</text>
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
        <text x="100" y="0" fontSize="10" fill="#575756" textAnchor="middle">After</text>
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
      <text x="100" y="238" fontSize="9" fill="#b4988d" textAnchor="middle" fontWeight="500">광음향작용 (Photoacoustic)</text>
      <text x="100" y="250" fontSize="9" fill="#b4988d" textAnchor="middle" fontWeight="500">큰 입자 → 미세 입자 ✓</text>
    </g>
  </svg>
);

// 색상별 파장 타겟팅 일러스트레이션
const ColorWavelengthIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-auto">
    {/* 배경 */}
    <rect x="0" y="0" width="400" height="200" fill="#fafafa" />

    {/* 제목 */}
    <text x="200" y="25" fontSize="13" fill="#575756" textAnchor="middle" fontWeight="600">
      잉크 색상별 최적 파장
    </text>

    {/* 색상 원들 */}
    <g transform="translate(0, 50)">
      {/* 검정 */}
      <g transform="translate(50, 0)">
        <circle cx="30" cy="50" r="28" fill="#1a1a1a" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">검정</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">1064nm</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">가장 쉬움</text>
      </g>

      {/* 빨강/주황 */}
      <g transform="translate(130, 0)">
        <circle cx="30" cy="50" r="28" fill="#e74c3c" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">빨강</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">532nm</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">비교적 쉬움</text>
      </g>

      {/* 파랑/녹색 */}
      <g transform="translate(210, 0)">
        <circle cx="30" cy="50" r="28" fill="#3498db" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">파랑</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">755nm</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">다소 어려움</text>
      </g>

      {/* 녹색 */}
      <g transform="translate(290, 0)">
        <circle cx="30" cy="50" r="28" fill="#27ae60" />
        <text x="30" y="55" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">녹색</text>
        <text x="30" y="100" fontSize="9" fill="#575756" textAnchor="middle">755nm</text>
        <text x="30" y="115" fontSize="8" fill="#8a8a8a" textAnchor="middle">가장 어려움</text>
      </g>
    </g>

    {/* 하단 설명 */}
    <rect x="50" y="170" width="300" height="24" fill="#b4988d" opacity="0.1" rx="12" />
    <text x="200" y="186" fontSize="10" fill="#b4988d" textAnchor="middle" fontWeight="500">
      Lucas: 다중 파장으로 모든 색상 타겟팅 가능
    </text>
  </svg>
);

// 문신 유형 카드
interface TattooTypeCardProps {
  type: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sessions: string;
  notes: string;
}

const TattooTypeCard = ({ type, description, difficulty, sessions, notes }: TattooTypeCardProps) => {
  const difficultyConfig = {
    easy: { label: '비교적 쉬움', color: 'bg-green-100 text-green-700' },
    medium: { label: '중간', color: 'bg-yellow-100 text-yellow-700' },
    hard: { label: '다소 어려움', color: 'bg-red-100 text-red-700' }
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all h-full"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-lg font-semibold text-[var(--color-secondary)]">{type}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${difficultyConfig[difficulty].color}`}>
          {difficultyConfig[difficulty].label}
        </span>
      </div>
      <p className="text-sm text-[var(--color-mono)] mb-4">{description}</p>
      <div className="pt-3 border-t border-[var(--color-border)]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[var(--color-mono-light)]">예상 횟수</span>
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

  // 문신 유형 데이터
  const tattooTypes = [
    {
      type: '아마추어 문신',
      description: '비전문가가 시술한 문신. 잉크가 얕게 들어가 있어 제거가 비교적 용이합니다.',
      difficulty: 'easy' as const,
      sessions: '3-5회',
      notes: '먹물, 펜 잉크 등 단색 문신이 대부분'
    },
    {
      type: '전문 문신 (흑백)',
      description: '전문 타투이스트가 시술한 흑백 문신. 잉크가 깊고 균일하게 들어가 있습니다.',
      difficulty: 'medium' as const,
      sessions: '6-10회',
      notes: '검정 잉크는 레이저 반응이 가장 좋음'
    },
    {
      type: '전문 문신 (컬러)',
      description: '여러 색상이 사용된 컬러 문신. 색상별로 다른 파장이 필요합니다.',
      difficulty: 'hard' as const,
      sessions: '8-15회 이상',
      notes: '녹색, 파랑은 더 많은 횟수 필요'
    },
    {
      type: '반영구 화장',
      description: '눈썹, 아이라인, 입술 등의 반영구 화장. 일반 문신보다 얕게 시술됩니다.',
      difficulty: 'medium' as const,
      sessions: '3-6회',
      notes: '눈가 시술 시 특수 보호 장비 사용'
    },
    {
      type: '외상성 문신',
      description: '사고로 인한 이물질 침착. 아스팔트, 흑연 등이 피부에 박힌 경우.',
      difficulty: 'medium' as const,
      sessions: '4-8회',
      notes: '깊이와 범위에 따라 달라짐'
    },
    {
      type: '커버업 문신',
      description: '기존 문신 위에 덧그린 문신. 잉크 층이 두꺼워 제거가 어렵습니다.',
      difficulty: 'hard' as const,
      sessions: '10-20회 이상',
      notes: '단계적 제거 후 새 문신 가능'
    }
  ];

  // 치료 단계
  const treatmentSteps = [
    {
      step: 1,
      title: '상담 & 평가',
      description: '문신 크기, 색상, 깊이, 피부 타입을 평가하고 예상 치료 횟수와 비용을 안내합니다.',
      duration: '약 30분'
    },
    {
      step: 2,
      title: '피코레이저 시술',
      description: 'Lucas 피코레이저로 잉크 입자를 미세하게 분쇄합니다. 시술 시간은 크기에 따라 다릅니다.',
      duration: '15-60분'
    },
    {
      step: 3,
      title: '회복 기간',
      description: '피부가 분쇄된 잉크를 자연스럽게 배출합니다. 딱지, 가벼운 붓기가 나타날 수 있습니다.',
      duration: '2-4주'
    },
    {
      step: 4,
      title: '다음 시술',
      description: '6-8주 간격으로 반복 시술. 매 시술마다 문신이 옅어지는 것을 확인할 수 있습니다.',
      duration: '6-8주 간격'
    }
  ];

  // FAQ 데이터
  const faqs = [
    {
      question: '문신 제거는 완전히 가능한가요?',
      answer: '대부분의 문신은 90% 이상 제거가 가능합니다. 완전 제거 여부는 잉크 색상, 깊이, 문신 나이, 피부 타입 등에 따라 달라집니다. 검정색 잉크가 가장 잘 제거되며, 녹색이나 파랑은 더 많은 횟수가 필요할 수 있습니다. 상담 시 정확한 예상을 안내해드립니다.'
    },
    {
      question: '문신 제거는 얼마나 아픈가요?',
      answer: '통증 정도는 "고무줄로 탁탁 튕기는 느낌"에서 "따끔한 느낌"까지 개인마다 다릅니다. Lucas 피코레이저는 기존 나노초 레이저보다 펄스 시간이 1000배 짧아 열 축적이 적고, 그만큼 통증도 줄어듭니다. 필요시 마취 크림을 도포하여 통증을 최소화합니다.'
    },
    {
      question: '시술 후 흉터가 남나요?',
      answer: '피코레이저는 열 손상을 최소화하여 흉터 위험이 매우 낮습니다. 적절한 에너지 세팅과 시술 간격을 지키면 대부분 흉터 없이 회복됩니다. 시술 후 관리 지침(자외선 차단, 딱지 제거 금지 등)을 잘 따라주시면 깨끗한 피부를 기대할 수 있습니다.'
    },
    {
      question: '오래된 문신과 새 문신 중 어떤 것이 더 잘 지워지나요?',
      answer: '일반적으로 오래된 문신이 더 잘 지워집니다. 시간이 지나면서 우리 몸의 면역 시스템이 일부 잉크 입자를 자연스럽게 제거하기 때문입니다. 하지만 새 문신도 피코레이저로 효과적으로 제거할 수 있으며, 오히려 잉크가 선명하게 남아있어 레이저 타겟팅이 쉬운 장점도 있습니다.'
    },
    {
      question: '모든 색상의 문신이 제거 가능한가요?',
      answer: '대부분의 색상은 제거 가능합니다. Lucas 피코레이저는 다중 파장(532nm, 755nm, 1064nm)을 제공하여 다양한 색상에 대응합니다.\n\n• 검정, 진한 파랑: 1064nm - 가장 효과적\n• 빨강, 주황: 532nm - 효과적\n• 파랑, 녹색: 755nm - 가능하나 더 많은 횟수 필요\n• 노랑, 흰색: 가장 어려움 - 부분적 제거 가능'
    },
    {
      question: '시술 간격은 왜 6-8주인가요?',
      answer: '레이저로 분쇄된 잉크 입자는 우리 몸의 대식세포(macrophage)가 흡수하고 림프계를 통해 배출합니다. 이 자연 치유 과정에 4-6주가 필요하며, 피부가 완전히 회복된 후 다음 시술을 진행해야 합니다. 너무 빠른 간격으로 시술하면 피부 손상과 흉터 위험이 높아집니다.'
    }
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
                <a href="/laser" className="hover:text-[var(--color-primary)] transition-colors">레이저 센터</a>
                <span>/</span>
                <span className="text-[var(--color-secondary)]">문신 제거</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-secondary)] mb-6">
                문신 제거
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium mb-4">
                Tattoo Removal with Lucas
              </p>
              <p className="text-lg text-[var(--color-mono)] max-w-2xl mx-auto leading-relaxed">
                피코초 기술로 흉터 없이 깨끗하게<br className="hidden md:block" />
                모든 색상의 문신을 효과적으로 제거합니다
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 피코레이저 원리 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 텍스트 */}
              <AnimateOnScroll animation="fadeInUp">
                <div>
                  <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                    피코초 기술
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-6">
                    왜 피코레이저인가?
                  </h2>
                  <div className="space-y-4 text-[var(--color-mono)]">
                    <p className="leading-relaxed">
                      기존 나노초(10⁻⁹초) 레이저는 열작용(Photothermal)으로 잉크를 분해했습니다.
                      <strong className="text-[var(--color-secondary)]"> 피코초(10⁻¹²초) 레이저</strong>는
                      1000배 빠른 펄스로 <strong className="text-[var(--color-primary)]">광음향작용(Photoacoustic)</strong>을 일으킵니다.
                    </p>
                    <p className="leading-relaxed">
                      이 충격파가 잉크 입자를 <strong className="text-[var(--color-secondary)]">미세한 먼지 수준</strong>까지
                      분쇄하여 우리 몸의 면역 시스템이 쉽게 제거할 수 있게 합니다.
                    </p>
                  </div>

                  {/* 핵심 장점 */}
                  <div className="mt-6 space-y-3">
                    {[
                      { title: '더 적은 시술 횟수', desc: '미세 입자 분쇄로 효율적 제거' },
                      { title: '더 적은 열 손상', desc: '짧은 펄스로 주변 조직 보호' },
                      { title: '더 적은 부작용', desc: '흉터, 색소 변화 위험 최소화' }
                    ].map((item, idx) => (
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
                  <PicoVsNanoIllustration />
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
                다중 파장 시스템
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                모든 색상을 타겟팅
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                Lucas 피코레이저는 다중 파장으로 다양한 색상의 잉크를 효과적으로 분해합니다
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-[var(--color-background)] rounded-2xl p-6">
              <ColorWavelengthIllustration />
            </div>
          </AnimateOnScroll>

          {/* 파장별 상세 */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
            {[
              { wavelength: '1064nm', colors: '검정, 진한 파랑, 갈색', note: '가장 깊은 침투, 대부분의 문신' },
              { wavelength: '755nm', colors: '파랑, 녹색', note: '중간 깊이, 특수 색상 타겟' },
              { wavelength: '532nm', colors: '빨강, 주황, 노랑', note: '표피층, 밝은 색상 전용' }
            ].map((item, idx) => (
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
                문신 유형별 가이드
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                어떤 문신을 제거하고 싶으신가요?
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                문신의 종류와 특성에 따라 치료 횟수와 난이도가 달라집니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {tattooTypes.map((tattoo, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.05}>
                <TattooTypeCard {...tattoo} />
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
                    치료 과정
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-8">
                    문신 제거 프로세스
                  </h2>

                  <div>
                    {treatmentSteps.map((step, idx) => (
                      <TimelineStep key={idx} {...step} />
                    ))}
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 장비 소개 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/5 rounded-2xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold text-[var(--color-secondary)] mb-2">
                    Lucas
                  </h3>
                  <p className="text-[var(--color-primary)] font-medium mb-6">
                    피코초 문신 제거의 새로운 기준
                  </p>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">펄스 지속 시간</span>
                        <span className="font-bold text-[var(--color-secondary)]">450 피코초</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">파장</span>
                        <span className="font-bold text-[var(--color-secondary)]">532 / 755 / 1064nm</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">반복률</span>
                        <span className="font-bold text-[var(--color-secondary)]">최대 10Hz</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--color-mono-light)]">에너지</span>
                        <span className="font-bold text-[var(--color-secondary)]">최대 1.8J</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                    <h4 className="font-semibold text-[var(--color-secondary)] mb-3">Lucas의 강점</h4>
                    <ul className="space-y-2 text-sm text-[var(--color-mono)]">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        다중 파장으로 모든 색상 대응
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        450ps 초단파 펄스로 열 손상 최소화
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        프랙셔널 렌즈로 흉터 치료도 가능
                      </li>
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
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">전</span>
                  시술 전
                </h3>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    시술 2주 전부터 과도한 일광 노출 피하기
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    시술 부위에 자극적인 제품 사용 자제
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    피부 상태(염증, 상처)가 있으면 미리 알리기
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    복용 중인 약물(광과민성 유발 약물 등) 고지
                  </li>
                </ul>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">후</span>
                  시술 후
                </h3>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    처방된 연고를 지시대로 도포
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    딱지는 절대 인위적으로 제거하지 않기
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    자외선 차단제 필수 (SPF 30 이상)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-primary)]">•</span>
                    1주일간 사우나, 격렬한 운동 피하기
                  </li>
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
                자주 묻는 질문
              </h2>
              <p className="text-[var(--color-mono)]">
                문신 제거에 대해 궁금한 점을 확인하세요
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              {faqs.map((faq, idx) => (
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
                새로운 시작을 위한 첫걸음
              </h2>
              <p className="text-[var(--color-mono)] mb-8 leading-relaxed">
                원치 않는 문신, 피코레이저로 깨끗하게 제거하세요<br className="hidden md:block" />
                무료 상담으로 정확한 치료 계획을 안내받으세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  무료 상담 예약
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
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
