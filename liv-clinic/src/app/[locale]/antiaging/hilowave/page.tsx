'use client';

// Design Ref: §2 — Option C(실용 균형). 1회성 통이미지 페이지이므로 공유 모듈 없이
// 이 파일 안에 이미지 manifest 상수 + 히어로 좌표 상수 + 작은 FadeUpImage 블록으로 구성.
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';

// 좌표 미세조정용 토글 — true 면 히어로 버튼 오버레이에 외곽선/반투명 표시
// Design Ref: §5.1 — DEBUG 토글
const DEBUG = false;

const IMG_DIR = '/images/antiaging/hilowave';

// 통이미지 위에 % 절대좌표로 얹는 영상 오버레이 (피부 단면 다이어그램 → 애니메이션)
interface VideoOverlay {
  src: string;
  poster: string;
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
}

interface StackImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  videoOverlay?: VideoOverlay;
}

interface HeroButton {
  label: string;
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
  href: string;
  external: boolean;
}

// 히어로(1번 이미지) — priority 로딩
const HERO: StackImage = {
  src: `${IMG_DIR}/hilowave-1.jpg`,
  width: 1920,
  height: 1208,
  alt: '힐로웨이브 히어로 — 피부 깊숙이 차오르는 탄력의 흐름',
};

// 히어로 위 투명 오버레이 버튼 2개 (% 절대좌표 → 비율 유지로 PC/모바일 동일 적용)
// Design Ref: §3.2 / Plan §5 — 측정된 좌표
const HERO_BUTTONS: HeroButton[] = [
  {
    label: '상담 예약',
    topPct: 80,
    leftPct: 8,
    widthPct: 16.8,
    heightPct: 5.8,
    href: '/contact',
    external: false,
  },
  {
    label: '카카오 상담',
    topPct: 80,
    leftPct: 27.3,
    widthPct: 17.5,
    heightPct: 5.8,
    href: 'https://pf.kakao.com/_hgFwn',
    external: true,
  },
];

// 2~9번 이미지 (실측 치수 — CLS 방지)
// Design Ref: §3.1 — IMAGES manifest
const IMAGES: StackImage[] = [
  { src: `${IMG_DIR}/hilowave-2.jpg`, width: 1920, height: 1071, alt: '지금 이런 변화가 느껴지시나요' },
  {
    src: `${IMG_DIR}/hilowave-3.jpg`,
    width: 1920,
    height: 988,
    alt: '힐로웨이브란 — 피부 단면 다이어그램',
    // 우측 피부 단면 다이어그램 자리를 동일 디자인의 애니메이션 영상으로 대체
    videoOverlay: {
      src: '/videos/hilowave-skin.mp4',
      poster: '/videos/hilowave-skin-poster.jpg',
      topPct: 28.34,
      leftPct: 40.94,
      widthPct: 57.29,
      heightPct: 58.81,
    },
  },
  { src: `${IMG_DIR}/hilowave-4.jpg`, width: 1920, height: 1145, alt: '이런 분께 추천합니다' },
  { src: `${IMG_DIR}/hilowave-5.jpg`, width: 1920, height: 1128, alt: '자연스러운 변화의 무드' },
  { src: `${IMG_DIR}/hilowave-6.jpg`, width: 1920, height: 972, alt: 'HILO WAVE PROGRAM 가격 안내' },
  { src: `${IMG_DIR}/hilowave-7.jpg`, width: 1920, height: 1004, alt: '과하지 않게, 하지만 확실하게' },
  { src: `${IMG_DIR}/hilowave-8.jpg`, width: 1920, height: 2058, alt: '의료진 소개 — 김수영·천신혜 대표원장' },
  { src: `${IMG_DIR}/hilowave-9.jpg`, width: 1920, height: 2189, alt: 'LIV EXPERIENCE 공간' },
];

// 스크롤 진입 시 fade-up + 미세 hover 효과 블록
// Plan SC7 — fade-up / Design Ref: §5.1 D4 — 미세 hover
function FadeUpImage({ img }: { img: StackImage }) {
  const v = img.videoOverlay;
  return (
    <motion.div
      className="relative w-full max-w-[1920px] mx-auto transition-transform transition-shadow duration-500 hover:scale-[1.005] hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <Image
        src={img.src}
        width={img.width}
        height={img.height}
        alt={img.alt}
        quality={95}
        sizes="100vw"
        className="block w-full h-auto"
      />
      {v && (
        <video
          src={v.src}
          poster={v.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute z-[1] object-cover pointer-events-none"
          style={{
            top: `${v.topPct}%`,
            left: `${v.leftPct}%`,
            width: `${v.widthPct}%`,
            height: `${v.heightPct}%`,
          }}
        />
      )}
    </motion.div>
  );
}

export default function HiloWavePage() {
  return (
    // 가로 스크롤 원천 차단 — Plan SC5
    <main className="overflow-x-hidden bg-white">
      {/* 히어로 블록 (priority) + 투명 오버레이 버튼 2개 */}
      <section className="relative w-full max-w-[1920px] mx-auto">
        <Image
          src={HERO.src}
          width={HERO.width}
          height={HERO.height}
          alt={HERO.alt}
          quality={95}
          priority
          sizes="100vw"
          className="block w-full h-auto"
        />
        {HERO_BUTTONS.map((b) => {
          const style = {
            top: `${b.topPct}%`,
            left: `${b.leftPct}%`,
            width: `${b.widthPct}%`,
            height: `${b.heightPct}%`,
          };
          const className = `absolute z-10 rounded-md transition-colors duration-300 hover:bg-white/15 ${
            DEBUG ? 'outline outline-2 outline-red-500 bg-red-500/20' : ''
          }`;

          return b.external ? (
            <a
              key={b.label}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={b.label}
              className={className}
              style={style}
            />
          ) : (
            <Link
              key={b.label}
              href={b.href}
              aria-label={b.label}
              className={className}
              style={style}
            />
          );
        })}
      </section>

      {/* 2~9번 이미지 — 풀폭 세로 스택 + fade-up */}
      {IMAGES.map((img) => (
        <FadeUpImage key={img.src} img={img} />
      ))}
    </main>
  );
}
