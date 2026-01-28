'use client';

import { useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

const treatment = TREATMENTS.antiaging.botox;

// Premium color palette - Rose Gold theme
const colors = {
  primary: '#C4A484',
  secondary: '#8B7355',
  accent: '#E8D5C4',
  dark: '#3D3D3D',
  light: '#F9F6F3',
  rose: '#D4A5A5',
  gold: '#D4AF37',
};

// Treatment Areas Illustration Component
const TreatmentAreasIllustration = () => (
  <div className="relative w-full max-w-[480px] mx-auto">
    <svg viewBox="0 0 400 650" className="w-full h-auto">
      <defs>
        {/* Premium gradients */}
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE8E0" />
          <stop offset="50%" stopColor="#FFE4E1" />
          <stop offset="100%" stopColor="#FAE0D8" />
        </linearGradient>
        <linearGradient id="roseGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8B4B8" />
          <stop offset="100%" stopColor="#C4A484" />
        </linearGradient>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAF0EB" />
          <stop offset="100%" stopColor="#F5E8E4" />
        </linearGradient>
        {/* Glow effect for markers */}
        <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="400" height="650" fill="url(#bgGradient)" rx="24" />

      {/* Face outline - slim feminine oval with pointed chin */}
      <path
        d="M200 75
           Q265 85 280 150
           Q290 200 275 260
           Q255 310 200 330
           Q145 310 125 260
           Q110 200 120 150
           Q135 85 200 75 Z"
        fill="url(#skinGradient)"
        stroke="#E8D5C4"
        strokeWidth="2"
      />

      {/* Hair hint - flowing feminine style */}
      <path d="M120 140 Q130 70 200 60 Q270 70 280 140" fill="none" stroke="#C4B0A0" strokeWidth="2" strokeLinecap="round" />
      <path d="M115 155 Q125 90 200 80 Q275 90 285 155" fill="none" stroke="#D4C4BD" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* ===== Face Features ===== */}
      {/* Eyebrows - elegant feminine arch */}
      <path d="M140 163 Q155 155 172 158" fill="none" stroke="#C4B0A0" strokeWidth="2" strokeLinecap="round" />
      <path d="M260 163 Q245 155 228 158" fill="none" stroke="#C4B0A0" strokeWidth="2" strokeLinecap="round" />

      {/* Eyes - feminine almond shape */}
      {/* Left eye */}
      <g>
        {/* Double eyelid crease */}
        <path d="M142 172 Q157 167 172 172" fill="none" stroke="#E0D0C8" strokeWidth="0.8" strokeLinecap="round" />
        {/* Upper eyelid - elegant almond */}
        <path d="M140 178 Q150 171 157 171 Q164 171 174 178" fill="none" stroke="#C4B0A0" strokeWidth="1.2" strokeLinecap="round" />
        {/* Lower eyelid - subtle curve */}
        <path d="M143 181 Q157 185 171 181" fill="none" stroke="#D8C8C0" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* Right eye */}
      <g>
        {/* Double eyelid crease */}
        <path d="M228 172 Q243 167 258 172" fill="none" stroke="#E0D0C8" strokeWidth="0.8" strokeLinecap="round" />
        {/* Upper eyelid - elegant almond */}
        <path d="M226 178 Q236 171 243 171 Q250 171 260 178" fill="none" stroke="#C4B0A0" strokeWidth="1.2" strokeLinecap="round" />
        {/* Lower eyelid - subtle curve */}
        <path d="M229 181 Q243 185 257 181" fill="none" stroke="#D8C8C0" strokeWidth="0.8" strokeLinecap="round" />
      </g>

      {/* Nose - delicate feminine */}
      <path d="M200 188 L200 215 Q197 222 193 225" fill="none" stroke="#E8D5C4" strokeWidth="1" strokeLinecap="round" />
      <path d="M193 225 Q200 228 207 225" fill="none" stroke="#E8D5C4" strokeWidth="1" strokeLinecap="round" />

      {/* Lips - fuller feminine shape */}
      <path d="M178 252 Q190 246 200 248 Q210 246 222 252" fill="none" stroke="#E8B4B8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M178 252 Q200 264 222 252" fill="#F5E0E0" stroke="#D4A5A5" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

      {/* Neck - slender feminine */}
      <path d="M165 325 L162 380 Q162 400 178 408 L222 408 Q238 400 238 380 L235 325" fill="url(#skinGradient)" stroke="#E8D5C4" strokeWidth="1.5" />

      {/* Shoulders - soft feminine curves */}
      <path d="M70 455 Q90 430 162 418 L162 435 Q110 440 88 462 L70 455" fill="url(#skinGradient)" stroke="#E8D5C4" strokeWidth="1.5" />
      <path d="M330 455 Q310 430 238 418 L238 435 Q290 440 312 462 L330 455" fill="url(#skinGradient)" stroke="#E8D5C4" strokeWidth="1.5" />

      {/* ===== Treatment markers with labels ===== */}
      {/* 1. 이마 (Forehead) */}
      <g filter="url(#markerGlow)">
        <circle cx="200" cy="105" r="10" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="200" cy="105" r="5" fill="#E8B4B8" />
      </g>
      <line x1="210" y1="105" x2="280" y2="105" stroke="#E8B4B8" strokeWidth="1" strokeDasharray="2 2" />
      <text x="290" y="109" fill="#8B7355" fontSize="13" fontWeight="500">이마</text>

      {/* 2. 미간 (Glabella) */}
      <g filter="url(#markerGlow)">
        <circle cx="200" cy="145" r="10" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="200" cy="145" r="5" fill="#E8B4B8" />
      </g>
      <line x1="210" y1="145" x2="280" y2="145" stroke="#E8B4B8" strokeWidth="1" strokeDasharray="2 2" />
      <text x="290" y="149" fill="#8B7355" fontSize="13" fontWeight="500">미간</text>

      {/* 3. 눈가 (Crow's feet) - both sides */}
      <g filter="url(#markerGlow)">
        <circle cx="125" cy="180" r="8" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="125" cy="180" r="4" fill="#E8B4B8" />
      </g>
      <g filter="url(#markerGlow)">
        <circle cx="275" cy="180" r="8" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="275" cy="180" r="4" fill="#E8B4B8" />
      </g>
      <line x1="117" y1="180" x2="55" y2="180" stroke="#E8B4B8" strokeWidth="1" strokeDasharray="2 2" />
      <text x="25" y="184" fill="#8B7355" fontSize="13" fontWeight="500">눈가</text>

      {/* 4. 사각턱 (Masseter/Jawline) - both sides */}
      <g filter="url(#markerGlow)">
        <circle cx="125" cy="280" r="10" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="125" cy="280" r="5" fill="#E8B4B8" />
      </g>
      <g filter="url(#markerGlow)">
        <circle cx="275" cy="280" r="10" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="275" cy="280" r="5" fill="#E8B4B8" />
      </g>
      <line x1="115" y1="280" x2="45" y2="280" stroke="#E8B4B8" strokeWidth="1" strokeDasharray="2 2" />
      <text x="10" y="284" fill="#8B7355" fontSize="13" fontWeight="500">사각턱</text>

      {/* 5. 입꼬리 (Mouth corners) */}
      <g filter="url(#markerGlow)">
        <circle cx="168" cy="258" r="7" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="168" cy="258" r="3.5" fill="#E8B4B8" />
      </g>
      <g filter="url(#markerGlow)">
        <circle cx="232" cy="258" r="7" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="232" cy="258" r="3.5" fill="#E8B4B8" />
      </g>
      <line x1="240" y1="258" x2="300" y2="258" stroke="#E8B4B8" strokeWidth="1" strokeDasharray="2 2" />
      <text x="310" y="262" fill="#8B7355" fontSize="13" fontWeight="500">입꼬리</text>

      {/* 6. 승모근 (Trapezius) */}
      <g filter="url(#markerGlow)">
        <circle cx="90" cy="450" r="10" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="90" cy="450" r="5" fill="#E8B4B8" />
      </g>
      <g filter="url(#markerGlow)">
        <circle cx="310" cy="450" r="10" fill="url(#roseGoldGradient)" opacity="0.3" />
        <circle cx="310" cy="450" r="5" fill="#E8B4B8" />
      </g>
      <text x="200" y="485" textAnchor="middle" fill="#8B7355" fontSize="13" fontWeight="500">승모근</text>

      {/* 7. 종아리 (Calves) - larger inset */}
      <g transform="translate(115, 510)">
        <rect x="0" y="0" width="170" height="110" rx="12" fill="#FFF8F6" stroke="#E8D5C4" strokeWidth="1.5" />
        {/* Left calf */}
        <path d="M45 20 Q55 55 45 90" stroke="#FAE0D8" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M45 20 Q55 55 45 90" stroke="#FFE4E1" strokeWidth="12" fill="none" strokeLinecap="round" />
        {/* Right calf */}
        <path d="M125 20 Q135 55 125 90" stroke="#FAE0D8" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M125 20 Q135 55 125 90" stroke="#FFE4E1" strokeWidth="12" fill="none" strokeLinecap="round" />
        {/* Markers */}
        <g filter="url(#markerGlow)">
          <circle cx="45" cy="55" r="8" fill="url(#roseGoldGradient)" opacity="0.3" />
          <circle cx="45" cy="55" r="4" fill="#E8B4B8" />
        </g>
        <g filter="url(#markerGlow)">
          <circle cx="125" cy="55" r="8" fill="url(#roseGoldGradient)" opacity="0.3" />
          <circle cx="125" cy="55" r="4" fill="#E8B4B8" />
        </g>
        <text x="85" y="128" textAnchor="middle" fill="#8B7355" fontSize="12" fontWeight="500">종아리</text>
      </g>

      {/* Decorative elements */}
      <circle cx="30" cy="30" r="2" fill="#E8B4B8" opacity="0.5" />
      <circle cx="370" cy="30" r="2" fill="#E8B4B8" opacity="0.5" />
    </svg>
  </div>
);

