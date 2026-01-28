'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useReducedMotion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// ============================================================
// Types
// ============================================================
interface SignatureProgram {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  detailDescription: string;
  features: string[];
  href: string;
  beforeImage: string;
  afterImage: string;
  accentColor: string;
}

interface SignatureCardProps {
  program: SignatureProgram;
  index: number;
  reducedMotion: boolean;
}

// ============================================================
// Program Static Config - 번역과 분리된 정적 설정
// ============================================================
interface ProgramConfig {
  id: string;
  href: string;
  beforeImage: string;
  afterImage: string;
  accentColor: string;
}

const programConfigs: ProgramConfig[] = [
  {
    id: 'lifting',
    href: '/lifting',
    beforeImage: '/images/signature/lifting.png',
    afterImage: '/images/signature/lifting.jpg',
    accentColor: '#b4988d',
  },
  {
    id: 'petit',
    href: '/antiaging',
    beforeImage: '/images/signature/petit.png',
    afterImage: '/images/signature/petit.jpg',
    accentColor: '#c4a99a',
  },
  {
    id: 'glow',
    href: '/laser',
    beforeImage: '/images/signature/glow-abstract.png',
    afterImage: '/images/signature/glow-abstract.png',
    accentColor: '#a89080',
  },
  {
    id: 'total',
    href: '/signature',
    beforeImage: '/images/signature/total-antiaging-abstract.png',
    afterImage: '/images/signature/total-antiaging-abstract.png',
    accentColor: '#6d4e42',
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
      description: t(`${config.id}.tagline`),
      detailDescription: t(`${config.id}.description`),
      features: t.raw(`${config.id}.features`) as string[],
    }));
  }, [t]);
}

