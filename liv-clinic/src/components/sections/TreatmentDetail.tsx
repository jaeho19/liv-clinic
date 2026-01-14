'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button, Card, ScrollLink } from '@/components/ui';
import { TREATMENTS, MEDICAL_QA } from '@/lib/constants';

// Union type of all treatments
type LiftingTreatment = typeof TREATMENTS.lifting[keyof typeof TREATMENTS.lifting];
type AntiagingTreatment = typeof TREATMENTS.antiaging[keyof typeof TREATMENTS.antiaging];
type LaserTreatment = typeof TREATMENTS.laser[keyof typeof TREATMENTS.laser];
type Treatment = LiftingTreatment | AntiagingTreatment | LaserTreatment;

interface TreatmentDetailProps {
  treatment: Treatment;
}

export default function TreatmentDetail({ treatment }: TreatmentDetailProps) {
  const t = useTranslations();
  const [expandedQaId, setExpandedQaId] = useState<string | null>(null);

  // MEDICAL_QA에서 현재 시술과 관련된 Q&A 필터링
  const relatedMedicalQA = useMemo(() => {
    const treatmentId = treatment.id;
    return MEDICAL_QA.filter((qa) =>
      qa.relatedTreatments?.some((id) => id === treatmentId)
    );
  }, [treatment.id]);

  // Q&A 아코디언 토글 (자동 스크롤 포함)
  const toggleQa = useCallback((id: string, element: HTMLElement | null) => {
    const isExpanding = expandedQaId !== id;
    setExpandedQaId(expandedQaId === id ? null : id);

    if (isExpanding && element) {
      setTimeout(() => {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }, 50);
    }
  }, [expandedQaId]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                <p className="font-serif text-h3 text-primary mb-2">{treatment.nameEn}</p>
                <h1 className="text-display text-secondary mb-4">{treatment.name}</h1>
                <p className="font-serif text-xl text-mono-light mb-6">{treatment.tagline}</p>
                <p className="text-h4 text-mono leading-relaxed mb-8">
                  {treatment.shortDesc}
                </p>
                <div className="flex gap-4">
                  <ScrollLink href="/contact">
                    <Button variant="primary" size="lg">
                      상담 예약하기
                    </Button>
                  </ScrollLink>
                  <a href="tel:02-797-2773">
                    <Button variant="outline" size="lg">
                      전화 상담
                    </Button>
                  </a>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/30">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${treatment.heroImage})` }}
                />
                {/* Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-serif text-2xl">{treatment.name}</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <AnimateOnScroll>
              <div className="text-center mb-16">
                <p className="font-serif text-h3 text-primary mb-2">About</p>
                <h2 className="text-h1 text-secondary mb-8">{treatment.name}란?</h2>
                <p className="text-body text-mono leading-relaxed">
                  {treatment.description}
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">Benefits</p>
              <h2 className="text-h1 text-secondary">{treatment.name}의 장점</h2>
            </div>
          </AnimateOnScroll>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {treatment.benefits.map((benefit, index) => (
              <StaggerItem key={index}>
                <Card padding="lg" className="text-center h-full">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-serif text-2xl text-primary">0{index + 1}</span>
                  </div>
                  <h3 className="text-h4 text-secondary mb-3">{benefit.title}</h3>
                  <p className="text-body text-mono-light">{benefit.desc}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Process */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">Process</p>
              <h2 className="text-h1 text-secondary">시술 과정</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />

              <div className="space-y-8">
                {treatment.process.map((step, index) => (
                  <motion.div
                    key={step.step}
                    className="relative flex gap-6 md:gap-8"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Step number */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-serif text-xl z-10">
                      {step.step}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-3">
                      <h3 className="text-h4 text-secondary mb-2">{step.title}</h3>
                      <p className="text-body text-mono-light">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Info */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 opacity-80 mb-2">Treatment Info</p>
              <h2 className="text-h1">시술 정보</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">시술 시간</p>
                <p className="font-medium">{treatment.duration}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">마취</p>
                <p className="font-medium">{treatment.anesthesia}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">회복 기간</p>
                <p className="font-medium">{treatment.recovery}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-small opacity-70 mb-1">효과 지속</p>
                <p className="font-medium">{treatment.results}</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Target Areas & Ideal For */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Target Areas */}
            <AnimateOnScroll animation="fadeInLeft">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  시술 부위
                </h3>
                <div className="flex flex-wrap gap-3">
                  {treatment.targetAreas.map((area, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-body"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </Card>
            </AnimateOnScroll>

            {/* Ideal For */}
            <AnimateOnScroll animation="fadeInRight">
              <Card padding="lg">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  이런 분께 추천
                </h3>
                <ul className="space-y-3">
                  {treatment.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Cautions */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl mx-auto">
              <Card padding="lg" className="border-2 border-primary/20">
                <h3 className="text-h3 text-secondary mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  시술 전후 주의사항
                </h3>
                <ul className="space-y-3">
                  {treatment.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start gap-3 text-body text-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {caution}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-2">FAQ</p>
              <h2 className="text-h1 text-secondary">자주 묻는 질문</h2>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <StaggerChildren className="space-y-4">
              {treatment.faqs.map((faq, index) => (
                <StaggerItem key={index}>
                  <Card padding="lg" hover={false}>
                    <h3 className="text-h4 text-secondary mb-3 flex items-start gap-3">
                      <span className="text-primary font-serif">Q.</span>
                      {faq.q}
                    </h3>
                    <p className="text-body text-mono pl-7">{faq.a}</p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* Related Medical Q&A from MEDICAL_QA */}
      {relatedMedicalQA.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-12">
                <p className="font-serif text-h3 text-primary mb-2">Medical Info</p>
                <h2 className="text-h1 text-secondary">{treatment.name} 관련 의료정보</h2>
                <p className="text-body text-mono-light mt-4">
                  더 자세한 정보는{' '}
                  <Link href="/medical" className="text-primary hover:underline">
                    의료정보 Q&A
                  </Link>
                  에서 확인하세요
                </p>
              </div>
            </AnimateOnScroll>

            <div className="max-w-3xl mx-auto space-y-4">
              {relatedMedicalQA.map((qa) => (
                <motion.div
                  key={qa.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Card padding="none" hover={false} className="overflow-hidden">
                    <button
                      onClick={(e) => toggleQa(qa.id, e.currentTarget.closest('.overflow-hidden'))}
                      className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-background/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-serif font-medium">Q</span>
                        </span>
                        <span className="text-h4 text-secondary pt-0.5">{qa.question}</span>
                      </div>
                      <motion.svg
                        className="w-5 h-5 text-mono-light flex-shrink-0 mt-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: expandedQaId === qa.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {expandedQaId === qa.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5">
                            <div className="flex items-start gap-3 pt-3 border-t border-border">
                              <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-secondary font-serif font-medium">A</span>
                              </span>
                              <div className="flex-1">
                                <p className="text-body text-mono leading-relaxed whitespace-pre-line">
                                  {qa.answer}
                                </p>
                                {qa.tags && qa.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {qa.tags.map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-background text-mono-light text-xs rounded-full"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">{treatment.name} 상담 예약</h2>
              <p className="text-h4 opacity-80 mb-8">
                전문 의료진과 1:1 맞춤 상담을 받아보세요.
              </p>
              <div className="flex justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="primary" size="lg" className="bg-primary text-white hover:bg-secondary">
                    상담 예약하기
                  </Button>
                </ScrollLink>
                <a href="tel:02-797-2773">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    전화 상담
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related Treatments */}
      {treatment.relatedTreatments && treatment.relatedTreatments.length > 0 && (
        <section className="section-gap bg-white">
          <div className="container-custom">
            <AnimateOnScroll>
              <div className="text-center mb-16">
                <p className="font-serif text-h3 text-primary mb-2">Related</p>
                <h2 className="text-h1 text-secondary">함께 보면 좋은 시술</h2>
              </div>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {treatment.relatedTreatments.slice(0, 3).map((relatedId) => {
                // Find related treatment from all categories
                const related =
                  TREATMENTS.lifting[relatedId as keyof typeof TREATMENTS.lifting] ||
                  TREATMENTS.antiaging[relatedId as keyof typeof TREATMENTS.antiaging] ||
                  TREATMENTS.laser[relatedId as keyof typeof TREATMENTS.laser];

                if (!related) return null;

                return (
                  <AnimateOnScroll key={relatedId}>
                    <Link href={`/${related.category}/${related.id}`}>
                      <Card padding="lg" className="group cursor-pointer h-full">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-serif text-primary mb-1">{related.nameEn}</p>
                            <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                              {related.name}
                            </h3>
                            <p className="text-small text-mono-light mt-2">{related.shortDesc}</p>
                          </div>
                          <svg className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </Card>
                    </Link>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
