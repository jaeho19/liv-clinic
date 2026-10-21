import type { VisitorLocale } from '@/lib/chat/chatApi';
import type { BookingEvent, BookingFields, ContactRef } from './booking';
import { bookingWhenKo } from './booking';
import type { ReplyPromise } from './calendar';
import { TAG_LINE_REST_RE, type OfferRow, type PriceRow } from './knowledge';
import { BENEFIT_TAG, offerClosing, offerLead } from './knowledge/offers';
import { VAT_DISPLAY, type VatDisplay } from './knowledge/scope';
import { identityAnswer, priceCaveat, renderBookingBlock, renderPriceLine } from './replyTemplates';

// AI가 쓴 글을 손님에게 나갈 글로 조립한다 (스펙 2026-10-02 chat-ai-first-response §4.5). 순수 함수.
//   꼬리표 {{P031}}  → 금액 줄 (이름과 금액은 가격표에서)
//   꼬리표 {{C01}}   → 제안 줄: 앞 문장 + 그 구성의 금액 줄 + 마지막 문장 (제안형 응대 §4.3 — 상한은 offerCaps.ts 가 먼저 지운다)
//   꼬리표 {{B01}}   → 채팅 예약 혜택 문장 (제안형 응대 §4.4 ①)
//   시술 금액 줄이 있으면 → 마지막 금액 줄 바로 아래에 금액 안내 한 줄 (상담비 줄만 있으면 붙이지 않는다)
//   정체를 물었으면   → 맨 앞에 "자동 응대가 먼저 답하고 …"
//   가예약이 찼거나 바뀌었으면 → 맨 끝에 가예약 요약 + (채팅 예약 혜택 한 줄) + 확정 약속

/** 조립한 글의 길이 한도 (043 의 글 길이 한도 4000 안쪽) */
export const MAX_ASSEMBLED_CHARS = 3000;

/** 금액 줄 · 제안 줄 · 혜택 문장의 꼬리표 */
const ANY_TAG_RE = /\{\{([PMFT]\d{2,3}|C\d{2}|B\d{2})\}\}/g;

export interface AssembleArgs {
  locale: VisitorLocale;
  /** AI가 쓴 글 — 검사를 통과하고 상한을 적용한 것, 꼬리표 포함 */
  reply: string;
  rowById: ReadonlyMap<string, PriceRow>;
  /** 오늘의 제안 줄 (제안형 응대가 꺼져 있으면 비어 있다) */
  offerById?: ReadonlyMap<string, OfferRow>;
  /** {{B01}} 자리에 넣을 문장 */
  benefitText?: string;
  /** 가예약 요약 아래에 붙일 채팅 예약 혜택 한 줄. 없으면 붙이지 않는다 */
  benefitLine?: string | null;
  identityQuestion: boolean;
  /** 이번 차례에 가예약이 처음 찼는가(requested) · 찬 뒤에 바뀌었는가(changed) */
  bookingEvent: BookingEvent;
  booking: BookingFields;
  /** 확정을 알릴 연락처. 없으면 가예약 요약을 붙이지 않는다 */
  contact: ContactRef | null;
  promise: ReplyPromise;
  /** 부가세 표기 규칙 — 기본은 scope.ts 의 VAT_DISPLAY */
  vat?: VatDisplay;
}

export interface Assembled {
  /** 손님에게 나가는 글 */
  text: string;
  /** 다음 차례의 대화 이력에 넣는 글 — 금액 숫자가 없다(AI가 숫자를 따라 쓰지 않게) */
  historyText: string;
  /** 이 답에 쓰인 가격 줄 (나온 순서, 겹치지 않게) — 직원에게 "안내한 금액"을 보여 줄 때 쓴다 */
  usedRows: PriceRow[];
  /** 이 답에 나간 제안 줄 */
  usedOffers: OfferRow[];
  /** 이 답에 나간 것의 key — 가격 줄 key · 제안 줄 key · 'benefit'(혜택 문장) · 'benefit-line'(요약 아래 줄) (기록 chat_ai_turns.shown_keys) */
  shownKeys: string[];
}

