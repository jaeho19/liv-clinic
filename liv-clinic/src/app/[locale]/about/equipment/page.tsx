'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink } from '@/components/ui';
import { Certification } from '@/components/sections';

// 처리된 이미지 경로 (1000x1000 투명 배경 PNG)
const PROCESSED_IMAGE_PATH = '/images/equipment/processed';

// Equipment IDs for each category (used to look up translations)
const EQUIPMENT_CATEGORIES = [
  {
    id: 'lifting',
    equipmentIds: ['ultherapy', 'thermage', 'density', 'shurink', 'inmode', 'onda'],
  },
  {
    id: 'laser',
    equipmentIds: ['potenza', 'clarity', 'lucas', 'co2', 'ulblanc'],
  },
  {
    id: 'diagnostic',
    equipmentIds: ['markvu'],
  },
];

// Equipment image paths
const EQUIPMENT_IMAGES: Record<string, string> = {
  ultherapy: `${PROCESSED_IMAGE_PATH}/equipment_ultherapy.png`,
  thermage: `${PROCESSED_IMAGE_PATH}/equipment_thermage.png`,
  density: `${PROCESSED_IMAGE_PATH}/equipment_density.png`,
  shurink: `${PROCESSED_IMAGE_PATH}/equipment_shurink.png`,
  inmode: `${PROCESSED_IMAGE_PATH}/equipment_inmode.png`,
  onda: `${PROCESSED_IMAGE_PATH}/equipment_onda.png`,
  potenza: `${PROCESSED_IMAGE_PATH}/equipment_potenza.png`,
  clarity: `${PROCESSED_IMAGE_PATH}/equipment_clarity.png`,
  lucas: '/images/000.jpg',
  co2: `${PROCESSED_IMAGE_PATH}/equipment_co2.png`,
  ulblanc: `${PROCESSED_IMAGE_PATH}/equipment_ulblanc.png`,
  markvu: '/images/official/Gemini_Generated_Image_4vgw774vgw774vgw.png',
};

export default function EquipmentPage() {
  const t = useTranslations('equipmentPage');

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">{t('hero.subtitle')}</p>
              <h1 className="text-display text-secondary mb-6">{t('hero.title')}</h1>
              <p className="text-h4 text-mono leading-relaxed">
                {t('hero.description1')}
                <br />
                {t('hero.description2')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Official Certification Highlight */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="font-serif text-h3 text-primary mb-4">{t('certification.subtitle')}</p>
                <h2 className="text-h1 md:text-display text-secondary mb-6 leading-tight">
                  {t('certification.title1')}
                  <br />
                  <span className="text-primary">{t('certification.title2')}</span> {t('certification.titleHighlight')}
                </h2>
                <p className="text-h4 text-mono-light leading-relaxed max-w-2xl mx-auto">
                  {t('certification.description1')}
                  <br className="hidden md:block" />
                  {t('certification.description2')}
                </p>
              </motion.div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Official Partner - 공식 파트너 로고 */}
      <Certification />

      {/* Equipment Categories */}
      {EQUIPMENT_CATEGORIES.map((category, categoryIndex) => (
        <section
          key={category.id}
          className={`section-gap ${categoryIndex % 2 === 0 ? 'bg-background' : 'bg-white'}`}
        >
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-16">
                <p className="font-serif text-h3 text-primary mb-2">
                  {t(`categories.${category.id}.nameEn`)}
                </p>
                <h2 className="text-h1 text-secondary mb-4">
                  {t(`categories.${category.id}.name`)}
                </h2>
                <p className="text-body text-mono-light max-w-2xl mx-auto">
                  {t(`categories.${category.id}.description`)}
                </p>
              </div>
            </AnimateOnScroll>

            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {category.equipmentIds.map((equipmentId) => (
                <StaggerItem key={equipmentId}>
                  <Card id={equipmentId} padding="none" className="overflow-hidden h-full scroll-mt-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Image - 정사각형 비율 고정 (1:1), 배지 제거됨 */}
                      <div className="relative aspect-square bg-gradient-to-b from-gray-50/50 to-gray-100/50">
                        {EQUIPMENT_IMAGES[equipmentId] ? (
                          <Image
                            src={EQUIPMENT_IMAGES[equipmentId]}
                            alt={
                              t.has(`equipment.${equipmentId}.imageAlt`)
                                ? t(`equipment.${equipmentId}.imageAlt`)
                                : `${t(`equipment.${equipmentId}.nameKo`)} (${t(`equipment.${equipmentId}.name`)})`
                            }
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                            className="object-contain"
                            priority={category.id === 'lifting'}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-mono-light/50">
                              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <p className="font-serif">{t(`equipment.${equipmentId}.name`)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 lg:p-8 flex flex-col justify-between h-full">
                        <div>
                          <h3 className="font-serif text-2xl text-primary mb-1">
                            {t(`equipment.${equipmentId}.name`)}
                          </h3>
                          <p className="text-h4 text-secondary mb-2">
                            {t(`equipment.${equipmentId}.nameKo`)}
                          </p>

                          {/* 인증 정보 - 텍스트로 표시 */}
                          {t.has(`equipment.${equipmentId}.certification`) && (
                            <p className="text-small text-primary/80 mb-4">
                              {t(`equipment.${equipmentId}.certification`)}
                            </p>
                          )}

                          <p className="text-body text-mono mb-4">
                            {t(`equipment.${equipmentId}.description`)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {(t.raw(`equipment.${equipmentId}.features`) as string[]).map((feature: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-small text-mono-light">
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">{t('cta.title')}</h2>
              <p className="text-h4 opacity-80 mb-8">
                {t('cta.description')}
              </p>
              <div className="flex justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="primary" size="lg" className="bg-primary text-white hover:bg-secondary">
                    {t('cta.buttonPrimary')}
                  </Button>
                </ScrollLink>
                <Link href="/signature">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    {t('cta.buttonSecondary')}
                  </Button>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/about">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {t('quickLinks.brand.title')}
                    </h3>
                    <p className="text-body text-mono-light">{t('quickLinks.brand.subtitle')}</p>
                  </div>
                  <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Card>
            </Link>
            <Link href="/about/staff">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {t('quickLinks.staff.title')}
                    </h3>
                    <p className="text-body text-mono-light">{t('quickLinks.staff.subtitle')}</p>
                  </div>
                  <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Card>
            </Link>
            <Link href="/about/location">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {t('quickLinks.location.title')}
                    </h3>
                    <p className="text-body text-mono-light">{t('quickLinks.location.subtitle')}</p>
                  </div>
                  <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
