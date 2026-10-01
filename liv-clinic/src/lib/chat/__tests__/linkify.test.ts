import { describe, it, expect } from 'vitest';
import { splitLinks } from '../linkify';

describe('splitLinks — 말풍선 글에서 주소 가르기', () => {
  it('주소가 없으면 글 조각 하나', () => {
    expect(splitLinks('hello')).toEqual([{ kind: 'text', value: 'hello' }]);
    expect(splitLinks('')).toEqual([{ kind: 'text', value: '' }]);
  });

  it('문장 중간의 주소', () => {
    expect(splitLinks('see https://liv-clinic.net/en/events now')).toEqual([
      { kind: 'text', value: 'see ' },
      { kind: 'link', value: 'https://liv-clinic.net/en/events' },
      { kind: 'text', value: ' now' },
    ]);
  });

  it('주소가 여러 개', () => {
    expect(splitLinks('a http://a.com b https://b.com/x?y=1&z=2')).toEqual([
      { kind: 'text', value: 'a ' },
      { kind: 'link', value: 'http://a.com' },
      { kind: 'text', value: ' b ' },
      { kind: 'link', value: 'https://b.com/x?y=1&z=2' },
    ]);
  });

  it('줄바꿈 뒤의 주소 — 이벤트 안내 말풍선의 꼴', () => {
    expect(splitLinks('本月优惠活动可在此查看：\nhttps://liv-clinic.net/zh/events/2026-10-promotion')).toEqual([
      { kind: 'text', value: '本月优惠活动可在此查看：\n' },
      { kind: 'link', value: 'https://liv-clinic.net/zh/events/2026-10-promotion' },
    ]);
  });

  it('주소 끝의 문장부호는 링크에서 뺀다', () => {
    expect(splitLinks('Visit https://liv-clinic.net/en/events.')).toEqual([
      { kind: 'text', value: 'Visit ' },
      { kind: 'link', value: 'https://liv-clinic.net/en/events' },
      { kind: 'text', value: '.' },
    ]);
    expect(splitLinks('(https://liv-clinic.net/en)')).toEqual([
      { kind: 'text', value: '(' },
      { kind: 'link', value: 'https://liv-clinic.net/en' },
      { kind: 'text', value: ')' },
    ]);
    expect(splitLinks('https://liv-clinic.net/ja/events。ご覧ください')).toEqual([
      { kind: 'link', value: 'https://liv-clinic.net/ja/events' },
      { kind: 'text', value: '。ご覧ください' },
    ]);
  });

  it('띄어쓰기 없이 일본어·중국어 글이 붙어도 주소는 거기서 끝난다', () => {
    expect(splitLinks('https://liv-clinic.net/ja/eventsをご覧ください')).toEqual([
      { kind: 'link', value: 'https://liv-clinic.net/ja/events' },
      { kind: 'text', value: 'をご覧ください' },
    ]);
  });

  it('http·https 만 링크다 — javascript: 나 www. 만 있는 글은 글자 그대로', () => {
    expect(splitLinks('javascript:alert(1) and www.example.com')).toEqual([
      { kind: 'text', value: 'javascript:alert(1) and www.example.com' },
    ]);
  });

  it('주소 없이 http:// 만 있으면 글자 그대로', () => {
    expect(splitLinks('http://')).toEqual([{ kind: 'text', value: 'http://' }]);
    expect(splitLinks('x http://. y')).toEqual([{ kind: 'text', value: 'x http://. y' }]);
  });

  it('조각을 이어 붙이면 원래 글이 된다', () => {
    const text = '가격은 https://liv-clinic.net/ko/events, 그리고 (http://a.com/b?c=d) 를 보세요.';
    expect(splitLinks(text).map((p) => p.value).join('')).toBe(text);
  });
});
