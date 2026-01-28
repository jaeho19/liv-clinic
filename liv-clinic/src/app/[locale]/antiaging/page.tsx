import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card, ScrollLink } from '@/components/ui';
import { TREATMENTS } from '@/lib/constants';
import { routing } from '@/i18n/routing';

const antiagingTreatments = Object.values(TREATMENTS.antiaging);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function AntiagingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params as unknown as { locale: string };
  setRequestLocale(resolvedParams.locale);

  const t = useTranslations('antiagingPage');
  const tNav = useTranslations('nav');

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">{t('hero.subtitle')}</p>
              <h1 className="text-display text-secondary mb-6">{tNav('antiaging')}</h1>
              <p className="text-h4 text-mono leading-relaxed">
                {t('hero.description1')}
                <br />
                {t('hero.description2')}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Treatments Grid */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-4">{t('lineup.subtitle')}</p>
              <h2 className="text-h1 text-secondary">{t('lineup.title')}</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {antiagingTreatments.map((treatment) => (
              <AnimateOnScroll key={treatment.id}>
                <Link href={`/antiaging/${treatment.id}`}>
                  <Card padding="none" className="overflow-hidden group cursor-pointer h-full">
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(/images/treatments/${treatment.id}.jpg)` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-5xl text-white/30">
                          {treatment.nameEn.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6">
                      <p className="text-small text-primary mb-2">{treatment.nameEn}</p>
                      <h3 className="text-h3 text-secondary group-hover:text-primary transition-colors mb-3">
                        {treatment.name}
                      </h3>
                      <p className="text-body text-mono line-clamp-2 mb-4">
                        {treatment.description}
                      </p>
                      <div className="flex items-center gap-4 text-small text-mono-light">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {treatment.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {treatment.recovery}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fadeInLeft">
              <div>
                <p className="font-serif text-h3 text-primary mb-4">{t('benefits.subtitle')}</p>
                <h2 className="text-h1 text-secondary mb-6">{t('benefits.title')}</h2>
                <p className="text-body text-mono leading-relaxed mb-8">
                  {t('benefits.description')}
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-h4 text-secondary mb-1">{t('benefits.authentic.title')}</h4>
                      <p className="text-body text-mono">{t('benefits.authentic.description')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-h4 text-secondary mb-1">{t('benefits.customized.title')}</h4>
                      <p className="text-body text-mono">{t('benefits.customized.description')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-h4 text-secondary mb-1">{t('benefits.natural.title')}</h4>
                      <p className="text-body text-mono">{t('benefits.natural.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fadeInRight">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: 'url(/images/antiaging-hero.jpg)' }}
                />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">{t('cta.title')}</h2>
              <p className="text-h4 opacity-80 mb-8">
                {t('cta.description')}
              </p>
              <ScrollLink href="/contact">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-primary text-white hover:bg-secondary"
                >
                  {t('cta.button')}
                </Button>
              </ScrollLink>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
