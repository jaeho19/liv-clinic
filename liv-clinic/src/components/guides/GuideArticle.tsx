import Image from 'next/image';
import Link from 'next/link';
import { GUIDE_IMAGE_SIZE } from '@/lib/guides/images';
import { GUIDE_UI } from '@/lib/guides/ui';
import { guideMetaLine } from '@/lib/guides/byline';
import { COLUMN_LOCALE, isGuideLocale, type GuideBlock, type GuideDoc } from '@/lib/guides/types';
import GuideCoverVideo from './GuideCoverVideo';
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
    case 'image':
      return (
        // 글자가 든 그림이라 원본(1600px)의 절반쯤인 820px로 묶는다 — 글 칸(1120px)에 꽉 채우면 고해상도 화면에서 흐려진다
        <figure className="mx-auto my-8 max-w-[820px]">
          <Image
            src={block.src}
            alt={block.alt}
            {...GUIDE_IMAGE_SIZE}
            sizes="(min-width: 900px) 820px, 100vw"
            className="h-auto w-full rounded-2xl border border-border bg-white"
          />
          {block.caption && <figcaption className="mt-3 text-center text-small text-mono-light">{block.caption}</figcaption>}
        </figure>
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
          {/* 한국어 칼럼: 원장 이름만(수정일·읽는 시간은 적지 않는다), 이름은 의료진 소개로 잇는다. 외국인 가이드: 수정일 · 읽는 시간 · 저자 */}
          <p className="text-small text-mono-light">
            {guide.locale === COLUMN_LOCALE ? (
              <>
                {ui.author}{' '}
                <Link href={`${prefix}/about/staff`} rel="author" className="underline-offset-4 hover:text-primary hover:underline">
                  {ui.doctorAuthor}
                </Link>
              </>
            ) : (
              guideMetaLine(guide)
            )}
          </p>
        </div>
      </header>

      <div className="container-custom max-w-3xl">
        {/* 대표 사진 — 글 머리 바로 아래. 화면에서 가장 큰 그림이라 먼저 받는다(priority).
            글 칸은 데스크톱에서 1120px(.container-custom)이라 16:9 그대로면 높이 630px로 본문을 밀어낸다 → md부터 21:9 띠로 자른다.
            움직이는 버전(coverVideo)이 있으면 사진 위에 얹는다 — 사진은 그대로 남아 먼저 보인다. */}
        {guide.cover && (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl md:aspect-[21/9]">
            <Image
              src={guide.cover}
              alt={guide.coverAlt ?? ''}
              {...GUIDE_IMAGE_SIZE}
              priority
              sizes="(min-width: 1200px) 1120px, 100vw"
              className="h-full w-full object-cover"
            />
            {guide.coverVideo && <GuideCoverVideo src={guide.coverVideo} />}
          </div>
        )}
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
            {/* 국제환자 안내는 외국인 가이드에만 — 한국어 칼럼에는 내지 않는다 */}
            {isGuideLocale(guide.locale) && (
              <Link
                href={`${prefix}/international`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium transition-colors hover:bg-white/10"
              >
                {ui.international}
              </Link>
            )}
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
