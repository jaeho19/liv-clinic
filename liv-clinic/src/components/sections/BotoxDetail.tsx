'use client';

import { useTranslations } from 'next-intl';
import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { MEDICAL_QA } from '@/lib/constants';
import { PriceTable } from '@/components/ui';

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

// Types for translations
interface TreatmentAreasLabels {
  forehead: string;
  glabella: string;
  crowsFeet: string;
  masseter: string;
  mouthCorners: string;
  trapezius: string;
  calves: string;
}

// Extended treatment area data with descriptions
interface TreatmentAreaDescriptions {
  forehead: string;
  glabella: string;
  crowsFeet: string;
  masseter: string;
  mouthCorners: string;
  trapezius: string;
  calves: string;
}

interface TimelineItem {
  time: string;
  title: string;
  desc: string;
  percentage: number;
}

// Treatment area position data for SVG overlay markers
// Coordinates are percentages relative to image dimensions (520x650 = 80:100 aspect ratio)
// Anatomically accurate positions based on facial/body muscle anatomy
interface AreaPosition {
  x: number;
  y: number;
  size?: number;
  shape?: 'circle' | 'ellipse' | 'trapezoid';
  rx?: number;  // horizontal radius for ellipse
  ry?: number;  // vertical radius for ellipse
  pairs?: { x: number; y: number; rx?: number; ry?: number }[];
}

// ========================================
// 해부학적 기준 설명 (Anatomical References)
// ========================================
// 1. 사각턱 (Masseter):
//    - 저작근은 광대활(zygomatic arch)에서 하악각(angle of mandible)까지 이어짐
//    - 보톡스 주입점: 하악각 상방 1-2cm, 이를 꽉 물었을 때 볼록해지는 부위
//    - 좌표: 얼굴 하단 1/3 지점, 측면 턱선을 따라 위치
//
// 2. 입꼬리 (Depressor Anguli Oris / DAO):
//    - 구각하제근은 입꼬리에서 하악골 하연까지 주행
//    - 보톡스 주입점: 입꼬리 외측 하방 약 1cm
//    - 좌표: 입술 끝에서 약간 외측 하방
//
// 3. 승모근 (Trapezius):
//    - 후두골~흉추~견갑골~쇄골까지 이어지는 대형 삼각형 근육
//    - 보톡스 주입점: 상부 승모근의 볼륨이 가장 큰 어깨-목 연결부
//    - 좌표: 목 측면에서 어깨 상부(acromion) 방향 사선 영역
// ========================================

