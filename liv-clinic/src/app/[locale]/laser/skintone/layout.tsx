import { getTranslations } from 'next-intl/server';
import { generateMedicalServiceSchema } from '@/lib/seo';
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { LASER_CATEGORIES, TREATMENTS } from '@/lib/constants';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'skintone')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터 (이름/설명은 로케일별로 오버라이드)
const serviceData = {
  id: category.id,
  category: 'laser',
  name: category.name,
  nameEn: category.nameEn,
  description: category.description,
  shortDesc: category.shortDesc,
  duration: '30-45분',
  anesthesia: '무마취',
  recovery: '즉시 일상 복귀',
  targetAreas: ['얼굴 전체', '목', '손등', '칙칙한 피부'],
  benefits: [
    { title: '울블랑 + 토닝', desc: '시너지 효과로 투명한 피부톤' },
    { title: '저자극 반복', desc: '다운타임 없이 꾸준한 관리' },
    { title: '멜라닌 점진적 분해', desc: '안전하고 자연스러운 화이트닝' },
    { title: '피부결 개선', desc: '모공 축소 및 피부결 정돈' },
  ],
  faqs: featuredEquipment?.faqs || [],
};

export default async function SkintoneLayout({
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
  const description = tMeta('laserSkintone.description');

  const serviceSchema = generateMedicalServiceSchema(
    { ...serviceData, name, description },
    { reservationWord: tT('common.consultationCta') },
  );
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'laserSkintone',
    path: '/laser/skintone',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { home: true },
      { navKey: 'laser', url: '/laser' },
      { name, url: '/laser/skintone' },
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
  return buildLocalizedMetadata(locale, 'laserSkintone', '/laser/skintone');
}
