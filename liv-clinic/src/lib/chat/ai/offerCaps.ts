import type { Reaction } from './guards';
import { BENEFIT_TAG, offerTagPattern, type OfferRow } from './knowledge/offers';
import type { PriceRow } from './knowledge';
import { priceTagPattern } from './knowledge';

// 제안 횟수 상한 — 프로그램이 지킨다 (스펙 2026-10-12 chat-ai-guided-offers §4.5). 순수 함수.
// AI가 꼬리표를 더 썼으면 그 줄을 지우고 나간다(검사 실패로 치지 않는다 — 답은 늦어지지 않는다). 지운 것은 기록에 남긴다.
//   첫 AI 답          → 제안 0 (혜택 문장 B01 은 된다 — 제안이 아니다)
//   한 답            → 제안 1개
//   한 대화           → 제안 2개 (서로 다른 줄)
//   거절 뒤 · 이번 답에서 거절 → 제안 0
//   의료 · 흥정 · 유보 · 예약 분명(R3 · R4 · R5 · R6 · R7) · 반응을 모름 → 제안 0
//   가격 부담(R2) → 저부담 대안만
//   직원 확인 필요(needs_staff)만으로는 지우지 않는다 — 금액 줄이 없는 시술(스컬트라)의 가격 문의도 needs_staff 인데,
//   대표원장님이 승인한 예시 E1 은 그 답에서 조합을 제안한다. 의료 · 흥정은 반응(R6 · R3)으로 막는다.
//   이미 보인 제안 · 이번 답에서 그 구성의 금액 줄을 하나라도 직접 보인 구성 → 지운다
//     (AI가 금액 줄을 직접 쓰고 같은 구성을 또 제안하면 같은 줄이 두 번 나간다 — 재생 o18)
//   앞 답들에서 금액 줄을 다 보인 구성 → 지운다. 그것이 제안 ①이면 같은 시술의 제안 ②로 바꾼다
//     (가격을 물을 때 이달 구성이 이미 나갔는데 손님이 관심을 이어 가면 ② 차례다 — 재생 o16)
//   혜택 문장 → 바로 앞 AI 답에 이미 있었거나, 이번 답에 가예약 요약이 붙으면(요약 아래 줄이 같은 말을 한다) 지운다
//   쌍점으로 끝나는 AI의 이끄는 말 → 지운 꼬리표 앞이면 지운다(뒤가 빈다), 남긴 제안 앞이면 지운다(프로그램의 앞 문장이 같은 말을
//     한다 — 재생 o17). 그 줄에 문장이 둘 이상이면 쌍점으로 끝나는 마지막 문장만 지운다("We understand." 는 남는다)

/** 쌍점으로 끝나는 줄 · 그 줄의 앞 문장들(쌍점으로 끝나는 마지막 문장 앞까지) · 꼬리표가 있는 줄 */
const LEAD_IN_RE = /[:：]\s*$/;
const LEAD_IN_TAIL_RE = /^(.*[.!?。！？])\s*[^.!?。！？]*[:：]\s*$/;
const TAG_RE = /\{\{[^}]+\}\}/;

/** 한 대화에서 보일 수 있는 제안 줄의 수 */
export const MAX_OFFERS_PER_CONVERSATION = 2;

/** 지금까지의 대화에서 나간 것 — chat_ai_turns.shown_keys · offer_declined 를 모은 것 */
export interface OfferHistory {
  /** 그 대화에서 나간 AI 답의 수 */
  sentReplies: number;
  /** 지금까지 보인 제안 줄의 key */
  shownOfferKeys: ReadonlySet<string>;
  /** 지금까지 보인 가격 줄의 key */
  shownPriceKeys: ReadonlySet<string>;
  /** 손님이 제안을 거절한 적이 있다 */
  declined: boolean;
  /** 바로 앞 AI 답에 혜택 문장이 있었다 */
  benefitInLastReply: boolean;
}

export const EMPTY_OFFER_HISTORY: OfferHistory = {
  sentReplies: 0,
  shownOfferKeys: new Set(),
  shownPriceKeys: new Set(),
  declined: false,
  benefitInLastReply: false,
};

export interface OfferCapArgs {
  reply: string;
  offersOn: boolean;
  offerById: ReadonlyMap<string, OfferRow>;
  rowById: ReadonlyMap<string, PriceRow>;
  history: OfferHistory;
  reaction: Reaction | null;
  offerDeclined: boolean;
  /** 이번 답에 가예약 요약이 붙는가 */
  bookingSummary: boolean;
}

