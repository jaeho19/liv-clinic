'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card, NaverMap } from '@/components/ui';
import { SITE_INFO, BUSINESS_HOURS } from '@/lib/constants';

export default function Location() {
  const t = useTranslations('sections.location');
  const tFooter = useTranslations('footer');

  return (
    <section className="section-gap bg-background">
      <div className="container-custom">
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="text-center mb-16">
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
              className="text-h1 text-secondary"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
              {t('subtitle')}
            </motion.h2>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map */}
          <AnimateOnScroll animation="slideInLeft">
            <div className="relative h-[280px] sm:h-[350px] lg:h-full min-h-[280px] lg:min-h-[400px] rounded-3xl overflow-hidden bg-mono-light/20">
              {/* Naver Maps */}
              <NaverMap
                lat={SITE_INFO.coordinates.lat}
                lng={SITE_INFO.coordinates.lng}
                zoom={17}
                className="absolute inset-0"
              />

              {/* Location badge */}
              <motion.div
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-white rounded-2xl shadow-lg p-3 sm:p-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-secondary text-sm sm:text-base">{t('subwayInfo')}</p>
                    <p className="text-xs sm:text-small text-mono-light">{t('walkMinutes')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimateOnScroll>

          {/* Info */}
          <AnimateOnScroll animation="slideInRight">
            <div className="space-y-6">
              {/* Address Card */}
              <Card padding="lg" hover={false}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-h4 text-secondary mb-2">{t('addressLabel')}</h3>
                    <p className="text-body text-mono mb-1">{t('address')}</p>
                    <p className="text-small text-mono-light">{t('buildingDetail')}</p>
                    <p className="text-small text-mono-light mt-2 leading-relaxed">
                      {t('directions')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Business Hours Card */}
              <Card padding="lg" hover={false}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h4 text-secondary mb-4">{tFooter('businessHours')}</h3>
                    <div className="space-y-2 text-body">
                      <div className="flex justify-between">
                        <span className="text-mono-light">{tFooter('weekday')}</span>
                        <span className="text-mono">{BUSINESS_HOURS.weekday.open} - {BUSINESS_HOURS.weekday.close}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mono-light">{tFooter('saturday')}</span>
                        <span className="text-mono">{BUSINESS_HOURS.saturday.open} - {BUSINESS_HOURS.saturday.close}</span>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <span className="text-primary font-medium">{t('holidayClosed')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact Card */}
              <Card padding="lg" hover={false}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-h4 text-secondary mb-2">{t('contactLabel')}</h3>
                    <a
                      href={`tel:${SITE_INFO.phone}`}
                      className="text-h3 text-primary hover:text-secondary transition-colors"
                    >
                      {SITE_INFO.phone}
                    </a>
                    <p className="text-small text-mono-light mt-1">
                      {t('consultTime')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Parking Info */}
              <Card padding="lg" hover={false}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-h4 text-secondary mb-2">{t('parkingLabel')}</h3>
                    <p className="text-body text-mono font-medium text-primary">{t('freeParking')}</p>
                    <p className="text-small text-mono-light mt-2 leading-relaxed">
                      {t('parkingDetail')}
                    </p>
                  </div>
                </div>
              </Card>

              {/* CTA */}
              <div className="flex gap-4 pt-4">
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(SITE_INFO.address.ko)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="lg" className="w-full">
                    {t('naverMap')}
                  </Button>
                </a>
                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(SITE_INFO.address.ko)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="lg" className="w-full">
                    {t('kakaoMap')}
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
