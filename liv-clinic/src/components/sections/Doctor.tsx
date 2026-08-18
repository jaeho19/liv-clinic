'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button } from '@/components/ui';
import { SOCIAL_LINKS } from '@/lib/constants';
import { trackDoctorView, trackSocialClick } from '@/lib/analytics-events';

// 대표 유튜브 영상 (제목은 다국어 메시지에서 조회)
const FEATURED_VIDEO = {
  id: 'J2ZiPnsORRw',
  thumbnail: 'https://img.youtube.com/vi/J2ZiPnsORRw/maxresdefault.jpg',
};

const doctorConfig = {
  image: '/images/doctor/doctor-main.jpg',
  internationalImages: [
    { src: '/images/aptos/certification-ceremony.jpg', activityIndex: 0 },
    { src: '/images/aptos/presentation-mips.jpg', activityIndex: 1 },
    { src: '/images/aptos/presentation.jpg', activityIndex: 2 },
  ],
};

export default function Doctor() {
  const t = useTranslations('sections.doctor');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const featuredVideoTitle = t('featuredVideoTitle');

  // 번역된 의사 데이터 생성
  const doctor = {
    name: t('name'),
    nameEn: t('nameEn'),
    title: t('directorTitle'),
    titleEn: t('directorTitleEn'),
    specialty: t('specialty'),
    philosophy: t('philosophy'),
    credentials: t.raw('credentialsList') as string[],
  };

  // 국제 활동 데이터
  const activities = t.raw('activities') as Array<{ caption: string; location: string }>;

  return (
    <section className="section-gap bg-white overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Image */}
          <AnimateOnScroll animation="slideInLeft">
            <div className="relative">
              {/* Main Image */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/30">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${doctorConfig.image})` }}
                />
                {/* Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="font-serif text-2xl">Doctor Photo</p>
                  </div>
                </div>
              </div>

              {/* Decorative elements - 모바일에서 숨김 (오버플로우 방지) */}
              <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-primary/20 rounded-2xl hidden md:block" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10 hidden md:block" />

              {/* Certification badges */}
              <motion.div
                className="absolute right-2 sm:-right-4 bottom-28 sm:bottom-32 bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-5"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-mono-light">{t('certifications.official')}</p>
                    <p className="text-sm font-medium text-secondary">{t('certifications.ultheraThermage')}</p>
                  </div>
                </div>
              </motion.div>

              {/* APTOS Global Expert badge */}
              <motion.div
                className="absolute right-2 sm:-right-4 bottom-4 sm:bottom-8 bg-gradient-to-r from-secondary to-primary rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-5"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/80">{t('certifications.globalExpert')}</p>
                    <p className="text-sm font-medium text-white">{t('certifications.aptosCertified')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimateOnScroll>

          {/* Content */}
          <AnimateOnScroll animation="slideInRight">
            <div>
              {/* Section Title */}
              <motion.p
                className="font-serif text-h3 text-primary mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
              >
                {t('title')}
              </motion.p>
              <motion.h2
                className="text-h1 text-secondary mb-4 md:mb-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
              >
                {t('subtitle')}
              </motion.h2>

              {/* Doctor Info */}
              <div className="mb-5 md:mb-8">
                <h3 className="text-h2 text-secondary mb-1">{doctor.name}</h3>
                <p className="font-serif text-xl text-mono-light mb-2">{doctor.nameEn}</p>
                <p className="text-body text-primary font-medium">{doctor.title}</p>
              </div>

              {/* Philosophy */}
              <blockquote className="relative pl-6 border-l-4 border-primary mb-6 md:mb-10">
                <p className="text-h4 text-mono italic leading-relaxed">
                  "{doctor.philosophy}"
                </p>
              </blockquote>

              {/* Credentials */}
              <div className="mb-5 md:mb-8">
                <h4 className="text-h4 text-secondary mb-3 md:mb-4">{t('credentials')}</h4>
                <ul className="space-y-2">
                  {doctor.credentials.map((credential, index) => (
                    <li key={index} className="flex items-center gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {credential}
                    </li>
                  ))}
                </ul>
              </div>

              {/* International Activities Mini Gallery */}
              <div className="mb-6 md:mb-10">
                <h4 className="text-h4 text-secondary mb-3 md:mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('internationalActivities')}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {doctorConfig.internationalImages.map((item, index) => (
                    <motion.div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url(${item.src})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs font-medium text-white leading-tight">{activities[item.activityIndex].caption}</p>
                        <p className="text-[10px] text-white/70">{activities[item.activityIndex].location}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Link href="/about/staff" onClick={() => trackDoctorView('staff_page')}>
                <Button variant="outline" size="lg">
                  {t('viewStaff')}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>

        {/* YouTube Video Section */}
        <AnimateOnScroll>
          <div className="mt-12 md:mt-20 pt-10 md:pt-16 border-t border-border">
            <div className="text-center mb-10">
              <p className="font-serif text-h3 text-primary mb-2">{t('youtube.title')}</p>
              <h3 className="text-h2 text-secondary">{t('youtube.subtitle')}</h3>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Video Container */}
              <motion.div
                className="relative aspect-video rounded-2xl overflow-hidden bg-secondary/10 shadow-lg"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                {isVideoPlaying ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${FEATURED_VIDEO.id}?autoplay=1&rel=0`}
                    title={featuredVideoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className="absolute inset-0 w-full h-full group cursor-pointer"
                    aria-label={t('ui.playVideo')}
                  >
                    {/* Thumbnail Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${FEATURED_VIDEO.thumbnail})` }}
                    />
                    {/* Fallback Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/50" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:bg-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </motion.div>
                      <p className="mt-4 text-white text-body font-medium text-shadow">
                        {featuredVideoTitle}
                      </p>
                    </div>

                    {/* YouTube Logo Badge */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      <span className="text-white text-sm font-medium">YouTube</span>
                    </div>
                  </button>
                )}
              </motion.div>

              {/* Channel Link */}
              <div className="mt-8 text-center">
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSocialClick('youtube')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  {t('youtube.subscribe')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="mt-3 text-small text-mono-light">
                  {t('youtube.description')}
                </p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
