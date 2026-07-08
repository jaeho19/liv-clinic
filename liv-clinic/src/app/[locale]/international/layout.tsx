import { getTranslations } from 'next-intl/server';
import { buildLocalizedMetadata } from '@/lib/pageMeta';
import {
  localizedWebPageSchema,
  localizedBreadcrumbSchema,
  type CrumbSpec,
} from '@/lib/schemaI18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'international', '/international');
}

export default async function InternationalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // nav 네임스페이스에 international 키가 없어 hero.title(로케일별)을 리프 라벨로 사용
  const tIntl = await getTranslations({ locale, namespace: 'international' });
  const crumbs: CrumbSpec[] = [
    { home: true },
    { name: tIntl('hero.title'), url: '/international' },
  ];

  const [webPageSchema, breadcrumbSchema] = await Promise.all([
    localizedWebPageSchema({
      locale,
      metaKey: 'international',
      path: '/international',
      type: 'WebPage',
      breadcrumbs: crumbs,
    }),
    localizedBreadcrumbSchema(locale, crumbs),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
