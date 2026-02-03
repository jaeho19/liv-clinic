'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';
import { Link } from '@/i18n/routing';

// ============================================
// Types
// ============================================
interface DeviceItem {
  id: string;
  title: string;
  subTitle: string;
  desc: string;
  image: string;
  link: string;
}

// ============================================
// Device Data (10 items)
// ============================================
const devices: DeviceItem[] = [
  {
    id: '01',
    title: 'Ultherapy',
    subTitle: '울쎄라피',
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
    desc: '고밀도 초음파로 피부 속부터 탄력 강화',
    image: '/images/equipment/density.png',
    link: '/lifting/density',
  },
  {
    id: '04',
    title: 'Shurink',
    subTitle: '슈링크 유니버스',
    desc: '정교한 HIFU로 V라인 완성',
    image: '/images/equipment/shurink.png',
    link: '/lifting/shurink',
  },
  {
    id: '05',
    title: 'Inmode',
    subTitle: '인모드',
    desc: 'RF 에너지로 콜라겐 리모델링',
    image: '/images/equipment/inmode.png',
    link: '/lifting/inmode',
  },
  {
    id: '06',
    title: 'Clarity II',
    subTitle: '클래리티 II',
    desc: '듀얼 파장 레이저로 색소 & 혈관 치료',
    image: '/images/equipment/clarity-ii.png',
    link: '/laser',
  },
  {
    id: '07',
    title: 'Potenza',
    subTitle: '포텐자',
    desc: 'RF 마이크로니들링으로 탄력과 모공 개선',
    image: '/images/equipment/potenza.png',
    link: '/laser',
  },
  {
    id: '08',
    title: 'LUCAS Laser',
    subTitle: '루카스 레이저',
    desc: '피부 속부터 밝고 맑게 – 색소 치료의 새로운 기준',
    image: '/images/equipment/processed/equipment_lucas.png',
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

// ============================================
// Constants
// ============================================
const RADIUS = 700; // 원통 반지름 (px)
const CARD_COUNT = devices.length;
const ANGLE_PER_CARD = 360 / CARD_COUNT; // 각 카드 간 각도 간격

// ============================================
// Utility Functions
// ============================================
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// 각도를 -180 ~ 180 범위로 정규화
function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

// ============================================
// Main Component
// ============================================
export default function Equipment3DCarousel() {
  const t = useTranslations('sections.equipment');
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 회전 상태
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // 드래그/스크롤 상태
  const scrollState = useRef({
    isDragging: false,
    startX: 0,
    startRotation: 0,
    targetRotation: 0,
    currentRotation: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
  });

  // 부드러운 애니메이션 루프
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      const state = scrollState.current;

      if (!state.isDragging) {
        // 관성 적용
        state.targetRotation += state.velocity;
        state.velocity *= 0.92; // 마찰

        // 작은 속도는 무시
        if (Math.abs(state.velocity) < 0.01) {
          state.velocity = 0;
        }
      }

      // 부드러운 보간
      state.currentRotation = lerp(state.currentRotation, state.targetRotation, 0.08);
      setRotation(state.currentRotation);

      // 현재 가장 앞에 있는 카드 계산
      const normalizedRotation = ((state.currentRotation % 360) + 360) % 360;
      const frontIndex = Math.round(normalizedRotation / ANGLE_PER_CARD) % CARD_COUNT;
      setActiveIndex((CARD_COUNT - frontIndex) % CARD_COUNT);

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // 드래그 핸들러
  const handleDragStart = useCallback((clientX: number) => {
    const state = scrollState.current;
    state.isDragging = true;
    state.startX = clientX;
    state.startRotation = state.currentRotation;
    state.lastX = clientX;
    state.lastTime = Date.now();
    state.velocity = 0;
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    const state = scrollState.current;
    if (!state.isDragging) return;

    const deltaX = clientX - state.startX;
    // 드래그 거리를 회전 각도로 변환 (민감도 조절)
    state.targetRotation = state.startRotation - deltaX * 0.3;

    // 속도 계산 (관성용)
    const now = Date.now();
    const dt = now - state.lastTime;
    if (dt > 0) {
      state.velocity = ((state.lastX - clientX) * 0.3) / Math.max(dt, 16) * 16;
    }
    state.lastX = clientX;
    state.lastTime = now;
  }, []);

  const handleDragEnd = useCallback(() => {
    scrollState.current.isDragging = false;
  }, []);

  // 휠 스크롤 핸들러
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const state = scrollState.current;
    // 휠 델타를 회전 각도로 변환
    state.targetRotation += e.deltaY * 0.15;
    state.velocity = e.deltaY * 0.05;
  }, []);

  // 특정 인덱스로 이동
  const goToIndex = useCallback((index: number) => {
    const state = scrollState.current;
    const targetAngle = -index * ANGLE_PER_CARD;
    // 현재 각도에서 가장 가까운 방향으로 회전
    const currentNormalized = state.currentRotation % 360;
    const diff = targetAngle - currentNormalized;
    const adjustedDiff = ((diff + 180) % 360) - 180;
    state.targetRotation = state.currentRotation + adjustedDiff;
  }, []);

  // 마우스 이벤트
  const onMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX);
    e.preventDefault();
  };
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => handleDragEnd();

  // 터치 이벤트
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  return (
    <section
      className="relative overflow-hidden py-20 md:py-32"
      style={{
        background: 'linear-gradient(180deg, #f6f6f6 0%, #faf8f7 50%, #f5f0ed 100%)',
      }}
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(180,152,141,0.3) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(180,152,141,0.4) 0%, transparent 70%)' }}
        />
      </div>

      {/* Section Header */}
      <div className="container-custom mb-8 md:mb-12 relative z-10">
        <AnimateOnScroll>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="font-serif text-h3 text-primary mb-2">{t('title')}</p>
              <h2 className="text-h1 text-secondary">{t('subtitle')}</h2>
            </div>
            <p className="text-body text-mono-light max-w-md">
              리브성형외과는 정품 인증된 프리미엄 장비만을 사용합니다.
              최신 기술로 안전하고 효과적인 시술을 제공합니다.
            </p>
          </div>
        </AnimateOnScroll>
      </div>

      {/* 3D Carousel Container */}
      <div
        ref={containerRef}
        className="relative h-[500px] md:h-[600px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={handleWheel}
        onMouseEnter={() => setIsHovering(true)}
        style={{ perspective: '1200px' }}
      >
        {/* 원통형 캐러셀 */}
        <div
          ref={carouselRef}
          className="absolute left-1/2 top-1/2 w-0 h-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateX(-50%) translateY(-50%) rotateY(${rotation}deg)`,
            transition: scrollState.current.isDragging ? 'none' : undefined,
          }}
        >
          {devices.map((device, index) => {
            // 각 카드의 각도 계산
            const cardAngle = index * ANGLE_PER_CARD;
            // 현재 회전에 따른 실제 각도
            const currentAngle = normalizeAngle(cardAngle + rotation);
            // 정면(0도)에서의 거리 (0~1)
            const distanceFromFront = Math.abs(currentAngle) / 180;

            // 시각적 효과 계산
            const opacity = 1 - distanceFromFront * 0.7;
            const scale = 1 - distanceFromFront * 0.2;
            const blur = distanceFromFront * 4;
            const brightness = 1 - distanceFromFront * 0.3;

            // 뒤쪽 카드는 숨김
            const isVisible = Math.abs(currentAngle) < 120;

            return (
              <div
                key={device.id}
                className="absolute"
                style={{
                  transform: `rotateY(${cardAngle}deg) translateZ(${RADIUS}px)`,
                  transformStyle: 'preserve-3d',
                  opacity: isVisible ? opacity : 0,
                  pointerEvents: isVisible && Math.abs(currentAngle) < 45 ? 'auto' : 'none',
                }}
              >
                {/* Card */}
                <motion.div
                  className="relative w-[240px] md:w-[280px] rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    transform: `scale(${scale}) rotateY(0deg)`,
                    filter: `blur(${blur}px) brightness(${brightness})`,
                    background: 'linear-gradient(145deg, #ffffff 0%, #faf8f7 100%)',
                    border: '1px solid rgba(180,152,141,0.15)',
                    boxShadow: Math.abs(currentAngle) < 30
                      ? '0 25px 50px -12px rgba(0,0,0,0.25)'
                      : '0 10px 30px -10px rgba(0,0,0,0.15)',
                    transition: 'box-shadow 0.3s ease',
                  }}
                  whileHover={Math.abs(currentAngle) < 45 ? { scale: scale * 1.05 } : {}}
                  onClick={() => Math.abs(currentAngle) < 45 && goToIndex(index)}
                >
                  {/* Device Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-white to-gray-50">
                    <div
                      className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-500"
                      style={{
                        backgroundImage: `url(${device.image})`,
                        transform: Math.abs(currentAngle) < 30 ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />

                    {/* 번호 뱃지 */}
                    <div
                      className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300"
                      style={{
                        background: Math.abs(currentAngle) < 30
                          ? 'linear-gradient(135deg, #b4988d 0%, #6d4e42 100%)'
                          : 'rgba(180,152,141,0.2)',
                        color: Math.abs(currentAngle) < 30 ? 'white' : '#6d4e42',
                      }}
                    >
                      {device.id}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3
                      className="font-serif text-xl font-medium mb-1 transition-colors duration-300"
                      style={{ color: Math.abs(currentAngle) < 30 ? '#b4988d' : '#6d4e42' }}
                    >
                      {device.title}
                    </h3>
                    <p className="text-sm text-mono-light mb-2">{device.subTitle}</p>
                    <p className="text-sm text-mono leading-relaxed opacity-80">
                      {device.desc}
                    </p>

                    {/* Learn More Link */}
                    <Link
                      href={device.link}
                      className="inline-flex items-center gap-2 text-primary text-sm mt-3 transition-all duration-300 hover:gap-3"
                      style={{
                        opacity: Math.abs(currentAngle) < 30 ? 1 : 0,
                        pointerEvents: Math.abs(currentAngle) < 30 ? 'auto' : 'none',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      자세히 보기
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* 좌/우 그라데이션 오버레이 */}
        <div
          className="absolute inset-y-0 left-0 w-32 md:w-48 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(246,246,246,0.95) 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-32 md:w-48 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(246,246,246,0.95) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Navigation Dots */}
      <div className="container-custom mt-8 relative z-10">
        <div className="flex justify-center items-center gap-3">
          {devices.map((device, index) => (
            <button
              key={device.id}
              onClick={() => goToIndex(index)}
              className="group relative p-2"
              aria-label={`Go to ${device.title}`}
            >
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: activeIndex === index
                    ? 'linear-gradient(135deg, #b4988d 0%, #6d4e42 100%)'
                    : 'rgba(180,152,141,0.3)',
                  transform: activeIndex === index ? 'scale(1.5)' : 'scale(1)',
                }}
              />
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: 'rgba(109,78,66,0.9)',
                  color: 'white',
                }}
              >
                {device.subTitle}
              </div>
            </button>
          ))}
        </div>

        {/* Current Device Info */}
        <div className="text-center mt-6">
          <p className="font-mono text-xs text-mono-light mb-1">
            {String(activeIndex + 1).padStart(2, '0')} / {String(CARD_COUNT).padStart(2, '0')}
          </p>
          <p className="font-serif text-lg text-secondary">
            {devices[activeIndex]?.title}
          </p>
        </div>

        {/* Interaction Hint */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 text-xs text-mono-light">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>드래그 또는 스크롤로 탐색</span>
          </div>
        </div>
      </div>
    </section>
  );
}
