'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ScrollLink } from '@/components/ui';
import { SOCIAL_LINKS } from '@/lib/constants';
import { getAvailabilityStatus } from '@/lib/availability';

export default function TrustBlock() {
  const t = useTranslations('trust');
  const [availability, setAvailability] = useState(() => getAvailabilityStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setAvailability(getAvailabilityStatus());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const trustItems = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: t('certification.title'),
      subtitle: t('certification.subtitle'),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: t('doctor.title'),
      subtitle: t('doctor.subtitle'),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: t('location.title'),
      subtitle: t('location.subtitle'),
    },
  ];

  return (
    <section className="py-8 md:py-12 bg-white border-b border-border">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Availability Indicator */}
          <div className="flex justify-center mb-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                availability.isOpen
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {availability.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    availability.isOpen
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`}
                />
              </span>
              <span>{availability.message}</span>
            </div>
          </div>

          {/* Trust Items */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
            {trustItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="text-primary mb-2 md:mb-3 flex justify-center">
                  {item.icon}
                </div>
                <h3 className="text-sm md:text-base font-medium text-secondary mb-0.5 md:mb-1">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-mono-light">
                  {item.subtitle}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6 md:mb-8" />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <ScrollLink
              href="/contact"
              className="btn-primary text-center py-3 px-8 text-sm md:text-base"
            >
              {t('cta.consultation')}
            </ScrollLink>
            <a
              href={SOCIAL_LINKS.kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-8 bg-[#FAE100] text-[#3C1E1E] rounded-lg text-sm md:text-base font-medium hover:bg-[#E5CC00] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.89 5.35 4.72 6.77-.15.53-.5 1.9-.57 2.2-.09.38.14.38.3.27.12-.08 1.87-1.27 2.63-1.78.62.09 1.26.14 1.92.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
              {t('cta.kakao')}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
