'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { LASER_EQUIPMENT } from '@/lib/constants';

// 755nm vs 1064nm 파장 비교 일러스트레이션
const WavelengthComparisonIllustration = () => (
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
      파장별 모낭 타겟팅 깊이
    </text>

    {/* 755nm 섹션 */}
    <g transform="translate(50, 45)">
      <text x="75" y="15" fontSize="12" fill="#b4988d" textAnchor="middle" fontWeight="600">755nm 알렉산드라이트</text>
      <text x="75" y="30" fontSize="10" fill="#8a8a8a" textAnchor="middle">멜라닌 흡수율 최적</text>

      {/* 피부 단면 */}
      <rect x="0" y="45" width="150" height="200" fill="url(#skinGradient)" rx="4" />

      {/* 표피/진피 라벨 */}
      <line x1="155" y1="75" x2="165" y2="75" stroke="#ccc" strokeWidth="1" />
      <text x="170" y="78" fontSize="8" fill="#8a8a8a">표피</text>
      <line x1="155" y1="130" x2="165" y2="130" stroke="#ccc" strokeWidth="1" />
      <text x="170" y="133" fontSize="8" fill="#8a8a8a">진피</text>

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
      <text x="75" y="15" fontSize="12" fill="#6d4e42" textAnchor="middle" fontWeight="600">1064nm Nd:YAG</text>
      <text x="75" y="30" fontSize="10" fill="#8a8a8a" textAnchor="middle">깊은 침투, 모든 피부톤</text>

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
      <text x="125" y="16" fontSize="10" fill="#b4988d" textAnchor="middle" fontWeight="500">밝은 피부 최적화</text>

      <rect x="310" y="0" width="130" height="24" fill="#6d4e42" opacity="0.1" rx="12" />
      <text x="375" y="16" fontSize="10" fill="#6d4e42" textAnchor="middle" fontWeight="500">어두운 피부/깊은 모낭</text>
    </g>
  </svg>
);

// IntelliTrak 기술 일러스트레이션
const IntelliTrakIllustration = () => (
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
      IntelliTrak™ 실시간 추적 시스템
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
        실시간 피부 추적으로 균일한 에너지 전달
      </text>
      <text x="150" y="33" fontSize="10" fill="#8a8a8a" textAnchor="middle">
        겹침/누락 없이 정확한 조사
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
}

