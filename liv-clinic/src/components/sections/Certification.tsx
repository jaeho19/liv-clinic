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
      link: 'https://clasys.com/',
      logoWidth: 'w-44',
    },
    {
      id: 'potenza',
      name: t('potenza'),
      nameEn: t('potenzaEn'),
      description: t('potenzaDesc'),
      logo: '/images/certifications/potenza.png',
      link: 'https://www.cynosure.co.kr/',
      logoWidth: 'w-44',
    },
    {
      id: 'sculptra',
      name: t('sculptra'),
      nameEn: t('sculptraEn'),
      description: t('sculptraDesc'),
      logo: '/images/certifications/sculptra.png',
      link: 'https://www.galderma.com/kr',
      logoWidth: 'w-48',
    },
    {
      id: 'juvelook',
      name: t('juvelook'),
      nameEn: t('juvelookEn'),
      description: t('juvelookDesc'),
      logo: '/images/certifications/juvelook.png',
      link: 'https://www.pharmaresearch.co.kr/',
      logoWidth: 'w-44',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <p className="text-small text-primary tracking-widest uppercase mb-2">
              Official Partner
            </p>
            <h2 className="text-h2 text-secondary">{t('title')}</h2>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {certifications.map((cert) => (
            <AnimateOnScroll key={cert.id}>
              <motion.div
                className="relative group cursor-pointer h-full"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                onClick={() => window.open(cert.link, '_blank')}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && window.open(cert.link, '_blank')}
              >
                <div className="bg-background rounded-2xl p-6 text-center h-full border border-transparent hover:border-primary/20 hover:shadow-lg transition-all flex flex-col">
                  {/* Logo Image */}
                  <div className="relative w-full h-20 mb-5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cert.logo}
                      alt={cert.name}
                      className={`object-contain hover:scale-105 transition-transform ${cert.logoWidth}`}
                    />
                  </div>

                  {/* Name */}
                  <h3 className="text-h4 text-secondary mb-1">{cert.name}</h3>

                  {/* English Name */}
                  <p className="text-small text-mono-light mb-2">{cert.nameEn}</p>

                  {/* Description */}
                  <p className="text-body text-mono mt-auto">{cert.description}</p>

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
              </motion.div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
