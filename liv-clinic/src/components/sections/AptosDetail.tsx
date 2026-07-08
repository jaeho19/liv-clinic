'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Breadcrumb } from '@/components/ui';

// NAMICA 일러스트 Props 타입
interface NamicaIllustrationProps {
  title: string;
  subtitle: string;
}

// NAMICA 메커니즘 일러스트
const NamicaMechanismIllustration = ({ title, subtitle }: NamicaIllustrationProps) => (
  <div className="relative w-full max-w-md mx-auto aspect-square">
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <linearGradient id="haGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b4988d" />
          <stop offset="50%" stopColor="#d4c4bd" />
          <stop offset="100%" stopColor="#6d4e42" />
        </linearGradient>
        <linearGradient id="threadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C0A080" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* 배경 원 */}
      <circle cx="200" cy="200" r="180" fill="#faf8f7" stroke="#e5e5e5" strokeWidth="1" />

      {/* 실 (Thread) */}
      <motion.path
        d="M100 120 Q200 80 300 120 Q320 200 300 280 Q200 320 100 280 Q80 200 100 120"
        stroke="url(#threadGradient)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* 코그 (돌기) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = 200 + Math.cos(angle) * 100;
        const y = 200 + Math.sin(angle) * 80;
        return (
          <motion.g key={i} filter="url(#glow)">
            <motion.circle
              cx={x}
              cy={y}
              r="4"
              fill="#b4988d"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
            <motion.line
              x1={x}
              y1={y}
              x2={x + Math.cos(angle) * 15}
              y2={y + Math.sin(angle) * 15}
              stroke="#b4988d"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            />
          </motion.g>
        );
      })}

      {/* HA 캡슐 - Micro */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 }}
      >
        <circle cx="200" cy="140" r="20" fill="url(#haGradient)" opacity="0.8" />
        <text x="200" y="145" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">MICRO</text>
      </motion.g>

      {/* HA 캡슐 - Sub-Micro */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8 }}
      >
        <circle cx="140" cy="200" r="15" fill="url(#haGradient)" opacity="0.7" />
        <text x="140" y="203" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">SUB</text>
      </motion.g>

      {/* HA 캡슐 - Nano */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.1 }}
      >
        <circle cx="260" cy="200" r="10" fill="url(#haGradient)" opacity="0.6" />
        <text x="260" y="203" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">NANO</text>
      </motion.g>

      {/* HA 방출 파티클 - 고정 위치로 hydration 에러 방지 */}
      {[
        { cx: 175, cy: 165, r: 3 },
        { cx: 220, cy: 180, r: 4 },
        { cx: 185, cy: 220, r: 2.5 },
        { cx: 230, cy: 210, r: 3.5 },
        { cx: 160, cy: 195, r: 3 },
        { cx: 245, cy: 175, r: 2 },
        { cx: 195, cy: 240, r: 4 },
        { cx: 210, cy: 155, r: 2.5 },
        { cx: 165, cy: 230, r: 3 },
        { cx: 240, cy: 230, r: 3.5 },
        { cx: 180, cy: 175, r: 2 },
        { cx: 225, cy: 245, r: 3 },
      ].map((particle, i) => (
        <motion.circle
          key={`particle-${i}`}
          cx={particle.cx}
          cy={particle.cy}
          r={particle.r}
          fill="#b4988d"
          opacity={0.3}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ delay: 2.5 + i * 0.2, duration: 2, repeat: Infinity }}
        />
      ))}

      {/* 라벨 */}
      <text x="200" y="350" textAnchor="middle" fill="#6d4e42" fontSize="14" fontWeight="600">
        {title}
      </text>
      <text x="200" y="370" textAnchor="middle" fill="#8a8a8a" fontSize="10">
        {subtitle}
      </text>
    </svg>
  </div>
);

// 3단계 효과 색상 (번역에서 사용)
const phaseColors = ['#b4988d', '#a08070', '#6d4e42'];

