import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';
import { pretendard, cormorant } from '@/styles/fonts';
import { Header, Footer, QuickConsultBar } from '@/components/layout';
import ClientSideWidgets from '@/components/layout/ClientSideWidgets';
import ChatWidget from '@/components/chat/ChatWidget';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import NaverAnalytics from '@/components/analytics/NaverAnalytics';
import { generatePageMetadata, generateLocalBusinessSchema, generateWebSiteSchema } from '@/lib/seo';
import { createAdminClient } from '@/lib/supabase-admin';
import '../globals.css';

async function getAnalyticsSettings() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('clinic_settings')
      .select('ga_tracking_id, naver_wcs_id, ga_enabled, naver_enabled')
      .eq('id', 1)
      .single();

    if (data) {
      return {
        gaTrackingId: data.ga_tracking_id || undefined,
        naverWcsId: data.naver_wcs_id || undefined,
        gaEnabled: data.ga_enabled,
        naverEnabled: data.naver_enabled,
      };
    }
  } catch {
    // DB query failed - fall back to env variables
  }
  return null;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
  const webSiteSchema = generateWebSiteSchema();
  const analytics = await getAnalyticsSettings();

  // GA ID: DB 설정 우선, env var 폴백, 형식 검증 (G-XXXXXXXXXX)
  const rawGaId = analytics?.gaTrackingId || process.env.NEXT_PUBLIC_GA_ID;
  const gaId = rawGaId && /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : undefined;

  const htmlLang = LOCALE_META[locale as Locale]?.htmlLang ?? locale;

  return (
    <html lang={htmlLang} className={`${pretendard.variable} ${cormorant.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
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
        <GoogleAnalytics trackingId={analytics?.gaTrackingId} enabled={analytics?.gaEnabled ?? undefined} />
        <NaverAnalytics wcsId={analytics?.naverWcsId} enabled={analytics?.naverEnabled ?? undefined} />
        <a href="#main-content" className="skip-link">
          {tCommon('skipToContent')}
        </a>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main id="main-content" className="min-h-[100dvh] page-enter pb-20 overflow-x-clip" role="main">{children}</main>
          <Footer />
          <QuickConsultBar />
          <ClientSideWidgets />
          {/* ChatWidget은 PR #3에서 도입된 visitor 채팅 (운영자=ko, 환자=en/ja/zh).
              Phase 1 신규 locale (zh-TW/vi/th/ru) 지원은 PR #2b의 Step 6에서 추가 예정. */}
          {(locale === 'en' || locale === 'ja' || locale === 'zh') && (
            <ChatWidget locale={locale} />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
