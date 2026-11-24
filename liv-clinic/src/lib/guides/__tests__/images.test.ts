import { describe, it, expect } from 'vitest';
import { parseBlocks, parseGuide } from '../markdown';
import { guideImagePaths, guideSharePath } from '../images';
import { guideOgImage } from '../ogImage';
import { BASE_URL } from '@/lib/seo';

const fm = (extra = '') => `---
title: "실리프팅은 얼마나 유지되나요?"
description: 실 종류에 따라 달라지는 실리프팅 유지 기간과 회복 기간을 리브성형외과 기준으로 정리했습니다.
keywords:
  - 실리프팅 유지 기간
category: treatment
status: draft
updated: 2026-11-24
reviewer: clinic
${extra}---
`;

const BODY = `
첫 문단입니다.

![실 재료별 흡수 기간을 비교한 그림](/images/guides/thread-absorption.webp "실 재료에 따라 흡수 기간이 다릅니다")

## FAQ

### 질문인가요?

답입니다.
`;

describe('image blocks', () => {
  it('turns a standalone image line into an image block with its caption', () => {
    const { blocks } = parseBlocks(BODY);
    expect(blocks).toContainEqual({
      type: 'image',
      src: '/images/guides/thread-absorption.webp',
      alt: '실 재료별 흡수 기간을 비교한 그림',
      caption: '실 재료에 따라 흡수 기간이 다릅니다',
    });
  });

  it('leaves the caption out when none is given', () => {
    const { blocks } = parseBlocks('![그림 설명](/images/guides/a.webp)\n');
    expect(blocks).toEqual([{ type: 'image', src: '/images/guides/a.webp', alt: '그림 설명' }]);
  });

  it('keeps the paragraphs around an image separate', () => {
    const { blocks } = parseBlocks('앞 문단\n![그림](/images/guides/a.webp)\n뒤 문단\n');
    expect(blocks.map((b) => b.type)).toEqual(['p', 'image', 'p']);
  });
});

describe('guide images — validation', () => {
  const parse = (src: string) => parseGuide(src, { locale: 'ko', slug: 'x' });

  it('reads the cover image and its description from frontmatter', () => {
    const doc = parse(fm('cover: /images/guides/thread-cover.webp\ncoverAlt: 고운 실이 위로 휘어 올라간 정물 사진\n') + BODY);
    expect(doc.cover).toBe('/images/guides/thread-cover.webp');
    expect(doc.coverAlt).toBe('고운 실이 위로 휘어 올라간 정물 사진');
  });

  it('refuses a cover without a description', () => {
    expect(() => parse(fm('cover: /images/guides/thread-cover.webp\n') + BODY)).toThrow(/coverAlt/);
  });

  it('refuses an image without alt text', () => {
    expect(() => parse(fm() + '\n![](/images/guides/a.webp)\n')).toThrow(/alt/);
  });

  it('refuses images outside /images/guides/', () => {
    expect(() => parse(fm() + '\n![그림](/images/lifting/a.webp)\n')).toThrow(/\/images\/guides\//);
    expect(() => parse(fm('cover: https://example.com/a.webp\ncoverAlt: 설명\n') + BODY)).toThrow(/\/images\/guides\//);
  });

  it('still parses a guide with no images at all', () => {
    const doc = parse(fm() + '\n본문입니다.\n');
    expect(doc.cover).toBeUndefined();
    expect(doc.blocks).toEqual([{ type: 'p', text: '본문입니다.' }]);
  });
});

describe('guide image helpers', () => {
  const doc = parseGuide(fm('cover: /images/guides/thread-cover.webp\ncoverAlt: 정물 사진\n') + BODY, {
    locale: 'ko',
    slug: 'x',
  });
  const plain = parseGuide(fm() + '\n본문입니다.\n', { locale: 'ko', slug: 'y' });

  it('lists every image file a guide needs, cover first', () => {
    expect(guideImagePaths(doc)).toEqual([
      '/images/guides/thread-cover.webp',
      '/images/guides/thread-cover-share.jpg',
      '/images/guides/thread-absorption.webp',
    ]);
    expect(guideImagePaths(plain)).toEqual([]);
  });

  it('shares the JPEG twin of the cover, because some messengers do not preview WebP', () => {
    expect(guideSharePath('/images/guides/thread-cover.webp')).toBe('/images/guides/thread-cover-share.jpg');
    expect(guideOgImage(doc)).toEqual({
      url: `${BASE_URL}/images/guides/thread-cover-share.jpg`,
      width: 1200,
      height: 675,
      alt: '정물 사진',
    });
    expect(guideOgImage(plain)).toBeUndefined();
  });
});
