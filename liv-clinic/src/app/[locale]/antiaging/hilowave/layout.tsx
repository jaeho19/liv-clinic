// Design Ref: §5.2 — 통이미지 페이지 SEO 보완 (본문 텍스트가 검색에 안 잡히므로 메타/스키마로 보완)
import { generatePageMetadata, generateWebPageSchema, BASE_URL } from '@/lib/seo';

const PATH = '/antiaging/hilowave';
const TITLE = '힐로웨이브(HILO WAVE) | LIV 성형외과';
const DESC =
  '피부 밀도·탄력·리프팅을 한 번에 — HILO WAVE는 피부 깊숙이 차오르는 자연스러운 탄력의 흐름을 선사하는 LIV 성형외과의 안티에이징 프로그램입니다.';
const OG_IMAGE = `${BASE_URL}/images/antiaging/hilowave/hilowave-full.jpg`;
const KEYWORDS = [
  '힐로웨이브',
  'HILO WAVE',
  '피부 밀도',
  '피부 탄력',
  '리프팅',
  '안티에이징',
  '신사역 안티에이징',
  'LIV 성형외과',
];

// 메타데이터 생성 — generatePageMetadata가 hreflang/canonical(11개 로케일) 자동 생성
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({
    locale,
    path: PATH,
    title: TITLE,
    description: DESC,
    keywords: KEYWORDS,
    images: [{ url: OG_IMAGE, width: 1920, height: 11732, alt: 'HILO WAVE' }],
  });
}

export default function HiloWaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // WebPage + Breadcrumb 스키마 (generateWebPageSchema가 breadcrumbs 인자 지원)
  const pageSchema = generateWebPageSchema({
    path: PATH,
    title: TITLE,
    description: DESC,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '안티에이징', url: '/antiaging' },
      { name: 'HILO WAVE', url: PATH },
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
