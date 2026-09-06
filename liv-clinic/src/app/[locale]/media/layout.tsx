import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildLocalizedMetadata } from '@/lib/pageMeta';
import { generateWebPageSchema, getSiteName, BASE_URL } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';
import { mediaNewsData } from '@/lib/data/mediaNewsData';
import { getLocalizedMediaItem } from '@/lib/data/mediaNewsI18n';

const PATH = '/media';

// 메타데이터 — metaSeo.media(11개 로케일) 기준. 기존 로컬 META 맵(ko/en/ja/zh만 정의 →
// 나머지 7개 로케일이 한국어로 폴백)을 대체한다. hreflang/canonical은 buildLocalizedMetadata가 처리.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'media', PATH);
}

export default async function MediaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metaSeo' });
  const siteName = getSiteName(locale);

  // path는 로케일 없이 넘긴다 — generateWebPageSchema가 로케일을 붙인다.
  // (`/${locale}${PATH}`를 넘겨 JSON-LD url이 /ko/ko/media 가 됐고 구글이 그 URL을 크롤링했다. 2026-09-06 GSC 404)
  const webPageSchema = generateWebPageSchema({
    path: PATH,
    title: t('media.title'),
    description: t('media.description'),
    locale,
    breadcrumbs: [
      { name: siteName, url: `/${locale}` },
      { name: 'Media & News', url: `/${locale}${PATH}` },
    ],
  });

  // 외부 기사 항목을 NewsArticle ItemList로 노출 (검색 노출 보강).
  // headline·publisher는 로케일 번역본을 쓴다(원문 링크는 한국어 기사 그대로).
  const externalItems = mediaNewsData
    .filter((item) => item.isExternal && item.link)
    .map((item) => getLocalizedMediaItem(item, locale as Locale));

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'LIV Media & News',
    numberOfItems: externalItems.length,
    itemListElement: externalItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'NewsArticle',
        headline: item.title,
        datePublished: `${item.year}-01-01`,
        url: item.link,
        publisher: { '@type': 'Organization', name: item.source || siteName },
        about: { '@type': 'MedicalBusiness', name: siteName, url: BASE_URL },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      {children}
    </>
  );
}
