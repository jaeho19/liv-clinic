import { describe, expect, test } from 'vitest';
import { preferTraditionalChinese } from '../acceptLanguage';

describe('preferTraditionalChinese', () => {
  test('홍콩·마카오 태그를 zh-TW로 바꾸고 q 값은 둔다', () => {
    expect(preferTraditionalChinese('zh-HK,zh;q=0.9,en;q=0.8')).toBe('zh-TW,zh;q=0.9,en;q=0.8');
    expect(preferTraditionalChinese('zh-MO')).toBe('zh-TW');
    expect(preferTraditionalChinese('en-US,en;q=0.9,zh-hk;q=0.7')).toBe('en-US,en;q=0.9,zh-TW;q=0.7');
  });

  test('zh-Hant 계열(지역 포함)도 zh-TW로 바꾼다', () => {
    expect(preferTraditionalChinese('zh-Hant-HK,zh-Hant;q=0.9')).toBe('zh-TW,zh-TW;q=0.9');
    expect(preferTraditionalChinese('zh-Hant-TW')).toBe('zh-TW');
  });

  test('간체·대만·일반 zh와 다른 언어는 그대로 둔다', () => {
    for (const header of ['zh-TW,zh;q=0.9', 'zh-CN,zh;q=0.9', 'zh-SG', 'zh-Hans-HK', 'zh', 'ja-JP,ja;q=0.9', 'ko-KR']) {
      expect(preferTraditionalChinese(header)).toBe(header);
    }
  });

  test('빈 값은 그대로 돌려준다', () => {
    expect(preferTraditionalChinese(null)).toBeNull();
    expect(preferTraditionalChinese('')).toBe('');
  });
});
