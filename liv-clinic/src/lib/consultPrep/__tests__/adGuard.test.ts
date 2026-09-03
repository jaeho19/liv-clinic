import { describe, it, expect } from 'vitest';
import { checkAdCopy } from '../adGuard';

describe('checkAdCopy', () => {
  it('정상 문장은 통과시킨다', () => {
    expect(checkAdCopy('턱선이 흐려진 것이 신경 쓰이신다는 말씀이군요.')).toEqual({
      ok: true,
      hits: [],
    });
  });

  it('빈 문자열은 통과시킨다', () => {
    expect(checkAdCopy('')).toEqual({ ok: true, hits: [] });
  });

  it.each([
    ['최고의 시술입니다', '최고'],
    ['국내 유일한 장비', '유일'],
    ['강남 1위 병원', '1위'],
    ['100% 만족하실 겁니다', '100%'],
    ['완벽하게 개선됩니다', '완벽'],
    ['영구적으로 유지됩니다', '영구'],
    ['부작용 없는 시술', '부작용 없'],
    ['효과를 보장합니다', '보장'],
    ['확실하게 좋아집니다', '확실'],
    ['즉시 효과가 나타납니다', '즉시 효과'],
  ])('금지어를 잡는다: %s', (text, expected) => {
    const result = checkAdCopy(text);
    expect(result.ok).toBe(false);
    expect(result.hits).toContain(expected);
  });

  it('가격·할인 표현을 잡는다', () => {
    expect(checkAdCopy('30% 할인된 가격입니다').ok).toBe(false);
    expect(checkAdCopy('50만원에 가능합니다').ok).toBe(false);
  });

  it('전후 비교 표현을 잡는다', () => {
    expect(checkAdCopy('시술 전후 사진을 보세요').ok).toBe(false);
  });

  it('여러 금지어를 모두 모아서 돌려준다', () => {
    const result = checkAdCopy('최고의 시술로 완벽하게');
    expect(result.hits).toEqual(expect.arrayContaining(['최고', '완벽']));
    expect(result.hits).toHaveLength(2);
  });
});
