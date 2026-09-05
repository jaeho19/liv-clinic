import { describe, it, expect } from 'vitest';
import { adminReviewInputSchema, toReviewInsert } from '../adminReviewInput';

const valid = {
  locale: 'en',
  author_name: 'Sarah K.',
  country: 'Singapore',
  treatment_category: 'lifting',
  rating: 5,
  content: 'Ultherapy went smoothly and the staff explained everything in English.',
  received_on: '2026-08-20',
  is_published: true,
  is_verified: false,
};

describe('adminReviewInputSchema', () => {
  it('accepts a complete input', () => {
    expect(adminReviewInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown treatment keys, bad ratings, short content, bad dates, bad locales', () => {
    expect(adminReviewInputSchema.safeParse({ ...valid, treatment_category: 'Ultherapy' }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, rating: 4.5 }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, content: 'too short' }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, received_on: '2026/08/20' }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, locale: 'xx' }).success).toBe(false);
  });

  it('has no source/consent fields', () => {
    const keys = Object.keys(adminReviewInputSchema.shape);
    expect(keys).not.toContain('source');
    expect(keys).not.toContain('consent');
    expect(keys).not.toContain('video_url');
  });

  it('maps to a reviews insert with created_at at noon KST of the received date', () => {
    const row = toReviewInsert(adminReviewInputSchema.parse(valid));
    expect(row).toMatchObject({
      locale: 'en',
      author_name: 'Sarah K.',
      country: 'Singapore',
      treatment_category: 'lifting',
      rating: 5,
      source: 'onsite',
      is_published: true,
      is_verified: false,
    });
    expect(row.created_at).toBe('2026-08-20T12:00:00+09:00');
  });

  it('omits created_at when no date given and nulls empty country', () => {
    const row = toReviewInsert(adminReviewInputSchema.parse({ ...valid, received_on: undefined, country: '' }));
    expect(row.created_at).toBeUndefined();
    expect(row.country).toBeNull();
  });

  it('defaults publish flags to false', () => {
    const parsed = adminReviewInputSchema.parse({ ...valid, is_published: undefined, is_verified: undefined });
    expect(parsed.is_published).toBe(false);
    expect(parsed.is_verified).toBe(false);
  });
});
