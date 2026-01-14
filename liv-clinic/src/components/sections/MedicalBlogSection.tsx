'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AnimateOnScroll, StaggerChildren, StaggerItem, Button } from '@/components/ui';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: 'lifting' | 'antiaging' | 'laser' | 'general';
  date: string;
  link: string;
  thumbnail: string;
}

const NAVER_BLOG_URL = 'https://blog.naver.com/liv_clinic';

// 인기 블로그 포스트 (조회수 상위 4개)
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: '리브성형외과 김수영 대표원장 APTOS 학회 초청',
    excerpt: 'APTOS 학회 초청으로 확인된 글로벌 리프팅 기준',
    category: 'lifting',
    date: '2025.01.03',
    link: 'https://blog.naver.com/PostView.naver?blogId=liv_clinic&logNo=224077541004',
    thumbnail: '/images/blog/aptos-conference.jpg',
  },
  {
    id: '2',
    title: '알쏭달쏭한 스킨부스터, 뭐가 나한테 맞을까?',
    excerpt: '2탄: 리쥬란 (PN, Polynucleotide) 스킨부스터 완벽 가이드',
    category: 'antiaging',
    date: '2024.12.20',
    link: 'https://blog.naver.com/PostView.naver?blogId=liv_clinic&logNo=224017294128',
    thumbnail: '/images/blog/skinbooster-rejuran.png',
  },
  {
    id: '3',
    title: '신사역 쥬베룩볼륨 추천대상과 효과',
    excerpt: '쥬베룩볼륨이 궁금하다면? 추천 대상과 효과 총정리',
    category: 'antiaging',
    date: '2024.11.15',
    link: 'https://blog.naver.com/PostView.naver?blogId=liv_clinic&logNo=223895871239',
    thumbnail: '/images/blog/juvelook-volume.png',
  },
  {
    id: '4',
    title: '결혼식 전 많이 받는 피부 시술 총정리',
    excerpt: '웨딩 전 피부 관리, 어떤 시술이 효과적일까요?',
    category: 'general',
    date: '2024.12.15',
    link: 'https://blog.naver.com/PostView.naver?blogId=liv_clinic&logNo=224002926123',
    thumbnail: '/images/blog/wedding-skincare.png',
  },
];

const categoryLabels: Record<string, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  laser: '레이저',
  general: '일반',
};

const categoryColors: Record<string, string> = {
  lifting: '#b4988d',
  antiaging: '#8b6b5d',
  laser: '#6d5a4d',
  general: '#a89080',
};

function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[16/10] bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        {/* 썸네일 */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {imageError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl opacity-50">N</span>
            </div>
          ) : (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          )}
          {/* 카테고리 태그 */}
          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: categoryColors[post.category] }}
          >
            {categoryLabels[post.category]}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4">
          <p className="text-xs text-mono-light mb-2">{post.date}</p>
          <h4 className="font-medium text-secondary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h4>
          <p className="text-sm text-mono-light line-clamp-2">{post.excerpt}</p>
        </div>
      </div>
    </motion.a>
  );
}

export default function MedicalBlogSection() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        {/* 섹션 헤더 */}
        <AnimateOnScroll>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              {/* 네이버 블로그 아이콘 */}
              <div className="w-10 h-10 rounded-full bg-[#03C75A] flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h3 className="font-serif text-xl text-secondary">관련 블로그 포스트</h3>
                <p className="text-sm text-mono-light">더 자세한 의료 정보를 확인하세요</p>
              </div>
            </div>

            {/* 더보기 버튼 (데스크톱) */}
            <a
              href={NAVER_BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-[#03C75A] hover:underline font-medium"
            >
              네이버 블로그 방문
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </AnimateOnScroll>

        {/* 블로그 카드 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogPosts.map((post) => (
              <StaggerItem key={post.id}>
                <BlogCard post={post} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}

        {/* 더보기 버튼 (모바일) */}
        <div className="mt-8 text-center md:hidden">
          <a
            href={NAVER_BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="border-[#03C75A] text-[#03C75A] hover:bg-[#03C75A] hover:text-white"
            >
              네이버 블로그 더보기
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
