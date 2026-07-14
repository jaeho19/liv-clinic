'use client';

import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card } from '@/components/ui';
import { CORE_VALUES, CERTIFICATIONS } from '@/lib/constants';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Lottie 컴포넌트를 클라이언트 사이드에서만 로드
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Lottie 애니메이션 데이터
import aboutAnimation from '@/../public/lottie/about-01.json';

export default function AboutPage() {
  const locale = useLocale();
  const t = useTranslations('aboutPage');
  const sectionsT = useTranslations('sections');

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

      {/* Brand Philosophy */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              {/* ============================================ */}
              {/* 여기가 네모 박스 컴포넌트 - 이미지 + Lottie */}
              {/* ============================================ */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/10">
                {/* 배경 이미지 */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/about/lobby.jpg"
                    alt={t('philosophy.imageAlt')}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* 이미지 위 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 via-transparent to-transparent" />
                </div>

                {/* Lottie 애니메이션 - 우측 하단에 배치 */}
                <div className="absolute bottom-4 right-4 w-24 h-24 md:w-32 md:h-32 opacity-80">
                  <Lottie
                    animationData={aboutAnimation}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
              {/* ============================================ */}
              {/* 네모 박스 컴포넌트 끝 */}
              {/* ============================================ */}
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div>
                <p className="font-serif text-h3 text-primary mb-2">{t('philosophy.subtitle')}</p>
                <h2 className="text-h1 text-secondary mb-8">
                  {t('philosophy.title1')}
                  <br />
                  {t('philosophy.title2')}
                </h2>
                <div className="space-y-6 text-body text-mono leading-relaxed">
                  <p>{t('philosophy.description1')}</p>
                  <p>{t('philosophy.description2')}</p>
                  <p>{t('philosophy.description3')}</p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Brand Message */}
      <section className="py-32 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-4xl mx-auto text-center">
              <p className="font-serif text-6xl md:text-8xl mb-8 opacity-90">
                {t('brandMessage.title')}
              </p>
              <p className="text-h3 opacity-80 leading-relaxed">
                {t('brandMessage.description1')}
                <br />
                {t('brandMessage.description2')}
                <br />
                {t('brandMessage.description3')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Core Values */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{t('coreValues.subtitle')}</p>
              <h2 className="text-h1 text-secondary">{t('coreValues.title')}</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CORE_VALUES.map((value, index) => (
              <StaggerItem key={value.id}>
                <Card padding="none" className="h-full overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={value.image}
                      alt={sectionsT(`values.${value.id}.subtitle`)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-primary mb-1">
                      {sectionsT(`values.${value.id}.title`)}
                    </h3>
                    <p className="text-h4 text-secondary mb-3">{sectionsT(`values.${value.id}.subtitle`)}</p>
                    <p className="text-body text-mono-light">{sectionsT(`values.${value.id}.description`)}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Certifications */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">{t('certifications.subtitle')}</p>
              <h2 className="text-h1 text-secondary">{t('certifications.title')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {CERTIFICATIONS.map((cert) => {
              // ko는 국문명(제목) + 영문명(보조) 2줄, 그 외 로케일은 영문명만 1줄로 노출한다.
              const certName = locale === 'ko' ? cert.name : cert.nameEn;

              return (
                <AnimateOnScroll key={cert.id}>
                  <div
                    onClick={() => window.open(cert.link, '_blank')}
                    className="cursor-pointer"
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && window.open(cert.link, '_blank')}
                  >
                    <Card padding="lg" className="text-center h-full hover:border-primary/30 hover:shadow-lg transition-all">
                      <div className="w-full h-20 mx-auto mb-6 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cert.logo}
                          alt={certName}
                          className={`object-contain hover:scale-105 transition-transform ${cert.id === "ulthera" ? "w-56" : "w-48"}`}
                        />
                      </div>
                      <h3 className="text-h4 text-secondary mb-2">{certName}</h3>
                      {locale === 'ko' && (
                        <p className="text-body text-mono-light">{cert.nameEn}</p>
                      )}
                    </Card>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <Link href="/about/equipment">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {t('quickLinks.equipment.title')}
                    </h3>
                    <p className="text-body text-mono-light">{t('quickLinks.equipment.subtitle')}</p>
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
