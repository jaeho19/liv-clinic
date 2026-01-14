'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpandableListProps<T> {
  items: T[];
  initialCount?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  expandText?: string;
  collapseText?: string;
}

/**
 * 초기 N개만 표시하고 "더보기" 버튼으로 확장하는 리스트
 * FAQ, 특징 목록 등에서 사용
 */
export default function ExpandableList<T>({
  items,
  initialCount = 3,
  renderItem,
  className = '',
  expandText = '더보기',
  collapseText = '접기',
}: ExpandableListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleItems = isExpanded ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;

  return (
    <div className={className}>
      <AnimatePresence mode="sync">
        {visibleItems.map((item, index) => (
          <motion.div
            key={index}
            initial={index >= initialCount ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors mx-auto"
        >
          <span>{isExpanded ? collapseText : expandText}</span>
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
      )}
    </div>
  );
}
