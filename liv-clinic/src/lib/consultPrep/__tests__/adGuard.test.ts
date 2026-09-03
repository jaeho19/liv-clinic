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

  // --- 리뷰 Critical 1: restatement 은 ko/en/ja/zh 로 생성된다 ---
  // classify.ts 의 프롬프트가 `ONE sentence in ${lang}` 를 요구하므로 한국어 목록만으로는
  // en/ja/zh 에서 의료광고 검사가 사실상 없는 상태가 된다. 아래 4문장은 리뷰어 실측 그대로다.

  describe('리뷰어 실측 문장 (수정 전에는 en/ja/zh 가 전부 통과했다)', () => {
    it.each([
      ['ko', '부작용 없이 완벽한 효과를 보장합니다'],
      ['en', 'guarantees perfect, permanent results with no side effects'],
      ['ja', '副作用がなく、完璧で永久的な効果を保証します'],
      ['zh', '保证完美永久的效果，绝无副作用'],
      ['en(가격·할인)', 'costs about 500 USD and is 30% off this month'],
    ])('%s 문장을 차단한다', (_lang, text) => {
      const result = checkAdCopy(text);
      expect(result.ok).toBe(false);
      expect(result.hits.length).toBeGreaterThan(0);
    });
  });

  describe('각 언어의 정상 문장은 통과한다 (오탐 방지)', () => {
    it.each([
      ['ko', '웃을 때 턱선이 흐릿해 보이는 점이 신경 쓰이신다는 말씀이군요.'],
      ['en', 'You mentioned your jawline looks less defined when you smile.'],
      ['ja', '笑ったときにフェイスラインがぼやけて見えるのが気になるとのことですね。'],
      ['zh', '您提到笑起来的时候下颌线看起来不够清晰。'],
    ])('%s 정상 문장', (_lang, text) => {
      expect(checkAdCopy(text)).toEqual({ ok: true, hits: [] });
    });

    it('부분일치로 잡지 않는다 — commonly 는 only 가 아니다', () => {
      expect(checkAdCopy('This is commonly described as a bestowed feature.').ok).toBe(true);
    });

    it('중국어 第一次(처음)·일본어 第一印象(첫인상)은 순위 주장이 아니다', () => {
      expect(checkAdCopy('这是您第一次来韩国咨询。').ok).toBe(true);
      expect(checkAdCopy('第一印象が気になるとのことですね。').ok).toBe(true);
    });
  });

  describe('영어 금지어는 대소문자를 가리지 않는다', () => {
    it.each([
      ['Perfect results', 'perfect'],
      ['WE GUARANTEE IT', 'guarantee'],
      ['The Best Clinic', 'best'],
      ['PERMANENT effect', 'permanent'],
      ['the only device in Korea', 'only'],
      ['No.1 in Gangnam', 'no.1'],
      ['#1 lifting clinic', 'no.1'],
      ['certainly improves', 'certain'],
      ['immediate results', 'immediate'],
      ['a unique procedure', 'unique'],
      ['side-effect-free treatment', 'no side effect'],
      ['100 % satisfaction', '100%표현'],
    ])('%s', (text, expected) => {
      const result = checkAdCopy(text);
      expect(result.ok).toBe(false);
      expect(result.hits).toContain(expected);
    });
  });

  describe('일본어·중국어 금지어', () => {
    it.each([
      ['最高の施術です', '最高'],
      ['唯一の機器です', '唯一'],
      ['1位のクリニック', '1位'],
      ['完璧に改善します', '完璧'],
      ['永久的な効果', '永久'],
      ['副作用なしの施術', '副作用な'],
      ['効果を保証します', '保証'],
      ['確実に良くなります', '確実'],
      ['即効性があります', '即効'],
      ['最好的效果', '最好'],
      ['最佳选择', '最佳'],
      ['完美的轮廓', '完美'],
      ['无副作用的项目', '无副作用'],
      ['保证效果', '保证'],
      ['确保满意', '确保'],
      ['立即见效', '立即见效'],
    ])('%s', (text, expected) => {
      const result = checkAdCopy(text);
      expect(result.ok).toBe(false);
      expect(result.hits).toContain(expected);
    });

    it('한자권 1위 주장을 잡는다', () => {
      expect(checkAdCopy('排名第一的医院').ok).toBe(false);
      expect(checkAdCopy('業界第一のクリニック').ok).toBe(false);
    });
  });

  describe('외화 가격·다국어 할인 표현', () => {
    it.each([
      '500 USD',
      'about 1,200 dollars',
      '$300 per session',
      '¥50,000',
      '30,000円で受けられます',
      '2000元起',
      '30% off this month',
      'a discounted price',
      'on sale now',
      '今月は割引です',
      '限定セール中',
      '本月八折优惠',
      '现在打折',
    ])('%s 를 잡는다', (text) => {
      expect(checkAdCopy(text).ok).toBe(false);
    });
  });

  describe('다국어 전후 비교 표현', () => {
    it.each([
      'see the before and after photos',
      'ビフォーアフターをご覧ください',
      '请看术前术后对比',
    ])('%s 를 잡는다', (text) => {
      expect(checkAdCopy(text).ok).toBe(false);
    });
  });
});
