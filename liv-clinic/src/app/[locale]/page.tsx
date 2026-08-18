import dynamic from 'next/dynamic';
import { Hero, HomeFirstVisitSlimBanner } from '@/components/sections';

// 동적 임포트 - below-fold 섹션 지연 로드 (Vercel Best Practice: bundle-dynamic-imports)
// Hero + HomeFirstVisitSlimBanner만 정적 import (LCP 영역 / 헤더 직하 즉시 노출).
// 나머지는 코드 스플리팅으로 초기 번들 감소
// Design Ref: §6.1 — SlimBanner 정적(D6) 유지. HomePromo는 사용자 결정으로 미사용.
const CoreValues = dynamic(() => import('@/components/sections/CoreValues'), { ssr: true });
const ConcernPathways = dynamic(() => import('@/components/sections/ConcernPathways'), { ssr: true });
const Signature = dynamic(() => import('@/components/sections/Signature'), { ssr: true });
const Doctor = dynamic(() => import('@/components/sections/Doctor'), { ssr: true });
const ReviewsSection = dynamic(() => import('@/components/sections/ReviewsSection'), { ssr: true });
const MediaNewsSection = dynamic(() => import('@/components/sections/MediaNewsSection'), { ssr: true });
const Equipment = dynamic(() => import('@/components/sections/Equipment'), { ssr: true });
// TODO: 인스타그램 연동 구현 후 다시 활성화
// const InstagramFeed = dynamic(() => import('@/components/sections/InstagramFeed'), { ssr: true });

// TODO: 실제 전후 사진 확보 후 다시 활성화
// const BeforeAfterShowcase = dynamic(
//   () => import('@/components/sections/BeforeAfterShowcase'),
//   { ssr: true }
// );

const Location = dynamic(() => import('@/components/sections/Location'), { ssr: true });

/**
 * 홈 정보 위계 (2026-08 IA 개선 — docs/02-design/features/marketing-attribution.design.md §6):
 * 1 핵심 메시지·CTA(배너+Hero) → 2 선택 근거(CoreValues) → 3 고민별 진입(ConcernPathways)
 * → 4 대표 프로그램(Signature) → 5 원장 전문성(Doctor) → 6 후기(Reviews)
 * → 7 의료정보·미디어(MediaNews) → 8 장비(Equipment, 하단 이동) → 9 위치·상담(Location)
 * 장비를 히어로 직후에서 하단으로 옮겨 '장비 중심 병원' 인상 대신 고민·시술 중심으로 재배열.
 */
export default function HomePage() {
  return (
    <>
      <HomeFirstVisitSlimBanner />
      <Hero />
      <CoreValues />
      <ConcernPathways />
      <Signature />
      <Doctor />
      <ReviewsSection />
      <MediaNewsSection />
      {/* TODO: 인스타그램 연동 구현 후 다시 활성화 */}
      {/* <InstagramFeed /> */}
      {/* TODO: 실제 전후 사진 확보 후 다시 활성화 */}
      {/* <BeforeAfterShowcase /> */}
      <Equipment />
      <Location />
    </>
  );
}
