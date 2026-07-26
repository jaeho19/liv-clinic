import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';
import { pretendard, cormorant, notoSansArabic } from '@/styles/fonts';
import { Header, Footer, QuickConsultBar } from '@/components/layout';
import ClientSideWidgets from '@/components/layout/ClientSideWidgets';
import ChatWidget from '@/components/chat/ChatWidget';
import { CHAT_VISITOR_LOCALES, type VisitorLocale } from '@/lib/chat/chatApi';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import NaverAnalytics from '@/components/analytics/NaverAnalytics';
import { generatePageMetadata, generateLocalBusinessSchema, generateWebSiteSchema } from '@/lib/seo';
import '../globals.css';

// ISR: 공개 페이지는 1시간 단위로 재생성하여 TTFB 최소화
// (admin 영역은 force-dynamic이 자동 적용되므로 영향 없음)
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Narrows a raw route locale to VisitorLocale so ChatWidget stays type-safe
// without duplicating the whitelist (SSOT: CHAT_VISITOR_LOCALES).
function isChatVisitorLocale(value: string): value is VisitorLocale {
  return (CHAT_VISITOR_LOCALES as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({ locale });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const localBusinessSchema = generateLocalBusinessSchema(locale);
  const webSiteSchema = generateWebSiteSchema(locale);

  // GA ID: 환경변수 한정 (DB 호출 제거로 TTFB 최적화). 형식 검증 (G-XXXXXXXXXX)
  const rawGaId = process.env.NEXT_PUBLIC_GA_ID;
  const gaId = rawGaId && /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : undefined;

  const meta = LOCALE_META[locale as Locale];
  const htmlLang = meta?.htmlLang ?? locale;
  const htmlDir = meta?.dir ?? 'ltr';

  const fontClasses = [
    pretendard.variable,
    cormorant.variable,
    locale === 'ar' ? notoSansArabic.variable : '',
  ].filter(Boolean).join(' ');

  return (
    <html lang={htmlLang} dir={htmlDir} className={fontClasses} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Hero LCP 가속: poster 이미지 preload */}
        <link rel="preload" as="image" href="/images/hero/hero-1.jpg" fetchPriority="high" />
        <meta name="theme-color" content="#b4988d" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" />
        {/* Google Search Console */}
        <meta name="google-site-verification" content="XBntgcmReJ3Xf1PKBZrdhRcAq5KDEzjcQwyXK5Ehx8A" />
        {/* Naver Search Advisor */}
        {process.env.NEXT_PUBLIC_NAVER_VERIFICATION && (
          <meta name="naver-site-verification" content={process.env.NEXT_PUBLIC_NAVER_VERIFICATION} />
        )}
        {/* LocalBusiness Schema (E-E-A-T) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        {/* WebSite Schema (AI 검색 최적화 - SearchAction) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteSchema),
          }}
        />
        {/* Google Consent Mode v2 - must load BEFORE gtag.js */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent','default',{
                'analytics_storage':'granted',
                'ad_storage':'denied',
                'ad_user_data':'denied',
                'ad_personalization':'denied',
                'functionality_storage':'granted',
                'personalization_storage':'denied',
                'security_storage':'granted'
              });
            `,
          }}
        />
        {/* Google Analytics - gtag.js (head 삽입) */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                    send_page_view: true,
                    cookie_flags: 'SameSite=None;Secure',
                    language: document.documentElement.lang || 'ko'
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased overflow-x-clip w-full">
        <GoogleAnalytics />
        <NaverAnalytics />
        <a href="#main-content" className="skip-link">
          {tCommon('skipToContent')}
        </a>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main id="main-content" className="min-h-[100dvh] page-enter pb-20 overflow-x-clip" role="main">{children}</main>
          <Footer />
          <QuickConsultBar />
          <ClientSideWidgets />
          {/* ChatWidget: 운영자(ko) ↔ 환자(non-ko). CHAT_VISITOR_LOCALES(SSOT)로 활성.
              ko는 카카오톡 채널로 응대하므로 의도적 제외 — 나머지 외국어 로케일 전체가 대상. */}
          {isChatVisitorLocale(locale) && <ChatWidget locale={locale} />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
