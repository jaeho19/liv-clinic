'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
  subtitle?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
  className?: string;
  compact?: boolean;
}

/**
 * 표준화된 섹션 헤더 컴포넌트
 * 모든 Detail 페이지에서 일관된 헤더 스타일 적용
 */
export default function SectionHeader({
  subtitle,
  title,
  description,
  align = 'center',
  theme = 'light',
  className = '',
  compact = false,
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left';
  const subtitleColor = theme === 'dark' ? 'text-[#D4AF37]' : 'text-primary';
  const titleColor = theme === 'dark' ? 'text-white' : 'text-secondary';
  const descColor = theme === 'dark' ? 'text-white/70' : 'text-gray-600';
  const marginBottom = compact ? 'mb-6' : 'mb-8 md:mb-12';

  return (
    <div className={`${alignClass} ${marginBottom} ${className}`}>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`text-sm uppercase tracking-widest ${subtitleColor} mb-2`}
        >
          {subtitle}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`text-2xl md:text-3xl lg:text-4xl font-medium ${titleColor}`}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`mt-4 text-base md:text-lg ${descColor} max-w-2xl ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

/**
 * 골드 액센트 라인
 */
export function GoldAccent({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-12 h-px bg-gradient-to-r from-[#D4AF37] to-[#F4E4BC] ${className}`}
    />
  );
}
