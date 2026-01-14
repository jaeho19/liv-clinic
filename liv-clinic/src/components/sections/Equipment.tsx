'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';

interface DeviceItem {
  id: string;
  title: string;
  subTitle: string;
  desc: string;
  image: string;
  link: string;
}

// 10개 장비 목록 (회의록 기준 순서)
const devices: DeviceItem[] = [
  {
    id: '01',
    title: 'Ultherapy Prime',
    subTitle: '울쎄라피 프라임',
    desc: 'FDA 승인 HIFU 리프팅의 글로벌 스탠다드',
    image: '/images/equipment/ultherapy.png',
    link: '/lifting/ulthera',
  },
  {
    id: '02',
    title: 'Thermage FLX',
    subTitle: '써마지 FLX',
    desc: '4세대 RF 리프팅 기술의 정점',
    image: '/images/equipment/thermage-flx.png',
    link: '/lifting/thermage',
  },
  {
    id: '03',
    title: 'Density',
    subTitle: '덴서티',
    desc: '고주파(RF) 에너지로 콜라겐 리모델링',
    image: '/images/equipment/density.png',
    link: '/lifting/density',
  },
  {
    id: '04',
    title: 'Shurink',
    subTitle: '슈링크',
    desc: '정교한 HIFU로 V라인 완성',
    image: '/images/equipment/shurink.png',
    link: '/lifting/shurink',
  },
  {
    id: '05',
    title: 'Inmode',
    subTitle: '인모드',
    desc: 'RF 에너지로 지방 감소와 리프팅 동시에',
    image: '/images/equipment/inmode.png',
    link: '/lifting/inmode',
  },
  {
    id: '06',
    title: 'Potenza',
    subTitle: '포텐자',
    desc: 'RF 마이크로니들링으로 탄력과 모공 개선',
    image: '/images/equipment/potenza.png',
    link: '/laser',
  },
  {
    id: '07',
    title: 'Clarity II',
    subTitle: '클라리티 II',
    desc: '듀얼 파장 레이저로 색소 & 혈관 치료',
    image: '/images/equipment/clarity-ii.png',
    link: '/laser',
  },
  {
    id: '08',
    title: 'Lucas',
    subTitle: '루카스',
    desc: '고출력 Q스위치로 난치성 색소 치료',
    image: '/images/equipment/lucas-laser.png',
    link: '/laser',
  },
  {
    id: '09',
    title: 'CO2 Laser',
    subTitle: 'CO2 레이저',
    desc: '정밀 박피와 피부 재생',
    image: '/images/equipment/processed/equipment_co2.png',
    link: '/laser',
  },
  {
    id: '10',
    title: 'Ulblanc',
    subTitle: '울블랑',
    desc: '저자극 화이트닝 레이저',
    image: '/images/equipment/ulblanc.png',
    link: '/laser',
  },
];

