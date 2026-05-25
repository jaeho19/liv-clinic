import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';

type LayoutParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricingGuide' });

  const title = `${t('hero.title')} | ${SITE_INFO.name}`;
  const description = t('hero.description');

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
      siteName: SITE_INFO.name,
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
    title: `${t('hero.title')} | ${SITE_INFO.name}`,
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
