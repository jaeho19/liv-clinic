import { generateMedicalServiceSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { LASER_CATEGORIES, TREATMENTS, SITE_INFO } from '@/lib/constants';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'skintone')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터
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

export default function SkintoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serviceSchema = generateMedicalServiceSchema(serviceData);
  const pageSchema = generateWebPageSchema({
    path: '/laser/skintone',
    title: `${category.name} | ${SITE_INFO.name}`,
    description: category.description,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '레이저', url: '/laser' },
      { name: category.name, url: '/laser/skintone' },
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
    keywords: [category.name, category.nameEn, '피부톤 개선', '레이저 토닝', '화이트닝', '울블랑', '신사역 피부과'],
    openGraph: {
      title: `${category.name} | ${SITE_INFO.name}`,
      description: category.shortDesc,
      url: `${BASE_URL}/laser/skintone`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
  };
}
