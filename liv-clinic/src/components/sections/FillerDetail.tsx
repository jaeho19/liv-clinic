'use client';

import { useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { MEDICAL_QA } from '@/lib/constants';

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
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

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

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
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
      {/* Hero Section - Premium Design */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
                  src="/images/Gemini_Generated_Image_xrqs0pxrqs0pxrqs.png"
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

      {/* Treatment Areas - Grid Layout */}
      <section className="py-32 bg-gradient-to-b from-white to-[#FAF8F6] relative overflow-hidden">
        <FloatingOrb className="w-80 h-80 bg-[#A89080]/5 -right-20 top-20" delay={1} />
        <FloatingOrb className="w-64 h-64 bg-[#C9A99A]/5 -left-16 bottom-40" delay={3} />

        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#A89080]" />
              <span className="text-xs tracking-[0.3em] text-[#A89080] uppercase">Treatment Areas</span>
              <div className="w-8 h-px bg-[#A89080]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-4">
              {t('common.targetAreas')}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto font-light">
              {detail.targetAreas.subtitle}
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {detail.targetAreas.areas.map((area, index) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:border-[#A89080]/30 hover:shadow-xl hover:shadow-[#A89080]/10 transition-all duration-500"
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#A89080]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                {/* Icon Circle */}
                <div className="relative w-14 h-14 mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FAF8F6] to-[#F0E8E4]" />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#A89080] group-hover:text-[#6D5A4D] transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>

                {/* Number Badge */}
                <span className="relative text-xs text-[#C9A99A] font-medium tracking-wider mb-1">
                  {String(area.id).padStart(2, '0')}
                </span>

                {/* Name */}
                <h3 className="relative text-base font-medium text-[#3A3A3A] group-hover:text-[#6D5A4D] transition-colors mb-2">
                  {area.name}
                </h3>

                {/* Description */}
                <p className="relative text-xs text-center text-gray-400 leading-relaxed">
                  {area.description}
                </p>
              </motion.div>
            ))}
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
    </main>
  );
}
