import { describe, it, expect } from 'vitest';
import { formatKst, formatKstTime } from '../kst';

// 2024-01-01은 월요일 — 요일 계산의 기준점으로 쓴다.
describe('formatKst', () => {
  it('UTC 시각을 KST 날짜·요일·시각으로 굽는다', () => {
    expect(formatKst('2024-01-01T00:00:00Z')).toBe('01/01(월) 09:00 KST');
  });

  it('자정을 넘기면 KST 기준 다음 날로 표기한다', () => {
    expect(formatKst('2023-12-31T15:30:00Z')).toBe('01/01(월) 00:30 KST');
  });

  it('Date 객체도 받는다 (토요일)', () => {
    expect(formatKst(new Date('2024-01-06T03:05:00Z'))).toBe('01/06(토) 12:05 KST');
  });

  it('한 자리 월·일·시·분을 0으로 채운다', () => {
    expect(formatKst('2024-03-04T22:07:00Z')).toBe('03/05(화) 07:07 KST');
  });
});

describe('formatKstTime', () => {
  it('시각만 굽는다', () => {
    expect(formatKstTime('2024-01-01T05:03:00Z')).toBe('14:03 KST');
  });
});
