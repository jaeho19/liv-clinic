'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { TREATMENTS } from '@/lib/constants';
import { AnimateOnScroll, Card, PriceTable, Breadcrumb } from '@/components/ui';
import { getLocalizedTreatment, getRelatedTreatmentLabel } from '@/lib/treatmentsI18n';
import { useLocalizedMedicalQA } from '@/hooks/useLocalizedMedicalQA';
import InternationalNotice from './InternationalNotice';

// TypeScript interfaces for translations
interface BenefitItem {
  title: string;
  desc: string;
}

interface ProcessItem {
  step: number;
  title: string;
  desc: string;
}

interface FaqItem {
  q: string;
  shortA: string;
  a: string;
}

interface TreatmentValues {
  duration: string;
  anesthesia: string;
  recovery: string;
  results: string;
}

// Premium color palette - Champagne Rose
const colors = {
  primary: '#A89080',
  secondary: '#6D5A4D',
  accent: '#D4C4B8',
  dark: '#3A3A3A',
  light: '#FAF8F6',
  rose: '#C9A99A',
  gold: '#C9A86C',
};

// ========================================================================
// 시술 부위 포인트 마커 데이터 구조
// ========================================================================
//
// 📐 좌표 설계 원칙:
// - viewBox: 0 0 100 100 (퍼센트 기반)
// - 이미지 비율: 520x650 (가로:세로 ≈ 0.8:1)
// - preserveAspectRatio="none" 사용으로 이미지와 1:1 매핑
// - 각 시술 부위에 작은 원형 포인트 마커 하나만 표시
// - 마커 반지름: 전체 폭 대비 2-3% (r ≈ 2-3)
//
// ========================================================================

/** 시술 부위 포인트 타입 정의 */
interface TreatmentPoint {
  /** 고유 식별자 (1-10) */
  id: number;
  /** 한글 라벨 */
  labelKo: string;
  /** 표시 번호 (01-10) */
  number: string;
  /** X 좌표 (0-100%, viewBox 기준) */
  x: number;
  /** Y 좌표 (0-100%, viewBox 기준) */
  y: number;
  /** 마커 반지름 (viewBox 기준, 기본 2.5) */
  radius: number;
  /** 카테고리 (주름/볼륨/윤곽/리프트) */
  category: 'wrinkle' | 'volume' | 'contour' | 'lift';
  /** 카테고리 색상 */
  color: string;
  /** 짧은 설명 */
  description: string;
}

/** 카테고리별 색상 정의 */
const CATEGORY_COLORS = {
  wrinkle: '#D4A5A5',  // 분홍색 - 주름 개선
  volume: '#A89080',   // 베이지색 - 볼륨 주입
  contour: '#6D5A4D',  // 갈색 - 윤곽 성형
  lift: '#C9A86C',     // 골드색 - 리프팅
} as const;

/**
 * 시술 부위 포인트 데이터
 * - 이미지의 실제 마커 위치 기준 좌표
 * - 각 포인트는 해당 시술의 대표 주사 위치
 */
const TREATMENT_POINTS: TreatmentPoint[] = [
  {
    id: 1,
    labelKo: '이마',
    number: '01',
    x: 40,      // 이마 중앙 (왼쪽으로 이동)
    y: 23,      // 헤어라인 아래 (아래로 이동)
    radius: 2.5,
    category: 'wrinkle',
    color: CATEGORY_COLORS.wrinkle,
    description: '이마 주름 개선',
  },
  {
    id: 2,
    labelKo: '관자놀이',
    number: '02',
    x: 69,      // 오른쪽 관자놀이 (왼쪽으로 이동)
    y: 35,      // (아래로 이동)
    radius: 2.5,
    category: 'volume',
    color: CATEGORY_COLORS.volume,
    description: '볼륨 손실 복원',
  },
  {
    id: 3,
    labelKo: '코',
    number: '03',
    x: 40,      // 콧대 중앙 (왼쪽으로 이동)
    y: 48,      // (아래로 이동)
    radius: 2.5,
    category: 'contour',
    color: CATEGORY_COLORS.contour,
    description: '콧대/코끝 성형',
  },
  {
    id: 4,
    labelKo: '앞광대',
    number: '04',
    x: 25,      // 왼쪽 광대 (왼쪽으로 이동)
    y: 50,      // (아래로 이동)
    radius: 2.5,
    category: 'volume',
    color: CATEGORY_COLORS.volume,
    description: '광대뼈 볼륨',
  },
  {
    id: 5,
    labelKo: '팔자',
    number: '05',
    x: 29,      // 왼쪽 팔자 상단 (왼쪽으로 이동)
    y: 60,      // (아래로 이동)
    radius: 2.5,
    category: 'wrinkle',
    color: CATEGORY_COLORS.wrinkle,
    description: '팔자주름 개선',
  },
  {
    id: 6,
    labelKo: '옆볼',
    number: '06',
    x: 66,      // 오른쪽 볼 (왼쪽으로 이동)
    y: 58,      // (아래로 이동)
    radius: 2.5,
    category: 'volume',
    color: CATEGORY_COLORS.volume,
    description: '볼 처짐 개선',
  },
  {
    id: 7,
    labelKo: '턱끝',
    number: '07',
    x: 40,      // 턱 중앙 (왼쪽으로 이동)
    y: 79,      // (아래로 이동)
    radius: 2.5,
    category: 'contour',
    color: CATEGORY_COLORS.contour,
    description: '턱 볼륨 형성',
  },
  {
    id: 8,
    labelKo: '애교살',
    number: '08',
    x: 53,      // 오른쪽 눈 아래 (왼쪽으로 이동)
    y: 43,      // (아래로 이동)
    radius: 2.5,
    category: 'volume',
    color: CATEGORY_COLORS.volume,
    description: '눈 밑 볼륨',
  },
  {
    id: 9,
    labelKo: '입술',
    number: '09',
    x: 40,      // 입술 중앙 (왼쪽으로 이동)
    y: 67,      // (아래로 이동)
    radius: 2.5,
    category: 'volume',
    color: CATEGORY_COLORS.volume,
    description: '입술 볼륨',
  },
  {
    id: 10,
    labelKo: '눈썹',
    number: '10',
    x: 24,      // 왼쪽 눈썹 위 (왼쪽으로 이동)
    y: 34,      // (아래로 이동)
    radius: 2.5,
    category: 'lift',
    color: CATEGORY_COLORS.lift,
    description: '눈썹 리프트',
  },
];

