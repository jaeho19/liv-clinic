import Link from 'next/link';
import { GUIDE_UI } from '@/lib/guides/ui';
import type { GuideBlock, GuideDoc } from '@/lib/guides/types';
import GuideInline from './GuideInline';

function Block({ block, locale, showMarkers }: { block: GuideBlock; locale: string; showMarkers: boolean }) {
  const inline = (text: string) => <GuideInline text={text} locale={locale} showMarkers={showMarkers} />;
  switch (block.type) {
    case 'h2':
      return (
        <h2 id={block.id} className="mt-12 mb-4 scroll-mt-28 text-h2 text-secondary">
          {inline(block.text)}
        </h2>
      );
    case 'h3':
      return <h3 className="mt-8 mb-3 text-h3 text-secondary">{inline(block.text)}</h3>;
    case 'p':
      return <p className="mb-4 text-body leading-relaxed text-mono">{inline(block.text)}</p>;
    case 'ul':
      return (
        <ul className="mb-5 list-disc space-y-2 pl-6 text-body text-mono">
          {block.items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mb-5 list-decimal space-y-2 pl-6 text-body text-mono">
          {block.items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </ol>
      );
    case 'note':
      return (
        <div className="my-6 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-small leading-relaxed text-secondary">
          {inline(block.text)}
        </div>
      );
    case 'table':
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-small">
            <thead className="bg-background text-left text-secondary">
              <tr>
                {block.header.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-medium">
                    {inline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-border">
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-3 align-top text-mono">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function GuideArticle({ guide }: { guide: GuideDoc }) {
  const ui = GUIDE_UI[guide.locale];
  const isDraft = guide.status !== 'published';
  const toc = guide.blocks.filter((b): b is Extract<GuideBlock, { type: 'h2' }> => b.type === 'h2');
  const prefix = `/${guide.locale}`;
  const byline =
    guide.reviewer === 'dr-kim' ? `${ui.reviewedBy} ${ui.doctorAuthor}` : `${ui.author} ${ui.clinicAuthor}`;

  return (
    <article className="pb-16">
      <header className="bg-gradient-to-b from-primary/10 to-background pt-28 pb-10 md:pt-32 md:pb-14">
        <div className="container-custom max-w-3xl">
          {/* 초안 띠 — 고정 헤더 아래에 보이도록 히어로 안에 둔다(문서 맨 위에 두면 헤더에 가려진다) */}
          {isDraft && (
            <p className="mb-6 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2 text-small text-amber-900">{ui.draftBanner}</p>
          )}
          <nav className="mb-4 text-small text-mono-light" aria-label="Breadcrumb">
            <Link href={`${prefix}/guides`} className="hover:text-primary">
              {ui.guides}
            </Link>
          </nav>
          <p className="mb-3 font-serif text-h4 text-primary">{ui.category[guide.category]}</p>
          <h1 className="mb-4 text-h1 text-secondary md:text-display">{guide.title}</h1>
          <p className="mb-6 text-body leading-relaxed text-mono md:text-h4">{guide.description}</p>
          <p className="text-small text-mono-light">
            {ui.updated} {guide.updated} · {ui.readingTime(guide.readingMinutes)} · {byline}
          </p>
        </div>
      </header>

      <div className="container-custom max-w-3xl">
        {toc.length >= 3 && (
          <nav className="my-8 rounded-2xl border border-border bg-white p-5" aria-label={ui.toc}>
            <p className="mb-3 text-small font-medium text-secondary">{ui.toc}</p>
            <ol className="space-y-1.5 text-small text-mono">
              {toc.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="hover:text-primary">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {guide.blocks.map((b, i) => (
          <Block key={i} block={b} locale={guide.locale} showMarkers={isDraft} />
        ))}

        {guide.faq.length > 0 && (
          <section className="mt-14" aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="mb-6 text-h2 text-secondary">
              {ui.faq}
            </h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-white">
              {guide.faq.map((f, i) => (
                <details key={i} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-body font-medium text-secondary marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-body leading-relaxed text-mono">
                    <GuideInline text={f.a} locale={guide.locale} showMarkers={isDraft} />
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl bg-secondary px-6 py-8 text-white md:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              href={`${prefix}/contact`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-7 py-3 font-medium transition-colors hover:bg-white hover:text-secondary"
            >
              {ui.bookCta}
            </Link>
            <Link
              href={`${prefix}/international`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium transition-colors hover:bg-white/10"
            >
              {ui.international}
            </Link>
            <Link
              href={`${prefix}/pricing`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium transition-colors hover:bg-white/10"
            >
              {ui.pricing}
            </Link>
            {guide.treatment && (
              <Link
                href={`${prefix}${guide.treatment}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium transition-colors hover:bg-white/10"
              >
                {ui.viewTreatment}
              </Link>
            )}
          </div>
        </section>

        <p className="mt-8 text-small leading-relaxed text-mono-light">{ui.disclaimer}</p>
      </div>
    </article>
  );
}
