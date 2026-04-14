'use client';

import { useTranslations } from 'next-intl';
import AnimateOnScroll from './AnimateOnScroll';
import { PRICING, type PriceSuffix } from '@/lib/pricing';

interface PriceTableProps {
  treatmentId: string;
}

export default function PriceTable({ treatmentId }: PriceTableProps) {
  const t = useTranslations('pricing');
  const data = PRICING[treatmentId];

  if (!data) return null;

  const formatPrice = (price: string | null, suffix?: PriceSuffix) => {
    if (price === null) return t('consultRequired');
    const suffixKey = suffix ?? 'starting';
    return `${price}${t(`suffix.${suffixKey}`)}`;
  };

  return (
    <section className="section-gap-md bg-background">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <AnimateOnScroll>
            <div className="text-center mb-10 md:mb-12">
              <p className="font-serif text-h3 text-primary mb-2">Pricing</p>
              <h2 className="text-h2 text-secondary">{t('sectionTitle')}</h2>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.1}>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-border bg-white">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-primary text-white">
                    <th scope="col" className="px-4 py-4 text-small md:text-body font-medium">
                      {t('header.treatment')}
                    </th>
                    <th scope="col" className="px-4 py-4 text-small md:text-body font-medium">
                      {t('header.option')}
                    </th>
                    <th scope="col" className="px-4 py-4 text-small md:text-body font-medium text-right">
                      {t('header.price')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((group, groupIdx) =>
                    group.rows.map((row, rowIdx) => (
                      <tr
                        key={`${groupIdx}-${rowIdx}`}
                        className="border-t border-border hover:bg-background/50 transition-colors"
                      >
                        {rowIdx === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className="px-4 py-3 align-middle text-mono text-small md:text-body font-medium border-r border-border bg-background/30"
                          >
                            <div>{t(`labels.${treatmentId}.${group.groupKey}`)}</div>
                            {group.subKey && (
                              <small className="block text-xs text-mono-light mt-1">
                                {t(`labels.${treatmentId}.${group.subKey}`)}
                              </small>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-mono text-small md:text-body">
                          {t(`labels.${treatmentId}.${row.rowKey}`)}
                        </td>
                        <td className="px-4 py-3 text-right text-secondary text-small md:text-body font-medium whitespace-nowrap">
                          {formatPrice(row.price, row.suffix)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-small text-mono-light mt-6 text-center">{t('note')}</p>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
