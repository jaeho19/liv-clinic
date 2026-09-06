import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata, getSiteName, safeJsonLd } from '@/lib/seo';
import { allGuideParams, getGuide, guideLocalesFor } from '@/lib/guides';
import { buildGuideSchemas } from '@/lib/guides/schema';
import GuideArticle from '@/components/guides/GuideArticle';

export const revalidate = 3600;
// 4개 언어 × 존재하는 slug만 생성. 그 밖(ko/vi/… 또는 없는 slug)은 404.
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
  const meta = generatePageMetadata({
    locale,
    title: `${guide.title} | ${getSiteName(locale)}`,
    description: guide.description,
    keywords: guide.keywords,
    path: `/guides/${slug}`,
    alternateLocales: published ? guideLocalesFor(slug) : [locale],
    ogType: 'article',
  });
  // 초안은 직접 URL로만 검수한다 — 색인·링크 추적 모두 막는다
  return published ? meta : { ...meta, robots: { index: false, follow: false } };
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
