import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata, getSiteName } from '@/lib/seo';
import { listGuides } from '@/lib/guides';
import { GUIDE_LOCALES, isGuideLocale } from '@/lib/guides/types';
import { GUIDE_UI } from '@/lib/guides/ui';
import GuideCard from '@/components/guides/GuideCard';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isGuideLocale(locale)) return {};
  const ui = GUIDE_UI[locale];
  const meta = generatePageMetadata({
    locale,
    title: `${ui.hubTitle} | ${getSiteName(locale)}`,
    description: ui.hubIntro,
    path: '/guides',
    alternateLocales: GUIDE_LOCALES.filter((l) => listGuides(l).length > 0),
  });
  // 게시된 가이드가 하나도 없는 언어의 허브는 빈 페이지 — 색인하지 않는다
  return listGuides(locale).length > 0 ? meta : { ...meta, robots: { index: false, follow: true } };
}

export default async function GuidesHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isGuideLocale(locale)) notFound();
  setRequestLocale(locale);
  const ui = GUIDE_UI[locale];
  const guides = listGuides(locale);
  return (
    <>
      <section className="bg-gradient-to-b from-primary/10 to-background pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="container-custom max-w-3xl">
          <p className="mb-3 font-serif text-h4 text-primary">{ui.international}</p>
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
