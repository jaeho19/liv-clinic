import { getTranslations } from 'next-intl/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { buildLocalizedMetadata } from '@/lib/pageMeta';
import {
  localizedWebPageSchema,
  localizedBreadcrumbSchema,
  type CrumbSpec,
} from '@/lib/schemaI18n';
import { generateReviewsAggregateSchema, safeJsonLd } from '@/lib/seo';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ReviewsList from '@/components/reviews/ReviewsList';
import ReviewForm from '@/components/reviews/ReviewForm';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'reviews', '/reviews');
}

async function getPublishedReviews(): Promise<ReviewRow[]> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('reviews page fetch error:', error);
    return [];
  }
  return data ?? [];
}

export default async function ReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reviews' });
  const title = t('hero.title');

  const reviews = await getPublishedReviews();
  // 집계 스키마는 온사이트·게시 후기만으로 산정 (영상 후기 제외)
  const onsitePublished = reviews.filter((review) => review.source === 'onsite');

  const crumbs: CrumbSpec[] = [{ home: true }, { name: title, url: '/reviews' }];

  const [webPageSchema, breadcrumbSchema] = await Promise.all([
    localizedWebPageSchema({
      locale,
      metaKey: 'reviews',
      path: '/reviews',
      type: 'WebPage',
      breadcrumbs: crumbs,
    }),
    localizedBreadcrumbSchema(locale, crumbs),
  ]);

  const aggregateSchema = generateReviewsAggregateSchema(
    onsitePublished.map((review) => ({
      author_name: review.author_name,
      rating: review.rating,
      content: review.content,
      created_at: review.created_at,
    })),
    locale,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      {aggregateSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(aggregateSchema) }}
        />
      )}

      <Breadcrumb items={[{ label: title }]} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background pb-12 pt-6 md:pb-16">
        <div className="container-custom">
          <div className="max-w-3xl">
            <p className="mb-3 font-serif text-h4 text-primary md:text-h3">{t('hero.eyebrow')}</p>
            <h1 className="mb-4 text-h1 text-secondary md:text-display">{t('hero.title')}</h1>
            <p className="text-body leading-relaxed text-mono md:text-h4">{t('hero.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* 후기 목록 */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          <ReviewsList initial={reviews} />
        </div>
      </section>

      {/* 후기 작성 */}
      <section className="section-gap bg-white">
        <div className="container-custom">
          <div className="mx-auto max-w-2xl">
            <ReviewForm />
          </div>
        </div>
      </section>
    </>
  );
}
