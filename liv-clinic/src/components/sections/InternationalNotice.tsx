'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FOREIGN_COMMON, getTreatmentForeignInfo, type TreatmentForeignId } from '@/lib/treatmentsForeign';
import { isGuideLocale } from '@/lib/guides/types';
import { isGuidePublished } from '@/lib/guides/publicIndex';

/**
 * 시술 상세의 "외국인 환자 안내" 블록(P1-2). en·ja·zh·zh-TW에서만 렌더하고 그 외 로케일은 null.
 * 내용은 사이트에 이미 있는 사실(동일 가격·소요 시간·당일/재방문·통역·결제)만 — src/lib/treatmentsForeign.ts.
 */
export default function InternationalNotice({ treatmentId }: { treatmentId: TreatmentForeignId }) {
  const locale = useLocale();
  if (!isGuideLocale(locale)) return null;
  const info = getTreatmentForeignInfo(treatmentId, locale);
  if (!info) return null;
  const c = FOREIGN_COMMON[locale];
  const guideHref = info.guideSlug && isGuidePublished(locale, info.guideSlug) ? `/guides/${info.guideSlug}` : null;
  const cells = [
    { title: c.price, body: c.priceDesc },
    { title: c.time, body: `${info.duration} · ${info.stay}` },
    { title: c.language, body: c.languageDesc },
    { title: c.payment, body: c.paymentDesc },
  ];

  return (
    <section className="section-gap-sm bg-white" aria-labelledby="intl-notice-heading">
      <div className="container-custom">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-background p-6 md:p-10">
          <p className="mb-2 font-serif text-h4 text-primary">{c.eyebrow}</p>
          <h2 id="intl-notice-heading" className="mb-6 text-h2 text-secondary">
            {c.heading} · {info.name}
          </h2>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cells.map((cell) => (
              <div key={cell.title} className="rounded-2xl bg-white p-5">
                <dt className="mb-1 text-small font-medium text-secondary">{cell.title}</dt>
                <dd className="text-small leading-relaxed text-mono">{cell.body}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 divide-y divide-border rounded-2xl bg-white">
            {info.faqs.map((f) => (
              <details key={f.q} className="px-5 py-4">
                <summary className="cursor-pointer list-none text-small font-medium text-secondary">{f.q}</summary>
                <p className="mt-2 text-small leading-relaxed text-mono">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-secondary"
            >
              {c.ctaBook}
            </Link>
            <Link
              href="/international"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {c.ctaInternational}
            </Link>
            {guideHref && (
              <Link
                href={guideHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border px-6 py-3 font-medium text-secondary transition-colors hover:border-primary"
              >
                {c.ctaGuide}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
