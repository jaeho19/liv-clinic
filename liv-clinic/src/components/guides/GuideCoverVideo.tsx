'use client';

import { useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** 움직임 줄이기를 켰거나 데이터 절약 모드면 영상을 받지 않고 사진만 둔다. */
function canPlay() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  return !window.matchMedia(REDUCED_MOTION).matches && !saveData;
}

/**
 * 대표 사진 위에 얹는 짧은 반복 영상(소리 없음).
 *
 * 서버가 그린 화면에는 사진만 있다 — 영상은 브라우저에서만 붙는다(서버 스냅샷 = false).
 * 그래서 가장 큰 그림(LCP)은 계속 사진이고, 영상을 못 트는 환경에서도 빈자리가 생기지 않는다.
 * 영상은 첫 장면이 올 때까지 투명하므로 그동안 아래의 사진이 그대로 보인다(영상의 첫 장면 = 사진).
 */
export default function GuideCoverVideo({ src }: { src: string }) {
  const play = useSyncExternalStore(subscribe, canPlay, () => false);
  if (!play) return null;
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
