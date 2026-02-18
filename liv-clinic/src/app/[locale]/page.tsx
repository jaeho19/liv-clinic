import dynamic from 'next/dynamic';
import { Hero } from '@/components/sections';

// 동적 임포트 - below-fold 섹션 지연 로드 (Vercel Best Practice: bundle-dynamic-imports)
// Hero만 정적 import로 LCP 보호, 나머지는 코드 스플리팅으로 초기 번들 감소
const Equipment = dynamic(() => import('@/components/sections/Equipment'), { ssr: true });
const Signature = dynamic(() => import('@/components/sections/Signature'), { ssr: true });
const CoreValues = dynamic(() => import('@/components/sections/CoreValues'), { ssr: true });
const Doctor = dynamic(() => import('@/components/sections/Doctor'), { ssr: true });
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
      <Hero />
      <Equipment />
      <Signature />
      <CoreValues />
      <Doctor />
      {/* TODO: 인스타그램 연동 구현 후 다시 활성화 */}
      {/* <InstagramFeed /> */}
      {/* TODO: 실제 전후 사진 확보 후 다시 활성화 */}
      {/* <BeforeAfterShowcase /> */}
      <Location />
    </>
  );
}
