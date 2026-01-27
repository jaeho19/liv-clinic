'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AnimateOnScroll, StaggerChildren, StaggerItem } from '@/components/ui';
import { SOCIAL_LINKS } from '@/lib/constants';

interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  thumbnail_url?: string; // 비디오 썸네일
}

// 플레이스홀더 포스트 (API 실패시 사용)
const placeholderPosts: InstagramPost[] = [
  { id: '1', media_type: 'IMAGE', media_url: '', permalink: SOCIAL_LINKS.instagram, caption: 'Lifting Treatment', timestamp: '' },
  { id: '2', media_type: 'IMAGE', media_url: '', permalink: SOCIAL_LINKS.instagram, caption: 'Anti-aging Care', timestamp: '' },
  { id: '3', media_type: 'IMAGE', media_url: '', permalink: SOCIAL_LINKS.instagram, caption: 'Before & After', timestamp: '' },
  { id: '4', media_type: 'IMAGE', media_url: '', permalink: SOCIAL_LINKS.instagram, caption: 'Clinic Daily', timestamp: '' },
  { id: '5', media_type: 'IMAGE', media_url: '', permalink: SOCIAL_LINKS.instagram, caption: 'Skin Care', timestamp: '' },
  { id: '6', media_type: 'IMAGE', media_url: '', permalink: SOCIAL_LINKS.instagram, caption: 'Natural Beauty', timestamp: '' },
];

// 카테고리별 그라데이션 패턴 (플레이스홀더용)
const gradients = [
  'from-primary via-primary/80 to-secondary',
  'from-[#c4a99a] via-[#b4988d] to-[#8b6b5d]',
  'from-secondary via-[#7d5e52] to-[#5d4438]',
  'from-[#a89080] via-[#9a8577] to-[#6d5a4d]',
  'from-[#d4c4b8] via-[#b4988d] to-[#7d5e52]',
  'from-primary/90 via-secondary/70 to-[#5d4438]',
];

// 카테고리별 아이콘
const icons = [
  // Lifting
  <svg key="lifting" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>,
  // Anti-aging
  <svg key="antiaging" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>,
  // B&A
  <svg key="ba" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>,
  // Daily
  <svg key="daily" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>,
  // Skin
  <svg key="skin" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>,
  // Natural
  <svg key="natural" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>,
];

// 스켈레톤 로딩 컴포넌트
function PostSkeleton() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-mono-light/10 animate-pulse aspect-square">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="h-4 bg-mono-light/20 rounded w-3/4" />
        <div className="h-3 bg-mono-light/15 rounded w-1/2" />
      </div>
    </div>
  );
}

