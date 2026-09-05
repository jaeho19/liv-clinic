import { describe, it, expect } from 'vitest';
import { listGuides, getGuide, guideLocalesFor } from '../index';
import { GUIDES } from '../guides.generated';
import { isGuidePublished, publishedGuideCount } from '../publicIndex';

describe('guides index', () => {
  it('returns nothing for locales without guides', () => {
    expect(listGuides('ko')).toEqual([]);
    expect(getGuide('vi', 'anything')).toBeNull();
    expect(publishedGuideCount('ko')).toBe(0);
  });

  it('hides drafts unless asked', () => {
    for (const g of GUIDES) {
      const visible = listGuides(g.locale).some((x) => x.slug === g.slug);
      expect(visible).toBe(g.status === 'published');
      expect(listGuides(g.locale, { includeDrafts: true }).some((x) => x.slug === g.slug)).toBe(true);
      expect(isGuidePublished(g.locale, g.slug)).toBe(g.status === 'published');
    }
  });

  it('guideLocalesFor only counts published versions', () => {
    for (const g of GUIDES) {
      const locales = guideLocalesFor(g.slug);
      expect(locales.includes(g.locale)).toBe(g.status === 'published');
    }
  });

  it('every generated guide passes the content gates', () => {
    for (const g of GUIDES) {
      expect(g.title.length, `${g.locale}/${g.slug} title`).toBeGreaterThan(10);
      expect(g.description.length, `${g.locale}/${g.slug} description`).toBeGreaterThan(40);
      expect(g.faq.length, `${g.locale}/${g.slug} faq`).toBeGreaterThanOrEqual(3);
      if (g.status === 'published') expect(g.reviewMarkers, `${g.locale}/${g.slug} markers`).toBe(0);
      const text = JSON.stringify(g);
      expect(text).not.toMatch(/유치기관/);
    }
  });
});
