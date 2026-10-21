import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import type { VisitorLocale } from '@/lib/chat/chatApi';
import { FIRST_VISIT_TRIALS } from '@/lib/firstVisitTrial';
import { getKnowledge } from '../knowledge';
import {
  BENEFIT_MIN_KRW,
  benefitBookingLine,
  benefitKo,
  benefitSentence,
  getOffers,
  OFFER_SOURCES,
  offerClosing,
  offerKo,
  offerLead,
} from '../knowledge/offers';
import { BASE_PRICE_ROWS } from '../knowledge/priceRows.base.generated';
import { EXTRA_PRICE_ROWS } from '../knowledge/priceRows.extra';
import { TRIAL_PRICE_ROWS } from '../knowledge/priceRows.trial';
import { STAFF_ONLY_KEYS } from '../knowledge/scope';

// 제안형 응대의 자료 검사 (스펙 2026-10-12 chat-ai-guided-offers §4.7) — 대표원장님 회신(2026-10-20)을 옮긴 자료가 맞는지 본다.

const OCT_20 = new Date('2026-10-20T05:00:00Z'); // 화요일 14:00 KST
const NOV_2 = new Date('2026-11-02T01:00:00Z');
const LOCALES: VisitorLocale[] = ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

describe('첫방문 체험가 줄 (생성 파일)', () => {
  type FirstVisit = { title: string; items: Record<string, { name: string }> };
  /** messages/<언어>.json 에서 firstVisit 묶음(trialOnceNote 가 있는 객체)을 찾는다 — 생성 스크립트와 같은 방법 */
  const firstVisitOf = (locale: string): FirstVisit => {
    const stack: unknown[] = [JSON.parse(readFileSync(path.join(process.cwd(), 'src/messages', `${locale}.json`), 'utf8'))];
    while (stack.length > 0) {
      const o = stack.pop();
      if (o && typeof o === 'object') {
        if ('trialOnceNote' in o) return o as unknown as FirstVisit;
        stack.push(...Object.values(o));
      }
    }
    throw new Error(`firstVisit not found: ${locale}`);
  };

  it('홈페이지 체험가(firstVisitTrial.ts)와 하나씩 맞는다 — 어긋나면 node scripts/chat-ai-build-trial-rows.mjs 를 다시 돌린다', () => {
    const ko = firstVisitOf('ko');
    const byLocale = Object.fromEntries(LOCALES.map((l) => [l, firstVisitOf(l)]));
    expect(TRIAL_PRICE_ROWS.map((r) => ({ key: r.key, amount: r.amount, labelKo: r.labelKo, labels: r.labels }))).toEqual(
      FIRST_VISIT_TRIALS.map((item) => ({
        key: `trial.${item.id}`,
        amount: item.trialPrice,
        labelKo: `첫방문 체험가 · ${ko.items[item.id].name}`,
        labels: Object.fromEntries(LOCALES.map((l) => [l, `${byLocale[l].title} · ${byLocale[l].items[item.id].name}`])),
      }))
    );
    expect(TRIAL_PRICE_ROWS.every((r) => r.group === 'trial' && r.unit === 'fixed' && !r.validFrom && !r.validUntil)).toBe(true);
  });
});

