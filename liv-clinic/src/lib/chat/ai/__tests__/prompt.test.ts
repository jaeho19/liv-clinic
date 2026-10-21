import { describe, it, expect } from 'vitest';
import { getKnowledge } from '../knowledge';
import {
  buildDynamicPrompt,
  buildHistory,
  buildStaticPrompt,
  buildSystemPrompt,
  maskAmounts,
  offerStateText,
  type DynamicPromptArgs,
  type HistoryMessage,
} from '../prompt';

const MORNING = new Date('2026-10-02T01:00:00Z');
const EVENING = new Date('2026-10-02T12:00:00Z');
const DYNAMIC: DynamicPromptArgs = {
  locale: 'ja',
  calendarText: '2026-10-02 Fri (today): open 10:00-19:00\n2026-10-03 Sat (tomorrow): open 10:00-16:00',
  nowLine: '2026-10-02 Fri 16:20 — the clinic is open right now.',
  replyPromise: 'today (Korea time)',
  bookingText: 'date: (not given yet)\ncontact: (not given yet)',
};

describe('buildStaticPrompt', () => {
  it('규칙 → 사실 문장 → 가격 줄 순서다', () => {
    const text = buildStaticPrompt(getKnowledge('en', MORNING));
    expect(text.startsWith('You are the chat consultant of LIV Plastic Surgery')).toBe(true);
    const at = (s: string) => text.indexOf(s);
    expect(at('# Prices — you never type an amount')).toBeGreaterThan(0);
    expect(at('# Output')).toBeGreaterThan(at('# Hard rules'));
    expect(at('# CLINIC FACTS (Korean)')).toBeGreaterThan(at('# Output'));
    expect(at('# PRICE ROWS (Korean; amounts exclude VAT)')).toBeGreaterThan(at('# CLINIC FACTS (Korean)'));
    expect(text).toContain('{{P001}} 울쎄라피 프라임 · 상안면 (200~300샷) — KRW 780,000 부터');
    expect(text).toContain('"identity_question": boolean');
  });

  it('보기로 드는 꼬리표는 실제로 없는 것이다 — 모델이 보기를 그대로 베껴도 엉뚱한 금액이 나가지 않게', () => {
    const k = getKnowledge('en', MORNING);
    const text = buildStaticPrompt(k);
    const rules = text.slice(0, text.indexOf('# CLINIC FACTS (Korean)'));
    const examples = [...rules.matchAll(/\{\{([PMF]\d{2,3})\}\}/g)].map((m) => m[1]);
    expect(examples.length).toBeGreaterThan(0);
    for (const id of examples) expect(k.rowById.has(id), id).toBe(false);
  });

  it('검사와 짝이 되는 규칙이 들어 있다 — 꼬리표는 제 줄에, 대괄호 표시는 따라 쓰지 않는다, 주소는 자료에 있는 것만, 시각은 HH:MM', () => {
    const text = buildStaticPrompt(getKnowledge('en', MORNING));
    expect(text).toContain('on a line of its own');
    expect(text).toContain('Text in square brackets in earlier messages');
    expect(text).toContain('starting with https://');
    expect(text).toContain('not in digits and not in words');
    expect(text).toContain('booking.time: 24-hour Korea time written as HH:MM only');
    expect(text).toContain('a fraction of the price');
    expect(text).toContain('only a contact that the visitor wrote in this conversation');
    // "영구적인가요 · 보장하나요 · 최고인가요"에 정직하게 답하는 법 — 검사가 통과시키는 말("not permanent" · "cannot guarantee")을 알려 준다
    expect(text).toContain('You may say that an effect is "not permanent" and that we "cannot guarantee" a result');
  });

  it('같은 날 · 같은 언어면 시각이 달라도 글자 하나까지 같다 (캐시)', () => {
    expect(buildStaticPrompt(getKnowledge('en', MORNING))).toBe(buildStaticPrompt(getKnowledge('en', EVENING)));
  });

  it('시각·달력·손님 정보가 들어 있지 않다', () => {
    const text = buildStaticPrompt(getKnowledge('en', MORNING));
    expect(text).not.toContain('# CALENDAR');
    expect(text).not.toContain('# NOW');
    expect(text).not.toContain('# BOOKING SO FAR');
  });
});

