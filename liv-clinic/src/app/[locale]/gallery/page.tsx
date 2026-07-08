import { redirect } from 'next/navigation';

// /gallery는 /before-after로 통합됨(Wave-3, M6). 영구 리다이렉트는 next.config.ts의
// redirects()가 라우팅 단계에서 처리하며, 이 페이지 레벨 redirect는 안전망이다.
export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/before-after`);
}
