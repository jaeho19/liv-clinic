import { describe, it, expect } from 'vitest';
import { CHAT_VISITOR_LOCALES, type VisitorLocale } from '@/lib/chat/chatApi';
import { EMPTY_BOOKING, type BookingFields } from '../booking';
import type { PriceRow } from '../knowledge/types';
import {
  channelName,
  formatDate,
  formatKrw,
  identityAnswer,
  lineHint,
  priceCaveat,
  promiseSentence,
  renderBookingBlock,
  renderPriceLine,
  withVat,
} from '../replyTemplates';

const labels = (en: string, ja: string, zh: string, tw: string): Record<VisitorLocale, string> => ({
  en,
  ja,
  zh,
  'zh-TW': tw,
  vi: en,
  th: en,
  ru: en,
  fr: en,
  mn: en,
  ar: en,
});

const ULTHERA: PriceRow = {
  id: 'P002',
  key: 'ulthera.name.fullFace',
  group: 'base',
  labelKo: '울쎄라피 프라임 · 전안면 (400~800샷)',
  amount: 1560000,
  unit: 'starting',
  labels: labels(
    'Ultherapy Prime · Full face (400-800 shots)',
    'ウルセラピープライム · 全顔 (400~800ショット)',
    '超声刀 Prime · 全面部 (400~800发)',
    '音波拉提 Prime · 全臉 (400~800發)'
  ),
};
const PROMO: PriceRow = {
  id: 'M19',
  key: 'promo.2026-10.19',
  group: 'promo',
  labelKo: '[리프팅] 울쎄라피 프라임 300샷 + 온다리프팅 60kJ + 진정팩',
  amount: 1590000,
  unit: 'fixed',
  validFrom: '2026-10-01',
  validUntil: '2026-10-31',
  labels: labels(
    'Ultherapy Prime 300 shots + ONDA Lifting 60kJ + calming pack',
    'Ultherapy Prime 300ショット + ONDA Lifting 60kJ + 鎮静パック',
    'Ultherapy Prime 300发 + ONDA Lifting 60kJ + 舒缓面膜',
    'Ultherapy Prime 300發 + ONDA Lifting 60kJ + 舒緩面膜'
  ),
};
const BOOKING: BookingFields = {
  ...EMPTY_BOOKING,
  date: '2026-10-14',
  time: '14:00',
  treatment: 'Ultherapy Prime',
  partySize: 2,
  name: 'Emma',
};
const WHATSAPP = { channel: 'whatsapp' as const, handle: '+65 9123 4567' };
const OPEN = { slot: 'open' as const, nextBusinessDay: null };

describe('금액', () => {
  it('KRW 1,170,000 꼴, 부가세 포함 금액은 10%를 더해 원 단위로 반올림', () => {
    expect(formatKrw(1170000)).toBe('KRW 1,170,000');
    expect(formatKrw(10000)).toBe('KRW 10,000');
    expect(withVat(1170000)).toBe(1287000);
    expect(withVat(539000)).toBe(592900);
    expect(withVat(33333)).toBe(36666);
  });
});