const BodyAreaCard = ({ area, sessions, interval, description, icon }: BodyAreaCardProps) => (
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
            <span className="text-xs text-[var(--color-mono-light)]">권장 횟수</span>
            <p className="text-sm font-medium text-[var(--color-secondary)]">{sessions}</p>
          </div>
          <div>
            <span className="text-xs text-[var(--color-mono-light)]">시술 간격</span>
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
  const tNav = useTranslations('nav');
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(0);

  // 부위별 제모 정보
  const bodyAreas = [
    {
      area: '겨드랑이',
      sessions: '6-8회',
      interval: '4-6주',
      description: '가장 인기 있는 제모 부위. 땀, 냄새 관리에도 효과적입니다.',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      area: '팔/다리',
      sessions: '6-10회',
      interval: '6-8주',
      description: '넓은 부위도 빠르게 시술. 매끈한 피부를 오래 유지합니다.',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      )
    },
    {
      area: '비키니 라인',
      sessions: '8-10회',
      interval: '4-6주',
      description: '민감한 부위에 최적화된 세팅으로 안전하고 효과적인 시술.',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      area: '얼굴 (인중, 턱선)',
      sessions: '8-12회',
      interval: '3-4주',
      description: '섬세한 얼굴 털 제거. 잔털까지 깔끔하게 정리합니다.',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      area: '등/가슴 (남성)',
      sessions: '8-12회',
      interval: '6-8주',
      description: '남성 제모 전문. 자연스러운 감모부터 완전 제모까지.',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      area: '전신 제모',
      sessions: '8-12회',
      interval: '부위별 조정',
      description: '전신 토탈 케어. 패키지 프로그램으로 합리적인 가격.',
      icon: (
        <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    }
  ];

  // Clarity II 장점
  const clarityAdvantages = [
    {
      title: '듀얼 파장',
      description: '755nm + 1064nm으로 모든 피부 타입에 안전하고 효과적',
      icon: (
        <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'IntelliTrak™',
      description: '실시간 피부 추적으로 균일한 에너지 전달, 화상 위험 최소화',
      icon: (
        <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: '대면적 스팟',
      description: '최대 3cm² 스팟 사이즈로 넓은 부위도 빠르게 시술',
      icon: (
        <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: '통합 쿨링',
      description: '크라이오젠 쿨링 시스템으로 시술 중 통증 및 불편감 최소화',
      icon: (
        <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    }
  ];

  // FAQ 데이터
  const faqs = [
    {
      question: '레이저 제모는 영구적인가요?',
      answer: '레이저 제모는 "영구 감모(Permanent Hair Reduction)"로 분류됩니다. 성장기 모낭을 타겟으로 하기 때문에 완료 후 80-90%의 영구적인 감모 효과를 기대할 수 있습니다. 일부 휴지기 모낭이 성장기로 전환되면 약간의 재발이 있을 수 있어, 연 1-2회 유지 치료를 권장드립니다.'
    },
    {
      question: '제모 레이저는 아픈가요?',
      answer: 'Clarity II는 내장된 크라이오젠 쿨링 시스템이 시술 중 피부를 지속적으로 냉각시켜 통증을 최소화합니다. 대부분의 분들이 "고무줄로 튕기는 정도"의 가벼운 자극으로 표현하시며, 필요에 따라 마취 크림을 사전 도포할 수 있습니다.'
    },
    {
      question: '밝은 색(금발, 흰색) 털도 제거 가능한가요?',
      answer: '레이저 제모는 멜라닌을 타겟으로 하기 때문에 멜라닌이 적은 흰색, 금발, 연한 색 털에는 효과가 제한적입니다. 이런 경우 전기 침(전기분해) 제모가 대안이 될 수 있습니다. 상담 시 털 색상을 확인하고 최적의 방법을 안내해드립니다.'
    },
    {
      question: '피부가 어두운 편인데 제모해도 되나요?',
      answer: '네, Clarity II의 1064nm Nd:YAG 파장은 어두운 피부(Fitzpatrick Type IV-VI)에서도 안전하게 사용 가능합니다. 755nm 알렉산드라이트 파장은 밝은 피부에, 1064nm는 어두운 피부에 최적화되어 있어 모든 피부 타입에 맞춤 시술이 가능합니다.'
    },
    {
      question: '제모 전후 주의사항이 있나요?',
      answer: '시술 전: 2주 전부터 왁싱, 뽑기, 탈모제 사용을 피하고 면도만 해주세요. 시술 당일 과도한 태닝은 피해주세요.\n\n시술 후: 24-48시간 사우나, 격렬한 운동을 피하고, 자외선 차단제를 꼼꼼히 바르세요. 시술 부위를 긁거나 문지르지 마시고, 자극적인 스킨케어 제품 사용을 자제해 주세요.'
    },
    {
      question: '몇 회 정도 받아야 효과를 볼 수 있나요?',
      answer: '부위와 개인의 모발 특성에 따라 다르지만, 일반적으로 6-10회 시술 후 최적의 결과를 기대할 수 있습니다. 모발 성장 주기 중 성장기(Anagen)에만 레이저가 효과적이기 때문에, 4-8주 간격으로 여러 번 시술하여 다양한 주기의 모낭을 타겟팅합니다.'
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
                <Link href="/laser" className="hover:text-[var(--color-primary)] transition-colors">{t('laser.center.name')}</Link>
                <span>/</span>
                <span className="text-[var(--color-secondary)]">{t('laser.hairRemoval.name')}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-secondary)] mb-6">
                프리미엄 제모
              </h1>
              <p className="text-xl md:text-2xl text-[var(--color-primary)] font-medium mb-4">
                Premium Hair Removal with Clarity II
              </p>
              <p className="text-lg text-[var(--color-mono)] max-w-2xl mx-auto leading-relaxed">
                듀얼 파장 + IntelliTrak™ 기술로<br className="hidden md:block" />
                모든 피부 타입에 안전하고 효과적인 의료 레이저 제모
              </p>
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
                    LIV 프리미엄 장비
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-6">
                    Clarity II
                  </h2>
                  <p className="text-lg text-[var(--color-primary)] font-medium mb-4">
                    제모의 새로운 기준
                  </p>
                  <div className="space-y-4 text-[var(--color-mono)]">
                    <p className="leading-relaxed">
                      Clarity II는 <strong className="text-[var(--color-secondary)]">755nm 알렉산드라이트</strong>와
                      <strong className="text-[var(--color-secondary)]"> 1064nm Nd:YAG</strong> 두 가지 파장을 하나의 플랫폼에서 제공하는
                      프리미엄 레이저 시스템입니다.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-[var(--color-secondary)]">IntelliTrak™</strong> 기술은 실시간으로 피부를 추적하여
                      겹침이나 누락 없이 균일한 에너지를 전달, 화상 위험을 최소화하고 효과를 극대화합니다.
                    </p>
                  </div>

                  {/* 핵심 스펙 */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">파장</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">755nm + 1064nm</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">스팟 사이즈</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">최대 3cm²</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">펄스 시간</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">2-400ms</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-mono-light)] mb-1">쿨링</p>
                      <p className="text-lg font-bold text-[var(--color-secondary)]">크라이오젠</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* 일러스트레이션 */}
              <AnimateOnScroll animation="fadeInUp" delay={0.2}>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <WavelengthComparisonIllustration />
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
                차별화 기술
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                IntelliTrak™ 기술
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                실시간 피부 추적으로 안전하고 효과적인 제모를 실현합니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <AnimateOnScroll animation="fadeInUp" delay={0.1}>
              <div className="bg-[var(--color-background)] rounded-2xl p-6 mb-8">
                <IntelliTrakIllustration />
              </div>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: '실시간 추적', desc: '핸드피스 움직임을 실시간으로 감지하여 조사 위치 파악' },
                { title: '균일한 커버리지', desc: '겹침/누락 없이 전체 치료 영역에 균일한 에너지 전달' },
                { title: '화상 예방', desc: '동일 부위 중복 조사 방지로 화상 및 과치료 위험 최소화' }
              ].map((item, idx) => (
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
                Clarity II가 특별한 이유
              </h2>
              <p className="text-white/80">
                프리미엄 제모의 새로운 기준을 경험하세요
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {clarityAdvantages.map((adv, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.1}>
                <AdvantageCard {...adv} />
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
              <span className="inline-block bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium px-4 py-1 rounded-full mb-4">
                부위별 가이드
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-secondary)] mb-4">
                부위별 제모 프로그램
              </h2>
              <p className="text-[var(--color-mono)] max-w-2xl mx-auto">
                각 부위의 특성에 맞는 최적화된 세팅으로 효과적인 제모를 제공합니다
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {bodyAreas.map((area, idx) => (
              <AnimateOnScroll key={idx} animation="fadeInUp" delay={idx * 0.05}>
                <BodyAreaCard {...area} />
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
                {t('common.process')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: 1, title: '상담 & 피부 분석', desc: '피부 타입, 모발 특성 분석 후 맞춤 치료 계획 수립' },
                { step: 2, title: '사전 준비', desc: '치료 부위 면도 및 필요시 마취 크림 도포' },
                { step: 3, title: '레이저 조사', desc: 'IntelliTrak™으로 정확하고 균일한 에너지 전달' },
                { step: 4, title: '사후 케어', desc: '쿨링 및 진정 케어, 다음 시술 일정 안내' }
              ].map((item, idx) => (
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
                {tCommon('faq')}
              </h2>
              <p className="text-[var(--color-mono)]">
                레이저 제모에 대해 궁금한 점을 확인하세요
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
                매끄러운 피부를 위한 첫걸음
              </h2>
              <p className="text-[var(--color-mono)] mb-8 leading-relaxed">
                Clarity II 듀얼 파장 레이저로<br className="hidden md:block" />
                안전하고 효과적인 프리미엄 제모를 시작하세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  {tCommon('freeConsultation')}
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
