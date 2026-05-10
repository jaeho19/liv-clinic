import { Metadata } from 'next';
import { SITE_INFO } from './constants';
import { LOCALES, type Locale } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';

// Base URL for the site
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://livps.co.kr';

/** Build hreflang alternates map from LOCALE_META — keeps SEO in sync with routing.ts */
function buildHreflangMap(path: string): Record<string, string> {
  return Object.fromEntries(
    LOCALES.map((code) => [LOCALE_META[code].hreflang, `${BASE_URL}/${code}${path}`]),
  );
}

// Default SEO configuration
export const defaultSEO = {
  siteName: SITE_INFO.name,
  siteNameEn: SITE_INFO.nameEn,
  slogan: SITE_INFO.slogan,
};

// Locale-specific metadata (다국어 검색 최적화 강화)
export const seoConfig: Record<string, {
  title: string;
  description: string;
  keywords: string[];
}> = {
  ko: {
    title: '리브성형외과 | 수술 없는 프리미엄 안티에이징 신사역',
    description: '울쎄라피 프라임, 써마지 FLX 공식 인증 병원. 중력을 넘어선 아름다움, Anti-Gravity 리프팅 솔루션. 신사역 4번 출구 도보 1분. 보톡스, 필러, 스킨부스터, 실리프팅, 레이저 토닝 전문 클리닉.',
    keywords: [
      // 병원명 및 지역
      '리브성형외과', 'LIV성형외과', '신사역 피부과', '신사역 성형외과', '신사동 피부과',
      '강남 피부과', '강남 성형외과', '압구정 피부과', '서울 피부과',
      // 리프팅 시술
      '울쎄라피', '울쎄라피 프라임', '울쎄라 가격', '울쎄라 효과', '울쎄라 병원',
      '써마지', '써마지 FLX', '써마지 가격', '써마지 효과', '써마지 병원',
      '실리프팅', '압토스 실리프팅', 'PDO 실리프팅', '실리프팅 가격',
      '비수술 리프팅', '비수술 안면거상', 'HIFU 리프팅', '고주파 리프팅',
      // 안티에이징 시술
      '보톡스', '보톡스 가격', '이마 보톡스', '턱 보톡스', '주름 보톡스',
      '필러', '필러 가격', '코 필러', '입술 필러', '팔자주름 필러',
      '스킨부스터', '쥬베룩', '리쥬란', '물광주사',
      // 레이저 시술
      '레이저 토닝', '피코 레이저', '클래리티 II', '제모 레이저',
      '기미 치료', '색소 치료', '홍조 치료', '모공 치료',
      // 일반 키워드
      '안티에이징', '피부 탄력', '주름 개선', '프리미엄 피부과', '피부관리'
    ],
  },
  en: {
    title: 'LIV Plastic Surgery | Premium Non-surgical Anti-aging Seoul Korea',
    description: 'Official Ultherapy Prime & Thermage FLX certified clinic in Seoul, Korea. Beyond Gravity, Anti-Gravity lifting solution. 1 min from Sinsa Station Exit 4, Gangnam. Botox, Filler, Skin Booster, Thread Lift, Laser specialists.',
    keywords: [
      // Clinic name & location
      'LIV Plastic Surgery', 'LIV Clinic Seoul', 'Seoul dermatology', 'Seoul plastic surgery',
      'Gangnam clinic', 'Gangnam dermatology', 'Sinsa station clinic', 'Korea beauty clinic',
      // Lifting treatments
      'Ultherapy Korea', 'Ultherapy Prime Seoul', 'Ultherapy cost Korea', 'Ultherapy before after',
      'Thermage Korea', 'Thermage FLX Seoul', 'Thermage cost Korea', 'Thermage before after',
      'thread lift Korea', 'APTOS thread lift', 'PDO thread lift Seoul', 'thread lift cost',
      'non-surgical facelift Korea', 'HIFU lifting Seoul', 'RF lifting Korea',
      // Anti-aging treatments
      'Botox Seoul', 'Botox Korea', 'Botox cost Korea', 'forehead Botox Seoul',
      'filler Seoul', 'filler Korea', 'dermal filler cost', 'nose filler Seoul',
      'skin booster Korea', 'Juvelook Korea', 'Rejuran Korea', 'water glow injection',
      // Laser treatments
      'laser toning Seoul', 'Pico laser Korea', 'Clarity II laser', 'laser hair removal Seoul',
      'melasma treatment Korea', 'pigmentation treatment Seoul', 'rosacea treatment Korea',
      // General keywords
      'anti-aging Seoul', 'skin tightening Korea', 'wrinkle treatment Seoul', 'K-beauty clinic',
      'medical tourism Korea', 'best dermatologist Seoul', 'celebrity clinic Korea'
    ],
  },
  ja: {
    title: 'リブ形成外科 | ソウル新沙プレミアム非手術アンチエイジング',
    description: 'ウルセラプライム・サーマジFLX公式認証病院。重力を超えた美しさ、Anti-Gravityリフティングソリューション。新沙駅4番出口徒歩1分。ボトックス、フィラー、スキンブースター、糸リフト、レーザー専門。',
    keywords: [
      // クリニック名・地域
      'リブ形成外科', 'LIV形成外科', 'ソウル皮膚科', 'ソウル美容クリニック',
      '江南クリニック', '江南皮膚科', '新沙洞クリニック', '韓国美容クリニック',
      // リフティング施術
      'ウルセラ韓国', 'ウルセラプライム', 'ウルセラ料金', 'ウルセラ効果',
      'サーマジ韓国', 'サーマジFLX', 'サーマジ料金', 'サーマジ効果',
      '糸リフト韓国', 'APTOS糸リフト', 'PDO糸リフト', '糸リフト料金',
      '非手術フェイスリフト', 'HIFUリフティング', '高周波リフティング',
      // アンチエイジング施術
      'ボトックス韓国', 'ボトックスソウル', 'ボトックス料金', '額ボトックス',
      'フィラー韓国', 'フィラーソウル', 'ヒアルロン酸注入', '鼻フィラー',
      'スキンブースター韓国', 'ジュベルック', 'リジュラン', '水光注射',
      // レーザー施術
      'レーザートーニング', 'ピコレーザー韓国', 'クラリティII', '医療脱毛韓国',
      '肝斑治療韓国', 'シミ治療ソウル', '赤み治療', '毛穴治療',
      // 一般キーワード
      'アンチエイジング韓国', '肌引き締め', 'しわ改善', 'Kビューティー',
      '韓国医療観光', '韓国美容整形', '芸能人御用達クリニック'
    ],
  },
  zh: {
    title: 'LIV整形外科 | 首尔新沙高端非手术抗衰老',
    description: '超声刀Prime、热玛吉FLX官方认证医院。超越重力的美丽，Anti-Gravity提升解决方案。新沙站4号出口步行1分钟。肉毒素、玻尿酸、水光针、埋线提升、激光专业。',
    keywords: [
      // 医院名称和地区
      'LIV整形外科', 'LIV医美', '首尔皮肤科', '首尔整形医院',
      '江南医美', '江南皮肤科', '新沙洞诊所', '韩国美容医院',
      // 提升项目
      '超声刀韩国', '超声刀Prime', '超声刀价格', '超声刀效果',
      '热玛吉韩国', '热玛吉FLX', '热玛吉价格', '热玛吉效果',
      '埋线提升韩国', 'APTOS埋线', 'PDO埋线', '埋线价格',
      '非手术面部提升', 'HIFU提升', '射频提升',
      // 抗衰老项目
      '肉毒素韩国', '肉毒素首尔', '肉毒素价格', '额头肉毒素',
      '玻尿酸韩国', '玻尿酸首尔', '玻尿酸填充', '鼻子玻尿酸',
      '水光针韩国', 'Juvelook', 'Rejuran婴儿针', '水光注射',
      // 激光项目
      '激光美白', '皮秒激光韩国', 'Clarity II激光', '激光脱毛韩国',
      '黄褐斑治疗韩国', '色斑治疗首尔', '红血丝治疗', '毛孔治疗',
      // 一般关键词
      '抗衰老首尔', '皮肤紧致', '祛皱治疗', 'K美容',
      '韩国医疗旅游', '韩国医美', '明星同款诊所', '首尔高端医美'
    ],
  },
};

