'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface CollapsibleSectionProps {
  items: CollapsibleItem[];
  className?: string;
  allowMultiple?: boolean;
  variant?: 'default' | 'card' | 'minimal';
}

/**
 * 펼치기/접기 아코디언 섹션
 * Treatment Info + Target + Cautions 통합에 사용
 */
export default function CollapsibleSection({
  items,
  className = '',
  allowMultiple = false,
  variant = 'default',
}: CollapsibleSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.defaultOpen).map((item) => item.id))
  );

  // useCallback으로 메모이제이션 - 불필요한 리렌더 방지 (Vercel Best Practice)
  const toggleItem = useCallback((id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  }, [allowMultiple]);

  const getItemStyles = () => {
    switch (variant) {
      case 'card':
        return 'bg-white rounded-xl shadow-sm mb-3 overflow-hidden';
      case 'minimal':
        return 'border-b border-gray-200';
      default:
        return 'bg-gray-50 rounded-lg mb-2 overflow-hidden';
    }
  };

  const getHeaderStyles = (isOpen: boolean) => {
    switch (variant) {
      case 'card':
        return `p-4 ${isOpen ? 'bg-primary/5' : ''}`;
      case 'minimal':
        return 'py-4';
      default:
        return `p-4 ${isOpen ? 'bg-gray-100' : ''}`;
    }
  };

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id} className={getItemStyles()}>
            <button
              onClick={() => toggleItem(item.id)}
              className={`
                w-full flex items-center justify-between text-left transition-colors
                ${getHeaderStyles(isOpen)}
              `}
            >
              <span className="font-medium text-secondary">{item.title}</span>
              <motion.svg
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 text-gray-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={variant === 'minimal' ? 'pb-4' : 'px-4 pb-4'}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