/** 포인트 ID로 데이터 조회 */
const getPointData = (id: number): TreatmentPoint | undefined => {
  return TREATMENT_POINTS.find(point => point.id === id);
};

// ========================================================================
// 바디 필러 포인트 마커 데이터
// ========================================================================

/** 바디 필러 시술 부위 포인트 데이터 (번역 파일 순서: 어깨→힙→골반→힙딥) */
const BODY_TREATMENT_POINTS: TreatmentPoint[] = [
  {
    id: 1,
    labelKo: '어깨',
    number: '01',
    x: 67,      // 오른쪽 어깨 (왼쪽으로 조금 이동)
    y: 18,
    radius: 4,
    category: 'volume',
    color: '#C9A86C',
    description: '어깨 볼륨',
  },
  {
    id: 2,
    labelKo: '힙',
    number: '02',
    x: 33,      // 왼쪽 엉덩이 (오른쪽으로 조금 이동)
    y: 70,
    radius: 4,
    category: 'volume',
    color: '#C9A86C',
    description: '힙 볼륨',
  },
  {
    id: 3,
    labelKo: '골반',
    number: '03',
    x: 65,      // 오른쪽 골반
    y: 62,      // 조금 아래로
    radius: 4,
    category: 'contour',
    color: '#C9A86C',
    description: '골반 윤곽',
  },
  {
    id: 4,
    labelKo: '힙딥',
    number: '04',
    x: 62,      // 오른쪽 힙딥
    y: 76,      // 조금 아래로
    radius: 4,
    category: 'volume',
    color: '#C9A86C',
    description: '힙딥 볼륨',
  },
];

/** 바디 포인트 ID로 데이터 조회 */
const getBodyPointData = (id: number): TreatmentPoint | undefined => {
  return BODY_TREATMENT_POINTS.find(point => point.id === id);
};

// Category colors for treatment areas (for backward compatibility)
const AREA_CATEGORIES: Record<number, { type: 'wrinkle' | 'volume' | 'contour' | 'lift'; color: string }> = {
  1: { type: 'wrinkle', color: '#D4A5A5' },
  2: { type: 'volume', color: '#A89080' },
  3: { type: 'contour', color: '#6D5A4D' },
  4: { type: 'volume', color: '#A89080' },
  5: { type: 'wrinkle', color: '#D4A5A5' },
  6: { type: 'volume', color: '#A89080' },
  7: { type: 'contour', color: '#6D5A4D' },
  8: { type: 'volume', color: '#A89080' },
  9: { type: 'volume', color: '#A89080' },
  10: { type: 'lift', color: '#C9A86C' },
};

/**
 * 단순 원형 포인트 마커 컴포넌트
 * - 선택된 상태에서만 표시 (펄스 애니메이션)
 */
const PointMarker = ({
  point,
  isSelected,
}: {
  point: TreatmentPoint;
  isSelected: boolean;
}) => {
  const selectedRadius = point.radius * 1.4; // 선택 시 40% 확대

  // 선택되지 않은 상태에서는 아무것도 렌더링하지 않음
  if (!isSelected) return null;

  return (
    <g>
      {/* 외부 펄스 효과 */}
      <motion.circle
        cx={point.x}
        cy={point.y}
        r={selectedRadius * 2}
        fill={point.color}
        fillOpacity={0.15}
        initial={{ scale: 1, opacity: 0.2 }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 중간 글로우 */}
      <motion.circle
        cx={point.x}
        cy={point.y}
        r={selectedRadius * 1.5}
        fill={point.color}
        fillOpacity={0.25}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 0.2 }}
      />

      {/* 메인 원형 마커 */}
      <motion.circle
        cx={point.x}
        cy={point.y}
        r={selectedRadius}
        fill={point.color}
        fillOpacity={0.9}
        stroke={point.color}
        strokeWidth={0.8}
        initial={{ scale: 0 }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 중앙 흰색 점 */}
      <motion.circle
        cx={point.x}
        cy={point.y}
        r={selectedRadius * 0.35}
        fill="white"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      />
    </g>
  );
};

