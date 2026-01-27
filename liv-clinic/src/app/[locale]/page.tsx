import dynamic from 'next/dynamic';
import {
  Hero,
  Equipment,
  Signature,
  CoreValues,
  Doctor,
} from '@/components/sections';

// 동적 임포트 - 스크롤 아래 컴포넌트 지연 로드 (Vercel Best Practice: bundle-dynamic-imports)
// 초기 번들 크기 감소로 LCP(Largest Contentful Paint) 개선
const InstagramFeed = dynamic(
  () => import('@/components/sections/InstagramFeed'),
  { ssr: true }
);

// TODO: 실제 전후 사진 확보 후 다시 활성화
// const BeforeAfterShowcase = dynamic(
//   () => import('@/components/sections/BeforeAfterShowcase'),
//   { ssr: true }
// );

const Location = dynamic(
  () => import('@/components/sections/Location'),
  { ssr: true }
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <Equipment />
      <Signature />
      <CoreValues />
      <Doctor />
      <InstagramFeed />
      {/* TODO: 실제 전후 사진 확보 후 다시 활성화 */}
      {/* <BeforeAfterShowcase /> */}
      <Location />
    </>
  );
}
