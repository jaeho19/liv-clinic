import { describe, it, expect } from 'vitest';
import { assembleReply, MAX_ASSEMBLED_CHARS, type AssembleArgs } from '../assemble';
import { EMPTY_BOOKING, type BookingFields } from '../booking';
import { getKnowledge } from '../knowledge';

const NOW = new Date('2026-10-02T07:20:00Z');
const K = getKnowledge('en', NOW);
const idOf = (key: string) => K.rows.find((r) => r.key === key)!.id;
const THERMAGE = idOf('thermage.name.shot600');
const PROMO = idOf('promo.2026-10.20');
const FEE = idOf('fee.consult');

const BOOKING: BookingFields = { ...EMPTY_BOOKING, date: '2026-10-14', time: '14:00', partySize: 2, name: 'Emma' };
const WHATSAPP = { channel: 'whatsapp' as const, handle: '+65 9123 4567' };
const base: AssembleArgs = {
  locale: 'en',
  reply: 'Hello!',
  rowById: K.rowById,
  identityQuestion: false,
  bookingEvent: null,
  booking: EMPTY_BOOKING,
  contact: null,
  promise: { slot: 'open', nextBusinessDay: null },
};

describe('assembleReply — 금액 줄', () => {
  it('꼬리표가 없으면 글이 그대로 나간다', () => {
    const a = assembleReply({ ...base, reply: 'Hello!\nHow can we help?' });
    expect(a).toEqual({
      text: 'Hello!\nHow can we help?',
      historyText: 'Hello!\nHow can we help?',
      usedRows: [],
      usedOffers: [],
      shownKeys: [],
    });
  });

  it('꼬리표 자리에 금액 줄이 들어가고, 마지막 금액 줄 아래에 금액 안내가 한 번 붙는다', () => {
    const a = assembleReply({
      ...base,
      reply: `Here are the regular and promotion options:\n{{${THERMAGE}}}\n{{${PROMO}}}\nWhat date would you prefer?`,
    });
    expect(a.text).toBe(
      [
        'Here are the regular and promotion options:',
        '• Thermage Laser · 600 shots: from KRW 2,400,000 (KRW 2,640,000 incl. VAT)',
        "• Thermage FLX 600 shots + ONDA Lifting 30kJ + LDM care (this month's promotion, until Oct 31): KRW 2,200,000 (KRW 2,420,000 incl. VAT)",
        'The amounts above are approximate, not final.',
        'What date would you prefer?',
      ].join('\n')
    );
    expect(a.usedRows.map((r) => r.key)).toEqual(['thermage.name.shot600', 'promo.2026-10.20']);
  });

  it('이력용 글에는 금액이 없고 가격 줄의 한국어 이름만 남는다', () => {
    const a = assembleReply({ ...base, reply: `Prices:\n{{${THERMAGE}}}\nOK?` });
    expect(a.historyText).toBe('Prices:\n[price line shown: 써마지 레이저 · 600샷]\nOK?');
    expect(a.historyText).not.toMatch(/KRW|\d{1,3},\d{3}/);
  });

  it('문장 안에 섞인 꼬리표는 문장 아래의 금액 줄로 옮긴다', () => {
    const a = assembleReply({ ...base, reply: `The consultation fee is {{${FEE}}} and it is deducted on the day.` });
    // 상담비 줄에는 부가세 포함 금액도, "대략적인 금액" 안내도 붙지 않는다
    expect(a.text.split('\n')).toEqual([
      'The consultation fee is and it is deducted on the day.',
      '• 1:1 consultation fee (fully deducted from the procedure cost if a procedure is received the same day): KRW 10,000',
    ]);
  });

  it('상담비 줄과 시술 금액 줄이 함께 있으면 금액 안내는 마지막 시술 금액 줄 아래에 붙는다', () => {
    const a = assembleReply({ ...base, reply: `{{${THERMAGE}}}\n{{${FEE}}}\nOK?` });
    const lines = a.text.split('\n');
    expect(lines[0]).toContain('KRW 2,400,000');
    expect(lines[1]).toBe('The amounts above are approximate, not final.');
    expect(lines[2]).toContain('KRW 10,000');
    expect(lines[3]).toBe('OK?');
  });

  it('글머리표만 남은 줄은 버리고, 같은 꼬리표를 잇달아 쓰면 한 번만 보여 준다', () => {
    const a = assembleReply({ ...base, reply: `• {{${THERMAGE}}}\n• {{${THERMAGE}}}\nThanks` });
    expect(a.text.split('\n')).toHaveLength(3); // 금액 줄 · 금액 안내 · Thanks
    expect(a.usedRows).toHaveLength(1);
  });

  it('번호·가운뎃점만 남은 줄도 버린다', () => {
    const a = assembleReply({ ...base, reply: `1. {{${THERMAGE}}}\n2) {{${PROMO}}}\n・{{${FEE}}}\nThanks` });
    const lines = a.text.split('\n');
    expect(lines).toHaveLength(5); // 금액 줄 둘 · 금액 안내 · 상담비 줄 · Thanks
    expect(lines.every((l) => l.startsWith('• ') || l.startsWith('The amounts above') || l === 'Thanks')).toBe(true);
  });

  it('같은 꼬리표를 떨어진 자리에 다시 쓰면 다시 보여 준다 — 소제목 아래가 비지 않게. 쓰인 가격 줄에는 한 번만 넣는다', () => {
    const a = assembleReply({
      ...base,
      reply: `Regular price:\n{{${THERMAGE}}}\nFor comparison with the promotion:\n{{${PROMO}}}\n{{${THERMAGE}}}`,
    });
    expect(a.text.match(/Thermage Laser · 600 shots: from KRW 2,400,000/g)).toHaveLength(2);
    expect(a.usedRows.map((r) => r.key)).toEqual(['thermage.name.shot600', 'promo.2026-10.20']);
    expect(a.text.match(/The amounts above/g)).toHaveLength(1);
  });

  it('없는 꼬리표는 조용히 버린다(검사를 통과했다면 일어나지 않는다)', () => {
    const a = assembleReply({ ...base, reply: 'Price:\n{{P999}}\nBye' });
    expect(a.text).toBe('Price:\nBye');
    expect(a.usedRows).toEqual([]);
  });

  it('부가세 표기 규칙을 넘기면 그 규칙으로 그린다', () => {
    const a = assembleReply({ ...base, reply: `{{${THERMAGE}}}`, vat: 'excluded' });
    expect(a.text).toBe(
      '• Thermage Laser · 600 shots: from KRW 2,400,000\nPrices exclude VAT. The amounts above are approximate, not final.'
    );
  });

  it('손님 언어의 이름과 문구로 그린다', () => {
    const ja = getKnowledge('ja', NOW);
    const a = assembleReply({ ...base, locale: 'ja', rowById: ja.rowById, reply: `料金はこちらです。\n{{${THERMAGE}}}` });
    const lines = a.text.split('\n');
    expect(lines[1]).toMatch(/^• .+：KRW 2,400,000〜（税込 KRW 2,640,000）$/);
    expect(lines[2]).toBe('上記は確定金額ではなく、おおよその金額です。');
  });
});

