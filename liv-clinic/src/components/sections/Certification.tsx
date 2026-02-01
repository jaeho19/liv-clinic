'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';

export default function Certification() {
  const t = useTranslations('sections.certification');

  const certifications = [
    {
      id: 'ulthera',
      name: t('ulthera'),
      nameEn: t('ultheraEn'),
      description: t('ultheraDesc'),
      logo: '/images/certifications/ulthera.png',
      link: 'https://merz.co.kr/',
      logoWidth: 'w-56',
    },
    {
      id: 'thermage',
      name: t('thermage'),
      nameEn: t('thermageEn'),
      description: t('thermageDesc'),
      logo: '/images/certifications/thermage.png',
      link: 'https://www.thermage.co.kr/',
      logoWidth: 'w-48',
    },
    {
      id: 'density',
      name: t('density'),
      nameEn: t('densityEn'),
      description: t('densityDesc'),
      logo: '/images/certifications/density.png',
      link: 'https://densityrf.com/kr/',
      logoWidth: 'w-44',
    },
    {
      id: 'potenza',
      name: t('potenza'),
      nameEn: t('potenzaEn'),
      description: t('potenzaDesc'),
      logo: '/images/certifications/potenza.png',
      link: 'https://www.potenza.co.kr/kr/',
      logoWidth: 'w-44',
    },
    {
      id: 'sculptra',
      name: t('sculptra'),
      nameEn: t('sculptraEn'),
      description: t('sculptraDesc'),
      logo: '/images/certifications/sculptra.png',
      link: 'https://sculptra.co.kr/',
      logoWidth: 'w-48',
    },
    {
      id: 'juvelook',
      name: t('juvelook'),
      nameEn: t('juvelookEn'),
      description: t('juvelookDesc'),
      logo: '/images/certifications/juvelook.png',
      link: 'https://juvelook.cafe24.com/',
      logoWidth: 'w-44',
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center mb-8 md:mb-12">
            <p className="text-small text-primary tracking-widest uppercase mb-2">
              Official Partner
            </p>
            <h2 className="text-h2 text-secondary">{t('title')}</h2>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto">
          {certifications.map((cert) => (
            <AnimateOnScroll key={cert.id}>
              <motion.a
                href={cert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group cursor-pointer h-full block no-underline"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-background rounded-xl md:rounded-2xl p-4 md:p-6 text-center h-full border border-transparent group-hover:border-primary/20 group-hover:shadow-lg transition-all flex flex-col">
                  {/* Logo Image */}
                  <div className="relative w-full h-20 mb-5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cert.logo}
                      alt={cert.name}
                      className={`object-contain group-hover:scale-105 transition-transform ${cert.logoWidth}`}
                    />
                  </div>

                  {/* Name */}
                  <h3 className="text-h4 text-secondary mb-1 group-hover:underline group-hover:decoration-primary/40 group-hover:underline-offset-4 transition-all">{cert.name}</h3>

                  {/* English Name */}
                  <p className="text-small text-mono-light mb-2">{cert.nameEn}</p>

                  {/* Description */}
                  <p className="text-body text-mono">{cert.description}</p>

                  {/* Visit Official Site */}
                  <span className="inline-flex items-center justify-center gap-1.5 text-small text-primary mt-4 group-hover:gap-2 transition-all">
                    공식 사이트 방문
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>

                  {/* Badge decoration */}
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </motion.a>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
