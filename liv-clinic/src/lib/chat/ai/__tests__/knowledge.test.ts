import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { CHAT_VISITOR_LOCALES } from '@/lib/chat/chatApi';
import { PRICING } from '@/lib/pricing';
import { CLINIC_FACTS_KO } from '../knowledge/facts';
import {
  allowedUrls,
  buildFactsText,
  CLINIC_HANDLES,
  CLINIC_PHONE_DIGITS,
  buildPriceText,
  getKnowledge,
  getPriceRows,
  isRowValid,
  kstDateKey,
  priceQuoteKo,
  priceRowLine,
  priceTagPattern,
  promoRowsIncluding,
  promotionPageUrl,
} from '../knowledge';
import { BASE_PRICE_ROWS } from '../knowledge/priceRows.base.generated';
import { EXTRA_PRICE_ROWS, PROMOTION_PAGES } from '../knowledge/priceRows.extra';
import { ALLOWED_PERCENTS, STAFF_ONLY_KEYS, VAT_DISPLAY } from '../knowledge/scope';

type Labels = Record<string, Record<string, string>>;
const labelsOf = (locale: string): Labels =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'src/messages', `${locale}.json`), 'utf8')).pricing.labels;

const OCT_2 = new Date('2026-10-02T07:20:00Z'); // 한국 10/02 16:20
const NOV_2 = new Date('2026-11-02T03:00:00Z');
const MONEY_RE = /\d[\d,.]*\s*(원|만\s?원|KRW|won)|KRW\s?\d|₩/i;

describe('병원 연락처 — 검사가 통과시키는 목록 (C-8)', () => {
  it('사실 문장에 적힌 전화번호 · 아이디가 목록에 있다 — 자료에만 있고 목록에 없으면 AI가 그 번호를 쓸 때마다 검사에 걸린다', () => {
    expect(CLINIC_PHONE_DIGITS).toEqual(['027972773', '8227972773', '821068882773', '01068882773']);
    expect(CLINIC_HANDLES).toEqual(['livps0414']);
    const facts = buildFactsText('en', new Date('2026-10-02T07:20:00Z'));
    const phones = (facts.match(/\+82[\d\s-]{8,}\d/g) ?? []).map((p) => p.replace(/\D/g, ''));
    expect(phones.length).toBeGreaterThanOrEqual(2);
    for (const p of phones) expect(CLINIC_PHONE_DIGITS, p).toContain(p);
    for (const id of CLINIC_HANDLES) expect(facts).toContain(id);
  });
});

describe('기본 가격 줄 (생성 파일)', () => {
  it('pricing.ts 의 금액 있는 줄과 하나씩 맞는다 — 어긋나면 node scripts/chat-ai-build-price-rows.mjs 를 다시 돌린다', () => {
    const ko = labelsOf('ko');
    const byLocale = Object.fromEntries(CHAT_VISITOR_LOCALES.map((l) => [l, labelsOf(l)]));
    const expected: Array<{ key: string; amount: number; labelKo: string; labels: Record<string, string> }> = [];
    for (const [id, treatment] of Object.entries(PRICING)) {
      for (const group of treatment.groups) {
        for (const row of group.rows) {
          if (row.price === null) continue;
          const name = (t: Labels) =>
            `${group.subKey ? `${t[id][group.groupKey]} (${t[id][group.subKey]})` : t[id][group.groupKey]} · ${t[id][row.rowKey]}`;
          expected.push({
            key: `${id}.${group.groupKey}.${row.rowKey}`,
            amount: Number(row.price.replace(/,/g, '')),
            labelKo: name(ko),
            labels: Object.fromEntries(CHAT_VISITOR_LOCALES.map((l) => [l, name(byLocale[l])])),
          });
        }
      }
    }
    expect(expected).toHaveLength(56);
    expect(BASE_PRICE_ROWS.map((r) => ({ key: r.key, amount: r.amount, labelKo: r.labelKo, labels: r.labels }))).toEqual(
      expected
    );
    expect(BASE_PRICE_ROWS.every((r) => r.group === 'base' && r.unit === 'starting' && !r.validFrom && !r.validUntil)).toBe(
      true
    );
  });
});

