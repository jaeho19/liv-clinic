'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem } from '@/components/ui';

const programsConfig = [
  {
    id: 'lifting',
    href: '/lifting',
    image: '/images/signature/lifting.png',
    color: 'from-primary/80 to-secondary/90',
  },
  {
    id: 'antiaging',
    href: '/antiaging',
    image: '/images/signature/petit.png',
    color: 'from-[#c4a99a]/80 to-[#8b6b5d]/90',
  },
  {
    id: 'rejuvenation',
    href: '/laser',
    image: '/images/signature/care.png',
    color: 'from-[#a89080]/80 to-[#6d5a4d]/90',
  },
];

export default function Signature() {
  const t = useTranslations('sections.signature');
  const tCommon = useTranslations('common');

  // 번역된 프로그램 데이터 생성
  const programs = programsConfig.map(config => ({
    ...config,
    title: t(`programs.${config.id}.title`),
    titleEn: t(`programs.${config.id}.titleEn`),
    subtitle: t(`programs.${config.id}.subtitle`),
    description: t(`programs.${config.id}.description`),
    features: t.raw(`programs.${config.id}.features`) as string[],
  }));

  return (
    <section className="section-gap bg-white">
      <div className="container-custom">
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
          </div>
        </AnimateOnScroll>

        <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8" staggerDelay={0.15}>
          {programs.map((program, index) => (
            <StaggerItem key={program.id} variant="scale">
              <motion.div
                className="group relative h-full"
                whileHover={{ y: -12, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                <Link href={program.href} className="block h-full">
                  <div className="relative h-full bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${program.image})` }}
                      />
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${program.color}`} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col p-5 md:p-6 lg:p-8 text-white min-h-[320px] md:min-h-[400px] lg:min-h-[480px]">
                      {/* Number */}
                      <span className="absolute top-4 right-4 md:top-6 md:right-6 font-serif text-4xl md:text-5xl lg:text-6xl opacity-20">
                        0{index + 1}
                      </span>

                      {/* Title */}
                      <div className="mb-auto">
                        <h3 className="card-title-ko text-2xl md:text-3xl lg:text-4xl mb-0.5 md:mb-1">{program.title}</h3>
                        <p className="text-xs md:text-sm opacity-60 mb-1 md:mb-2">{program.titleEn}</p>
                        <p className="text-sm md:text-base lg:text-lg opacity-80">{program.subtitle}</p>
                      </div>

                      {/* Description */}
                      <div className="mt-4 md:mt-6 lg:mt-8">
                        <p className="text-sm md:text-base opacity-90 mb-4 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">
                          {program.description}
                        </p>

                        {/* Features */}
                        <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 lg:mb-8">
                          {program.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm opacity-80">
                              <svg
                                className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium group-hover:gap-3 md:group-hover:gap-4 transition-all">
                          <span>{tCommon('learnMore')}</span>
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Border */}
                    <div className="absolute inset-0 rounded-2xl md:rounded-3xl border-2 border-white/0 group-hover:border-white/20 transition-colors duration-300" />
                  </div>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
