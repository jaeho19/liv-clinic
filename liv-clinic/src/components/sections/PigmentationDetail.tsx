'use client';

import { useTranslations } from 'next-intl';
import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { TREATMENTS, LASER_CATEGORIES } from '@/lib/constants';
import { PriceTable } from '@/components/ui';

const category = LASER_CATEGORIES[0]; // pigmentation
const clarityData = TREATMENTS.laser.clarity;
const lucasData = TREATMENTS.laser.lucas;
const toningData = TREATMENTS.laser.toning;
const ulblancData = TREATMENTS.laser.ulblanc;

// 피코초 vs 나노초 비교 일러스트
interface PicoVsNanoProps {
  labels: {
    nanosecond: string;
    picosecond: string;
    nanosecondUnit: string;
    picosecondUnit: string;
    largeParticles: string;
    slowDischarge: string;
    fineParticles: string;
    fastDischarge: string;
    timesFaster: string;
  };
}

const PicoVsNanoIllustration = ({ labels }: PicoVsNanoProps) => (
  <div className="relative w-full max-w-2xl mx-auto">
    <svg viewBox="0 0 600 300" className="w-full h-auto">
      <defs>
        <linearGradient id="picoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="nanoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>

      {/* 나노초 (왼쪽) */}
      <g>
        <rect x="30" y="40" width="240" height="220" rx="15" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
        <text x="150" y="75" textAnchor="middle" fill="#6B7280" fontSize="14" fontWeight="600">{labels.nanosecond}</text>
        <text x="150" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="11">{labels.nanosecondUnit}</text>

        {/* 큰 색소 입자들 */}
        <circle cx="100" cy="160" r="20" fill="#92400E" />
        <circle cx="150" cy="150" r="18" fill="#78350F" />
        <circle cx="200" cy="165" r="22" fill="#92400E" />

        <text x="150" y="220" textAnchor="middle" fill="#6B7280" fontSize="10">{labels.largeParticles}</text>
        <text x="150" y="240" textAnchor="middle" fill="#9CA3AF" fontSize="9">{labels.slowDischarge}</text>
      </g>

      {/* 피코초 (오른쪽) */}
      <g>
        <rect x="330" y="40" width="240" height="220" rx="15" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="2" />
        <text x="450" y="75" textAnchor="middle" fill="#7C3AED" fontSize="14" fontWeight="600">{labels.picosecond}</text>
        <text x="450" y="95" textAnchor="middle" fill="#A78BFA" fontSize="11">{labels.picosecondUnit}</text>

        {/* 미세하게 분해된 색소 입자들 */}
        {[...Array(25)].map((_, i) => (
          <motion.circle
            key={i}
            cx={380 + (i % 5) * 35 + Math.random() * 10}
            cy={130 + Math.floor(i / 5) * 25 + Math.random() * 10}
            r="5"
            fill="#D97706"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          />
        ))}

        <text x="450" y="220" textAnchor="middle" fill="#7C3AED" fontSize="10">{labels.fineParticles}</text>
        <text x="450" y="240" textAnchor="middle" fill="#A78BFA" fontSize="9">{labels.fastDischarge}</text>
      </g>

      {/* 중앙 화살표 */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <path d="M280 150 L320 150" stroke="#8B5CF6" strokeWidth="3" markerEnd="url(#arrowhead)" />
        <text x="300" y="140" textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="600">{labels.timesFaster}</text>
      </motion.g>
    </svg>
  </div>
);

// 3단계 치료 시스템 일러스트
interface StageData {
  stage: string;
  title: string;
  equipment: string;
  description: string;
}

interface ThreeStageProps {
  stages: StageData[];
}

const ThreeStageSystemIllustration = ({ stages }: ThreeStageProps) => {
  const colors = ['#8B5CF6', '#10B981', '#F59E0B'];
  const icons = ['⚡', '🎯', '🔄'];

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="grid md:grid-cols-3 gap-6">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="relative p-6 bg-white rounded-2xl shadow-lg border-2"
            style={{ borderColor: colors[index] }}
          >
            {/* 연결선 */}
            {index < 2 && (
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5" style={{ backgroundColor: colors[index] }} />
            )}

            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${colors[index]}20` }}
            >
              {icons[index]}
            </div>
            <div className="text-sm font-medium mb-1" style={{ color: colors[index] }}>
              {stage.stage}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{stage.title}</h3>
            <div className="text-sm font-medium text-gray-700 mb-2">{stage.equipment}</div>
            <p className="text-sm text-gray-500">{stage.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 장비 카드 컴포넌트
interface EquipmentData {
  name: string;
  nameEn: string;
  tagline: string;
  benefits: readonly { readonly title: string; readonly desc: string }[];
  duration: string;
  recovery: string;
  results: string;
}

const EquipmentCard = ({
  equipment,
  isFeatured = false,
  color
}: {
  equipment: EquipmentData;
  isFeatured?: boolean;
  color: string;
}) => {
  const tUi = useTranslations('treatments.laser.pigmentation.ui');
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`relative p-6 rounded-2xl ${isFeatured ? 'bg-white shadow-xl border-2' : 'bg-gray-50'}`}
    style={{ borderColor: isFeatured ? color : 'transparent' }}
  >
    {isFeatured && (
      <span
        className="absolute -top-3 left-6 px-3 py-1 text-xs font-bold text-white rounded-full"
        style={{ backgroundColor: color }}
      >
        FEATURED
      </span>
    )}

    <div className="flex items-start gap-4">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <svg className="w-7 h-7" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900">{equipment.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{equipment.nameEn}</p>
        <p className="text-sm text-gray-600 mb-4">{equipment.tagline}</p>

        <div className="space-y-2">
          {equipment.benefits.slice(0, 3).map((benefit, i) => (
            <div key={i} className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}20` }}
              >
                <svg className="w-3 h-3" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">{benefit.title}</span>
                <span className="text-sm text-gray-500"> - {benefit.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
      <div>
        <div className="text-xs text-gray-500">{tUi('duration')}</div>
        <div className="text-sm font-medium text-gray-900">{equipment.duration}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">{tUi('downtime')}</div>
        <div className="text-sm font-medium text-gray-900">{equipment.recovery}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">{tUi('recommendedSessions')}</div>
        <div className="text-sm font-medium text-gray-900">{equipment.results.split(',')[0]}</div>
      </div>
    </div>
  </motion.div>
  );
};