describe('buildDynamicPrompt · buildSystemPrompt', () => {
  it('달력 → 지금 → 약속 → 가예약 → 언어 순서다', () => {
    const text = buildDynamicPrompt(DYNAMIC);
    expect(text).toBe(
      [
        '# CALENDAR (Korea time)',
        '2026-10-02 Fri (today): open 10:00-19:00',
        '2026-10-03 Sat (tomorrow): open 10:00-16:00',
        '',
        '# NOW (Korea time)',
        '2026-10-02 Fri 16:20 — the clinic is open right now.',
        '',
        '# REPLY PROMISE',
        'today (Korea time)',
        '',
        '# BOOKING SO FAR (server record)',
        'date: (not given yet)',
        'contact: (not given yet)',
        '',
        '# VISITOR LANGUAGE',
        "The visitor is on the Japanese site. Write the reply in the language of the visitor's latest message if that language is English, Japanese, Chinese, Vietnamese, Thai, Russian, French, Mongolian, Arabic or Korean. In any other case, or if you cannot tell, use Japanese.",
      ].join('\n')
    );
  });

  it('바뀌지 않는 부분이 앞에 온다', () => {
    const k = getKnowledge('ja', MORNING);
    const system = buildSystemPrompt(k, DYNAMIC);
    const fixed = buildStaticPrompt(k);
    expect(system.startsWith(fixed)).toBe(true);
    expect(system.slice(fixed.length)).toBe(`\n\n${buildDynamicPrompt(DYNAMIC)}`);
  });
});

describe('maskAmounts', () => {
  it('금액은 가리고, 샷 수·날짜·시각은 그대로 둔다', () => {
    expect(maskAmounts('Ulthera 600 shots is KRW 2,200,000 (VAT included)')).toBe('Ulthera 600 shots is [amount] (VAT included)');
    expect(maskAmounts('220만원입니다')).toBe('[amount]입니다');
    expect(maskAmounts('600샷 275만 원 → 이벤트 2,200,000원')).toBe('600샷 [amount] → 이벤트 [amount]');
    expect(maskAmounts('10/14 14:00, 2 people, 300-400 shots')).toBe('10/14 14:00, 2 people, 300-400 shots');
  });

  it('검사(guards)와 같은 식을 쓴다 — 다른 문자의 숫자 · 단위 낱말로 쓴 금액도 가린다', () => {
    expect(maskAmounts('サーマジは２４０万ウォンです')).toBe('サーマジは[amount]です');
    expect(maskAmounts('Около 2,4 млн вон')).toBe('Около [amount]');
    expect(maskAmounts('We have 2 wonderful options')).toBe('We have 2 wonderful options');
  });
});

describe('buildHistory', () => {
  const msg = (patch: Partial<HistoryMessage> & { id: string }): HistoryMessage => ({
    sender: 'visitor',
    source: 'app',
    original_text: '',
    translated_text: null,
    ...patch,
  });

  it('손님 글은 원문, AI 답은 이력용 글, 자동 안내는 보인 글, 직원 글은 표시를 붙이고 금액을 가린다', () => {
    const turns = buildHistory(
      [
        msg({ id: 's1', sender: 'system', original_text: 'Hello! How can we help you today?' }),
        msg({ id: 'v1', original_text: 'How much is Thermage?', translated_text: '써마지 얼마인가요?' }),
        msg({ id: 'a1', sender: 'operator', source: 'ai', original_text: '한국어 번역', translated_text: 'Prices:\n• Thermage: from KRW 2,400,000' }),
        msg({ id: 'v2', original_text: 'Can I get a discount?' }),
        msg({ id: 'k1', sender: 'operator', source: 'auto', original_text: '접수했습니다', translated_text: "We've received your message." }),
        msg({ id: 'v3', original_text: 'ok' }),
        msg({ id: 'o1', sender: 'operator', source: 'slack', original_text: '220만원입니다', translated_text: 'It is KRW 2,200,000.' }),
        msg({ id: 'v4', original_text: 'Thanks. Oct 14?' }),
      ],
      new Map([['a1', 'Prices:\n[price line shown: 써마지 레이저 · 600샷]']])
    );
    expect(turns).toEqual([
      { role: 'user', content: 'How much is Thermage?' },
      { role: 'assistant', content: JSON.stringify({ reply: 'Prices:\n[price line shown: 써마지 레이저 · 600샷]' }) },
      { role: 'user', content: 'Can I get a discount?' },
      { role: 'assistant', content: JSON.stringify({ reply: "We've received your message." }) },
      { role: 'user', content: 'ok' },
      { role: 'assistant', content: JSON.stringify({ reply: '[our staff] It is [amount].' }) },
      { role: 'user', content: 'Thanks. Oct 14?' },
    ]);
  });

  it('이력용 글이 없는 AI 답은 보낸 글의 금액을 가려 넣는다', () => {
    const turns = buildHistory(
      [msg({ id: 'a1', sender: 'operator', source: 'ai', original_text: 'x', translated_text: '• Thermage: from KRW 2,400,000' })],
      new Map()
    );
    expect(turns).toEqual([{ role: 'assistant', content: JSON.stringify({ reply: '• Thermage: from [amount]' }) }]);
  });

  it('같은 쪽의 글이 이어지면 한 차례로 합친다', () => {
    const turns = buildHistory(
      [msg({ id: 'v1', original_text: 'Hello' }), msg({ id: 'v2', original_text: 'Anyone there?' })],
      new Map()
    );
    expect(turns).toEqual([{ role: 'user', content: 'Hello\nAnyone there?' }]);
  });

  it('최근 글만 넣는다', () => {
    const many = Array.from({ length: 40 }, (_, i) => msg({ id: `v${i}`, original_text: `m${i}` }));
    const turns = buildHistory(many, new Map(), 30);
    expect(turns).toHaveLength(1);
    expect(turns[0].content.split('\n')).toHaveLength(30);
    expect(turns[0].content.startsWith('m10')).toBe(true);
  });

  it('번역이 없는 직원 글은 원문을 쓴다. 빈 글은 넣지 않는다', () => {
    const turns = buildHistory(
      [
        msg({ id: 'o1', sender: 'operator', source: 'app', original_text: '내일 오전에 연락드리겠습니다', translated_text: null }),
        msg({ id: 'v1', original_text: '   ' }),
      ],
      new Map()
    );
    expect(turns).toEqual([{ role: 'assistant', content: JSON.stringify({ reply: '[our staff] 내일 오전에 연락드리겠습니다' }) }]);
  });
});

