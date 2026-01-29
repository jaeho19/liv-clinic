'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

// Premium color palette - Soft Pink/Lavender
const colors = {
  primary: '#D4A5A5',
  secondary: '#8B7B8B',
  accent: '#F5E6E8',
  dark: '#3A3A3A',
  light: '#FDF8F8',
};

// Icon components
const Icons = {
  droplet: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  sun: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
    </svg>
  ),
  sparkle: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 20l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1zM19 14l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L17 16l1.5-.5.5-1.5z" />
    </svg>
  ),
  wave: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8c2-2 4-2 6 0s4 2 6 0 4 2 6 0m-18 4c2-2 4-2 6 0s4 2 6 0 4 2 6 0m-18 4c2-2 4-2 6 0s4 2 6 0 4 2 6 0" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
    </svg>
  ),
  glow: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
      <circle cx="12" cy="12" r="8" strokeWidth={0.5} strokeDasharray="2 2" />
    </svg>
  ),
  water: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  zap: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  snowflake: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20m10-10H2m14.5-5.5l-9 9m0-9l9 9" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21h6m-6-3h6a3 3 0 003-3 7 7 0 10-12 0 3 3 0 003 3z" />
    </svg>
  ),
  award: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="6" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" />
    </svg>
  ),
  verified: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  stethoscope: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.8 2.3A.3.3 0 105 2.3v.7a3 3 0 003 3h1a3 3 0 003-3v-.7a.3.3 0 10.3-.3m-4.3 8v7a4 4 0 008 0v-2m0 0a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  heart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
};

// TypeScript interfaces
interface ProgramItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  details: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  brand: string;
  icon: string;
  description: string;
  feature: string;
}

interface DifferentiatorItem {
  id: string;
  icon: string;
  title: string;
  description: string;
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

interface TreatmentInfoLabels {
  duration: string;
  anesthesia: string;
  recovery: string;
  results: string;
}

// Get icon by key
const getIcon = (iconKey: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const iconMap: Record<string, React.ReactNode> = {
    droplet: Icons.droplet,
    sun: Icons.sun,
    sparkle: Icons.sparkle,
    wave: Icons.wave,
    shield: Icons.shield,
    glow: Icons.glow,
    water: Icons.water,
    zap: Icons.zap,
    snowflake: Icons.snowflake,
    lightbulb: Icons.lightbulb,
    award: Icons.award,
    verified: Icons.verified,
    stethoscope: Icons.stethoscope,
    heart: Icons.heart,
    lock: Icons.lock,
  };
  return iconMap[iconKey] || Icons.sparkle;
};

export default function SkincarePage() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');

  // Load translation data
  const detail = {
    name: t('antiaging.skincare.name'),
    nameEn: t('antiaging.skincare.fullName'),
    tagline: t('antiaging.skincare.tagline'),
    description: t('antiaging.skincare.description'),
    heroSubtitle: t('antiaging.skincare.detail.heroSubtitle'),
    programsSection: {
      badge: t('antiaging.skincare.detail.programsSection.badge'),
      title: t('antiaging.skincare.detail.programsSection.title'),
      subtitle: t('antiaging.skincare.detail.programsSection.subtitle'),
      items: t.raw('antiaging.skincare.detail.programsSection.items') as ProgramItem[],
    },
    equipmentSection: {
      badge: t('antiaging.skincare.detail.equipmentSection.badge'),
      title: t('antiaging.skincare.detail.equipmentSection.title'),
      subtitle: t('antiaging.skincare.detail.equipmentSection.subtitle'),
      items: t.raw('antiaging.skincare.detail.equipmentSection.items') as EquipmentItem[],
    },
    differentiatorSection: {
      badge: t('antiaging.skincare.detail.differentiatorSection.badge'),
      title: t('antiaging.skincare.detail.differentiatorSection.title'),
      subtitle: t('antiaging.skincare.detail.differentiatorSection.subtitle'),
      items: t.raw('antiaging.skincare.detail.differentiatorSection.items') as DifferentiatorItem[],
    },
    treatmentInfo: {
      title: t('antiaging.skincare.detail.treatmentInfo.title'),
      labels: t.raw('antiaging.skincare.detail.treatmentInfo.labels') as TreatmentInfoLabels,
    },
    treatmentValues: t.raw('antiaging.skincare.detail.treatmentValues') as TreatmentValues,
    idealFor: {
      title: t('antiaging.skincare.detail.idealFor.title'),
      items: t.raw('antiaging.skincare.detail.idealFor.items') as string[],
    },
    faqs: {
      title: t('antiaging.skincare.detail.faqs.title'),
      items: t.raw('antiaging.skincare.detail.faqs.items') as FaqItem[],
    },
    cta: {
      title: t('antiaging.skincare.detail.cta.title'),
      description: t('antiaging.skincare.detail.cta.description'),
      button: t('antiaging.skincare.detail.cta.button'),
    },
  };

