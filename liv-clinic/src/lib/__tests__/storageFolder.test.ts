import { describe, it, expect } from 'vitest';
import { sanitizeStorageFolder } from '../storageFolder';

describe('sanitizeStorageFolder', () => {
  it('leaves already-safe ASCII slugs untouched', () => {
    expect(sanitizeStorageFolder('2026-09-promotion')).toBe('2026-09-promotion');
    expect(sanitizeStorageFolder('aprilevent')).toBe('aprilevent');
    expect(sanitizeStorageFolder('temp')).toBe('temp');
  });

  it('leaves a UUID folder untouched (PopupForm passes the popup id)', () => {
    const uuid = 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
    expect(sanitizeStorageFolder(uuid)).toBe(uuid);
  });

  it('falls back to temp for empty or whitespace-only input', () => {
    // 여기서만 temp 다 — 파생시킬 원본 문자열 자체가 없다.
    expect(sanitizeStorageFolder('')).toBe('temp');
    expect(sanitizeStorageFolder('   ')).toBe('temp');
  });

  it('slugifies mixed-case text with spaces and punctuation', () => {
    expect(sanitizeStorageFolder('My Event 2026!')).toBe('my-event-2026');
  });

  // 예전에는 비ASCII 슬러그가 전부 공용 `temp`로 접혔다. 그 결과 서로 다른 이벤트의
  // 이미지가 events/temp 한 폴더에 125장까지 쌓여 어느 파일이 어느 이벤트 것인지
  // 구분할 수 없었다. 슬러그별로 안정적인 고유 폴더를 준다.
  it('gives a non-ASCII slug its own stable folder instead of the shared temp', () => {
    const august = sanitizeStorageFolder('8월-프로모션');
    const july = sanitizeStorageFolder('7월-프로모션');

    expect(august).not.toBe('temp');
    expect(august).not.toBe(july);
    // 같은 슬러그는 언제 불러도 같은 폴더여야 한다 (수정 저장 때 흩어지면 안 됨)
    expect(sanitizeStorageFolder('8월-프로모션')).toBe(august);
  });

  it('keeps the ASCII part of a mixed slug readable and appends a discriminator', () => {
    expect(sanitizeStorageFolder('2026-8월-promotion')).toMatch(/^2026-{0,1}-?8-promotion/);
  });

  it('caps the result at 60 chars without leaving a trailing separator', () => {
    const long = 'promotion-'.repeat(10); // 100 chars
    const result = sanitizeStorageFolder(long);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith('-')).toBe(false);
    expect(result).toBe('promotion-promotion-promotion-promotion-promotion-promotion');
  });

  // Regression: Supabase Storage rejects non-ASCII object keys with
  // 400 InvalidKey ("Invalid key: 8월-프로모션/probe.png"), which blocked every
  // image upload on events whose slug is Korean.
  it('never returns non-ASCII, so the storage key cannot trigger a 400 InvalidKey', () => {
    const koreanSlugs = ['8월-프로모션', '7월-프로모션', '6월-프로모션', '리브성형외과-5월-프로모션'];
    for (const slug of koreanSlugs) {
      expect(sanitizeStorageFolder(slug)).toMatch(/^[A-Za-z0-9._-]+$/);
    }
  });
});
