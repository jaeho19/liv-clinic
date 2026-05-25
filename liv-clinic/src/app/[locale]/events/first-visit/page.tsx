import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';
import { LOCALES } from '@/i18n/routing';
import FirstVisitTrialSection from '@/components/sections/FirstVisitTrialSection';

// Design Ref: §6 Page & Routing — 서버 컴포넌트 + 로케일별 generateMetadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'firstVisit.meta' });
  const url = `${BASE_URL}/${locale}/events/first-visit`;
  const ogImage = `${BASE_URL}/images/placeholder-event.jpg`;

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url,
      siteName: SITE_INFO.name,
      type: 'website',
      images: [{ url: ogImage, width: 800, height: 1200, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE_URL}/${l}/events/first-visit`])
      ),
    },
  };
}

export default function FirstVisitPage() {
  return <FirstVisitTrialSection />;
}
