import { getTranslations } from 'next-intl/server';
import { BASE_URL, buildHreflangMap, getSiteName } from '@/lib/seo';
import { localizedBreadcrumbSchema } from '@/lib/schemaI18n';
import { LOCALE_META } from '@/i18n/locales-meta';
import { pickLocalized } from '@/lib/i18nFallback';
import { SITE_INFO, EVENTS } from '@/lib/constants';
import type { Locale } from '@/i18n/routing';

// 로케일별 이벤트 페이지 메타 — generateMetadata와 WebPage/ItemList 스키마가 공유.
const EVENTS_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  ko: {
    title: '이벤트 | 리브성형외과',
    description: '리브성형외과의 최신 이벤트와 특별 프로모션을 확인하세요. 울쎄라피, 써마지, 보톡스, 필러 등 다양한 시술 할인 혜택을 만나보세요.',
    keywords: ['리브성형외과 이벤트', '신사역 피부과 이벤트', '울쎄라 할인', '써마지 할인', '보톡스 이벤트', '필러 이벤트', '안티에이징 프로모션'],
  },
  en: {
    title: 'Events | LIV Plastic Surgery',
    description: 'Discover the latest events and special promotions at LIV Plastic Surgery. Special offers on Ultherapy, Thermage, Botox, Filler and more.',
    keywords: ['LIV Plastic Surgery events', 'Seoul clinic promotion', 'Ultherapy discount', 'Thermage discount', 'Botox event', 'Filler event', 'anti-aging promotion'],
  },
  ja: {
    title: 'イベント | リブ形成外科',
    description: 'リブ形成外科の最新イベントと特別プロモーションをご確認ください。ウルセラ、サーマジ、ボトックス、フィラーなど様々な施術の割引特典。',
    keywords: ['リブ形成外科イベント', 'ソウルクリニックプロモーション', 'ウルセラ割引', 'サーマジ割引', 'ボトックスイベント', 'フィラーイベント'],
  },
  zh: {
    title: '活动 | LIV整形外科',
    description: '查看LIV整形外科的最新活动和特别促销。超声刀、热玛吉、肉毒素、玻尿酸等各种项目优惠。',
    keywords: ['LIV整形外科活动', '首尔诊所促销', '超声刀折扣', '热玛吉折扣', '肉毒素活动', '玻尿酸活动', '抗衰老促销'],
  },
  'zh-TW': {
    title: '活動 | LIV整形外科',
    description: '查看LIV整形外科的最新活動和特別優惠。超音波拉皮、電波拉皮、肉毒桿菌、玻尿酸等各種療程優惠。',
    keywords: ['LIV整形外科活動', '首爾診所優惠', '超音波拉皮折扣', '電波拉皮折扣', '肉毒桿菌活動', '玻尿酸活動', '抗老化優惠'],
  },
  vi: {
    title: 'Sự kiện | Phẫu thuật Thẩm mỹ LIV',
    description: 'Khám phá các sự kiện mới nhất và ưu đãi đặc biệt tại Phẫu thuật Thẩm mỹ LIV. Ưu đãi cho Ultherapy, Thermage, Botox, Filler và nhiều liệu trình khác.',
    keywords: ['sự kiện LIV', 'ưu đãi phòng khám Seoul', 'giảm giá Ultherapy', 'giảm giá Thermage', 'sự kiện Botox', 'sự kiện Filler', 'khuyến mãi trẻ hóa'],
  },
  th: {
    title: 'กิจกรรม | ศัลยกรรมความงาม LIV',
    description: 'ดูกิจกรรมล่าสุดและโปรโมชั่นพิเศษของ LIV ศัลยกรรมความงาม พร้อมส่วนลดสำหรับ Ultherapy, Thermage, โบท็อกซ์, ฟิลเลอร์ และหัตถการอื่นๆ',
    keywords: ['กิจกรรม LIV', 'โปรโมชั่นคลินิกโซล', 'ส่วนลด Ultherapy', 'ส่วนลด Thermage', 'กิจกรรมโบท็อกซ์', 'กิจกรรมฟิลเลอร์', 'โปรโมชั่นแอนตี้เอจจิ้ง'],
  },
  ru: {
    title: 'События | Пластическая хирургия LIV',
    description: 'Узнайте о последних событиях и специальных предложениях клиники LIV. Скидки на Ultherapy, Thermage, ботокс, филлеры и другие процедуры.',
    keywords: ['события LIV', 'акции клиники в Сеуле', 'скидка Ultherapy', 'скидка Thermage', 'акция ботокс', 'акция филлеры', 'антивозрастные предложения'],
  },
  fr: {
    title: 'Événements | LIV Chirurgie Esthétique',
    description: 'Découvrez les derniers événements et promotions spéciales de LIV Chirurgie Esthétique. Offres sur Ultherapy, Thermage, Botox, acide hyaluronique et bien plus.',
    keywords: ['événements LIV', 'promotion clinique Séoul', 'remise Ultherapy', 'remise Thermage', 'événement Botox', 'événement acide hyaluronique', 'promotion anti-âge'],
  },
  mn: {
    title: 'Урамшуулал | LIV Гоо Заслын Эмнэлэг',
    description: 'LIV Гоо Заслын Эмнэлгийн шинэ урамшуулал, тусгай хөнгөлөлтийг үзнэ үү. Ultherapy, Thermage, Botox, Filler зэрэг эмчилгээний хөнгөлөлт.',
    keywords: ['LIV урамшуулал', 'Сөүлийн эмнэлгийн хөнгөлөлт', 'Ultherapy хямдрал', 'Thermage хямдрал', 'Botox урамшуулал', 'Filler урамшуулал', 'залуужуулах урамшуулал'],
  },
  ar: {
    title: 'العروض | مستشفى ليف للتجميل',
    description: 'اكتشف أحدث العروض والحملات الترويجية في مستشفى ليف للتجميل. عروض على ألثيرابي وثيرماج والبوتوكس والفيلر وغيرها من الإجراءات.',
    keywords: ['عروض ليف', 'عروض عيادات سيول', 'خصم ألثيرابي', 'خصم ثيرماج', 'عرض البوتوكس', 'عرض الفيلر', 'عروض مكافحة الشيخوخة'],
  },
};

