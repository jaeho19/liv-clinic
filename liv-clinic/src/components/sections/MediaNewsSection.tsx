'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, ScrollLink } from '@/components/ui';
import { featuredMediaNews } from '@/lib/data/mediaNewsData';
import MediaNewsCard from './MediaNewsCard';

export default function MediaNewsSection() {
  const t = useTranslations('mediaNews');

  return (
    <section className="section-gap bg-background">
      <div className="container-custom">
        {/* Header */}
        <AnimateOnScroll>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 font-serif text-lg text-primary md:text-h3">{t('label')}</p>
            <h2 className="mb-6 text-2xl text-secondary md:text-h1">{t('title')}</h2>
            <p className="text-body leading-relaxed text-mono-light">{t('description')}</p>
            <p className="mt-3 text-body leading-relaxed text-mono-light">{t('description2')}</p>
          </div>
        </AnimateOnScroll>

        {/* Featured cards (6) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredMediaNews.map((card, index) => (
            <MediaNewsCard key={card.id} item={card} index={index} />
          ))}
        </div>

        {/* CTA */}
        <AnimateOnScroll>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link href="/media">
              <Button variant="primary" size="lg">
                {t('viewAll')}
              </Button>
            </Link>
            <ScrollLink href="/contact">
              <Button variant="outline" size="lg">
                {t('reservation')}
              </Button>
            </ScrollLink>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
