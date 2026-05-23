'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { MediaNewsItem, FeaturedMediaCard } from '@/lib/data/mediaNewsData';

interface MediaNewsCardProps {
  item: MediaNewsItem | FeaturedMediaCard;
  /** 제공 시 내부 소식 클릭 → 모달 (아카이브). 미제공 시 내부 소식은 /media로 이동 (메인) */
  onSelect?: (item: MediaNewsItem) => void;
  index?: number;
}

// press/news 은은한 색·라벨 구분 (브라운 톤 vs 더스티 로즈 톤)
const badgeStyles: Record<'press' | 'news', string> = {
  press: 'bg-secondary/10 text-secondary',
  news: 'bg-primary/10 text-primary',
};

const cardClass =
  'group flex h-full flex-col rounded-2xl border border-border bg-white p-6 text-left transition-shadow duration-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

function CardBody({
  item,
  ctaLabel,
}: {
  item: MediaNewsItem | FeaturedMediaCard;
  ctaLabel: string;
}) {
  return (
    <>
      {/* 메타: badge + year + source */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${badgeStyles[item.type]}`}
        >
          {item.badge}
        </span>
        <span className="text-xs text-mono-light">{item.year}</span>
        {'source' in item && item.source && (
          <>
            <span className="h-1 w-1 rounded-full bg-mono-light/50" />
            <span className="text-xs text-mono-light">{item.source}</span>
          </>
        )}
      </div>

      {/* 제목 */}
      <h3 className="mb-2 line-clamp-2 text-h4 text-secondary transition-colors group-hover:text-primary">
        {item.title}
      </h3>

      {/* 설명 */}
      <p className="mb-6 line-clamp-3 text-small leading-relaxed text-mono-light">
        {item.description}
      </p>

      {/* CTA */}
      <div className="mt-auto flex items-center gap-2 text-small font-medium text-primary transition-all group-hover:gap-3">
        <span>{ctaLabel}</span>
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </>
  );
}

export default function MediaNewsCard({ item, onSelect, index = 0 }: MediaNewsCardProps) {
  const t = useTranslations('mediaNews');
  const isExternal = item.isExternal === true;
  const ctaLabel = isExternal ? t('readArticle') : t('readMore');

  const motionProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay: Math.min(index * 0.06, 0.3) },
    whileHover: { y: -6 },
  } as const;

  // 외부 기사 → 새 탭 anchor
  if (isExternal && item.link) {
    return (
      <motion.a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
        {...motionProps}
      >
        <CardBody item={item} ctaLabel={ctaLabel} />
      </motion.a>
    );
  }

  // 내부 소식 + onSelect → 모달 (아카이브)
  if (onSelect && 'category' in item) {
    const newsItem = item;
    return (
      <motion.button
        type="button"
        onClick={() => onSelect(newsItem)}
        className={cardClass}
        {...motionProps}
      >
        <CardBody item={item} ctaLabel={ctaLabel} />
      </motion.button>
    );
  }

  // 내부 소식 (메인) → /media 이동 (newsId 있으면 상세 모달 자동 오픈)
  const mediaHref =
    'newsId' in item && item.newsId
      ? { pathname: '/media', query: { news: item.newsId } }
      : { pathname: '/media' };
  return (
    <Link href={mediaHref} className="block h-full focus:outline-none">
      <motion.div className={cardClass} {...motionProps}>
        <CardBody item={item} ctaLabel={ctaLabel} />
      </motion.div>
    </Link>
  );
}
