import { getTranslations } from 'next-intl/server';
import { generatePhysicianSchema, BASE_URL } from '@/lib/seo';
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

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
    name: '천신혜',
    nameEn: 'Shinhye Cheon, M.D.',
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

type DoctorKey = keyof typeof doctorsSchemaData;

/**
 * 로케일별 의료진 스키마 데이터.
 *
 * ko는 위 하드코딩 값을 그대로 사용해 기존 JSON-LD를 바이트 동일하게 유지하고,
 * 그 외 로케일은 의료진 페이지가 실제로 렌더링하는 `sections.doctors.*` 번역을
 * 재사용한다. 한국어 약력·경력(hasOccupation.description 등)이 해외 로케일의
 * 구조화 데이터로 새어나가지 않도록 하기 위함.
 */
async function localizedDoctorData(locale: string, key: DoctorKey) {
  const base = doctorsSchemaData[key];
  if (locale === 'ko') return base;

  const t = await getTranslations({ locale });
  return {
    ...base,
    name: t(`sections.doctors.${key}.name`),
    title: t(`sections.doctors.${key}.title`),
    specialty: t(`sections.doctors.${key}.specialty`),
    philosophy: t(`sections.doctors.${key}.philosophy`),
    education: t.raw(`sections.doctors.${key}.education`) as string[],
    experience: t.raw(`sections.doctors.${key}.experience`) as string[],
    certifications: t.raw(`sections.doctors.${key}.certifications`) as string[],
    specialties: t.raw(`sections.doctors.${key}.specialties`) as string[],
  };
}

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 의료진 스키마 생성 (약력·경력·소속 병원명 모두 로케일별)
  const [kimData, cheonData] = await Promise.all([
    localizedDoctorData(locale, 'kim'),
    localizedDoctorData(locale, 'cheon'),
  ]);
  const kimSchema = generatePhysicianSchema(kimData, { locale });
  const cheonSchema = generatePhysicianSchema(cheonData, { locale });

  // ProfilePage 스키마 (로케일별 title/description/breadcrumb, mainEntity로 의료진 연결)
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'staff',
    path: '/about/staff',
    type: 'ProfilePage',
    breadcrumbs: [
      { home: true },
      { navKey: 'about', url: '/about' },
      { navKey: 'aboutStaff', url: '/about/staff' },
    ],
    mainEntity: [
      { '@id': `${BASE_URL}/about/staff#dr-kim` },
      { '@id': `${BASE_URL}/about/staff#dr-cheon` },
    ],
  });

  return (
    <>
      {/* Physician Schema - 김수영 원장 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(kimSchema) }}
      />
      {/* Physician Schema - 천신혜 원장 */}
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
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'staff', '/about/staff');
}
