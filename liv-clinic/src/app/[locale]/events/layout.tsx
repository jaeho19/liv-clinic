import { getTranslations } from 'next-intl/server';
import { BASE_URL, buildHreflangMap } from '@/lib/seo';
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
  const localeData = EVENTS_META[locale] || EVENTS_META.ko;
  const tNav = await getTranslations({ locale, namespace: 'nav' });

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
          name: SITE_INFO.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: SITE_INFO.address.ko,
            addressLocality: '서초구',
            addressRegion: '서울특별시',
            postalCode: SITE_INFO.postalCode,
            addressCountry: 'KR',
          },
        },
        performer: {
          '@type': 'Organization',
          name: SITE_INFO.name,
          url: BASE_URL,
        },
        organizer: {
          '@type': 'MedicalBusiness',
          name: SITE_INFO.name,
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
      name: SITE_INFO.name,
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

  const localeData = EVENTS_META[locale] || EVENTS_META.ko;

  return {
    title: localeData.title,
    description: localeData.description,
    keywords: localeData.keywords,
    openGraph: {
      title: localeData.title,
      description: localeData.description,
      url: `${BASE_URL}/${locale}/events`,
      siteName: SITE_INFO.name,
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