// 갤러리 이미지 소스
const galleryImageSrcs = [
  '/images/aptos/certification-ceremony.jpg',
  '/images/aptos/presentation-mips.jpg',
  '/images/aptos/consultation.jpg',
];

// 제품 이미지 소스
const productImages = [
  '/images/aptos/Gemini_Generated_Image_8ht5zd8ht5zd8ht5.png',
  '/images/aptos/Gemini_Generated_Image_1kxewx1kxewx1kxe.png',
  '/images/aptos/Gemini_Generated_Image_8ht5zd8ht5zd8ht5.png',
];

export default function AptosDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  // ESC 키로 모달 닫기 (글로벌 키보드 리스너)
  useEffect(() => {
    if (!showCertificate && activeImage === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCertificate(false);
        setActiveImage(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCertificate, activeImage]);

  // 번역 데이터 로드
  const namicaIllustration = t.raw('lifting.aptos.detail.namicaIllustration') as { title: string; subtitle: string };
  const phaseEffects = t.raw('lifting.aptos.detail.phaseEffects') as Array<{ phase: string; period: string; description: string; detail: string }>;
  const certifications = t.raw('lifting.aptos.detail.certifications') as Array<{ label: string; value: string }>;
  const gallery = t.raw('lifting.aptos.detail.gallery') as Array<{ alt: string; caption: string }>;
  const namicaSection = t.raw('lifting.aptos.detail.namicaSection') as { title: string; description: string; features: Array<{ icon: string; text: string }> };
  const lineupPositioning = t.raw('lifting.aptos.detail.lineupSection.positioning') as Array<{ code: string; desc: string }>;
  const lineupProducts = t.raw('lifting.aptos.detail.lineupSection.products') as Array<{ name: string; desc: string }>;

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb items={[{ navKey: 'lifting', href: '/lifting' }, { navKey: 'aptos' }]} />

      {/* Hero Section */}
      <section className="relative h-60-dvh min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/aptos/procedure-main.jpg"
            alt="APTOS NAMICA 시술"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/20 text-white mb-4">
              {t('lifting.aptos.detail.hero.badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-4" dangerouslySetInnerHTML={{ __html: t('lifting.aptos.detail.hero.title') }} />
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              {t('lifting.aptos.detail.hero.description')}
            </p>
          </motion.div>

          {/* 효과 지속 배지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3"
          >
            <span className="text-white/60 text-sm">{t('lifting.aptos.detail.hero.durationLabel')}</span>
            <span className="text-2xl font-bold text-white">{t('lifting.aptos.detail.hero.durationValue')}</span>
          </motion.div>
        </div>
      </section>

      {/* NAMICA Technology Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Illustration */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <NamicaMechanismIllustration title={namicaIllustration.title} subtitle={namicaIllustration.subtitle} />
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-light text-secondary mb-6">
                {namicaSection.title}
              </h2>
              <p className="text-mono leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: namicaSection.description }} />

              <div className="space-y-4">
                {namicaSection.features.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-mono">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3단계 효과 Section */}
      <section className="py-20 md:py-28">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-secondary mb-4">
              {t('lifting.aptos.detail.phaseSection.title')}
            </h2>
            <p className="text-mono-light max-w-2xl mx-auto">
              {t('lifting.aptos.detail.phaseSection.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {phaseEffects.map((effect, index) => (
              <motion.div
                key={effect.phase}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Number Badge */}
                <div
                  className="absolute -top-4 left-8 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: phaseColors[index] }}
                >
                  {index + 1}
                </div>

                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-4"
                  style={{ backgroundColor: phaseColors[index] }}
                >
                  {effect.period}
                </div>

                <h3 className="text-xl font-medium text-secondary mb-3">
                  {effect.phase}
                </h3>
                <p className="text-mono mb-3">{effect.description}</p>
                <p className="text-sm text-mono-light">{effect.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-16 bg-background">
        <div className="container-custom">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl font-medium text-center text-secondary mb-10"
          >
            {t('lifting.aptos.detail.certificationsSection.title')}
          </motion.h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-white border-2 border-primary">
                  <span className="text-sm font-bold text-secondary">{cert.label}</span>
                </div>
                <p className="text-sm text-mono-light">{cert.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Section */}
      <section className="py-20 md:py-28">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-light text-secondary mb-4">
              {t('lifting.aptos.detail.trainingSection.title')}
            </h2>
            <p className="text-mono max-w-2xl mx-auto">
              {t('lifting.aptos.detail.trainingSection.description')}
            </p>
          </motion.div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {gallery.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setActiveImage(activeImage === index ? null : index)}
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-2 relative">
                  <Image
                    src={galleryImageSrcs[index]}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-colors flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-mono-light text-center">{image.caption}</p>
              </motion.div>
            ))}
          </div>

          {/* Certificate Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-secondary/5 border border-secondary/10 flex flex-col md:flex-row items-center gap-6"
          >
            <button
              type="button"
              onClick={() => setShowCertificate(true)}
              className="flex-shrink-0 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              aria-label="APTOS Professional Course Certificate 확대 보기"
            >
              <img
                src="/images/aptos/certificate.jpg"
                alt="APTOS Professional Course Certificate – Kim Sooyoung"
                className="w-48 sm:w-60 md:w-72 h-auto"
                draggable={false}
              />
            </button>
            <div>
              <h4 className="font-medium text-secondary mb-1">
                <button
                  type="button"
                  onClick={() => setShowCertificate(true)}
                  className="hover:underline cursor-pointer text-left"
                >
                  {t('lifting.aptos.detail.trainingSection.certificateTitle')}
                </button>
              </h4>
              <p className="text-sm text-mono mb-2">
                {t('lifting.aptos.detail.trainingSection.certificateName')}
              </p>
              <p className="text-xs text-mono-light">
                {t('lifting.aptos.detail.trainingSection.certificateIssuer')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 실의 종류 라인업 Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-secondary mb-4">
              {t('lifting.aptos.detail.lineupSection.title')}
            </h2>
          </motion.div>

          {/* 제품 포지셔닝 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-center gap-6 md:gap-10 mb-16"
          >
            {lineupPositioning.map((item, index) => (
              <div
                key={item.code}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl bg-white shadow-md${index === 1 ? ' ring-2 ring-primary/20' : ''}`}
              >
                <span className="text-mono">{item.desc}</span>
                <span className="text-mono-light">—</span>
                <span className="text-lg font-bold text-primary whitespace-nowrap">{item.code}</span>
              </div>
            ))}
          </motion.div>

          {/* 구분선 */}
          <div className="border-t border-border mb-16" />

          {/* 제품 라인업 상세 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {lineupProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl bg-white shadow-lg overflow-hidden${index === 1 ? ' ring-2 ring-primary/20' : ''}`}
              >
                <div className="aspect-[4/3] relative bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={productImages[index]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-secondary mb-3">{product.name}</h3>
                  <p className="text-sm text-mono-light leading-relaxed">
                    {product.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-secondary to-secondary/90">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
              {t('lifting.aptos.detail.cta.title')}
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              {t('lifting.aptos.detail.cta.description')}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              {t('lifting.aptos.detail.cta.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Image Modal */}
      {activeImage !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveImage(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-4xl w-full aspect-[4/3]"
          >
            <Image
              src={galleryImageSrcs[activeImage]}
              alt={gallery[activeImage].alt}
              fill
              className="object-contain"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              onClick={() => setActiveImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowCertificate(false)}
          role="dialog"
          aria-modal="true"
          aria-label="APTOS Professional Course Certificate"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/images/aptos/certificate.jpg"
              alt="APTOS Professional Course Certificate – Kim Sooyoung"
              className="w-full h-auto rounded-lg"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              onClick={() => setShowCertificate(false)}
              aria-label={tCommon('close')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
