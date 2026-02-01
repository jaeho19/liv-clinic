'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AnimateOnScroll, StaggerChildren, StaggerItem } from '@/components/ui';

const values = [
  {
    id: 'natural',
    image: '/images/values/natural-beauty.png',
    color: '#b4988d',
  },
  {
    id: 'expertise',
    image: '/images/values/clinical-expertise.png',
    color: '#6d4e42',
  },
  {
    id: 'safety',
    image: '/images/values/safety-ethics.png',
    color: '#10B981',
  },
  {
    id: 'tailored',
    image: '/images/values/tailored-aging.png',
    color: '#8B5CF6',
  },
];

// Animated background pattern
function AnimatedPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/10"
          style={{ left: `${(i * 5) % 100}%`, top: `${(i * 7) % 100}%` }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export default function CoreValues() {
  const t = useTranslations('sections.values');

  return (
    <section className="section-gap bg-background relative overflow-hidden">
      {/* Animated Background Pattern */}
      <AnimatedPattern />

      {/* Static Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-secondary) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container-custom relative z-10">
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="text-center mb-8 md:mb-20">
            <motion.p
              className="font-serif text-lg md:text-h3 text-primary mb-2"
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
              transition={{ delay: 0.1, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
              {t('subtitle')}
            </motion.h2>
            <motion.div
              className="w-24 h-1 bg-primary mx-auto mt-6"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            />
          </div>
        </AnimateOnScroll>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8" staggerDelay={0.12}>
          {values.map((value, index) => (
            <StaggerItem key={value.id} variant="scale">
              <motion.div
                className="group relative"
                whileHover={{ y: -12, scale: 1.03 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                <div className="relative bg-white rounded-2xl h-full shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Animated gradient border on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${value.color}20 0%, transparent 50%, ${value.color}20 100%)`,
                    }}
                  />

                  {/* Image Section */}
                  {value.image && (
                    <div className="relative aspect-square overflow-hidden">
                      {/* Base Image with unified tone filter */}
                      <motion.div
                        className="absolute inset-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Image
                          src={value.image}
                          alt={t(`${value.id}.title`)}
                          fill
                          className="object-cover"
                          style={{
                            filter: 'brightness(1.1) contrast(1.05) saturate(0.9)',
                          }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </motion.div>

                      {/* Brand Color Gradient Overlay */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${value.color}, transparent 70%)`,
                          mixBlendMode: 'multiply',
                        }}
                        initial={{ opacity: 0.2 }}
                        whileHover={{ opacity: 0.35 }}
                      />

                      {/* Inner frame effect */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                      }} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative p-3 sm:p-4 md:p-8">
                    {/* Title */}
                    <motion.h3
                      className="font-serif text-xl text-secondary mb-2"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {t(`${value.id}.title`)}
                    </motion.h3>

                    {/* Korean Subtitle */}
                    <p className="text-h4 text-mono mb-2 md:mb-4">
                      {t(`${value.id}.subtitle`)}
                    </p>

                    {/* Description */}
                    <p className="text-body text-mono-light leading-relaxed">
                      {t(`${value.id}.description`)}
                    </p>
                  </div>

                  {/* Decorative animated line */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: value.color }}
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
