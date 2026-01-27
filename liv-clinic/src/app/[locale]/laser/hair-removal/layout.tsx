import { generateMedicalServiceSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { LASER_CATEGORIES, TREATMENTS, SITE_INFO } from '@/lib/constants';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'hair-removal')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터
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

export default function HairRemovalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serviceSchema = generateMedicalServiceSchema(serviceData);
  const pageSchema = generateWebPageSchema({
    path: '/laser/hair-removal',
    title: `${category.name} | ${SITE_INFO.name}`,
    description: category.description,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '레이저', url: '/laser' },
      { name: category.name, url: '/laser/hair-removal' },
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
    keywords: [category.name, category.nameEn, '레이저 제모', '영구 제모', '클래리티', '알렉산드라이트', '신사역 피부과'],
    openGraph: {
      title: `${category.name} | ${SITE_INFO.name}`,
      description: category.shortDesc,
      url: `${BASE_URL}/laser/hair-removal`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
  };
}