  return (
    <main className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F8] via-white to-[#F5E6E8]" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                className="flex items-center gap-4 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-12 h-px bg-gradient-to-r from-[#D4A5A5] to-transparent" />
                <span className="text-xs tracking-[0.4em] text-[#D4A5A5] uppercase">
                  {detail.heroSubtitle}
                </span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-extralight text-[#3A3A3A] leading-tight mb-6">
                {detail.name}
              </h1>

              <p className="text-xl font-light text-[#D4A5A5] mb-4 tracking-wide">
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
              <div className="relative aspect-[4/5] max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-[#D4A5A5]/20">
                <Image
                  src="/images/official/Gemini_Generated_Image_2xgc3c2xgc3c2xgc.png"
                  alt="리브성형외과 프리미엄 스킨케어 일러스트"
                  fill
                  className="object-cover"
                  quality={95}
                  priority
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#D4A5A5]/10 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">
                {detail.programsSection.badge}
              </span>
              <div className="w-8 h-px bg-[#D4A5A5]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-4">
              {detail.programsSection.title}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light">
              {detail.programsSection.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {detail.programsSection.items.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 bg-gradient-to-br from-[#FDF8F8] to-white border border-gray-100 rounded-2xl hover:border-[#D4A5A5]/30 hover:shadow-xl hover:shadow-[#D4A5A5]/10 transition-all duration-500"
              >
                <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-[#D4A5A5]/20 to-[#F5E6E8] flex items-center justify-center text-[#D4A5A5] group-hover:from-[#D4A5A5]/30 group-hover:to-[#F5E6E8]/80 transition-colors">
                  {getIcon(program.icon)}
                </div>
                <h3 className="text-xl font-light text-[#3A3A3A] mb-2 group-hover:text-[#D4A5A5] transition-colors">
                  {program.title}
                </h3>
                <p className="text-[#D4A5A5] text-xs mb-4 tracking-wide">{program.subtitle}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">
                  {program.description}
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {program.details}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="py-32 bg-gradient-to-br from-[#FDF8F8] to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">
                {detail.equipmentSection.badge}
              </span>
              <div className="w-8 h-px bg-[#D4A5A5]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-4">
              {detail.equipmentSection.title}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light">
              {detail.equipmentSection.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {detail.equipmentSection.items.map((equipment, index) => (
              <motion.div
                key={equipment.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group p-8 bg-white border border-gray-100 rounded-2xl hover:border-[#D4A5A5]/30 hover:shadow-xl hover:shadow-[#D4A5A5]/10 transition-all duration-500 ${
                  index === detail.equipmentSection.items.length - 1 && detail.equipmentSection.items.length % 3 === 1
                    ? 'lg:col-start-2'
                    : index >= detail.equipmentSection.items.length - 2 && detail.equipmentSection.items.length % 3 === 2
                    ? index === detail.equipmentSection.items.length - 2
                      ? 'lg:col-start-1 lg:col-end-2 lg:justify-self-end lg:w-full lg:max-w-sm'
                      : 'lg:col-start-2 lg:col-end-3 lg:justify-self-start lg:w-full lg:max-w-sm'
                    : ''
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A5A5]/20 to-[#F5E6E8] flex items-center justify-center text-[#D4A5A5]">
                    {getIcon(equipment.icon)}
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-[#3A3A3A] group-hover:text-[#D4A5A5] transition-colors">
                      {equipment.name}
                    </h3>
                    <p className="text-xs text-gray-400">{equipment.brand}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">
                  {equipment.description}
                </p>
                <div className="inline-block px-3 py-1.5 text-xs text-[#8B7B8B] bg-[#F5E6E8]/50 rounded-full">
                  {equipment.feature}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="py-32 bg-[#8B7B8B] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#F5E6E8]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">
                {detail.differentiatorSection.badge}
              </span>
              <div className="w-8 h-px bg-[#D4A5A5]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-white mb-4">
              {detail.differentiatorSection.title}
            </h2>
            <p className="text-white/60 max-w-xl mx-auto font-light">
              {detail.differentiatorSection.subtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {detail.differentiatorSection.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 ${
                  index === detail.differentiatorSection.items.length - 1 && detail.differentiatorSection.items.length % 3 === 1
                    ? 'lg:col-start-2'
                    : index >= detail.differentiatorSection.items.length - 2 && detail.differentiatorSection.items.length % 3 === 2
                    ? index === detail.differentiatorSection.items.length - 2
                      ? 'lg:col-start-1 lg:col-end-2 lg:justify-self-end lg:w-full lg:max-w-sm'
                      : 'lg:col-start-2 lg:col-end-3 lg:justify-self-start lg:w-full lg:max-w-sm'
                    : ''
                }`}
              >
                <div className="w-14 h-14 mb-6 rounded-full bg-gradient-to-br from-[#D4A5A5]/30 to-[#F5E6E8]/20 flex items-center justify-center text-[#D4A5A5]">
                  {getIcon(item.icon)}
                </div>
                <h3 className="text-lg font-light text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.description}
                </p>
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
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">Information</span>
              <div className="w-8 h-px bg-[#D4A5A5]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {detail.treatmentInfo.title}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: detail.treatmentInfo.labels.duration, value: detail.treatmentValues.duration },
              { label: detail.treatmentInfo.labels.anesthesia, value: detail.treatmentValues.anesthesia },
              { label: detail.treatmentInfo.labels.recovery, value: detail.treatmentValues.recovery },
              { label: detail.treatmentInfo.labels.results, value: detail.treatmentValues.results },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gradient-to-br from-[#FDF8F8] to-white rounded-xl border border-gray-100"
              >
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4A5A5]/10 to-[#F5E6E8] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#D4A5A5]" />
                </div>
                <div className="text-sm text-[#D4A5A5] mb-2">{info.label}</div>
                <div className="text-base font-light text-[#3A3A3A]">{info.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-32 bg-[#FDF8F8]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mb-16"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">Ideal For</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {detail.idealFor.title}
            </h2>
          </motion.div>

          <div className="max-w-4xl grid md:grid-cols-2 gap-4">
            {detail.idealFor.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-100 hover:border-[#D4A5A5]/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A5A5]/20 to-[#F5E6E8] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#D4A5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#8B7B8B] font-light">{item}</span>
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
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">FAQ</span>
              <div className="w-8 h-px bg-[#D4A5A5]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {detail.faqs.title}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {detail.faqs.items.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#FDF8F8] rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-white/50 transition-colors">
                  <span className="font-light text-[#3A3A3A] pr-8">{faq.q}</span>
                  <span className="w-8 h-8 rounded-full bg-[#D4A5A5]/10 flex items-center justify-center text-[#D4A5A5] transform group-open:rotate-45 transition-transform duration-300 flex-shrink-0">
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

      {/* CTA */}
      <section className="py-32 bg-gradient-to-br from-[#8B7B8B] to-[#6B5B6B] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#F5E6E8]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-[#D4A5A5]" />
              <span className="text-xs tracking-[0.4em] text-[#D4A5A5] uppercase">Consultation</span>
              <div className="w-12 h-px bg-[#D4A5A5]" />
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
                className="group inline-flex items-center px-12 py-5 bg-white text-[#8B7B8B] text-sm tracking-wider hover:bg-gray-100 transition-all duration-500 shadow-xl"
              >
                <span>{detail.cta.button}</span>
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
