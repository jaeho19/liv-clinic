import Link from 'next/link';
import { GUIDE_UI } from '@/lib/guides/ui';
import type { GuideDoc } from '@/lib/guides/types';

export default function GuideCard({ guide }: { guide: GuideDoc }) {
  const ui = GUIDE_UI[guide.locale];
  return (
    <Link
      href={`/${guide.locale}/guides/${guide.slug}`}
      className="block h-full rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
    >
      <p className="mb-2 font-serif text-small text-primary">{ui.category[guide.category]}</p>
      <h2 className="mb-3 text-h4 text-secondary">{guide.title}</h2>
      <p className="mb-4 line-clamp-3 text-small leading-relaxed text-mono">{guide.description}</p>
      <p className="text-small text-mono-light">
        {ui.updated} {guide.updated} · {ui.readingTime(guide.readingMinutes)}
      </p>
    </Link>
  );
}
