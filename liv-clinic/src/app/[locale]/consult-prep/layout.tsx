import { getTranslations } from 'next-intl/server';
import { generatePageMetadata, getSiteName } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consultPrep' });
  return generatePageMetadata({
    locale,
    path: '/consult-prep',
    title: `${t('title')} | ${getSiteName(locale)}`,
    description: t('disclaimer'),
  });
}

export default function ConsultPrepLayout({ children }: { children: React.ReactNode }) {
  return children;
}