export function assembleReply(args: AssembleArgs): Assembled {
  const { locale, rowById } = args;
  const vat = args.vat ?? VAT_DISPLAY;
  const rowByKey = new Map([...rowById.values()].map((r) => [r.key, r]));
  const usedRows: PriceRow[] = [];
  const usedOffers: OfferRow[] = [];
  const shownKeys = new Set<string>();
  const out: string[] = [];
  const history: string[] = [];
  let lastPriceIndex = -1;
  /** 바로 앞에 낸 금액 줄 — 같은 꼬리표를 잇달아 쓰면 한 번만 보여 준다 */
  let previousRow: PriceRow | null = null;

  const pushRow = (row: PriceRow) => {
    if (!usedRows.includes(row)) usedRows.push(row);
    shownKeys.add(row.key);
    out.push(renderPriceLine(row, locale, vat));
    history.push(`[price line shown: ${row.labelKo}]`);
    // "대략적인 금액" 안내는 시술 금액에 붙는 말이다 — 상담비(fee) 줄만 있으면 붙이지 않는다
    if (row.group !== 'fee') lastPriceIndex = out.length - 1;
  };

  for (const line of args.reply.split('\n')) {
    const ids = [...line.matchAll(ANY_TAG_RE)].map((m) => m[1]);
    if (ids.length === 0) {
      out.push(line);
      history.push(line);
      if (line.trim()) previousRow = null;
      continue;
    }
    // 꼬리표가 문장 안에 섞여 있으면(검사 C-4 가 막지만, 지나왔다면) 문장을 먼저 두고 금액 줄을 그 아래에 둔다.
    // 글머리표·번호만 남았으면 버린다.
    const rest = line.replace(ANY_TAG_RE, ' ').replace(/[ \t]{2,}/g, ' ').trim();
    if (!TAG_LINE_REST_RE.test(rest)) {
      out.push(rest);
      history.push(rest);
      previousRow = null;
    }
    for (const id of ids) {
      if (id === BENEFIT_TAG) {
        if (!args.benefitText || shownKeys.has('benefit')) continue;
        shownKeys.add('benefit');
        out.push(args.benefitText);
        history.push('[direct-booking benefit sentence shown]');
        previousRow = null;
        continue;
      }
      if (id.startsWith('C')) {
        const offer = args.offerById?.get(id);
        if (!offer || usedOffers.includes(offer)) continue;
        const rows = offer.rowKeys.map((k) => rowByKey.get(k)).filter((r): r is PriceRow => Boolean(r));
        if (rows.length === 0) continue;
        usedOffers.push(offer);
        shownKeys.add(offer.key);
        out.push(offerLead(offer, locale));
        history.push(`[suggestion shown: ${offer.forKo} — ${offer.slot}]`);
        for (const row of rows) pushRow(row);
        out.push(offerClosing(offer, locale));
        previousRow = null;
        continue;
      }
      const row = rowById.get(id);
      if (!row || row === previousRow) continue;
      // 떨어진 자리에 다시 쓴 꼬리표는 다시 보여 준다(소제목 아래가 비지 않게). 쓰인 가격 줄 목록에는 한 번만 넣는다
      previousRow = row;
      pushRow(row);
    }
  }
  if (lastPriceIndex >= 0) out.splice(lastPriceIndex + 1, 0, priceCaveat(locale, vat));

  const parts: string[] = [];
  const historyParts: string[] = [];
  if (args.identityQuestion) {
    parts.push(identityAnswer(locale));
    historyParts.push('[told the visitor that an automated assistant answers first and that our team confirms all bookings]');
  }
  parts.push(out.join('\n').trim());
  historyParts.push(history.join('\n').trim());

  if (args.bookingEvent && args.contact) {
    const block = renderBookingBlock({
      locale,
      booking: args.booking,
      contact: args.contact,
      changed: args.bookingEvent === 'changed',
      promise: args.promise,
      benefitLine: args.benefitLine ?? null,
    });
    if (block) {
      parts.push(`\n${block}`);
      historyParts.push(
        `[tentative booking summary shown (${args.bookingEvent === 'changed' ? 'updated' : 'new'}): ${bookingWhenKo(args.booking)}; told the visitor when we will send the confirmation${args.benefitLine ? ' and the direct-booking benefit' : ''}]`
      );
      if (args.benefitLine) shownKeys.add('benefit-line');
    }
  }

  return {
    text: parts.filter((p) => p.trim().length > 0).join('\n'),
    historyText: historyParts.filter((p) => p.trim().length > 0).join('\n'),
    usedRows,
    usedOffers,
    shownKeys: [...shownKeys],
  };
}
