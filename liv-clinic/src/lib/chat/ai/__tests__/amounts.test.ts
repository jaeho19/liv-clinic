import { describe, it, expect } from 'vitest';
import { findLooseNumber, findStatedAmount, maskAmounts, normalizeForCheck, toCheckText } from '../amounts';

describe('normalizeForCheck — 검사용 글', () => {
  const norm = (s: string) => normalizeForCheck(s).text;

  it('전각 글자와 다른 문자의 숫자를 보통 숫자로 바꾼다', () => {
    expect(norm('２４０万ウォン')).toBe('240万ウォン');
    expect(norm('٢٤٠٠٠٠٠ وون')).toBe('2400000 وون');
    expect(norm('۲۴۰')).toBe('240');
    expect(norm('๒๔๐๐๐๐๐')).toBe('2400000');
    expect(norm('ＫＲＷ ５００')).toBe('KRW 500');
    expect(norm('￦500 ＄5 ￥9')).toBe('₩500 $5 ¥9');
  });

  it('퍼센트 기호 · 줄표 · 띄어쓰기 · 보이지 않는 글자', () => {
    expect(norm('20٪ · 5％')).toBe('20% · 5%');
    expect(norm('010‑1234–5678')).toBe('010-1234-5678');
    expect(norm('1 500 000')).toBe('1 500 000');
    expect(norm('1​500⁠000')).toBe('1500000');
    expect(norm('٢٬٤٠٠٫٥')).toBe('2,400.5');
  });

  it('보통 글은 그대로 둔다 — 장음 기호는 줄표가 아니다', () => {
    expect(norm('ウルセラー 600 shots, 10:00-19:00')).toBe('ウルセラー 600 shots, 10:00-19:00');
    expect(norm('리쥬란 2cc · Thermage FLX')).toBe('리쥬란 2cc · Thermage FLX');
  });

  it('숫자 사이에 끼워도 눈에는 그대로 보이는 글자를 지운다 — 방향 표시 · 키캡 · 취소선 · 아랍 문자의 늘임표', () => {
    expect(norm('2\u200e400\u200e000')).toBe('2400000');
    expect(norm('2\ufe0f\u20e34\ufe0f\u20e3')).toBe('24');
    expect(norm('2\u03364\u0336')).toBe('24');
    expect(norm('مضـــمونة')).toBe('مضمونة');
  });

  it('동그라미 안의 숫자도 숫자로 읽는다', () => {
    expect(norm('❷❹⓿')).toBe('240');
    expect(norm('①②')).toBe('12');
  });

  it('풀어 쓴 글자를 합친다 (베트남어의 성조 부호 · 반각 가나의 탁점)', () => {
    expect(normalizeForCheck('T\u00f4\u0301t').text).toBe('T\u1ed1t');
    expect(toCheckText('ﾊﾟｰｾﾝﾄ')).toBe('パーセント');
  });

  it('검사용 글의 각 글자가 원문의 어디서 왔는지 안다', () => {
    const n = normalizeForCheck('a​２b');
    expect(n.text).toBe('a2b');
    expect(n.starts).toEqual([0, 2, 3]);
    expect(n.ends).toEqual([1, 3, 4]);
  });
});

describe('findStatedAmount — 통화·단위 낱말이 붙은 금액', () => {
  const hit = (s: string) => findStatedAmount(normalizeForCheck(s).text);

  it('찾은 금액을 통째로 돌려준다', () => {
    expect(hit('It is KRW 500,000.')).toBe('KRW 500,000');
    expect(hit('약 50만 원입니다')).toBe('50만 원');
    expect(hit('Цена 780 000 ₩')).toBe('780 000 ₩');
    expect(hit('Other clinics offer 1.8M.')).toBe('1.8M');
    expect(hit('It is two million won.')).toBe('two million won');
  });

  it('줄임 단위 · 떨어져 있는 통화 · 글자로 쓴 수', () => {
    for (const bad of [
      'about 2.4m',
      '大概240w',
      'Примерно 500к за зону.',
      'khoảng 2tr4',
      '2.4 саяас эхэлнэ',
      '약 200여만 원',
      'It is a 2.4-million-won treatment.',
      'about 1700 US dollars',
      '約1700ドルです',
      'KRW: 990',
      'About 1700 (USD)',
      'two and a half million',
      'Khoảng hai triệu tư.',
      'ประมาณสองล้านสี่แสน',
      'пятьсот тысяч',
      'Environ deux millions quatre cent mille.',
      'хоёр сая дөрвөн зуун мянга',
      'حوالي مليونين وأربعمئة ألف.',
      '이백사십만 정도입니다',
      '价格是两千四',
      '贰佰肆拾万。',
      'にひゃくよんじゅうまんウォンです。',
    ]) {
      expect(hit(bad), bad).not.toBeNull();
    }
  });

  it('금액이 아닌 것', () => {
    for (const ok of [
      'La séance dure environ 30 mn.',
      'Có thể xuất hiện 1-2 triệu chứng nhẹ.',
      '请千万小心防晒。',
      'Có 2 đồng nghiệp đi cùng bạn phải không?',
      'We have 2 K-beauty programs this month.',
      '2～3日元気に過ごせる方がほとんどです。',
      '1:1 원장 상담 후 결정됩니다.',
      'У нас есть 2 европейских филлера.',
      "October 15 won't work.",
      'We have 2 wonderful options.',
      'About 50 m from Exit 4.',
      'ONDA Lifting 30kJ',
      'Ultherapy 300-400 shots, Rejuran 2cc, 5 km away, 2 kg',
      '1月1日元旦休诊。',
      '10월 14일만 가능합니다. 토요일만 원하시면 말씀해 주세요.',
      'We quote prices in Korean won only.',
      '请千万不要迟到。',
    ]) {
      expect(hit(ok), ok).toBeNull();
    }
  });
});

