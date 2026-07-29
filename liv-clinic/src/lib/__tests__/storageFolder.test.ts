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
    expect(sanitizeStorageFolder('')).toBe('temp');
    expect(sanitizeStorageFolder('   ')).toBe('temp');
  });

  it('slugifies mixed-case text with spaces and punctuation', () => {
    expect(sanitizeStorageFolder('My Event 2026!')).toBe('my-event-2026');
  });

  it('falls back to temp when fewer than two alphanumerics survive', () => {
    expect(sanitizeStorageFolder('8월-프로모션')).toBe('temp');
    expect(sanitizeStorageFolder('리브성형외과-5월-프로모션')).toBe('temp');
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
