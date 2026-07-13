import { TREATMENTS } from '@/lib/constants';
import { buildTreatmentLeafSchemas } from '@/lib/schemaI18n';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

export default async function OndaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const schemas = await buildTreatmentLeafSchemas({
    locale,
    base: TREATMENTS.lifting.onda,
    category: 'lifting',
    howTo: true,
  });

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {children}
    </>
  );
}

// 메타데이터 생성
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'onda', '/lifting/onda');
}
