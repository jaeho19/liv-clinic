'use client';

import { useCallback, useEffect } from 'react';

interface PosterViewerCloseProps {
  /** 버튼 문구(common.close) — (viewer) 트리에는 NextIntlClientProvider 가 없어 서버에서 번역해 넘긴다 */
  label: string;
  /** 탭을 닫을 수 없을 때(주소로 직접 들어온 경우 등) 돌아갈 이벤트 상세 경로 */
  fallbackHref: string;
}

/**
 * 포스터 「크게 보기」 탭의 닫기 버튼.
 *
 * 상세 페이지의 링크(target=_blank)로 열린 탭은 `window.close()`로 닫힌다. 브라우저는 스크립트가
 * 열지 않은 탭의 close 를 조용히 무시하므로, 잠시 뒤에도 탭이 살아 있으면 이벤트 페이지로 이동한다.
 * Esc 키도 같은 동작.
 */
export default function PosterViewerClose({ label, fallbackHref }: PosterViewerCloseProps) {
  const close = useCallback(() => {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) window.location.assign(fallbackHref);
    }, 200);
  }, [fallbackHref]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  return (
    <button
      type="button"
      onClick={close}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm text-white transition-colors hover:bg-white/20"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      {label}
    </button>
  );
}
