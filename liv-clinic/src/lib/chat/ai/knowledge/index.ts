import type { VisitorLocale } from '@/lib/chat/chatApi';
import { SITE_INFO, SOCIAL_LINKS, WECHAT_ID, WHATSAPP_NUMBER } from '@/lib/constants';
import { SITE_URL } from '@/lib/siteEnvironment';
import { benefitFactsKo, CLINIC_FACTS_KO } from './facts';
import { buildOfferText, getOffers, type OfferRow } from './offers';
import { BASE_PRICE_ROWS } from './priceRows.base.generated';
import { EXTRA_PRICE_ROWS, PROMOTION_PAGES } from './priceRows.extra';
import { TRIAL_PRICE_ROWS } from './priceRows.trial';
import { STAFF_ONLY_KEYS } from './scope';
import type { PriceGroup, PriceRow, PriceRowSource } from './types';

// AI 응대의 근거 자료를 한데 모은다 (스펙 2026-10-02 chat-ai-first-response §4.3). 순수 함수 — I/O 없음.
// 가격 줄: 기본(홈페이지 가격표 − 직원에게 넘기는 줄) + 손으로 관리하는 줄(필러·상담비·이달 프로모션) 가운데 오늘 유효한 것.
// 꼬리표는 읽을 때마다 순서대로 붙인다 — 대화 이력에는 꼬리표가 아니라 이름을 남기므로 달라져도 된다.
// 제안형 응대(스펙 2026-10-12 chat-ai-guided-offers)가 켜지면 첫방문 체험가 줄(T…)과 제안 줄(C…)이 더해진다.
// 프로모션 줄의 includes 는 "이 묶음에 든 시술" — AI가 그 시술의 기본 가격 줄을 보여 주면 조립(assemble.ts)이 이 줄을 함께 붙인다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 날짜 'YYYY-MM-DD' */
export function kstDateKey(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 오늘(한국 날짜) 이 줄을 말해도 되는가 — 유효 기간의 양 끝을 포함한다. */
export function isRowValid(row: Pick<PriceRowSource, 'validFrom' | 'validUntil'>, dateKey: string): boolean {
  if (row.validFrom && dateKey < row.validFrom) return false;
  if (row.validUntil && dateKey > row.validUntil) return false;
  return true;
}

const ID_STYLE: Record<PriceGroup, { prefix: string; width: number }> = {
  base: { prefix: 'P', width: 3 },
  promo: { prefix: 'M', width: 2 },
  fee: { prefix: 'F', width: 2 },
  trial: { prefix: 'T', width: 2 },
};

/** AI가 쓴 글에서 꼬리표를 찾는 식. 쓸 때마다 lastIndex 를 걱정하지 않도록 새로 만든다. */
export function priceTagPattern(): RegExp {
  return /\{\{([PMFT]\d{2,3})\}\}/g;
}

/** 꼬리표가 있는 줄에서 꼬리표를 떼고 남아도 되는 것 — 글머리표 · 번호 · 문장부호뿐 */
export const TAG_LINE_REST_RE = /^[\s•·・\-–—:：,，、.()\d]*$/;

/** 오늘 AI에게 줄 가격 줄 — 꼬리표를 붙여 돌려준다. 첫방문 체험가 줄은 제안형 응대가 켜졌을 때만 넣는다. */
export function getPriceRows(now: Date, options: { trial?: boolean } = {}): PriceRow[] {
  const dateKey = kstDateKey(now);
  const counters: Record<PriceGroup, number> = { base: 0, promo: 0, fee: 0, trial: 0 };
  const rows: PriceRow[] = [];
  for (const source of [...BASE_PRICE_ROWS, ...EXTRA_PRICE_ROWS, ...(options.trial ? TRIAL_PRICE_ROWS : [])]) {
    if (STAFF_ONLY_KEYS.has(source.key)) continue;
    if (!isRowValid(source, dateKey)) continue;
    const style = ID_STYLE[source.group];
    counters[source.group] += 1;
    rows.push({ ...source, id: `${style.prefix}${String(counters[source.group]).padStart(style.width, '0')}` });
  }
  return rows;
}

/** 이 기본 가격 줄의 시술이 든 오늘의 프로모션 줄 (자료 순서대로). 기본 가격 줄이 아니면 비어 있다. */
export function promoRowsIncluding(row: PriceRow, rows: Iterable<PriceRow>): PriceRow[] {
  if (row.group !== 'base') return [];
  return [...rows].filter((r) => r.group === 'promo' && r.includes?.some((prefix) => row.key.startsWith(prefix)));
}

const krw = (amount: number): string => `KRW ${amount.toLocaleString('en-US')}`;

/** 프롬프트에 넣는 한 줄: `{{P031}} 리쥬란 · 4cc — KRW 460,000 부터` */
export function priceRowLine(row: PriceRow): string {
  return `{{${row.id}}} ${row.labelKo} — ${krw(row.amount)}${row.unit === 'starting' ? ' 부터' : ''}`;
}

/** 직원에게 보이는 "안내한 금액" 한 조각: `써마지 레이저 · 600샷 2,400,000원~` (부가세 별도) */
export function priceQuoteKo(row: PriceRow): string {
  return `${row.labelKo} ${row.amount.toLocaleString('en-US')}원${row.unit === 'starting' ? '~' : ''}`;
}

function promoPeriod(rows: PriceRow[]): string {
  const from = rows.map((r) => r.validFrom).filter(Boolean).sort()[0];
  const until = rows.map((r) => r.validUntil).filter(Boolean).sort().pop();
  return from && until ? ` (${from} ~ ${until})` : '';
}

/** 프롬프트의 PRICE ROWS 부분 (한국어, 부가세 별도). */
export function buildPriceText(rows: PriceRow[]): string {
  const of = (group: PriceGroup) => rows.filter((r) => r.group === group);
  const promo = of('promo');
  const lines = ['## 기본 가격 (1회 기준, "부터" 금액)', ...of('base').map(priceRowLine)];
  lines.push('', `## 이달 프로모션${promoPeriod(promo)}`);
  if (promo.length > 0) lines.push(...promo.map(priceRowLine));
  else lines.push('(지금 등록된 프로모션 가격 줄이 없다. 프로모션 금액을 물으면 직원 확인.)');
  lines.push('', '## 그 밖의 금액', ...of('fee').map(priceRowLine));
  const trial = of('trial');
  if (trial.length > 0) lines.push('', '## 첫방문 1회 체험가 (처음 방문하는 손님만, 1회)', ...trial.map(priceRowLine));
  return lines.join('\n');
}

/** 오늘 유효한 프로모션 페이지 주소. 없으면 null. */
export function promotionPageUrl(locale: VisitorLocale, now: Date): string | null {
  const dateKey = kstDateKey(now);
  const page = PROMOTION_PAGES.find((p) => isRowValid(p, dateKey));
  return page ? `${SITE_URL}/${locale}/events/${page.slug}` : null;
}

/** 프롬프트의 CLINIC FACTS 부분 — 사이트 주소와 손님 언어 코드를 넣고, 이달 프로모션 페이지 줄을 덧붙인다. */
export function buildFactsText(locale: VisitorLocale, now: Date, offersOn = false): string {
  const facts = `${CLINIC_FACTS_KO.trimEnd()}\n${benefitFactsKo(offersOn)}`
    .replace(/\{site\}/g, SITE_URL)
    .replace(/\{locale\}/g, locale)
    .trimEnd();
  const promo = promotionPageUrl(locale, now);
  return promo ? `${facts}\n- 이달 프로모션 페이지(구성과 금액이 포스터로 나와 있다): ${promo}` : facts;
}

const digitsOf = (s: string): string => s.replace(/\D/g, '');

/** AI가 쓴 글에 나와도 되는 병원 전화번호의 숫자 (검사 C-8) — 대표 번호와 WhatsApp 번호, 각각 국내 꼴 · 국제 꼴 */
export const CLINIC_PHONE_DIGITS: readonly string[] = [
  digitsOf(SITE_INFO.phone),
  digitsOf(SITE_INFO.phoneInternational),
  WHATSAPP_NUMBER,
  `0${WHATSAPP_NUMBER.replace(/^82/, '')}`,
];

/** AI가 쓴 글에 나와도 되는 병원 메신저 아이디 (검사 C-8) */
export const CLINIC_HANDLES: readonly string[] = [WECHAT_ID];

/** AI가 쓴 글에 나와도 되는 주소 (검사 C-7). */
export function allowedUrls(locale: VisitorLocale, now: Date): string[] {
  const urls = [
    `${SITE_URL}/${locale}/pricing`,
    `${SITE_URL}/${locale}/about/location`,
    `${SITE_URL}/${locale}/events`,
    SOCIAL_LINKS.line,
    SOCIAL_LINKS.whatsapp,
  ];
  const promo = promotionPageUrl(locale, now);
  if (promo) urls.push(promo);
  return urls;
}

export interface Knowledge {
  rows: PriceRow[];
  rowById: ReadonlyMap<string, PriceRow>;
  /** 프롬프트의 CLINIC FACTS */
  factsText: string;
  /** 프롬프트의 PRICE ROWS */
  priceText: string;
  allowedUrls: string[];
  /** 제안형 응대가 켜졌는가 (CHAT_AI_OFFERS) */
  offersOn: boolean;
  /** 오늘의 제안 줄 — 꺼져 있으면 비어 있다 */
  offers: OfferRow[];
  offerById: ReadonlyMap<string, OfferRow>;
  /** 프롬프트의 OFFER ROWS — 꺼져 있으면 빈 글자 */
  offerText: string;
}

const cache = new Map<string, Knowledge>();

/** 그 언어 · 그 날짜(한국)의 근거 자료. 같은 날에는 같은 객체를 돌려준다(프롬프트 앞부분이 글자 하나까지 같아야 캐시된다). */
export function getKnowledge(locale: VisitorLocale, now: Date, options: { offers?: boolean } = {}): Knowledge {
  const offersOn = options.offers === true;
  const cacheKey = `${locale}|${kstDateKey(now)}|${offersOn ? 'offers' : 'plain'}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const rows = getPriceRows(now, { trial: offersOn });
  const rowByKey = new Map(rows.map((r) => [r.key, r]));
  const offers = offersOn ? getOffers(rowByKey) : [];
  const knowledge: Knowledge = {
    rows,
    rowById: new Map(rows.map((r) => [r.id, r])),
    factsText: buildFactsText(locale, now, offersOn),
    priceText: buildPriceText(rows),
    allowedUrls: allowedUrls(locale, now),
    offersOn,
    offers,
    offerById: new Map(offers.map((o) => [o.id, o])),
    offerText: offers.length > 0 ? buildOfferText(offers, rowByKey) : '',
  };
  if (cache.size > 40) cache.clear();
  cache.set(cacheKey, knowledge);
  return knowledge;
}

export type { PriceRow, PriceRowSource, PriceGroup, PriceUnit } from './types';
export type { OfferRow, OfferKind, OfferSlot } from './offers';