describe('renderPriceLine — 부가세 별도와 포함을 같이 (both)', () => {
  it('"부터" 금액 (영어·일본어·중국어 간체·번체)', () => {
    expect(renderPriceLine(ULTHERA, 'en', 'both')).toBe(
      '• Ultherapy Prime · Full face (400-800 shots): from KRW 1,560,000 (KRW 1,716,000 incl. VAT)'
    );
    expect(renderPriceLine(ULTHERA, 'ja', 'both')).toBe(
      '• ウルセラピープライム · 全顔 (400~800ショット)：KRW 1,560,000〜（税込 KRW 1,716,000）'
    );
    expect(renderPriceLine(ULTHERA, 'zh', 'both')).toBe('• 超声刀 Prime · 全面部 (400~800发)：KRW 1,560,000 起（含税 KRW 1,716,000）');
    expect(renderPriceLine(ULTHERA, 'zh-TW', 'both')).toBe(
      '• 音波拉提 Prime · 全臉 (400~800發)：KRW 1,560,000 起（含稅 KRW 1,716,000）'
    );
  });

  it('프로모션 줄: 정해진 금액 + 이달 프로모션 표시(끝나는 날)', () => {
    expect(renderPriceLine(PROMO, 'en', 'both')).toBe(
      "• Ultherapy Prime 300 shots + ONDA Lifting 60kJ + calming pack (this month's promotion, until Oct 31): KRW 1,590,000 (KRW 1,749,000 incl. VAT)"
    );
    expect(renderPriceLine(PROMO, 'ja', 'both')).toBe(
      '• Ultherapy Prime 300ショット + ONDA Lifting 60kJ + 鎮静パック（今月のプロモーション・10月31日まで）：KRW 1,590,000（税込 KRW 1,749,000）'
    );
    expect(renderPriceLine(PROMO, 'zh', 'both')).toBe(
      '• Ultherapy Prime 300发 + ONDA Lifting 60kJ + 舒缓面膜（本月优惠，至10月31日）：KRW 1,590,000（含税 KRW 1,749,000）'
    );
  });

  it('부가세 표기 규칙이 바뀌면: 별도만 / 포함만', () => {
    expect(renderPriceLine(ULTHERA, 'en', 'excluded')).toBe('• Ultherapy Prime · Full face (400-800 shots): from KRW 1,560,000');
    expect(renderPriceLine(ULTHERA, 'en', 'included')).toBe('• Ultherapy Prime · Full face (400-800 shots): from KRW 1,716,000');
    expect(priceCaveat('en', 'both')).toBe('The exact amount is decided after your consultation with the doctor.');
    expect(priceCaveat('en', 'excluded')).toBe(
      'Prices exclude VAT. The exact amount is decided after your consultation with the doctor.'
    );
    expect(priceCaveat('ja', 'included')).toBe('表示価格は税込です。 正確な金額は、医師の診察後に決まります。');
  });

  it("상담비 같은 '그 밖의 금액'(fee)은 적힌 금액 그대로 — 부가세 포함 금액을 붙이지 않는다", () => {
    const fee: PriceRow = {
      ...PROMO,
      id: 'F01',
      key: 'fee.consult',
      group: 'fee',
      amount: 10000,
      validFrom: undefined,
      validUntil: undefined,
    };
    const line = '• Ultherapy Prime 300 shots + ONDA Lifting 60kJ + calming pack: KRW 10,000';
    expect(renderPriceLine(fee, 'en', 'both')).toBe(line);
    expect(renderPriceLine(fee, 'en', 'included')).toBe(line);
  });

  it('10개 언어 모두 이름·금액이 들어간 한 줄이 나온다', () => {
    for (const locale of CHAT_VISITOR_LOCALES) {
      const line = renderPriceLine(PROMO, locale, 'both');
      expect(line.startsWith('• '), locale).toBe(true);
      expect(line, locale).toContain('KRW 1,590,000');
      expect(line, locale).toContain('KRW 1,749,000');
      expect(line.includes('\n'), locale).toBe(false);
      expect(priceCaveat(locale, 'both').length, locale).toBeGreaterThan(10);
    }
  });
});

describe('날짜 · 채널 이름', () => {
  it('손님 언어의 날짜 (아라비아 숫자 · 서기)', () => {
    expect(formatDate('en', '2026-10-14', 'long')).toBe('Wed, Oct 14, 2026');
    expect(formatDate('ja', '2026-10-14', 'long')).toBe('2026年10月14日(水)');
    expect(formatDate('zh', '2026-10-14', 'long')).toBe('2026年10月14日周三');
    expect(formatDate('zh-TW', '2026-10-14', 'long')).toBe('2026年10月14日週三');
    expect(formatDate('en', '2026-10-05', 'short')).toBe('Mon, Oct 5');
    expect(formatDate('ja', '2026-10-05', 'short')).toBe('10月5日(月)');
    expect(formatDate('en', '2026-10-31', 'monthDay')).toBe('Oct 31');
    expect(formatDate('th', '2026-10-14', 'long')).toContain('2026'); // 불기(2569)가 아니다
    expect(formatDate('ar', '2026-10-14', 'long')).toContain('14'); // 아랍 숫자(١٤)가 아니다
  });

  it('문장 속 채널 이름: 메신저는 브랜드명, 이메일은 그 언어의 낱말', () => {
    expect(channelName('en', 'whatsapp')).toBe('WhatsApp');
    expect(channelName('ja', 'line')).toBe('LINE');
    expect(channelName('en', 'email')).toBe('email');
    expect(channelName('ja', 'email')).toBe('メール');
    expect(channelName('zh', 'email')).toBe('电子邮件');
  });
});

