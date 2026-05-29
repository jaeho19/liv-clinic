// Design Ref: §2 — 비교용 풀 컴포넌트 버전 SEO
import { generatePageMetadata, generateWebPageSchema } from '@/lib/seo';

const PATH = '/antiaging/hilowave-v2';
const TITLE = '힐로웨이브(HILO WAVE) v2 | LIV 성형외과';
const DESC =
  '피부 밀도·탄력·리프팅을 한 번에 — HILO WAVE는 고·저분자 Dual-HA로 피부 깊숙이 자연스러운 탄력의 흐름을 채우는 LIV 성형외과의 안티에이징 프로그램입니다.';

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
    keywords: [
      '힐로웨이브',
      'HILO WAVE',
      '피부 밀도',
      '피부 탄력',
      '리프팅',
      '안티에이징',
      '신사역 안티에이징',
      'LIV 성형외과',
    ],
  });
}

export default function HiloWaveV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageSchema = generateWebPageSchema({
    path: PATH,
    title: TITLE,
    description: DESC,
    locale: 'ko',
    type: 'MedicalWebPage',
    breadcrumbs: [
      { name: '홈', url: '/' },
      { name: '안티에이징', url: '/antiaging' },
      { name: 'HILO WAVE (v2)', url: PATH },
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
