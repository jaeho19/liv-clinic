'use client';

import { useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

const treatment = TREATMENTS.antiaging.skinbooster;

// Premium color palette - Aqua Serenity
const colors = {
  primary: '#7BA3A8',
  secondary: '#4A6B6F',
  accent: '#C5D9DC',
  dark: '#3A3A3A',
  light: '#F7FAFA',
  aqua: '#9BBFC4',
  gold: '#A8C4A8',
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

// Premium Hydration Illustration
const PremiumHydrationIllustration = () => (
  <div className="relative w-full max-w-md mx-auto">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <linearGradient id="skinPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
          <stop offset="50%" stopColor={colors.primary} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.aqua} stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="skinGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.gold} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
        </linearGradient>

        <radialGradient id="skinGlowEffect" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>

        <filter id="skinPremiumShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={colors.secondary} floodOpacity="0.2" />
        </filter>

        <filter id="skinPulseGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <motion.circle
        cx="200"
        cy="200"
        r="180"
        fill="none"
        stroke="url(#skinGoldGrad)"
        strokeWidth="0.5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Background */}
      <circle cx="200" cy="200" r="160" fill={colors.light} fillOpacity="0.6" />

      {/* Skin layers */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        {/* Epidermis */}
        <motion.rect
          x="80" y="100" width="240" height="45" rx="6"
          fill="url(#skinPremiumGrad)"
          filter="url(#skinPremiumShadow)"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8 }}
          style={{ transformOrigin: 'left' }}
        />
        <text x="200" y="128" textAnchor="middle" fill={colors.secondary} fontSize="11" fontWeight="300">EPIDERMIS</text>

        {/* Dermis comparison */}
        <motion.g>
          <rect x="80" y="155" width="115" height="90" rx="6" fill="#F5E8E2" fillOpacity="0.8" />
          <text x="137" y="200" textAnchor="middle" fill="#999" fontSize="10" fontWeight="300">Dehydrated</text>

          <motion.rect
            x="205" y="155" width="115" height="90" rx="6"
            fill="url(#skinPremiumGrad)"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          />
          <text x="262" y="200" textAnchor="middle" fill={colors.secondary} fontSize="10" fontWeight="500">Hydrated</text>
        </motion.g>
      </motion.g>

      {/* Water droplets with glow */}
      {[
        { cx: 220, cy: 170, r: 10, delay: 1.2 },
        { cx: 255, cy: 180, r: 8, delay: 1.4 },
        { cx: 290, cy: 165, r: 9, delay: 1.6 },
        { cx: 235, cy: 210, r: 7, delay: 1.8 },
        { cx: 275, cy: 205, r: 8, delay: 2 },
        { cx: 245, cy: 235, r: 6, delay: 2.2 },
      ].map((drop, i) => (
        <motion.g key={i}>
          <motion.circle
            cx={drop.cx}
            cy={drop.cy}
            r={drop.r + 6}
            fill="url(#skinGlowEffect)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{
              duration: 3,
              delay: drop.delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.circle
            cx={drop.cx}
            cy={drop.cy}
            r={drop.r}
            fill={colors.primary}
            filter="url(#skinPulseGlow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: drop.delay, duration: 0.4 }}
          />
        </motion.g>
      ))}

      {/* Info box */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
      >
        <rect x="100" y="270" width="200" height="70" rx="12" fill={colors.accent} fillOpacity="0.3" />
        <text x="200" y="300" textAnchor="middle" fill={colors.secondary} fontSize="12" fontWeight="500">
          HA + Growth Factors
        </text>
        <text x="200" y="320" textAnchor="middle" fill={colors.primary} fontSize="10">
          Deep Hydration to Dermis
        </text>
      </motion.g>
    </svg>
  </div>
);

// Premium Treatment Course Timeline
const PremiumCourseTimeline = () => {
  const courseData = [
    { session: '1회', week: '0주', effect: 20, desc: '기초 수분 공급' },
    { session: '2회', week: '2-3주', effect: 50, desc: '수분 장벽 강화' },
    { session: '3회', week: '4-6주', effect: 80, desc: '콜라겐 활성화' },
    { session: '4회', week: '6-8주', effect: 100, desc: '최대 효과 도달' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-10 left-0 right-0 h-0.5 bg-gray-100" />
        <motion.div
          className="absolute top-10 left-0 h-0.5 bg-gradient-to-r from-[#7BA3A8] to-[#9BBFC4]"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.5 }}
        />

        <div className="grid grid-cols-4 gap-4">
          {courseData.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className="text-center relative"
            >
              {/* Node */}
              <motion.div
                className="relative w-20 h-20 mx-auto mb-6"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
              >
                <div className="absolute inset-0 rounded-full bg-[#7BA3A8]/20 animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                <div className="absolute inset-0 rounded-full bg-white border-2 border-[#7BA3A8] shadow-lg flex items-center justify-center">
                  <span className="text-xl font-light text-[#4A6B6F]">{i + 1}</span>
                </div>
              </motion.div>

              <div className="text-base font-medium text-[#3A3A3A] mb-1">{item.session}</div>
              <div className="text-xs text-gray-400 mb-3">{item.week}</div>
              <div className="text-xs text-[#4A6B6F] mb-3">{item.desc}</div>

              {/* Progress bar */}
              <div className="w-16 h-1.5 mx-auto bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#7BA3A8] to-[#9BBFC4] rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.effect}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 + i * 0.2, duration: 0.6 }}
                />
              </div>
              <div className="text-sm text-[#7BA3A8] mt-2 font-medium">{item.effect}%</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function SkinboosterDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  const relatedMedicalQA = MEDICAL_QA.filter((qa) =>
    qa.relatedTreatments?.some((id) => (id as string) === 'skinbooster')
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
      {/* Hero Section - Premium */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7FAFA] via-white to-[#F0F6F6]" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#7BA3A8]/5" />
        </div>

        <FloatingOrb className="w-96 h-96 bg-[#7BA3A8]/10 top-20 right-20" delay={0} />
        <FloatingOrb className="w-72 h-72 bg-[#9BBFC4]/10 bottom-40 left-10" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-[#C5D9DC]/20 top-1/3 left-1/4" delay={4} />

        <div className="container mx-auto px-6 lg:px-12 py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
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
                <div className="w-12 h-px bg-gradient-to-r from-[#7BA3A8] to-transparent" />
                <span className="text-xs tracking-[0.4em] text-[#7BA3A8] uppercase">
                  Anti-Aging Treatment
                </span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-extralight text-[#3A3A3A] leading-tight mb-6">
                {treatment.name}
              </h1>

              <p className="text-xl font-light text-[#7BA3A8] mb-4 tracking-wide">
                {treatment.nameEn}
              </p>

              <p className="text-lg text-gray-500 mb-4 font-light leading-relaxed">
                {treatment.tagline}
              </p>

              <p className="text-gray-400 leading-relaxed max-w-md font-light text-lg">
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
              <div className="relative aspect-[4/5] max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-[#7BA3A8]/20">
                <Image
                  src="/images/Gemini_Generated_Image_a2ghqha2ghqha2gh.png"
                  alt="스킨부스터 - 피부 속부터 차오르는 광채"
                  fill
                  className="object-cover"
                  quality={95}
                  priority
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#7BA3A8]/10 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7BA3A8]/30 to-transparent" />

        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Benefits</span>
              <div className="w-8 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              스킨부스터의 장점
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {treatment.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative p-8 bg-gradient-to-br from-[#F7FAFA] to-white border border-gray-100 rounded-xl hover:border-[#7BA3A8]/30 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#7BA3A8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7BA3A8]/20 to-[#9BBFC4]/10" />
                  <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                    <span className="text-xl font-light text-[#7BA3A8]">0{index + 1}</span>
                  </div>
                </div>

                <h3 className="relative text-lg font-light text-[#3A3A3A] mb-3 group-hover:text-[#7BA3A8] transition-colors">
                  {benefit.title}
                </h3>
                <p className="relative text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Effects Section */}
      <section className="py-32 bg-gradient-to-br from-[#F7FAFA] to-[#F0F6F6] relative overflow-hidden">
        <FloatingOrb className="w-80 h-80 bg-[#7BA3A8]/5 -right-20 top-20" delay={1} />

        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Effects</span>
              <div className="w-8 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              스킨부스터 효과
            </h2>
          </motion.div>

          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: 'droplet', title: '깊은 수분', desc: '진피층까지 전달' },
              { icon: 'bounce', title: '탄력 개선', desc: '콜라겐 생성 촉진' },
              { icon: 'glow', title: '자연 광채', desc: '피부 속부터 빛나는' },
            ].map((effect, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="group text-center p-8 bg-white rounded-2xl border border-gray-100 hover:border-[#7BA3A8]/30 hover:shadow-xl hover:shadow-[#7BA3A8]/5 transition-all duration-500"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#7BA3A8]/10 to-[#9BBFC4]/5 flex items-center justify-center group-hover:from-[#7BA3A8]/20 group-hover:to-[#9BBFC4]/10 transition-colors">
                  {effect.icon === 'droplet' && (
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#7BA3A8]" fill="currentColor">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                  )}
                  {effect.icon === 'bounce' && (
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#7BA3A8]" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 18 Q8 6 12 14 Q16 22 20 10" strokeLinecap="round"/>
                    </svg>
                  )}
                  {effect.icon === 'glow' && (
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#7BA3A8]" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="5"/>
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                        <line key={angle} x1="12" y1="3" x2="12" y2="1" transform={`rotate(${angle} 12 12)`}/>
                      ))}
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-light text-[#3A3A3A] mb-2 group-hover:text-[#7BA3A8] transition-colors">{effect.title}</h3>
                <p className="text-sm text-gray-400">{effect.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Course Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Treatment Course</span>
              <div className="w-8 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A] mb-4">
              3-4회 코스 시술 권장
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto font-light">
              최적의 효과를 위해 2-4주 간격으로 3-4회 시술을 권장합니다
            </p>
          </motion.div>

          <PremiumCourseTimeline />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto mt-16 text-center"
          >
            <div className="inline-block px-8 py-4 bg-gradient-to-r from-[#F7FAFA] to-white rounded-xl border border-gray-100">
              <p className="text-sm text-[#4A6B6F]">
                코스 완료 후 2-3개월마다 유지 시술 권장
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section - Glassmorphism */}
      <section className="py-32 bg-[#2D2D2D] relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7BA3A8]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#9BBFC4]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Products</span>
              <div className="w-8 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-white mb-4">
              스킨부스터 제품
            </h2>
            <p className="text-white/50 max-w-xl mx-auto font-light">
              피부 상태와 목적에 따라 최적의 제품을 선택합니다
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: '쥬베룩', desc: '콜라겐 부스팅', feature: 'PDRN + HA' },
              { name: '리쥬란', desc: '피부 재생', feature: 'PN' },
              { name: '볼벨라', desc: '수분 + 탄력', feature: '볼류마 HA' },
            ].map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#7BA3A8]/30 to-[#9BBFC4]/20 flex items-center justify-center">
                  <span className="text-2xl font-extralight text-white/80">0{i + 1}</span>
                </div>
                <h3 className="text-xl font-light text-white mb-2 text-center">{product.name}</h3>
                <p className="text-sm text-white/50 mb-4 text-center">{product.desc}</p>
                <div className="text-center">
                  <span className="inline-block px-4 py-2 text-xs text-[#7BA3A8] bg-white/10 rounded-full">
                    {product.feature}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 bg-gradient-to-br from-[#F7FAFA] to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Process</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {t('common.process')}
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            {treatment.process.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative p-8 bg-white border border-gray-100 rounded-xl hover:border-[#7BA3A8]/30 hover:shadow-xl hover:shadow-[#7BA3A8]/5 transition-all duration-500"
              >
                <span className="absolute top-6 right-6 text-5xl font-extralight text-[#7BA3A8]/20 group-hover:text-[#7BA3A8]/30 transition-colors">
                  0{step.step}
                </span>
                <div className="relative w-14 h-14 mb-6">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#7BA3A8]/20 to-[#9BBFC4]/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-extralight text-[#4A6B6F]">{String(step.step).padStart(2, '0')}</span>
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
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Information</span>
              <div className="w-8 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              시술 정보
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: '시술 시간', value: treatment.duration },
              { label: '마취', value: treatment.anesthesia },
              { label: '회복', value: treatment.recovery },
              { label: '효과', value: treatment.results },
            ].map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gradient-to-br from-[#F7FAFA] to-white rounded-xl border border-gray-100"
              >
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#7BA3A8]/10 to-[#9BBFC4]/5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#7BA3A8]" />
                </div>
                <div className="text-sm text-[#7BA3A8] mb-2">{info.label}</div>
                <div className="text-lg font-light text-[#3A3A3A]">{info.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-32 bg-[#F7FAFA]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mb-20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Ideal For</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              {t('common.recommended')}
            </h2>
          </motion.div>

          <div className="max-w-4xl grid md:grid-cols-2 gap-4">
            {treatment.idealFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 8 }}
                className="flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-100 hover:border-[#7BA3A8]/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7BA3A8]/20 to-[#9BBFC4]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#7BA3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#4A6B6F] font-light">{item}</span>
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
              <div className="w-8 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">FAQ</span>
              <div className="w-8 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extralight text-[#3A3A3A]">
              자주 묻는 질문
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {treatment.faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group bg-[#F7FAFA] rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-white/50 transition-colors"
                >
                  <span className="font-light text-[#3A3A3A] pr-8">{faq.q}</span>
                  <span className="w-8 h-8 rounded-full bg-[#7BA3A8]/10 flex items-center justify-center text-[#7BA3A8] transform group-open:rotate-45 transition-transform duration-300 flex-shrink-0">
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
      <section className="py-24 bg-[#F7FAFA]">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-8 h-px bg-[#7BA3A8]" />
                <span className="text-xs tracking-[0.3em] text-[#7BA3A8] uppercase">Precautions</span>
                <div className="w-8 h-px bg-[#7BA3A8]" />
              </div>
              <h2 className="text-3xl font-extralight text-[#3A3A3A]">
                {t('common.precautions')}
              </h2>
            </div>
            <div className="bg-white p-10 rounded-2xl border border-gray-100">
              <ul className="space-y-4">
                {treatment.cautions.map((caution, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-4 text-gray-500 font-light"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7BA3A8] mt-2.5 flex-shrink-0" />
                    {caution}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gradient-to-br from-[#4A6B6F] to-[#3A5A5F] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7BA3A8]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#9BBFC4]/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-[#7BA3A8]" />
              <span className="text-xs tracking-[0.4em] text-[#7BA3A8] uppercase">Consultation</span>
              <div className="w-12 h-px bg-[#7BA3A8]" />
            </div>
            <h2 className="text-4xl lg:text-6xl font-extralight text-white mt-4 mb-8">
              스킨부스터 상담 예약
            </h2>
            <p className="text-white/60 font-light max-w-xl mx-auto mb-12 text-lg leading-relaxed">
              피부 속부터 차오르는 수분과 광채, 전문 상담을 통해 맞춤 시술을 안내해 드립니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center px-12 py-5 bg-white text-[#4A6B6F] text-sm tracking-wider hover:bg-gray-100 transition-all duration-500 shadow-xl"
              >
                <span>온라인 상담 예약</span>
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