export default function Equipment() {
  const t = useTranslations('sections.equipment');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ============================================
  // 애니메이션 일시정지/자동재생 상태 관리
  // ============================================
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // 클릭 시 일시정지 → 3초 후 자동 재생
  // ============================================
  const handleTrackClick = () => {
    // 기존 타이머가 있으면 취소
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    // 일시정지
    setIsPaused(true);

    // 3초 후 자동으로 다시 재생
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  // ============================================
  // 애니메이션 상태 변경 시 style 업데이트
  // ============================================
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = isPaused ? 'paused' : 'running';
    }
  }, [isPaused]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden py-20 md:py-32"
      style={{
        background: 'linear-gradient(180deg, #f6f6f6 0%, #faf8f7 50%, #f5f0ed 100%)',
      }}
    >
      {/* ============================================ */}
      {/* CSS @keyframes 정의 - 무한 스크롤 애니메이션 */}
      {/* 30초 동안 오른쪽에서 왼쪽으로 이동 후 반복 */}
      {/* ============================================ */}
      <style jsx>{`
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll-track {
          display: flex;
          width: fit-content;
          /* 30초 동안 부드럽게 이동, 무한 반복 */
          animation: scrollLeft 30s linear infinite;
          cursor: pointer;
        }
      `}</style>

      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(180,152,141,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(180,152,141,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Section Header */}
      <div className="container-custom mb-12 md:mb-16 relative z-10">
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
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
                transition={{ duration: 0.8, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
              >
                {t('subtitle')}
              </motion.h2>
            </div>
            <motion.p
              className="text-body text-mono-light max-w-md"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            >
              리브성형외과는 정품 인증된 프리미엄 장비만을 사용합니다.
              최신 기술로 안전하고 효과적인 시술을 제공합니다.
            </motion.p>
          </div>
        </AnimateOnScroll>
      </div>

      {/* ============================================ */}
      {/* 무한 스크롤 갤러리 컨테이너 */}
      {/* ============================================ */}
      <div className="relative overflow-hidden">
        {/* ============================================ */}
        {/* 스크롤 트랙 - 클릭 시 일시정지, 3초 후 자동 재생 */}
        {/* ============================================ */}
        <div
          ref={trackRef}
          className="infinite-scroll-track gap-6 md:gap-8 py-4"
          onClick={handleTrackClick}
        >
          {/* 첫 번째 세트 - 원본 장비 목록 */}
          {devices.map((device, index) => (
            <DeviceCard
              key={`first-${device.id}`}
              device={device}
              index={index}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          ))}
          {/* 두 번째 세트 - 무한 루프를 위한 복제본 */}
          {devices.map((device, index) => (
            <DeviceCard
              key={`second-${device.id}`}
              device={device}
              index={index + devices.length}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
            />
          ))}
        </div>
      </div>

      {/* 상태 표시 바 */}
      <div className="container-custom mt-10 md:mt-14 relative z-10">
        <div className="flex justify-between items-center text-xs font-mono" style={{ color: 'rgba(109,78,66,0.5)' }}>
          <span>AUTO SCROLLING</span>
          <span className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${isPaused ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ animation: isPaused ? 'none' : 'pulse 2s infinite' }}
            />
            10 Premium Devices
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================
// 장비 카드 컴포넌트
// ============================================
interface DeviceCardProps {
  device: DeviceItem;
  index: number;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

function DeviceCard({ device, index, activeIndex, setActiveIndex }: DeviceCardProps) {
  const isActive = activeIndex === index;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 5) * 0.1, duration: 0.6 }}
      className="flex-shrink-0 first:ml-6 md:first:ml-[max(24px,calc((100vw-1280px)/2+24px))]"
      onMouseEnter={() => setActiveIndex(index)}
      onMouseLeave={() => setActiveIndex(null)}
    >
      {/* Card Container */}
      <div
        className={`
          relative w-[260px] md:w-[300px] rounded-2xl overflow-hidden
          transition-all duration-500 ease-out
          ${isActive ? 'shadow-2xl scale-105' : 'shadow-lg hover:shadow-xl'}
        `}
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #faf8f7 100%)',
          border: '1px solid rgba(180,152,141,0.15)',
        }}
      >
        {/* Device Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-white to-gray-50">
          <div
            className={`
              absolute inset-0 bg-contain bg-center bg-no-repeat
              transition-transform duration-700 ease-out
              ${isActive ? 'scale-110' : 'scale-100'}
            `}
            style={{
              backgroundImage: `url(${device.image})`,
              filter: isActive ? 'none' : 'saturate(0.9)',
            }}
          />

          {/* 번호 뱃지 */}
          <div
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, #b4988d 0%, #6d4e42 100%)'
                : 'rgba(180,152,141,0.2)',
              color: isActive ? 'white' : '#6d4e42',
            }}
          >
            {device.id}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3
            className={`
              font-serif text-xl font-medium mb-1 transition-colors duration-300
              ${isActive ? 'text-primary' : 'text-secondary'}
            `}
          >
            {device.title}
          </h3>
          <p className="text-sm text-mono-light mb-2">{device.subTitle}</p>
          <p
            className={`
              text-sm text-mono leading-relaxed transition-all duration-500
              ${isActive ? 'opacity-100' : 'opacity-70'}
            `}
          >
            {device.desc}
          </p>

          {/* Learn More Link */}
          <a
            href={device.link}
            className={`
              inline-flex items-center gap-2 text-primary text-sm mt-3
              transition-all duration-300 hover:gap-3
              ${isActive ? 'opacity-100' : 'opacity-0'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            자세히 보기
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
