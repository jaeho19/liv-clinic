import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card, ScrollLink } from '@/components/ui';
import { TreatmentComparison } from '@/components/sections';
import { TREATMENTS } from '@/lib/constants';
import { routing } from '@/i18n/routing';

const liftingTreatments = Object.values(TREATMENTS.lifting);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function LiftingPage({
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
              <p className="font-serif text-h3 text-primary mb-4">Lifting</p>
              <h1 className="text-display text-secondary mb-6">{tNav('lifting')}</h1>
              <p className="text-h4 text-mono leading-relaxed">
                중력을 거스르는 프리미엄 리프팅 솔루션으로
                <br />
                자연스럽고 탄력 있는 피부를 되찾으세요.
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
              <h2 className="text-h1 text-secondary">리프팅 시술 라인업</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liftingTreatments.map((treatment) => (
              <AnimateOnScroll key={treatment.id}>
                <Link href={`/lifting/${treatment.id}`}>
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

      {/* Treatment Comparison Table */}
      <TreatmentComparison />

      {/* Why Lifting */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="font-serif text-h3 text-primary mb-4">Why LIV Lifting?</p>
              <h2 className="text-h1 text-secondary">리브 리프팅을 선택해야 하는 이유</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-h4 text-secondary mb-3">정품 인증</h3>
                <p className="text-body text-mono">
                  울쎄라피 프라임, 써마지 공식 인증 병원으로
                  <br />
                  정품 장비만을 사용합니다.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-h4 text-secondary mb-3">전문 의료진</h3>
                <p className="text-body text-mono">
                  풍부한 시술 경험을 갖춘
                  <br />
                  전문 의료진이 직접 시술합니다.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-h4 text-secondary mb-3">맞춤 솔루션</h3>
                <p className="text-body text-mono">
                  개인별 피부 상태에 맞는
                  <br />
                  최적의 시술을 설계합니다.
                </p>
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
              <h2 className="text-h1 mb-4">나에게 맞는 리프팅이 궁금하신가요?</h2>
              <p className="text-h4 opacity-80 mb-8">
                전문 상담을 통해 최적의 시술을 찾아보세요.
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