describe('제안형 응대 (스펙 2026-10-12 §4.1 · §4.2)', () => {
  it('켜져 있을 때만 제안 규칙 · OFFER ROWS · 반응 출력 칸이 들어간다', () => {
    const on = buildStaticPrompt(getKnowledge('en', MORNING, { offers: true }));
    const off = buildStaticPrompt(getKnowledge('en', MORNING));
    expect(on).toContain('# Suggestions — OFFER ROWS');
    expect(on).toContain('# OFFER ROWS (Korean)');
    expect(on).toContain('"reaction": "R1"|"R2"|"R3"|"R4"|"R5"|"R6"|"R7"|null, "offer_declined": boolean');
    expect(on.indexOf('# OFFER ROWS (Korean)')).toBeGreaterThan(on.indexOf('# PRICE ROWS'));
    expect(off).not.toContain('OFFER ROWS');
    expect(off).not.toContain('"reaction"');
    // 어느 쪽이든 혜택은 {{B01}} 로, 시술이 있는지 물으면 한 줄 소개를 붙인다
    for (const p of [on, off]) {
      expect(p).toContain('by writing the tag {{B01}} on a line of its own');
      expect(p).toContain('시술 한 줄 소개');
    }
  });

  it('보기로 드는 제안 꼬리표 {{C00}} 은 실제로 없다', () => {
    const k = getKnowledge('en', MORNING, { offers: true });
    expect(k.offerById.has('C00')).toBe(false);
  });

  it('OFFER STATE: 첫 답 · 거절 · 남은 수 · 혜택 문장이 나갔는지', () => {
    const base = { offersOn: true, sentReplies: 0, benefitShown: false, declined: false, shownOffers: [], maxOffers: 2 };
    expect(offerStateText(base)).toBe(
      'The direct-booking benefit ({{B01}}) has not been shown yet in this conversation.\nThis is your first reply in this conversation: do not use any suggestion tag.'
    );
    expect(offerStateText({ ...base, sentReplies: 2, declined: true })).toContain('The visitor declined suggestions');
    expect(
      offerStateText({ ...base, sentReplies: 2, benefitShown: true, shownOffers: [{ id: 'C01', label: '스컬트라 — first' }] })
    ).toBe(
      [
        'The direct-booking benefit ({{B01}}) was already shown in this conversation. Write it again only if the visitor asks about the benefit or a discount.',
        'Suggestions already shown: 스컬트라 — first ({{C01}}).',
        'Suggestions you may still make in this conversation: 1 (at most one per reply).',
      ].join('\n')
    );
    expect(offerStateText({ ...base, offersOn: false, sentReplies: 3 })).toBe(
      'The direct-booking benefit ({{B01}}) has not been shown yet in this conversation.'
    );
  });

  it('OFFER STATE 는 바뀌는 부분(가예약 뒤 · 언어 앞)에 들어간다', () => {
    const text = buildDynamicPrompt({ ...DYNAMIC, offerStateText: 'STATE' });
    expect(text.indexOf('# OFFER STATE\nSTATE')).toBeGreaterThan(text.indexOf('# BOOKING SO FAR'));
    expect(text.indexOf('# VISITOR LANGUAGE')).toBeGreaterThan(text.indexOf('# OFFER STATE'));
    expect(buildDynamicPrompt(DYNAMIC)).not.toContain('# OFFER STATE');
  });
});
