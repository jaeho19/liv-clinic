import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';
import { pretendard, cormorant, notoSansArabic } from '@/styles/fonts';
import '../../globals.css';

/**
 * (viewer) — 「크게 보기」처럼 한 화면을 꽉 채우는 전용 페이지용 두 번째 루트 레이아웃.
 *
 * `[locale]/layout.tsx`가 붙이는 헤더·푸터·빠른 상담 바·팝업·채팅 위젯·분석 스크립트를 일부러 싣지 않는다
 * (admin/layout.tsx 와 같은 방식). 페이지는 서버 컴포넌트로 번역을 다 끝내서 내려보내므로
 * NextIntlClientProvider 도 없다 — 이 트리의 클라이언트 컴포넌트는 문구를 prop 으로 받아야 한다.
 */

// 핀치 확대 허용(maximumScale 5) — 모바일에서는 이 확대가 「크게 보기」의 핵심이다.
// 수동 <meta name="viewport"> 를 쓰면 Next 가 기본 태그를 하나 더 넣으므로 viewport export 로 선언한다.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#111111',
};

export default async function ViewerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const meta = LOCALE_META[locale as Locale];
  const fontClasses = [
    pretendard.variable,
    cormorant.variable,
    locale === 'ar' ? notoSansArabic.variable : '',
  ].filter(Boolean).join(' ');

  return (
    <html lang={meta?.htmlLang ?? locale} dir={meta?.dir ?? 'ltr'} className={fontClasses} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      {/* globals.css 의 레이어 밖 `body { background-color; color }` 규칙이 Tailwind 유틸리티(레이어 안)보다
          우선하므로 인라인 스타일로 어두운 배경·흰 글자를 준다 */}
      <body className="antialiased" style={{ backgroundColor: '#111111', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}