export interface OfferCapResult {
  /** 지울 꼬리표를 지운 글 */
  reply: string;
  /** 남은 제안 줄 */
  offers: OfferRow[];
  /** 혜택 문장이 남았는가 */
  benefit: boolean;
  /** 지운 꼬리표와 이유 — 'C03:first_reply' 꼴 */
  dropped: string[];
}

/** 이 반응에서 제안 줄을 써도 되는가 — 가격 부담(R2)은 저부담 대안만 */
function reactionAllows(reaction: Reaction | null, offer: OfferRow): boolean {
  if (reaction === 'R1') return true;
  if (reaction === 'R2') return offer.kind === 'light';
  return false;
}

export function applyOfferCaps(args: OfferCapArgs): OfferCapResult {
  const { history } = args;
  const dropped: string[] = [];
  const kept: OfferRow[] = [];
  let benefit = false;
  const priceKeysInReply = new Set(
    [...args.reply.matchAll(priceTagPattern())].map((m) => args.rowById.get(m[1])?.key).filter((k): k is string => Boolean(k))
  );

  const keepTag = (id: string): string | null => {
    if (id === BENEFIT_TAG) {
      if (benefit) return 'duplicate';
      if (history.benefitInLastReply) return 'benefit_repeat';
      if (args.bookingSummary) return 'benefit_in_summary';
      benefit = true;
      return null;
    }
    const offer = args.offerById.get(id);
    if (!offer) return 'unknown';
    if (!args.offersOn) return 'off';
    if (history.sentReplies === 0) return 'first_reply';
    if (history.declined || args.offerDeclined) return 'declined';
    if (!reactionAllows(args.reaction, offer)) return `reaction_${args.reaction ?? 'none'}`;
    if (kept.length >= 1) return 'per_reply';
    if (history.shownOfferKeys.has(offer.key)) return 'already_shown';
    if (history.shownOfferKeys.size >= MAX_OFFERS_PER_CONVERSATION) return 'per_conversation';
    if (offer.rowKeys.some((k) => priceKeysInReply.has(k))) return 'prices_in_reply';
    if (offer.rowKeys.every((k) => history.shownPriceKeys.has(k))) return 'prices_already_shown';
    kept.push(offer);
    return null;
  };
  /** 제안 ①의 금액 줄을 앞 답들에서 이미 다 보였으면 같은 시술의 제안 ②로 바꾼다 — 엑셀 시트 2의 순서(① 다음 ②) */
  const secondOf = (id: string): OfferRow | undefined => {
    const offer = args.offerById.get(id);
    if (offer?.slot !== 'first') return undefined;
    return [...args.offerById.values()].find((o) => o.forKo === offer.forKo && o.slot === 'second');
  };

  const lines: string[] = [];
  /** 바로 앞(빈 줄 건너뜀)의 AI 줄이 쌍점으로 끝나면 그 마지막 문장을 지운다. 지웠으면 true */
  const trimLeadIn = (): boolean => {
    let prev = lines.length - 1;
    while (prev >= 0 && !lines[prev].trim()) prev -= 1;
    if (prev < 0 || !LEAD_IN_RE.test(lines[prev]) || TAG_RE.test(lines[prev])) return false;
    const earlier = LEAD_IN_TAIL_RE.exec(lines[prev]);
    if (earlier) lines[prev] = earlier[1];
    else lines.splice(prev, 1);
    return true;
  };
  for (const line of args.reply.split('\n')) {
    const ids = [...line.matchAll(offerTagPattern())].map((m) => m[1]);
    if (ids.length === 0) {
      lines.push(line);
      continue;
    }
    // 꼬리표는 제 줄에 따로 있다(검사 C-4). 남길 것만 남긴다
    const keep: string[] = [];
    for (const id of ids) {
      const why = keepTag(id);
      if (why === null) {
        keep.push(id);
        continue;
      }
      const second = why === 'prices_already_shown' ? secondOf(id) : undefined;
      if (second && keepTag(second.id) === null) {
        keep.push(second.id);
        dropped.push(`${id}:prices_already_shown>${second.id}`);
        continue;
      }
      dropped.push(`${id}:${why}`);
    }
    if (keep.length > 0) {
      // 남긴 제안의 앞 문장은 프로그램이 넣는다 — AI가 쓴 이끄는 말과 겹치지 않게
      if (keep.some((id) => id !== BENEFIT_TAG) && trimLeadIn()) dropped.push('lead_in_replaced');
      lines.push(keep.map((id) => `{{${id}}}`).join('\n'));
      continue;
    }
    // 지운 꼬리표를 이끄는 말("…을 권해 드립니다:")만 남으면 뒤가 빈 글이 된다
    if (trimLeadIn()) dropped.push('lead_in_line');
  }
  const reply = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { reply, offers: kept, benefit, dropped };
}
