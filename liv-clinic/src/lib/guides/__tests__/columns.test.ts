import { describe, it, expect } from 'vitest';
import {
  ARTICLE_LOCALES,
  GUIDE_LOCALES,
  isArticleLocale,
  isGuideLocale,
  missingGuideLocales,
  type GuideIndexEntry,
} from '../types';
import { parseGuide, publishBlockers } from '../markdown';
import { createGuideStore } from '../index';
import { hasKoreanColumns, isGuidePublished, localeSwitchPath, publishedGuideCount } from '../publicIndex';
import { GUIDE_UI } from '../ui';
import { buildSitemapPaths } from '@/lib/sitemapPaths';

const md = (status: 'draft' | 'published') => `---
title: "실리프팅은 얼마나 유지되나요?"
description: 실 종류에 따라 달라지는 실리프팅 유지 기간과 회복 기간을 리브성형외과 기준으로 정리했습니다.
keywords:
  - 실리프팅 유지 기간
category: treatment
status: ${status}
updated: 2026-11-24
reviewer: clinic
treatment: /lifting/thread
---

첫 문단입니다.

## FAQ

### 질문 하나인가요?

답입니다.
`;

const koPublished = parseGuide(md('published'), { locale: 'ko', slug: 'thread-lift-duration' });
const koDraft = parseGuide(md('draft'), { locale: 'ko', slug: 'density-vs-thermage' });
const enPublished = parseGuide(md('published'), { locale: 'en', slug: 'ultherapy-cost-seoul' });
const jaPublished = parseGuide(md('published'), { locale: 'ja', slug: 'ultherapy-cost-seoul' });
const DOCS = [koPublished, koDraft, enPublished, jaPublished];
const INDEX: GuideIndexEntry[] = DOCS.map(({ locale, slug, status, title, category }) => ({
  locale,
  slug,
  status,
  title,
  category,
}));

describe('article locales', () => {
  it('adds Korean to the languages that can carry articles', () => {
    expect(isArticleLocale('ko')).toBe(true);
    expect(ARTICLE_LOCALES).toEqual(['ko', ...GUIDE_LOCALES]);
    expect(isArticleLocale('vi')).toBe(false);
  });

  it('keeps Korean out of the foreign-patient guide languages', () => {
    // InternationalNotice·가격 환산 줄 등은 isGuideLocale로 "외국인 대상 언어"를 판정한다
    expect(isGuideLocale('ko')).toBe(false);
    expect(GUIDE_LOCALES).toEqual(['en', 'ja', 'zh', 'zh-TW']);
  });

  it('has screen text for every article language', () => {
    for (const locale of ARTICLE_LOCALES) {
      const ui = GUIDE_UI[locale];
      expect(ui, locale).toBeDefined();
      expect(ui.guides.length, locale).toBeGreaterThan(0);
      expect(ui.hubEyebrow.length, locale).toBeGreaterThan(0);
      for (const c of ['price', 'booking', 'comparison', 'aftercare', 'treatment'] as const) {
        expect(ui.category[c], `${locale}.${c}`).toBeTruthy();
      }
    }
    expect(GUIDE_UI.ko.guides).toBe('칼럼');
  });
});

describe('missingGuideLocales', () => {
  it('reports untranslated foreign versions of a foreign guide', () => {
    expect(missingGuideLocales(['en', 'ja'])).toEqual(['zh', 'zh-TW']);
    expect(missingGuideLocales(['en', 'ja', 'zh', 'zh-TW'])).toEqual([]);
  });

  it('does not ask for translations of a Korean-only column', () => {
    expect(missingGuideLocales(['ko'])).toEqual([]);
  });

  it('does not count Korean as a missing translation of a foreign guide', () => {
    expect(missingGuideLocales(['en', 'ja', 'zh', 'zh-TW'])).not.toContain('ko');
  });
});

