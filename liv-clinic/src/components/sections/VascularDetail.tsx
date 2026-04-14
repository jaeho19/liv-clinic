'use client';

import { useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { LASER_CATEGORIES } from '@/lib/constants';
import { PriceTable } from '@/components/ui';

// Get category info (static data that doesn't need translation)
const categoryStatic = LASER_CATEGORIES[1]; // vascular

// 듀얼 파장 작용 원리 일러스트
interface DualWavelengthProps {
  labels: {
    epidermis: string;
    dermis: string;
    shallow755: string;
    deep1064: string;
  };
}

const DualWavelengthIllustration = ({ labels }: DualWavelengthProps) => (
  <div className="relative w-full max-w-3xl mx-auto">
    <svg viewBox="0 0 700 350" className="w-full h-auto">
      <defs>
        <linearGradient id="skinLayer1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE4D6" />
          <stop offset="100%" stopColor="#FFD0B8" />
        </linearGradient>
        <linearGradient id="skinLayer2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD0B8" />
          <stop offset="100%" stopColor="#FFBFA0" />
        </linearGradient>
        <linearGradient id="laser755" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="laser1064" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* 피부 단면 */}
      <rect x="50" y="80" width="600" height="50" rx="5" fill="url(#skinLayer1)" />
      <text x="80" y="110" fill="#9CA3AF" fontSize="11">{labels.epidermis}</text>
      <rect x="50" y="135" width="600" height="120" rx="5" fill="url(#skinLayer2)" />
      <text x="80" y="200" fill="#9CA3AF" fontSize="11">{labels.dermis}</text>

      {/* 혈관들 */}
      <g>
        {/* 얕은 혈관 (755nm 타겟) */}
        <ellipse cx="200" cy="150" rx="30" ry="8" fill="#EF4444" opacity="0.8" />
        <ellipse cx="350" cy="155" rx="25" ry="6" fill="#EF4444" opacity="0.8" />
        <ellipse cx="500" cy="148" rx="35" ry="9" fill="#EF4444" opacity="0.8" />

        {/* 깊은 혈관 (1064nm 타겟) */}
        <ellipse cx="250" cy="210" rx="40" ry="10" fill="#DC2626" opacity="0.9" />
        <ellipse cx="450" cy="220" rx="45" ry="12" fill="#DC2626" opacity="0.9" />
      </g>

      {/* 755nm 레이저 빔 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <line x1="200" y1="30" x2="200" y2="150" stroke="url(#laser755)" strokeWidth="4" strokeDasharray="8 4" />
        <line x1="350" y1="30" x2="350" y2="155" stroke="url(#laser755)" strokeWidth="4" strokeDasharray="8 4" />
        <line x1="500" y1="30" x2="500" y2="148" stroke="url(#laser755)" strokeWidth="4" strokeDasharray="8 4" />
      </motion.g>

      {/* 1064nm 레이저 빔 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <line x1="250" y1="30" x2="250" y2="210" stroke="url(#laser1064)" strokeWidth="4" strokeDasharray="8 4" />
        <line x1="450" y1="30" x2="450" y2="220" stroke="url(#laser1064)" strokeWidth="4" strokeDasharray="8 4" />
      </motion.g>

      {/* 범례 */}
      <g transform="translate(50, 290)">
        <rect x="0" y="0" width="280" height="50" rx="10" fill="#F0FDF4" />
        <circle cx="25" cy="25" r="8" fill="#10B981" />
        <text x="45" y="30" fill="#059669" fontSize="12" fontWeight="500">{labels.shallow755}</text>
      </g>
      <g transform="translate(370, 290)">
        <rect x="0" y="0" width="280" height="50" rx="10" fill="#FEF2F2" />
        <circle cx="25" cy="25" r="8" fill="#EF4444" />
        <text x="45" y="30" fill="#DC2626" fontSize="12" fontWeight="500">{labels.deep1064}</text>
      </g>
    </svg>
  </div>
);

