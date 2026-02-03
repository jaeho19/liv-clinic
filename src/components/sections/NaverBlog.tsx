'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button } from '@/components/ui';
import { SOCIAL_LINKS } from '@/lib/constants';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: 'lifting' | 'antiaging' | 'skincare' | 'news' | 'qna';
  date: string;
  link: string;
  thumbnail: string;
  readTime: number;
  views: number;
}

// 카테고리 설정
const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  lifting: { label: '리프팅', color: 'text-primary', bgColor: 'bg-primary/10' },
  antiaging: { label: '안티에이징', color: 'text-[#8b6b5d]', bgColor: 'bg-[#8b6b5d]/10' },
  skincare: { label: '스킨케어', color: 'text-[#6d5a4d]', bgColor: 'bg-[#6d5a4d]/10' },
  news: { label: '클리닉 소식', color: 'text-secondary', bgColor: 'bg-secondary/10' },
  qna: { label: 'Q&A', color: 'text-[#a89080]', bgColor: 'bg-[#a89080]/10' },
};

// 실제 네이버 블로그 RSS/API 연동 시 데이터 교체
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: '울쎄라피 프라임 시술 전 알아두면 좋은 점',
    excerpt: '울쎄라피 프라임 시술을 고려하고 계신다면 먼저 알아두시면 좋은 정보들을 정리해 보았습니다. 시술 원리부터 주의사항까지 상세히 알려드립니다.',
    category: 'lifting',
    date: '2024.12.20',
    link: SOCIAL_LINKS.naver,
    thumbnail: '/images/blog/ulthera-guide.jpg',
    readTime: 5,
    views: 1234,
  },
  {
    id: '2',
    title: '써마지 FLX와 울쎄라피 프라임, 어떤 차이가 있을까요?',
    excerpt: '두 시술의 원리와 효과, 그리고 어떤 분께 더 적합한지 비교해 드립니다. 본인에게 맞는 시술을 선택하세요.',
    category: 'lifting',
    date: '2024.12.15',
    link: SOCIAL_LINKS.naver,
    thumbnail: '/images/blog/thermage-vs-ulthera.jpg',
    readTime: 7,
    views: 2156,
  },
  {
    id: '3',
    title: '보톡스 시술 후 관리법',
    excerpt: '보톡스 시술 후 효과를 오래 유지하기 위한 관리 팁을 알려드립니다. 일상생활에서 주의할 점들을 확인하세요.',
    category: 'antiaging',
    date: '2024.12.10',
    link: SOCIAL_LINKS.naver,
    thumbnail: '/images/blog/botox-care.jpg',
    readTime: 4,
    views: 987,
  },
  {
    id: '4',
    title: '겨울철 피부 관리, 이것만은 꼭!',
    excerpt: '건조한 겨울철, 피부 건강을 지키기 위한 필수 관리법을 알려드립니다. 전문의가 추천하는 홈케어 팁.',
    category: 'skincare',
    date: '2024.12.05',
    link: SOCIAL_LINKS.naver,
    thumbnail: '/images/blog/winter-skincare.jpg',
    readTime: 6,
    views: 1567,
  },
  {
    id: '5',
    title: '리브성형외과 12월 이벤트 안내',
    excerpt: '연말을 맞아 준비한 특별 프로모션! 울쎄라피 프라임, 써마지 시술 할인 및 신규 고객 혜택을 확인하세요.',
    category: 'news',
    date: '2024.12.01',
    link: SOCIAL_LINKS.naver,
    thumbnail: '/images/blog/december-event.jpg',
    readTime: 3,
    views: 3421,
  },
  {
    id: '6',
    title: '필러 시술, 자주 묻는 질문 TOP 10',
    excerpt: '필러 시술에 대해 고객님들이 가장 많이 궁금해하시는 질문들을 모아 답변드립니다.',
    category: 'qna',
    date: '2024.11.28',
    link: SOCIAL_LINKS.naver,
    thumbnail: '/images/blog/filler-faq.jpg',
    readTime: 8,
    views: 2789,
  },
];

