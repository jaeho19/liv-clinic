/**
 * 가이드·칼럼 이미지 규칙. 클라이언트 안전(생성물을 import하지 않는다).
 *
 * 모든 글 이미지는 `public/images/guides/`에 두고 **1600×900(16:9)** 로 맞춘다 —
 * 대표 사진(cover)과 본문 그림이 같은 크기라 원고에 크기를 적지 않아도 된다.
 * 대표 사진에는 공유용 JPEG 짝(`…-share.jpg`, 1200×675)을 같이 둔다(ogImage.ts).
 * 파일이 실제로 있는지는 compile-guides가 확인한다.
 * 이 파일은 compile-guides(tsx)도 불러온다 — seo.ts 같은 무거운 모듈을 import하지 말 것.
 */
import type { GuideDoc } from './types';

export const GUIDE_IMAGE_SIZE = { width: 1600, height: 900 } as const;
/** 공유 이미지(og:image) 크기 */
export const GUIDE_SHARE_SIZE = { width: 1200, height: 675 } as const;

/** 원고에 쓸 수 있는 이미지 경로: /images/guides/<영문 소문자·숫자·하이픈>.<확장자> */
export const GUIDE_IMAGE_PATH = /^\/images\/guides\/[a-z0-9-]+\.(webp|png|jpe?g|svg)$/;

/**
 * 대표 사진의 공유용 짝: `x.webp` → `x-share.jpg`.
 * 카카오톡 등 일부 메신저가 WebP 미리보기를 못 그릴 수 있어 공유 이미지는 JPEG로 낸다.
 */
export function guideSharePath(cover: string): string {
  return cover.replace(/\.[a-z]+$/, '-share.jpg');
}

/** 대표 사진의 움직이는 버전: /images/guides/<영문 소문자·숫자·하이픈>.mp4 (소리 없는 H.264, 16:9) */
export const GUIDE_VIDEO_PATH = /^\/images\/guides\/[a-z0-9-]+\.mp4$/;

/** 이 글이 쓰는 이미지·영상 파일 전부(대표 사진·공유용 짝·영상 먼저) — 빌드 때 파일 존재 확인용. */
export function guideImagePaths(guide: Pick<GuideDoc, 'cover' | 'coverVideo' | 'blocks'>): string[] {
  const inBody = guide.blocks.flatMap((b) => (b.type === 'image' ? [b.src] : []));
  return [
    ...(guide.cover ? [guide.cover, guideSharePath(guide.cover)] : []),
    ...(guide.coverVideo ? [guide.coverVideo] : []),
    ...inBody,
  ];
}
