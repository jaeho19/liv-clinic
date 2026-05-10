'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimateOnScroll } from '@/components/ui';
import BeforeAfterModal from '@/components/sections/BeforeAfterModal';
import type { BeforeAfterRow } from '@/types/admin';
import type { Locale } from '@/i18n/routing';

const PAGE_TEXT: Record<Locale, { eyebrow: string; title: string; subtitle: string; all: string; empty: string; error: string; retry: string }> = {
  ko: {
    eyebrow: 'Before & After',
    title: '전후사진',
    subtitle: '리브성형외과의 시술 전후 사례를 카테고리별로 확인해보세요.',
    all: '전체',
    empty: '등록된 전후사진이 없습니다.',
    error: '전후사진을 불러오는 중 오류가 발생했습니다.',
    retry: '다시 시도',
  },
  en: {
    eyebrow: 'Before & After',
    title: 'Before & After',
    subtitle: 'Explore our before and after cases by category.',
    all: 'All',
    empty: 'No before/after photos yet.',
    error: 'Failed to load before/after photos.',
    retry: 'Retry',
  },
  ja: {
    eyebrow: 'Before & After',
    title: 'ビフォーアフター',
    subtitle: 'カテゴリー別に施術前後の症例をご覧いただけます。',
    all: 'すべて',
    empty: '登録されたビフォーアフター写真がありません。',
    error: 'ビフォーアフター写真の読み込み中にエラーが発生しました。',
    retry: '再試行',
  },
  zh: {
    eyebrow: 'Before & After',
    title: '术前术后',
    subtitle: '按类别查看我们的术前术后案例。',
    all: '全部',
    empty: '暂无术前术后照片。',
    error: '加载术前术后照片时出错。',
    retry: '重试',
  },
};

function pickTitle(row: BeforeAfterRow, locale: Locale): string {
  const map: Record<Locale, string> = {
    ko: row.title_ko,
    en: row.title_en,
    ja: row.title_ja,
    zh: row.title_zh,
  };
  return map[locale] || row.title_ko || '';
}

export default function BeforeAfterPage() {
  const locale = useLocale() as Locale;
  const text = PAGE_TEXT[locale] ?? PAGE_TEXT.ko;

  const [items, setItems] = useState<BeforeAfterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [modalItem, setModalItem] = useState<BeforeAfterRow | null>(null);

  const load = async () => {
    setLoading(true);
    setErrored(false);
    try {
      const res = await fetch('/api/before-after', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed');
      const data: BeforeAfterRow[] = await res.json();
      setItems(data);
    } catch {
      setErrored(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h4 md:text-h3 text-primary mb-2">{text.eyebrow}</p>
              <h1 className="text-h2 md:text-h1 text-secondary mb-4">{text.title}</h1>
              <p className="text-body md:text-h4 text-mono leading-relaxed">{text.subtitle}</p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <section className="py-6 bg-white border-b border-border sticky top-16 z-30">
          <div className="container-custom">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === 'all'
                    ? 'bg-secondary text-white shadow-md'
                    : 'bg-background text-mono hover:text-secondary'
                }`}
              >
                {text.all} ({items.length})
              </button>
              {categories.map((c) => {
                const count = items.filter((i) => i.category === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeCategory === c
                        ? 'bg-secondary text-white shadow-md'
                        : 'bg-background text-mono hover:text-secondary'
                    }`}
                  >
                    {c} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container-custom">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-[2/1] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : errored ? (
            <div className="text-center py-20">
              <p className="text-h4 text-mono-light mb-4">{text.error}</p>
              <button
                onClick={load}
                className="px-6 py-2.5 bg-secondary text-white rounded-full text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                {text.retry}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-h4 text-mono-light">{text.empty}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filtered.map((row) => {
                  const title = pickTitle(row, locale);
                  return (
                    <button
                      key={row.id}
                      onClick={() => setModalItem(row)}
                      className="group text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative w-full aspect-[2/1] bg-[#f6f6f6] overflow-hidden">
                        <Image
                          src={row.image_url}
                          alt={title || row.category}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(min-width: 768px) 50vw, 100vw"
                        />
                      </div>
                      <div className="p-5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-secondary mb-2">
                          {row.category}
                        </span>
                        {title && (
                          <h3 className="text-base font-medium text-secondary truncate">{title}</h3>
                        )}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      <BeforeAfterModal
        open={!!modalItem}
        imageUrl={modalItem?.image_url ?? null}
        title={modalItem ? pickTitle(modalItem, locale) : null}
        category={modalItem?.category ?? null}
        onClose={() => setModalItem(null)}
      />
    </>
  );
}
