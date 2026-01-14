import { Metadata } from 'next';
import { SITE_INFO } from './constants';

// Base URL for the site
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://livps.co.kr';

// Default SEO configuration
export const defaultSEO = {
  siteName: SITE_INFO.name,
  siteNameEn: SITE_INFO.nameEn,
  slogan: SITE_INFO.slogan,
};

// Locale-specific metadata
export const seoConfig: Record<string, {
  title: string;
  description: string;
  keywords: string[];
}> = {
  ko: {
    title: '리브성형외과 | 수술 없는 프리미엄 안티에이징 신사역',
    description: '울쎄라피 프라임, 써마지 공식 인증 병원. 중력을 넘어선 아름다움, Anti-Gravity 리프팅 솔루션. 신사역 4번 출구 도보 1분. 보톡스, 필러, 스킨부스터 전문.',
    keywords: [
      '리브성형외과', '신사역 피부과', '울쎄라피 프라임', '써마지', '리프팅',
      '안티에이징', '보톡스', '필러', '스킨부스터', '클래리티 II',
      '강남 피부과', '신사동 성형외과', '비수술 리프팅', '프리미엄 피부과'
    ],
  },
  en: {
    title: 'LIV Plastic Surgery | Premium Non-surgical Anti-aging Seoul Korea',
    description: 'Official Ultherapy Prime & Thermage certified clinic in Seoul. Beyond Gravity, Anti-Gravity lifting solution. 1 min from Sinsa Station Exit 4. Botox, Filler, Skin Booster specialists.',
    keywords: [
      'LIV Plastic Surgery', 'Seoul dermatology', 'Ultherapy Prime Korea', 'Thermage Korea',
      'Korean beauty clinic', 'anti-aging Seoul', 'Botox Seoul', 'Filler Seoul',
      'skin booster Korea', 'Gangnam clinic', 'non-surgical facelift'
    ],
  },
  ja: {
    title: 'リブ形成外科 | ソウル新沙洞プレミアム非手術アンチエイジング',
    description: 'ウルセラ・サーマジ公式認証病院。重力を超えた美しさ、Anti-Gravityリフティングソリューション。新沙駅4番出口徒歩1分。ボトックス、フィラー、スキンブースター専門。',
    keywords: [
      'リブ形成外科', 'ソウル皮膚科', 'ウルセラ韓国', 'サーマジ韓国',
      '韓国美容クリニック', 'アンチエイジングソウル', 'ボトックスソウル',
      'フィラーソウル', '新沙洞クリニック', '非手術フェイスリフト'
    ],
  },
  zh: {
    title: 'LIV整形外科 | 首尔新沙洞高端非手术抗衰老',
    description: '超声刀、热玛吉官方认证医院。超越重力的美丽，Anti-Gravity提升解决方案。新沙站4号出口步行1分钟。肉毒素、玻尿酸、水光针专业。',
    keywords: [
      'LIV整形外科', '首尔皮肤科', '超声刀韩国', '热玛吉韩国',
      '韩国美容诊所', '抗衰老首尔', '肉毒素首尔', '玻尿酸首尔',
      '水光针韩国', '江南诊所', '非手术拉皮'
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
      languages: {
        'ko-KR': `${BASE_URL}/ko${path}`,
        'en-US': `${BASE_URL}/en${path}`,
        'ja-JP': `${BASE_URL}/ja${path}`,
        'zh-CN': `${BASE_URL}/zh${path}`,
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: defaultSEO.siteName,
      locale: locale === 'ko' ? 'ko_KR' : locale === 'ja' ? 'ja_JP' : locale === 'zh' ? 'zh_CN' : 'en_US',
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

// Schema.org structured data for LocalBusiness
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${BASE_URL}/#organization`,
    name: SITE_INFO.name,
    alternateName: SITE_INFO.nameEn,
    description: seoConfig.ko.description,
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
      'https://instagram.com/liv_clinic',
      'https://blog.naver.com/livclinic',
    ],
    medicalSpecialty: [
      'Dermatology',
      'Plastic Surgery',
    ],
    availableService: [
      {
        '@type': 'MedicalProcedure',
        name: 'Ultherapy Prime HIFU Lifting',
        procedureType: 'NoninvasiveProcedure',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Thermage FLX',
        procedureType: 'NoninvasiveProcedure',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Botox',
        procedureType: 'NoninvasiveProcedure',
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Filler',
        procedureType: 'NoninvasiveProcedure',
      },
    ],
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
