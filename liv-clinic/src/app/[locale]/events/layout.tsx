import { getTranslations } from 'next-intl/server';
import { BASE_URL, buildHreflangMap, getSiteName } from '@/lib/seo';
import { localizedBreadcrumbSchema } from '@/lib/schemaI18n';
import { LOCALE_META } from '@/i18n/locales-meta';
import { pickLocalized } from '@/lib/i18nFallback';
import { SITE_INFO, EVENTS } from '@/lib/constants';
import type { Locale } from '@/i18n/routing';
import { eventsMetaFor } from '@/lib/eventsMeta';

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
  const localeData = eventsMetaFor(locale);
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

  const localeData = eventsMetaFor(locale);

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
