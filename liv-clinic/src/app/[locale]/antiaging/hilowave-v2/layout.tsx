// Design Ref: §2 — 비교용 풀 컴포넌트 버전 SEO
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

const PATH = '/antiaging/hilowave-v2';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'hilowaveV2', PATH);
}

export default async function HiloWaveV2Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'hilowaveV2',
    path: PATH,
    type: 'MedicalWebPage',
    breadcrumbs: [
      { home: true },
      { navKey: 'antiaging', url: '/antiaging' },
      { navKey: 'hilowaveV2', url: PATH },
    ],
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {children}
    </>
  );
}
