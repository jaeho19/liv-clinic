import { getTranslations } from 'next-intl/server';
import { buildLocalizedMetadata } from '@/lib/pageMeta';
import {
  localizedWebPageSchema,
  localizedBreadcrumbSchema,
  type CrumbSpec,
} from '@/lib/schemaI18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'privacy', '/privacy');
}

type Section = { heading: string; body: string };

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  const sections = t.raw('sections') as Section[];

  const crumbs: CrumbSpec[] = [
    { home: true },
    { name: t('title'), url: '/privacy' },
  ];
  const [webPageSchema, breadcrumbSchema] = await Promise.all([
    localizedWebPageSchema({
      locale,
      metaKey: 'privacy',
      path: '/privacy',
      type: 'WebPage',
      breadcrumbs: crumbs,
    }),
    localizedBreadcrumbSchema(locale, crumbs),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-display text-secondary mb-4">{t('title')}</h1>
            <p className="text-small text-mono-light mb-6">
              {t('updatedLabel')}: {t('effectiveDate')}
            </p>
            <p className="text-body text-mono leading-relaxed">{t('intro')}</p>
          </div>
        </div>
      </section>

      {/* Policy body */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <div className="max-w-3xl space-y-10">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-h3 text-secondary mb-3">{section.heading}</h2>
                <p className="text-body text-mono leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
