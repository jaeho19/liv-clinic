'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Database } from '@/types/supabase';
import StarRating from './StarRating';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];

const PAGE_SIZE = 12;
const ALL = '__all__';

/** YouTube watch?v= / youtu.be/ / embed/ 형태에서 11자 videoId를 추출. 실패 시 null. */
function parseYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** 클릭 전까지 YouTube JS를 로드하지 않는 라이트 임베드 (썸네일 → iframe 교체). */
function VideoEmbed({
  url,
  playLabel,
  videoBadge,
}: {
  url: string;
  playLabel: string;
  videoBadge: string;
}) {
  const [playing, setPlaying] = useState(false);
  const id = parseYouTubeId(url);
  if (!id) return null;

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={videoBadge}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={playLabel}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* 라이트 임베드: next/image 대신 순수 img 썸네일 (remotePatterns 변경 회피) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 transition group-hover:bg-primary">
          <svg className="ml-1 h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
      <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">
        {videoBadge}
      </span>
    </button>
  );
}

function ReviewCard({
  review,
  label,
  locale,
  t,
}: {
  review: ReviewRow;
  label: string;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const date = (() => {
    try {
      return new Date(review.created_at).toLocaleDateString(locale);
    } catch {
      return new Date(review.created_at).toLocaleDateString('en');
    }
  })();

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <StarRating rating={review.rating} size="sm" />
        {review.is_verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
            {t('verifiedBadge')}
          </span>
        )}
      </div>

      {review.source === 'video' && review.video_url && (
        <div className="mb-4">
          <VideoEmbed
            url={review.video_url}
            playLabel={t('playVideo')}
            videoBadge={t('videoBadge')}
          />
        </div>
      )}

      <p className="flex-1 whitespace-pre-line text-body leading-relaxed text-mono">
        {review.content}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-small font-medium text-secondary">{review.author_name}</span>
        {review.country && <span className="text-xs text-mono-light">· {review.country}</span>}
        <span className="text-xs text-mono-light">· {date}</span>
      </div>

      <span className="mt-3 inline-block w-fit rounded-full border border-border bg-background px-2.5 py-1 text-xs text-mono-light">
        {label}
      </span>
    </article>
  );
}

/** 게시된 후기 목록: 카테고리 탭 필터 + 요약 + 페이지네이션(Load more). */
export default function ReviewsList({ initial }: { initial: ReviewRow[] }) {
  const t = useTranslations('reviews');
  const locale = useLocale();

  const [items, setItems] = useState<ReviewRow[]>(initial);
  const [category, setCategory] = useState<string>(ALL);
  const [offset, setOffset] = useState<number>(initial.length);
  const [exhausted, setExhausted] = useState<boolean>(initial.length < PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  // 탭 목록은 초기(서버 렌더) 세트에서 도출 — 안정적으로 유지
  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const review of initial) seen.add(review.treatment_category);
    return Array.from(seen);
  }, [initial]);

  const labelFor = (key: string) =>
    t.has(`form.treatmentOptions.${key}`) ? t(`form.treatmentOptions.${key}`) : key;

  const average =
    items.length > 0
      ? (items.reduce((sum, review) => sum + review.rating, 0) / items.length).toFixed(1)
      : '0.0';

  async function fetchPage(params: URLSearchParams): Promise<ReviewRow[]> {
    const res = await fetch(`/api/reviews?${params.toString()}`);
    if (!res.ok) throw new Error('fetch failed');
    return (await res.json()) as ReviewRow[];
  }

  async function selectCategory(next: string) {
    if (next === category || loading) return;
    setCategory(next);

    // "전체"는 서버에서 이미 렌더된 초기 세트로 복원 (불필요한 재요청 회피)
    if (next === ALL) {
      setItems(initial);
      setOffset(initial.length);
      setExhausted(initial.length < PAGE_SIZE);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0', category: next });
      const page = await fetchPage(params);
      setItems(page);
      setOffset(page.length);
      setExhausted(page.length < PAGE_SIZE);
    } catch (error) {
      console.error('reviews category fetch failed:', error);
      setItems([]);
      setExhausted(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loading || exhausted) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (category !== ALL) params.set('category', category);
      const page = await fetchPage(params);
      setItems((prev) => [...prev, ...page]);
      setOffset((prev) => prev + page.length);
      if (page.length < PAGE_SIZE) setExhausted(true);
    } catch (error) {
      console.error('reviews load-more failed:', error);
      setExhausted(true);
    } finally {
      setLoading(false);
    }
  }

  const tabBase =
    'inline-flex min-h-[44px] items-center rounded-full border px-4 text-small transition-colors';

  return (
    <div>
      {/* 요약 (항목이 있을 때만) */}
      {items.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-h3 font-medium text-secondary">{average}</span>
          <StarRating rating={Number(average)} size="md" />
          <span className="text-small text-mono-light">{t('summary', { count: items.length })}</span>
        </div>
      )}

      {/* 카테고리 탭 */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory(ALL)}
            className={`${tabBase} ${
              category === ALL
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-white text-mono hover:border-primary hover:text-primary'
            }`}
          >
            {t('filterAll')}
          </button>
          {categories.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectCategory(key)}
              className={`${tabBase} ${
                category === key
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-mono hover:border-primary hover:text-primary'
              }`}
            >
              {labelFor(key)}
            </button>
          ))}
        </div>
      )}

      {/* 목록 / 빈 상태 */}
      {items.length === 0 ? (
        <p className="py-16 text-center text-body text-mono-light">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              label={labelFor(review.treatment_category)}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      )}

      {/* 더 보기 */}
      {!exhausted && items.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-primary px-8 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