// Generate metadata for a page
export function generatePageMetadata({
  locale,
  title,
  description,
  keywords,
  path = '',
  images = [],
}: {
  locale: string;
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}): Metadata {
  const config = seoConfig[locale] || seoConfig.ko;
  const pageTitle = title || config.title;
  const pageDescription = description || config.description;
  const pageKeywords = keywords || config.keywords;
  const url = `${BASE_URL}/${locale}${path}`;

  const defaultImage = {
    url: `${BASE_URL}/images/og-image.jpg`,
    width: 1200,
    height: 630,
    alt: defaultSEO.siteName,
  };

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords.join(', '),
    authors: [{ name: defaultSEO.siteName }],
    creator: defaultSEO.siteName,
    publisher: defaultSEO.siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: buildHreflangMap(path),
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: defaultSEO.siteName,
      locale: LOCALE_META[locale as Locale]?.ogLocale ?? 'en_US',
      type: 'website',
      images: images.length > 0 ? images : [defaultImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: images.length > 0 ? images.map(img => img.url) : [defaultImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      // naver: process.env.NEXT_PUBLIC_NAVER_VERIFICATION,
    },
  };
}

// Schema.org structured data for LocalBusiness (확장된 버전 - E-E-A-T 강화 + 다국어)
export function generateLocalBusinessSchema(locale: string = 'ko') {
  // 다국어 설명 — locale별 seoConfig.description 사용, 미정의 시 ko fallback
  const description = seoConfig[locale]?.description ?? seoConfig.ko.description;

  // 다국어 병원명 — Phase 1 신규 locale은 LIV 영문 표기 통일 (i18n-glossary 합의)
  const NAMES: Record<string, string> = {
    ko: '리브성형외과',
    en: 'LIV Plastic Surgery',
    ja: 'リブ形成外科',
    zh: 'LIV整形外科',
  };
  const name = NAMES[locale] ?? 'LIV Plastic Surgery';

  return {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'MedicalOrganization'],
    '@id': `${BASE_URL}/#organization`,
    name,
    alternateName: [
      SITE_INFO.nameEn,
      'リブ形成外科',
      'LIV整形外科',
      '리브성형외과',
    ],
    description,
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    image: `${BASE_URL}/images/og-image.jpg`,
    telephone: SITE_INFO.phone,
    email: SITE_INFO.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '나루터로 80 자은빌딩 4층',
      addressLocality: '서초구',
      addressRegion: '서울특별시',
      postalCode: SITE_INFO.postalCode,
      addressCountry: 'KR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_INFO.coordinates.lat,
      longitude: SITE_INFO.coordinates.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    priceRange: '$$$$',
    currenciesAccepted: 'KRW',
    paymentAccepted: 'Cash, Credit Card',
    areaServed: {
      '@type': 'City',
      name: 'Seoul',
    },
    sameAs: [
      'https://www.instagram.com/livps_official/',
      'https://blog.naver.com/liv_clinic',
      'https://pf.kakao.com/_hgFwn',
    ],
    medicalSpecialty: [
      'Dermatology',
      'Plastic Surgery',
      'Anti-aging Medicine',
    ],

    // 학회 소속 (권위 신호 강화)
    memberOf: [
      {
        '@type': 'Organization',
        name: '대한성형외과의사회',
        url: 'https://www.ksaps.or.kr/',
      },
      {
        '@type': 'Organization',
        name: '대한성형외과학회',
        url: 'https://www.plasticsurgery.or.kr/',
      },
      {
        '@type': 'Organization',
        name: '대한미용성형외과학회',
      },
      {
        '@type': 'Organization',
        name: '최소침습성형외과학회(MIPS)',
      },
    ],

    // 장비 인증 (신뢰도 강화)
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certification',
        name: '울쎄라피 프라임 정품 인증',
        issuedBy: {
          '@type': 'Organization',
          name: 'Merz Aesthetics',
          url: 'https://merz.co.kr/',
        },
      },
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certification',
        name: '써마지 FLX 파트너 인증',
        issuedBy: {
          '@type': 'Organization',
          name: 'Solta Medical (Bausch Health)',
          url: 'https://www.thermage.co.kr/',
        },
      },
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'certification',
        name: 'APTOS 공식 인증 (KR0062025)',
        issuedBy: {
          '@type': 'Organization',
          name: 'APTOS International',
          url: 'https://aptos.global/',
        },
      },
    ],

    // AI가 인식할 전문 분야 키워드 (다국어 - ko, en, ja, zh)
    knowsAbout: [
      // 한국어 (Korean)
      'HIFU 리프팅', 'RF 고주파 리프팅', '비수술 안티에이징',
      '울쎄라피 프라임', '써마지 FLX', '보톡스', '필러', '스킨부스터',
      '실리프팅', '레이저 토닝', '피코 레이저', '주름 개선', '피부 탄력',
      // English
      'HIFU lifting', 'RF lifting', 'non-surgical anti-aging',
      'Ultherapy Prime', 'Thermage FLX', 'Botox', 'dermal filler', 'skin booster',
      'thread lift', 'laser toning', 'Pico laser', 'wrinkle treatment', 'skin tightening',
      'Korean beauty clinic', 'K-beauty medical', 'Seoul aesthetic clinic',
      // 日本語 (Japanese)
      'HIFUリフティング', '高周波リフティング', '非手術アンチエイジング',
      'ウルセラプライム', 'サーマジFLX', 'ボトックス', 'フィラー', 'スキンブースター',
      '糸リフト', 'レーザートーニング', 'ピコレーザー', 'しわ改善', '肌引き締め',
      '韓国美容クリニック', 'Kビューティー医療',
      // 中文 (Chinese)
      'HIFU提升', '射频提升', '非手术抗衰老',
      '超声刀Prime', '热玛吉FLX', '肉毒素', '玻尿酸', '水光针',
      '埋线提升', '激光美白', '皮秒激光', '祛皱', '皮肤紧致',
      '韩国医美', 'K美容医疗', '首尔美容诊所',
    ],

    availableService: [
      {
        '@type': 'MedicalProcedure',
        name: 'Ultherapy Prime HIFU Lifting',
        alternateName: ['울쎄라피 프라임', 'ウルセラプライム', '超声刀Prime'],
        procedureType: 'NoninvasiveProcedure',
        description: 'FDA 승인 고강도 집속 초음파 리프팅 | FDA-approved High-Intensity Focused Ultrasound | FDA承認HIFU',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Thermage FLX',
        alternateName: ['써마지 FLX', 'サーマジFLX', '热玛吉FLX'],
        procedureType: 'NoninvasiveProcedure',
        description: '4세대 프리미엄 고주파 리프팅 | 4th Gen Premium RF Lifting | 第4世代RF',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'APTOS Thread Lifting',
        alternateName: ['압토스 실리프팅', 'APTOS糸リフト', 'APTOS埋线提升'],
        procedureType: 'NoninvasiveProcedure',
        description: '글로벌 인증 PDO/PCL 실리프팅 | Global Certified PDO/PCL Thread | 全球认证PDO/PCL埋线',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Botox',
        alternateName: ['보톡스', 'ボトックス', '肉毒素'],
        procedureType: 'NoninvasiveProcedure',
        description: '주름 개선 및 윤곽 시술 | Wrinkle & Contour Treatment | しわ改善・輪郭',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Dermal Filler',
        alternateName: ['필러', 'フィラー', '玻尿酸'],
        procedureType: 'NoninvasiveProcedure',
        description: '볼륨 및 윤곽 개선 | Volume & Contour Enhancement | ボリューム・輪郭',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Skin Booster',
        alternateName: ['스킨부스터', 'スキンブースター', '水光针'],
        procedureType: 'NoninvasiveProcedure',
        description: '피부 보습 및 탄력 개선 | Skin Hydration & Elasticity | 保湿・弾力',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Laser Toning',
        alternateName: ['레이저 토닝', 'レーザートーニング', '激光美白'],
        procedureType: 'NoninvasiveProcedure',
        description: '색소 치료 및 피부톤 개선 | Pigmentation & Skin Tone | 色素・美白',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Pico Laser',
        alternateName: ['피코 레이저', 'ピコレーザー', '皮秒激光'],
        procedureType: 'NoninvasiveProcedure',
        description: '기미/잡티/문신 제거 | Melasma/Spots/Tattoo Removal | シミ・タトゥー除去',
      },
    ],

    // AI 커머스 대비: 예약 액션
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/contact`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: '상담 예약',
      },
    },
  };
}

// Schema.org structured data for FAQ
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Schema.org structured data for Medical Procedure
export function generateMedicalProcedureSchema(treatment: {
  name: string;
  nameEn: string;
  description: string;
  duration: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.name,
    alternateName: treatment.nameEn,
    description: treatment.description,
    procedureType: 'NoninvasiveProcedure',
    howPerformed: treatment.description,
    preparation: '마취 크림 도포 (필요시)',
    followup: '시술 후 관리 안내',
    status: 'ActiveActionStatus',
    bodyLocation: 'Face',
    provider: {
      '@type': 'MedicalBusiness',
      name: SITE_INFO.name,
      url: BASE_URL,
    },
  };
}

// Schema.org structured data for BreadcrumbList
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

// ============================================
// SEO/AEO/GEO 최적화 스키마 (2025 트렌드 대응)
// ============================================

// 의료진 타입 정의
interface PhysicianData {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  specialty: string;
  philosophy?: string;
  image?: string;
  education: string[];
  experience: string[];
  certifications: string[];
  specialties: string[];
  publications?: {
    type: string;
    title: string;
    authors?: string;
    journal?: string;
    year: number;
    details?: string;
    institution?: string;
    degree?: string;
  }[];
  presentations?: {
    title: string;
    conference: string;
    year: number;
    type: string;
  }[];
}

// Schema.org Physician 스키마 (E-E-A-T 신호 강화)
export function generatePhysicianSchema(doctor: PhysicianData) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': `${BASE_URL}/about/staff#${doctor.id}`,
    name: doctor.name,
    alternateName: doctor.nameEn,
    image: doctor.image ? `${BASE_URL}${doctor.image}` : undefined,
    jobTitle: doctor.title,
    description: doctor.philosophy,
    medicalSpecialty: ['Plastic Surgery', 'Dermatology', 'Anti-aging Medicine'],

    // 근무지 주소 (Google Rich Results 요구사항)
    address: {
      '@type': 'PostalAddress',
      streetAddress: '나루터로 80 자은빌딩 4층',
      addressLocality: '서초구',
      addressRegion: '서울특별시',
      postalCode: SITE_INFO.postalCode,
      addressCountry: 'KR',
    },

    // 소속 병원 연결
    worksFor: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
      name: SITE_INFO.name,
    },

    // 학력
    alumniOf: doctor.education.map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu,
    })),

    // 자격증/인증
    hasCredential: doctor.certifications.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'professional',
      name: cert,
    })),

    // 전문 분야 (AI가 인식할 수 있는 키워드)
    knowsAbout: [
      ...doctor.specialties,
      'HIFU 리프팅',
      'RF 고주파 리프팅',
      '비수술 안티에이징',
      'Ultherapy Prime',
      'Thermage FLX',
    ],

    // 경력 사항
    hasOccupation: {
      '@type': 'Occupation',
      name: '성형외과 전문의',
      occupationalCategory: 'Physician',
      description: doctor.experience.join(', '),
    },
  };

  // SCI 논문이 있는 경우 학술 활동 추가
  if (doctor.publications && doctor.publications.length > 0) {
    const sciPublications = doctor.publications.filter(p => p.type === 'sci');
    if (sciPublications.length > 0) {
      schema.performerIn = sciPublications.map(pub => ({
        '@type': 'ScholarlyArticle',
        headline: pub.title,
        author: pub.authors?.split(',').map(author => ({
          '@type': 'Person',
          name: author.trim(),
        })),
        datePublished: pub.year.toString(),
        publisher: {
          '@type': 'Organization',
          name: pub.journal,
        },
        about: {
          '@type': 'MedicalProcedure',
          procedureType: 'NoninvasiveProcedure',
        },
      }));
    }
  }

  return schema;
}