// 홍조 유형 카드
const RednessTypeCard = ({
  type,
  description,
  treatment,
  icon,
  recommendedLabel,
}: {
  type: string;
  description: string;
  treatment: string;
  icon: string;
  recommendedLabel: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-6 bg-white rounded-2xl shadow-lg border-l-4 border-red-500"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{type}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
          <span className="text-xs font-medium text-red-600">{recommendedLabel}:</span>
          <span className="text-xs text-gray-700">{treatment}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function VascularDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  // Translated category data
  const category = {
    name: t('laser.vascular.name'),
    nameEn: categoryStatic.nameEn,
    color: categoryStatic.color,
    href: categoryStatic.href,
  };

  // Translated data
  const detail = {
    hero: {
      subtitle: t('laser.vascular.detail.hero.subtitle'),
      description: t('laser.vascular.detail.hero.description'),
    },
    rednessTypes: {
      title: t('laser.vascular.detail.rednessTypes.title'),
      subtitle: t('laser.vascular.detail.rednessTypes.subtitle'),
      recommendedTreatment: t('laser.vascular.detail.rednessTypes.recommendedTreatment'),
      types: [0, 1, 2, 3].map(i => ({
        type: t(`laser.vascular.detail.rednessTypes.types.${i}.type`),
        description: t(`laser.vascular.detail.rednessTypes.types.${i}.description`),
        treatment: t(`laser.vascular.detail.rednessTypes.types.${i}.treatment`),
      })),
    },
    dualWavelength: {
      title: t('laser.vascular.detail.dualWavelength.title'),
      subtitle: t('laser.vascular.detail.dualWavelength.subtitle'),
      epidermis: t('laser.vascular.detail.dualWavelength.epidermis'),
      dermis: t('laser.vascular.detail.dualWavelength.dermis'),
      shallow755: t('laser.vascular.detail.dualWavelength.shallow755'),
      deep1064: t('laser.vascular.detail.dualWavelength.deep1064'),
      alexandrite: {
        title: t('laser.vascular.detail.dualWavelength.alexandrite.title'),
        points: [0, 1, 2].map(i => t(`laser.vascular.detail.dualWavelength.alexandrite.points.${i}`)),
      },
      ndyag: {
        title: t('laser.vascular.detail.dualWavelength.ndyag.title'),
        points: [0, 1, 2].map(i => t(`laser.vascular.detail.dualWavelength.ndyag.points.${i}`)),
      },
    },
    clarity: {
      title: t('laser.vascular.detail.clarity.title'),
      subtitle: t('laser.vascular.detail.clarity.subtitle'),
      badge: t('laser.vascular.detail.clarity.badge'),
      why: t('laser.vascular.detail.clarity.why'),
      whyDesc: t('laser.vascular.detail.clarity.whyDesc'),
      recommendedSessions: t('laser.vascular.detail.clarity.recommendedSessions'),
      benefits: [0, 1, 2, 3].map(i => ({
        title: t(`laser.vascular.detail.clarity.benefits.${i}.title`),
        desc: t(`laser.vascular.detail.clarity.benefits.${i}.desc`),
      })),
      duration: t('laser.vascular.detail.clarity.duration'),
      anesthesia: t('laser.vascular.detail.clarity.anesthesia'),
      recovery: t('laser.vascular.detail.clarity.recovery'),
    },
    protocol: {
      title: t('laser.vascular.detail.protocol.title'),
      mild: {
        level: t('laser.vascular.detail.protocol.mild.level'),
        description: t('laser.vascular.detail.protocol.mild.description'),
        sessions: t('laser.vascular.detail.protocol.mild.sessions'),
        interval: t('laser.vascular.detail.protocol.mild.interval'),
        treatment: t('laser.vascular.detail.protocol.mild.treatment'),
      },
      moderate: {
        level: t('laser.vascular.detail.protocol.moderate.level'),
        description: t('laser.vascular.detail.protocol.moderate.description'),
        sessions: t('laser.vascular.detail.protocol.moderate.sessions'),
        interval: t('laser.vascular.detail.protocol.moderate.interval'),
        treatment: t('laser.vascular.detail.protocol.moderate.treatment'),
      },
      severe: {
        level: t('laser.vascular.detail.protocol.severe.level'),
        description: t('laser.vascular.detail.protocol.severe.description'),
        sessions: t('laser.vascular.detail.protocol.severe.sessions'),
        interval: t('laser.vascular.detail.protocol.severe.interval'),
        treatment: t('laser.vascular.detail.protocol.severe.treatment'),
      },
    },
    idealFor: [0, 1, 2, 3, 4, 5].map(i => t(`laser.vascular.detail.idealFor.${i}`)),
    faq: [0, 1, 2, 3].map(i => ({
      q: t(`laser.vascular.detail.faq.${i}.q`),
      a: t(`laser.vascular.detail.faq.${i}.a`),
    })),
    cta: {
      title: t('laser.vascular.detail.cta.title'),
      description: t('laser.vascular.detail.cta.description'),
    },
  };

  // Translated laser categories for "other treatments" section
  const otherLaserCategories = LASER_CATEGORIES.filter(cat => cat.id !== 'vascular').map(cat => ({
    id: cat.id,
    href: cat.href,
    name: t(`laser.${cat.id}.name`),
  }));

  // FAQ 토글 시 스크롤
  const handleFaqToggle = useCallback((index: number, e: React.MouseEvent<HTMLElement>) => {
    const details = e.currentTarget.closest('details') as HTMLDetailsElement;
    if (!details) return;

    if (!details.open) {
      requestAnimationFrame(() => {
        const rect = details.getBoundingClientRect();
        const scrollOffset = 120;
        const scrollTop = window.scrollY + rect.top - scrollOffset;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      });
    }
  }, []);

  return (
    <main className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative min-h-70-dvh flex items-center justify-center overflow-hidden bg-gradient-to-b from-red-50 to-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link
                href="/laser"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('common.laserCenter')}
              </Link>

              <span
                className="inline-block px-4 py-2 text-sm font-medium rounded-full mb-6"
                style={{ backgroundColor: `${category.color}15`, color: category.color }}
              >
                {category.nameEn}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6"
            >
              {category.name}
              <span className="block text-2xl md:text-3xl mt-4 font-normal" style={{ color: category.color }}>
                {detail.hero.subtitle}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              {detail.hero.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 text-white font-medium rounded-full transition-colors"
                style={{ backgroundColor: category.color }}
              >
                {t('common.freeConsultation')}
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-8 py-4 border-2 font-medium rounded-full transition-colors"
                style={{ borderColor: category.color, color: category.color }}
              >
                {t('common.phoneConsultation')} 02-797-2773
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Price Table Section */}
      <PriceTable treatmentId="vascular" />

      {/* 홍조 유형별 치료 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.rednessTypes.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {detail.rednessTypes.subtitle}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {detail.rednessTypes.types.map((item, index) => (
              <RednessTypeCard
                key={index}
                type={item.type}
                description={item.description}
                treatment={item.treatment}
                icon={['🔥', '🩸', '💊', '⭕'][index]}
                recommendedLabel={detail.rednessTypes.recommendedTreatment}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 듀얼 파장 작용 원리 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.dualWavelength.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {detail.dualWavelength.subtitle}
            </p>
          </motion.div>

          <DualWavelengthIllustration labels={detail.dualWavelength} />

          <div className="max-w-3xl mx-auto mt-12 grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-50 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-700 mb-3">{detail.dualWavelength.alexandrite.title}</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {detail.dualWavelength.alexandrite.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-red-50 rounded-2xl">
              <h3 className="text-lg font-bold text-red-700 mb-3">{detail.dualWavelength.ndyag.title}</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {detail.dualWavelength.ndyag.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 클래리티 II 장비 소개 */}
      <section className="py-20 bg-red-50/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-full mb-4">
              {detail.clarity.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.clarity.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {detail.clarity.subtitle}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{detail.clarity.why}</h3>
                  <p className="text-gray-600 mb-6">
                    {detail.clarity.whyDesc}
                  </p>

                  <ul className="space-y-3">
                    {detail.clarity.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{benefit.title}</span>
                          <span className="text-gray-500"> - {benefit.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  {[
                    { label: t('common.duration'), value: detail.clarity.duration, icon: '⏱️' },
                    { label: t('common.anesthesia'), value: detail.clarity.anesthesia, icon: '💉' },
                    { label: t('common.downtime'), value: detail.clarity.recovery, icon: '🔄' },
                    { label: t('common.recommendedSessions'), value: detail.clarity.recommendedSessions, icon: '📅' },
                  ].map((info, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <div className="text-xs text-gray-500">{info.label}</div>
                        <div className="text-sm font-medium text-gray-900">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 치료 프로토콜 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.protocol.title}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { ...detail.protocol.mild, color: '#10B981' },
              { ...detail.protocol.moderate, color: '#F59E0B' },
              { ...detail.protocol.severe, color: '#EF4444' },
            ].map((protocol, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white rounded-2xl shadow-lg border-t-4"
                style={{ borderColor: protocol.color }}
              >
                <div
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
                  style={{ backgroundColor: `${protocol.color}15`, color: protocol.color }}
                >
                  {protocol.level}
                </div>
                <p className="text-gray-600 text-sm mb-4">{protocol.description}</p>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500">{t('common.recommendedTreatment')}</div>
                    <div className="text-lg font-semibold text-gray-900">{protocol.treatment}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">{t('common.recommendedSessions')}</div>
                      <div className="text-sm font-medium text-gray-900">{protocol.sessions}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('common.sessionInterval')}</div>
                      <div className="text-sm font-medium text-gray-900">{protocol.interval}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 이런 분께 추천 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {t('common.recommended')}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            {detail.idealFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {tCommon('faq')}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {detail.faq.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gray-50 rounded-xl overflow-hidden"
              >
                <summary
                  onClick={(e) => handleFaqToggle(index, e)}
                  className="flex items-center justify-between p-6 cursor-pointer list-none"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <span style={{ color: category.color }} className="transform group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">{faq.a}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: `linear-gradient(135deg, ${category.color}, #DC2626)` }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              {detail.cta.title}
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              {detail.cta.description}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-white font-medium rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: category.color }}
              >
                {t('common.onlineConsultation')}
              </Link>
              <a
                href="tel:02-797-2773"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-medium rounded-full hover:bg-white/10 transition-colors"
              >
                {t('common.phoneConsultation')} 02-797-2773
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Other laser categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-medium text-gray-900 text-center mb-8">{t('common.otherLaserTreatments')}</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {otherLaserCategories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="px-6 py-3 bg-white rounded-full text-gray-700 hover:shadow-md transition-all"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