describe('createGuideStore', () => {
  const store = createGuideStore(DOCS);

  it('lists published Korean columns and hides drafts unless asked', () => {
    expect(store.listGuides('ko').map((g) => g.slug)).toEqual(['thread-lift-duration']);
    expect(store.listGuides('ko', { includeDrafts: true }).map((g) => g.slug)).toEqual([
      'thread-lift-duration',
      'density-vs-thermage',
    ]);
  });

  it('finds a Korean draft by direct lookup so it can be reviewed by URL', () => {
    expect(store.getGuide('ko', 'density-vs-thermage')?.status).toBe('draft');
    expect(store.getGuide('vi', 'density-vs-thermage')).toBeNull();
  });

  it('links language versions only between published copies of the same slug', () => {
    expect(store.guideLocalesFor('ultherapy-cost-seoul')).toEqual(['en', 'ja']);
    expect(store.guideLocalesFor('thread-lift-duration')).toEqual(['ko']);
    expect(store.guideLocalesFor('density-vs-thermage')).toEqual([]);
  });

  it('opens a hub only in languages with at least one published article', () => {
    expect(store.hubLocales()).toEqual(['ko', 'en', 'ja']);
    expect(createGuideStore([koDraft, enPublished]).hubLocales()).toEqual(['en']);
  });
});

describe('public index with Korean columns', () => {
  it('counts published Korean columns', () => {
    expect(publishedGuideCount('ko', INDEX)).toBe(1);
    expect(isGuidePublished('ko', 'thread-lift-duration', INDEX)).toBe(true);
    expect(isGuidePublished('ko', 'density-vs-thermage', INDEX)).toBe(false);
  });

  it('shows the column menu only in Korean and only once something is published', () => {
    expect(hasKoreanColumns('ko', INDEX)).toBe(true);
    expect(hasKoreanColumns('en', INDEX)).toBe(false);
    expect(hasKoreanColumns('ko', INDEX.filter((g) => g.status === 'draft'))).toBe(false);
  });

  it('switches language to the Korean hub when Korean has columns', () => {
    expect(localeSwitchPath('/guides', 'ko', INDEX)).toBe('/guides');
    expect(localeSwitchPath('/guides/ultherapy-cost-seoul', 'ko', INDEX)).toBe('/guides');
    expect(localeSwitchPath('/guides/thread-lift-duration', 'ko', INDEX)).toBe('/guides/thread-lift-duration');
  });

  it('sends a Korean column to the hub of a language that lacks it', () => {
    expect(localeSwitchPath('/guides/thread-lift-duration', 'en', INDEX)).toBe('/guides');
  });

  it('never lands on an empty hub', () => {
    // zh는 가이드 언어지만 이 색인에는 게시본이 없다 → 빈 허브 대신 국제환자 페이지
    expect(localeSwitchPath('/guides', 'zh', INDEX)).toBe('/international');
    expect(localeSwitchPath('/guides/thread-lift-duration', 'vi', INDEX)).toBe('/international');
    expect(localeSwitchPath('/guides', 'ko', INDEX.filter((g) => g.locale !== 'ko'))).toBe('/international');
  });
});

describe('sitemap with Korean columns', () => {
  const paths = buildSitemapPaths(['ko'], createGuideStore(DOCS));
  const byPath = Object.fromEntries(paths.map((p) => [p.path, p]));

  it('lists the hub in every language that has published articles, Korean included', () => {
    expect(byPath['/guides'].locales).toEqual(['ko', 'en', 'ja']);
  });

  it('lists a Korean column under Korean only and leaves drafts out', () => {
    expect(byPath['/guides/thread-lift-duration'].locales).toEqual(['ko']);
    expect(byPath['/guides/density-vs-thermage']).toBeUndefined();
  });
});

describe('publishBlockers', () => {
  const reviewed = { ...koPublished, reviewer: 'dr-kim' as const };

  it('lets a draft through whatever its state', () => {
    expect(publishBlockers({ ...koDraft, reviewMarkers: 3 })).toEqual([]);
  });

  it('blocks a published article that still has review markers', () => {
    expect(publishBlockers({ ...enPublished, reviewMarkers: 2 })).toHaveLength(1);
    expect(publishBlockers({ ...enPublished, reviewMarkers: 2 })[0]).toContain('2 [검수 필요]');
  });

  it('blocks a Korean column published without the director as reviewer', () => {
    expect(publishBlockers(koPublished)).toHaveLength(1);
    expect(publishBlockers(koPublished)[0]).toMatch(/reviewer: dr-kim/);
    expect(publishBlockers(reviewed)).toEqual([]);
  });

  it('leaves foreign guides free to publish under the clinic name', () => {
    expect(publishBlockers(enPublished)).toEqual([]);
  });
});