// 학술 논문 스키마 (개별 논문용)
export function generateScholarlyArticleSchema(publication: {
  title: string;
  authors: string;
  journal: string;
  year: number;
  details?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: publication.title,
    author: publication.authors.split(',').map(author => ({
      '@type': 'Person',
      name: author.trim(),
    })),
    datePublished: publication.year.toString(),
    publisher: {
      '@type': 'Organization',
      name: publication.journal,
    },
    isPartOf: {
      '@type': 'Periodical',
      name: publication.journal,
    },
    about: {
      '@type': 'MedicalEntity',
      name: 'Aesthetic Medicine',
    },
  };
}

// WebSite 스키마 (검색 액션 포함 - AI 검색 최적화)
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: SITE_INFO.name,
    alternateName: SITE_INFO.nameEn,
    url: BASE_URL,
    description: seoConfig.ko.description,
    inLanguage: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN'],
    publisher: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
    },
    // AI 검색 액션 지원
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/medical?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// WebPage 스키마 (AI 오버뷰 최적화)
export function generateWebPageSchema(page: {
  path: string;
  title: string;
  description: string;
  locale: string;
  type?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs?: { name: string; url: string }[];
  // ProfilePage용 mainEntity (의료진 등 프로필 페이지에서 사용)
  mainEntity?: { '@id': string }[];
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': page.type || 'WebPage',
    '@id': `${BASE_URL}${page.path}`,
    name: page.title,
    description: page.description,
    url: `${BASE_URL}${page.path}`,
    datePublished: page.datePublished || '2024-01-01',
    dateModified: page.dateModified || new Date().toISOString().split('T')[0],
    inLanguage: page.locale === 'ko' ? 'ko-KR' : page.locale === 'ja' ? 'ja-JP' : page.locale === 'zh' ? 'zh-CN' : 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
    },
    breadcrumb: page.breadcrumbs ? {
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${BASE_URL}${item.url}`,
      })),
    } : undefined,
    // 음성검색 최적화 (Speakable)
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.hero-title', '.main-description', '.short-answer', '.faq-answer'],
    },
  };

  // ProfilePage 타입일 때 mainEntity 추가 (Google Rich Results 요구사항)
  if (page.type === 'ProfilePage' && page.mainEntity && page.mainEntity.length > 0) {
    schema.mainEntity = page.mainEntity;
  }

  return schema;
}

// 음성검색 최적화 FAQ 스키마 (shortAnswer + questionVariants 지원)
interface VoiceOptimizedQA {
  id: string;
  category: string;
  question: string;
  questionVariants?: string[];
  shortAnswer: string;
  answer: string;
  relatedTreatments: string[];
  tags: string[];
}

export function generateVoiceOptimizedFAQSchema(faqs: VoiceOptimizedQA[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${BASE_URL}/medical#faq`,
    name: '리브성형외과 의료정보 Q&A',
    description: '울쎄라, 써마지, 보톡스, 필러 등 미용 시술에 대한 자주 묻는 질문과 답변',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      // 질문 변형 (음성검색 다양한 패턴 지원)
      alternateName: faq.questionVariants,
      acceptedAnswer: {
        '@type': 'Answer',
        // 음성검색용 짧은 답변 + 상세 답변
        text: `${faq.shortAnswer} ${faq.answer}`,
        // Speakable 지정 (AI가 읽어줄 부분)
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: '.short-answer',
        },
      },
      // 관련 시술 연결
      about: faq.relatedTreatments.length > 0 ? faq.relatedTreatments.map(treatment => ({
        '@type': 'MedicalProcedure',
        name: treatment,
      })) : undefined,
    })),
    // FAQ 페이지 전체에 대한 Speakable
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.short-answer', '.faq-question'],
    },
  };
}