const BOTOX_AREA_POSITIONS: Record<number, AreaPosition> = {
  // 1. 이마 (Forehead / Frontalis muscle)
  // 전두근 위치: 눈썹 위 2-4cm, 이마 중앙~측면
  1: {
    x: 50, y: 19, size: 0.8,  // y: 15 → 19 (아래로)
    shape: 'ellipse', rx: 8, ry: 4
  },

  // 2. 미간 (Glabella / Procerus & Corrugator muscles)
  // 추미근 위치: 양 눈썹 사이, 코뿌리 바로 위
  2: {
    x: 50, y: 31, size: 0.8,  // y: 27 → 31 (눈썹 사이로)
    shape: 'circle'
  },

  // 3. 눈가 (Crow's feet / Orbicularis oculi)
  // 안륜근 외측: 눈 외안각에서 외측 1-2cm
  3: {
    x: 50, y: 36,  // y: 32 → 36 (눈 위치로)
    shape: 'circle',
    pairs: [
      { x: 32, y: 36 },  // x: 28 → 32, y: 32 → 36
      { x: 68, y: 36 }   // x: 72 → 68
    ]
  },

  // 4. 사각턱 (Masseter muscle) - 해부학적 정확 위치
  // 저작근: 광대활 하방 ~ 하악각(턱 모서리) 영역
  // 주입점은 하악각(angle of mandible) 상방, 이를 꽉 물었을 때 만져지는 볼록한 부위
  // y: 56% = 턱 위쪽으로 올림
  // x: 35%/65% = 턱 양쪽 (간격 더 좁힘)
  4: {
    x: 50, y: 56, size: 0.8,  // 다른 마커와 동일한 크기
    shape: 'circle',
    pairs: [
      { x: 35, y: 56 },
      { x: 65, y: 56 }
    ]
  },

  // 5. 입꼬리 (Mouth corners / Depressor Anguli Oris) - 해부학적 정확 위치
  // 구각하제근: 입꼬리 외측에서 하악골 하연으로 주행
  // 주입점은 입꼬리 바로 외측 하방 약 1cm (우울근/DAO muscle)
  // y: 53% = 입술 높이
  // x: 42%/58% = 입술 양끝에 맞춤
  5: {
    x: 50, y: 53, size: 0.6,
    shape: 'circle',
    pairs: [
      { x: 42, y: 53 },   // x: 36 → 42 (입술 끝으로)
      { x: 58, y: 53 }    // x: 64 → 58
    ]
  },

  // 6. 승모근 (Trapezius muscle) - 해부학적 정확 위치
  // 상부 승모근: 후두골~경추에서 쇄골/견봉까지 이어지는 삼각형 근육
  // 주입점은 어깨-목 연결부의 볼륨이 가장 큰 영역 (상부 승모근의 견봉 부착부 근처)
  // y: 82% = 어깨 위쪽
  // x: 22%/78% = 어깨 위치
  6: {
    x: 50, y: 82, size: 1.0,  // y: 90 → 82 (위로)
    shape: 'ellipse',
    pairs: [
      { x: 22, y: 82, rx: 8, ry: 5 },
      { x: 78, y: 82, rx: 8, ry: 5 }
    ]
  },

  // 7. 종아리 (Calves / Gastrocnemius)
  // 비복근: 하퇴 후면의 볼록한 근육
  // 이미지 우측 하단의 종아리 아이콘 위치에 단일 마커
  7: {
    x: 89, y: 78, size: 0.8,  // y: 92 → 78 (위로), 단일 마커
    shape: 'circle'
  },
};

// Category colors for treatment areas
const BOTOX_AREA_CATEGORIES: Record<number, { type: 'wrinkle' | 'contour' | 'body'; color: string; label: string }> = {
  1: { type: 'wrinkle', color: '#E8B4B8', label: '표정 주름' },   // 이마
  2: { type: 'wrinkle', color: '#E8B4B8', label: '표정 주름' },   // 미간
  3: { type: 'wrinkle', color: '#E8B4B8', label: '표정 주름' },   // 눈가
  4: { type: 'contour', color: '#C4A484', label: '윤곽 정리' },   // 사각턱
  5: { type: 'wrinkle', color: '#E8B4B8', label: '표정 주름' },   // 입꼬리
  6: { type: 'contour', color: '#C4A484', label: '윤곽 정리' },   // 승모근
  7: { type: 'body', color: '#8B7355', label: '바디' },           // 종아리
};

