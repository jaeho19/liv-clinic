import { getTranslations } from 'next-intl/server';
import { generateMedicalServiceSchema } from '@/lib/seo';
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { getTreatmentForeignFaqs } from '@/lib/treatmentsForeign';
import { LASER_CATEGORIES, TREATMENTS } from '@/lib/constants';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'pigmentation')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터 (이름/설명은 로케일별로 오버라이드)
const serviceData = {
  id: category.id,
  category: 'laser',
  name: category.name,
  nameEn: category.nameEn,
  description: category.description,
  shortDesc: category.shortDesc,
  duration: '20-40분',
  anesthesia: '마취 크림 (선택)',
  recovery: '3-7일 (미세 딱지 가능)',
  targetAreas: ['기미', '잡티', '주근깨', '검버섯', '오타모반'],
  benefits: [
    { title: '3단계 치료 시스템', desc: '경증, 중등도, 중증에 따른 맞춤 치료' },
    { title: '피코세컨드 기술', desc: '난치성 기미도 효과적 분해' },
    { title: '듀얼 파장', desc: '755nm + 1064nm로 깊이별 색소 타겟' },
    { title: '최소 다운타임', desc: '일상생활 즉시 복귀 가능' },
  ],
  faqs: featuredEquipment?.faqs || [],
};

export default async function PigmentationLayout({
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
  const description = tMeta('laserPigmentation.description');

  const serviceSchema = generateMedicalServiceSchema(
    // 외국인 안내 블록(P1-2)의 Q&A 2개를 FAQ에 합친다 — en·ja·zh·zh-TW 외에는 빈 배열
    { ...serviceData, name, description, faqs: [...serviceData.faqs, ...getTreatmentForeignFaqs('pigmentation', locale)] },
    { reservationWord: tT('common.consultationCta'), locale },
  );
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'laserPigmentation',
    path: '/laser/pigmentation',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { home: true },
      { navKey: 'laser', url: '/laser' },
      { name, url: '/laser/pigmentation' },
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
  return buildLocalizedMetadata(locale, 'laserPigmentation', '/laser/pigmentation');
}
