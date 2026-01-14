'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';
import { LASER_EQUIPMENT } from '@/lib/constants';

// 레이저 토닝 메커니즘 일러스트레이션
const ToningMechanismIllustration = () => (
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
    <text x="360" y="100" fontSize="10" fill="#8a8a8a" textAnchor="end">표피</text>
    <text x="360" y="150" fontSize="10" fill="#8a8a8a" textAnchor="end">진피</text>
    <text x="360" y="220" fontSize="10" fill="#8a8a8a" textAnchor="end">심부진피</text>

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
    <text x="200" y="38" fontSize="10" fill="white" textAnchor="middle" fontWeight="500">1064nm Nd:YAG 저출력 조사</text>

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
      저출력 반복 조사로 멜라닌을 점진적으로 분해
    </text>
  </svg>
);

// Before/After 효과 일러스트레이션
const BeforeAfterIllustration = () => (
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
      <text x="100" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">Before</text>
      <rect x="25" y="40" width="150" height="130" fill="url(#unevenSkin)" rx="75" />
      {/* 불균일한 색소 추가 */}
      <circle cx="60" cy="80" r="8" fill="#a08070" opacity="0.5" />
      <circle cx="120" cy="100" r="10" fill="#907060" opacity="0.6" />
      <circle cx="80" cy="130" r="6" fill="#a08070" opacity="0.4" />
      <circle cx="130" cy="70" r="7" fill="#907060" opacity="0.5" />
      <text x="100" y="190" fontSize="11" fill="#8a8a8a" textAnchor="middle">불균일한 피부톤</text>
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
      <text x="250" y="85" fontSize="10" fill="#b4988d" textAnchor="middle">레이저 토닝</text>
      <text x="250" y="125" fontSize="10" fill="#b4988d" textAnchor="middle">+ 울블랑</text>
    </g>

    {/* After 섹션 */}
    <g>
      <text x="400" y="25" fontSize="14" fill="#575756" textAnchor="middle" fontWeight="600">After</text>
      <rect x="325" y="40" width="150" height="130" fill="url(#evenSkin)" rx="75" />
      {/* 균일하고 밝은 피부 표현 */}
      <ellipse cx="400" cy="105" rx="60" ry="50" fill="white" opacity="0.2" />
      <text x="400" y="190" fontSize="11" fill="#8a8a8a" textAnchor="middle">맑고 균일한 피부톤</text>
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
}

const TreatmentStepCard = ({ step, title, equipment, description, sessions, icon }: TreatmentStepProps) => (
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
      <span className="text-xs text-[var(--color-mono-light)]">권장 횟수</span>
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
}

const SkinConcernCard = ({ title, description, solution, equipment }: SkinConcernCardProps) => (
  <div className="bg-white rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
    <h4 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">{title}</h4>
    <p className="text-sm text-[var(--color-mono)] mb-3">{description}</p>
    <div className="bg-[var(--color-background)] rounded-lg p-3">
      <p className="text-xs text-[var(--color-mono-light)] mb-1">맞춤 솔루션</p>
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
  highlight?: boolean;
}

