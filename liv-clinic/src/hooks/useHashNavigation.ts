'use client';

import { useCallback, type MouseEvent } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/routing';

/**
 * 헤더 메뉴의 "홈 섹션 앵커"(예: #media-news) 클릭을 처리한다.
 *
 * 왜 하드 네비게이션인가:
 * 드롭다운/모바일 메뉴는 framer-motion AnimatePresence로 열고 닫힌다. 이 메뉴가
 * 한 번이라도 열렸다 닫힌 뒤 같은 페이지에서 scrollIntoView/scrollTo로 스크롤하면,
 * framer-motion이 남긴 상태와 충돌해 insertBefore/removeChild 예외로 페이지가
 * 깨진다(딜레이를 길게 줘도 회피되지 않음 — 실측 검증). next-intl 소프트 라우팅도
 * 동일 증상을 유발한다. 따라서 LanguageSwitcher·MobileMenu의 locale 전환과 동일하게
 * 전체 리로드(window.location)로 처리한다.
 *
 * 동작:
 *  - 다른 페이지: window.location.assign으로 홈+해시 진입(전체 로드)
 *  - 홈(같은 페이지): 해시만 바뀌면 리로드되지 않으므로 reload로 강제 새로고침
 * 새로 로드된 홈에서는 MediaNewsSection의 mount effect가 해당 섹션으로 스크롤한다.
 */
export function useHashNavigation() {
  const locale = useLocale();
  const pathname = usePathname(); // locale 미포함 경로. 홈은 '/'

  return useCallback(
    (e: MouseEvent<HTMLAnchorElement>, hash: string) => {
      e.preventDefault();
      window.location.assign(`/${locale}#${hash}`);
      if (pathname === '/') {
        window.location.reload();
      }
    },
    [locale, pathname]
  );
}
