import { describe, it, expect } from 'vitest';
import { buildSitemapPaths } from '@/lib/sitemapPaths';

describe('buildSitemapPaths', () => {
  const paths = buildSitemapPaths();
  const byPath = Object.fromEntries(paths.map((p) => [p.path, p]));

  it('includes pages that were missing from the sitemap', () => {
    for (const p of ['/antiaging/hilowave', '/antiaging/hilowave-v2', '/events/first-visit', '/inquiry', '/consult-prep']) {
      expect(byPath[p], p).toBeDefined();
    }
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
