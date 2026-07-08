import dynamic from 'next/dynamic';
import { Hero, HomeFirstVisitSlimBanner } from '@/components/sections';

// 동적 임포트 - below-fold 섹션 지연 로드 (Vercel Best Practice: bundle-dynamic-imports)
// Hero + HomeFirstVisitSlimBanner만 정적 import (LCP 영역 / 헤더 직하 즉시 노출).
// 나머지는 코드 스플리팅으로 초기 번들 감소
// Design Ref: §6.1 — SlimBanner 정적(D6) 유지. HomePromo는 사용자 결정으로 미사용.
const Equipment = dynamic(() => import('@/components/sections/Equipment'), { ssr: true });
const Signature = dynamic(() => import('@/components/sections/Signature'), { ssr: true });
const CoreValues = dynamic(() => import('@/components/sections/CoreValues'), { ssr: true });
const Doctor = dynamic(() => import('@/components/sections/Doctor'), { ssr: true });
const MediaNewsSection = dynamic(() => import('@/components/sections/MediaNewsSection'), { ssr: true });
const ReviewsSection = dynamic(() => import('@/components/sections/ReviewsSection'), { ssr: true });
// TODO: 인스타그램 연동 구현 후 다시 활성화
// const InstagramFeed = dynamic(() => import('@/components/sections/InstagramFeed'), { ssr: true });

// TODO: 실제 전후 사진 확보 후 다시 활성화
// const BeforeAfterShowcase = dynamic(
//   () => import('@/components/sections/BeforeAfterShowcase'),
//   { ssr: true }
// );

const Location = dynamic(() => import('@/components/sections/Location'), { ssr: true });

export default function HomePage() {
  return (
    <>
      <HomeFirstVisitSlimBanner />
      <Hero />
      <Equipment />
      <Signature />
      <CoreValues />
      <Doctor />
      <MediaNewsSection />
      <ReviewsSection />
      {/* TODO: 인스타그램 연동 구현 후 다시 활성화 */}
      {/* <InstagramFeed /> */}
      {/* TODO: 실제 전후 사진 확보 후 다시 활성화 */}
      {/* <BeforeAfterShowcase /> */}
      <Location />
    </>
  );
}
