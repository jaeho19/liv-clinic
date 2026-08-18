'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem } from '@/components/ui';
import { trackCTAClick, trackConcernClick } from '@/lib/analytics-events';

/**
 * 고민별 진입 카드 — 장비가 아니라 고객 고민에서 출발하는 진료 경로 (홈 IA 개선).
 *
 * ⚠️ 의료광고 주의: 카피 수정 시 '최고/유일/완벽/부작용 없음/효과 보장' 등
 *    검증 불가 표현과 직접적인 연령 표기를 쓰지 않는다. 후기·전후사진·효과 표현은
 *    의료광고 사전심의 대상 — docs/02-design/features/marketing-attribution.design.md §6 참조.
 *
 * 안면거상·지방재배치는 전용 상세 페이지가 없어 상담(/contact)으로 연결한다
 * (페이지 신설 여부는 운영 결정 사항 — 최종 보고서 참조).
 */
const concernsConfig = [
  { id: 'sagging', href: '/lifting/aptos' },
  { id: 'elasticity', href: '/lifting' },
  { id: 'fundamental', href: '/contact' },
  { id: 'underEye', href: '/contact' },
  { id: 'texture', href: '/antiaging/skinbooster' },
] as const;

export default function ConcernPathways() {
  const t = useTranslations('sections.concerns');
  const tCommon = useTranslations('common');

  const concerns = concernsConfig.map((config) => ({
    ...config,
    title: t(`cards.${config.id}.title`),
    desc: t(`cards.${config.id}.desc`),
    tags: t(`cards.${config.id}.tags`),
    ctaLabel: config.href === '/contact' ? tCommon('consultation') : tCommon('learnMore'),
  }));

  return (
    <section className="section-gap bg-white">
      <div className="container-custom">
        {/* Section Header — 기존 섹션 헤더 관용구 유지 */}
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="text-center mb-8 md:mb-16">
            <motion.p
              className="font-serif text-xl md:text-h3 text-primary mb-1 md:mb-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            >
              {t('title')}
            </motion.p>
            <motion.h2
              className="text-2xl md:text-h1 text-secondary"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
            >
              {t('subtitle')}
            </motion.h2>
            <motion.p
              className="text-sm md:text-body text-mono-light mt-2 md:mt-4 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            >
              {t('description')}
            </motion.p>
          </div>
        </AnimateOnScroll>

        {/* 고민 카드 5종 */}
        <StaggerChildren
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5"
          staggerDelay={0.1}
        >
          {concerns.map((concern, index) => (
            <StaggerItem key={concern.id} variant="smooth">
              <motion.div
                className="group h-full"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              >
                <Link
                  href={concern.href}
                  onClick={() => trackConcernClick(concern.id, concern.href)}
                  className="relative flex h-full flex-col rounded-2xl border border-primary/15 bg-[#faf8f7] p-5 md:p-7 transition-all duration-500 hover:border-primary/40 hover:shadow-xl hover:bg-white"
                >
                  {/* Number — Signature 카드와 같은 세리프 넘버링 언어 */}
                  <span className="absolute top-4 right-5 font-serif text-3xl md:text-4xl text-primary/20 group-hover:text-primary/40 transition-colors duration-500">
                    0{index + 1}
                  </span>

                  <h3 className="card-title-ko text-lg md:text-xl text-secondary mb-2 pr-10">
                    {concern.title}
                  </h3>
                  <p className="text-sm text-mono leading-relaxed mb-4 flex-1">{concern.desc}</p>

                  {/* 대표 시술 */}
                  <p className="font-serif text-sm text-primary mb-4">{concern.tags}</p>

                  <span className="inline-flex items-center gap-2 text-sm font-medium text-secondary/80 group-hover:text-secondary group-hover:gap-3 transition-all">
                    {concern.ctaLabel}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* 국내/해외 진입 경로 */}
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 mt-3 md:mt-5" staggerDelay={0.12}>
          <StaggerItem variant="smooth">
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}>
              <Link
                href="/contact"
                onClick={() => trackCTAClick('concern_path_domestic', 'home_concern_section')}
                className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-secondary/95 p-6 md:p-8 text-white"
              >
                <p className="font-serif text-sm opacity-70 mb-1.5">Local Patients</p>
                <h3 className="card-title-ko text-xl md:text-2xl mb-2">{t('paths.domestic.title')}</h3>
                <p className="text-sm opacity-85 leading-relaxed mb-5 max-w-md">{t('paths.domestic.desc')}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium border-b border-white/50 pb-0.5 group-hover:gap-3 group-hover:border-white transition-all">
                  {t('paths.domestic.cta')}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          </StaggerItem>

          <StaggerItem variant="smooth">
            <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}>
              <Link
                href="/international"
                onClick={() => trackCTAClick('foreign_patient', 'home_concern_section')}
                className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-[#c4a99a]/90 to-[#6d5a4d]/95 p-6 md:p-8 text-white"
              >
                <p className="font-serif text-sm opacity-70 mb-1.5">International Patients</p>
                <h3 className="card-title-ko text-xl md:text-2xl mb-2">{t('paths.international.title')}</h3>
                <p className="text-sm opacity-85 leading-relaxed mb-5 max-w-md">{t('paths.international.desc')}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium border-b border-white/50 pb-0.5 group-hover:gap-3 group-hover:border-white transition-all">
                  {t('paths.international.cta')}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  );
}