export default async function EventsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;

  // 진행중인 이벤트만 추출
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeEvents = EVENTS.filter(event => {
    const endDate = new Date(event.endDate);
    endDate.setHours(23, 59, 59, 999);
    return endDate >= today;
  });

  const inLanguage = (LOCALE_META[loc] ?? LOCALE_META.ko).hreflang;
  const localeData = EVENTS_META[locale] ?? EVENTS_META.en;
  const siteName = getSiteName(locale);
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  // Event location 주소 — ko는 국문 주소, 그 외 로케일은 병원 공식 로마자 표기(SITE_INFO.address.en).
  // 한국어 주소가 해외 로케일 구조화 데이터로 새지 않게 한다. (seo.ts의 ROMANIZED_ADDRESS와 동일 표기)
  const eventAddress =
    locale === 'ko'
      ? { streetAddress: SITE_INFO.address.ko, addressLocality: '서초구', addressRegion: '서울특별시' }
      : { streetAddress: SITE_INFO.address.en, addressLocality: 'Seocho-gu', addressRegion: 'Seoul' };

  // Event Schema (Schema.org)
  const eventsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: tNav('events'),
    description: localeData.description,
    numberOfItems: activeEvents.length,
    itemListElement: activeEvents.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: pickLocalized(event.title, loc),
        description: pickLocalized(event.description, loc),
        startDate: event.startDate,
        endDate: event.endDate,
        image: [`${BASE_URL}${event.posterImage}`],
        url: `${BASE_URL}/${locale}/events/${event.id}`,
        location: {
          '@type': 'Place',
          name: siteName,
          address: {
            '@type': 'PostalAddress',
            ...eventAddress,
            postalCode: SITE_INFO.postalCode,
            addressCountry: 'KR',
          },
        },
        performer: {
          '@type': 'Organization',
          name: siteName,
          url: BASE_URL,
        },
        organizer: {
          '@type': 'MedicalBusiness',
          name: siteName,
          url: BASE_URL,
        },
        offers: {
          '@type': 'Offer',
          url: `${BASE_URL}/${locale}/events/${event.id}`,
          price: '0',
          priceCurrency: 'KRW',
          availability: 'https://schema.org/InStock',
          validFrom: event.startDate,
        },
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      },
    })),
  };

  // 로케일별 breadcrumb (홈 → 이벤트) — nav.events는 전 로케일 존재.
  const breadcrumbSchema = await localizedBreadcrumbSchema(locale, [
    { home: true },
    { navKey: 'events', url: '/events' },
  ]);

  // WebPage Schema
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: tNav('events'),
    description: localeData.description,
    url: `${BASE_URL}/${locale}/events`,
    inLanguage,
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: BASE_URL,
    },
    breadcrumb: breadcrumbSchema,
  };

  return (
    <>
      {/* Events Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsSchema) }}
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
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const localeData = EVENTS_META[locale] ?? EVENTS_META.en;

  return {
    title: localeData.title,
    description: localeData.description,
    keywords: localeData.keywords,
    openGraph: {
      title: localeData.title,
      description: localeData.description,
      url: `${BASE_URL}/${locale}/events`,
      siteName: getSiteName(locale),
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/images/og-events.jpg`,
          width: 1200,
          height: 630,
          alt: localeData.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: localeData.title,
      description: localeData.description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/events`,
      languages: buildHreflangMap('/events'),
    },
  };
}