describe('손으로 관리하는 가격 줄', () => {
  const all = [...BASE_PRICE_ROWS, ...EXTRA_PRICE_ROWS];

  it('이름(key)이 겹치지 않고, 금액은 양의 정수다', () => {
    expect(new Set(all.map((r) => r.key)).size).toBe(all.length);
    expect(all.every((r) => Number.isInteger(r.amount) && r.amount > 0)).toBe(true);
  });

  it('모든 줄에 10개 언어 이름이 있고, 이름에 금액이 들어 있지 않다', () => {
    for (const row of all) {
      expect(Object.keys(row.labels).sort()).toEqual([...CHAT_VISITOR_LOCALES].sort());
      for (const locale of CHAT_VISITOR_LOCALES) {
        expect(row.labels[locale].trim().length, `${row.key} ${locale}`).toBeGreaterThan(0);
        expect(MONEY_RE.test(row.labels[locale]), `${row.key} ${locale}`).toBe(false);
      }
      expect(MONEY_RE.test(row.labelKo), row.key).toBe(false);
    }
  });

  it('프로모션 줄에는 유효 기간이 있고(시작 ≤ 끝), 다른 줄에는 없다', () => {
    for (const row of EXTRA_PRICE_ROWS) {
      if (row.group === 'promo') {
        expect(row.validFrom && row.validUntil && row.validFrom <= row.validUntil, row.key).toBe(true);
        expect(row.unit).toBe('fixed');
      } else {
        expect(row.validFrom ?? row.validUntil, row.key).toBeUndefined();
      }
    }
    expect(EXTRA_PRICE_ROWS.filter((r) => r.group === 'promo')).toHaveLength(27);
    expect(EXTRA_PRICE_ROWS.filter((r) => r.group === 'fee').map((r) => [r.key, r.amount, r.unit])).toEqual([
      ['fee.consult', 10000, 'fixed'],
    ]);
  });

  it('프로모션 줄의 includes 는 있는 기본 가격 줄을 가리키고, 프로모션 줄에만 있다', () => {
    for (const row of EXTRA_PRICE_ROWS) {
      if (!row.includes) continue;
      expect(row.group, row.key).toBe('promo');
      for (const prefix of row.includes) {
        expect(all.some((b) => b.group === 'base' && b.key.startsWith(prefix)), `${row.key}: ${prefix}`).toBe(true);
      }
    }
    // '추가 선택' 줄은 그 구성과 함께일 때만 의미가 있어 혼자 붙이지 않는다
    for (const row of EXTRA_PRICE_ROWS.filter((r) => r.labelKo.includes('추가 선택'))) expect(row.includes, row.key).toBeUndefined();
  });

  it('직원에게 넘기는 줄(STAFF_ONLY_KEYS)은 모두 실제로 있는 줄이다', () => {
    const keys = new Set(BASE_PRICE_ROWS.map((r) => r.key));
    for (const key of STAFF_ONLY_KEYS) expect(keys.has(key), key).toBe(true);
    expect(STAFF_ONLY_KEYS.size).toBe(7);
  });

  it('공통 규칙의 값', () => {
    expect(VAT_DISPLAY).toBe('both');
    expect([...ALLOWED_PERCENTS]).toEqual(['5']);
  });
});

