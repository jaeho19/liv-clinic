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

  const t = useTranslations();
  const tNav = useTranslations('nav');

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">Anti-aging</p>
              <h1 className="text-display text-secondary mb-6">{tNav('antiaging')}</h1>
              <p className="text-h4 text-mono leading-relaxed">
                시간을 되돌리는 프리미엄 안티에이징으로
                <br />
                젊고 생기 넘치는 피부를 되찾으세요.
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
              <p className="font-serif text-h3 text-primary mb-4">Our Treatments</p>
              <h2 className="text-h1 text-secondary">안티에이징 시술 라인업</h2>
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
                <p className="font-serif text-h3 text-primary mb-4">Natural Beauty</p>
                <h2 className="text-h1 text-secondary mb-6">자연스러운 아름다움</h2>
                <p className="text-body text-mono leading-relaxed mb-8">
                  리브성형외과의 안티에이징은 과하지 않은, 자연스러운 아름다움을 추구합니다.
                  정품 제품만을 사용하고, 개인별 맞춤 시술로 최적의 결과를 만들어냅니다.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-h4 text-secondary mb-1">정품정량 원칙</h4>
                      <p className="text-body text-mono">FDA 승인 정품만을 사용하며, 정해진 용량을 지킵니다.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-h4 text-secondary mb-1">맞춤 시술 설계</h4>
                      <p className="text-body text-mono">얼굴 구조와 피부 상태를 분석하여 최적의 시술을 제안합니다.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-h4 text-secondary mb-1">자연스러운 결과</h4>
                      <p className="text-body text-mono">티 나지 않는 자연스러운 변화로 본연의 아름다움을 되찾습니다.</p>
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
              <h2 className="text-h1 mb-4">젊음을 되찾고 싶으신가요?</h2>
              <p className="text-h4 opacity-80 mb-8">
                전문 상담을 통해 나에게 맞는 시술을 찾아보세요.
              </p>
              <ScrollLink href="/contact">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-primary text-white hover:bg-secondary"
                >
                  무료 상담 신청
                </Button>
              </ScrollLink>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
