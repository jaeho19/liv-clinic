'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimateOnScroll } from '@/components/ui';
import MediaNewsCard from '@/components/sections/MediaNewsCard';
import MediaNewsFilter from '@/components/sections/MediaNewsFilter';
import MediaNewsModal from '@/components/sections/MediaNewsModal';
import {
  mediaNewsData,
  MEDIA_YEARS,
  filterByCategory,
  getItemsByYear,
  type MediaCategory,
  type MediaNewsItem,
} from '@/lib/data/mediaNewsData';

type FilterValue = MediaCategory | 'all';

export default function MediaPage() {
  const t = useTranslations('mediaNews');
  const [active, setActive] = useState<FilterValue>('all');
  const [selected, setSelected] = useState<MediaNewsItem | null>(null);

  const filtered = useMemo(() => filterByCategory(mediaNewsData, active), [active]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="mb-2 font-serif text-h4 text-primary md:text-h3">{t('page.title')}</p>
              <h1 className="mb-4 text-h2 text-secondary md:text-h1">{t('page.subtitle')}</h1>
              <p className="text-body leading-relaxed text-mono">{t('page.description')}</p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Filter */}
      <MediaNewsFilter active={active} onChange={setActive} />

      {/* Year groups */}
      <section className="bg-background py-12 md:py-20">
        <div className="container-custom">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <svg className="mx-auto mb-4 h-16 w-16 text-mono-light/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-h4 text-mono-light">{t('empty')}</p>
            </div>
          ) : (
            MEDIA_YEARS.map((year) => {
              const yearItems = getItemsByYear(filtered, year);
              if (yearItems.length === 0) return null;
              return (
                <div key={year} className="mb-16 last:mb-0">
                  <div className="mb-8 flex items-center gap-4">
                    <h2 className="font-serif text-h2 text-secondary">{year}</h2>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {yearItems.map((item, i) => (
                      <MediaNewsCard key={item.id} item={item} index={i} onSelect={setSelected} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal (내부 소식) */}
      <MediaNewsModal open={!!selected} item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
