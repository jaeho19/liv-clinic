import { generateVoiceOptimizedFAQSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { MEDICAL_QA, SITE_INFO } from '@/lib/constants';

export default function MedicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // MEDICAL_QA를 VoiceOptimizedQA 형식으로 변환 (readonly 배열을 mutable로 변환)
  const faqData = MEDICAL_QA.map(qa => ({
    id: qa.id,
    category: qa.category,
    question: qa.question,
    questionVariants: qa.questionVariants ? [...qa.questionVariants] : undefined,
    shortAnswer: qa.shortAnswer,
    answer: qa.answer,
    relatedTreatments: [...qa.relatedTreatments],
    tags: [...qa.tags],
  }));

  // FAQ 스키마 생성
  const faqSchema = generateVoiceOptimizedFAQSchema(faqData);

  // 페이지 스키마 생성
  const pageSchema = generateWebPageSchema({
    path: '/medical',
    title: '의료정보 Q&A | 리브성형외과',
    description: '울쎄라, 써마지, 보톡스, 필러 등 미용 시술에 대한 자주 묻는 질문과 전문 답변. 성형외과 전문의가 알려주는 정확한 의료정보.',
    locale: 'ko',
    type: 'FAQPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '의료정보', url: '/medical' },
    ],
  });

  return (
    <>
      {/* Voice-Optimized FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* FAQPage Schema */}
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
    title: '의료정보 Q&A | 리브성형외과',
    description: '울쎄라, 써마지, 보톡스, 필러 등 미용 시술에 대한 자주 묻는 질문과 전문 답변. 성형외과 전문의가 알려주는 정확한 의료정보. 신사역 프리미엄 안티에이징 클리닉.',
    keywords: ['울쎄라 FAQ', '써마지 FAQ', '보톡스 FAQ', '필러 FAQ', '리프팅 질문', '미용시술 정보', '성형외과 Q&A'],
    openGraph: {
      title: '의료정보 Q&A | 리브성형외과',
      description: '미용 시술에 대한 자주 묻는 질문과 전문 답변',
      url: `${BASE_URL}/medical`,
      siteName: SITE_INFO.name,
      type: 'website',
    },
  };
}
