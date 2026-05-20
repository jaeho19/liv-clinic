import type { Metadata } from 'next';
import { generatePageMetadata, generateWebPageSchema, BASE_URL } from '@/lib/seo';
import { SITE_INFO } from '@/lib/constants';
import { mediaNewsData } from '@/lib/data/mediaNewsData';

const META: Record<string, { title: string; description: string; keywords: string[] }> = {
  ko: {
    title: 'Media & News | 리브성형외과',
    description:
      '리브성형외과의 방송 출연, 전문 매체 인터뷰, 학술 활동, 글로벌 인증, 병원 소식을 한곳에서 확인하실 수 있습니다.',
    keywords: ['리브성형외과 언론보도', '리브성형외과 소식', 'APTOS 공식 트레이너', '리브성형외과 방송 출연', '신사역 성형외과 미디어'],
  },
  en: {
    title: 'Media & News | LIV Plastic Surgery',
    description:
      'Broadcast appearances, professional media interviews, academic activities, global certifications, and clinic news from LIV Plastic Surgery — all in one place.',
    keywords: ['LIV Plastic Surgery media', 'LIV news', 'APTOS official trainer', 'LIV press coverage', 'Seoul clinic media'],
  },
  ja: {
    title: 'Media & News | リブ形成外科',
    description:
      'リブ形成外科の放送出演、専門メディアのインタビュー、学術活動、グローバル認証、クリニックニュースを一か所でご確認いただけます。',
    keywords: ['リブ形成外科 メディア', 'リブ形成外科 ニュース', 'APTOS公式トレーナー', 'リブ形成外科 放送'],
  },
  zh: {
    title: 'Media & News | LIV整形外科',
    description: 'LIV整形外科的节目出演、专业媒体采访、学术活动、全球认证及医院资讯，尽在一处。',
    keywords: ['LIV整形外科 媒体', 'LIV整形外科 资讯', 'APTOS官方培训师', 'LIV整形外科 报道'],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.ko;
  return generatePageMetadata({
    locale,
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    path: '/media',
  });
}

export default async function MediaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const m = META[locale] ?? META.ko;

  const webPageSchema = generateWebPageSchema({
    path: `/${locale}/media`,
    title: m.title,
    description: m.description,
    locale,
    breadcrumbs: [
      { name: SITE_INFO.name, url: `/${locale}` },
      { name: 'Media & News', url: `/${locale}/media` },
    ],
  });

  // 외부 기사 항목을 NewsArticle ItemList로 노출 (검색 노출 보강)
  const externalItems = mediaNewsData.filter((item) => item.isExternal && item.link);
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
        publisher: { '@type': 'Organization', name: item.source || SITE_INFO.name },
        about: { '@type': 'MedicalBusiness', name: SITE_INFO.name, url: BASE_URL },
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
