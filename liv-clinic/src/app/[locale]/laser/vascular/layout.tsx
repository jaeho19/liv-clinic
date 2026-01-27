import { generateMedicalServiceSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { LASER_CATEGORIES, TREATMENTS, SITE_INFO } from '@/lib/constants';

// 카테고리 데이터 가져오기
const category = LASER_CATEGORIES.find(c => c.id === 'vascular')!;
const featuredEquipment = TREATMENTS.laser[category.featuredEquipment as keyof typeof TREATMENTS.laser];

// MedicalService 스키마용 데이터
const serviceData = {
  id: category.id,
  category: 'laser',
  name: category.name,
  nameEn: category.nameEn,
  description: category.description,
  shortDesc: category.shortDesc,
  duration: '15-30분',
  anesthesia: '무마취 (크라이오겐 쿨링)',
  recovery: '즉시 일상 복귀',
  targetAreas: ['안면홍조', '모세혈관 확장', '주사비', '혈관종'],
  benefits: [
    { title: '듀얼 파장', desc: '1064nm Nd:YAG로 혈관 선택적 치료' },
    { title: '크라이오겐 쿨링', desc: '시술 중 피부 보호 및 통증 최소화' },
    { title: '모든 피부 타입', desc: 'Fitzpatrick I-VI까지 안전 시술' },
    { title: 'IntelliTrak 기술', desc: '균일한 에너지 전달로 효과 극대화' },
  ],
  faqs: featuredEquipment?.faqs || [],
};

export default function VascularLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serviceSchema = generateMedicalServiceSchema(serviceData);
  const pageSchema = generateWebPageSchema({
    path: '/laser/vascular',
    title: `${category.name} | ${SITE_INFO.name}`,
    description: category.description,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '레이저', url: '/laser' },
      { name: category.name, url: '/laser/vascular' },
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
    keywords: [category.name, category.nameEn, '홍조 치료', '혈관 레이저', '모세혈관 확장', '주사비', '신사역 피부과'],
    openGraph: {
      title: `${category.name} | ${SITE_INFO.name}`,
      description: category.shortDesc,
      url: `${BASE_URL}/laser/vascular`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
  };
}
