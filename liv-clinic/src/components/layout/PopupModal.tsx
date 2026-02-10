'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PopupRow } from '@/types/admin';

interface PopupModalProps {
  popups: PopupRow[];
  onClose: () => void;
  onDismissToday: () => void;
}

const AUTO_INTERVAL = 2500;
const RESUME_DELAY = 5000;
const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: 'tween' as const, duration: 0.3, ease: 'easeInOut' as const },
  opacity: { duration: 0.2 },
};

export default function PopupModal({ popups, onClose, onDismissToday }: PopupModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  const currentPopup = popups[currentIndex];
  const isMultiple = popups.length > 1;

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (!isMultiple) return;
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % popups.length);
    }, AUTO_INTERVAL);
  }, [isMultiple, popups.length, stopAutoPlay]);

  const pauseAndResume = useCallback(() => {
    stopAutoPlay();
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      startAutoPlay();
    }, RESUME_DELAY);
  }, [stopAutoPlay, startAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      stopAutoPlay();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [startAutoPlay, stopAutoPlay]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    pauseAndResume();
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % popups.length);
    pauseAndResume();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + popups.length) % popups.length);
    pauseAndResume();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleImageClick = () => {
    if (currentPopup.link_url) {
      window.open(currentPopup.link_url, currentPopup.link_target || '_self');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-start justify-start p-3 sm:p-4 pt-4 sm:pt-6 pl-3 sm:pl-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl overflow-hidden flex flex-col shadow-lg"
          style={{
            maxWidth: `min(${currentPopup.width || 400}px, 88vw)`,
            maxHeight: '85dvh',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => isMultiple && stopAutoPlay()}
          onMouseLeave={() => isMultiple && !isPaused && startAutoPlay()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors cursor-pointer text-xs"
            aria-label="닫기"
          >
            ✕
          </button>

          {/* Slide image area */}
          <div
            className="relative overflow-hidden min-h-0"
            onTouchStart={isMultiple ? handleTouchStart : undefined}
            onTouchEnd={isMultiple ? handleTouchEnd : undefined}
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                {currentPopup.image_url && (
                  <div
                    className={currentPopup.link_url ? 'cursor-pointer' : ''}
                    onClick={handleImageClick}
                  >
                    <img
                      src={currentPopup.image_url}
                      alt={currentPopup.title}
                      className="w-full h-auto block"
                      draggable={false}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Arrow buttons (only when multiple) */}
            {isMultiple && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer text-lg"
                  aria-label="이전"
                >
                  ‹
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer text-lg"
                  aria-label="다음"
                >
                  ›
                </button>
              </>
            )}

            {/* Dot indicators (only when multiple) */}
            {isMultiple && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {popups.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`rounded-full transition-all duration-200 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-6 h-2 bg-white'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`슬라이드 ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex justify-between items-center px-3 py-2 bg-black/60 backdrop-blur-sm text-xs text-white/80 shrink-0">
            <button
              onClick={onDismissToday}
              className="hover:text-white transition-colors cursor-pointer"
            >
              오늘 하루 보지 않기
            </button>
            <button
              onClick={onClose}
              className="hover:text-white transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
