import { getTranslations } from 'next-intl/server';
import { buildLocalizedMetadata } from '@/lib/pageMeta';
import { localizedBreadcrumbSchema } from '@/lib/schemaI18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'gallery', '/gallery');
}

export default async function GalleryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // nav 네임스페이스에 gallery 키가 없어 gallery.title(로케일별)을 리프 라벨로 사용
  const tGallery = await getTranslations({ locale, namespace: 'gallery' });
  const breadcrumbSchema = await localizedBreadcrumbSchema(locale, [
    { home: true },
    { name: tGallery('title'), url: '/gallery' },
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
