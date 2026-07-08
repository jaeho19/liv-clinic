import { localizedBreadcrumbSchema } from '@/lib/schemaI18n';

// 카테고리 랜딩 BreadcrumbList 스키마 (로케일별). 메타데이터는 page.tsx에서 생성.
export default async function AntiagingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const breadcrumbSchema = await localizedBreadcrumbSchema(locale, [
    { home: true },
    { navKey: 'antiaging', url: '/antiaging' },
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
