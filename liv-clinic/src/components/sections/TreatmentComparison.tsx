'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, ScrollLink } from '@/components/ui';

// Treatment IDs for comparison table
const treatmentIds = ['ulthera', 'thermage', 'onda', 'density', 'shurink', 'inmode', 'thread'];

export default function TreatmentComparison() {
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const t = useTranslations('liftingPage');

  return (
    <section className="section-gap bg-white">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <p className="font-serif text-h3 text-primary mb-4">{t('compare.subtitle')}</p>
            <h2 className="text-h1 text-secondary mb-4">{t('compare.title')}</h2>
            <p className="text-body text-mono-light max-w-2xl mx-auto">
              {t('compare.description')}
            </p>
          </div>
        </AnimateOnScroll>

        {/* Desktop Table */}
        <AnimateOnScroll>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background">
                  <th className="py-4 px-4 text-left text-sm font-medium text-mono-light border-b border-border">{t('compare.table.treatment')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">{t('compare.table.technology')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">{t('compare.table.duration')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">{t('compare.table.anesthesia')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">{t('compare.table.downtime')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">{t('compare.table.results')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border">{t('compare.table.price')}</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-mono-light border-b border-border"></th>
                </tr>
              </thead>
              <tbody>
                {treatmentIds.map((id, index) => (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-background/50 transition-colors"
                  >
                    <td className="py-5 px-4 border-b border-border">
                      <div>
                        <span className="font-medium text-secondary">{t(`treatments.${id}.name`)}</span>
                        <span className="ml-2 text-sm text-mono-light">{t(`treatments.${id}.nameEn`)}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center border-b border-border">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                        {t(`compare.data.${id}.technology`)}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{t(`compare.data.${id}.duration`)}</td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{t(`compare.data.${id}.anesthesia`)}</td>
                    <td className="py-5 px-4 text-center border-b border-border">
                      <span className={t(`compare.data.${id}.recovery`) === t('compare.values.none') ? 'text-green-600' : 'text-mono'}>
                        {t(`compare.data.${id}.recovery`)}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{t(`compare.data.${id}.results`)}</td>
                    <td className="py-5 px-4 text-center text-mono border-b border-border">{t(`compare.data.${id}.price`)}</td>
                    <td className="py-5 px-4 text-center border-b border-border">
                      <Link
                        href={`/lifting/${id}`}
                        className="text-primary hover:text-secondary transition-colors text-sm font-medium"
                      >
                        {t('compare.table.details')}
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimateOnScroll>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {treatmentIds.map((id, index) => (
            <AnimateOnScroll key={id} delay={index * 0.05}>
              <div
                className={`border border-border rounded-xl overflow-hidden transition-all ${
                  selectedTreatment === id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <button
                  onClick={() => setSelectedTreatment(
                    selectedTreatment === id ? null : id
                  )}
                  className="w-full p-4 flex items-center justify-between bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {t(`compare.data.${id}.technology`)}
                    </span>
                    <div className="text-left">
                      <span className="font-medium text-secondary">{t(`treatments.${id}.name`)}</span>
                      <span className="ml-2 text-sm text-mono-light">{t(`treatments.${id}.nameEn`)}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-mono-light transition-transform ${
                      selectedTreatment === id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {selectedTreatment === id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-background/50"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">{t('compare.table.duration')}</span>
                        <span className="text-sm text-mono">{t(`compare.data.${id}.duration`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">{t('compare.table.anesthesia')}</span>
                        <span className="text-sm text-mono">{t(`compare.data.${id}.anesthesia`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">{t('compare.table.downtime')}</span>
                        <span className={`text-sm ${t(`compare.data.${id}.recovery`) === t('compare.values.none') ? 'text-green-600' : 'text-mono'}`}>
                          {t(`compare.data.${id}.recovery`)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">{t('compare.table.results')}</span>
                        <span className="text-sm text-mono">{t(`compare.data.${id}.results`)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-mono-light">{t('compare.table.price')}</span>
                        <span className="text-sm text-mono">{t(`compare.data.${id}.price`)}</span>
                      </div>
                      <div className="pt-2">
                        <Link
                          href={`/lifting/${id}`}
                          className="block w-full text-center py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                        >
                          {t('compare.table.viewDetails')}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll>
          <div className="mt-10 text-center">
            <p className="text-mono-light mb-4">{t('compare.cta.question')}</p>
            <ScrollLink
              href="/contact"
              className="inline-block btn-primary"
            >
              {t('compare.cta.button')}
            </ScrollLink>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
