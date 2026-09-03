import { describe, it, expect, vi, afterEach } from 'vitest';
import { compressForUpload, presetForBucket } from '../imageCompress';

// 이미지 변환은 브라우저 API(createImageBitmap + OffscreenCanvas)에 기대므로
// node 환경에서는 그 둘을 세워 놓고 "무엇을 요청했는지"를 확인한다.

type BitmapSpec = { width: number; height: number };

let lastBitmapOptions: ImageBitmapOptions | undefined;
let lastDrawSize: { width: number; height: number } | undefined;
let lastBlobOptions: { type: string; quality: number } | undefined;
let closed = false;

function stubBrowserImageApis(bitmap: BitmapSpec, outputBytes: number) {
  lastBitmapOptions = undefined;
  lastDrawSize = undefined;
  lastBlobOptions = undefined;
  closed = false;

  vi.stubGlobal('createImageBitmap', vi.fn(async (_blob: Blob, options?: ImageBitmapOptions) => {
    lastBitmapOptions = options;
    return { ...bitmap, close: () => { closed = true; } };
  }));

  vi.stubGlobal('OffscreenCanvas', class {
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      lastDrawSize = { width, height };
    }
    getContext() { return { drawImage: () => {} }; }
    async convertToBlob(options: { type: string; quality: number }) {
      lastBlobOptions = options;
      return new Blob([new Uint8Array(outputBytes)], { type: options.type });
    }
  });
}

const fileOf = (bytes: number, type = 'image/jpeg', name = 'photo.jpg') =>
  new File([new Uint8Array(bytes)], name, { type });

afterEach(() => vi.unstubAllGlobals());

describe('compressForUpload', () => {
  it('converts to WebP and shrinks to the preset long edge', async () => {
    stubBrowserImageApis({ width: 4000, height: 3000 }, 50_000);

    const result = await compressForUpload(fileOf(2_000_000), 'gallery', 'image/jpeg', 'jpg');

    expect(result.passthrough).toBe(false);
    expect(result.contentType).toBe('image/webp');
    expect(result.extension).toBe('webp');
    expect(lastDrawSize).toEqual({ width: 1600, height: 1200 });   // gallery = 1600px
    expect(lastBlobOptions).toEqual({ type: 'image/webp', quality: 0.78 });
    expect(closed).toBe(true);
  });

  it('applies each preset its own long edge', async () => {
    stubBrowserImageApis({ width: 4000, height: 2000 }, 10_000);
    await compressForUpload(fileOf(1_000_000), 'thumbnail', 'image/jpeg', 'jpg');
    expect(lastDrawSize).toEqual({ width: 400, height: 200 });
    expect(lastBlobOptions?.quality).toBe(0.72);
  });

  // EXIF 회전을 반영하지 않으면 아이폰으로 찍은 시술 전후 사진이 옆으로 누워서 올라간다.
  it('asks the decoder to apply EXIF orientation', async () => {
    stubBrowserImageApis({ width: 1000, height: 800 }, 10_000);
    await compressForUpload(fileOf(500_000), 'beforeAfter', 'image/jpeg', 'jpg');
    expect(lastBitmapOptions).toEqual({ imageOrientation: 'from-image' });
  });

  it('does not enlarge an image smaller than the preset', async () => {
    stubBrowserImageApis({ width: 600, height: 400 }, 20_000);
    await compressForUpload(fileOf(300_000), 'gallery', 'image/jpeg', 'jpg');
    expect(lastDrawSize).toEqual({ width: 600, height: 400 });
  });

  // WebP는 한 변이 16383px를 넘으면 인코딩이 실패한다.
  // 세로로 긴 이벤트 상세 이미지(실제로 1920x20322가 있었다)가 여기 걸린다.
  it('caps a very tall image at the WebP dimension limit', async () => {
    stubBrowserImageApis({ width: 1920, height: 20322 }, 300_000);
    await compressForUpload(fileOf(4_900_000), 'gallery', 'image/jpeg', 'jpg');
    expect(lastDrawSize!.height).toBeLessThanOrEqual(16383);
    expect(lastDrawSize!.width).toBeLessThanOrEqual(1600);
    // 비율은 유지돼야 한다
    expect(lastDrawSize!.width / lastDrawSize!.height).toBeCloseTo(1920 / 20322, 4);
  });

  // 애니메이션 GIF를 캔버스에 그리면 첫 프레임만 남는다.
  it('leaves GIFs untouched', async () => {
    stubBrowserImageApis({ width: 800, height: 600 }, 1000);
    const file = fileOf(200_000, 'image/gif', 'anim.gif');

    const result = await compressForUpload(file, 'gallery', 'image/gif', 'gif');

    expect(result.passthrough).toBe(true);
    expect(result.blob).toBe(file);
    expect(result.extension).toBe('gif');
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('keeps the original when the conversion would make it bigger', async () => {
    stubBrowserImageApis({ width: 500, height: 500 }, 90_000);
    const file = fileOf(80_000, 'image/png', 'logo.png');

    const result = await compressForUpload(file, 'gallery', 'image/png', 'png');

    expect(result.passthrough).toBe(true);
    expect(result.blob).toBe(file);
    expect(result.contentType).toBe('image/png');
  });

  // 변환이 안 되는 환경에서 관리자 업로드가 통째로 막히면 안 된다.
  it('falls back to the original when the browser cannot decode images', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const file = fileOf(1_000_000);

    const result = await compressForUpload(file, 'gallery', 'image/jpeg', 'jpg');

    expect(result.passthrough).toBe(true);
    expect(result.blob).toBe(file);
  });

  it('falls back to the original when decoding throws', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('decode failed'); }));
    const file = fileOf(1_000_000);

    const result = await compressForUpload(file, 'gallery', 'image/jpeg', 'jpg');

    expect(result.passthrough).toBe(true);
    expect(result.blob).toBe(file);
  });
});

describe('presetForBucket', () => {
  it('maps each bucket to its display size', () => {
    expect(presetForBucket('popups')).toBe('popup');
    expect(presetForBucket('before-after')).toBe('beforeAfter');
    expect(presetForBucket('events')).toBe('gallery');
  });
});