// ============================================================
// Signature Card Component - 포토리얼 전후 비교 카드
// ============================================================
function SignatureCard({ program, index, reducedMotion }: SignatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [showAfter, setShowAfter] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });
  const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tCommon = useTranslations('common');
  const tPhoto = useTranslations('signaturePage.photoComparison');

  // 호버/탭 시 전후 이미지 크로스페이드 효과
  const startCrossfade = useCallback(() => {
    if (reducedMotion) {
      setShowAfter(true);
      return;
    }

    // 즉시 after 이미지로 전환 시작
    setShowAfter(true);

    // 1초 후 before로, 다시 1초 후 after로 반복
    crossfadeIntervalRef.current = setInterval(() => {
      setShowAfter(prev => !prev);
    }, 1500);
  }, [reducedMotion]);

  const stopCrossfade = useCallback(() => {
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
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
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, [isHovered, isTapped, startCrossfade, stopCrossfade]);

  // 모바일 탭 핸들러
  const handleTap = () => {
    setIsTapped(prev => !prev);
  };

  // 애니메이션 variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.1 : 0.6,
        delay: reducedMotion ? 0 : index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  const imageVariants = {
    initial: { scale: 1 },
    hover: {
      scale: reducedMotion ? 1 : 1.05,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  const overlayVariants = {
    initial: { opacity: 0.5 },
    hover: {
      opacity: 0.35,
      transition: { duration: 0.4 },
    },
  };

  const detailVariants = {
    initial: { opacity: 0, y: 20 },
    hover: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.1 },
    },
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="relative h-full"
    >
      <Link
        href={program.href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
        aria-label={`${program.title} - ${program.subtitle}: ${program.description}`}
      >
        <motion.div
          className="relative h-full rounded-2xl overflow-hidden shadow-lg cursor-pointer"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onTap={handleTap}
          whileHover={{ y: reducedMotion ? 0 : -8 }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}
          style={{
            minHeight: '520px',
          }}
        >
          {/* Before/After Images with Crossfade */}
          <motion.div
            className="absolute inset-0"
            variants={imageVariants}
            initial="initial"
            animate={isHovered || isTapped ? 'hover' : 'initial'}
          >
            {/* Before Image (Base) */}
            <div className="absolute inset-0">
              <Image
                src={program.beforeImage}
                alt={`${program.title} ${tPhoto('beforeTreatment')}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={index < 2}
              />
            </div>

            {/* After Image (Crossfade Overlay) */}
            <AnimatePresence>
              {showAfter && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0.1 : 0.8, ease: 'easeInOut' as const }}
                >
                  <Image
                    src={program.afterImage}
                    alt={`${program.title} ${tPhoto('afterTreatment')}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Gradient Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
            variants={overlayVariants}
            initial="initial"
            animate={isHovered || isTapped ? 'hover' : 'initial'}
          />

          {/* Accent Line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: program.accentColor }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered || isTapped ? 1 : 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 text-white">
            {/* Program Number */}
            <motion.span
              className="absolute top-6 right-6 font-serif text-5xl md:text-6xl text-white/10"
              animate={{
                opacity: isHovered || isTapped ? 0.2 : 0.1,
              }}
              transition={{ duration: 0.3 }}
            >
              0{index + 1}
            </motion.span>

            {/* Before/After Indicator */}
            <AnimatePresence>
              {(isHovered || isTapped) && (
                <motion.div
                  className="absolute top-6 left-6 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      showAfter
                        ? 'bg-white/20 text-white/60'
                        : 'bg-white text-secondary'
                    }`}
                  >
                    BEFORE
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      showAfter
                        ? 'bg-white text-secondary'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    AFTER
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title Section */}
            <div className="mb-4">
              <motion.p
                className="font-serif text-sm tracking-widest mb-2"
                style={{ color: program.accentColor }}
                animate={{
                  y: isHovered || isTapped ? -4 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {program.title}
              </motion.p>
              <motion.h3
                className="text-2xl md:text-3xl font-medium mb-1"
                animate={{
                  y: isHovered || isTapped ? -4 : 0,
                }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                {program.subtitle}
              </motion.h3>
              <motion.p
                className="text-white/70 text-sm md:text-base"
                animate={{
                  opacity: isHovered || isTapped ? 0 : 1,
                  y: isHovered || isTapped ? -10 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {program.description}
              </motion.p>
            </div>

            {/* Detail Section - Visible on Hover/Tap */}
            <motion.div
              variants={detailVariants}
              initial="initial"
              animate={isHovered || isTapped ? 'hover' : 'initial'}
              className="overflow-hidden"
            >
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {program.detailDescription}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {program.features.map((feature, idx) => (
                  <motion.li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-white/80"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: isHovered || isTapped ? 1 : 0,
                      x: isHovered || isTapped ? 0 : -10,
                    }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
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
                    {feature}
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <motion.div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: program.accentColor }}
                whileHover={{ x: 4 }}
              >
                <span>{tCommon('learnMore')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.div>
            </motion.div>
          </div>

          {/* Hover Border Effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              border: `2px solid ${program.accentColor}`,
              opacity: 0,
            }}
            animate={{
              opacity: isHovered || isTapped ? 0.5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// Main Section Component
// ============================================================
export default function SignatureProgramsSection() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const t = useTranslations('signaturePage.hero');
  const tCommon = useTranslations('common');
  const programs = useSignaturePrograms();

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
    <section
      ref={sectionRef}
      className="section-gap bg-background"
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
          <p className="font-serif text-lg md:text-xl text-primary mb-2 tracking-wider">
            {t('subtitle')}
          </p>
          <h2
            id="signature-programs-title"
            className="text-3xl md:text-4xl lg:text-5xl font-medium text-secondary mb-4"
          >
            {t('title')}
          </h2>
          <p className="text-mono-light max-w-2xl mx-auto">
            {t('description1')}
            <br className="hidden md:block" />
            {t('description2')}
          </p>
        </motion.div>

        {/* Cards Grid - 2x2 on desktop, 1 or 2 cols on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {programs.map((program, index) => (
            <SignatureCard
              key={program.id}
              program={program}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: reducedMotion ? 0.1 : 0.6, delay: reducedMotion ? 0 : 0.8 }}
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full text-sm font-medium hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {tCommon('freeConsultation')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