describe('getPriceRows', () => {
  it('10월: 기본 52줄(P) · 프로모션 27줄(M) · 상담비 1줄(F), 꼬리표는 순서대로', () => {
    const rows = getPriceRows(OCT_2);
    const ids = (prefix: string) => rows.filter((r) => r.id.startsWith(prefix)).map((r) => r.id);
    expect(ids('P')).toHaveLength(52); // 56 − 직원에게 넘기는 7 + 필러 3
    expect(ids('P')[0]).toBe('P001');
    expect(ids('P')[51]).toBe('P052');
    expect(ids('M')).toHaveLength(27);
    expect(ids('M')[0]).toBe('M01');
    expect(ids('F')).toEqual(['F01']);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(rows.some((r) => STAFF_ONLY_KEYS.has(r.key))).toBe(false);
  });

  it('프로모션 줄은 유효 기간(한국 날짜)에만 나온다', () => {
    const promo = (iso: string) => getPriceRows(new Date(iso)).filter((r) => r.group === 'promo').length;
    expect(promo('2026-09-30T14:59:59Z')).toBe(0); // 한국 9/30 23:59
    expect(promo('2026-09-30T15:00:00Z')).toBe(27); // 한국 10/01 00:00
    expect(promo('2026-10-31T14:59:59Z')).toBe(27); // 한국 10/31 23:59
    expect(promo('2026-10-31T15:00:00Z')).toBe(0); // 한국 11/01 00:00
    expect(getPriceRows(NOV_2).filter((r) => r.group === 'base')).toHaveLength(52);
  });

  it('isRowValid · kstDateKey', () => {
    expect(kstDateKey(new Date('2026-10-01T15:00:00Z'))).toBe('2026-10-02');
    expect(isRowValid({}, '2026-01-01')).toBe(true);
    expect(isRowValid({ validFrom: '2026-10-01', validUntil: '2026-10-31' }, '2026-10-01')).toBe(true);
    expect(isRowValid({ validFrom: '2026-10-01', validUntil: '2026-10-31' }, '2026-10-31')).toBe(true);
    expect(isRowValid({ validFrom: '2026-10-01', validUntil: '2026-10-31' }, '2026-11-01')).toBe(false);
  });
});

describe('프롬프트에 넣는 글', () => {
  it('가격 줄 한 줄의 꼴', () => {
    const rows = getPriceRows(OCT_2);
    const rejuran = rows.find((r) => r.key === 'skinbooster.rejuran.volume4cc')!;
    expect(priceRowLine(rejuran)).toBe(`{{${rejuran.id}}} 리쥬란 · 4cc — KRW 460,000 부터`);
    const promo = rows.find((r) => r.key === 'promo.2026-10.19')!;
    expect(priceRowLine(promo)).toBe(
      `{{${promo.id}}} [리프팅] 울쎄라피 프라임 300샷 + 온다리프팅 60kJ + 진정팩 — KRW 1,590,000`
    );
    expect([...priceRowLine(promo).matchAll(priceTagPattern())].map((m) => m[1])).toEqual([promo.id]);
    // 직원에게 보이는 "안내한 금액" 한 조각
    expect(priceQuoteKo(rejuran)).toBe('리쥬란 · 4cc 460,000원~');
    expect(priceQuoteKo(promo)).toBe('[리프팅] 울쎄라피 프라임 300샷 + 온다리프팅 60kJ + 진정팩 1,590,000원');
  });

  it('가격 글은 기본 · 이달 프로모션(기간) · 그 밖의 금액 순서다', () => {
    const text = buildPriceText(getPriceRows(OCT_2));
    const at = (s: string) => text.indexOf(s);
    expect(at('## 기본 가격')).toBe(0);
    expect(at('## 이달 프로모션 (2026-10-01 ~ 2026-10-31)')).toBeGreaterThan(at('{{P052}}'));
    expect(at('## 그 밖의 금액')).toBeGreaterThan(at('{{M27}}'));
    expect(at('{{F01}} 1:1 상담비')).toBeGreaterThan(at('## 그 밖의 금액'));
  });

  it('프로모션 줄이 없는 달에는 직원 확인으로 넘기라는 줄이 들어간다', () => {
    const text = buildPriceText(getPriceRows(NOV_2));
    expect(text).toContain('## 이달 프로모션\n(지금 등록된 프로모션 가격 줄이 없다. 프로모션 금액을 물으면 직원 확인.)');
    expect(text).not.toContain('{{M');
  });

  it('사실 문장: 자리 표시가 남지 않고, 금액과 금지 낱말이 없다', () => {
    const text = buildFactsText('ja', OCT_2);
    expect(text).not.toMatch(/\{site\}|\{locale\}/);
    expect(text).toContain('https://liv-clinic.net/ja/pricing');
    expect(text).toContain('https://liv-clinic.net/ja/about/location');
    expect(MONEY_RE.test(CLINIC_FACTS_KO)).toBe(false);
    for (const word of ['최고', '유일', '100%', '보장', '영구', '완벽', '1위']) expect(CLINIC_FACTS_KO).not.toContain(word);
  });

  it('이달 프로모션 페이지 주소는 기간 안에만 들어간다', () => {
    expect(PROMOTION_PAGES).toEqual([{ slug: '2026-10-promotion', validFrom: '2026-10-01', validUntil: '2026-10-31' }]);
    expect(promotionPageUrl('en', OCT_2)).toBe('https://liv-clinic.net/en/events/2026-10-promotion');
    expect(promotionPageUrl('en', NOV_2)).toBeNull();
    expect(buildFactsText('en', OCT_2)).toContain('https://liv-clinic.net/en/events/2026-10-promotion');
    expect(buildFactsText('en', NOV_2)).not.toContain('/events/2026-10-promotion');
  });

  it('AI가 써도 되는 주소', () => {
    expect(allowedUrls('zh-TW', OCT_2)).toEqual([
      'https://liv-clinic.net/zh-TW/pricing',
      'https://liv-clinic.net/zh-TW/about/location',
      'https://liv-clinic.net/zh-TW/events',
      'https://line.me/ti/p/VJYu9BSnsX',
      'https://wa.me/821068882773',
      'https://liv-clinic.net/zh-TW/events/2026-10-promotion',
    ]);
    expect(allowedUrls('zh-TW', NOV_2)).toHaveLength(5);
  });

  it('getKnowledge: 같은 날 · 같은 언어면 같은 객체, 꼬리표로 줄을 찾는다', () => {
    const a = getKnowledge('en', OCT_2);
    expect(getKnowledge('en', new Date('2026-10-02T09:00:00Z'))).toBe(a);
    expect(getKnowledge('ja', OCT_2)).not.toBe(a);
    expect(a.rowById.get('F01')?.key).toBe('fee.consult');
    expect(a.rowById.get('P999')).toBeUndefined();
    expect(a.priceText).toContain('{{M01}}');
    expect(a.factsText).toContain('## 혜택과 규칙');
  });
});

