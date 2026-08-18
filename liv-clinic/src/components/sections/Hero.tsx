'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { trackCTAClick } from '@/lib/analytics-events';

const HERO_VIDEO_WEBM = '/videos/hero.webm?v=20260707';
const HERO_VIDEO = '/videos/hero.mp4?v=20260707';
const HERO_POSTER = '/images/hero/hero-1.jpg'; // 비디오 로드 전 표시할 포스터 이미지 (LCP candidate)

const slides = [
  { id: 1, titleKey: 'hero.slide1.title', subtitleKey: 'hero.slide1.subtitle' },
  { id: 2, titleKey: 'hero.slide2.title', subtitleKey: 'hero.slide2.subtitle' },
  { id: 3, titleKey: 'hero.slide3.title', subtitleKey: 'hero.slide3.subtitle' },
];

// FloatingParticles 최적화 (Vercel Best Practice: rendering-animate-svg-wrapper)
// - 15개 → 8개로 감소하여 애니메이션 부하 줄임
// - will-change: transform으로 GPU 가속 활성화
// - prefers-reduced-motion 지원
function FloatingParticles() {
  const particles = useMemo(() => [...Array(8)].map((_, i) => ({
    id: i, left: `${(i * 12.5) % 100}%`, top: `${(i * 15) % 100}%`,
    duration: 10 + (i % 4) * 2, delay: i * 0.8, xOffset: (i % 3) * 30 - 30,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: p.left,
            top: p.top,
            willChange: 'transform, opacity', // GPU 가속 힌트
          }}
          animate={{ y: [0, -100, 0], x: [0, p.xOffset, 0], opacity: [0, 0.6, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// AnimatedShapes 최적화 - GPU 가속 및 prefers-reduced-motion 지원
function AnimatedShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(180,152,141,0.15) 0%, transparent 70%)',
          left: '-10%',
          top: '20%',
          willChange: 'transform',
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(109,78,66,0.1) 0%, transparent 70%)',
          right: '-5%',
          bottom: '10%',
          willChange: 'transform',
        }}
        animate={{ scale: [1.1, 1, 1.1], x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function AnimatedTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="inline-block">
      {text.split('').map((char, i) => (
        <motion.span key={i} className="inline-block"
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.03, ease: [0.215, 0.61, 0.355, 1] }}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

export default function Hero() {
  const t = useTranslations();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[100vh] h-[100dvh] sm:h-[85vh] sm:h-[85dvh] min-h-[500px] w-full overflow-hidden">
      <div className="absolute inset-0 bg-primary">
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/90 to-secondary/70" />
        {/* 비디오 최적화 (Vercel Best Practice: rendering-hydration-no-flicker)
            - preload="metadata": 메타데이터만 미리 로드하여 초기 다운로드 최소화
            - poster: 비디오 로드 전 이미지 표시로 LCP 개선
        */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER}
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={HERO_VIDEO_WEBM} type="video/webm" />
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 hero-vignette" />
      </div>

      {/* 모바일에서 성능을 위해 애니메이션 요소 숨김 */}
      <div className="hidden sm:block">
        <AnimatedShapes />
        <FloatingParticles />
      </div>

      <div className="absolute top-0 left-0 w-24 sm:w-32 h-24 sm:h-32 pointer-events-none">
        <motion.svg viewBox="0 0 100 100" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1 }}>
          <motion.path d="M0 50 L0 0 L50 0" fill="none" stroke="white" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.5, duration: 1.5 }} />
        </motion.svg>
      </div>
      <div className="absolute bottom-0 right-0 w-24 sm:w-32 h-24 sm:h-32 pointer-events-none">
        <motion.svg viewBox="0 0 100 100" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 1 }}>
          <motion.path d="M100 50 L100 100 L50 100" fill="none" stroke="white" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.5, duration: 1.5 }} />
        </motion.svg>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white container-custom">
        {/* SEO H1 — 정적·SSR 노출(JS 없이도 표시). 회전 슬로건과 독립적으로 키워드 제공.
            tracking/uppercase는 아랍어 연결서체·CJK를 깨뜨리므로 사용하지 않음. */}
        <h1 className="text-small sm:text-base font-light text-white/85 mb-5 sm:mb-6 max-w-3xl text-shadow">
          {t('heroSeo.h1')}
        </h1>
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
            {/* 회전 슬로건 — 디자인 동일하게 유지, H1 시맨틱만 위 정적 요소로 이동 */}
            <motion.div aria-live="polite" className="font-serif text-display mb-6 text-shadow-strong">
              <AnimatedTitle text={t(slides[currentSlide].titleKey)} delay={0.2} />
            </motion.div>
            <motion.p className="text-h4 md:text-h3 opacity-90 mb-10 font-light text-shadow"
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.8, duration: 0.8 }}>
              {t(slides[currentSlide].subtitleKey)}
            </motion.p>
            <motion.div className="w-24 h-px bg-white/50 mx-auto" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 0.8 }} />
          </motion.div>
        </AnimatePresence>

        {/* Primary CTA — 서버 렌더 텍스트(JS 없이도 노출), 슬라이드 애니메이션과 독립 */}
        <Link
          href="/contact"
          onClick={() => trackCTAClick('hero_cta')}
          className="mt-8 sm:mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-white/60 min-h-[52px]"
        >
          {t('common.consultation')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2">
          <motion.div className="flex flex-col items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <motion.span className="text-small tracking-[0.3em] uppercase" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
              {t('common.scrollDown')}
            </motion.span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <motion.path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2, duration: 1 }} />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div className="absolute start-8 top-1/2 -translate-y-1/2 hidden xl:block" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 0.3, x: 0 }} transition={{ delay: 2 }}>
        <p className="text-white text-xs tracking-[0.5em] uppercase" style={{ writingMode: 'vertical-rl' }}>{t('hero.sideText.left')}</p>
      </motion.div>
      <motion.div className="absolute end-8 top-1/2 -translate-y-1/2 hidden xl:block" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 0.3, x: 0 }} transition={{ delay: 2.2 }}>
        <p className="text-white text-xs tracking-[0.5em] uppercase" style={{ writingMode: 'vertical-rl' }}>{t('hero.sideText.right')}</p>
      </motion.div>
    </section>
  );
}
