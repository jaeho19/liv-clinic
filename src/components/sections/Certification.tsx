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
      nameEn: 'Ultherapy Prime Certified',
      description: 'FDA 승인 HIFU 리프팅',
      logo: '/images/certifications/ulthera.png',
      link: 'https://merz.co.kr/',
    },
    {
      id: 'thermage',
      name: t('thermage'),
      nameEn: 'Thermage FLX Partner',
      description: 'Solta Medical 공식 파트너',
      logo: '/images/certifications/thermage.png',
      link: 'https://www.thermage.co.kr/',
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {certifications.map((cert) => (
            <AnimateOnScroll key={cert.id}>
              <motion.div
                className="relative group cursor-pointer"
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                onClick={() => window.open(cert.link, '_blank')}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && window.open(cert.link, '_blank')}
              >
                <div className="bg-background rounded-2xl p-8 text-center h-full border border-transparent hover:border-primary/20 hover:shadow-lg transition-all">
                  {/* Logo Image */}
                  <div className="relative w-full h-24 mb-6 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cert.logo}
                      alt={cert.name}
                      className={`object-contain hover:scale-105 transition-transform ${cert.id === "ulthera" ? "w-56" : "w-48"}`}
                    />
                  </div>

                  {/* Name */}
                  <h3 className="text-h4 text-secondary mb-2">{cert.name}</h3>

                  {/* English Name */}
                  <p className="text-small text-mono-light mb-3">{cert.nameEn}</p>

                  {/* Description */}
                  <p className="text-body text-mono">{cert.description}</p>

                  {/* Badge decoration */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-primary"
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
