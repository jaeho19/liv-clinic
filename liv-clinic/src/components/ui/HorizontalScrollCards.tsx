'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HorizontalScrollCardsProps {
  children: React.ReactNode;
  className?: string;
  cardWidth?: string;
  gap?: string;
  showScrollbar?: boolean;
}

/**
 * 모바일에서 가로 스크롤, 데스크톱에서 그리드로 표시되는 카드 컨테이너
 */
export default function HorizontalScrollCards({
  children,
  className = '',
  cardWidth = 'w-[min(280px,75vw)]',
  gap = 'gap-4',
  showScrollbar = false,
}: HorizontalScrollCardsProps) {
  return (
    <div
      className={`
        flex overflow-x-auto ${gap} -mx-4 px-4 pb-4
        sm:-mx-6 sm:px-6
        md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0
        ${showScrollbar ? '' : 'scrollbar-hide'}
        scroll-snap-x-mandatory
        ${className}
      `}
      role="region"
      aria-label="Scrollable content"
    >
      {React.Children.map(children, (child) => (
        <div className={`flex-shrink-0 ${cardWidth} md:w-auto scroll-snap-center`}>
          {child}
        </div>
      ))}
    </div>
  );
}

interface ScrollCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollCard({ children, className = '' }: ScrollCardProps) {
  return (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-sm h-full ${className}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
