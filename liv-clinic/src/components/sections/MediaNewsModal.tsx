'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { MediaNewsItem } from '@/lib/data/mediaNewsData';

interface MediaNewsModalProps {
  open: boolean;
  item: MediaNewsItem | null;
  onClose: () => void;
}

const badgeStyles: Record<'press' | 'news', string> = {
  press: 'bg-secondary/10 text-secondary',
  news: 'bg-primary/10 text-primary',
};

export default function MediaNewsModal({ open, item, onClose }: MediaNewsModalProps) {
  const tCommon = useTranslations('common');
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    // SSR-safe portal mount guard (BeforeAfterModal과 동일 패턴)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Escape 닫기 + 스크롤 락 + 포커스 관리(초기 포커스/복원)
  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 초기 포커스를 닫기 버튼으로
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
      window.clearTimeout(focusTimer);
      // 닫힐 때 트리거(카드 버튼)로 포커스 복원
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const titleId = 'media-news-modal-title';

  return createPortal(
    <AnimatePresence>
      {open && item && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="bg-black/70"
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />

          {/* Centered container */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
              width: 'min(92vw, 36rem)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-2xl bg-white p-7 md:p-9 shadow-2xl"
            >
              <button
                ref={closeBtnRef}
                onClick={onClose}
                aria-label={tCommon('close')}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-mono-light transition-colors hover:bg-background hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* 메타 */}
              <div className="mb-4 flex flex-wrap items-center gap-2 pr-10">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.15em] ${badgeStyles[item.type]}`}>
                  {item.badge}
                </span>
                <span className="text-xs text-mono-light">{item.year}</span>
                {item.source && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-mono-light/50" />
                    <span className="text-xs text-mono-light">{item.source}</span>
                  </>
                )}
              </div>

              {/* 제목 */}
              <h3 id={titleId} className="mb-4 text-h3 text-secondary">
                {item.title}
              </h3>

              {/* 전체 설명 */}
              <p className="text-body leading-relaxed text-mono whitespace-pre-line">
                {item.description}
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
