import Image from 'next/image';
import Link from 'next/link';
import { guideCardMeta } from '@/lib/guides/byline';
import { GUIDE_IMAGE_SIZE } from '@/lib/guides/images';
import { GUIDE_UI } from '@/lib/guides/ui';
import type { GuideDoc } from '@/lib/guides/types';

export default function GuideCard({ guide }: { guide: GuideDoc }) {
  const ui = GUIDE_UI[guide.locale];
  return (
    <Link
      href={`/${guide.locale}/guides/${guide.slug}`}
      className="block h-full overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-md"
    >
      {guide.cover && (
        <Image
          src={guide.cover}
          alt={guide.coverAlt ?? ''}
          {...GUIDE_IMAGE_SIZE}
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="h-auto w-full"
        />
      )}
      <div className="p-6">
      <p className="mb-2 font-serif text-small text-primary">{ui.category[guide.category]}</p>
      <h2 className="mb-3 text-h4 text-secondary">{guide.title}</h2>
      <p className="mb-4 line-clamp-3 text-small leading-relaxed text-mono">{guide.description}</p>
      <p className="text-small text-mono-light">{guideCardMeta(guide)}</p>
      </div>
    </Link>
  );
}
