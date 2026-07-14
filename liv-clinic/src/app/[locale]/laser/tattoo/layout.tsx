import { getTranslations } from 'next-intl/server';
import { generateMedicalServiceSchema } from '@/lib/seo';
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { LASER_CATEGORIES, TREATMENTS } from '@/lib/constants';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'tattoo')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터 (이름/설명은 로케일별로 오버라이드)
const serviceData = {
  id: category.id,
  category: 'laser',
  name: category.name,
  nameEn: category.nameEn,
  description: category.description,
  shortDesc: category.shortDesc,
  duration: '15-30분',
  anesthesia: '마취 크림 (30분)',
  recovery: '3-7일 (미세 딱지)',
  targetAreas: ['흑색 문신', '컬러 문신', '아이라인', '눈썹 문신', '반영구 화장'],
  benefits: [
    { title: '피코세컨드 기술', desc: '나노초 대비 1000배 빠른 펄스로 효과적 분해' },
    { title: '미세 색소 분해', desc: '문신 입자를 미세하게 분쇄하여 빠른 배출' },
    { title: '주변 조직 보호', desc: '열 손상 최소화로 흉터 위험 감소' },
    { title: '컬러 문신 대응', desc: '클래리티 병행으로 다양한 색상 제거' },
  ],
  faqs: featuredEquipment?.faqs || [],
};

export default async function TattooLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tT = await getTranslations({ locale, namespace: 'treatments' });
  const tMeta = await getTranslations({ locale, namespace: 'metaSeo' });
  const name = (tT.raw('laser') as Record<string, { name: string }>)[category.id].name;
  const description = tMeta('laserTattoo.description');

  const serviceSchema = generateMedicalServiceSchema(
    { ...serviceData, name, description },
    { reservationWord: tT('common.consultationCta'), locale },
  );
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'laserTattoo',
    path: '/laser/tattoo',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { home: true },
      { navKey: 'laser', url: '/laser' },
      { name, url: '/laser/tattoo' },
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'laserTattoo', '/laser/tattoo');
}
