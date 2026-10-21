import { describe, it, expect } from 'vitest';
import { getKnowledge } from '../knowledge';
import { applyOfferCaps, EMPTY_OFFER_HISTORY, type OfferCapArgs, type OfferHistory } from '../offerCaps';

// 제안 횟수 상한 (스펙 2026-10-12 chat-ai-guided-offers §4.5)

const K = getKnowledge('en', new Date('2026-10-20T05:00:00Z'), { offers: true });
const offerId = (key: string) => K.offers.find((o) => o.key === key)!.id;
const priceId = (key: string) => K.rows.find((r) => r.key === key)!.id;
const SCULPTRA_1 = offerId('sculptra.first');
const SCULPTRA_2 = offerId('sculptra.second');
const ULTHERA_1 = offerId('ulthera.first');
const ULTHERA_LIGHT = offerId('ulthera.lighter');

const AFTER_FIRST: OfferHistory = { ...EMPTY_OFFER_HISTORY, sentReplies: 1 };

const args = (patch: Partial<OfferCapArgs>): OfferCapArgs => ({
  reply: 'Hello',
  offersOn: true,
  offerById: K.offerById,
  rowById: K.rowById,
  history: AFTER_FIRST,
  reaction: 'R1',
  offerDeclined: false,
  bookingSummary: false,
  ...patch,
});