// 스켈레톤 로딩 컴포넌트
function BlogCardSkeleton({ isFeatured = false }: { isFeatured?: boolean }) {
  if (isFeatured) {
    return (
      <div className="bg-background rounded-3xl overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="aspect-[4/3] lg:aspect-auto bg-mono-light/10" />
          <div className="p-8 space-y-4">
            <div className="h-6 bg-mono-light/10 rounded-full w-24" />
            <div className="h-8 bg-mono-light/15 rounded w-full" />
            <div className="h-8 bg-mono-light/15 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-mono-light/10 rounded w-full" />
              <div className="h-4 bg-mono-light/10 rounded w-5/6" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="h-4 bg-mono-light/10 rounded w-20" />
              <div className="h-4 bg-mono-light/10 rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-mono-light/10" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-mono-light/10 rounded-full w-20" />
        <div className="h-5 bg-mono-light/15 rounded w-full" />
        <div className="h-5 bg-mono-light/15 rounded w-2/3" />
        <div className="h-4 bg-mono-light/10 rounded w-full" />
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-mono-light/10 rounded w-16" />
          <div className="h-3 bg-mono-light/10 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// Featured 카드 컴포넌트 (큰 카드)
function FeaturedBlogCard({ post, isLoading }: { post: BlogPost; isLoading: boolean }) {
  const [imageError, setImageError] = useState(true);
  const config = categoryConfig[post.category];

  if (isLoading) {
    return <BlogCardSkeleton isFeatured />;
  }

  return (
    <motion.a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-background rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-500"
      whileHover={{ y: -8 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 썸네일 */}
        <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
          {!imageError ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/40 flex items-center justify-center">
              <div className="text-center text-white/70">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="font-serif text-lg">Featured Article</p>
              </div>
            </div>
          )}
          {/* 카테고리 오버레이 */}
          <div className="absolute top-4 left-4">
            <span className={`px-4 py-2 ${config.bgColor} ${config.color} text-sm font-medium rounded-full backdrop-blur-sm bg-white/80`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-mono-light text-small mb-4">
            <span>{post.date}</span>
            <span className="w-1 h-1 rounded-full bg-mono-light" />
            <span>{post.readTime}분 읽기</span>
            <span className="w-1 h-1 rounded-full bg-mono-light" />
            <span>조회 {post.views.toLocaleString()}</span>
          </div>

          <h3 className="text-h2 text-secondary mb-4 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          <p className="text-body text-mono-light mb-6 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-4 transition-all">
            <span>자세히 읽기</span>
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

// 일반 카드 컴포넌트
function BlogCard({ post, isLoading }: { post: BlogPost; isLoading: boolean }) {
  const [imageError, setImageError] = useState(true);
  const config = categoryConfig[post.category];

  if (isLoading) {
    return <BlogCardSkeleton />;
  }

  return (
    <motion.a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-background rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300"
      whileHover={{ y: -6 }}
    >
      {/* 썸네일 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {!imageError ? (
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 right-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </div>

        {/* 읽기 시간 뱃지 */}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
          {post.readTime}분
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-5">
        {/* 카테고리 */}
        <span className={`inline-block px-3 py-1 ${config.bgColor} ${config.color} text-xs font-medium rounded-full mb-3`}>
          {config.label}
        </span>

        {/* 제목 */}
        <h3 className="text-h4 text-secondary mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {post.title}
        </h3>

        {/* 요약 */}
        <p className="text-small text-mono-light mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-xs text-mono-light">
          <span>{post.date}</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.a>
  );
}

export default function NaverBlog() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // 시뮬레이션된 로딩 (실제 API 연동 시 제거)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // 카테고리별 필터링
  const filteredPosts = activeCategory === 'all'
    ? blogPosts
    : blogPosts.filter(post => post.category === activeCategory);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1, 5);

  return (
    <section className="section-gap bg-white overflow-hidden">
      <div className="container-custom">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            {/* 네이버 블로그 로고 스타일 헤더 */}
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#03C75A] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                </svg>
              </div>
              <p className="font-serif text-h3 text-primary">Blog</p>
            </div>
            <h2 className="text-h1 text-secondary mb-4">의료 정보 & 소식</h2>
            <p className="text-body text-mono-light max-w-2xl mx-auto">
              리브성형외과의 최신 소식과 유용한 의료 정보를 확인해보세요.
            </p>
          </div>
        </AnimateOnScroll>

        {/* 카테고리 필터 */}
        <AnimateOnScroll>
          <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-secondary text-white'
                  : 'bg-background text-mono hover:bg-primary/10 hover:text-primary'
              }`}
            >
              전체
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === key
                    ? 'bg-secondary text-white'
                    : `bg-background text-mono hover:${config.bgColor} hover:${config.color}`
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Featured Post */}
        {featuredPost && (
          <AnimateOnScroll>
            <div className="mb-8">
              <FeaturedBlogCard post={featuredPost} isLoading={isLoading} />
            </div>
          </AnimateOnScroll>
        )}

        {/* Regular Posts Grid */}
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {regularPosts.map((post) => (
            <StaggerItem key={post.id}>
              <BlogCard post={post} isLoading={isLoading} />
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* 통계 및 더보기 버튼 */}
        <AnimateOnScroll>
          <div className="mt-12 text-center">
            <motion.a
              href={SOCIAL_LINKS.naver}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#03C75A] text-white rounded-full hover:bg-[#02b351] hover:shadow-lg hover:shadow-[#03C75A]/25 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              <span className="font-medium">네이버 블로그 더보기</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </motion.a>

            {/* 통계 정보 */}
            <div className="mt-6 flex items-center justify-center gap-8 text-mono-light">
              <div className="text-center">
                <p className="text-h4 text-secondary font-medium">150+</p>
                <p className="text-small">게시글</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-h4 text-secondary font-medium">50K+</p>
                <p className="text-small">누적 조회수</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-h4 text-secondary font-medium">Weekly</p>
                <p className="text-small">업데이트</p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
