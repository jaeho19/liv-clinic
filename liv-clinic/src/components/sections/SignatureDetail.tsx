'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useReducedMotion, useInView, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { AnimateOnScroll, Button, ScrollLink } from '@/components/ui';
import { useScrollToSection } from '@/hooks';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// ============================================================
// Types
// ============================================================
interface SignatureProgram {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  features: string[];
  duration: string;
  recommended: string;
  beforeImage: string;
  afterImage: string;
  accentColor: string;
  href: string;
}

interface PremiumCardProps {
  program: SignatureProgram;
  index: number;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onScrollToDetail: (id: string) => void;
}

// ============================================================
// Shimmer Particles Component - 빛나는 파티클 효과
// ============================================================
function ShimmerParticles({ color, isActive }: { color: string; isActive: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: isActive ? [0, 0.8, 0] : 0,
            scale: isActive ? [0, 1.5, 0] : 0,
            y: isActive ? [0, -20, -40] : 0,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: isActive ? Infinity : 0,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Animated Gradient Mesh - 애니메이션 그라디언트 메시
// ============================================================
function AnimatedGradientMesh({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Primary gradient blob */}
      <motion.div
        className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, ${color}25 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, ${color}20 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${color}15 0%, transparent 60%)
          `,
        }}
        animate={{
          rotate: isActive ? [0, 360] : 0,
          scale: isActive ? [1, 1.1, 1] : 1,
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      {/* Secondary pulsing gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${color}10 0%, transparent 50%, ${color}08 100%)`,
        }}
        animate={{
          opacity: isActive ? [0.5, 1, 0.5] : 0,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// ============================================================
// Program Static Config - 번역과 분리된 정적 설정
// ============================================================
interface ProgramConfig {
  id: string;
  number: string;
  beforeImage: string;
  afterImage: string;
  accentColor: string;
  href: string;
}

const programConfigs: ProgramConfig[] = [
  {
    id: 'lifting',
    number: '01',
    beforeImage: '/images/signature/lifting.png',
    afterImage: '/images/signature/lifting-woman.png',
    accentColor: '#8B5CF6',
    href: '/lifting',
  },
  {
    id: 'total',
    number: '02',
    beforeImage: '/images/signature/total-antiaging-abstract.png',
    afterImage: '/images/signature/bridal.png',
    accentColor: '#F43F5E',
    href: '/lifting/thread',
  },
  {
    id: 'petit',
    number: '03',
    beforeImage: '/images/signature/petit.png',
    afterImage: '/images/signature/v-line.png',
    accentColor: '#EC4899',
    href: '/antiaging',
  },
  {
    id: 'glow',
    number: '04',
    beforeImage: '/images/signature/care.png',
    afterImage: '/images/signature/glow-skin.png',
    accentColor: '#F59E0B',
    href: '/antiaging/skinbooster',
  },
];

// Hook to create translated program data
function useSignaturePrograms(): SignatureProgram[] {
  const t = useTranslations('signaturePage.programs');

  return useMemo(() => {
    return programConfigs.map((config) => ({
      ...config,
      title: t(`${config.id}.title`),
      subtitle: t(`${config.id}.subtitle`),
      tagline: t(`${config.id}.tagline`),
      description: t(`${config.id}.description`),
      features: t.raw(`${config.id}.features`) as string[],
      duration: t(`${config.id}.duration`),
      recommended: t(`${config.id}.recommended`),
    }));
  }, [t]);
}

// ============================================================
// Premium Card Component - 포토리얼 전후 비교 카드 (럭셔리 에디션)
// ============================================================
function PremiumCard({ program, index, reducedMotion, onSelect, isSelected, onScrollToDetail }: PremiumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [showAfter, setShowAfter] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });
  const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hoverDelayRef = useRef<NodeJS.Timeout | null>(null);
  const tCommon = useTranslations('common');
  const tPhoto = useTranslations('signaturePage.photoComparison');

  // 모바일 감지 - 3D 틸트 효과 비활성화용
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 3D Tilt Effect - 마우스 위치에 따른 카드 기울기 (모바일에서 비활성화)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring으로 부드러운 틸트 전환
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  // 광택 효과 위치
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  // 마우스 이동 핸들러 (모바일에서 3D 틸트 비활성화)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || isMobile || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // -0.5 ~ 0.5 범위로 정규화
    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  }, [reducedMotion, isMobile, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  // 호버/탭 시 전후 이미지 크로스페이드 효과 (부드러운 전환)
  const startCrossfade = useCallback(() => {
    if (reducedMotion) {
      setShowAfter(true);
      return;
    }

    // 호버 후 0.2초 딜레이 후 전환 시작 (의도적 호버 감지)
    hoverDelayRef.current = setTimeout(() => {
      setIsTransitioning(true);
      setShowAfter(true);

      // 2.5초마다 before/after 토글 (더 여유로운 전환)
      crossfadeIntervalRef.current = setInterval(() => {
        setShowAfter(prev => !prev);
      }, 2500);
    }, 200);
  }, [reducedMotion]);

  const stopCrossfade = useCallback(() => {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current);
      hoverDelayRef.current = null;
    }
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
    setIsTransitioning(false);
    setShowAfter(false);
  }, []);

  // 호버 상태 관리
  useEffect(() => {
    if (isHovered || isTapped) {
      startCrossfade();
    } else {
      stopCrossfade();
    }

    return () => {
      if (hoverDelayRef.current) {
        clearTimeout(hoverDelayRef.current);
      }
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, [isHovered, isTapped, startCrossfade, stopCrossfade]);

  // 모바일 탭 핸들러 + 스크롤
  const handleTap = () => {
    setIsTapped(prev => !prev);
    onSelect(program.id);
    // 약간의 딜레이 후 카드 그리드 상단으로 스크롤 (카드들이 보이고 아래에 상세 패널 표시)
    setTimeout(() => {
      onScrollToDetail('signature-cards-grid');
    }, 100);
  };

  // 스크롤 인뷰 애니메이션 variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reducedMotion ? 0.1 : 0.7,
        delay: reducedMotion ? 0 : index * 0.12,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  // 호버 시 1.05배 확대 애니메이션
  const imageVariants = {
    initial: {
      scale: 1,
      filter: 'brightness(0.95)',
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
    },
    hover: {
      scale: reducedMotion ? 1 : 1.05,
      filter: 'brightness(1.05)',
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  // 오버레이 밝아지는 효과
  const overlayVariants = {
    initial: {
      opacity: 0.55,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
    hover: {
      opacity: 0.2,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  // 상세 설명 슬라이드인 애니메이션
  const detailVariants = {
    initial: {
      opacity: 0,
      y: 30,
      filter: 'blur(4px)',
      transition: { duration: 0.3, ease: 'easeIn' as const },
    },
    hover: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        delay: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  const isActive = isHovered || isTapped || isSelected;

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="relative h-full"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative h-full min-h-[380px] sm:min-h-[450px] lg:min-h-[520px] rounded-2xl overflow-hidden cursor-pointer group focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={handleTap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTap();
          }
        }}
        style={{
          rotateX: (reducedMotion || isMobile) ? 0 : rotateX,
          rotateY: (reducedMotion || isMobile) ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        initial={{
          y: 0,
          boxShadow: `0 10px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)`,
        }}
        whileHover={{
          y: reducedMotion ? 0 : -16,
          boxShadow: `0 30px 60px -20px ${program.accentColor}40, 0 0 0 1px ${program.accentColor}30`,
        }}
        whileTap={{
          scale: reducedMotion ? 1 : 0.97,
          transition: { duration: 0.15 },
        }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isActive}
        aria-label={`${program.subtitle} - ${program.tagline}. ${isActive ? tPhoto('viewingDetails') : tPhoto('clickToViewDetails')}`}
      >
        {/* Before/After Images with Crossfade */}
        <motion.div
          className="absolute inset-0"
          variants={imageVariants}
          initial="initial"
          animate={isActive ? 'hover' : 'initial'}
        >
          {/* Before Image (Base) */}
          <div className="absolute inset-0">
            <Image
              src={program.beforeImage}
              alt={`${program.subtitle} ${tPhoto('beforeTreatment')}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              priority={index < 2}
            />
          </div>

          {/* After Image (Crossfade Overlay) - 0.8초 부드러운 크로스페이드 */}
          <AnimatePresence mode="wait">
            {showAfter && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    opacity: { duration: reducedMotion ? 0.1 : 0.8, ease: [0.4, 0, 0.2, 1] },
                    scale: { duration: reducedMotion ? 0.1 : 1.2, ease: [0.4, 0, 0.2, 1] },
                  },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: reducedMotion ? 0.1 : 0.6, ease: 'easeOut' },
                }}
              >
                <Image
                  src={program.afterImage}
                  alt={`${program.subtitle} ${tPhoto('afterTreatment')}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Gradient Overlay - 기본 어두운 상태 */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"
          variants={overlayVariants}
          initial="initial"
          animate={isActive ? 'hover' : 'initial'}
        />

        {/* Animated Gradient Mesh - 호버 시 활성화 */}
        <AnimatedGradientMesh color={program.accentColor} isActive={isActive} />

        {/* Shimmer Particles - 빛나는 파티클 */}
        <ShimmerParticles color={program.accentColor} isActive={isActive} />

        {/* Glassmorphism Overlay - 유리 느낌 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Top glass panel */}
          <div
            className="absolute top-0 left-0 right-0 h-24"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)',
              backdropFilter: isActive ? 'blur(2px)' : 'none',
            }}
          />
          {/* Bottom glass panel */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)',
              backdropFilter: isActive ? 'blur(1px)' : 'none',
            }}
          />
        </motion.div>

        {/* Dynamic Glare Effect - 마우스 위치 기반 광택 */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 0.4 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute w-[200%] h-[200%]"
            style={{
              background: `radial-gradient(circle at center, ${program.accentColor}20 0%, transparent 50%)`,
              left: glareX,
              top: glareY,
              x: '-50%',
              y: '-50%',
            }}
          />
        </motion.div>

        {/* Accent Line Top */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: program.accentColor }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 text-white">
          {/* Program Number */}
          <motion.span
            className="absolute top-6 right-6 font-serif text-6xl md:text-7xl text-white/5"
            animate={{ opacity: isActive ? 0.15 : 0.05 }}
            transition={{ duration: 0.3 }}
          >
            {program.number}
          </motion.span>

          {/* Before/After Indicator - 부드러운 전환 */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="absolute top-6 left-6 flex items-center gap-2"
                initial={{ opacity: 0, x: -15, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                  animate={{
                    backgroundColor: showAfter ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)',
                    color: showAfter ? 'rgba(255, 255, 255, 0.6)' : 'var(--color-secondary)',
                    boxShadow: showAfter ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  BEFORE
                </motion.span>
                <motion.span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                  animate={{
                    backgroundColor: showAfter ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.2)',
                    color: showAfter ? 'var(--color-secondary)' : 'rgba(255, 255, 255, 0.6)',
                    boxShadow: showAfter ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  AFTER
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title Section - 고정 높이로 제목 정렬 통일 */}
          <div className="mb-3">
            <motion.p
              className="font-serif text-xs tracking-[0.2em] mb-2 uppercase"
              style={{ color: program.accentColor }}
              animate={{ y: isActive ? -4 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {program.title}
            </motion.p>
            <motion.h3
              className="text-2xl md:text-3xl font-medium mb-1 min-h-[2.25rem] md:min-h-[2.5rem] flex items-end"
              animate={{ y: isActive ? -4 : 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {program.subtitle}
            </motion.h3>
            <motion.p
              className="text-white/70 text-sm md:text-base min-h-[1.5rem]"
              animate={{
                opacity: isActive ? 0 : 1,
                y: isActive ? -10 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {program.tagline}
            </motion.p>
          </div>

          {/* Detail Section - Visible on Hover/Tap - 위로 슬라이드 인 */}
          <motion.div
            variants={detailVariants}
            initial="initial"
            animate={isActive ? 'hover' : 'initial'}
            className="overflow-hidden"
          >
            <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
              {program.description}
            </p>

            {/* Features - 순차적 등장 애니메이션 */}
            <ul className="space-y-2.5 mb-5">
              {program.features.map((feature, idx) => (
                <motion.li
                  key={idx}
                  className="flex items-center gap-2.5 text-sm text-white/85"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    x: isActive ? 0 : -15,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: isActive ? 0.25 + idx * 0.1 : 0,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${program.accentColor}30` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: isActive ? 1 : 0 }}
                    transition={{
                      duration: 0.3,
                      delay: isActive ? 0.3 + idx * 0.1 : 0,
                      type: 'spring',
                      stiffness: 300,
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      style={{ color: program.accentColor }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                  {feature}
                </motion.li>
              ))}
            </ul>

            {/* CTA - 화살표 애니메이션 강화 */}
            <motion.div
              className="flex items-center gap-2 text-sm font-medium group/cta"
              style={{ color: program.accentColor }}
              whileHover={{ x: reducedMotion ? 0 : 6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <span>{tCommon('learnMore')}</span>
              <motion.svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ x: isActive ? [0, 4, 0] : 0 }}
                transition={{
                  duration: 1.2,
                  repeat: isActive ? Infinity : 0,
                  repeatDelay: 0.5,
                  ease: 'easeInOut',
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Hover Border Effect - 강화된 아우라 글로우 */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: isActive ? 1 : 0,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Inner glow border */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              border: `2px solid ${program.accentColor}`,
              boxShadow: `
                inset 0 0 40px ${program.accentColor}20,
                inset 0 1px 0 rgba(255,255,255,0.1)
              `,
            }}
          />
          {/* Outer aura glow */}
          <motion.div
            className="absolute -inset-1 rounded-3xl -z-10"
            style={{
              background: `radial-gradient(ellipse at center, ${program.accentColor}30 0%, transparent 70%)`,
              filter: 'blur(15px)',
            }}
            animate={{
              scale: isActive ? [1, 1.05, 1] : 1,
              opacity: isActive ? [0.5, 0.8, 0.5] : 0,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Corner accent highlights */}
        <AnimatePresence>
          {isActive && (
            <>
              {/* Top-left corner */}
              <motion.div
                className="absolute top-0 left-0 w-16 h-16 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <path
                    d="M0 24 L0 0 L24 0"
                    fill="none"
                    stroke={program.accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
              {/* Bottom-right corner */}
              <motion.div
                className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <svg viewBox="0 0 64 64" className="w-full h-full">
                  <path
                    d="M64 40 L64 64 L40 64"
                    fill="none"
                    stroke={program.accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Program Detail Panel - 선택된 프로그램 상세 정보
// ============================================================
function ProgramDetailPanel({
  program,
  isVisible,
  reducedMotion,
  sectionId
}: {
  program: SignatureProgram;
  isVisible: boolean;
  reducedMotion: boolean;
  sectionId: string;
}) {
  const tCommon = useTranslations('common');

  return (
    <div id={sectionId} className="scroll-mt-20">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.5, ease: 'easeInOut' as const }}
            className="overflow-hidden"
          >
          <div
            className="mt-8 p-8 rounded-2xl"
            style={{ backgroundColor: `${program.accentColor}08` }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Info */}
              <div>
                <p
                  className="font-serif text-sm tracking-[0.15em] mb-2"
                  style={{ color: program.accentColor }}
                >
                  {program.title}
                </p>
                <h4 className="text-2xl font-medium text-secondary mb-4">
                  {program.subtitle}
                </h4>
                <p className="text-mono leading-relaxed mb-6">
                  {program.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <p className="text-small text-mono-light mb-1">{tCommon('duration')}</p>
                    <p className="text-body text-secondary font-medium">{program.duration}</p>
                  </div>
                  <div>
                    <p className="text-small text-mono-light mb-1">{tCommon('recommendedFor')}</p>
                    <p className="text-body text-secondary font-medium">{program.recommended}</p>
                  </div>
                </div>

                <ScrollLink href={program.href}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="text-white"
                    style={{ backgroundColor: program.accentColor }}
                  >
                    {tCommon('learnMore')}
                  </Button>
                </ScrollLink>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                {program.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.1 }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${program.accentColor}20` }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: program.accentColor }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-body text-secondary">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}

// ============================================================
// Main Component - 시그니처 페이지
// ============================================================
export default function SignatureDetail() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const { scrollToSection } = useScrollToSection({ offset: 100 }); // 헤더 높이 고려
  const tCommon = useTranslations('common');
  const t = useTranslations('signaturePage');
  const signaturePrograms = useSignaturePrograms();

  const headerVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.1 : 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <>
      {/* Hero Section - Immersive Background */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-secondary/5 via-background to-background overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {signaturePrograms.map((program, i) => (
            <motion.div
              key={program.id}
              className="absolute w-80 h-80 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${program.accentColor}30 0%, transparent 70%)`,
                left: `${10 + i * 22}%`,
                top: `${5 + (i % 2) * 40}%`,
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="container-custom relative z-10">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <motion.p
                className="font-serif text-lg md:text-xl text-primary mb-3 tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {t('hero.subtitle')}
              </motion.p>
              <motion.h1
                className="text-4xl md:text-5xl lg:text-display text-secondary mb-6 font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t('hero.title')}
              </motion.h1>
              <motion.p
                className="text-lg md:text-h4 text-mono leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('hero.description1')}
                <br className="hidden md:block" />
                {t('hero.description2')}
              </motion.p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Programs Grid Section */}
      <section
        ref={sectionRef}
        className="py-16 md:py-24 bg-background"
        aria-labelledby="signature-programs-title"
      >
        <div className="container-custom">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12 md:mb-16"
            variants={headerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <p className="font-serif text-base md:text-lg text-primary mb-2 tracking-wider">
              {t('photoComparison.subtitle')}
            </p>
            <h2
              id="signature-programs-title"
              className="text-2xl md:text-3xl lg:text-4xl font-medium text-secondary mb-4"
            >
              {t('photoComparison.title')}
            </h2>
            <p className="text-mono-light max-w-2xl mx-auto text-sm md:text-base">
              {t('photoComparison.description')}
            </p>
          </motion.div>

          {/* Cards Grid - 반응형: 모바일 1열, sm 2열, lg 4열 */}
          <div id="signature-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 scroll-mt-24">
            {signaturePrograms.map((program, index) => (
              <PremiumCard
                key={program.id}
                program={program}
                index={index}
                reducedMotion={reducedMotion}
                onSelect={setSelectedProgram}
                isSelected={selectedProgram === program.id}
                onScrollToDetail={scrollToSection}
              />
            ))}
          </div>

          {/* Selected Program Detail Panel */}
          {signaturePrograms.map((program) => (
            <ProgramDetailPanel
              key={program.id}
              program={program}
              isVisible={selectedProgram === program.id}
              reducedMotion={reducedMotion}
              sectionId={`section-${program.id}`}
            />
          ))}
        </div>
      </section>

      {/* Why Signature Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="font-serif text-lg text-primary mb-3">{t('whySignature.subtitle')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-h1 text-secondary">
                {t('whySignature.title')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: t('whySignature.synergy.title'),
                desc: t('whySignature.synergy.description'),
                color: '#8B5CF6',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: t('whySignature.price.title'),
                desc: t('whySignature.price.description'),
                color: '#F59E0B',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: t('whySignature.protocol.title'),
                desc: t('whySignature.protocol.description'),
                color: '#EC4899',
              },
            ].map((item, index) => (
              <AnimateOnScroll key={index}>
                <motion.div
                  whileHover={{ y: reducedMotion ? 0 : -5 }}
                  transition={{ duration: 0.3 }}
                  className="bg-background rounded-2xl p-8 text-center h-full"
                >
                  <motion.div
                    className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    whileHover={{ scale: reducedMotion ? 1 : 1.1 }}
                  >
                    {item.icon}
                  </motion.div>
                  <h3 className="text-xl font-medium text-secondary mb-3">{item.title}</h3>
                  <p className="text-mono whitespace-pre-line text-sm md:text-base">{item.desc}</p>
                </motion.div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-10 md:mb-12">
              <p className="font-serif text-lg text-primary mb-3">{t('comparison.subtitle')}</p>
              <h2 className="text-2xl md:text-3xl lg:text-h1 text-secondary">
                {t('comparison.title')}
              </h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="font-medium text-mono-light text-sm md:text-base">{t('comparison.headers.item')}</div>
              <div className="font-medium text-mono-light text-sm md:text-base">{t('comparison.headers.individual')}</div>
              <div className="font-medium text-primary text-sm md:text-base">{t('comparison.headers.signature')}</div>
            </div>
            {[
              { label: t('comparison.rows.effect.label'), individual: t('comparison.rows.effect.individual'), signature: t('comparison.rows.effect.signature') },
              { label: t('comparison.rows.price.label'), individual: t('comparison.rows.price.individual'), signature: t('comparison.rows.price.signature') },
              { label: t('comparison.rows.time.label'), individual: t('comparison.rows.time.individual'), signature: t('comparison.rows.time.signature') },
              { label: t('comparison.rows.result.label'), individual: t('comparison.rows.result.individual'), signature: t('comparison.rows.result.signature') },
            ].map((row, index) => (
              <motion.div
                key={index}
                className="grid grid-cols-3 gap-4 py-4 border-b border-border text-center"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="font-medium text-secondary text-sm md:text-base">{row.label}</div>
                <div className="text-mono-light text-sm md:text-base">{row.individual}</div>
                <div className="text-primary font-medium text-sm md:text-base">{row.signature}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <motion.h2
                className="text-2xl md:text-3xl lg:text-h1 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {t('cta.title')}
              </motion.h2>
              <motion.p
                className="text-lg md:text-h4 opacity-90 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                {t('cta.description')}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <ScrollLink href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary border-white hover:bg-white/90"
                  >
                    {tCommon('freeConsultation')}
                  </Button>
                </ScrollLink>
              </motion.div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