// Floating decorative orb component
const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    animate={{
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Premium Mechanism Illustration with advanced effects
const PremiumMechanismIllustration = () => (
  <div className="relative w-full aspect-square max-w-lg mx-auto">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        {/* Premium gradients */}
        <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
          <stop offset="50%" stopColor={colors.primary} stopOpacity="0.4" />
          <stop offset="100%" stopColor={colors.rose} stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.gold} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
        </linearGradient>

        {/* Glow effect */}
        <radialGradient id="glowEffect" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>

        {/* Premium shadow */}
        <filter id="premiumShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={colors.secondary} floodOpacity="0.25" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={colors.primary} floodOpacity="0.15" />
        </filter>

        {/* Pulse animation filter */}
        <filter id="pulseGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <motion.circle
        cx="200"
        cy="200"
        r="180"
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="0.5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Background circle with premium gradient */}
      <motion.circle
        cx="200"
        cy="200"
        r="160"
        fill="url(#premiumGrad)"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Decorative rings */}
      {[140, 120, 100].map((r, i) => (
        <motion.circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke={colors.primary}
          strokeWidth="0.3"
          strokeOpacity={0.2 + i * 0.1}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, delay: 0.2 * i }}
        />
      ))}

      {/* Central elegant face shape */}
      <motion.g filter="url(#premiumShadow)">
        <motion.ellipse
          cx="200"
          cy="200"
          rx="100"
          ry="120"
          fill="none"
          stroke={colors.primary}
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
      </motion.g>

      {/* Injection points with pulse effect */}
      {[
        { x: 200, y: 110, label: 'Forehead', delay: 0.8, size: 'lg' },
        { x: 155, y: 150, label: 'Glabella', delay: 1 },
        { x: 245, y: 150, label: 'Crow feet', delay: 1.2 },
        { x: 135, y: 220, label: 'Masseter', delay: 1.4 },
        { x: 265, y: 220, label: 'Masseter', delay: 1.6 },
      ].map((point, i) => (
        <motion.g key={i}>
          {/* Outer glow */}
          <motion.circle
            cx={point.x}
            cy={point.y}
            r={point.size === 'lg' ? 30 : 24}
            fill="url(#glowEffect)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{
              duration: 3,
              delay: point.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          {/* Mid ring */}
          <motion.circle
            cx={point.x}
            cy={point.y}
            r={point.size === 'lg' ? 20 : 16}
            fill={colors.accent}
            fillOpacity="0.4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: point.delay }}
          />
          {/* Inner dot with pulse */}
          <motion.circle
            cx={point.x}
            cy={point.y}
            r={point.size === 'lg' ? 6 : 4}
            fill={colors.primary}
            filter="url(#pulseGlow)"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 2,
              delay: point.delay + 0.2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.g>
      ))}

      {/* Connecting lines */}
      <motion.path
        d="M 200 110 L 200 200"
        stroke={colors.rose}
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 2 }}
      />
      <motion.path
        d="M 155 150 L 200 200 L 245 150"
        stroke={colors.rose}
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 2.2 }}
      />

      {/* Premium label */}
      <motion.text
        x="200"
        y="350"
        textAnchor="middle"
        fill={colors.secondary}
        fontSize="11"
        fontWeight="300"
        letterSpacing="0.15em"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        PRECISION INJECTION MAPPING
      </motion.text>
    </svg>
  </div>
);

