import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { looksLikePriceQuestion, PROMO_DRAFTS, stripPromoDraft } from '../priceIntent';

const MESSAGES_DIR = path.resolve(__dirname, '..', '..', '..', 'messages');
const MESSAGE_LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

/** 5% 직접 예약 배너가 입력창에 넣어 주는 문장 — 메시지 JSON에서 직접 읽는다. */
const draftsFromJson = MESSAGE_LOCALES.map((locale) => {
  const json = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'));
  return json.chat.promoDraft as string;
});

describe('looksLikePriceQuestion — 가격·프로모션 문의', () => {
  // 스펙 §8에 적힌 지난 문의 문장(일부는 앞뒤를 채웠다)과 스모크 문장
  it.each([
    'Hi, could you tell me the price of Ulthera?',
    'any promotion on ultherapy prime ?',
    'How much is Ulthera 600 shots?',
    '超声刀多少钱？',
    '我想了解一下价目表',
    '请问含税总价是多少',
    '想問除紋身價格',
    '大体の金額についても教えていただけますか',
    '울쎄라 가격이 얼마예요?',
  ])('가격 질문으로 본다: %s', (text) => {
    expect(looksLikePriceQuestion(text)).toBe(true);
  });

  it.each([
    "Hello, I'd like to book a consultation for next week.",
    'Can I make a reservation by WeChat?',
    'Does the doctor do the procedure directly?',
    'Do you have sculptra',
    'what kind of fillers do you do?',
    '我想预约下周的面诊',
    'こんにちは。来週、カウンセリングを予約したいです。',
  ])('가격과 무관한 문의는 아니다: %s', (text) => {
    expect(looksLikePriceQuestion(text)).toBe(false);
  });

  it('손님 화면 언어와 상관없이 다른 언어의 낱말도 본다', () => {
    expect(looksLikePriceQuestion('Quel est le prix du Botox ?')).toBe(true);
    expect(looksLikePriceQuestion('Giá botox bao nhiêu tiền?')).toBe(true);
    expect(looksLikePriceQuestion('Сколько стоит ботокс?')).toBe(true);
    expect(looksLikePriceQuestion('Ботокс ямар үнэтэй вэ?')).toBe(true);
    expect(looksLikePriceQuestion('โบท็อกซ์ราคาเท่าไหร่')).toBe(true);
    expect(looksLikePriceQuestion('كم سعر البوتوكس؟')).toBe(true);
  });

  it('대소문자와 낱말 사이 줄바꿈을 가리지 않는다', () => {
    expect(looksLikePriceQuestion('HOW MUCH for botox')).toBe(true);
    expect(looksLikePriceQuestion('What is the Price?')).toBe(true);
    expect(looksLikePriceQuestion('how\nmuch is it')).toBe(true);
  });

  it('낱말 경계를 지킨다 — 다른 낱말의 일부는 아니다', () => {
    expect(looksLikePriceQuestion('This is priceless')).toBe(false);
    expect(looksLikePriceQuestion('I live in Costa Rica')).toBe(false);
    expect(looksLikePriceQuestion('I will eventually visit')).toBe(false);
  });

  it('일부러 넣지 않은 낱말은 걸리지 않는다', () => {
    expect(looksLikePriceQuestion('Do you offer Sculptra?')).toBe(false);
    expect(looksLikePriceQuestion('얼마나 걸리나요')).toBe(false);
    expect(looksLikePriceQuestion('Combien de temps dure la séance ?')).toBe(false);
  });

  it('빈 글은 아니다', () => {
    expect(looksLikePriceQuestion('')).toBe(false);
  });
});

describe('배너 문장(chat.promoDraft)', () => {
  it('파일의 상수가 메시지 JSON 11개 언어의 값과 같다', () => {
    expect([...PROMO_DRAFTS]).toEqual(draftsFromJson);
  });

  it('배너 문장만 보낸 글은 가격 질문이 아니다 (11개 언어 모두)', () => {
    for (const draft of draftsFromJson) {
      expect(looksLikePriceQuestion(draft)).toBe(false);
      expect(stripPromoDraft(draft).trim()).toBe('');
    }
  });

  it('배너 문장을 지우지 않으면 걸렸을 문장이 실제로 있다 (지우는 이유)', () => {
    // 한국어 배너 문장의 마지막 글자를 잘라 "정확히 같은 문장"이 아니게 만들면 '할인'·'이벤트'에 걸린다
    expect(looksLikePriceQuestion(draftsFromJson[0].slice(0, -1))).toBe(true);
  });

  it('배너 문장 뒤에 가격 질문이 붙으면 가격 질문이다', () => {
    expect(looksLikePriceQuestion(`${draftsFromJson[1]} How much is Ulthera?`)).toBe(true);
    expect(looksLikePriceQuestion(`${draftsFromJson[3]}超声刀多少钱？`)).toBe(true);
  });
});