describe('제안 줄 자료', () => {
  it('제안 줄이 가리키는 가격 줄은 모두 실제로 있고, 직원에게 넘기는 줄이 아니다 (없으면 그 제안이 조용히 빠진다)', () => {
    const keys = new Set([...BASE_PRICE_ROWS, ...EXTRA_PRICE_ROWS, ...TRIAL_PRICE_ROWS].map((r) => r.key));
    for (const source of OFFER_SOURCES) {
      for (const key of source.rowKeys) {
        expect(keys.has(key), `${source.key} → ${key}`).toBe(true);
        expect(STAFF_ONLY_KEYS.has(key), `${source.key} → ${key}`).toBe(false);
      }
    }
  });

  it('key 는 `시술.first|second|lighter` 꼴이고 가격 줄 key 와 겹치지 않는다 — 측정 SQL(chat-ai-metrics.mjs)이 이 꼴로 제안 줄을 고른다', () => {
    const SHAPE = /\.(first|second|lighter)$/;
    for (const source of OFFER_SOURCES) expect(source.key, source.key).toBe(`${source.key.split('.')[0]}.${source.slot}`);
    for (const row of [...BASE_PRICE_ROWS, ...EXTRA_PRICE_ROWS, ...TRIAL_PRICE_ROWS]) expect(row.key, row.key).not.toMatch(SHAPE);
    expect(OFFER_SOURCES.every((o) => SHAPE.test(o.key))).toBe(true);
  });

  it('key 는 겹치지 않고, 시술마다 제안 ①·②·가격 부담이 한 줄씩까지다', () => {
    expect(new Set(OFFER_SOURCES.map((o) => o.key)).size).toBe(OFFER_SOURCES.length);
    const slots = new Set(OFFER_SOURCES.map((o) => `${o.forKo}|${o.slot}`));
    expect(slots.size).toBe(OFFER_SOURCES.length);
  });

  it('10월 20일: 37줄이 모두 나가고 꼬리표는 C01부터 순서대로', () => {
    const k = getKnowledge('en', OCT_20, { offers: true });
    expect(k.offers).toHaveLength(37);
    expect(k.offers.map((o) => o.id).slice(0, 3)).toEqual(['C01', 'C02', 'C03']);
    expect(k.offerById.get('C01')?.key).toBe('sculptra.first');
    expect(k.offerText).toContain('{{C01}} first suggestion — 함께 보이는 금액 줄: [리프팅] 울쎄라피 프라임 300샷 + 온다리프팅 60kJ + 진정팩');
  });

  it('11월: 10월 프로모션에 기대던 제안은 저절로 빠지고, 가격표 · 체험가에 기대는 것만 남는다', () => {
    const k = getKnowledge('en', NOV_2, { offers: true });
    expect(k.offers.map((o) => o.key)).toEqual([
      'ulthera.lighter',
      'thermage.lighter',
      'density.lighter',
      'shurink.lighter',
      'thread.lighter',
      'filler.first',
      'filler.lighter',
      'skinbooster.second',
      'skincare.lighter',
      'hairRemoval.second',
      'concern.lighter',
    ]);
  });

  it('꺼져 있으면 체험가 줄 · 제안 줄이 없고, 사실 문장은 10/2 와 같은 뜻(5% 만)', () => {
    const k = getKnowledge('en', OCT_20);
    expect(k.offersOn).toBe(false);
    expect(k.offers).toEqual([]);
    expect(k.offerText).toBe('');
    expect(k.rows.some((r) => r.group === 'trial')).toBe(false);
    expect(k.factsText).toContain('첫방문 체험가는 말하지 않는다');
    expect(k.factsText).not.toContain('피부관리(크라이오');
  });

  it('켜져 있으면 체험가 10줄(T01~T10)과 채팅 예약 혜택 규칙이 들어간다', () => {
    const k = getKnowledge('en', OCT_20, { offers: true });
    const trial = k.rows.filter((r) => r.group === 'trial');
    expect(trial.map((r) => r.id)).toEqual(['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10']);
    expect(k.priceText).toContain('## 첫방문 1회 체험가 (처음 방문하는 손님만, 1회)');
    expect(k.factsText).toContain('반드시 꼬리표 {{B01}}');
    expect(k.factsText).toContain('다른 사은 행사와 겹쳐 받을 수 없다');
    // 사실 문장에는 금액을 적지 않는다(기준 금액은 문장 B01 안에만)
    expect(k.factsText).not.toMatch(/30\s?만|300,000/);
  });

  it('제안 문장 · 마지막 문장은 10개 언어 모두 그 언어로 쓰여 있고(영어로 대신 나가지 않는다), 쌍점으로 끝난다', () => {
    for (const source of OFFER_SOURCES) {
      for (const locale of LOCALES) {
        const lead = offerLead(source, locale);
        expect(lead.length, `${source.key} ${locale}`).toBeGreaterThan(0);
        expect(lead, `${source.key} ${locale}`).toMatch(/[:：]$/);
        if (locale !== 'en') {
          expect(lead, `${source.key} ${locale}`).not.toBe(offerLead(source, 'en'));
          expect(offerClosing(source, locale), `${source.key} ${locale}`).not.toBe(offerClosing(source, 'en'));
        }
      }
    }
  });

  it('제안 문장은 그 언어의 글자로 쓰여 있다 — 다른 언어 문장이 잘못 들어가지 않았다', () => {
    const SCRIPT: Partial<Record<VisitorLocale, RegExp>> = {
      ja: /[぀-ヿ]/,
      th: /[฀-๿]/,
      ru: /[Ѐ-ӿ]/,
      mn: /[өүӨҮ]|багц|энэ сар/,
      ar: /[؀-ۿ]/,
      vi: /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i,
      fr: /\b(de|du|des|le|la|les|avec|pour)\b/,
    };
    for (const source of OFFER_SOURCES) {
      if (!source.lead) continue;
      for (const [locale, re] of Object.entries(SCRIPT) as [VisitorLocale, RegExp][]) {
        expect(source.lead[locale], `${source.key} ${locale}`).toMatch(re);
      }
      // 러시아어 문장에 몽골어 글자가 섞이지 않았다
      expect(source.lead.ru, source.key).not.toMatch(/[өүӨҮ]/);
    }
  });
});