describe('assembleReply — 정체 답 · 가예약 요약', () => {
  it('정체를 물었으면 맨 앞에 정해진 문장이 붙는다', () => {
    const a = assembleReply({ ...base, reply: 'How can we help you today?', identityQuestion: true });
    expect(a.text).toBe(
      'An automated assistant answers first here, and our team confirms all bookings.\nHow can we help you today?'
    );
    expect(a.historyText.split('\n')[0]).toBe(
      '[told the visitor that an automated assistant answers first and that our team confirms all bookings]'
    );
  });

  it('가예약이 처음 찼으면 맨 끝에 요약과 확정 약속이 붙는다', () => {
    const a = assembleReply({ ...base, reply: 'Thank you, Emma.', bookingEvent: 'requested', booking: BOOKING, contact: WHATSAPP });
    expect(a.text).toBe(
      [
        'Thank you, Emma.',
        '',
        'Tentative booking (not yet confirmed)',
        '• Date: Wed, Oct 14, 2026 · 14:00 (Korea time)',
        '• Guests: 2',
        '• Name: Emma',
        '• Contact: WhatsApp +65 9123 4567',
        'We will send your booking confirmation today via WhatsApp.',
      ].join('\n')
    );
    expect(a.historyText).toBe(
      'Thank you, Emma.\n[tentative booking summary shown (new): 10/14(수) 14:00; told the visitor when we will send the confirmation]'
    );
  });

  it('바뀐 가예약은 제목과 이력 표시가 다르다', () => {
    const a = assembleReply({ ...base, reply: 'Noted.', bookingEvent: 'changed', booking: BOOKING, contact: WHATSAPP });
    expect(a.text).toContain('Updated tentative booking (not yet confirmed)');
    expect(a.historyText).toContain('summary shown (updated)');
  });

  it('알릴 일이 없거나 연락처가 없으면 요약을 붙이지 않는다', () => {
    expect(assembleReply({ ...base, reply: 'Hi', booking: BOOKING, contact: WHATSAPP }).text).toBe('Hi');
    expect(assembleReply({ ...base, reply: 'Hi', bookingEvent: 'requested', booking: BOOKING, contact: null }).text).toBe('Hi');
  });

  it('금액 줄 · 정체 답 · 가예약 요약이 함께 있어도 순서는 정체 답 → 글(금액 줄) → 요약', () => {
    const a = assembleReply({
      ...base,
      reply: `Price:\n{{${THERMAGE}}}`,
      identityQuestion: true,
      bookingEvent: 'requested',
      booking: BOOKING,
      contact: WHATSAPP,
    });
    const text = a.text;
    expect(text.indexOf('An automated assistant')).toBe(0);
    expect(text.indexOf('KRW 2,400,000')).toBeGreaterThan(text.indexOf('Price:'));
    expect(text.indexOf('Tentative booking')).toBeGreaterThan(text.indexOf('The amounts above'));
    expect(text.length).toBeLessThan(MAX_ASSEMBLED_CHARS);
  });
});

