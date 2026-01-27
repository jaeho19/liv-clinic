import { generateMedicalServiceSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { LASER_CATEGORIES, TREATMENTS, SITE_INFO } from '@/lib/constants';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'pigmentation')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터
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

export default function PigmentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serviceSchema = generateMedicalServiceSchema(serviceData);
  const pageSchema = generateWebPageSchema({
    path: '/laser/pigmentation',
    title: `${category.name} | ${SITE_INFO.name}`,
    description: category.description,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '레이저', url: '/laser' },
      { name: category.name, url: '/laser/pigmentation' },
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

export async function generateMetadata() {
  return {
    title: `${category.name} | ${SITE_INFO.name}`,
    description: category.description,
    keywords: [category.name, category.nameEn, '기미 치료', '색소 레이저', '잡티 제거', '피코 레이저', '신사역 피부과'],
    openGraph: {
      title: `${category.name} | ${SITE_INFO.name}`,
      description: category.shortDesc,
      url: `${BASE_URL}/laser/pigmentation`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
  };
}