/**
 * 인터랙티브 이미지 컴포넌트 - 포인트 마커 방식
 * - 선택된 포인트만 표시 (컬러 채움 + 펄스 애니메이션)
 */
const FillerImageWithMarkers = ({
  selectedAreaId,
}: {
  selectedAreaId: number | null;
}) => {
  const tUi = useTranslations('treatments.antiaging.filler.ui');
  const selectedPoint = selectedAreaId ? getPointData(selectedAreaId) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#A89080]/20 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Base Image */}
      <Image
        src="/images/Gemini_Generated_Image_c8gix4c8gix4c8gi.png"
        alt={tUi('imageAlt')}
        width={520}
        height={650}
        className="w-full h-auto"
        quality={95}
        priority
      />

      {/* SVG Overlay - 선택된 포인트 마커만 표시 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ mixBlendMode: 'normal' }}
      >
        <defs>
          {/* 마커 글로우 필터 */}
          <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 선택된 포인트 마커만 렌더링 */}
        <g filter="url(#markerGlow)">
          {TREATMENT_POINTS.map((point) => (
            <PointMarker
              key={point.id}
              point={point}
              isSelected={selectedAreaId === point.id}
            />
          ))}
        </g>
      </svg>

      {/* 선택된 부위 번호 표시 (우상단) */}
      {selectedPoint && (
        <motion.div
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{
              backgroundColor: selectedPoint.color,
              boxShadow: `0 4px 20px ${selectedPoint.color}60`,
            }}
          >
            {selectedPoint.number}
          </div>
        </motion.div>
      )}

      {/* 미세한 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#A89080]/5 to-transparent pointer-events-none" />
    </div>
  );
};

/**
 * 바디 필러 이미지 컴포넌트 - 포인트 마커 방식
 * - 선택된 포인트만 표시 (컬러 채움 + 펄스 애니메이션)
 */
const BodyFillerImageWithMarkers = ({
  selectedAreaId,
  imageAlt,
}: {
  selectedAreaId: number | null;
  imageAlt: string;
}) => {
  const selectedPoint = selectedAreaId ? getBodyPointData(selectedAreaId) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#C9A86C]/15 bg-gradient-to-b from-[#FAF8F6] to-white">
      {/* Base Image */}
      <Image
        src="/images/Gemini_Generated_Image_wdfux9wdfux9wdfu.png"
        alt={imageAlt}
        width={600}
        height={800}
        className="w-full h-auto"
        quality={95}
      />

      {/* SVG Overlay - 선택된 포인트 마커만 표시 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ mixBlendMode: 'normal' }}
      >
        <defs>
          {/* 마커 글로우 필터 */}
          <filter id="bodyMarkerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 선택된 포인트 마커만 렌더링 */}
        <g filter="url(#bodyMarkerGlow)">
          {BODY_TREATMENT_POINTS.map((point) => (
            <PointMarker
              key={point.id}
              point={point}
              isSelected={selectedAreaId === point.id}
            />
          ))}
        </g>
      </svg>

      {/* 선택된 부위 번호 표시 (우상단) */}
      {selectedPoint && (
        <motion.div
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{
              backgroundColor: selectedPoint.color,
              boxShadow: `0 4px 20px ${selectedPoint.color}60`,
            }}
          >
            {selectedPoint.number}
          </div>
        </motion.div>
      )}

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#C9A86C]/5 to-transparent pointer-events-none" />
    </div>
  );
};

