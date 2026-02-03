'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimateOnScroll, Card, ScrollLink } from '@/components/ui';

const galleryItems = [
  { id: 1, category: 'lifting', title: '울쎄라피 프라임 리프팅', description: '처진 턱선 개선' },
  { id: 2, category: 'lifting', title: '써마지 FLX', description: '전체적인 탄력 개선' },
  { id: 3, category: 'antiaging', title: '보톡스', description: '이마 주름 개선' },
  { id: 4, category: 'antiaging', title: '필러', description: '볼륨 복원' },
  { id: 5, category: 'skin', title: '클래리티 II', description: '색소 침착 개선' },
  { id: 6, category: 'lifting', title: '실리프팅', description: '턱선 리프팅' },
  { id: 7, category: 'antiaging', title: '스킨부스터', description: '피부 보습 개선' },
  { id: 8, category: 'skin', title: '루카스 레이저', description: '피부결 개선' },
];

const categories = [
  { id: 'all', label: '전체', labelEn: 'All' },
  { id: 'lifting', label: '리프팅', labelEn: 'Lifting' },
  { id: 'antiaging', label: '안티에이징', labelEn: 'Anti-aging' },
  { id: 'skin', label: '스킨/레이저', labelEn: 'Skin/Laser' },
];

export default function GalleryPage() {
  const t = useTranslations('common');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return galleryItems;
    return galleryItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="max-w-3xl">
              <p className="font-serif text-h3 text-primary mb-4">Gallery</p>
              <h1 className="text-display text-secondary mb-6">시술 갤러리</h1>
              <p className="text-h4 text-mono leading-relaxed">
                리브성형외과의 시술 사례를 확인해보세요.
                <br />
                자연스럽고 아름다운 변화를 경험하실 수 있습니다.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Notice + Filter */}
      <section className="py-6 bg-white border-b border-border sticky top-20 z-30">
        <div className="container-custom">
          {/* Notice */}
          <div className="bg-primary/10 rounded-xl p-4 text-center mb-6">
            <p className="text-body text-mono">
              <span className="text-primary font-medium">안내:</span> 모든 시술 사례는 환자분의 동의 하에 게시되었으며,
              개인에 따라 결과가 다를 수 있습니다.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-small font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-background text-mono hover:bg-primary/10'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-gap bg-background">
        <div className="container-custom">
          {/* Result Count */}
          <AnimateOnScroll>
            <div className="text-center mb-8">
              <p className="text-body text-mono-light">
                총 <span className="text-primary font-medium">{filteredItems.length}</span>개의 사례
              </p>
            </div>
          </AnimateOnScroll>

          {/* Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card padding="none" className="overflow-hidden group cursor-pointer h-full">
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(/images/gallery/${item.id}.jpg)` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-4xl text-white/30">
                          {item.title.charAt(0)}
                        </span>
                      </div>
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.category === 'lifting'
                            ? 'bg-blue-500/90 text-white'
                            : item.category === 'antiaging'
                            ? 'bg-pink-500/90 text-white'
                            : 'bg-green-500/90 text-white'
                        }`}>
                          {categories.find(c => c.id === item.category)?.label}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <div className="text-white">
                          <p className="text-h4 mb-1">{item.title}</p>
                          <p className="text-small opacity-80">{item.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-small text-primary mb-1">{item.title}</p>
                      <p className="text-body text-mono">{item.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-mono-light/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-h4 text-mono-light mb-2">해당 카테고리에 사례가 없습니다</p>
              <p className="text-body text-mono-light">다른 카테고리를 선택해 주세요</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary text-white">
        <div className="container-custom">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-h1 mb-4">나도 이런 변화를 경험하고 싶다면?</h2>
              <p className="text-h4 opacity-80 mb-8">
                전문 상담을 통해 나에게 맞는 시술을 찾아보세요.
              </p>
              <ScrollLink href="/contact">
                <button className="bg-primary text-white hover:bg-primary/90 px-8 py-4 rounded-full font-medium transition-colors">
                  무료 상담 신청
                </button>
              </ScrollLink>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
