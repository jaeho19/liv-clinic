import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, Card, ScrollLink } from '@/components/ui';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const promotions = [
  {
    id: 'new-year',
    title: '2025 새해 특별 이벤트',
    subtitle: 'New Year Special',
    description: '새해를 맞아 리프팅 시술 20% 할인! 울쎄라피 프라임, 써마지, 인모드 전 품목 대상',
    discount: '20%',
    period: '2025.01.01 ~ 2025.01.31',
    tag: 'HOT',
    active: true,
  },
  {
    id: 'first-visit',
    title: '첫 방문 고객 혜택',
    subtitle: 'First Visit Benefit',
    description: '첫 방문 고객님께 스킨부스터 1회 무료 추가 제공',
    discount: '+1회',
    period: '상시 진행',
    tag: 'NEW',
    active: true,
  },
  {
    id: 'friend',
    title: '친구 추천 이벤트',
    subtitle: 'Refer a Friend',
    description: '친구 추천 시 추천인/피추천인 모두 10만원 할인',
    discount: '10만원',
    period: '상시 진행',
    tag: '',
    active: true,
  },
  {
    id: 'package',
    title: '시그니처 패키지 할인',
    subtitle: 'Signature Package',
    description: '시그니처 프로그램 2개 이상 동시 진행 시 추가 15% 할인',
    discount: '15%',
    period: '상시 진행',
    tag: 'BEST',
    active: true,
  },
];

export default function PromotionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = params as unknown as { locale: string };
  setRequestLocale(resolvedParams.locale);

  const t = useTranslations();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">Promotion</p>
              <h1 className="text-display text-secondary mb-6">이벤트 & 프로모션</h1>
              <p className="text-h4 text-mono leading-relaxed">
                리브성형외과의 특별한 혜택을 확인해보세요.
                <br />
                더 합리적인 가격으로 프리미엄 시술을 경험하실 수 있습니다.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Active Promotions */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <p className="font-serif text-h3 text-primary mb-4">Current Events</p>
              <h2 className="text-h1 text-secondary">진행 중인 이벤트</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {promotions.filter(p => p.active).map((promo) => (
              <AnimateOnScroll key={promo.id}>
                <Card padding="none" className="overflow-hidden group">
                  <div className="relative">
                    {/* Image */}
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/30 to-secondary/30 relative">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(/images/promotion/${promo.id}.jpg)` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-6xl text-white/40">{promo.discount}</span>
                      </div>

                      {/* Tag */}
                      {promo.tag && (
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-small font-medium ${
                            promo.tag === 'HOT' ? 'bg-red-500 text-white' :
                            promo.tag === 'NEW' ? 'bg-blue-500 text-white' :
                            'bg-primary text-white'
                          }`}>
                            {promo.tag}
                          </span>
                        </div>
                      )}

                      {/* Discount Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white rounded-full px-4 py-2 shadow-lg">
                          <span className="text-h4 text-primary font-medium">{promo.discount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-small text-primary mb-2">{promo.subtitle}</p>
                      <h3 className="text-h3 text-secondary mb-3">{promo.title}</h3>
                      <p className="text-body text-mono mb-4">{promo.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-small text-mono-light">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{promo.period}</span>
                        </div>
                        <ScrollLink href="/contact">
                          <Button variant="outline" size="sm">
                            상담 신청
                          </Button>
                        </ScrollLink>
                      </div>
                    </div>
                  </div>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="py-16 bg-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <Card padding="lg" className="max-w-3xl mx-auto">
              <h3 className="text-h4 text-secondary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                이벤트 유의사항
              </h3>
              <ul className="space-y-2 text-body text-mono">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  이벤트는 사전 예고 없이 변경 또는 종료될 수 있습니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  이벤트 중복 적용은 불가하며, 가장 유리한 혜택이 적용됩니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  자세한 내용은 상담 시 안내받으실 수 있습니다.
                </li>
              </ul>
            </Card>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">놓치지 마세요!</h2>
              <p className="text-h4 opacity-80 mb-8">
                지금 상담 신청하시고 특별한 혜택을 받아보세요.
              </p>
              <ScrollLink href="/contact">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-primary text-white hover:bg-secondary"
                >
                  이벤트 상담 신청
                </Button>
              </ScrollLink>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