// Treatment Area List Item Component - Compact version for 3-column layout
const TreatmentAreaListItem = ({
  area,
  index,
  isSelected,
  onClick,
  side = 'left',
}: {
  area: { id: number; name: string; description: string };
  index: number;
  isSelected: boolean;
  onClick: () => void;
  side?: 'left' | 'right';
}) => {
  const category = AREA_CATEGORIES[area.id];

  return (
    <motion.button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 p-4 rounded-xl text-left
        border transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-r from-[#A89080]/15 to-[#FAF8F6] border-[#A89080]/50 shadow-lg shadow-[#A89080]/15'
          : 'bg-white/80 border-transparent hover:bg-[#FAF8F6] hover:border-[#A89080]/20'
        }
        ${side === 'right' ? 'flex-row-reverse text-right' : ''}
      `}
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: side === 'left' ? 4 : -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Number badge with category color */}
      <div
        className={`
          w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold
          transition-all duration-300 flex-shrink-0
          text-white
        `}
        style={{
          backgroundColor: isSelected ? category?.color : `${category?.color}CC`,
          boxShadow: isSelected ? `0 4px 12px ${category?.color}50` : 'none',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {String(area.id).padStart(2, '0')}
      </div>

      {/* Content - compact */}
      <div className="flex-1 min-w-0">
        <h3 className={`
          font-medium text-base transition-colors duration-300 leading-tight
          ${isSelected ? 'text-[#6D5A4D]' : 'text-[#3A3A3A] group-hover:text-[#6D5A4D]'}
        `}>
          {area.name}
        </h3>
        <p className={`text-xs text-gray-400 mt-0.5 line-clamp-1 ${side === 'right' ? 'text-right' : ''}`}>
          {area.description}
        </p>
      </div>

      {/* Selection indicator line */}
      <div
        className={`
          w-0.5 h-8 rounded-full transition-all duration-300 flex-shrink-0
          ${isSelected ? 'bg-[#A89080]' : 'bg-transparent group-hover:bg-[#A89080]/30'}
        `}
        style={{ order: side === 'right' ? -1 : 1 }}
      />
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

// Premium Volume Illustration
const PremiumVolumeIllustration = ({ label }: { label: string }) => (
  <div className="relative w-full max-w-md mx-auto">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <linearGradient id="fillerPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
          <stop offset="50%" stopColor={colors.primary} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.rose} stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="fillerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.gold} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
        </linearGradient>

        <radialGradient id="fillerGlowEffect" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>

        <filter id="fillerPremiumShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={colors.secondary} floodOpacity="0.2" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={colors.primary} floodOpacity="0.1" />
        </filter>

        <filter id="fillerPulseGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <motion.circle
        cx="200"
        cy="200"
        r="180"
        fill="none"
        stroke="url(#fillerGoldGrad)"
        strokeWidth="0.5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      <circle cx="200" cy="200" r="160" fill={colors.light} fillOpacity="0.5" />

      {/* Face silhouette */}
      <motion.path
        d="M200 60
           C140 60 100 120 100 180
           C100 260 140 320 200 340
           C260 320 300 260 300 180
           C300 120 260 60 200 60"
        fill="none"
        stroke={colors.accent}
        strokeWidth="2"
        filter="url(#fillerPremiumShadow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Volume areas with premium glow */}
      {[
        { cx: 155, cy: 195, rx: 30, ry: 22, delay: 1.5, label: 'Cheek L' },
        { cx: 245, cy: 195, rx: 30, ry: 22, delay: 1.7, label: 'Cheek R' },
        { cx: 200, cy: 295, rx: 28, ry: 12, delay: 1.9, label: 'Lips' },
      ].map((area, i) => (
        <motion.g key={i}>
          {/* Outer glow */}
          <motion.ellipse
            cx={area.cx}
            cy={area.cy}
            rx={area.rx + 10}
            ry={area.ry + 8}
            fill="url(#fillerGlowEffect)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{
              duration: 4,
              delay: area.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          {/* Volume shape */}
          <motion.ellipse
            cx={area.cx}
            cy={area.cy}
            rx={area.rx}
            ry={area.ry}
            fill="url(#fillerPremiumGrad)"
            filter="url(#fillerPremiumShadow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ delay: area.delay, duration: 0.8 }}
          />
          {/* Center point */}
          <motion.circle
            cx={area.cx}
            cy={area.cy}
            r="5"
            fill={colors.primary}
            filter="url(#fillerPulseGlow)"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{
              duration: 2,
              delay: area.delay + 0.3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.g>
      ))}

      {/* Nasolabial fold lines */}
      <motion.path
        d="M165 210 Q160 240 170 270"
        stroke={colors.rose}
        strokeWidth="1"
        strokeDasharray="4 4"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
      />
      <motion.path
        d="M235 210 Q240 240 230 270"
        stroke={colors.rose}
        strokeWidth="1"
        strokeDasharray="4 4"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
      />

      {/* Premium label */}
      <motion.text
        x="200"
        y="370"
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

// Premium Filler Types Section
interface FillerTypesProps {
  types: Array<{
    type: string;
    areas: string;
    desc: string;
    level: number;
  }>;
}

const PremiumFillerTypesSection = ({ types }: FillerTypesProps) => (
  <div className="grid md:grid-cols-3 gap-8">
    {types.map((filler, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.15 }}
        whileHover={{ y: -8 }}
        className="group relative text-center p-8 bg-gradient-to-br from-white to-[#FAF8F6] border border-gray-100 rounded-2xl hover:border-[#A89080]/30 transition-all duration-500"
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#A89080]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

        {/* Density indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((dot) => (
            <motion.div
              key={dot}
              className={`w-3 h-3 rounded-full transition-all ${
                dot <= filler.level
                  ? 'bg-gradient-to-br from-[#A89080] to-[#C9A99A]'
                  : 'bg-[#E8E4E0]'
              }`}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 + dot * 0.1 }}
            />
          ))}
        </div>

        {/* Number circle */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#A89080]/20 to-[#C9A99A]/10" />
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
            <span className="text-3xl font-extralight text-[#6D5A4D]">0{i + 1}</span>
          </div>
        </div>

        <h3 className="relative text-xl font-light tracking-wide text-[#3A3A3A] mb-3">{filler.type}</h3>
        <p className="relative text-sm text-[#A89080] mb-2">{filler.areas}</p>
        <p className="relative text-xs text-gray-400">{filler.desc}</p>
      </motion.div>
    ))}
  </div>
);

export default function FillerDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const treatment = getLocalizedTreatment(TREATMENTS.antiaging.filler, 'filler', locale);
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedBodyArea, setSelectedBodyArea] = useState<number | null>(null);

  // Load translation data using t.raw() for arrays
  const benefitItems = t.raw('antiaging.filler.detail.benefits.items') as BenefitItem[];
  const processItems = t.raw('antiaging.filler.detail.process.items') as ProcessItem[];
  const idealForItems = t.raw('antiaging.filler.detail.idealFor.items') as string[];
  const cautionItems = t.raw('antiaging.filler.detail.cautions.items') as string[];
  const faqItems = t.raw('antiaging.filler.detail.faqs.items') as FaqItem[];
  const treatmentValues = t.raw('antiaging.filler.detail.treatmentValues') as TreatmentValues;

  // Fetch all translation keys for this detail page
  const detail = {
    hero: {
      badge: t('antiaging.filler.detail.hero.badge'),
      title: t('antiaging.filler.detail.hero.title'),
      description: t('antiaging.filler.detail.hero.description'),
    },
    name: t('antiaging.filler.name'),
    nameEn: t('antiaging.filler.fullName'),
    tagline: t('antiaging.filler.tagline'),
    description: t('antiaging.filler.description'),
    benefits: {
      title: t('antiaging.filler.detail.benefits.title'),
    },
    targetAreas: {
      title: t('antiaging.filler.detail.targetAreas.title'),
      subtitle: t('antiaging.filler.detail.targetAreas.subtitle'),
      areas: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
        id: i + 1,
        name: t(`antiaging.filler.detail.targetAreas.areas.${i}.name`),
        description: t(`antiaging.filler.detail.targetAreas.areas.${i}.description`),
      })),
    },
    bodyAreas: {
      title: t('antiaging.filler.detail.bodyAreas.title'),
      subtitle: t('antiaging.filler.detail.bodyAreas.subtitle'),
      notice: t('antiaging.filler.detail.bodyAreas.notice'),
      imageAlt: t('antiaging.filler.detail.bodyAreas.imageAlt'),
      areas: [0, 1, 2, 3].map((i) => ({
        id: i + 1,
        name: t(`antiaging.filler.detail.bodyAreas.areas.${i}.name`),
        description: t(`antiaging.filler.detail.bodyAreas.areas.${i}.description`),
        detail: t(`antiaging.filler.detail.bodyAreas.areas.${i}.detail`),
      })),
    },
    fillerTypes: {
      title: t('antiaging.filler.detail.fillerTypes.title'),
      subtitle: t('antiaging.filler.detail.fillerTypes.subtitle'),
      types: [0, 1, 2].map((i) => ({
        type: t(`antiaging.filler.detail.fillerTypes.types.${i}.type`),
        areas: t(`antiaging.filler.detail.fillerTypes.types.${i}.areas`),
        desc: t(`antiaging.filler.detail.fillerTypes.types.${i}.desc`),
        level: i + 1,
      })),
    },
    safety: {
      title: t('antiaging.filler.detail.safety.title'),
      subtitle: t('antiaging.filler.detail.safety.subtitle'),
      steps: [0, 1, 2].map((i) => ({
        step: t(`antiaging.filler.detail.safety.steps.${i}.step`),
        title: t(`antiaging.filler.detail.safety.steps.${i}.title`),
        desc: t(`antiaging.filler.detail.safety.steps.${i}.desc`),
      })),
    },
    treatmentInfo: {
      title: t('antiaging.filler.detail.treatmentInfo.title'),
      duration: t('antiaging.filler.detail.treatmentInfo.duration'),
      anesthesia: t('antiaging.filler.detail.treatmentInfo.anesthesia'),
      recovery: t('antiaging.filler.detail.treatmentInfo.recovery'),
      results: t('antiaging.filler.detail.treatmentInfo.results'),
    },
    faq: {
      title: t('antiaging.filler.detail.faq.title'),
    },
    cta: {
      title: t('antiaging.filler.detail.cta.title'),
      description: t('antiaging.filler.detail.cta.description'),
    },
    volumeIllustrationLabel: t('antiaging.filler.detail.volumeIllustrationLabel'),
    heroImageAlt: t('antiaging.filler.detail.heroImageAlt'),
  };

  const medicalQA = useLocalizedMedicalQA();
  const relatedMedicalQA = medicalQA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'filler')
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
    <main className="bg-white overflow-hidden">
      <Breadcrumb items={[{ navKey: 'antiaging', href: '/antiaging' }, { navKey: 'filler' }]} />

      {/* Hero Section - Premium Design */}
      <section className="relative min-h-screen-dvh flex items-center justify-center overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF8F6] via-white to-[#F5F0EB]" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#A89080]/5" />
        </div>

        {/* Floating orbs */}
        <FloatingOrb className="w-96 h-96 bg-[#A89080]/10 top-20 right-20" delay={0} />
        <FloatingOrb className="w-72 h-72 bg-[#C9A99A]/10 bottom-40 left-10" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-[#D4C4B8]/20 top-1/3 left-1/4" delay={4} />

        <div className="container mx-auto px-6 lg:px-12 py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              {/* Premium label */}
              <motion.div
                className="flex items-center gap-4 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-12 h-px bg-gradient-to-r from-[#A89080] to-transparent" />
                <span className="text-xs tracking-[0.4em] text-[#A89080] uppercase">
                  Anti-Aging Treatment
                </span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-extralight text-[#3A3A3A] leading-tight mb-6">
                {detail.name}
              </h1>

              <p className="text-xl font-light text-[#A89080] mb-4 tracking-wide">
                {detail.nameEn}
              </p>

              <p className="text-lg text-gray-500 mb-4 font-light leading-relaxed">
                {detail.tagline}
              </p>

              <p className="text-gray-400 leading-relaxed max-w-md font-light text-lg">
                {detail.description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              {/* Hero Image */}
              <div className="relative aspect-[4/5] max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-[#A89080]/20">
                <Image
                  src="/images/filler-hero-new.png"
                  alt={detail.heroImageAlt}
                  fill
                  className="object-cover"
                  quality={95}
                  priority
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#A89080]/10 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="filler" />

      {/* Benefits Section - Premium Cards */}
      <section className="py-32 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A89080]/30 to-transparent" />

        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Benefits</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {detail.benefits.title}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefitItems.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 bg-gradient-to-br from-[#FAF8F6] to-white border border-gray-100 rounded-xl hover:border-[#A89080]/30 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#A89080]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#A89080]/20 to-[#C9A99A]/10" />
                  <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                    <span className="text-xl font-light text-[#A89080]">0{index + 1}</span>
                  </div>
                </div>

                <h3 className="relative text-lg font-light text-[#3A3A3A] mb-3 group-hover:text-[#A89080] transition-colors">
                  {benefit.title}
                </h3>
                <p className="relative text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Areas - 3-Column Interactive Layout (5 + Image + 5) */}
      <section className="py-32 bg-gradient-to-b from-white to-[#FAF8F6] relative overflow-hidden">
        <FloatingOrb className="w-80 h-80 bg-[#A89080]/5 -right-20 top-20" delay={1} />
        <FloatingOrb className="w-64 h-64 bg-[#C9A99A]/5 -left-16 bottom-40" delay={3} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 lg:mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Treatment Areas</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-6">
              {t('common.targetAreas')}
            </h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-lg leading-relaxed">
              {detail.targetAreas.subtitle}
            </p>

            {/* Category Legend - centered */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#D4C4B8]/30 max-w-xl mx-auto">
              <span className="flex items-center gap-2 text-xs text-[#D4A5A5]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4A5A5]" />
                {t('antiaging.filler.ui.wrinkles')}
              </span>
              <span className="flex items-center gap-2 text-xs text-[#A89080]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A89080]" />
                {t('antiaging.filler.ui.volume')}
              </span>
              <span className="flex items-center gap-2 text-xs text-[#6D5A4D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D5A4D]" />
                {t('antiaging.filler.ui.contour')}
              </span>
              <span className="flex items-center gap-2 text-xs text-[#C9A86C]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A86C]" />
                {t('antiaging.filler.ui.lifting')}
              </span>
            </div>
          </motion.div>

          {/* 3-Column Layout: Left (1-5) + Center Image + Right (6-10) */}
          {/* Desktop: 3-column grid */}
          <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] gap-6 xl:gap-8 items-start max-w-7xl mx-auto">
            {/* Left Column: Items 1-5 */}
            <div className="space-y-3 pt-4">
              {detail.targetAreas.areas.slice(0, 5).map((area, index) => (
                <TreatmentAreaListItem
                  key={area.id}
                  area={area}
                  index={index}
                  isSelected={selectedArea === area.id}
                  onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                  side="left"
                />
              ))}
            </div>

            {/* Center: Image with SVG Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="w-[380px] xl:w-[420px] flex-shrink-0"
            >
              <FillerImageWithMarkers selectedAreaId={selectedArea}  />

              {/* Selected area info card */}
              {selectedArea && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#A89080]/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                      style={{
                        backgroundColor: AREA_CATEGORIES[selectedArea]?.color || '#A89080',
                        boxShadow: `0 4px 12px ${AREA_CATEGORIES[selectedArea]?.color || '#A89080'}40`,
                      }}
                    >
                      {String(selectedArea).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="font-medium text-[#3A3A3A]">
                        {detail.targetAreas.areas.find(a => a.id === selectedArea)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {detail.targetAreas.areas.find(a => a.id === selectedArea)?.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Hint text */}
              <p className="text-xs text-gray-400 text-center mt-4">
                {t('antiaging.filler.ui.interactionHint')}
              </p>
            </motion.div>

            {/* Right Column: Items 6-10 */}
            <div className="space-y-3 pt-4">
              {detail.targetAreas.areas.slice(5, 10).map((area, index) => (
                <TreatmentAreaListItem
                  key={area.id}
                  area={area}
                  index={index + 5}
                  isSelected={selectedArea === area.id}
                  onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                  side="right"
                />
              ))}
            </div>
          </div>

          {/* Tablet: 2-column layout (image + list) */}
          <div className="hidden lg:grid lg:grid-cols-2 xl:hidden gap-8 items-start max-w-5xl mx-auto">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-32"
            >
              <FillerImageWithMarkers selectedAreaId={selectedArea}  />

              {/* Selected area info card */}
              {selectedArea && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#A89080]/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: AREA_CATEGORIES[selectedArea]?.color || '#A89080' }}
                    >
                      {String(selectedArea).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="font-medium text-[#3A3A3A]">
                        {detail.targetAreas.areas.find(a => a.id === selectedArea)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {detail.targetAreas.areas.find(a => a.id === selectedArea)?.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right: Full list */}
            <div className="space-y-3">
              {detail.targetAreas.areas.map((area, index) => (
                <TreatmentAreaListItem
                  key={area.id}
                  area={area}
                  index={index}
                  isSelected={selectedArea === area.id}
                  onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                  side="left"
                />
              ))}
              <p className="text-xs text-gray-400 text-center pt-4">
                {t('antiaging.filler.ui.interactionHint')}
              </p>
            </div>
          </div>

          {/* Mobile: 1-column layout (image on top, list below) */}
          <div className="lg:hidden max-w-md mx-auto">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <FillerImageWithMarkers selectedAreaId={selectedArea}  />

              {/* Selected area info card */}
              {selectedArea && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#A89080]/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: AREA_CATEGORIES[selectedArea]?.color || '#A89080' }}
                    >
                      {String(selectedArea).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="font-medium text-[#3A3A3A]">
                        {detail.targetAreas.areas.find(a => a.id === selectedArea)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {detail.targetAreas.areas.find(a => a.id === selectedArea)?.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* List - 2 columns on mobile for compactness */}
            <div className="grid grid-cols-2 gap-3">
              {detail.targetAreas.areas.map((area, index) => (
                <TreatmentAreaListItem
                  key={area.id}
                  area={area}
                  index={index}
                  isSelected={selectedArea === area.id}
                  onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                  side={index < 5 ? 'left' : 'left'}
                />
              ))}
            </div>

            {/* Hint text */}
            <p className="text-xs text-gray-400 text-center mt-6">
              {t('antiaging.filler.ui.interactionHint')}
            </p>
          </div>
        </div>
      </section>

      {/* Body Filler Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A89080]/20 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 lg:mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#C9A86C]" />
              <span className="text-xs tracking-[0.3em] text-[#C9A86C] uppercase">Body Filler</span>
              <div className="w-8 h-px bg-[#C9A86C]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-4">
              {detail.bodyAreas.title}
            </h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-lg leading-relaxed">
              {detail.bodyAreas.subtitle}
            </p>
          </motion.div>

          {/* Body Filler - 2 Column Layout (Image + Cards) */}
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: Image with Markers */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="lg:sticky lg:top-32"
              >
                <BodyFillerImageWithMarkers
                  selectedAreaId={selectedBodyArea}
                  imageAlt={detail.bodyAreas.imageAlt}
                />

                {/* Selected area info card */}
                {selectedBodyArea && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-[#C9A86C]/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                        style={{
                          backgroundColor: '#C9A86C',
                          boxShadow: '0 4px 12px rgba(201, 168, 108, 0.4)',
                        }}
                      >
                        {String(selectedBodyArea).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-medium text-[#3A3A3A]">
                          {detail.bodyAreas.areas.find(a => a.id === selectedBodyArea)?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {detail.bodyAreas.areas.find(a => a.id === selectedBodyArea)?.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Hint text */}
                <p className="text-xs text-gray-400 text-center mt-4">
                  {t('antiaging.filler.ui.interactionHint')}
                </p>
              </motion.div>

              {/* Right: Cards List */}
              <div className="space-y-4">
                {detail.bodyAreas.areas.map((area, index) => (
                  <motion.button
                    key={area.id}
                    onClick={() => setSelectedBodyArea(selectedBodyArea === area.id ? null : area.id)}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      group relative w-full text-left p-6 rounded-2xl transition-all duration-500
                      ${selectedBodyArea === area.id
                        ? 'bg-gradient-to-r from-[#C9A86C]/15 to-[#FAF8F6] border-2 border-[#C9A86C]/50 shadow-lg shadow-[#C9A86C]/15'
                        : 'bg-gradient-to-br from-[#FAF8F6] to-white border border-gray-100 hover:border-[#C9A86C]/40 hover:shadow-xl hover:shadow-[#C9A86C]/10'
                      }
                    `}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#C9A86C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                    {/* Number badge */}
                    <div className="flex items-start gap-5">
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                        style={{
                          background: selectedBodyArea === area.id
                            ? 'linear-gradient(135deg, #C9A86C 0%, #D4B87A 100%)'
                            : 'linear-gradient(135deg, #C9A86C99 0%, #D4B87A99 100%)',
                          boxShadow: selectedBodyArea === area.id
                            ? '0 4px 16px rgba(201, 168, 108, 0.4)'
                            : '0 4px 16px rgba(201, 168, 108, 0.25)',
                          transform: selectedBodyArea === area.id ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        <span className="text-white font-light text-base">0{area.id}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          relative text-lg font-medium mb-1 transition-colors
                          ${selectedBodyArea === area.id ? 'text-[#6D5A4D]' : 'text-[#3A3A3A] group-hover:text-[#6D5A4D]'}
                        `}>
                          {area.name}
                        </h3>
                        <p className="relative text-sm text-[#C9A86C] font-medium mb-2">
                          {area.description}
                        </p>
                        <p className="relative text-sm text-gray-400 leading-relaxed">
                          {area.detail}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={`
                          w-1 h-12 rounded-full transition-all duration-300 flex-shrink-0
                          ${selectedBodyArea === area.id ? 'bg-[#C9A86C]' : 'bg-transparent group-hover:bg-[#C9A86C]/30'}
                        `}
                      />
                    </div>
                  </motion.button>
                ))}

                {/* Notice */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 p-5 bg-gradient-to-r from-[#C9A86C]/10 via-[#C9A86C]/5 to-transparent rounded-xl border border-[#C9A86C]/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#C9A86C]/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#C9A86C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#6D5A4D] leading-relaxed font-light">
                      {detail.bodyAreas.notice}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filler Types Section - Premium */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Filler Types</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-4">
              {detail.fillerTypes.title}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light">
              {detail.fillerTypes.subtitle}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <PremiumFillerTypesSection types={detail.fillerTypes.types} />
          </div>
        </div>
      </section>

      {/* Safety Section - Glassmorphism */}
      <section className="py-32 bg-[#2D2D2D] relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A89080]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C9A99A]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Safety</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-white mb-4">
              {detail.safety.title}
            </h2>
            <p className="text-white/50 max-w-xl mx-auto font-light">
              {detail.safety.subtitle}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6">
              {detail.safety.steps.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center flex-1"
                >
                  <div className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#A89080]/30 to-[#C9A99A]/20 flex items-center justify-center">
                      <span className="text-2xl font-extralight text-white/80">{item.step}</span>
                    </div>
                    <h3 className="text-lg font-light text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>

                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 z-10">
                      <svg viewBox="0 0 24 8" className="w-full text-[#A89080]/50">
                        <path d="M0 4 L20 4 M16 0 L20 4 L16 8" fill="none" stroke="currentColor" strokeWidth="1"/>
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 bg-gradient-to-br from-[#FAF8F6] to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Process</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {t('common.process')}
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            {processItems.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative p-8 bg-white border border-gray-100 rounded-xl hover:border-[#A89080]/30 hover:shadow-xl hover:shadow-[#A89080]/5 transition-all duration-500"
              >
                <span className="absolute top-6 right-6 text-5xl font-extralight text-[#A89080]/20 group-hover:text-[#A89080]/30 transition-colors">
                  0{step.step}
                </span>
                <div className="relative w-14 h-14 mb-6">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#A89080]/20 to-[#C9A99A]/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-extralight text-[#6D5A4D]">{String(step.step).padStart(2, '0')}</span>
                  </div>
                </div>
                <h3 className="relative text-lg font-light text-[#3A3A3A] mb-3">{step.title}</h3>
                <p className="relative text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Info */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Information</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {detail.treatmentInfo.title}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: detail.treatmentInfo.duration, value: treatmentValues.duration },
              { label: detail.treatmentInfo.anesthesia, value: treatmentValues.anesthesia },
              { label: detail.treatmentInfo.recovery, value: treatmentValues.recovery },
              { label: detail.treatmentInfo.results, value: treatmentValues.results },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gradient-to-br from-[#FAF8F6] to-white rounded-xl border border-gray-100"
              >
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#A89080]/10 to-[#C9A99A]/5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#A89080]" />
                </div>
                <div className="text-sm text-[#A89080] mb-2">{info.label}</div>
                <div className="text-lg font-light text-[#3A3A3A]">{info.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-32 bg-[#FAF8F6]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Ideal For</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {t('common.recommended')}
            </h2>
          </motion.div>

          <div className="max-w-4xl grid md:grid-cols-2 gap-4">
            {idealForItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 8 }}
                className="flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-100 hover:border-[#A89080]/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A89080]/20 to-[#C9A99A]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#A89080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#6D5A4D] font-light">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 외국인 환자 안내 (P1-2) — en·ja·zh·zh-TW에서만 렌더 */}
      <InternationalNotice treatmentId="filler" />

      {/* FAQ */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">FAQ</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
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
                transition={{ delay: index * 0.05 }}
                className="group bg-[#FAF8F6] rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-white/50 transition-colors"
                >
                  <span className="font-light text-[#3A3A3A] pr-8">{faq.q}</span>
                  <span className="w-8 h-8 rounded-full bg-[#A89080]/10 flex items-center justify-center text-[#A89080] transform group-open:rotate-45 transition-transform duration-300 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Cautions */}
      <section className="py-24 bg-[#FAF8F6]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-8 h-px bg-[#A89080]" />
                <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Precautions</span>
                <div className="w-8 h-px bg-[#A89080]" />
              </div>
              <h2 className="text-3xl font-extralight text-[#3A3A3A]">
                {t('common.precautions')}
              </h2>
            </div>
            <div className="bg-white p-10 rounded-2xl border border-gray-100">
              <ul className="space-y-4">
                {cautionItems.map((caution, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-4 text-gray-500 font-light"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A89080] mt-2.5 flex-shrink-0" />
                    {caution}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gradient-to-br from-[#6D5A4D] to-[#5A4940] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A89080]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#C9A99A]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.4em] text-[#A89080] uppercase">Consultation</span>
              <div className="w-12 h-px bg-[#A89080]" />
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
                className="group inline-flex items-center px-12 py-5 bg-white text-[#6D5A4D] text-sm tracking-wider hover:bg-gray-100 transition-all duration-500 shadow-xl"
              >
                <span>{t('common.onlineConsultation')}</span>
                <svg className="w-4 h-4 ml-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-12 py-5 border border-white/30 text-white text-sm tracking-wider hover:border-white/50 hover:bg-white/5 transition-all duration-300"
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
    </main>
  );
}
