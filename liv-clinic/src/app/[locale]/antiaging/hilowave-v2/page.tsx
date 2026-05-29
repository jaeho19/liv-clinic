'use client';

// Design Ref: §1-2 — Option C: skincare/page.tsx 패턴을 그대로 미러한 풀 컴포넌트 버전.
// 콘텐츠는 treatments.antiaging.hilowave.* (11개 로케일), 사진은 원본 9장에서 크롭한 자산 사용.
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/i18n/routing';

const IMG = '/images/antiaging/hilowave-v2';

interface TitleDesc {
  title: string;
  desc: string;
}
interface EnKo {
  en: string;
  ko: string;
}
interface ProgramItem {
  name: string;
  desc: string;
  price: string;
}

// 섹션 헤더(뱃지 + 타이틀 + 서브) 공통
function SectionHead({
  badge,
  title,
  subtitle,
  light = false,
  center = true,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`${center ? 'text-center' : ''} mb-16`}
    >
      {badge && (
        <div className={`flex items-center gap-4 mb-4 ${center ? 'justify-center' : ''}`}>
          <div className="w-8 h-px bg-[#D4A5A5]" />
          <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">{badge}</span>
          {center && <div className="w-8 h-px bg-[#D4A5A5]" />}
        </div>
      )}
      <h2
        className={`text-3xl lg:text-5xl font-extralight mb-4 ${
          light ? 'text-white' : 'text-[#3A3A3A]'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`font-light max-w-xl ${center ? 'mx-auto' : ''} ${light ? 'text-white/60' : 'text-gray-400'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

export default function HiloWaveV2Page() {
  const t = useTranslations('treatments');
  const k = 'antiaging.hilowave';

  const symptoms = t.raw(`${k}.symptoms.items`) as TitleDesc[];
  const points = t.raw(`${k}.about.points`) as EnKo[];
  const diffs = t.raw(`${k}.differentiators.items`) as EnKo[];
  const ideal = t.raw(`${k}.idealFor.items`) as string[];
  const programs = t.raw(`${k}.program.items`) as ProgramItem[];

  return (
    <main className="bg-white overflow-x-hidden">
      {/* S1. Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F8] via-white to-[#F5E6E8]" />
        <div className="container mx-auto px-6 lg:px-12 py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-px bg-gradient-to-r from-[#D4A5A5] to-transparent" />
                <span className="text-xs tracking-[0.4em] text-[#D4A5A5] uppercase">
                  {t(`${k}.heroBadge`)}
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-extralight text-[#3A3A3A] leading-tight mb-6">
                {t(`${k}.heroTitle`)}
              </h1>
              <p className="text-xl font-light text-[#D4A5A5] mb-6 tracking-wide">
                {t(`${k}.fullName`)}
              </p>
              <p className="text-gray-500 leading-relaxed max-w-md font-light text-lg mb-10">
                {t(`${k}.heroDesc`)}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-10 py-4 bg-[#8B7B8B] text-white text-sm tracking-wider hover:bg-[#6B5B6B] transition-colors duration-300"
                >
                  {t(`${k}.cta.button`)}
                </Link>
                <a
                  href="https://pf.kakao.com/_hgFwn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-10 py-4 border border-[#D4A5A5] text-[#8B7B8B] text-sm tracking-wider hover:bg-[#F5E6E8]/40 transition-colors duration-300"
                >
                  카카오 상담
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] max-w-lg mx-auto rounded-[2rem] overflow-hidden shadow-2xl shadow-[#D4A5A5]/20">
                <Image
                  src={`${IMG}/hero.jpg`}
                  alt={`${t(`${k}.fullName`)} ${t(`${k}.heroTitle`)}`}
                  fill
                  className="object-cover"
                  quality={95}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#D4A5A5]/10 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* S2. Symptoms */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <SectionHead title={t(`${k}.symptoms.title`)} subtitle={t(`${k}.symptoms.subtitle`)} badge="Concern" />
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {symptoms.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-gradient-to-br from-[#FDF8F8] to-white border border-gray-100 rounded-2xl hover:border-[#D4A5A5]/30 hover:shadow-xl hover:shadow-[#D4A5A5]/10 transition-all duration-500"
              >
                {/* r2 일러스트 (텍스트 없는 라인 일러스트만 크롭) — 크게 표시 */}
                <div className="relative w-full h-32 mb-5">
                  <Image
                    src={`${IMG}/sym-${i + 1}.jpg`}
                    alt=""
                    fill
                    className="object-contain mix-blend-multiply"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="text-[#D4A5A5] text-sm tracking-widest mb-4">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-light text-[#3A3A3A] mb-3 group-hover:text-[#D4A5A5] transition-colors">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* S3. About — diagram + points */}
      <section className="py-28 bg-gradient-to-br from-[#FDF8F8] to-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-px bg-[#D4A5A5]" />
                <span className="text-xs tracking-[0.3em] text-[#D4A5A5] uppercase">About</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-extralight text-[#3A3A3A] mb-6">
                {t(`${k}.about.title`)}
              </h2>
              <p className="text-gray-500 leading-relaxed font-light mb-10">{t(`${k}.about.body`)}</p>
              <div className="space-y-5">
                {points.map((p, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#D4A5A5] mt-2.5 flex-shrink-0" />
                    <div>
                      <div className="text-[#8B7B8B] font-light tracking-wide">{p.en}</div>
                      <div className="text-gray-400 text-sm">{p.ko}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="max-w-lg mx-auto"
            >
              {/* 부드러운 float (이전 fill+aspect 구조가 16x16로 collapse되던 버그 → 명시 width/height로 수정) */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-[2rem] overflow-hidden shadow-2xl shadow-[#D4A5A5]/20 bg-white"
              >
                <Image
                  src={`${IMG}/diagram.jpg`}
                  alt={t(`${k}.about.title`)}
                  width={960}
                  height={879}
                  className="w-full h-auto"
                  quality={95}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* S7. Differentiators */}
      <section className="py-28 bg-[#8B7B8B] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-[120px]" />
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <SectionHead title={t(`${k}.differentiators.title`)} badge="Why LIV" light />
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {diffs.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 text-center"
              >
                <div className="text-2xl font-extralight text-white mb-3 tracking-wide">{d.en}</div>
                <p className="text-white/60 text-sm leading-relaxed">{d.ko}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* S4. Ideal For — r4 모델 사진 + 체크리스트 2단 */}
      <section className="py-28 bg-[#FDF8F8]">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl shadow-[#D4A5A5]/20 max-w-md mx-auto lg:mx-0"
            >
              <Image
                src={`${IMG}/ideal-model.jpg`}
                alt={t(`${k}.idealFor.title`)}
                fill
                className="object-cover object-top"
                quality={95}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
            <div>
              <SectionHead title={t(`${k}.idealFor.title`)} subtitle={t(`${k}.idealFor.subtitle`)} badge="Ideal For" center={false} />
              <div className="grid gap-4">
                {ideal.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-5 p-5 bg-white rounded-xl border border-gray-100 hover:border-[#D4A5A5]/30 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A5A5]/20 to-[#F5E6E8] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#D4A5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[#8B7B8B] font-light">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S6. Program / Pricing */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6 lg:px-12">
          <SectionHead title={t(`${k}.program.title`)} badge="HILO WAVE Program" />
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {programs.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-gradient-to-br from-[#FDF8F8] to-white border border-gray-100 rounded-2xl text-center hover:border-[#D4A5A5]/40 hover:shadow-xl hover:shadow-[#D4A5A5]/10 hover:scale-[1.02] transition-all duration-500"
              >
                <h3 className="text-xl font-light text-[#3A3A3A] mb-3 tracking-wide">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 min-h-[40px]">{p.desc}</p>
                <div className="text-3xl font-extralight text-[#8B7B8B]">{p.price}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-xs mt-8">{t(`${k}.program.note`)}</p>
        </div>
      </section>

      {/* S5. Mood — r5 원본 슬라이드 이미지만 사용 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl overflow-hidden shadow-lg shadow-[#D4A5A5]/10"
          >
            <Image
              src="/images/antiaging/hilowave/hilowave-5.jpg"
              alt={t(`${k}.mood.title`)}
              width={1920}
              height={1128}
              className="w-full h-auto"
              quality={95}
              sizes="100vw"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA (의료진·공간 섹션 제거, 상담 CTA만 유지) */}
      <section className="py-28 bg-gradient-to-br from-[#8B7B8B] to-[#6B5B6B] relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4A5A5]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#F5E6E8]/10 rounded-full blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-6 lg:px-12 relative z-10 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-[#D4A5A5]" />
            <span className="text-xs tracking-[0.4em] text-[#D4A5A5] uppercase">Consultation</span>
            <div className="w-12 h-px bg-[#D4A5A5]" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-extralight text-white mt-4 mb-6">{t(`${k}.cta.title`)}</h2>
          <p className="text-white/70 font-light max-w-xl mx-auto mb-12">{t(`${k}.cta.description`)}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-12 py-5 bg-white text-[#8B7B8B] text-sm tracking-wider hover:bg-gray-100 transition-all duration-300"
            >
              {t(`${k}.cta.button`)}
            </Link>
            <a
              href="tel:02-797-2773"
              className="inline-flex items-center px-12 py-5 border border-white/40 text-white text-sm tracking-wider hover:bg-white/10 transition-all duration-300"
            >
              02-797-2773
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