// Premium Timeline with progress bars
const PremiumTimelineSection = () => {
  const timelineData = [
    { time: 'Day 1', title: '시술 당일', desc: '간단한 시술 후 바로 일상 복귀 가능', percentage: 0 },
    { time: '3-7일', title: '효과 시작', desc: '근육이 서서히 이완되기 시작합니다', percentage: 30 },
    { time: '2-4주', title: '최대 효과', desc: '자연스러운 주름 개선 효과가 극대화됩니다', percentage: 100 },
    { time: '3-6개월', title: '효과 유지', desc: '개인에 따라 효과 지속 기간이 다릅니다', percentage: 70 },
  ];

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Central line with gradient */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#C4A484] to-transparent hidden lg:block" />

      {timelineData.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.2 }}
          className={`relative flex items-center gap-12 mb-20 last:mb-0 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
        >
          <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right lg:pr-16' : 'lg:text-left lg:pl-16'}`}>
            <motion.span
              className="inline-block text-xs font-medium tracking-[0.25em] text-[#C4A484] uppercase mb-2"
              initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 + 0.1 }}
            >
              {item.time}
            </motion.span>
            <h3 className="text-2xl font-light text-[#3D3D3D] mt-1">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.desc}</p>

            {/* Progress bar */}
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#C4A484] to-[#D4A5A5] rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${item.percentage}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.2 + 0.3 }}
              />
            </div>
          </div>

          {/* Center node with glow */}
          <motion.div
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 + 0.2, type: 'spring' }}
          >
            <div className="absolute w-12 h-12 rounded-full bg-[#C4A484]/20 animate-ping" />
            <div className="w-5 h-5 rounded-full bg-white border-2 border-[#C4A484] shadow-lg relative z-10" />
          </motion.div>

          <div className="flex-1" />
        </motion.div>
      ))}
    </div>
  );
};

