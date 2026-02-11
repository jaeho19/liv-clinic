import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { pretendard, cormorant } from '@/styles/fonts';
import { Header, Footer, QuickConsultBar } from '@/components/layout';
import ClientSideWidgets from '@/components/layout/ClientSideWidgets';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import NaverAnalytics from '@/components/analytics/NaverAnalytics';
import { generatePageMetadata, generateLocalBusinessSchema, generateWebSiteSchema, BASE_URL } from '@/lib/seo';
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
  if (!routing.locales.includes(locale as 'ko' | 'en' | 'ja' | 'zh')) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  const localBusinessSchema = generateLocalBusinessSchema(locale);
  const webSiteSchema = generateWebSiteSchema();
  const analytics = await getAnalyticsSettings();

  const skipToContentText = {
    ko: '본문으로 건너뛰기',
    en: 'Skip to main content',
    ja: 'メインコンテンツにスキップ',
    zh: '跳转到主要内容',
  };

  return (
    <html lang={locale} className={`${pretendard.variable} ${cormorant.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b4988d" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5" />
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
      </head>
      <body className="antialiased overflow-x-clip w-full">
        <GoogleAnalytics trackingId={analytics?.gaTrackingId} enabled={analytics?.gaEnabled} />
        <NaverAnalytics wcsId={analytics?.naverWcsId} enabled={analytics?.naverEnabled} />
        <a href="#main-content" className="skip-link">
          {skipToContentText[locale as keyof typeof skipToContentText] || skipToContentText.en}
        </a>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main id="main-content" className="min-h-[100dvh] page-enter pb-20 overflow-x-clip" role="main">{children}</main>
          <Footer />
          <QuickConsultBar />
          <ClientSideWidgets />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
