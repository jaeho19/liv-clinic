'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PRICING_FOREIGN } from '@/lib/pricingForeign';
import { isGuideLocale } from '@/lib/guides/types';
import { publishedGuideCount } from '@/lib/guides/publicIndex';

/** 가격 페이지 하단 "외국인 환자 안내"(P1-3). en·ja·zh·zh-TW에서만 렌더. */
export default function InternationalPricingNote() {
  const locale = useLocale();
  if (!isGuideLocale(locale)) return null;
  const copy = PRICING_FOREIGN[locale];
  const showGuides = publishedGuideCount(locale) > 0;

  return (
    <aside className="rounded-2xl border border-border bg-white p-6 md:p-8" aria-labelledby="pricing-intl-heading">
      <h2 id="pricing-intl-heading" className="mb-4 text-h4 text-secondary">
        {copy.heading}
      </h2>
      <ul className="mb-5 space-y-2 text-small leading-relaxed text-mono md:text-body">
        {copy.items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/international"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-primary px-5 py-2 text-small font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {copy.ctaInternational}
        </Link>
        {showGuides && (
          <Link
            href="/guides"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-5 py-2 text-small font-medium text-secondary transition-colors hover:border-primary"
          >
            {copy.ctaGuides}
          </Link>
        )}
      </div>
    </aside>
  );
}
