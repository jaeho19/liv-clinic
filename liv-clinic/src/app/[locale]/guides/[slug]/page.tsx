import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BASE_URL, generatePageMetadata, getSiteName, safeJsonLd } from '@/lib/seo';
import { allGuideParams, getGuide, guideLocalesFor } from '@/lib/guides';
import { isDoctorAuthored } from '@/lib/guides/byline';
import { GUIDE_UI } from '@/lib/guides/ui';
import { buildGuideSchemas } from '@/lib/guides/schema';
import { guideOgImage } from '@/lib/guides/ogImage';
import GuideArticle from '@/components/guides/GuideArticle';

export const revalidate = 3600;
// 원고가 있는 (언어, slug)만 생성한다 — 한국어 칼럼과 외국인 가이드. 그 밖(vi/… 또는 없는 slug)은 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return allGuideParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuide(locale, slug);
  if (!guide) return {};
  const published = guide.status === 'published';
  const ogImage = guideOgImage(guide);
  const meta = generatePageMetadata({
    locale,
    title: `${guide.title} | ${getSiteName(locale)}`,
    description: guide.description,
    keywords: guide.keywords,
    path: `/guides/${slug}`,
    // 대표 사진이 있으면 공유 이미지로 쓴다(없으면 사이트 기본 이미지)
    images: ogImage ? [ogImage] : [],
    alternateLocales: published ? guideLocalesFor(slug) : [locale],
    ogType: 'article',
  });
  // 글 정보(저자·공개일·수정일)를 공유 메타에도 싣는다 — 검색엔진·AI 검색이 글의 출처와 시점을 읽는 자리.
  // 한국어 칼럼의 저자는 원장(의료진 소개로 이음), 외국인 가이드는 병원 이름 그대로.
  const doctor = isDoctorAuthored(guide);
  const article: Metadata = {
    ...meta,
    ...(doctor ? { authors: [{ name: GUIDE_UI[guide.locale].doctorAuthor, url: `${BASE_URL}/${locale}/about/staff` }] } : {}),
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      publishedTime: guide.published ?? guide.updated,
      modifiedTime: guide.updated,
      ...(doctor ? { authors: [`${BASE_URL}/${locale}/about/staff`] } : {}),
    },
  };
  // 초안은 직접 URL로만 검수한다 — 색인·링크 추적 모두 막는다
  return published ? article : { ...article, robots: { index: false, follow: false } };
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const guide = getGuide(locale, slug);
  if (!guide) notFound();
  setRequestLocale(locale);
  const schemas = await buildGuideSchemas(guide);
  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      ))}
      <GuideArticle guide={guide} />
    </>
  );
}
