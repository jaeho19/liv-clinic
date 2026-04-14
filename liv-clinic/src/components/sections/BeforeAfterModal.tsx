'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeAfterModalProps {
  open: boolean;
  imageUrl: string | null;
  title: string | null;
  category: string | null;
  onClose: () => void;
}

export default function BeforeAfterModal({ open, imageUrl, title, category, onClose }: BeforeAfterModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="닫기"
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/90 text-[#6d4e42] hover:bg-white flex items-center justify-center transition-colors z-10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* 2:1 aspect image. Width targets ~90vw OR 2x of max-allowed-height,
               whichever is smaller — so on wide monitors the image grows to ~90% width,
               and on short viewports it still fits within ~80% of the viewport height. */}
            <div
              className="relative bg-black/20 rounded-sm overflow-hidden"
              style={{
                width: 'min(90vw, calc(80vh * 2))',
                aspectRatio: '2 / 1',
              }}
            >
              <Image
                src={imageUrl}
                alt={title || category || 'Before and After'}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            {(category || title) && (
              <div className="mt-3 text-center text-white">
                {category && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs bg-white/15 backdrop-blur-sm mr-2">
                    {category}
                  </span>
                )}
                {title && <span className="text-sm opacity-90">{title}</span>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
