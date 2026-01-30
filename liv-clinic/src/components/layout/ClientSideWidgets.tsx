'use client';

import dynamic from 'next/dynamic';

// 클라이언트 사이드에서만 로드되는 위젯들
// Server Component에서 ssr: false를 사용할 수 없어서 Client Component 래퍼로 분리

const FloatingCTA = dynamic(
  () => import('@/components/layout/FloatingCTA'),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import('@/components/layout/BackToTop'),
  { ssr: false }
);

const ScrollProgress = dynamic(
  () => import('@/components/layout/ScrollProgress'),
  { ssr: false }
);

const PopupManager = dynamic(
  () => import('@/components/layout/PopupManager'),
  { ssr: false }
);

export default function ClientSideWidgets() {
  return (
    <>
      <ScrollProgress />
      <FloatingCTA />
      <BackToTop />
      <PopupManager />
    </>
  );
}
