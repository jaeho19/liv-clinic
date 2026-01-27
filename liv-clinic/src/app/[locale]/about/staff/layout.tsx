import { generatePhysicianSchema, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';

// 의료진 데이터 (서버 컴포넌트에서 스키마 생성용)
const doctorsSchemaData = {
  kim: {
    id: 'dr-kim',
    name: '김수영',
    nameEn: 'Sooyoung Kim, M.D.',
    title: '대표원장',
    specialty: '비수술 리프팅 전문',
    philosophy: '자연스러움을 추구하는 섬세한 시술로, 환자분의 본연의 아름다움을 끌어올립니다.',
    image: '/images/doctor/doctor-main.jpg',
    education: [
      '한양대학교 의과대학 졸업',
      '고려대학교 대학원 의학석사',
    ],
    experience: [
      '리브성형외과 대표원장 (現)',
      '고려대학교 안암병원 성형외과 외래교수',
      '고려대학교 안암병원 성형외과 전공의',
      '고려대학교 안암병원 성형외과 임상강사',
    ],
    certifications: [
      '성형외과 전문의',
      '대한성형외과의사회 정회원',
      '대한성형외과학회 정회원',
      '대한미용성형외과학회 정회원',
      '최소침습성형외과학회 정회원',
      'APTOS International 인증의',
    ],
    specialties: ['울쎄라피 프라임 리프팅', '써마지 리프팅', '복합 리프팅 시술', '안티에이징 프로그램'],
    publications: [
      {
        type: 'sci',
        authors: 'Rho NK, Kim HS, Kim SY, Lee W.',
        title: "Injectable 'Skin Boosters' in Aging Skin Rejuvenation: A Current Overview",
        journal: 'Arch Plast Surg.',
        year: 2024,
        details: '2024 Nov 13;51(6):528-541.',
      },
      {
        type: 'sci',
        authors: 'Jang JU, Kim SY, Yoon ES, Kim WK, Park SH, Lee BI, Kim DW.',
        title: 'Comparison of the Effectiveness of Ablative and Non-Ablative Fractional Laser Treatments for Early Stage Thyroidectomy Scars',
        journal: 'Arch Plast Surg.',
        year: 2016,
        details: '2016 Nov;43(6):575-581.',
      },
      {
        type: 'sci',
        authors: 'Han SK, Kim SY, Choi RJ, Jeong SH, Kim WK.',
        title: 'Comparison of tissue-engineered and artificial dermis grafts after removal of basal cell carcinoma on face – a pilot study',
        journal: 'Dermatol Surg.',
        year: 2014,
        details: '2014 Apr;40(4):460-7.',
      },
      {
        type: 'sci',
        authors: 'Han SK, Kim SY, Gu JH, Jeong SH, Kim WK.',
        title: 'Influence of the pedicle orientation and length on viability of unipedicled venous island flaps',
        journal: 'Microsurgery.',
        year: 2014,
        details: '2014 Mar;34(3):197-202.',
      },
    ],
    presentations: [
      {
        title: "Winning Patients' Hearts with Skin Boosters: Practical Tips for Effective Use and Maximizing Satisfaction",
        conference: '제37회 최소침습성형외과학회(MIPS)',
        year: 2024,
        type: 'oral',
      },
      {
        title: 'Types and Efficacy of Skin Boosters',
        conference: '제36회 최소침습성형외과학회(MIPS)',
        year: 2024,
        type: 'oral',
      },
    ],
  },
  cheon: {
    id: 'dr-cheon',
    name: '천형준',
    nameEn: 'Hyungjun Cheon, M.D.',
    title: '진료원장',
    specialty: '레이저·피부 관리 전문',
    philosophy: '과학적 근거를 바탕으로 한 맞춤형 피부 케어로 건강한 아름다움을 제공합니다.',
    image: '/images/doctor/doctor-2.jpg',
    education: [
      '의학전문대학원 졸업',
    ],
    experience: [
      '리브성형외과 진료원장 (現)',
    ],
    certifications: [
      '의사 면허',
    ],
    specialties: ['리프팅 레이저', '스킨부스터', '레이저 토닝', '색소/모공 레이저', '피부 관리 프로그램'],
    publications: [],
    presentations: [],
  },
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 의료진 스키마 생성
  const kimSchema = generatePhysicianSchema(doctorsSchemaData.kim);
  const cheonSchema = generatePhysicianSchema(doctorsSchemaData.cheon);

  // 페이지 스키마 생성
  const pageSchema = generateWebPageSchema({
    path: '/about/staff',
    title: '의료진 소개 | 리브성형외과',
    description: '리브성형외과 김수영 대표원장. 성형외과 전문의, SCI 논문 4편, 울쎄라피 프라임·써마지 FLX 전문. 신사역 프리미엄 안티에이징 클리닉.',
    locale: 'ko',
    type: 'ProfilePage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '소개', url: '/about' },
      { name: '의료진', url: '/about/staff' },
    ],
  });

  return (
    <>
      {/* Physician Schema - 김수영 원장 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(kimSchema) }}
      />
      {/* Physician Schema - 천형준 원장 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cheonSchema) }}
      />
      {/* ProfilePage Schema */}
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
    title: '의료진 소개 | 리브성형외과',
    description: '리브성형외과 김수영 대표원장. 성형외과 전문의, SCI 논문 4편, 울쎄라피 프라임·써마지 FLX 전문. 15년 이상 경력의 숙련된 의료진이 1:1 맞춤 상담을 제공합니다.',
    keywords: ['리브성형외과', '김수영 원장', '성형외과 전문의', '신사역 피부과', '울쎄라피 프라임', '써마지'],
    openGraph: {
      title: '의료진 소개 | 리브성형외과',
      description: '성형외과 전문의, SCI 논문 4편. 울쎄라피 프라임·써마지 FLX 전문 의료진.',
      url: `${BASE_URL}/about/staff`,
      siteName: SITE_INFO.name,
      type: 'profile',
    },
  };
}
