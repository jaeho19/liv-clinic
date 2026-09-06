import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata, generateWebPageSchema, getSiteName, safeJsonLd } from '@/lib/seo';
import { localizedBreadcrumbSchema } from '@/lib/schemaI18n';
import { TERMS } from '@/lib/legal/terms';
import type { Locale } from '@/i18n/routing';

// 이용약관 — 푸터 링크가 가리키던 /terms 가 없어 GSC 404(3건)로 잡혔다(2026-09-06).
// 본문은 메시지 JSON을 늘리지 않으려고 TS 사전(src/lib/legal/terms.ts)에 둔다 — privacy 페이지와 같은 화면 구조.
const PATH = '/terms';

function termsFor(locale: string) {
  return TERMS[locale as Locale] ?? TERMS.en;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const terms = termsFor(locale);
  return generatePageMetadata({
    locale,
    title: terms.metaTitle,
    description: terms.metaDescription,
    path: PATH,
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const terms = termsFor(locale);
  const siteName = getSiteName(locale);

  const [webPageSchema, breadcrumbSchema] = await Promise.all([
    generateWebPageSchema({
      path: PATH,
      title: terms.metaTitle,
      description: terms.metaDescription,
      locale,
      breadcrumbs: [
        { name: siteName, url: `/${locale}` },
        { name: terms.title, url: `/${locale}${PATH}` },
      ],
    }),
    localizedBreadcrumbSchema(locale, [{ home: true }, { name: terms.title, url: PATH }]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-display text-secondary mb-4">{terms.title}</h1>
            <p className="text-small text-mono-light mb-6">
              {terms.effectiveLabel}: {terms.effectiveDate}
            </p>
            <p className="text-body text-mono leading-relaxed">{terms.intro}</p>
          </div>
        </div>
      </section>

      {/* Terms body */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <div className="max-w-3xl space-y-10">
            {terms.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-h3 text-secondary mb-3">{section.heading}</h2>
                <p className="text-body text-mono leading-relaxed whitespace-pre-line">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