export default function BotoxDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  // 번역된 데이터
  const detail = {
    hero: {
      badge: t('antiaging.botox.detail.hero.badge'),
      title: t('antiaging.botox.detail.hero.title'),
      description: t('antiaging.botox.detail.hero.description'),
    },
    benefits: {
      title: t('antiaging.botox.detail.benefits.title'),
    },
    targetAreas: {
      title: t('antiaging.botox.detail.targetAreas.title'),
      subtitle: t('antiaging.botox.detail.targetAreas.subtitle'),
      areas: {
        forehead: t('antiaging.botox.detail.targetAreas.areas.forehead'),
        glabella: t('antiaging.botox.detail.targetAreas.areas.glabella'),
        crowsFeet: t('antiaging.botox.detail.targetAreas.areas.crowsFeet'),
        masseter: t('antiaging.botox.detail.targetAreas.areas.masseter'),
      },
    },
    treatmentInfo: {
      title: t('antiaging.botox.detail.treatmentInfo.title'),
      duration: t('antiaging.botox.detail.treatmentInfo.duration'),
      anesthesia: t('antiaging.botox.detail.treatmentInfo.anesthesia'),
      recovery: t('antiaging.botox.detail.treatmentInfo.recovery'),
      results: t('antiaging.botox.detail.treatmentInfo.results'),
    },
    faq: {
      title: t('antiaging.botox.detail.faq.title'),
    },
    cta: {
      title: t('antiaging.botox.detail.cta.title'),
      description: t('antiaging.botox.detail.cta.description'),
    },
  };

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'botox')
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
    <main className="bg-[#FAFAFA] overflow-hidden">
      {/* Hero - Premium Design */}
      <section className="relative min-h-screen flex items-center">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F9F6F3] via-white to-[#F5F0EB]" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#C4A484]/5" />
        </div>

        {/* Floating decorative orbs */}
        <FloatingOrb className="w-96 h-96 bg-[#C4A484]/10 top-20 right-20" delay={0} />
        <FloatingOrb className="w-72 h-72 bg-[#D4A5A5]/10 bottom-40 left-10" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-[#E8D5C4]/20 top-1/3 left-1/4" delay={4} />

        <div className="container mx-auto px-6 lg:px-12 py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              {/* Premium label with gradient line */}
              <motion.div
                className="flex items-center gap-4 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-12 h-px bg-gradient-to-r from-[#C4A484] to-transparent" />
                <span className="text-xs tracking-[0.4em] text-[#C4A484] uppercase">
                  Anti-Aging Treatment
                </span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-extralight text-[#3D3D3D] leading-tight mb-6">
                {treatment.name}
              </h1>

              <p className="text-xl font-light text-[#C4A484] mb-8 tracking-wide">
                {treatment.nameEn}
              </p>

              <p className="text-gray-600 leading-relaxed max-w-md font-light text-lg">
                {treatment.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              {/* Hero Image */}
              <div className="relative aspect-[4/5] max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-[#C4A484]/20">
                <Image
                  src="/images/Gemini_Generated_Image_dx1pc4dx1pc4dx1p.png"
                  alt="보톡스 - 특정 근육의 움직임을 완화"
                  fill
                  className="object-cover"
                  quality={95}
                  priority
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#C4A484]/10 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits - Premium Card Grid */}
      <section className="py-32 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A484]/30 to-transparent" />

        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Benefits</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D]">
              {detail.benefits.title}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {treatment.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 bg-gradient-to-br from-[#FAFAFA] to-white border border-gray-100 hover:border-[#C4A484]/30 transition-all duration-500 overflow-hidden"
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C4A484]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Premium number badge */}
                <div className="relative w-14 h-14 mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C4A484]/20 to-[#D4A5A5]/10" />
                  <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                    <span className="text-[#C4A484] font-light text-lg">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                </div>

                <h3 className="relative text-lg font-light text-[#3D3D3D] mb-3 group-hover:text-[#C4A484] transition-colors">
                  {benefit.title}
                </h3>
                <p className="relative text-sm text-gray-500 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Areas with Premium Video */}
      <section className="py-32 bg-gradient-to-br from-[#F9F6F3] to-[#F5F0EB] relative overflow-hidden">
        <FloatingOrb className="w-80 h-80 bg-[#C4A484]/5 -right-20 top-20" delay={1} />

        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-px bg-[#C4A484]" />
                <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Treatment Areas</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D] mb-8">
                {t('common.targetAreas')}
              </h2>
              <p className="text-gray-600 font-light mb-12 max-w-md text-lg leading-relaxed">
                얼굴의 표정 주름부터 윤곽 정리까지, 부위별 맞춤 시술로 자연스러운 개선 효과를 드립니다.
              </p>

              <div className="space-y-3">
                {treatment.targetAreas.map((area, index) => (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="group flex items-center gap-6 py-5 border-b border-gray-200/50 hover:border-[#C4A484]/50 transition-all duration-300"
                  >
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4A484]/20 to-[#D4A5A5]/10 flex items-center justify-center">
                      <span className="text-xs text-[#C4A484] font-medium">{String(index + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="text-[#3D3D3D] font-light text-lg group-hover:text-[#C4A484] transition-colors">{area}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Treatment Areas Illustration */}
              <TreatmentAreasIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Timeline */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Timeline</span>
              <div className="w-8 h-px bg-[#C4A484]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D]">
              {t('common.timeline')}
            </h2>
          </motion.div>

          <PremiumTimelineSection />
        </div>
      </section>

      {/* Process - Glassmorphism Dark Section */}
      <section className="py-32 bg-[#2D2D2D] relative overflow-hidden">
        {/* Ambient glow spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C4A484]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4A5A5]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Process</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-white">
              {t('common.process')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {treatment.process.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                {/* Glassmorphism card */}
                <div className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500">
                  {/* Step number with gradient */}
                  <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C4A484]/30 to-[#D4A5A5]/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-extralight text-white/80">{String(step.step).padStart(2, '0')}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-light text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>

                  {/* Connection line */}
                  {index < treatment.process.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-[#C4A484]/50 to-transparent" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Cards - Premium Grid */}
      <section className="py-32 bg-gradient-to-br from-[#F9F6F3] to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Information</span>
              <div className="w-8 h-px bg-[#C4A484]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D]">
              {detail.treatmentInfo.title}
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { label: '시술 시간', value: treatment.duration },
              { label: '마취', value: treatment.anesthesia },
              { label: '회복 기간', value: treatment.recovery },
              { label: '효과 지속', value: treatment.results },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-center justify-between p-8 bg-white rounded-xl border border-gray-100 hover:border-[#C4A484]/30 hover:shadow-xl hover:shadow-[#C4A484]/5 transition-all duration-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4A484]/10 to-[#D4A5A5]/5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#C4A484]" />
                  </div>
                  <span className="text-sm text-gray-500 uppercase tracking-wider">{info.label}</span>
                </div>
                <span className="text-lg font-light text-[#3D3D3D]">{info.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For - Premium Design */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Recommended</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D]">
              {t('common.recommended')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            {treatment.idealFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ x: 8 }}
                className="flex items-center gap-5 p-6 bg-gradient-to-r from-[#FAFAFA] to-white border border-gray-100 rounded-xl hover:border-[#C4A484]/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4A484]/20 to-[#D4A5A5]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#C4A484]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#3D3D3D] font-light">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Premium Accordion */}
      <section className="py-32 bg-[#F9F6F3]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">FAQ</span>
              <div className="w-8 h-px bg-[#C4A484]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D]">
              {detail.faq.title}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {treatment.faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-[#FAFAFA] transition-colors"
                >
                  <span className="font-light text-[#3D3D3D] pr-8">{faq.q}</span>
                  <span className="w-8 h-8 rounded-full bg-[#C4A484]/10 flex items-center justify-center text-[#C4A484] transform group-open:rotate-45 transition-transform duration-300 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600 font-light leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Cautions */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-8 h-px bg-[#C4A484]" />
                <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Precautions</span>
                <div className="w-8 h-px bg-[#C4A484]" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-extralight text-[#3D3D3D]">
                {t('common.precautions')}
              </h2>
            </div>
            <div className="bg-gradient-to-br from-[#FAFAFA] to-white p-10 rounded-2xl border border-gray-100">
              <ul className="space-y-4">
                {treatment.cautions.map((caution, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-4 text-gray-600 font-light"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C4A484] mt-2.5 flex-shrink-0" />
                    {caution}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA - Premium Dark Section */}
      <section className="py-32 bg-gradient-to-br from-[#3D3D3D] to-[#2D2D2D] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C4A484]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#D4A5A5]/5 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.4em] text-[#C4A484] uppercase">Consultation</span>
              <div className="w-12 h-px bg-[#C4A484]" />
            </div>
            <h2 className="text-4xl lg:text-6xl font-extralight text-white mt-4 mb-8">
              {detail.cta.title}
            </h2>
            <p className="text-white/60 font-light max-w-xl mx-auto mb-12 text-lg leading-relaxed">
              {detail.cta.description}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center px-12 py-5 bg-gradient-to-r from-[#C4A484] to-[#B39374] text-white text-sm tracking-wider hover:from-[#B39374] hover:to-[#A38364] transition-all duration-500 shadow-xl shadow-[#C4A484]/20"
              >
                <span>{t('common.onlineConsultation')}</span>
                <svg className="w-4 h-4 ml-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-12 py-5 border border-white/20 text-white text-sm tracking-wider hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                02-797-2773
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
