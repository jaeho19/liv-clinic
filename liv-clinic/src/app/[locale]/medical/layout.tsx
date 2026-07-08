import { buildMedicalSchemas } from '@/lib/schemaI18n';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

export default async function MedicalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // 로케일별 Q&A(messages.medical.faq, 개수 동적) 기반 FAQPage + WebPage 스키마
  const schemas = await buildMedicalSchemas(locale);

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
  return buildLocalizedMetadata(locale, 'medical', '/medical');
}