const EquipmentCard = ({ equipment, highlight = false }: EquipmentCardProps) => (
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
          <p className="text-xs text-[var(--color-mono-light)]">파장</p>
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
          <p className="text-xs text-[var(--color-mono-light)]">특징</p>
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
          <p className="text-xs text-[var(--color-mono-light)]">장점</p>
          <p className="text-sm text-[var(--color-mono)]">{equipment.advantage}</p>
        </div>
      </div>
    </div>

    {/* 적응증 */}
    <div className="pt-4 border-t border-[var(--color-border)]">
      <p className="text-xs text-[var(--color-mono-light)] mb-2">적응증</p>
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
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => (
  <div className="border-b border-[var(--color-border)] last:border-b-0">
    <button
      onClick={onClick}
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

export default function SkinToneDetail() {
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  // 장비 데이터
  const toningEquipment = {
    name: '레이저 토닝',
    nameEn: 'Laser Toning (Spectra XT)',
    wavelength: '1064nm Nd:YAG',
    feature: '저출력 반복 조사 (MLA 모드)',
    advantage: '다운타임 제로, 일상생활 즉시 가능',
    targets: ['칙칙한 피부', '잔주름', '모공', '피부결', '밝기 개선'],
    sessions: LASER_EQUIPMENT.toning.sessions
  };

  const ulblancEquipment = {
    name: '울블랑',
    nameEn: 'Ulblanc Whitening Laser',
    wavelength: '전용 화이트닝 파장',
    feature: '멜라닌 선택적 타겟팅',
    advantage: '자극 없이 피부톤 개선',
    targets: ['피부 미백', '톤 균일화', '투명함', '광채', '칙칙함'],
    sessions: LASER_EQUIPMENT.ulblanc.sessions
  };

  // 피부 고민 유형
  const skinConcerns = [
    {
      title: '전체적으로 칙칙한 피부',
      description: '햇빛 노출, 스트레스, 피로 등으로 피부 전체가 어둡고 생기 없어 보이는 상태',
      solution: '레이저 토닝으로 전체적인 피부 밝기 개선',
      equipment: ['레이저 토닝', '울블랑']
    },
    {
      title: '부분적 색소 침착',
      description: '뺨, 이마, 광대뼈 주변에 부분적으로 어두운 색소가 침착된 상태',
      solution: '레이저 토닝 집중 치료 + 피코레이저 병행',
      equipment: ['레이저 토닝', 'Lucas']
    },
    {
      title: '모공/피부결 고민',
      description: '넓어진 모공과 거친 피부결로 인해 피부톤이 고르지 않아 보이는 상태',
      solution: '레이저 토닝의 콜라겐 리모델링 효과 활용',
      equipment: ['레이저 토닝']
    },
    {
      title: '피부 투명도 저하',
      description: '피부가 탁하고 투명함이 없어 건강해 보이지 않는 상태',
      solution: '울블랑으로 피부 투명도 및 광채 회복',
      equipment: ['울블랑', '레이저 토닝']
    }
  ];

  // 치료 단계
  const treatmentSteps = [
    {
      step: 1,
      title: '피부 컨디셔닝',
      equipment: '레이저 토닝',
      description: '1064nm 파장으로 피부 전체에 저출력 에너지를 균일하게 조사하여 피부 기저 컨디션을 개선합니다.',
      sessions: '주 1회, 4-5회',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      step: 2,
      title: '멜라닌 타겟팅',
      equipment: '울블랑',
      description: '멜라닌에 선택적으로 작용하는 전용 파장으로 색소를 점진적으로 분해하고 피부 미백을 유도합니다.',
      sessions: '2주 간격, 3-4회',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      step: 3,
      title: '유지 관리',
      equipment: '레이저 토닝 + 울블랑',
      description: '월 1회 정기적인 관리로 밝아진 피부톤을 유지하고 새로운 색소 침착을 예방합니다.',
      sessions: '월 1회 유지',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }
  ];

  // FAQ 데이터
  const faqs = [
    {
      question: '레이저 토닝은 몇 회 정도 받아야 효과를 볼 수 있나요?',
      answer: '일반적으로 4-5회 치료 후부터 눈에 띄는 효과를 느끼실 수 있습니다. 피부 상태에 따라 개인차가 있으며, 10회 정도 치료하면 최적의 결과를 기대할 수 있습니다. 이후 월 1회 유지 치료로 밝아진 피부톤을 오래 유지할 수 있습니다.'
    },
    {
      question: '레이저 토닝 시술 후 일상생활에 제한이 있나요?',
      answer: '레이저 토닝의 가장 큰 장점은 "다운타임 제로"입니다. 시술 직후 가벼운 홍조가 나타날 수 있으나 30분-1시간 내 가라앉으며, 세안, 화장, 외출 등 일상생활이 바로 가능합니다. 단, 시술 당일 사우나나 격렬한 운동은 피해주시고, 자외선 차단에 신경 써주세요.'
    },
    {
      question: '울블랑과 레이저 토닝의 차이점은 무엇인가요?',
      answer: '레이저 토닝은 1064nm Nd:YAG 레이저로 피부 전체의 색소를 점진적으로 개선하고 콜라겐 생성을 촉진합니다. 울블랑은 멜라닌에 특화된 전용 파장으로 보다 직접적인 미백 효과를 제공합니다. 두 시술을 병행하면 시너지 효과로 더 빠르고 효과적인 결과를 얻을 수 있습니다.'
    },
    {
      question: '민감성 피부도 레이저 토닝이 가능한가요?',
      answer: '네, 가능합니다. 레이저 토닝은 저출력으로 조사하기 때문에 민감성 피부에도 비교적 안전합니다. 다만 첫 시술 시 에너지 세팅을 낮게 시작하여 피부 반응을 확인한 후 점진적으로 조절합니다. 상담 시 피부 상태를 정확히 말씀해 주시면 맞춤 치료 계획을 세워드립니다.'
    },
    {
      question: '기미 치료와 피부톤 개선 치료는 어떻게 다른가요?',
      answer: '기미 치료는 명확한 경계가 있는 색소 병변을 타겟으로 피코레이저 등 고출력 장비로 집중 치료합니다. 반면 피부톤 개선은 전체적인 칙칙함, 미세한 색소 침착, 피부결 개선을 목표로 레이저 토닝과 울블랑을 활용합니다. 기미가 있으면서 전체 피부톤도 개선하고 싶으시다면 두 치료를 병행하는 것이 효과적입니다.'
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
                <span className="text-[var(--color-secondary)]">피부톤 균일화</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-secondary)] mb-6">
                피부톤 균일화
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium mb-4">
                Skin Tone Brightening & Whitening
              </p>
              <p className="text-lg text-[var(--color-mono)] max-w-2xl mx-auto leading-relaxed">
                레이저 토닝과 울블랑의 시너지로<br className="hidden md:block" />
                칙칙한 피부를 맑고 환한 피부로 되돌립니다
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 피부톤 고민 해결 섹션 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimateOnScroll animation="fadeInUp">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                이런 피부 고민이 있으신가요?
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                피부톤 불균일의 원인은 다양합니다. 고민별 맞춤 솔루션을 제안합니다.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {skinConcerns.map((concern, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <SkinConcernCard {...concern} />
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
                    치료 원리
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-6">
                    레이저 토닝의 과학
                  </h2>
                  <div className="space-y-4 text-[var(--color-mono)]">
                    <p className="leading-relaxed">
                      레이저 토닝은 <strong className="text-[var(--color-secondary)]">1064nm Nd:YAG 레이저</strong>를
                      저출력으로 반복 조사하여 피부 속 멜라닌을 점진적으로 분해하는 시술입니다.
                    </p>
                    <p className="leading-relaxed">
                      기존의 고출력 레이저와 달리, <strong className="text-[var(--color-secondary)]">낮은 에너지를 넓은 범위에 균일하게</strong>
                      조사하여 피부 자극을 최소화하면서 효과를 극대화합니다.
                    </p>
                    <div className="bg-[var(--color-background)] rounded-xl p-5 mt-6">
                      <h4 className="font-semibold text-[var(--color-secondary)] mb-3">레이저 토닝의 3가지 효과</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span><strong>멜라닌 분해</strong> - 피부 속 색소를 점진적으로 분해</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span><strong>콜라겐 생성</strong> - 진피층 자극으로 피부 탄력 개선</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span><strong>모공 축소</strong> - 피지선 기능 조절 및 모공 타이트닝</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 일러스트레이션 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-[var(--color-background)] rounded-2xl p-6">
                  <ToningMechanismIllustration />
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
                피부톤 변화 과정
              </h2>
              <p className="text-[var(--color-mono)]">
                레이저 토닝과 울블랑의 조합으로 달라지는 피부톤
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
              <BeforeAfterIllustration />
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
                LIV 보유 장비
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                피부톤 개선 전용 장비
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                일상에 지장 없이, 점진적으로 밝아지는 피부톤을 위한 전문 장비
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <EquipmentCard equipment={toningEquipment} highlight />
            </AnimateOnScroll>
            <AnimateOnScroll animation="fadeInUp" delay={0.2}>
              <EquipmentCard equipment={ulblancEquipment} />
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
                    레이저 토닝 + 울블랑 시너지 효과
                  </h4>
                  <p className="text-[var(--color-mono)] leading-relaxed">
                    레이저 토닝으로 피부 전체의 컨디션을 개선하고, 울블랑으로 멜라닌을 직접 타겟팅하면
                    단독 시술 대비 <strong className="text-[var(--color-primary)]">1.5~2배 빠른 효과</strong>를 기대할 수 있습니다.
                    두 장비 모두 다운타임이 없어 부담 없이 병행 치료가 가능합니다.
                  </p>
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
                치료 과정
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                3단계 피부톤 개선 프로그램
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                체계적인 단계별 치료로 자연스럽고 지속적인 피부톤 개선을 이끌어냅니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {treatmentSteps.map((step, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <TreatmentStepCard {...step} />
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
                레이저 토닝의 장점
              </h2>
              <p className="text-white/80">
                바쁜 현대인을 위한 부담 없는 피부 관리
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { title: '다운타임 제로', desc: '시술 직후 일상생활 가능', icon: '⚡' },
              { title: '점심시간 시술', desc: '15-20분 소요로 간편', icon: '⏱️' },
              { title: '자연스러운 효과', desc: '점진적으로 밝아지는 피부', icon: '✨' },
              { title: '복합 개선', desc: '톤, 모공, 탄력 동시 케어', icon: '💎' }
            ].map((item, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <div className="text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
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
                자주 묻는 질문
              </h2>
              <p className="text-[var(--color-mono)]">
                피부톤 개선 시술에 대해 궁금한 점을 확인하세요
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fadeInUp" delay={0.1}>
            <div className="max-w-3xl mx-auto bg-[var(--color-background)] rounded-2xl p-6 md:p-8">
              {faqs.map((faq, idx) => (
                <FAQItem
                  key={idx}
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
                맑고 환한 피부톤을 되찾으세요
              </h2>
              <p className="text-[var(--color-mono)] mb-8 leading-relaxed">
                다운타임 없이 일상 속에서 관리하는<br className="hidden md:block" />
                레이저 토닝 & 울블랑 프로그램을 시작해보세요
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
