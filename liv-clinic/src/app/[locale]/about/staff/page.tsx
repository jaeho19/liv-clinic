'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card, ScrollLink } from '@/components/ui';

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  count,
  children
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-background hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-h4 text-secondary">{title}</span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-small rounded-full">
            {count}
          </span>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-mono-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-white border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 의료진 기본 정보 (이미지 등 번역이 필요없는 데이터)
const doctorsMeta = {
  kim: {
    id: 'dr-kim',
    image: '/images/doctor/doctor-main.jpg',
    // 미디어·언론 보도 (추후 업데이트 예정)
    mediaAppearances: [] as Array<{ title: string; outlet: string; date: string }>,
  },
  cheon: {
    id: 'dr-cheon',
    image: '/images/doctor/doctor-2.jpg',
    publications: [] as Array<Record<string, unknown>>,
    presentations: [] as Array<Record<string, unknown>>,
    mediaAppearances: [] as Array<{ title: string; outlet: string; date: string }>,
  },
};

// SCI/SCIE 논문 4편 — 저자·제목·저널은 원문 그대로 유지 (번역 대상 아님)
const KIM_SCI_PUBLICATIONS = [
  {
    type: 'sci',
    authors: 'Rho NK, Kim HS, Kim SY, Lee W.',
    title: 'Injectable \'Skin Boosters\' in Aging Skin Rejuvenation: A Current Overview',
    journal: 'Arch Plast Surg.',
    year: 2024,
    details: '2024 Nov 13;51(6):528-541.',
  },
  {
    type: 'sci',
    authors: 'Jang JU, Kim SY, Yoon ES, Kim WK, Park SH, Lee BI, Kim DW.',
    title: 'Comparison of the Effectiveness of Ablative and Non-Ablative Fractional Laser Treatments for Early Stage Thyroidectomy Scars',
    journal: 'Arch Plast Surg.',
    year: 2016,
    details: '2016 Nov;43(6):575-581.',
  },
  {
    type: 'sci',
    authors: 'Han SK, Kim SY, Choi RJ, Jeong SH, Kim WK.',
    title: 'Comparison of tissue-engineered and artificial dermis grafts after removal of basal cell carcinoma on face – a pilot study',
    journal: 'Dermatol Surg.',
    year: 2014,
    details: '2014 Apr;40(4):460-7.',
  },
  {
    type: 'sci',
    authors: 'Han SK, Kim SY, Gu JH, Jeong SH, Kim WK.',
    title: 'Influence of the pedicle orientation and length on viability of unipedicled venous island flaps',
    journal: 'Microsurgery.',
    year: 2014,
    details: '2014 Mar;34(3):197-202.',
  },
];

// 석사학위 논문 1편 (기관명·학위명은 번역)
const KIM_THESIS = {
  type: 'thesis',
  title: 'Comparison of the Effectiveness of Ablative and Nonablative Fractional Laser Treatment for Thyroidectomy Scar',
  year: 2015,
};

// 구두 발표 4건 (학회명은 번역)
const KIM_PRESENTATIONS = [
  {
    title: 'Winning Patients\' Hearts with Skin Boosters: Practical Tips for Effective Use and Maximizing Satisfaction',
    conferenceKey: 'mips37',
    year: 2024,
    type: 'oral',
  },
  {
    title: 'Types and Efficacy of Skin Boosters',
    conferenceKey: 'mips36',
    year: 2024,
    type: 'oral',
  },
  {
    title: 'Comparison of the effectiveness of nonablative versus ablative fractional laser in thyroidectomy scar',
    conferenceKey: 'aesthetic',
    year: 2014,
    type: 'oral',
  },
  {
    title: 'Tissue engineered dermis graft for fingertip reconstruction',
    conferenceKey: 'plastic',
    year: 2012,
    type: 'oral',
  },
] as const;

// 국제 활동 갤러리 이미지 (캡션은 번역)
const KIM_GALLERY_IMAGES = [
  '/images/aptos/certification-ceremony.jpg',
  '/images/aptos/certificate.jpg',
  '/images/aptos/presentation-mips.jpg',
  '/images/aptos/presentation.jpg',
];