describe('promoRowsIncluding — 기본 가격 줄의 시술이 든 이달 프로모션 줄', () => {
  const rows = getPriceRows(OCT_2);
  const row = (key: string) => rows.find((r) => r.key === key)!;
  const keysFor = (key: string) => promoRowsIncluding(row(key), rows).map((r) => r.key);

  it('써마지 600샷 · 울쎄라 · 리쥬란 · 압토스 — 자료 순서대로', () => {
    expect(keysFor('thermage.name.shot600')).toEqual(['promo.2026-10.16', 'promo.2026-10.20']);
    expect(keysFor('ulthera.name.fullFace')).toEqual(['promo.2026-10.16', 'promo.2026-10.19']);
    expect(keysFor('skinbooster.rejuran.volume2cc')).toEqual(['promo.2026-10.12']);
    expect(keysFor('skinbooster.rejuranHbPlus.volume2cc')).toEqual(['promo.2026-10.13']);
    expect(keysFor('thread.name.aptosLight25')).toEqual(['promo.2026-10.26']);
  });

  it('묶음에 없는 시술 · 아이 써마지 · 프로모션 줄 자신에는 아무것도 없다', () => {
    expect(keysFor('botox.botoxContour.domestic')).toEqual([]);
    expect(keysFor('thermage.name.eyeTip225')).toEqual([]);
    expect(keysFor('promo.2026-10.20')).toEqual([]);
  });

  it('기간이 지난 달에는 없다', () => {
    const nov = getPriceRows(NOV_2);
    const thermage = nov.find((r) => r.key === 'thermage.name.shot600')!;
    expect(promoRowsIncluding(thermage, nov)).toEqual([]);
  });
});