// 시술별 MedicalService 스키마 (AI 커머스 대비 - ReserveAction 포함)
interface TreatmentData {
  id: string;
  category: string;
  name: string;
  nameEn: string;
  description: string;
  shortDesc?: string;
  duration: string;
  anesthesia?: string;
  recovery?: string;
  targetAreas?: readonly string[];
  benefits?: readonly { readonly title: string; readonly desc: string }[];
  faqs?: readonly { readonly q: string; readonly a: string }[];
}

export function generateMedicalServiceSchema(treatment: TreatmentData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    '@id': `${BASE_URL}/${treatment.category}/${treatment.id}`,
    name: treatment.name,
    alternateName: treatment.nameEn,
    description: treatment.description,
    procedureType: 'NoninvasiveProcedure',
    howPerformed: treatment.description,
    preparation: treatment.anesthesia || '마취 크림 도포 (필요시)',
    followup: treatment.recovery || '시술 후 관리 안내',
    bodyLocation: treatment.targetAreas?.join(', ') || 'Face',

    // 시술 소요시간
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'KRW',
      value: '상담 후 결정',
    },

    // 제공 기관
    provider: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
      name: SITE_INFO.name,
    },

    // AI 커머스 핵심: 예약 액션
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/contact?treatment=${treatment.id}`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: `${treatment.name} 상담 예약`,
      },
    },

    // 관련 FAQ 연결 (음성검색 최적화)
    mainEntity: treatment.faqs?.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),

    // 시술 장점/특징
    additionalProperty: treatment.benefits?.map(benefit => ({
      '@type': 'PropertyValue',
      name: benefit.title,
      value: benefit.desc,
    })),
  };
}

// HowTo 스키마 (시술 과정 - AI 오버뷰 최적화)
interface TreatmentProcess {
  name: string;
  nameEn: string;
  description: string;
  duration: string;
  process: { step: number; title: string; desc: string }[];
}

export function generateHowToSchema(treatment: TreatmentProcess) {
  // duration에서 숫자만 추출 (예: "60-90분" -> "60")
  const durationMatch = treatment.duration.match(/\d+/);
  const durationMinutes = durationMatch ? durationMatch[0] : '60';

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${treatment.name} 시술 과정`,
    description: treatment.description,
    totalTime: `PT${durationMinutes}M`,
    step: treatment.process.map((step) => ({
      '@type': 'HowToStep',
      position: step.step,
      name: step.title,
      text: step.desc,
    })),
    tool: [{
      '@type': 'HowToTool',
      name: treatment.nameEn,
    }],
    // 제공 기관
    performer: {
      '@type': 'MedicalBusiness',
      '@id': `${BASE_URL}/#organization`,
    },
  };
}

// 통합 스키마 생성 유틸리티 (페이지별로 필요한 스키마 조합)
export function generatePageSchemas(options: {
  locale?: string;
  includeOrganization?: boolean;
  includeWebSite?: boolean;
  physician?: PhysicianData;
  treatment?: TreatmentData;
  treatmentProcess?: TreatmentProcess;
  faqs?: VoiceOptimizedQA[];
  webPage?: Parameters<typeof generateWebPageSchema>[0];
}) {
  const schemas: object[] = [];

  if (options.includeOrganization) {
    schemas.push(generateLocalBusinessSchema(options.locale));
  }

  if (options.includeWebSite) {
    schemas.push(generateWebSiteSchema());
  }

  if (options.physician) {
    schemas.push(generatePhysicianSchema(options.physician));
  }

  if (options.treatment) {
    schemas.push(generateMedicalServiceSchema(options.treatment));
  }

  if (options.treatmentProcess) {
    schemas.push(generateHowToSchema(options.treatmentProcess));
  }

  if (options.faqs && options.faqs.length > 0) {
    schemas.push(generateVoiceOptimizedFAQSchema(options.faqs));
  }

  if (options.webPage) {
    schemas.push(generateWebPageSchema(options.webPage));
  }

  return schemas;
}
