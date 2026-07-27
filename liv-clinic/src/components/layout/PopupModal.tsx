'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import type { PopupRow } from '@/types/admin';
import { LOCALES, type Locale } from '@/i18n/routing';
import { pickLocalized } from '@/lib/i18nFallback';

interface PopupModalProps {
  popups: PopupRow[];
  onClose: () => void;
  onDismissToday: () => void;
}

const DEFAULT_INTERVAL_MS = 5000;
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

/**
 * 팝업 행 → 언어별 이미지 소스 맵.
 * PopupManager의 노출 게이팅과 PopupModal의 렌더가 같은 소스를 보도록 한 곳에 둔다.
 */
export function popupImageSources(popup: PopupRow) {
  return {
    ko: popup.image_url,
    en: popup.image_url_en,
    ja: popup.image_url_ja,
    zh: popup.image_url_zh,
  };
}

/** 경로의 첫 세그먼트가 로케일이면 현재 로케일로 교체한다 (아니면 원본 그대로). */
function replaceLocaleSegment(pathname: string, locale: Locale): string {
  const segments = pathname.split('/');
  const first = segments[1];
  if (!first || !(LOCALES as readonly string[]).includes(first)) return pathname;
  return segments.map((segment, index) => (index === 1 ? locale : segment)).join('/');
}

/**
 * 팝업 link_url을 현재 로케일로 재작성한다.
 *
 * 어드민에 저장된 링크는 `/ko/...` 또는 `https://liv-clinic.net/ko/...`처럼 한국어
 * 경로로 굳어 있어서, 외국어 방문자가 팝업을 누르면 한국어 사이트로 떨어진다.
 * DB는 그대로 두고 클릭 시점에만 첫 경로 세그먼트를 현재 로케일로 바꾼다.
 *
 *   - `/ko/events/x`                        (ja) → `/ja/events/x`
 *   - `https://<현재 origin>/ko/events/x`   (ja) → `https://<현재 origin>/ja/events/x`
 *   - 외부 도메인 · 로케일 세그먼트 없는 경로 · mailto:/tel:/#앵커 → 원본 그대로
 *
 * @param origin 비교 기준 origin (미지정 시 window.location.origin, SSR이면 재작성 안 함)
 */
export function localizePopupHref(rawUrl: string, locale: Locale, origin?: string): string {
  const url = rawUrl?.trim();
  if (!url) return rawUrl;

  // 루트 상대 경로 (`//host` = 프로토콜 상대 URL은 외부로 간주)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return replaceLocaleSegment(url, locale);
  }

  // 절대 URL은 same-origin일 때만 내부 링크로 간주한다.
  const currentOrigin =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  if (!currentOrigin) return rawUrl;

  try {
    const parsed = new URL(url);
    if (parsed.origin !== currentOrigin) return rawUrl;
    return (
      parsed.origin +
      replaceLocaleSegment(parsed.pathname, locale) +
      parsed.search +
      parsed.hash
    );
  } catch {
    // mailto:, tel:, #anchor, 상대 경로 등 → 손대지 않는다
    return rawUrl;
  }
}

export default function PopupModal({ popups, onClose, onDismissToday }: PopupModalProps) {
  const tCommon = useTranslations('common');
  const tPopup = useTranslations('popup');
  const locale = useLocale() as Locale;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  const currentPopup = popups[currentIndex];
  const isMultiple = popups.length > 1;
  const popupImageSrc =
    pickLocalized(popupImageSources(currentPopup), locale) || currentPopup.image_url;

  const pauseAndResume = useCallback(() => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, RESUME_DELAY);
  }, []);

  useEffect(() => {
    if (!isMultiple || isPaused) return;
    const intervalMs = popups[currentIndex]?.rolling_interval_ms || DEFAULT_INTERVAL_MS;
    autoPlayRef.current = setTimeout(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % popups.length);
    }, intervalMs);
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [currentIndex, isMultiple, isPaused, popups]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

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
      const href = localizePopupHref(currentPopup.link_url, locale);
      window.open(href, currentPopup.link_target || '_self');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        // pointer-events-none: 투명 전체화면 컨테이너가 아래 페이지(헤더 언어 전환 등)의
        // 클릭을 삼키지 않게 통과시킨다. 닫기는 카드 내부 ✕/오늘 하루 보지 않기 버튼으로만.
        className="pointer-events-none fixed inset-0 z-[9999] flex items-start justify-start p-3 sm:p-4 pt-4 sm:pt-6 ps-3 sm:ps-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto relative rounded-2xl overflow-hidden flex flex-col shadow-lg"
          style={{
            maxWidth: `min(${currentPopup.width || 400}px, 88vw)`,
            maxHeight: '85dvh',
          }}
          onMouseEnter={() => isMultiple && setIsPaused(true)}
          onMouseLeave={() => {
            if (!isMultiple) return;
            if (resumeTimerRef.current) {
              clearTimeout(resumeTimerRef.current);
              resumeTimerRef.current = null;
            }
            setIsPaused(false);
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors cursor-pointer text-xs"
            aria-label={tCommon('close')}
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
                {popupImageSrc && (
                  <div
                    className={currentPopup.link_url ? 'cursor-pointer' : ''}
                    onClick={handleImageClick}
                  >
                    <img
                      src={popupImageSrc}
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
                  aria-label={tCommon('previous')}
                >
                  ‹
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer text-lg"
                  aria-label={tCommon('next')}
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
                    aria-label={`slide ${idx + 1}`}
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
              {tPopup('dismissToday')}
            </button>
            <button
              onClick={onClose}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {tCommon('close')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