describe('promiseSentence — 원장님 결정 ③', () => {
  it('상담 시간 중: 오늘 안에', () => {
    expect(promiseSentence('en', 'whatsapp', OPEN)).toBe('We will send your booking confirmation today via WhatsApp.');
    expect(promiseSentence('ja', 'line', OPEN)).toBe('ご予約の確定は、本日中に LINE でお知らせいたします。');
    expect(promiseSentence('zh', 'wechat', OPEN)).toBe('我们将在今天内通过 WeChat 告知您预约确认结果。');
    expect(promiseSentence('zh-TW', 'email', OPEN)).toBe('我們將於今天內透過 電子郵件 通知您預約確認結果。');
  });

  it('마감 1시간 전부터: 오늘 안에, 어려우면 다음 영업일 오전에', () => {
    const closing = { slot: 'closing' as const, nextBusinessDay: '2026-10-03' };
    expect(promiseSentence('en', 'whatsapp', closing)).toBe(
      'We will send your booking confirmation via WhatsApp today if we can, otherwise on the morning of Sat, Oct 3.'
    );
    expect(promiseSentence('ja', 'email', closing)).toBe(
      'ご予約の確定は、本日中、難しい場合は 10月3日(土) の午前中に メール でお知らせいたします。'
    );
  });

  it('상담 시간 밖: 다음 영업일 오전에', () => {
    const closed = { slot: 'closed' as const, nextBusinessDay: '2026-10-06' };
    expect(promiseSentence('en', 'email', closed)).toBe(
      'We will send your booking confirmation on the morning of Tue, Oct 6 (Korea time) via email.'
    );
    expect(promiseSentence('zh', 'wechat', closed)).toBe('我们将于 10月6日周二 上午（韩国时间）通过 WeChat 告知您预约确认结果。');
  });

  it('줄임말로 끝나는 날짜(6 окт. · 6 oct.) 뒤에 마침표가 겹치지 않는다', () => {
    const closing = { slot: 'closing' as const, nextBusinessDay: '2026-10-06' };
    const closed = { slot: 'closed' as const, nextBusinessDay: '2026-10-06' };
    expect(promiseSentence('ru', 'whatsapp', closing)).toBe(
      'Мы отправим подтверждение записи через WhatsApp сегодня, если получится, иначе утром вт, 6 окт.'
    );
    expect(promiseSentence('fr', 'whatsapp', closing)).toBe(
      'Nous vous enverrons la confirmation de réservation via WhatsApp aujourd’hui si possible, sinon dans la matinée du mar. 6 oct.'
    );
    for (const locale of ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'] as const) {
      for (const promise of [OPEN, closing, closed]) {
        expect(promiseSentence(locale, 'whatsapp', promise), locale).not.toMatch(/\.\./);
      }
    }
  });

  it('다음 영업일을 모르면 날짜 없이 말한다', () => {
    expect(promiseSentence('en', 'whatsapp', { slot: 'closed', nextBusinessDay: null })).toBe(
      'We will send your booking confirmation via WhatsApp on our next business day.'
    );
    expect(promiseSentence('en', 'whatsapp', { slot: 'closing', nextBusinessDay: null })).toBe(
      'We will send your booking confirmation via WhatsApp on our next business day.'
    );
  });
});