export default function StaffPage() {
  const t = useTranslations();

  // 학회명 번역 (구두 발표용)
  const conferenceNames: Record<'mips37' | 'mips36' | 'aesthetic' | 'plastic', string> = {
    mips37: t('sections.doctors.kim.academic.conferenceMips37'),
    mips36: t('sections.doctors.kim.academic.conferenceMips36'),
    aesthetic: t('sections.doctors.kim.academic.conferenceAesthetic'),
    plastic: t('sections.doctors.kim.academic.conferencePlastic'),
  };

  // 국제 활동 갤러리 캡션
  const kimGallery = (t.raw('sections.doctors.kim.gallery') as Array<{ title: string; subtitle: string }>).map(
    (item, i) => ({ ...item, src: KIM_GALLERY_IMAGES[i] })
  );

  // 번역 데이터에서 의료진 정보 가져오기
  const kimData = {
    name: t('sections.doctors.kim.name'),
    nameEn: t('sections.doctors.kim.nameEn'),
    title: t('sections.doctors.kim.title'),
    specialty: t('sections.doctors.kim.specialty'),
    philosophy: t('sections.doctors.kim.philosophy'),
    education: t.raw('sections.doctors.kim.education') as string[],
    experience: t.raw('sections.doctors.kim.experience') as string[],
    certifications: t.raw('sections.doctors.kim.certifications') as string[],
    specialties: t.raw('sections.doctors.kim.specialties') as string[],
    publications: [
      ...KIM_SCI_PUBLICATIONS,
      {
        ...KIM_THESIS,
        institution: t('sections.doctors.kim.academic.thesisInstitution'),
        degree: t('sections.doctors.kim.academic.thesisDegree'),
      },
    ],
    presentations: KIM_PRESENTATIONS.map((pres) => ({
      title: pres.title,
      year: pres.year,
      type: pres.type,
      conference: conferenceNames[pres.conferenceKey],
    })),
    ...doctorsMeta.kim,
  };

  const cheonData = {
    name: t('sections.doctors.cheon.name'),
    nameEn: t('sections.doctors.cheon.nameEn'),
    title: t('sections.doctors.cheon.title'),
    specialty: t('sections.doctors.cheon.specialty'),
    philosophy: t('sections.doctors.cheon.philosophy'),
    education: t.raw('sections.doctors.cheon.education') as string[],
    experience: t.raw('sections.doctors.cheon.experience') as string[],
    certifications: t.raw('sections.doctors.cheon.certifications') as string[],
    specialties: t.raw('sections.doctors.cheon.specialties') as string[],
    ...doctorsMeta.cheon,
  };

  const doctors = [kimData, cheonData];

  // 라벨 번역
  const labels = {
    education: t('sections.doctors.labels.education'),
    experience: t('sections.doctors.labels.experience'),
    certifications: t('sections.doctors.labels.certifications'),
    specialties: t('sections.doctors.labels.specialties'),
    publications: t('sections.doctors.labels.publications'),
    presentations: t('sections.doctors.labels.presentations'),
    globalActivities: t('sections.doctors.labels.globalActivities'),
    media: t('sections.doctors.labels.media'),
    comingSoon: t('sections.doctors.labels.comingSoon'),
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">{t('sections.doctor.title')}</p>
              <h1 className="text-display text-secondary mb-6">{t('nav.aboutStaff')}</h1>
              <p className="text-h4 text-mono leading-relaxed">
                {t('sections.doctor.subtitle')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Doctors */}
      {doctors.map((doctor, index) => (
        <section
          key={doctor.id}
          className={`section-gap ${index % 2 === 0 ? 'bg-white' : 'bg-background'}`}
        >
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Image - left side (unified layout) */}
              <AnimateOnScroll animation="fadeInLeft">
                <div className="relative">
                  {/* Main Image */}
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/30">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${doctor.image})` }}
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

                  {/* Decorative elements */}
                  <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-primary/20 rounded-2xl" />
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10" />

                  {/* Specialty badge - Only for Dr. Kim (index === 0), hidden on mobile */}
                  {index === 0 && (
                    <motion.div
                      className="absolute -right-4 bottom-[50%] bg-white rounded-2xl shadow-xl p-5 z-10 hidden md:block"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-small text-mono-light mb-1">{labels.specialties}</p>
                      <p className="font-medium text-secondary">{doctor.specialty}</p>
                    </motion.div>
                  )}

                  {/* International Activities - Only for Dr. Kim (2x2 Grid Layout) */}
                  {index === 0 && (
                    <motion.div
                      className="mt-10 pt-6"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                    >
                      {/* Section Header */}
                      <h3 className="text-sm font-medium text-secondary mb-4 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {labels.globalActivities}
                      </h3>

                      {/* Activity Grid - 2x2 Layout for larger images */}
                      <div className="grid grid-cols-2 gap-3">
                        {kimGallery.map((activity, i) => (
                          <motion.div
                            key={i}
                            className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                          >
                            {/* Image Background - Warm desaturated */}
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-110"
                              style={{
                                backgroundImage: `url(${activity.src})`,
                                filter: 'saturate(0.7) sepia(0.15) brightness(1.02)',
                              }}
                            />
                            {/* Warm overlay for brand consistency */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/15" />
                            {/* Gradient Overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent" />
                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-sm font-semibold text-white leading-tight mb-0.5">
                                {activity.title}
                              </p>
                              <p className="text-xs text-white/80">
                                {activity.subtitle}
                              </p>
                            </div>
                            {/* Hover indicator */}
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </AnimateOnScroll>

              {/* Content - right side (unified layout) */}
              <AnimateOnScroll animation="fadeInRight">
                <div>
                  {/* Doctor Info */}
                  <div className="mb-8">
                    <p className="font-serif text-xl text-primary mb-2">{doctor.title}</p>
                    <h2 className="text-h1 text-secondary mb-1">{doctor.name}</h2>
                    <p className="font-serif text-h4 text-mono-light">{doctor.nameEn}</p>
                  </div>

                  {/* Philosophy */}
                  <blockquote className="relative pl-6 border-l-4 border-primary mb-10">
                    <p className="text-h4 text-mono italic leading-relaxed">
                      &ldquo;{doctor.philosophy}&rdquo;
                    </p>
                  </blockquote>

                  {/* Tabs/Sections */}
                  <div className="space-y-8">
                    {/* Education */}
                    <div>
                      <h3 className="text-h4 text-secondary mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        {labels.education}
                      </h3>
                      <ul className="space-y-2">
                        {doctor.education.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-body text-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Experience */}
                    <div>
                      <h3 className="text-h4 text-secondary mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {labels.experience}
                      </h3>
                      <ul className="space-y-2">
                        {doctor.experience.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-body text-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Certifications */}
                    <div>
                      <h3 className="text-h4 text-secondary mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {labels.certifications}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {doctor.certifications.map((cert, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-small"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Specialties - Only for Dr. Kim (index === 0) */}
                    {index === 0 && (
                      <div>
                        <h3 className="text-h4 text-secondary mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          {labels.specialties}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {doctor.specialties.map((specialty, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-body text-mono"
                            >
                              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {specialty}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Publications - Collapsible */}
                    {doctor.publications && doctor.publications.length > 0 && (
                      <CollapsibleSection
                        title={labels.publications}
                        icon={
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        }
                        count={doctor.publications.length}
                      >
                        <ul className="space-y-4">
                          {doctor.publications.map((pub: any, i: number) => (
                            <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                              {pub.type === 'sci' ? (
                                <div>
                                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded mb-2">SCI/SCIE</span>
                                  <p className="text-small text-mono-light mb-1">{pub.authors}</p>
                                  <p className="text-body text-secondary font-medium mb-1">&ldquo;{pub.title}&rdquo;</p>
                                  <p className="text-small text-mono">
                                    <span className="italic">{pub.journal}</span> {pub.details}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded mb-2">{pub.degree}</span>
                                  <p className="text-body text-secondary font-medium mb-1">&ldquo;{pub.title}&rdquo;</p>
                                  <p className="text-small text-mono">{pub.institution}, {pub.year}</p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}

                    {/* Presentations - Collapsible */}
                    {doctor.presentations && doctor.presentations.length > 0 && (
                      <CollapsibleSection
                        title={labels.presentations}
                        icon={
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        }
                        count={doctor.presentations.length}
                      >
                        <ul className="space-y-3">
                          {doctor.presentations.map((pres: any, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-body text-mono border-b border-border pb-3 last:border-0 last:pb-0">
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded flex-shrink-0 mt-0.5">
                                {pres.year}
                              </span>
                              <div>
                                <p className="text-secondary font-medium">&ldquo;{pres.title}&rdquo;</p>
                                <p className="text-small text-mono-light">{pres.conference}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>
                    )}

                    {/* Media Appearances - Collapsible (Only for Dr. Kim) */}
                    {index === 0 && (
                      <CollapsibleSection
                        title={labels.media}
                        icon={
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        }
                        count={doctorsMeta.kim.mediaAppearances.length || 0}
                      >
                        {doctorsMeta.kim.mediaAppearances.length > 0 ? (
                          <ul className="space-y-3">
                            {doctorsMeta.kim.mediaAppearances.map((media: any, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-body text-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-secondary">{media.title}</p>
                                  <p className="text-small text-mono-light">{media.outlet} · {media.date}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-6">
                            <svg className="w-12 h-12 text-mono-light/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            <p className="text-mono-light">{labels.comingSoon}</p>
                          </div>
                        )}
                      </CollapsibleSection>
                    )}

                    </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">{t('contact.title')}</h2>
              <p className="text-h4 opacity-80 mb-8 whitespace-pre-line">
                {t('contact.subtitle')}
              </p>
              <div className="flex justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="primary" size="lg" className="bg-primary text-white hover:bg-secondary">
                    {t('common.consultation')}
                  </Button>
                </ScrollLink>
                <a href={`tel:${t('common.phone')}`}>
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    {t('contact.phone')}
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/about">
              <Card padding="lg" className="group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-h4 text-secondary group-hover:text-primary transition-colors">
                      {t('nav.aboutBrand')}
                    </h3>
                    <p className="text-body text-mono-light">About LIV</p>
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
                      {t('nav.aboutEquipment')}
                    </h3>
                    <p className="text-body text-mono-light">Equipment</p>
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
                      {t('nav.aboutLocation')}
                    </h3>
                    <p className="text-body text-mono-light">Location</p>
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
