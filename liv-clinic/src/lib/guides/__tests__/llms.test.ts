import { describe, it, expect } from 'vitest';
import { parseGuide } from '../markdown';
import { columnsForLlms, syncColumnsBlock } from '../llms';

const md = (status: 'draft' | 'published', title = '실리프팅은 얼마나 유지되나요?') => `---
title: "${title}"
description: 실 종류에 따라 달라지는 실리프팅 유지 기간을 정리했습니다.
keywords:
  - 실리프팅 유지 기간
category: treatment
status: ${status}
updated: 2026-11-24
reviewer: dr-kim
---

첫 문단입니다.
`;

const koPublished = parseGuide(md('published'), { locale: 'ko', slug: 'thread-lift-how-long-it-lasts' });
const koDraft = parseGuide(md('draft', '덴서티와 써마지'), { locale: 'ko', slug: 'density-vs-thermage' });
const enPublished = parseGuide(md('published', 'Ultherapy cost'), { locale: 'en', slug: 'ultherapy-cost-seoul' });

const FILE = ['# LIV', '', '<!-- columns:start — 자동 생성 -->', '<!-- columns:end -->', ''].join('\r\n');

describe('Korean columns in llms.txt', () => {
  it('lists published Korean columns only — drafts and foreign guides stay out', () => {
    const lines = columnsForLlms([koPublished, koDraft, enPublished]);
    expect(lines.join('\n')).toContain('https://liv-clinic.net/ko/guides/thread-lift-how-long-it-lasts');
    expect(lines.join('\n')).not.toContain('density-vs-thermage');
    expect(lines.join('\n')).not.toContain('ultherapy-cost-seoul');
  });

  it('names the author and links the hub, so an AI answer can say who wrote it', () => {
    const text = columnsForLlms([koPublished]).join('\n');
    expect(text).toContain('김수영 대표원장');
    expect(text).toContain('(https://liv-clinic.net/ko/guides)');
    expect(text).toContain('[실리프팅은 얼마나 유지되나요?](https://liv-clinic.net/ko/guides/thread-lift-how-long-it-lasts): 실 종류에 따라');
  });

  it('writes nothing while no column is public', () => {
    expect(columnsForLlms([koDraft, enPublished])).toEqual([]);
  });

  it('fills the marked block and keeps the rest of the file byte for byte', () => {
    const out = syncColumnsBlock(FILE, [koPublished]);
    expect(out.startsWith('# LIV\r\n\r\n<!-- columns:start — 자동 생성 -->\r\n')).toBe(true);
    expect(out.endsWith('<!-- columns:end -->\r\n')).toBe(true);
    expect(out).toContain('## 칼럼');
    expect(out.replace(/\r\n/g, '')).not.toContain('\n'); // 파일의 줄바꿈(CRLF)을 따른다
  });

  it('gives the same file when run twice, and empties the block again when columns are unpublished', () => {
    const once = syncColumnsBlock(FILE, [koPublished]);
    expect(syncColumnsBlock(once, [koPublished])).toBe(once);
    expect(syncColumnsBlock(once, [])).toBe(FILE);
  });

  it('leaves a file without the markers alone', () => {
    expect(syncColumnsBlock('# LIV\n', [koPublished])).toBe('# LIV\n');
  });
});