// Botox Image with Interactive SVG Overlay Markers
const BotoxImageWithMarkers = ({
  selectedAreaId,
}: {
  selectedAreaId: number | null;
}) => {
  const tUi = useTranslations('treatments.antiaging.botox.ui');
  // Render SVG shape (circle or ellipse) at specific position
  const renderSVGMarker = (
    x: number,
    y: number,
    areaId: number,
    index: number = 0,
    customRx?: number,
    customRy?: number
  ) => {
    const isSelected = selectedAreaId === areaId;
    const category = BOTOX_AREA_CATEGORIES[areaId];
    const position = BOTOX_AREA_POSITIONS[areaId];
    const size = position?.size || 1;
    const shape = position?.shape || 'circle';
    const baseRadius = 5;  // 8 → 5 (전체적으로 작게)
    const rx = customRx || position?.rx || baseRadius * size;
    const ry = customRy || position?.ry || baseRadius * size;

    return (
      <g key={`${areaId}-${index}`}>
        {/* Outer glow/pulse effect */}
        <motion.ellipse
          cx={`${x}%`}
          cy={`${y}%`}
          rx={`${rx * 1.8}%`}
          ry={`${ry * 1.8}%`}
          fill={category?.color || '#C4A484'}
          initial={{ opacity: 0, scale: 0 }}
          animate={isSelected ? {
            opacity: [0.3, 0.1, 0.3],
            scale: [1, 1.3, 1],
          } : { opacity: 0, scale: 0 }}
          transition={{
            duration: 2,
            repeat: isSelected ? Infinity : 0,
            ease: 'easeInOut',
          }}
          style={{ filter: 'blur(8px)', transformOrigin: `${x}% ${y}%` }}
        />

        {/* Middle ring */}
        <motion.ellipse
          cx={`${x}%`}
          cy={`${y}%`}
          rx={`${rx * 1.2}%`}
          ry={`${ry * 1.2}%`}
          fill={`${category?.color || '#C4A484'}20`}
          stroke={category?.color || '#C4A484'}
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={isSelected ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ transformOrigin: `${x}% ${y}%` }}
        />

        {/* Center dot with pulse */}
        <motion.circle
          cx={`${x}%`}
          cy={`${y}%`}
          r={`${Math.min(rx, ry) * 0.5}%`}
          fill={category?.color || '#C4A484'}
          initial={{ opacity: 0, scale: 0 }}
          animate={isSelected ? {
            opacity: 1,
            scale: [1, 1.15, 1],
          } : { opacity: 0, scale: 0 }}
          transition={{
            opacity: { type: 'spring', stiffness: 400, damping: 25 },
            scale: {
              duration: 1.5,
              repeat: isSelected ? Infinity : 0,
              ease: 'easeInOut',
            },
          }}
          style={{ transformOrigin: `${x}% ${y}%` }}
        />
      </g>
    );
  };

  // Get glow position for selected area (for paired areas, use center)
  const getGlowPosition = () => {
    if (!selectedAreaId || !BOTOX_AREA_POSITIONS[selectedAreaId]) {
      return { x: 50, y: 50 };
    }
    const pos = BOTOX_AREA_POSITIONS[selectedAreaId];
    if (pos.pairs && pos.pairs.length > 0) {
      // Calculate center of paired positions
      const avgX = pos.pairs.reduce((sum, p) => sum + p.x, 0) / pos.pairs.length;
      const avgY = pos.pairs.reduce((sum, p) => sum + p.y, 0) / pos.pairs.length;
      return { x: avgX, y: avgY };
    }
    return { x: pos.x, y: pos.y };
  };

  const glowPos = getGlowPosition();

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#C4A484]/20">
      <Image
        src="/images/Gemini_Generated_Image_khwxm0khwxm0khwx.png"
        alt={tUi('imageAlt')}
        width={520}
        height={650}
        className="w-full h-auto"
        quality={95}
        priority
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#C4A484]/5 to-transparent pointer-events-none" />

      {/* SVG overlay for precise markers */}
      {/* Note: preserveAspectRatio="none" stretches SVG to match container */}
      {/* Coordinates are percentages (0-100) mapped to image dimensions */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Glow filter for selected areas */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render all area markers */}
        {Object.entries(BOTOX_AREA_POSITIONS).map(([id, pos]) => {
          const areaId = parseInt(id);

          // If area has paired positions (like crow's feet, masseter, calves)
          if (pos.pairs) {
            return (
              <g key={`area-group-${areaId}`}>
                {pos.pairs.map((pair, index) =>
                  renderSVGMarker(pair.x, pair.y, areaId, index, pair.rx, pair.ry)
                )}
              </g>
            );
          }

          // Single position areas
          return (
            <g key={`area-single-${areaId}`}>
              {renderSVGMarker(pos.x, pos.y, areaId, 0)}
            </g>
          );
        })}
      </svg>

      {/* Selected area highlight glow (background effect) */}
      {selectedAreaId && BOTOX_AREA_POSITIONS[selectedAreaId] && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 40% 50% at ${glowPos.x}% ${glowPos.y}%, ${BOTOX_AREA_CATEGORIES[selectedAreaId]?.color || '#C4A484'}20 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Area 7 (Calves) indicator - shown as text label when selected */}
      {selectedAreaId === 7 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 right-4 bg-[#8B7355] text-white px-3 py-2 rounded-lg text-sm shadow-lg"
        >
          <span className="font-medium">07</span>
          <span className="ml-2">{tUi('calvesArea')}</span>
        </motion.div>
      )}
    </div>
  );
};

