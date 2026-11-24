import { BASE_URL } from '@/lib/seo';
import { GUIDE_SHARE_SIZE, guideSharePath } from './images';
import type { GuideDoc } from './types';

/**
 * 공유 이미지(og:image·Article.image) — 대표 사진이 있을 때만, 그 JPEG 짝을 쓴다.
 * 없으면 사이트 기본 이미지를 쓴다.
 */
export function guideOgImage(
  guide: Pick<GuideDoc, 'cover' | 'coverAlt'>,
): { url: string; width: number; height: number; alt: string } | undefined {
  if (!guide.cover) return undefined;
  return { url: `${BASE_URL}${guideSharePath(guide.cover)}`, ...GUIDE_SHARE_SIZE, alt: guide.coverAlt ?? '' };
}
