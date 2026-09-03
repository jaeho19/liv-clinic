// 업로드 직전 브라우저에서 WebP 변환 + 리사이즈.
//
// 왜 필요한가: 원본 그대로 올리면 4~5MB짜리 사진이 그대로 서빙돼 Supabase cached egress가
// Free 한도(5GB)를 넘긴다. 2026-08에 실제로 넘겨 프로젝트가 402로 정지됐다.
//
// 왜 Supabase Image Transformation(?width=)을 안 쓰는가: Pro 전용이라 Free로 내리면
// 사이트 이미지가 전부 깨진다. 파일 자체를 변환해야 한다.

export type ImagePreset = 'gallery' | 'poster' | 'thumbnail' | 'popup' | 'beforeAfter';

// 장변 / 품질. 2026-09 기존 233장을 일괄 변환할 때 검증한 값으로, 평균 92.8% 감량에
// 한글 텍스트 선명도 저하가 없었다.
const PRESETS: Record<ImagePreset, { maxWidth: number; quality: number }> = {
  gallery: { maxWidth: 1600, quality: 0.78 },
  poster: { maxWidth: 1200, quality: 0.8 },
  thumbnail: { maxWidth: 400, quality: 0.72 },
  popup: { maxWidth: 1000, quality: 0.8 },
  beforeAfter: { maxWidth: 1200, quality: 0.82 },
};

// WebP는 한 변이 16383px를 넘으면 인코딩할 수 없다.
// 세로로 긴 이벤트 상세 이미지(실제로 20322px짜리가 있었다)가 여기 걸린다.
const WEBP_MAX_DIMENSION = 16383;

export type CompressedImage = {
  readonly blob: Blob;
  readonly contentType: string;
  readonly extension: string;
  /** 변환하지 않고 원본을 그대로 쓰는 경우 true (GIF, 변환 실패, 변환 후 더 커진 경우) */
  readonly passthrough: boolean;
};

const passthroughOf = (file: File, contentType: string, extension: string): CompressedImage => ({
  blob: file,
  contentType,
  extension,
  passthrough: true,
});

const drawToBlob = async (
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> => {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: 'image/webp', quality });
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
};

/**
 * 업로드용으로 이미지를 WebP로 변환하고 프리셋 장변까지 줄인다.
 * 변환할 수 없거나 이득이 없으면 원본을 그대로 돌려준다 — 관리자 업로드가 막히면 안 된다.
 */
export async function compressForUpload(
  file: File,
  preset: ImagePreset,
  fallbackContentType: string,
  fallbackExtension: string
): Promise<CompressedImage> {
  // 애니메이션 GIF는 캔버스를 거치면 첫 프레임만 남는다. 건드리지 않는다.
  if (file.type === 'image/gif') return passthroughOf(file, fallbackContentType, fallbackExtension);
  if (typeof createImageBitmap !== 'function') {
    return passthroughOf(file, fallbackContentType, fallbackExtension);
  }

  const { maxWidth, quality } = PRESETS[preset];
  let bitmap: ImageBitmap;
  try {
    // imageOrientation: EXIF 회전을 반영한다. 빠뜨리면 아이폰 사진이 옆으로 눕는다.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return passthroughOf(file, fallbackContentType, fallbackExtension);
  }

  try {
    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      WEBP_MAX_DIMENSION / bitmap.width,
      WEBP_MAX_DIMENSION / bitmap.height
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const blob = await drawToBlob(bitmap, width, height, quality);
    // 변환이 실패했거나 원본보다 커졌으면 원본이 낫다 (이미 최적화된 파일 등)
    if (!blob || blob.size >= file.size) {
      return passthroughOf(file, fallbackContentType, fallbackExtension);
    }
    return { blob, contentType: 'image/webp', extension: 'webp', passthrough: false };
  } catch {
    return passthroughOf(file, fallbackContentType, fallbackExtension);
  } finally {
    bitmap.close();
  }
}

/** 버킷만 알 때 쓰는 기본 프리셋 */
export const presetForBucket = (bucket: string): ImagePreset =>
  bucket === 'popups' ? 'popup' : bucket === 'before-after' ? 'beforeAfter' : 'gallery';