// Instagram 포스트 카드 컴포넌트
function PostCard({ post, index, isLoading }: { post: InstagramPost; index: number; isLoading: boolean }) {
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasMedia = post.media_url && !imageError;
  const isVideo = post.media_type === 'VIDEO';

  if (isLoading) {
    return <PostSkeleton />;
  }

  return (
    <motion.a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative rounded-2xl overflow-hidden group cursor-pointer aspect-square"
      whileHover={{ scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onMouseEnter={() => isVideo && setIsPlaying(true)}
      onMouseLeave={() => isVideo && setIsPlaying(false)}
    >
      {/* 배경: 이미지/비디오 또는 브랜드 그라데이션 플레이스홀더 */}
      <div className="absolute inset-0">
        {hasMedia ? (
          isVideo ? (
            // 비디오 표시
            <div className="absolute inset-0">
              {/* 비디오 썸네일 (호버 전) */}
              {post.thumbnail_url && !isPlaying && (
                <Image
                  src={post.thumbnail_url}
                  alt={post.caption?.slice(0, 100) || 'Instagram video'}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              )}
              {/* 비디오 (호버 시 자동 재생) */}
              <video
                src={post.media_url}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                muted
                loop
                playsInline
                autoPlay={isPlaying}
                onError={() => setImageError(true)}
              />
              {/* 비디오 아이콘 */}
              {!isPlaying && (
                <div className="absolute top-3 left-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            // 이미지 표시
            <Image
              src={post.media_url}
              alt={post.caption?.slice(0, 100) || 'Instagram post'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          )
        ) : (
          // 세련된 플레이스홀더 디자인
          <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`}>
            {/* 패턴 오버레이 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
                                  radial-gradient(circle at 40% 80%, rgba(255,255,255,0.15) 0%, transparent 30%)`
              }} />
            </div>

            {/* 중앙 아이콘 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
              {icons[index % icons.length]}
              <span className="text-xs mt-2 uppercase tracking-wider font-medium">
                {post.caption?.slice(0, 15) || 'LIV'}
              </span>
            </div>

            {/* 코너 장식 */}
            <div className="absolute top-3 right-3 w-8 h-8 border border-white/20 rounded-lg" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border border-white/15 rounded-full" />
          </div>
        )}
      </div>

      {/* 캐러셀 아이콘 */}
      {post.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="7" y="7" width="18" height="18" rx="2" />
          </svg>
        </div>
      )}

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        {/* 캡션 표시 */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-white text-sm line-clamp-2">
            {post.caption?.slice(0, 80) || '자세히 보기'}
            {post.caption && post.caption.length > 80 && '...'}
          </p>
        </div>

        {/* Instagram 아이콘 */}
        <div className="absolute top-4 right-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.a>
  );
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(6); // 초기 6개 표시

  // 더보기 클릭 핸들러
  const handleShowMore = () => {
    setDisplayCount(12);
  };

  useEffect(() => {
    async function fetchInstagramPosts() {
      try {
        const response = await fetch('/api/instagram');
        const data = await response.json();

        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
        } else {
          // API 실패시 플레이스홀더 사용
          setPosts(placeholderPosts);
          if (data.error) {
            setError(data.error);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Instagram posts:', err);
        setPosts(placeholderPosts);
        setError('피드를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInstagramPosts();
  }, []);

  return (
    <section className="section-gap bg-background overflow-hidden">
      <div className="container-custom">
        <AnimateOnScroll animation="fadeInUpSmooth">
          <div className="text-center mb-12">
            {/* Instagram 로고 스타일 헤더 */}
            <motion.div
              className="inline-flex items-center gap-3 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <p className="font-serif text-h3 text-primary">Instagram</p>
            </motion.div>
            <motion.h2
              className="text-h1 text-secondary mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
              @liv_clinic
            </motion.h2>
            <motion.p
              className="text-body text-mono-light max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            >
              리브성형외과의 일상과 시술 정보를 확인해보세요.
            </motion.p>
          </div>
        </AnimateOnScroll>

        {/* 그리드 (3열 x 2행 on desktop, 2열 x 3행 on mobile) */}
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" staggerDelay={0.08}>
          {(posts.length > 0 ? posts : placeholderPosts).slice(0, displayCount).map((post, index) => (
            <StaggerItem key={post.id} variant="scale">
              <PostCard post={post} index={index} isLoading={isLoading} />
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* 더보기 버튼 (6개 이상 포스트가 있고, 아직 6개만 표시 중일 때) */}
        {posts.length > 6 && displayCount === 6 && (
          <AnimateOnScroll>
            <div className="mt-8 text-center">
              <motion.button
                onClick={handleShowMore}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary/30 text-primary rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-medium">더보기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </div>
          </AnimateOnScroll>
        )}

        {/* Follow 버튼 */}
        <AnimateOnScroll>
          <div className="mt-12 text-center">
            <motion.a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-full hover:shadow-lg hover:shadow-[#FD1D1D]/25 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="font-medium">Instagram 팔로우</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </motion.a>

            {/* 통계 정보 - 모바일 반응형 */}
            <div className="mt-6 flex items-center justify-center gap-4 sm:gap-8 text-mono-light">
              <div className="text-center">
                <p className="text-base sm:text-h4 text-secondary font-medium">2.5K+</p>
                <p className="text-xs sm:text-small">팔로워</p>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="text-center">
                <p className="text-base sm:text-h4 text-secondary font-medium">500+</p>
                <p className="text-xs sm:text-small">게시물</p>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="text-center">
                <p className="text-base sm:text-h4 text-secondary font-medium">Daily</p>
                <p className="text-xs sm:text-small">업데이트</p>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
