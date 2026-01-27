'use client';

import { useCallback } from 'react';

interface ScrollToSectionOptions {
  /** 스크롤 동작 ('smooth' | 'auto') */
  behavior?: ScrollBehavior;
  /** 스크롤 정렬 위치 ('start' | 'center' | 'end' | 'nearest') */
  block?: ScrollLogicalPosition;
  /** 헤더 높이 등을 고려한 오프셋 (px) */
  offset?: number;
}

/**
 * 특정 섹션으로 스무스 스크롤하는 기능을 제공하는 훅
 *
 * @example
 * const { scrollToSection } = useScrollToSection({ offset: 80 });
 *
 * // 버튼 클릭 시 해당 섹션으로 스크롤
 * <button onClick={() => scrollToSection('section-lifting')}>
 *   리프팅 시그니처
 * </button>
 *
 * // 타겟 섹션
 * <section id="section-lifting">...</section>
 */
export function useScrollToSection(defaultOptions: ScrollToSectionOptions = {}) {
  const {
    behavior: defaultBehavior = 'smooth',
    block: defaultBlock = 'start',
    offset: defaultOffset = 80, // 기본 헤더 높이
  } = defaultOptions;

  const scrollToSection = useCallback(
    (targetId: string, options: ScrollToSectionOptions = {}) => {
      const {
        behavior = defaultBehavior,
        block = defaultBlock,
        offset = defaultOffset,
      } = options;

      const element = document.getElementById(targetId);
      if (!element) {
        console.warn(`[useScrollToSection] Element with id "${targetId}" not found`);
        return;
      }

      // offset이 있으면 수동으로 계산하여 스크롤
      if (offset !== 0) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior,
        });
      } else {
        // offset이 없으면 기본 scrollIntoView 사용
        element.scrollIntoView({
          behavior,
          block,
        });
      }
    },
    [defaultBehavior, defaultBlock, defaultOffset]
  );

  return { scrollToSection };
}

export default useScrollToSection;
