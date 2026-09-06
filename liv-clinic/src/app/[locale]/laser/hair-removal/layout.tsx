import { getTranslations } from 'next-intl/server';
import { generateMedicalServiceSchema } from '@/lib/seo';
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { getTreatmentForeignFaqs } from '@/lib/treatmentsForeign';
import { LASER_CATEGORIES, TREATMENTS } from '@/lib/constants';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'hair-removal')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터 (이름/설명은 로케일별로 오버라이드)
const serviceData = {
  id: category.id,
  category: 'laser',
  name: category.name,
  nameEn: category.nameEn,
  description: category.description,
  shortDesc: category.shortDesc,
  duration: '15-60분 (부위에 따라)',
  anesthesia: '무마취 (크라이오겐 쿨링)',
  recovery: '즉시 일상 복귀',
  targetAreas: ['얼굴', '겨드랑이', '팔', '다리', '비키니라인', '등', '가슴'],
  benefits: [
    { title: '755nm 골드 스탠다드', desc: '알렉산드라이트 - 제모의 최고 표준' },
    { title: '크라이오겐 쿨링', desc: '젤 없이 쾌적한 시술' },
    { title: 'IntelliTrak', desc: '놓치는 부분 없이 균일한 제모' },
    { title: '영구적 효과', desc: '6-10회 시술로 영구 제모 달성' },
  ],
  faqs: featuredEquipment?.faqs || [],
};

export default async function HairRemovalLayout({
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
  const description = tMeta('laserHairRemoval.description');

  const serviceSchema = generateMedicalServiceSchema(
    // 외국인 안내 블록(P1-2)의 Q&A 2개를 FAQ에 합친다 — en·ja·zh·zh-TW 외에는 빈 배열
    { ...serviceData, name, description, faqs: [...serviceData.faqs, ...getTreatmentForeignFaqs('hair-removal', locale)] },
    { reservationWord: tT('common.consultationCta'), locale },
  );
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'laserHairRemoval',
    path: '/laser/hair-removal',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { home: true },
      { navKey: 'laser', url: '/laser' },
      { name, url: '/laser/hair-removal' },
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
  return buildLocalizedMetadata(locale, 'laserHairRemoval', '/laser/hair-removal');
}
