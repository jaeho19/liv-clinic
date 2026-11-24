import { describe, it, expect } from 'vitest';
import { parseGuide } from '../markdown';
import { guideCardMeta, guideMetaLine, isDoctorAuthored } from '../byline';

const md = (extra = '') => `---
title: "실리프팅은 얼마나 유지되나요?"
description: 실 종류에 따라 달라지는 실리프팅 유지 기간과 회복 기간을 리브성형외과 기준으로 정리했습니다.
keywords:
  - 실리프팅 유지 기간
category: treatment
status: draft
updated: 2026-11-24
reviewer: clinic
${extra}---

첫 문단입니다.
`;

const column = parseGuide(md(), { locale: 'ko', slug: 'thread-lift' });
const guide = parseGuide(md(), { locale: 'en', slug: 'thread-lift' });
const reviewedGuide = parseGuide(md().replace('reviewer: clinic', 'reviewer: dr-kim'), { locale: 'en', slug: 'thread-lift' });

describe('who a piece is signed by', () => {
  it('signs every Korean column with the director, because none can be published before she has reviewed it', () => {
    expect(isDoctorAuthored(column)).toBe(true);
  });

  it('signs a foreign guide with the director only when she reviewed it', () => {
    expect(isDoctorAuthored(guide)).toBe(false);
    expect(isDoctorAuthored(reviewedGuide)).toBe(true);
  });
});

describe('the line under the title', () => {
  it('shows only the director on a Korean column — no date, no reading time', () => {
    const line = guideMetaLine(column);
    expect(line).toBe('글 김수영 대표원장 (성형외과 전문의)');
    expect(line).not.toContain('2026');
    expect(line).not.toContain('분');
  });

  it('keeps date, reading time and author on a foreign guide', () => {
    expect(guideMetaLine(guide)).toBe('Updated 2026-11-24 · 1 min read · Written by LIV Plastic Surgery');
  });

  it('says "reviewed by" on a foreign guide the director reviewed', () => {
    expect(guideMetaLine(reviewedGuide)).toContain('Medically reviewed by Dr. Sooyoung Kim');
  });
});

describe('the line on a list card', () => {
  it('shows the director on a Korean column card instead of date and reading time', () => {
    expect(guideCardMeta(column)).toBe('글 김수영 대표원장 (성형외과 전문의)');
  });

  it('keeps date and reading time on a foreign guide card', () => {
    expect(guideCardMeta(guide)).toBe('Updated 2026-11-24 · 1 min read');
  });
});

describe('first publication date', () => {
  const parse = (extra: string) => parseGuide(md(extra), { locale: 'ko', slug: 'x' });

  it('reads the date a piece first went public', () => {
    expect(parse('published: 2026-12-01\n').published).toBe('2026-12-01');
  });

  it('is optional', () => {
    expect(parse('').published).toBeUndefined();
  });

  it('refuses a date that is not YYYY-MM-DD', () => {
    expect(() => parse('published: 12/01/2026\n')).toThrow(/published/);
  });
});