describe('applyOfferCaps', () => {
  it('관심(R1) · 두 번째 답이면 제안 하나가 남는다', () => {
    const r = applyOfferCaps(args({ reply: `Yes.\n{{${SCULPTRA_1}}}\nWhat date?` }));
    expect(r.reply).toBe(`Yes.\n{{${SCULPTRA_1}}}\nWhat date?`);
    expect(r.offers.map((o) => o.key)).toEqual(['sculptra.first']);
    expect(r.dropped).toEqual([]);
  });

  it('그 대화의 첫 답에는 제안이 없다 — 혜택 문장은 남는다', () => {
    const r = applyOfferCaps(args({ reply: `Yes, we offer Sculptra.\n{{B01}}\n{{${SCULPTRA_1}}}\nWhen?`, history: EMPTY_OFFER_HISTORY }));
    expect(r.reply).toBe('Yes, we offer Sculptra.\n{{B01}}\nWhen?');
    expect(r.benefit).toBe(true);
    expect(r.dropped).toEqual([`${SCULPTRA_1}:first_reply`]);
  });

  it('한 답에 제안은 하나 — 둘째부터 지운다', () => {
    const r = applyOfferCaps(args({ reply: `{{${SCULPTRA_1}}}\n{{${SCULPTRA_2}}}` }));
    expect(r.offers).toHaveLength(1);
    expect(r.dropped).toEqual([`${SCULPTRA_2}:per_reply`]);
  });

  it('한 대화에 둘까지, 이미 보인 것은 다시 보이지 않는다', () => {
    const two: OfferHistory = { ...AFTER_FIRST, shownOfferKeys: new Set(['sculptra.first', 'sculptra.second']) };
    expect(applyOfferCaps(args({ reply: `{{${ULTHERA_1}}}`, history: two })).dropped).toEqual([`${ULTHERA_1}:per_conversation`]);
    const one: OfferHistory = { ...AFTER_FIRST, shownOfferKeys: new Set(['sculptra.first']) };
    expect(applyOfferCaps(args({ reply: `{{${SCULPTRA_1}}}`, history: one })).dropped).toEqual([`${SCULPTRA_1}:already_shown`]);
  });

  it('거절 뒤에는 제안 0 — 이번 답에서 거절해도 같다', () => {
    const declined: OfferHistory = { ...AFTER_FIRST, declined: true };
    expect(applyOfferCaps(args({ reply: `{{${SCULPTRA_1}}}`, history: declined })).offers).toEqual([]);
    expect(applyOfferCaps(args({ reply: `{{${SCULPTRA_1}}}`, offerDeclined: true })).dropped).toEqual([`${SCULPTRA_1}:declined`]);
  });

  it('가격 부담(R2)은 저부담 대안만 — 조합 줄은 지운다', () => {
    const light = applyOfferCaps(args({ reply: `{{${ULTHERA_LIGHT}}}`, reaction: 'R2' }));
    expect(light.offers.map((o) => o.key)).toEqual(['ulthera.lighter']);
    const combo = applyOfferCaps(args({ reply: `{{${ULTHERA_1}}}`, reaction: 'R2' }));
    expect(combo.dropped).toEqual([`${ULTHERA_1}:reaction_R2`]);
  });

  it('의료 · 흥정 · 유보 · 거절 · 예약 분명 · 반응 모름에는 제안 0', () => {
    for (const reaction of ['R3', 'R4', 'R5', 'R6', 'R7', null] as const) {
      const r = applyOfferCaps(args({ reply: `{{${SCULPTRA_1}}}`, reaction }));
      expect(r.dropped, String(reaction)).toEqual([`${SCULPTRA_1}:reaction_${reaction ?? 'none'}`]);
    }
  });

  it('앞 답들에서 금액 줄을 다 보인 제안 ①은 같은 시술의 제안 ②로 바꾼다 (울쎄라 가격을 물을 때 이달 구성이 이미 나갔다 — 재생 o16)', () => {
    const ULTHERA_2 = offerId('ulthera.second');
    const shown: OfferHistory = { ...AFTER_FIRST, shownPriceKeys: new Set(['promo.2026-10.19']) };
    const r = applyOfferCaps(args({ reply: `Yes.\n{{${ULTHERA_1}}}\nWhen?`, history: shown }));
    expect(r.reply).toBe(`Yes.\n{{${ULTHERA_2}}}\nWhen?`);
    expect(r.offers.map((o) => o.key)).toEqual(['ulthera.second']);
    expect(r.dropped).toEqual([`${ULTHERA_1}:prices_already_shown>${ULTHERA_2}`]);
    // ②도 이미 보였으면 바꾸지 않고 지운다
    const both: OfferHistory = { ...shown, shownOfferKeys: new Set(['ulthera.second']) };
    expect(applyOfferCaps(args({ reply: `{{${ULTHERA_1}}}`, history: both })).dropped).toEqual([`${ULTHERA_1}:prices_already_shown`]);
    // 같은 답에서 금액 줄로 직접 보였으면 바꾸지 않고 지운다(한 답에 제안 하나)
    const same = applyOfferCaps(args({ reply: `{{${priceId('promo.2026-10.19')}}}\n{{${ULTHERA_1}}}` }));
    expect(same.dropped).toEqual([`${ULTHERA_1}:prices_in_reply`]);
    expect(same.offers).toEqual([]);
  });

  it('혜택 문장: 바로 앞 답에 있었거나 가예약 요약이 붙으면 지운다, 한 답에 한 번', () => {
    expect(applyOfferCaps(args({ reply: '{{B01}}', history: { ...AFTER_FIRST, benefitInLastReply: true } })).dropped).toEqual([
      'B01:benefit_repeat',
    ]);
    expect(applyOfferCaps(args({ reply: '{{B01}}', bookingSummary: true })).dropped).toEqual(['B01:benefit_in_summary']);
    expect(applyOfferCaps(args({ reply: '{{B01}}\n{{B01}}' })).dropped).toEqual(['B01:duplicate']);
  });

  it('같은 답에서 그 구성의 금액 줄을 하나라도 직접 보였으면 제안하지 않는다 — 같은 줄이 두 번 나가지 않게 (재생 o18)', () => {
    const contour = priceId('botox.botoxContour.domestic');
    const r = applyOfferCaps(args({ reply: `Filler prices:\n{{${contour}}}\n{{${offerId('filler.first')}}}` }));
    expect(r.reply).toBe(`Filler prices:\n{{${contour}}}`);
    expect(r.dropped).toEqual([`${offerId('filler.first')}:prices_in_reply`]);
  });

  it('지운 꼬리표를 이끄는 말(쌍점으로 끝나는 바로 앞 문장)도 지운다 — 뒤가 빈 글이 나가지 않게. 앞 문장은 남는다', () => {
    const r = applyOfferCaps(
      args({ reply: `We understand. There is a first-visit option you may wish to consider:\n{{${ULTHERA_1}}}\nOur team will send a quote.`, reaction: 'R2' })
    );
    expect(r.reply).toBe('We understand.\nOur team will send a quote.');
    expect(r.dropped).toEqual([`${ULTHERA_1}:reaction_R2`, 'lead_in_line']);
    // 문장이 하나뿐이면 줄을 지운다
    const one = applyOfferCaps(args({ reply: `Here is an option:\n{{${ULTHERA_1}}}\nOK?`, reaction: 'R2' }));
    expect(one.reply).toBe('OK?');
    // 쌍점으로 끝나지 않는 앞 줄은 그대로
    const kept = applyOfferCaps(args({ reply: `We understand.\n{{${ULTHERA_1}}}\nOK?`, reaction: 'R2' }));
    expect(kept.reply).toBe('We understand.\nOK?');
  });

  it('남긴 제안 바로 앞의 이끄는 말도 지운다 — 프로그램의 앞 문장과 겹치지 않게 (재생 o17)', () => {
    const r = applyOfferCaps(
      args({ reply: `Понимаем, что стоимость важна. Можно рассмотреть более доступные варианты:\n{{${ULTHERA_LIGHT}}}\nНаша команда пришлёт предложение.`, reaction: 'R2' })
    );
    expect(r.reply).toBe(`Понимаем, что стоимость важна.\n{{${ULTHERA_LIGHT}}}\nНаша команда пришлёт предложение.`);
    expect(r.dropped).toEqual(['lead_in_replaced']);
    // 금액 줄 꼬리표 줄이나 혜택 문장 앞은 건드리지 않는다
    const priced = applyOfferCaps(args({ reply: `Prices:\n{{${priceId('ulthera.name.fullFace')}}}\n{{B01}}` }));
    expect(priced.reply).toBe(`Prices:\n{{${priceId('ulthera.name.fullFace')}}}\n{{B01}}`);
  });

  it('제안형 응대가 꺼져 있으면 제안 줄은 모두 지우고 혜택 문장은 남긴다', () => {
    const r = applyOfferCaps(args({ reply: `{{B01}}\n{{${SCULPTRA_1}}}`, offersOn: false }));
    expect(r.reply).toBe('{{B01}}');
    expect(r.dropped).toEqual([`${SCULPTRA_1}:off`]);
  });
});
