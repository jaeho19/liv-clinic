import { generateMedicalServiceSchema, generateHowToSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { TREATMENTS, SITE_INFO } from '@/lib/constants';

// 시술 데이터 가져오기
const treatment = TREATMENTS.lifting.inmode;

// MedicalService 스키마용 데이터 변환
const serviceData = {
  id: treatment.id,
  category: treatment.category,
  name: treatment.name,
  nameEn: treatment.nameEn,
  description: treatment.description,
  shortDesc: treatment.shortDesc,
  duration: treatment.duration,
  anesthesia: treatment.anesthesia,
  recovery: treatment.recovery,
  targetAreas: [...treatment.targetAreas],
  benefits: [...treatment.benefits],
  faqs: [...treatment.faqs],
};

// HowTo 스키마용 데이터 변환
const processData = {
  name: treatment.name,
  nameEn: treatment.nameEn,
  description: treatment.description,
  duration: treatment.duration,
  process: [...treatment.process],
};

export default function InmodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 스키마 생성
  const serviceSchema = generateMedicalServiceSchema(serviceData);
  const howToSchema = generateHowToSchema(processData);
  const pageSchema = generateWebPageSchema({
    path: '/lifting/inmode',
    title: `${treatment.name} | ${SITE_INFO.name}`,
    description: treatment.description,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '리프팅', url: '/lifting' },
      { name: treatment.name, url: '/lifting/inmode' },
    ],
  });

  return (
    <>
      {/* MedicalService Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {/* HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {/* WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {children}
    </>
  );
}

// 메타데이터 생성
export async function generateMetadata() {
  return {
    title: `${treatment.name} | ${SITE_INFO.name}`,
    description: treatment.description,
    keywords: [treatment.name, treatment.nameEn, '리프팅', 'RF 고주파', '인모드', '지방 감소', '신사역 피부과'],
    openGraph: {
      title: `${treatment.name} | ${SITE_INFO.name}`,
      description: treatment.shortDesc,
      url: `${BASE_URL}/lifting/inmode`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
  };
}