describe('assembleReply — 제안 줄 · 혜택 문장 (제안형 응대)', () => {
  const KO = getKnowledge('en', NOW, { offers: true });
  const offer = (key: string) => KO.offers.find((o) => o.key === key)!;
  const withOffers: AssembleArgs = {
    ...base,
    rowById: KO.rowById,
    offerById: KO.offerById,
    benefitText: 'BENEFIT SENTENCE',
  };

  it('{{C…}} 자리에 앞 문장 · 그 구성의 금액 줄 · 금액 안내 · 마지막 문장이 들어간다', () => {
    const c = offer('sculptra.first');
    const a = assembleReply({ ...withOffers, reply: `We will confirm the Sculptra price.\n{{${c.id}}}\nWhat time works for you?` });
    expect(a.text).toBe(
      [
        'We will confirm the Sculptra price.',
        "Sculptra can be combined with a lifting treatment such as Ultherapy Prime or Thermage at the same consultation. This month's set:",
        "• Ultherapy Prime 300 shots + ONDA Lifting 60kJ + calming pack (this month's promotion, until Oct 31): KRW 1,590,000 (KRW 1,749,000 incl. VAT)",
        'The amounts above are approximate, not final.',
        'Which combination suits you is decided by the doctor at the consultation.',
        'What time works for you?',
      ].join('\n')
    );
    expect(a.usedOffers).toEqual([c]);
    expect(a.shownKeys).toEqual(['sculptra.first', 'promo.2026-10.19']);
    expect(a.historyText).toContain('[suggestion shown: 스컬트라 — first]');
    expect(a.historyText).toContain('[price line shown: [리프팅] 울쎄라피 프라임 300샷 + 온다리프팅 60kJ + 진정팩]');
    expect(a.historyText).not.toMatch(/1,590,000/);
  });

  it('가격 부담 줄은 "할인은 더 드릴 수 없다"로 시작하고 예산 문장으로 끝난다', () => {
    const a = assembleReply({ ...withOffers, reply: `{{${offer('ulthera.lighter').id}}}` });
    const lines = a.text.split('\n');
    expect(lines[0]).toBe('We are not able to add a further discount here. Lighter options include:');
    expect(lines[lines.length - 1]).toBe('The doctor will go through what fits your budget and your concerns at the consultation.');
  });

  it('{{B01}} 자리에 혜택 문장이 한 번 들어간다', () => {
    const a = assembleReply({ ...withOffers, reply: 'Yes, we offer Sculptra.\n{{B01}}\nWhen are you visiting?' });
    expect(a.text).toBe('Yes, we offer Sculptra.\nBENEFIT SENTENCE\nWhen are you visiting?');
    expect(a.historyText).toContain('[direct-booking benefit sentence shown]');
    expect(a.shownKeys).toEqual(['benefit']);
  });

  it('가예약 요약 아래 · 확정 약속 앞에 혜택 한 줄이 붙는다', () => {
    const a = assembleReply({
      ...withOffers,
      reply: 'Thank you, Emma.',
      bookingEvent: 'requested',
      booking: BOOKING,
      contact: WHATSAPP,
      benefitLine: 'BENEFIT LINE',
    });
    const lines = a.text.split('\n');
    expect(lines[lines.length - 2]).toBe('BENEFIT LINE');
    expect(lines[lines.length - 1]).toBe('We will send your booking confirmation today via WhatsApp.');
    expect(a.shownKeys).toContain('benefit-line');
    expect(a.historyText).toContain('and the direct-booking benefit]');
  });
});
