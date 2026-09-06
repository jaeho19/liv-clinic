import { getTranslations } from 'next-intl/server';
import { generateMedicalServiceSchema, generateWebPageSchema } from '@/lib/seo';
import { LASER_CATEGORIES, SITE_INFO } from '@/lib/constants';
import { getTreatmentForeignFaqs } from '@/lib/treatmentsForeign';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

// Get static category data (color, href, etc.)
const categoryStatic = LASER_CATEGORIES.find(c => c.id === 'vascular')!;

// SITE_INFO.name is Korean-only, so non-ko locales use the English site name
// to keep titles / OG / JSON-LD free of Korean.
const siteNameFor = (locale: string) => (locale === 'ko' ? SITE_INFO.name : SITE_INFO.nameEn);

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
    faqs: [
      ...[0, 1, 2, 3].map(i => ({
        q: t(`laser.vascular.detail.faq.${i}.q`),
        a: t(`laser.vascular.detail.faq.${i}.a`),
      })),
      // 외국인 안내 블록(P1-2)의 Q&A 2개 — en·ja·zh·zh-TW 외에는 빈 배열
      ...getTreatmentForeignFaqs('vascular', locale),
    ],
  };

  const serviceSchema = generateMedicalServiceSchema(serviceData, { locale });
  const pageSchema = generateWebPageSchema({
    path: '/laser/vascular',
    title: `${categoryName} | ${siteNameFor(locale)}`,
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

// 메타데이터 — 다른 레이저 페이지처럼 metaSeo.laserVascular(11개 로케일) 기준.
// 기존 방식은 시술 본문 설명(zh 21자·ja 31자)을 그대로 meta description으로 써 Bing에 "짧은 설명"으로 잡혔다.
export async function generateMetadata({ params }: MetadataProps) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'laserVascular', '/laser/vascular');
}