describe('채팅 예약 혜택 문장', () => {
  it('켜져 있으면 5% + 기준 금액 · 피부관리 또는 수액 · 체험가 제외 · 방문한 날 선택', () => {
    expect(BENEFIT_MIN_KRW).toBe(300_000);
    const en = benefitSentence('en', true);
    expect(en).toBe(
      'If you book through this chat and pay at your visit, you get 5% off. If your payment that day is KRW 300,000 or more (excl. VAT), you can also have one complimentary skin-care session or IV drip per person — you choose which on the day (first-visit trial prices excluded).'
    );
    for (const locale of LOCALES) {
      expect(benefitSentence(locale, true), locale).toContain('KRW 300,000');
      expect(benefitSentence(locale, true), locale).toContain('5');
    }
  });

  it('꺼져 있으면 5%만 — 무료 서비스는 말하지 않는다', () => {
    expect(benefitSentence('en', false)).toBe('If you book through this chat and pay at your visit, you get 5% off.');
    for (const locale of LOCALES) expect(benefitSentence(locale, false), locale).not.toContain('KRW');
  });

  it('가예약 요약 아래 줄: full 은 조건까지, five 는 5%만', () => {
    expect(benefitBookingLine('ja', 'five')).toBe('このチャットからのご予約ですので、ご来院時のお支払いが5%割引になります。');
    expect(benefitBookingLine('ja', 'full')).toMatch(/^このチャットからのご予約ですので、ご来院時のお支払いが5%割引になります。当日のお支払いがKRW 300,000（税別）以上/);
    expect(benefitBookingLine('zh', 'full')).toContain('首次体验价项目除外');
  });
});

describe('직원에게 보이는 이름 (Slack · 관리자 화면 — 한국어)', () => {
  it('제안 줄: 어떤 시술을 물었을 때의 몇 번째 제안인가', () => {
    const rowByKey = new Map(getKnowledge('en', OCT_20, { offers: true }).rows.map((r) => [r.key, r]));
    expect(getOffers(rowByKey).slice(0, 3).map(offerKo)).toEqual(['스컬트라 제안 ①', '스컬트라 제안 ②', '스컬트라 부담 덜한 구성']);
  });

  it('혜택: full 은 조건까지(기준 금액 · 방문한 날 선택), five 는 5%만', () => {
    expect(benefitKo('full')).toBe('혜택: 5% + 피부관리 또는 수액 1회(그날 결제 30만 원 이상 · 방문한 날 선택)');
    expect(benefitKo('five')).toBe('혜택: 5%만(첫방문 체험가만 안내함)');
  });
});