// Treatment Area List Item Component for Botox
const BotoxTreatmentAreaListItem = ({
  area,
  index,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  area: { id: number; name: string; description: string };
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const category = BOTOX_AREA_CATEGORIES[area.id];

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        group w-full flex items-start gap-4 p-5 rounded-xl text-left
        border transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-r from-[#C4A484]/10 to-[#F9F6F3] border-[#C4A484]/40 shadow-lg shadow-[#C4A484]/10'
          : 'bg-white/80 border-transparent hover:bg-[#FDFBF9] hover:border-[#C4A484]/20'
        }
      `}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Number badge with category color */}
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
          transition-all duration-300 flex-shrink-0
          ${isSelected
            ? 'text-white shadow-md'
            : 'text-white'
          }
        `}
        style={{
          backgroundColor: isSelected ? category?.color : `${category?.color}CC`,
          boxShadow: isSelected ? `0 4px 12px ${category?.color}40` : 'none'
        }}
      >
        {String(area.id).padStart(2, '0')}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`
          font-medium text-lg transition-colors duration-300
          ${isSelected ? 'text-[#8B7355]' : 'text-[#3D3D3D] group-hover:text-[#8B7355]'}
        `}>
          {area.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {area.description}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isSelected
          ? 'bg-[#C4A484] text-white'
          : 'bg-gray-100 text-gray-400 group-hover:bg-[#C4A484]/20 group-hover:text-[#C4A484]'
        }
      `}>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  );
};

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
const PremiumMechanismIllustration = ({ label }: { label: string }) => (
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
        {label}
      </motion.text>
    </svg>
  </div>
);

// Premium Timeline with progress bars
const PremiumTimelineSection = ({ timelineData }: { timelineData: TimelineItem[] }) => {
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
  const [selectedArea, setSelectedArea] = useState<number | null>(null);

  // Translated data from messages files
  const treatmentAreasLabels = t.raw('antiaging.botox.detail.treatmentAreasLabels') as TreatmentAreasLabels;
  const treatmentAreasDescriptions = t.raw('antiaging.botox.detail.treatmentAreasDescriptions') as TreatmentAreaDescriptions;

  // Build treatment areas list with ids, names, and descriptions
  const treatmentAreasList = [
    { id: 1, key: 'forehead', name: treatmentAreasLabels.forehead, description: treatmentAreasDescriptions?.forehead || '이마 주름 완화로 밝고 젊은 인상' },
    { id: 2, key: 'glabella', name: treatmentAreasLabels.glabella, description: treatmentAreasDescriptions?.glabella || '미간 주름 개선으로 편안한 표정' },
    { id: 3, key: 'crowsFeet', name: treatmentAreasLabels.crowsFeet, description: treatmentAreasDescriptions?.crowsFeet || '눈가 잔주름 완화로 눈매 개선' },
    { id: 4, key: 'masseter', name: treatmentAreasLabels.masseter, description: treatmentAreasDescriptions?.masseter || '사각턱 근육 축소로 갸름한 얼굴형' },
    { id: 5, key: 'mouthCorners', name: treatmentAreasLabels.mouthCorners, description: treatmentAreasDescriptions?.mouthCorners || '입꼬리 처짐 개선으로 밝은 표정' },
    { id: 6, key: 'trapezius', name: treatmentAreasLabels.trapezius, description: treatmentAreasDescriptions?.trapezius || '승모근 볼륨 감소로 우아한 어깨 라인' },
    { id: 7, key: 'calves', name: treatmentAreasLabels.calves, description: treatmentAreasDescriptions?.calves || '종아리 라인 정리로 슬림한 다리' },
  ];
  const timelineItems = t.raw('antiaging.botox.detail.timeline.items') as TimelineItem[];
  const treatmentInfoLabels = t.raw('antiaging.botox.detail.treatmentInfoLabels') as {
    duration: string;
    anesthesia: string;
    recovery: string;
    results: string;
  };

  // Content data from translations (previously from constants)
  const benefitItems = t.raw('antiaging.botox.detail.benefits.items') as { title: string; desc: string }[];
  const processItems = t.raw('antiaging.botox.detail.process.items') as { step: number; title: string; desc: string }[];
  const targetAreasItems = t.raw('antiaging.botox.detail.targetAreasItems') as string[];
  const idealForItems = t.raw('antiaging.botox.detail.idealFor.items') as string[];
  const cautionItems = t.raw('antiaging.botox.detail.cautions.items') as string[];
  const faqItems = t.raw('antiaging.botox.detail.faqs.items') as { q: string; shortA: string; a: string }[];
  const treatmentValues = t.raw('antiaging.botox.detail.treatmentValues') as {
    duration: string;
    anesthesia: string;
    recovery: string;
    results: string;
  };

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
      description: t('antiaging.botox.detail.targetAreasDescription'),
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
    mechanismLabel: t('antiaging.botox.detail.mechanismLabel'),
    // Basic info from translations
    name: t('antiaging.botox.name'),
    fullName: t('antiaging.botox.fullName'),
    description: t('antiaging.botox.description'),
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
      <section className="relative min-h-screen-dvh flex items-center">
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
                  {detail.hero.badge}
                </span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-extralight text-[#3D3D3D] leading-tight mb-6">
                {detail.name}
              </h1>

              <p className="text-xl font-light text-[#C4A484] mb-8 tracking-wide">
                {detail.fullName}
              </p>

              <p className="text-gray-600 leading-relaxed max-w-md font-light text-lg">
                {detail.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              {/* Hero Image - object-contain으로 이미지 전체 표시 */}
              <div className="relative flex items-center justify-center">
                {/* 배경 장식 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C4A484]/5 to-[#D4A5A5]/5 rounded-[2rem] blur-xl scale-110" />

                {/* 이미지 컨테이너 - 이미지가 잘리지 않도록 contain 사용 */}
                <div className="relative bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-2xl shadow-[#C4A484]/20">
                  <Image
                    src="/images/Gemini_Generated_Image_7od8k07od8k07od8.png"
                    alt={`${detail.name} - ${detail.description}`}
                    width={600}
                    height={450}
                    className="w-full h-auto object-contain max-h-[500px] rounded-xl"
                    quality={95}
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="botox" />

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
            {benefitItems.map((benefit, index) => (
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

      {/* Treatment Areas - 3-Column Interactive Layout */}
      <section className="py-32 bg-gradient-to-b from-white to-[#F9F6F3] relative overflow-hidden">
        <FloatingOrb className="w-80 h-80 bg-[#C4A484]/5 -right-20 top-20" delay={1} />
        <FloatingOrb className="w-64 h-64 bg-[#D4A5A5]/5 -left-16 bottom-40" delay={3} />

        <div className="container mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C4A484]" />
              <span className="text-xs tracking-[0.3em] text-[#C4A484] uppercase">Treatment Areas</span>
              <div className="w-8 h-px bg-[#C4A484]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3D3D3D] mb-6">
              {t('common.targetAreas')}
            </h2>
            <p className="text-gray-600 font-light max-w-2xl mx-auto text-lg leading-relaxed">
              {detail.targetAreas.description}
            </p>
          </motion.div>

          {/* Category Legend - Centered above layout */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#E8D5C4]/30 max-w-md mx-auto">
            <span className="text-xs text-gray-500 mr-2">{t('antiaging.botox.ui.category')}</span>
            <span className="flex items-center gap-2 text-xs text-[#E8B4B8]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8B4B8]" />
              {t('antiaging.botox.ui.expressionWrinkles')}
            </span>
            <span className="flex items-center gap-2 text-xs text-[#C4A484]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C4A484]" />
              {t('antiaging.botox.ui.contouring')}
            </span>
            <span className="flex items-center gap-2 text-xs text-[#8B7355]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B7355]" />
              {t('antiaging.botox.ui.body')}
            </span>
          </div>

          {/* 3-Column Layout: Left List (01-04) | Center Image | Right List (05-07) */}
          {/* Desktop: 3-column | Tablet: 2-column stacked lists + image | Mobile: 1-column */}
          <div className="max-w-7xl mx-auto">
            {/* Desktop 3-Column Layout (1280px+) */}
            <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] gap-8 items-start">
              {/* Left Column: Areas 01-04 */}
              <div className="space-y-3">
                {treatmentAreasList.slice(0, 4).map((area, index) => (
                  <BotoxTreatmentAreaListItem
                    key={area.id}
                    area={area}
                    index={index}
                    isSelected={selectedArea === area.id}
                    onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                    onMouseEnter={() => setSelectedArea(area.id)}
                    onMouseLeave={() => setSelectedArea(null)}
                  />
                ))}
              </div>

              {/* Center Column: Image with Interactive Markers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="sticky top-32"
              >
                <BotoxImageWithMarkers selectedAreaId={selectedArea} />

                {/* Selected area info card */}
                {selectedArea && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#C4A484]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: BOTOX_AREA_CATEGORIES[selectedArea]?.color || '#C4A484' }}
                      >
                        {String(selectedArea).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-medium text-[#3D3D3D]">
                          {treatmentAreasList.find(a => a.id === selectedArea)?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {treatmentAreasList.find(a => a.id === selectedArea)?.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Right Column: Areas 05-07 */}
              <div className="space-y-3">
                {treatmentAreasList.slice(4, 7).map((area, index) => (
                  <BotoxTreatmentAreaListItem
                    key={area.id}
                    area={area}
                    index={index + 4}
                    isSelected={selectedArea === area.id}
                    onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                    onMouseEnter={() => setSelectedArea(area.id)}
                    onMouseLeave={() => setSelectedArea(null)}
                  />
                ))}
              </div>
            </div>

            {/* Tablet 2-Column Layout (768px - 1279px) */}
            <div className="hidden md:grid md:grid-cols-2 xl:hidden gap-8 items-start">
              {/* Left: Lists stacked vertically */}
              <div className="space-y-3">
                {treatmentAreasList.map((area, index) => (
                  <BotoxTreatmentAreaListItem
                    key={area.id}
                    area={area}
                    index={index}
                    isSelected={selectedArea === area.id}
                    onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                    onMouseEnter={() => setSelectedArea(area.id)}
                    onMouseLeave={() => setSelectedArea(null)}
                  />
                ))}
              </div>

              {/* Right: Image */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="sticky top-32"
              >
                <BotoxImageWithMarkers selectedAreaId={selectedArea} />

                {selectedArea && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#C4A484]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: BOTOX_AREA_CATEGORIES[selectedArea]?.color || '#C4A484' }}
                      >
                        {String(selectedArea).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-medium text-[#3D3D3D]">
                          {treatmentAreasList.find(a => a.id === selectedArea)?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {treatmentAreasList.find(a => a.id === selectedArea)?.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Mobile 1-Column Layout (< 768px) */}
            <div className="md:hidden space-y-6">
              {/* Image on top */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <BotoxImageWithMarkers selectedAreaId={selectedArea} />

                {selectedArea && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#C4A484]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: BOTOX_AREA_CATEGORIES[selectedArea]?.color || '#C4A484' }}
                      >
                        {String(selectedArea).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-medium text-[#3D3D3D]">
                          {treatmentAreasList.find(a => a.id === selectedArea)?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {treatmentAreasList.find(a => a.id === selectedArea)?.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* List below */}
              <div className="space-y-3">
                {treatmentAreasList.map((area, index) => (
                  <BotoxTreatmentAreaListItem
                    key={area.id}
                    area={area}
                    index={index}
                    isSelected={selectedArea === area.id}
                    onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                    onMouseEnter={() => setSelectedArea(area.id)}
                    onMouseLeave={() => setSelectedArea(null)}
                  />
                ))}
              </div>
            </div>

            {/* Hint text */}
            <p className="text-xs text-gray-400 text-center pt-8">
              {t('antiaging.botox.ui.interactionHint')}
            </p>
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

          <PremiumTimelineSection timelineData={timelineItems} />
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
            {processItems.map((step, index) => (
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
                  {index < processItems.length - 1 && (
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
              { label: treatmentInfoLabels.duration, value: treatmentValues.duration },
              { label: treatmentInfoLabels.anesthesia, value: treatmentValues.anesthesia },
              { label: treatmentInfoLabels.recovery, value: treatmentValues.recovery },
              { label: treatmentInfoLabels.results, value: treatmentValues.results },
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
            {idealForItems.map((item, index) => (
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
            {faqItems.map((faq, index) => (
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
                {cautionItems.map((caution, index) => (
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
