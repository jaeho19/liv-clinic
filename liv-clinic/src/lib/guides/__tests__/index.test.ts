import { describe, it, expect } from 'vitest';
import { listGuides, getGuide, guideLocalesFor } from '../index';
import { GUIDES } from '../guides.generated';
import { isGuidePublished, publishedGuideCount, localeSwitchPath } from '../publicIndex';

describe('localeSwitchPath', () => {
  it('leaves non-guide paths alone', () => {
    expect(localeSwitchPath('/about', 'ko')).toBe('/about');
    expect(localeSwitchPath('/about', 'mn')).toBe('/about');
    expect(localeSwitchPath('/', 'vi')).toBe('/');
  });
  it('sends locales without articles to the international page from any guide path', () => {
    expect(localeSwitchPath('/guides', 'mn')).toBe('/international');
    // 한국어는 게시된 칼럼이 생기면 허브로, 그 전에는 국제환자 페이지로
    expect(localeSwitchPath('/guides', 'ko')).toBe(publishedGuideCount('ko') > 0 ? '/guides' : '/international');
    expect(localeSwitchPath('/guides/ultherapy-cost-seoul', 'vi')).toBe('/international');
  });
  it('keeps guide locales on the hub, and on a detail only when that language is published', () => {
    expect(localeSwitchPath('/guides', 'ja')).toBe('/guides');
    for (const g of GUIDES) {
      // 초안뿐인 글은 그 언어의 허브로, 허브도 비어 있는 언어(첫 칼럼 공개 전의 한국어)는 국제환자 페이지로
      const fallback = publishedGuideCount(g.locale) > 0 ? '/guides' : '/international';
      const expected = g.status === 'published' ? `/guides/${g.slug}` : fallback;
      expect(localeSwitchPath(`/guides/${g.slug}`, g.locale)).toBe(expected);
    }
    expect(localeSwitchPath('/guides/no-such-slug', 'en')).toBe('/guides');
  });
});

describe('guides index', () => {
  it('returns nothing for locales without guides', () => {
    expect(listGuides('mn')).toEqual([]);
    expect(getGuide('vi', 'anything')).toBeNull();
    expect(publishedGuideCount('mn')).toBe(0);
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
