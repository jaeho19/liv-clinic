'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AnimateOnScroll, Button, ScrollLink } from '@/components/ui';
import { featuredMediaNews } from '@/lib/data/mediaNewsData';
import MediaNewsCard from './MediaNewsCard';

export default function MediaNewsSection() {
  const t = useTranslations('mediaNews');
  const sectionRef = useRef<HTMLElement>(null);

  // 다른 페이지에서 `/{locale}#media-news`로 진입한 경우, 이 섹션(동적 임포트)이
  // 마운트되는 시점에 직접 스크롤한다. Next.js 기본 해시 스크롤은 해당 청크가
  // 늦게 로드되면 대상 요소를 찾지 못해 동작하지 않을 수 있기 때문이다.
  useEffect(() => {
    if (window.location.hash !== '#media-news') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section ref={sectionRef} id="media-news" className="section-gap bg-background scroll-mt-24">
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
            <MediaNewsCard key={card.id} item={card} index={index} priority={index < 3} />
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
