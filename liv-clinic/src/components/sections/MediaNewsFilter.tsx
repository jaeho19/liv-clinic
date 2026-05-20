'use client';

import { useTranslations } from 'next-intl';
import type { MediaCategory } from '@/lib/data/mediaNewsData';

type FilterValue = MediaCategory | 'all';

interface MediaNewsFilterProps {
  active: FilterValue;
  onChange: (next: FilterValue) => void;
}

const FILTER_KEYS: FilterValue[] = ['all', 'press', 'news', 'academic_global', 'visit'];

export default function MediaNewsFilter({ active, onChange }: MediaNewsFilterProps) {
  const t = useTranslations('mediaNews.filters');

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-white">
      <div className="container-custom">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-4 scrollbar-hide md:mx-0 md:px-0">
          {FILTER_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active === key}
              className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active === key
                  ? 'bg-secondary text-white'
                  : 'bg-background text-mono hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
