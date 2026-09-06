import { describe, it, expect } from 'vitest';
import { parseFrontmatter, parseBlocks, parseGuide, REVIEW_MARKER } from '../markdown';

const SAMPLE = `---
title: "Ultherapy in Seoul: 2026 price guide"
description: What Ultherapy Prime costs at LIV and how to plan a visit.
keywords:
  - ultherapy korea price
  - ultherapy seoul cost
category: price
status: draft
updated: 2026-09-06
reviewer: clinic
treatment: /lifting/ulthera
---

Intro paragraph with **bold** and a [link](/pricing).
Second line of the same paragraph.

## Prices

| Area | Shots | Price |
|---|---|---|
| Upper face | 200-300 | KRW 780,000~ |

- one
- two

1. first
2. second

> Prices exclude VAT. [검수 필요: 비행 가능 시점]

## FAQ

### Do foreigners pay more?

No. The same price list applies.

### Can I fly the next day?

[검수 필요: 원장 확인] Not stated on the site.
`;

describe('parseFrontmatter', () => {
  it('reads scalars and lists', () => {
    const { data, body } = parseFrontmatter(SAMPLE);
    expect(data.title).toBe('Ultherapy in Seoul: 2026 price guide');
    expect(data.keywords).toEqual(['ultherapy korea price', 'ultherapy seoul cost']);
    expect(data.treatment).toBe('/lifting/ulthera');
    expect(body.startsWith('\nIntro paragraph')).toBe(true);
  });

  it('throws without frontmatter', () => {
    expect(() => parseFrontmatter('no frontmatter')).toThrow(/frontmatter/);
  });
});

describe('parseBlocks', () => {
  it('builds blocks and pulls the FAQ section out', () => {
    const { body } = parseFrontmatter(SAMPLE);
    const { blocks, faq } = parseBlocks(body);
    expect(blocks[0]).toEqual({
      type: 'p',
      text: 'Intro paragraph with **bold** and a [link](/pricing). Second line of the same paragraph.',
    });
    expect(blocks[1]).toMatchObject({ type: 'h2', text: 'Prices', id: 'prices' });
    expect(blocks[2]).toEqual({
      type: 'table',
      header: ['Area', 'Shots', 'Price'],
      rows: [['Upper face', '200-300', 'KRW 780,000~']],
    });
    expect(blocks[3]).toEqual({ type: 'ul', items: ['one', 'two'] });
    expect(blocks[4]).toEqual({ type: 'ol', items: ['first', 'second'] });
    expect(blocks[5]).toMatchObject({ type: 'note' });
    expect(blocks.some((b) => b.type === 'h2' && /faq/i.test(b.text))).toBe(false);
    expect(faq).toEqual([
      { q: 'Do foreigners pay more?', a: 'No. The same price list applies.' },
      { q: 'Can I fly the next day?', a: '[검수 필요: 원장 확인] Not stated on the site.' },
    ]);
  });

  it('gives CJK headings stable positional ids', () => {
    const { blocks } = parseBlocks('## 価格の目安\n\n本文。\n');
    expect(blocks[0]).toMatchObject({ type: 'h2', id: 's1' });
  });
});

describe('parseGuide', () => {
  it('returns a GuideDoc with marker count and reading time', () => {
    const doc = parseGuide(SAMPLE, { locale: 'en', slug: 'ultherapy-cost-seoul' });
    expect(doc.locale).toBe('en');
    expect(doc.slug).toBe('ultherapy-cost-seoul');
    expect(doc.status).toBe('draft');
    expect(doc.reviewMarkers).toBe(2);
    expect(doc.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(doc.faq).toHaveLength(2);
  });

  it('rejects missing required fields and bad enums', () => {
    const bad = SAMPLE.replace('category: price', 'category: sale');
    expect(() => parseGuide(bad, { locale: 'en', slug: 'x' })).toThrow(/category/);
    const noDesc = SAMPLE.replace(/description: .*\n/, '');
    expect(() => parseGuide(noDesc, { locale: 'en', slug: 'x' })).toThrow(/description/);
  });

  it('REVIEW_MARKER matches the Korean marker with or without a note', () => {
    expect('a [검수 필요] b [검수 필요: 근거 없음] c'.match(REVIEW_MARKER)).toHaveLength(2);
  });
});
