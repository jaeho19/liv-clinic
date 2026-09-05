import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';
import { isGuideLocale } from '@/lib/guides/types';
import { PRICING_FOREIGN } from '@/lib/pricingForeign';

type LayoutParams = { params: Promise<{ locale: string }> };

// SITE_INFO.name is Korean-only, so non-ko locales use the English site name
// to keep titles / OG / JSON-LD free of Korean.
const siteNameFor = (locale: string) => (locale === 'ko' ? SITE_INFO.name : SITE_INFO.nameEn);

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingGuide' });

  const siteName = siteNameFor(locale);
  const title = `${t('hero.title')} | ${siteName}`;
  // 외국어 4개 로케일은 "동일 가격·VAT 별도·해외 카드" 요지를 검색 설명에 덧붙인다(P1-3)
  const description = isGuideLocale(locale)
    ? `${t('hero.description')} ${PRICING_FOREIGN[locale].metaSuffix}`
    : t('hero.description');

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/pricing`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/pricing`,
      siteName,
      type: 'website',
    },
  };
}

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingGuide' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const pageSchema = generateWebPageSchema({
    path: '/pricing',
    title: `${t('hero.title')} | ${siteNameFor(locale)}`,
    description: t('hero.description'),
    locale,
    type: 'WebPage',
    breadcrumbs: [
      { name: tCommon('home'), url: '/' },
      { name: t('hero.title'), url: '/pricing' },
    ],
  });

  return (
    <>
      {/* WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {children}
    </>
  );
}
