'use client';

// Design Ref: §5 컴포넌트 / §6 레이아웃 (docs/02-design/features/first-visit-trial-events.design.md)
// 첫방문 1회 체험가 — 카테고리 섹션 + 테이블(divide-y) 레이아웃.
// LIV 토큰 유지(rose primary / Cormorant serif / Pretendard). 이모지 미사용(인라인 SVG).

import { useTranslations } from 'next-intl';
import { AnimateOnScroll, Button, ScrollLink } from '@/components/ui';
import { groupByCategory } from '@/lib/firstVisitTrial';
import { SITE_INFO } from '@/lib/constants';

export default function FirstVisitTrialSection() {
  const t = useTranslations('firstVisit');
  const groups = groupByCategory();

  // 가격 포맷: 숫자(천단위 콤마, 로케일 무관) + i18n 통화 접미사(unit)
  const fmt = (n: number) => `${n.toLocaleString('en-US')}${t('unit')}`;

  return (
    <>
      {/* Hero — 좌정렬 (design-taste anti-center) */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h4 md:text-h3 text-primary mb-2">{t('eyebrow')}</p>
              <h1 className="text-h2 md:text-h1 text-secondary mb-4">{t('title')}</h1>
              <p className="text-body md:text-h4 text-mono leading-relaxed mb-5">{t('subtitle')}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-small font-medium text-primary">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('trialOnceNote')}
              </span>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 카테고리 그룹 + 테이블 */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl space-y-12 md:space-y-16">
            {groups.map((group, gi) => (
              <AnimateOnScroll key={group.category} delay={gi * 0.05}>
                <div>
                  <div className="mb-3 flex items-baseline justify-between border-b-2 border-primary/30 pb-3">
                    <h2 className="text-h3 text-secondary">{t(`categories.${group.category}`)}</h2>
                    <span className="text-small text-mono-light">{group.items.length}</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-4 transition-colors hover:bg-white/50 md:gap-8 md:py-5"
                      >
                        {/* 좌: 시술명 + 설명 (+옵션) */}
                        <div className="min-w-0">
                          <p className="text-body text-secondary font-medium md:text-h4">
                            {t(`items.${item.id}.name`)}
                          </p>
                          <p className="mt-1 text-small text-mono-light leading-relaxed">
                            {t(`items.${item.id}.desc`)}
                          </p>
                          {item.hasOption && (
                            <p className="mt-1.5 text-xs text-primary">{t(`items.${item.id}.option`)}</p>
                          )}
                        </div>

                        {/* 우: 가격 (정가 취소선 + 체험가 + 할인 배지) */}
                        <div className="shrink-0 text-right">
                          {item.originalPrice !== null ? (
                            <>
                              <s className="block text-small text-mono-light" aria-label={t('originalLabel')}>
                                {fmt(item.originalPrice)}
                              </s>
                              <strong className="block text-h4 font-semibold text-secondary">
                                {fmt(item.trialPrice)}
                              </strong>
                              {item.discountRate !== null && (
                                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                  {`-${item.discountRate}%`}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <strong className="block text-h4 font-semibold text-secondary">
                                {fmt(item.trialPrice)}
                              </strong>
                              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                {t('trialBadge')}
                              </span>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer — 의료광고 고지(필수 노출): 부작용 + 부가세 + 1회 적용 */}
      <section className="pb-12 md:pb-16 bg-background">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl rounded-2xl border-l-4 border-primary bg-white p-6 shadow-sm">
            <p className="text-small text-mono leading-relaxed">{t('disclaimer')}</p>
            <p className="mt-2 text-small text-mono-light">
              {t('vatNote')} · {t('trialOnceNote')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h2 md:text-h1 mb-8">{t('cta.title')}</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <ScrollLink href="/contact">
                  <Button variant="primary" size="lg" className="bg-primary text-white hover:bg-primary/90">
                    {t('cta.book')}
                  </Button>
                </ScrollLink>
                <a href={`tel:${SITE_INFO.phone}`}>
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    {SITE_INFO.phone}
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