describe('findLooseNumber — 통화 표시 없이 쓴 금액일 수 있는 숫자', () => {
  it('천 단위로 묶은 숫자와 다섯 자리 이상의 숫자', () => {
    expect(findLooseNumber('It is 1,590,000 in total.')).toBe('1,590,000');
    expect(findLooseNumber('Total 2.400.000.')).toBe('2.400.000');
    expect(findLooseNumber('Итого 1 500 000.')).toBe('1 500 000');
    expect(findLooseNumber("CHF 1'500'000")).toBe("1'500'000");
    expect(findLooseNumber('The fee is 10000.')).toBe('10000');
  });

  it('연도가 아닌 네 자리 숫자 — 뒤에 샷 같은 단위가 오면 아니다', () => {
    expect(findLooseNumber('That works out to about 4000 per shot.')).toBe('4000');
    expect(findLooseNumber('• Thermage 600: 2400')).toBe('2400');
    expect(findLooseNumber('Shurink 1000 shots, Thermage FLX 1,200 shots, 1000샷')).toBeNull();
    expect(findLooseNumber('in 2026, or in 2569 (Thai calendar)')).toBeNull();
  });

  it('흔치 않은 구분 기호로 묶은 숫자', () => {
    expect(findLooseNumber('It is 2, 400, 000')).toBe('2, 400, 000');
    expect(findLooseNumber('It is 2·400·000')).toBe('2·400·000');
    expect(findLooseNumber('It is 24,00,000')).toBe('24,00,000');
    expect(findLooseNumber('It is 2 4 0 0 0 0 0')).toBe('2 4 0 0 0 0 0');
    expect(findLooseNumber('300, 600, 900 shots on October 14, 16, 17')).toBeNull();
  });

  it('날짜 · 시각 · 샷 수는 아니다', () => {
    expect(findLooseNumber('14.10.2026, 10:00-19:00, 300-400 shots, 2026')).toBeNull();
    expect(findLooseNumber('1.5 hours, 2,5 cm')).toBeNull();
  });
});

describe('maskAmounts — 이력에 넣는 글의 금액을 가린다', () => {
  it('금액은 가리고, 샷 수·날짜·시각은 그대로 둔다', () => {
    expect(maskAmounts('Ulthera 600 shots is KRW 2,200,000 (VAT included)')).toBe('Ulthera 600 shots is [amount] (VAT included)');
    expect(maskAmounts('220만원입니다')).toBe('[amount]입니다');
    expect(maskAmounts('600샷 275만 원 → 이벤트 2,200,000원')).toBe('600샷 [amount] → 이벤트 [amount]');
    expect(maskAmounts('10/14 14:00, 2 people, 300-400 shots')).toBe('10/14 14:00, 2 people, 300-400 shots');
  });

  it('다른 문자의 숫자 · 단위 낱말 · 글자로 쓴 수도 가린다. 가린 곳 밖의 글자는 원문 그대로다', () => {
    expect(maskAmounts('サーマジは２４０万ウォンです（税抜）')).toBe('サーマジは[amount]です（税抜）');
    expect(maskAmounts('Цена 780 000 ₩')).toBe('Цена [amount]');
    expect(maskAmounts('It is two million won.')).toBe('It is [amount].');
    expect(maskAmounts('Environ 2,4 millions de wons')).toBe('Environ [amount]');
    expect(maskAmounts('46万韩元起')).toBe('[amount]起');
  });

  it('금액이 아닌 것은 건드리지 않는다', () => {
    for (const ok of [
      'We have 2 wonderful options for you.',
      "October 15 won't work.",
      'Call +82-2-797-2773 or 010-1234-5678',
      '2026-10-14 14:00',
    ]) {
      expect(maskAmounts(ok), ok).toBe(ok);
    }
  });
});
