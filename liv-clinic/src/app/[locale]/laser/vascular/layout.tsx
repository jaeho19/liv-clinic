import { getTranslations } from 'next-intl/server';
import { generateMedicalServiceSchema, generateWebPageSchema, BASE_URL, buildHreflangMap } from '@/lib/seo';
import { LASER_CATEGORIES, SITE_INFO } from '@/lib/constants';

// Get static category data (color, href, etc.)
const categoryStatic = LASER_CATEGORIES.find(c => c.id === 'vascular')!;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function VascularLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'treatments' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  // Translated category data
  const categoryName = t('laser.vascular.name');
  const categoryDescription = t('laser.vascular.description');

  // Translated service data for schema
  const serviceData = {
    id: categoryStatic.id,
    category: 'laser',
    name: categoryName,
    nameEn: categoryStatic.nameEn,
    description: categoryDescription,
    shortDesc: t('laser.vascular.tagline'),
    duration: t('laser.vascular.detail.clarity.duration'),
    anesthesia: t('laser.vascular.detail.clarity.anesthesia'),
    recovery: t('laser.vascular.detail.clarity.recovery'),
    targetAreas: [0, 1, 2, 3].map(i => t(`laser.vascular.detail.rednessTypes.types.${i}.type`)),
    benefits: [0, 1, 2, 3].map(i => ({
      title: t(`laser.vascular.detail.clarity.benefits.${i}.title`),
      desc: t(`laser.vascular.detail.clarity.benefits.${i}.desc`),
    })),
    faqs: [0, 1, 2, 3].map(i => ({
      q: t(`laser.vascular.detail.faq.${i}.q`),
      a: t(`laser.vascular.detail.faq.${i}.a`),
    })),
  };

  const serviceSchema = generateMedicalServiceSchema(serviceData);
  const pageSchema = generateWebPageSchema({
    path: '/laser/vascular',
    title: `${categoryName} | ${SITE_INFO.name}`,
    description: categoryDescription,
    locale,
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: tCommon('home') || 'Home', url: '/' },
      { name: tNav('laser') || 'Laser', url: '/laser' },
      { name: categoryName, url: '/laser/vascular' },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {children}
    </>
  );
}

interface MetadataProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MetadataProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'treatments' });

  const categoryName = t('laser.vascular.name');
  const categoryDescription = t('laser.vascular.description');
  const categoryTagline = t('laser.vascular.tagline');

  // Locale-specific keywords
  const keywordsByLocale: Record<string, string[]> = {
    ko: ['홍조 치료', '혈관 레이저', '모세혈관 확장', '주사비', '신사역 피부과'],
    en: ['redness treatment', 'vascular laser', 'spider veins', 'rosacea', 'Sinsa dermatology'],
    zh: ['红血丝治疗', '血管激光', '毛细血管扩张', '酒糟鼻', '新沙皮肤科'],
    ja: ['赤ら顔治療', '血管レーザー', '毛細血管拡張', '酒さ', '新沙皮膚科'],
  };

  return {
    title: `${categoryName} | ${SITE_INFO.name}`,
    description: categoryDescription,
    keywords: [categoryName, categoryStatic.nameEn, ...(keywordsByLocale[locale] || keywordsByLocale.en)],
    openGraph: {
      title: `${categoryName} | ${SITE_INFO.name}`,
      description: categoryTagline,
      url: `${BASE_URL}/${locale}/laser/vascular`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/laser/vascular`,
      languages: buildHreflangMap('/laser/vascular'),
    },
  };
}
