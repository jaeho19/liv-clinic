import { getTranslations } from 'next-intl/server';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll } from '@/components/ui';
import { GOOGLE_BUSINESS_URL } from '@/lib/constants';
import ClickTracker from '@/components/analytics/ClickTracker';
import StarRating from '@/components/reviews/StarRating';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];

// 홈은 최고 트래픽 페이지다. DB 조회를 unstable_cache로 감싸 매 요청마다 Supabase를
// 때리지 않게 하고(정적 렌더 유지), /reviews 페이지와 동일하게 1시간 주기로만 갱신한다.
// (모더레이션 특성상 홈 소셜프루프의 즉시 반영은 불필요 — 최대 1시간 지연 허용.)
const getTopReviews = unstable_cache(
  async (): Promise<ReviewRow[]> => {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('ReviewsSection fetch error:', error);
      return [];
    }
    return data ?? [];
  },
  ['home-top-reviews'],
  { revalidate: 3600, tags: ['reviews'] },
);

/**
 * 홈 소셜프루프 블록: 최신 게시 후기 3개.
 * 게시 후기가 0건이어도 섹션은 유지한다 — Google 리뷰 링크(외부 신뢰 신호)와
 * 후기 작성 CTA는 자체 후기가 쌓이기 전 단계에서 오히려 더 중요하다.
 */
export default async function ReviewsSection() {
  const reviews = await getTopReviews();

  const t = await getTranslations('reviews');

  const labelFor = (key: string) =>
    t.has(`form.treatmentOptions.${key}`) ? t(`form.treatmentOptions.${key}`) : key;

  return (
    <section className="section-gap bg-background">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 font-serif text-lg text-primary md:text-h3">{t('footerLabel')}</p>
            <h2 className="mb-4 text-2xl text-secondary md:text-h1">{t('hero.title')}</h2>
            <p className="text-body leading-relaxed text-mono-light">{t('hero.subtitle')}</p>
          </div>
        </AnimateOnScroll>

        {reviews.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-6"
            >
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

              <p className="line-clamp-5 flex-1 whitespace-pre-line text-body leading-relaxed text-mono">
                {review.content}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-small font-medium text-secondary">{review.author_name}</span>
                {review.country && <span className="text-xs text-mono-light">· {review.country}</span>}
              </div>

              <span className="mt-3 inline-block w-fit rounded-full border border-border bg-white px-2.5 py-1 text-xs text-mono-light">
                {labelFor(review.treatment_category)}
              </span>
            </article>
          ))}
        </div>
        )}

        <div className={`flex flex-col items-center gap-4 ${reviews.length > 0 ? 'mt-12' : 'mt-2'}`}>
          <ClickTracker type="review" id="write_cta">
            <Link
              href="/reviews"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-8 py-3.5 font-medium text-white transition-colors hover:bg-secondary"
            >
              {t('writeCta')}
            </Link>
          </ClickTracker>
          {GOOGLE_BUSINESS_URL && (
            <ClickTracker type="review" id="google_reviews">
              <a
                href={GOOGLE_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-mono-light underline transition-colors hover:text-primary"
              >
                {t('googleReviews')}
              </a>
            </ClickTracker>
          )}
        </div>
      </div>
    </section>
  );
}
