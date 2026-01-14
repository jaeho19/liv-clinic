import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { pretendard, cormorant } from '@/styles/fonts';
import { Header, Footer, FloatingCTA, BackToTop, ScrollProgress, QuickConsultBar } from '@/components/layout';
import { GoogleAnalytics } from '@/components/analytics';
import { generatePageMetadata, generateLocalBusinessSchema, BASE_URL } from '@/lib/seo';
import '../globals.css';

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

  const localBusinessSchema = generateLocalBusinessSchema();

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Naver Search Advisor */}
        {process.env.NEXT_PUBLIC_NAVER_VERIFICATION && (
          <meta name="naver-site-verification" content={process.env.NEXT_PUBLIC_NAVER_VERIFICATION} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        <GoogleAnalytics />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          {skipToContentText[locale as keyof typeof skipToContentText] || skipToContentText.en}
        </a>
        <NextIntlClientProvider messages={messages}>
          <ScrollProgress />
          <Header />
          <main id="main-content" className="min-h-screen page-enter" role="main">{children}</main>
          <Footer />
          <QuickConsultBar />
          <FloatingCTA />
          <BackToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
