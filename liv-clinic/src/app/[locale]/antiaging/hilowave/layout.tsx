// Design Ref: §5.2 — 통이미지 페이지 SEO 보완 (본문 텍스트가 검색에 안 잡히므로 메타/스키마로 보완)
import { localizedWebPageSchema } from '@/lib/schemaI18n';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

const PATH = '/antiaging/hilowave';

// 메타데이터 생성 — buildLocalizedMetadata가 metaSeo 다국어 + hreflang/canonical(11개 로케일) 자동 생성
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'hilowave', PATH);
}

export default async function HiloWaveLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // WebPage + Breadcrumb 스키마 (로케일별 title/description/inLanguage)
  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'hilowave',
    path: PATH,
    type: 'MedicalWebPage',
    breadcrumbs: [
      { home: true },
      { navKey: 'antiaging', url: '/antiaging' },
      { navKey: 'hilowave', url: PATH },
    ],
  });

  return (
    <>
      {/* WebPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {children}
    </>
  );
}