describe('renderBookingBlock', () => {
  it('영어 — 스펙 부록 B.3', () => {
    expect(renderBookingBlock({ locale: 'en', booking: BOOKING, contact: WHATSAPP, changed: false, promise: OPEN })).toBe(
      [
        'Tentative booking (not yet confirmed)',
        '• Date: Wed, Oct 14, 2026 · 14:00 (Korea time)',
        '• Treatment: Ultherapy Prime',
        '• Guests: 2',
        '• Name: Emma',
        '• Contact: WhatsApp +65 9123 4567',
        'We will send your booking confirmation today via WhatsApp.',
      ].join('\n')
    );
  });

  it('일본어 · 중국어 — 전각 괄호와 구분 기호', () => {
    const ja = renderBookingBlock({ locale: 'ja', booking: BOOKING, contact: WHATSAPP, changed: false, promise: OPEN });
    expect(ja.split('\n').slice(0, 3)).toEqual([
      '仮予約（まだ確定ではありません）',
      '• 日時：2026年10月14日(水) 14:00（韓国時間）',
      '• 施術：Ultherapy Prime',
    ]);
    expect(ja).toContain('• 人数：2名');
    const zh = renderBookingBlock({ locale: 'zh', booking: BOOKING, contact: WHATSAPP, changed: false, promise: OPEN });
    expect(zh.split('\n')[1]).toBe('• 日期：2026年10月14日周三 14:00（韩国时间）');
    expect(zh).toContain('• 人数：2位');
    expect(zh).toContain('• 联系方式：WhatsApp +65 9123 4567');
  });

  it('없는 항목은 줄을 만들지 않는다. 시각이 없으면 시간 메모를 쓴다', () => {
    const block = renderBookingBlock({
      locale: 'en',
      booking: { ...EMPTY_BOOKING, date: '2026-10-14', timeNote: 'afternoon' },
      contact: { channel: 'email', handle: 'emma@example.com' },
      changed: false,
      promise: OPEN,
    });
    expect(block).toBe(
      [
        'Tentative booking (not yet confirmed)',
        '• Date: Wed, Oct 14, 2026 · afternoon (Korea time)',
        '• Contact: Email emma@example.com',
        'We will send your booking confirmation today via email.',
      ].join('\n')
    );
  });

  it('바뀐 가예약은 제목이 다르다', () => {
    const block = renderBookingBlock({ locale: 'en', booking: BOOKING, contact: WHATSAPP, changed: true, promise: OPEN });
    expect(block.split('\n')[0]).toBe('Updated tentative booking (not yet confirmed)');
    const ja = renderBookingBlock({ locale: 'ja', booking: BOOKING, contact: WHATSAPP, changed: true, promise: OPEN });
    expect(ja.split('\n')[0]).toBe('仮予約の変更（まだ確定ではありません）');
  });

  it('LINE 이 연락처면 친구 추가 안내와 병원 LINE 링크가 붙는다', () => {
    const block = renderBookingBlock({
      locale: 'ja',
      booking: BOOKING,
      contact: { channel: 'line', handle: 'sakura_0328' },
      changed: false,
      promise: OPEN,
    });
    const lines = block.split('\n');
    expect(lines[lines.length - 2]).toBe('ご予約の確定は、本日中に LINE でお知らせいたします。');
    expect(lines[lines.length - 1]).toBe(
      'LINEでご連絡できるよう、友だち追加のうえ、先に一言メッセージをお送りください：https://line.me/ti/p/VJYu9BSnsX'
    );
    expect(renderBookingBlock({ locale: 'en', booking: BOOKING, contact: WHATSAPP, changed: false, promise: OPEN })).not.toContain(
      'line.me'
    );
  });

  it('날짜가 없으면 빈 글자', () => {
    expect(renderBookingBlock({ locale: 'en', booking: EMPTY_BOOKING, contact: WHATSAPP, changed: false, promise: OPEN })).toBe('');
  });

  it('10개 언어 모두 제목·날짜·연락처·약속 줄이 나온다', () => {
    for (const locale of CHAT_VISITOR_LOCALES) {
      const lines = renderBookingBlock({
        locale,
        booking: BOOKING,
        contact: WHATSAPP,
        changed: false,
        promise: { slot: 'closed', nextBusinessDay: '2026-10-06' },
      }).split('\n');
      expect(lines, locale).toHaveLength(7);
      expect(lines.every((l) => l.trim().length > 0), locale).toBe(true);
      expect(lines[1], locale).toContain('14:00');
      expect(lines[5], locale).toContain('+65 9123 4567');
      expect(lines[6], locale).toContain('WhatsApp');
    }
  });
});

describe('LINE 안내 · "사람인가요?"의 답', () => {
  it('영어·일본어·중국어 — 스펙 부록 B.5 · B.6', () => {
    expect(lineHint('en')).toBe(
      'So that we can reach you on LINE, please add us and send us a message first: https://line.me/ti/p/VJYu9BSnsX'
    );
    expect(identityAnswer('en')).toBe('An automated assistant answers first here, and our team confirms all bookings.');
    expect(identityAnswer('ja')).toBe('こちらではまず自動応答がお答えし、ご予約はすべて当院スタッフが確認いたします。');
    expect(identityAnswer('zh')).toBe('这里先由自动助手为您解答，所有预约均由本院工作人员确认。');
    expect(identityAnswer('zh-TW')).toBe('這裡先由自動助理為您解答，所有預約皆由本院人員確認。');
  });

  it('10개 언어 모두 비어 있지 않다', () => {
    for (const locale of CHAT_VISITOR_LOCALES) {
      expect(identityAnswer(locale).length, locale).toBeGreaterThan(20);
      expect(lineHint(locale), locale).toContain('https://line.me/ti/p/VJYu9BSnsX');
    }
  });
});
