import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata, getSiteName } from '@/lib/seo';
import { hubLocales, listGuides } from '@/lib/guides';
import { ARTICLE_LOCALES, isArticleLocale } from '@/lib/guides/types';
import { GUIDE_UI } from '@/lib/guides/ui';
import GuideCard from '@/components/guides/GuideCard';

export const revalidate = 3600;
// 허브는 글이 있을 수 있는 언어(한국어 칼럼 + 외국인 가이드 4개 언어)만 정적 생성한다.
// 그 밖(vi·th·…)은 404 — notFound()만으로는 프리렌더 결과가 200으로 서빙됐다(로컬 확인).
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLE_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isArticleLocale(locale)) return {};
  const ui = GUIDE_UI[locale];
  const meta = generatePageMetadata({
    locale,
    title: `${ui.hubTitle} | ${getSiteName(locale)}`,
    description: ui.hubIntro,
    path: '/guides',
    alternateLocales: hubLocales(),
  });
  // 게시된 글이 하나도 없는 언어의 허브는 빈 페이지 — 색인하지 않는다(한국어 칼럼은 첫 편이 공개될 때까지 이 상태)
  return listGuides(locale).length > 0 ? meta : { ...meta, robots: { index: false, follow: true } };
}

export default async function GuidesHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isArticleLocale(locale)) notFound();
  setRequestLocale(locale);
  const ui = GUIDE_UI[locale];
  const guides = listGuides(locale);
  return (
    <>
      <section className="bg-gradient-to-b from-primary/10 to-background pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="container-custom max-w-3xl">
          <p className="mb-3 font-serif text-h4 text-primary">{ui.hubEyebrow}</p>
          <h1 className="mb-4 text-h1 text-secondary md:text-display">{ui.hubTitle}</h1>
          <p className="text-body leading-relaxed text-mono md:text-h4">{ui.hubIntro}</p>
        </div>
      </section>
      <section className="section-gap bg-background">
        <div className="container-custom">
          {guides.length === 0 ? (
            <p className="text-body text-mono-light">{ui.hubEmpty}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => (
                <GuideCard key={g.slug} guide={g} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
