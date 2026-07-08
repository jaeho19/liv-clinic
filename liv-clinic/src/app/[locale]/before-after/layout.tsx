import { buildLocalizedMetadata } from '@/lib/pageMeta';
import { localizedBreadcrumbSchema } from '@/lib/schemaI18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'beforeAfter', '/before-after');
}

export default async function BeforeAfterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const breadcrumbSchema = await localizedBreadcrumbSchema(locale, [
    { home: true },
    { navKey: 'beforeAfter', url: '/before-after' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
