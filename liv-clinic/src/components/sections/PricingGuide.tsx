'use client';

import { useTranslations } from 'next-intl';
import { AnimateOnScroll } from '@/components/ui';
import { PRICING_GUIDE, PRICING_GUIDE_NOTE_KEYS } from '@/lib/pricingGuide';
import InternationalPricingNote from './InternationalPricingNote';

/**
 * 정식 가격표 페이지 본문.
 * 표 스타일은 기존 `PriceTable`(src/components/ui/PriceTable.tsx)을 차용해 톤을 맞춘다.
 * 정렬은 RTL(ar) 대응을 위해 논리 속성(text-start/text-end)을 사용한다.
 */
export default function PricingGuide() {
  const t = useTranslations('pricingGuide');

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <AnimateOnScroll>
              <p className="font-serif text-h3 text-primary mb-3">Pricing</p>
              <h1 className="hero-title text-h1 text-secondary mb-6">{t('hero.title')}</h1>
              <p className="main-description text-body text-mono leading-relaxed">
                {t('hero.description')}
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 카테고리별 가격표 */}
      <section className="section-gap-md">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">
            {PRICING_GUIDE.map((category) => (
              <AnimateOnScroll key={category.id}>
                <div>
                  <h2 className="text-h3 text-secondary mb-4 md:mb-5">
                    {t(`categories.${category.id}`)}
                  </h2>

                  <div className="overflow-x-auto rounded-2xl shadow-sm border border-border bg-white">
                    <table className="w-full border-collapse text-start">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th scope="col" className="px-4 py-4 text-small md:text-body font-medium text-start">
                            {t('tableHeader.treatment')}
                          </th>
                          <th scope="col" className="px-4 py-4 text-small md:text-body font-medium text-start">
                            {t('tableHeader.basis')}
                          </th>
                          <th scope="col" className="px-4 py-4 text-small md:text-body font-medium text-end">
                            {t('tableHeader.price')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.rows.map((rowId) => (
                          <tr
                            key={rowId}
                            className="border-t border-border hover:bg-background/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-mono text-small md:text-body font-medium">
                              {t(`rows.${category.id}.${rowId}.name`)}
                            </td>
                            <td className="px-4 py-3 text-mono-light text-small md:text-body">
                              {t(`rows.${category.id}.${rowId}.basis`)}
                            </td>
                            <td className="px-4 py-3 text-end text-secondary text-small md:text-body font-medium whitespace-nowrap">
                              {t(`rows.${category.id}.${rowId}.price`)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}

            {/* 외국인 환자 안내 (P1-3) — en·ja·zh·zh-TW에서만 렌더 */}
            <InternationalPricingNote />

            {/* 하단 공통 안내문 */}
            <AnimateOnScroll>
              <div className="space-y-2">
                {PRICING_GUIDE_NOTE_KEYS.map((key) => (
                  <p key={key} className="text-small text-mono-light leading-relaxed">
                    {t(`notes.${key}`)}
                  </p>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </main>
  );
}