export default function PigmentationDetail() {
  const t = useTranslations('treatments');
  const tCommon = useTranslations('common');
  const faqRefs = useRef<Map<number, HTMLDetailsElement>>(new Map());

  // 번역된 데이터 가져오기
  const detail = {
    hero: {
      subtitle: t('laser.pigmentation.detail.hero.subtitle'),
      description: t('laser.pigmentation.detail.hero.description'),
    },
    threeStageSystem: {
      title: t('laser.pigmentation.detail.threeStageSystem.title'),
      subtitle: t('laser.pigmentation.detail.threeStageSystem.subtitle'),
      stages: [0, 1, 2].map(i => ({
        stage: t(`laser.pigmentation.detail.threeStageSystem.stages.${i}.stage`),
        title: t(`laser.pigmentation.detail.threeStageSystem.stages.${i}.title`),
        equipment: t(`laser.pigmentation.detail.threeStageSystem.stages.${i}.equipment`),
        description: t(`laser.pigmentation.detail.threeStageSystem.stages.${i}.description`),
      })),
    },
    picoVsNano: {
      title: t('laser.pigmentation.detail.picoVsNano.title'),
      subtitle: t('laser.pigmentation.detail.picoVsNano.subtitle'),
      nanosecond: t('laser.pigmentation.detail.picoVsNano.nanosecond'),
      picosecond: t('laser.pigmentation.detail.picoVsNano.picosecond'),
      nanosecondUnit: t('laser.pigmentation.detail.picoVsNano.nanosecondUnit'),
      picosecondUnit: t('laser.pigmentation.detail.picoVsNano.picosecondUnit'),
      largeParticles: t('laser.pigmentation.detail.picoVsNano.largeParticles'),
      slowDischarge: t('laser.pigmentation.detail.picoVsNano.slowDischarge'),
      fineParticles: t('laser.pigmentation.detail.picoVsNano.fineParticles'),
      fastDischarge: t('laser.pigmentation.detail.picoVsNano.fastDischarge'),
      timesFaster: t('laser.pigmentation.detail.picoVsNano.timesFaster'),
      comparison: {
        item: t('laser.pigmentation.detail.picoVsNano.comparison.item'),
        pulseSpeed: t('laser.pigmentation.detail.picoVsNano.comparison.pulseSpeed'),
        particleSize: t('laser.pigmentation.detail.picoVsNano.comparison.particleSize'),
        tissueDamage: t('laser.pigmentation.detail.picoVsNano.comparison.tissueDamage'),
        heatDamage: t('laser.pigmentation.detail.picoVsNano.comparison.heatDamage'),
        downtime: t('laser.pigmentation.detail.picoVsNano.comparison.downtime'),
        sessions: t('laser.pigmentation.detail.picoVsNano.comparison.sessions'),
        relativeLarge: t('laser.pigmentation.detail.picoVsNano.comparison.relativeLarge'),
        fine: t('laser.pigmentation.detail.picoVsNano.comparison.fine'),
        exists: t('laser.pigmentation.detail.picoVsNano.comparison.exists'),
        minimal: t('laser.pigmentation.detail.picoVsNano.comparison.minimal'),
        almostNone: t('laser.pigmentation.detail.picoVsNano.comparison.almostNone'),
        relativeLong: t('laser.pigmentation.detail.picoVsNano.comparison.relativeLong'),
        short: t('laser.pigmentation.detail.picoVsNano.comparison.short'),
        many: t('laser.pigmentation.detail.picoVsNano.comparison.many'),
        few: t('laser.pigmentation.detail.picoVsNano.comparison.few'),
      },
    },
    equipment: {
      title: t('laser.pigmentation.detail.equipment.title'),
      subtitle: t('laser.pigmentation.detail.equipment.subtitle'),
      featured: t('laser.pigmentation.detail.equipment.featured'),
    },
    protocol: {
      title: t('laser.pigmentation.detail.protocol.title'),
      mild: {
        level: t('laser.pigmentation.detail.protocol.mild.level'),
        description: t('laser.pigmentation.detail.protocol.mild.description'),
        treatment: t('laser.pigmentation.detail.protocol.mild.treatment'),
        sessions: t('laser.pigmentation.detail.protocol.mild.sessions'),
        interval: t('laser.pigmentation.detail.protocol.mild.interval'),
      },
      moderate: {
        level: t('laser.pigmentation.detail.protocol.moderate.level'),
        description: t('laser.pigmentation.detail.protocol.moderate.description'),
        treatment: t('laser.pigmentation.detail.protocol.moderate.treatment'),
        sessions: t('laser.pigmentation.detail.protocol.moderate.sessions'),
        interval: t('laser.pigmentation.detail.protocol.moderate.interval'),
      },
      severe: {
        level: t('laser.pigmentation.detail.protocol.severe.level'),
        description: t('laser.pigmentation.detail.protocol.severe.description'),
        treatment: t('laser.pigmentation.detail.protocol.severe.treatment'),
        sessions: t('laser.pigmentation.detail.protocol.severe.sessions'),
        interval: t('laser.pigmentation.detail.protocol.severe.interval'),
      },
    },
    idealFor: [0, 1, 2, 3, 4, 5].map(i => t(`laser.pigmentation.detail.idealFor.${i}`)),
    faq: [0, 1, 2, 3].map(i => ({
      q: t(`laser.pigmentation.detail.faq.${i}.q`),
      a: t(`laser.pigmentation.detail.faq.${i}.a`),
    })),
    cta: {
      title: t('laser.pigmentation.detail.cta.title'),
      description: t('laser.pigmentation.detail.cta.description'),
    },
  };

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
      <section className="relative min-h-70-dvh flex items-center justify-center overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-amber-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
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
      <PriceTable treatmentId="pigmentation" />

      {/* 3단계 치료 시스템 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.threeStageSystem.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {detail.threeStageSystem.subtitle}
            </p>
          </motion.div>

          <ThreeStageSystemIllustration stages={detail.threeStageSystem.stages} />
        </div>
      </section>

      {/* 피코초 vs 나노초 비교 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.picoVsNano.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {detail.picoVsNano.subtitle}
            </p>
          </motion.div>

          <PicoVsNanoIllustration labels={detail.picoVsNano} />

          {/* 비교 테이블 */}
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{detail.picoVsNano.comparison.item}</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-400">{detail.picoVsNano.nanosecond}</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-purple-600">{detail.picoVsNano.picosecond}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { item: detail.picoVsNano.comparison.pulseSpeed, nano: detail.picoVsNano.nanosecondUnit, pico: detail.picoVsNano.picosecondUnit },
                    { item: detail.picoVsNano.comparison.particleSize, nano: detail.picoVsNano.comparison.relativeLarge, pico: detail.picoVsNano.comparison.fine },
                    { item: detail.picoVsNano.comparison.tissueDamage, nano: detail.picoVsNano.comparison.exists, pico: detail.picoVsNano.comparison.minimal },
                    { item: detail.picoVsNano.comparison.heatDamage, nano: detail.picoVsNano.comparison.exists, pico: detail.picoVsNano.comparison.almostNone },
                    { item: detail.picoVsNano.comparison.downtime, nano: detail.picoVsNano.comparison.relativeLong, pico: detail.picoVsNano.comparison.short },
                    { item: detail.picoVsNano.comparison.sessions, nano: detail.picoVsNano.comparison.many, pico: detail.picoVsNano.comparison.few },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.item}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">{row.nano}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-purple-600">{row.pico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 추천 장비 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              {detail.equipment.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {detail.equipment.subtitle}
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Featured: 루카스 레이저 */}
            <EquipmentCard
              equipment={lucasData}
              isFeatured={true}
              color="#8B5CF6"
            />

            {/* 클래리티 II */}
            <EquipmentCard
              equipment={clarityData}
              color="#10B981"
            />

            <div className="grid md:grid-cols-2 gap-6">
              {/* 레이저 토닝 */}
              <EquipmentCard
                equipment={toningData}
                color="#F59E0B"
              />

              {/* 울블랑 */}
              <EquipmentCard
                equipment={ulblancData}
                color="#EC4899"
              />
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
              { ...detail.protocol.severe, color: '#8B5CF6' },
            ].map((protocol, index) => (
              <motion.div
                key={protocol.level}
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
      <section className="py-20 bg-amber-50/30">
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
              {t('common.faq')}
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
      <section className="py-20" style={{ background: `linear-gradient(135deg, ${category.color}, #8B5CF6)` }}>
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

      {/* 다른 레이저 카테고리 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-medium text-gray-900 text-center mb-8">{t('common.otherLaserTreatments')}</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {LASER_CATEGORIES.filter(cat => cat.id !== 'pigmentation').map((cat) => (
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
