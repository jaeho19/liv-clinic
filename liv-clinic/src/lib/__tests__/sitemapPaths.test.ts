import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSitemapPaths } from '@/lib/sitemapPaths';
import { getIndexableReviewLocales } from '@/lib/reviewIndexing';

const { reviewRows } = vi.hoisted(() => ({ reviewRows: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ order: () => ({ range: reviewRows }) }) }) }) }),
}));

describe('review discovery policy', () => {
  beforeEach(() => reviewRows.mockReset());

  it('uses the same published locale set for sitemap and metadata', async () => {
    reviewRows.mockResolvedValue({ data: [{ locale: 'ja' }, { locale: 'ja' }, { locale: 'unsupported' }], error: null });
    expect(await getIndexableReviewLocales()).toEqual(['ko', 'ja']);
  });

  it('includes a locale beyond the database response limit', async () => {
    reviewRows.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => ({ locale: 'ko' })), error: null })
      .mockResolvedValueOnce({ data: [{ locale: 'en' }], error: null });
    expect(await getIndexableReviewLocales()).toEqual(['ko', 'en']);
    expect(reviewRows).toHaveBeenLastCalledWith(1000, 1999);
  });

  it('fails revalidation on a database error instead of publishing a false empty state', async () => {
    reviewRows.mockResolvedValue({ data: null, error: new Error('unavailable') });
    await expect(getIndexableReviewLocales()).rejects.toThrow('unavailable');
  });
});

describe('buildSitemapPaths', () => {
  const paths = buildSitemapPaths();
  const byPath = Object.fromEntries(paths.map((p) => [p.path, p]));

  it('includes pages that were missing from the sitemap', () => {
    for (const p of ['/antiaging/hilowave', '/antiaging/hilowave-v2', '/events/first-visit', '/consult-prep', '/terms']) {
      expect(byPath[p], p).toBeDefined();
    }
  });

  it('excludes private lookup pages from discovery', () => {
    expect(byPath['/inquiry']).toBeUndefined();
    expect(paths.some(({ path }) => path.startsWith('/admin') || path.startsWith('/api'))).toBe(false);
  });

  it('lists reviews only in locales with indexable content', () => {
    expect(byPath['/reviews'].locales).toEqual(['ko']);
    const review = buildSitemapPaths(['ko', 'ja']).find(({ path }) => path === '/reviews');
    expect(review?.locales).toEqual(['ko', 'ja']);
  });

  it('still includes the home page and every treatment detail', () => {
    expect(byPath['']).toBeDefined();
    for (const p of ['/lifting/ulthera', '/lifting/thermage', '/antiaging/botox', '/laser/tattoo']) {
      expect(byPath[p], p).toBeDefined();
    }
  });

  it('keeps the WeChat page zh-only', () => {
    expect(byPath['/wechat'].locales).toEqual(['zh']);
  });

  it('has no duplicates and every path is root-relative', () => {
    expect(new Set(paths.map((p) => p.path)).size).toBe(paths.length);
    expect(paths.every((p) => p.path === '' || p.path.startsWith('/'))).toBe(true);
    expect(paths.every((p) => !p.path.endsWith('/'))).toBe(true);
  });

  it('never lists /guides for non-guide locales', () => {
    const guides = paths.filter((p) => p.path.startsWith('/guides'));
    for (const g of guides) {
      expect(g.locales, g.path).toBeDefined();
      for (const l of g.locales!) expect(['en', 'ja', 'zh', 'zh-TW']).toContain(l);
    }
  });
});
