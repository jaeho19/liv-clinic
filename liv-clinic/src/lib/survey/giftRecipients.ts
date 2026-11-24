import { GIFT_RECIPIENT_HOLD_DAYS } from './questions';
import { addDays } from './giftCode';

/**
 * 답례품 받은 분 명단(048 survey_gift_recipients) — 받은 날부터 90일 동안 설문 링크를 다시 보내지 않으려고 적어 둔다.
 * 이름과 휴대폰 뒤 4자리만 남긴다. 답례품 번호·응답과는 연결하지 않는다(설문 답은 익명 그대로).
 * DB CHECK (048): char_length(name) 1~40, phone_last4 ~ '^[0-9]{4}$'
 */

export const RECIPIENT_NAME_MAX = 40;

export type GiftRecipientInput = { name: string; phone_last4: string };
export type GiftRecipientRow = GiftRecipientInput & { id: string; given_on: string };

/** 앞뒤 공백을 지우고 가운데 공백은 하나로. 비었거나 40자를 넘으면 null. */
export function normalizeRecipientName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const name = input.trim().replace(/\s+/g, ' ');
  const length = Array.from(name).length; // Postgres char_length 와 같게 글자 단위로 센다
  return length >= 1 && length <= RECIPIENT_NAME_MAX ? name : null;
}

/** 숫자만 남겨 정확히 4자리일 때만. 전체 번호(010-…)는 받지 않는다. */
export function normalizePhoneLast4(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/\D/g, '');
  return /^[0-9]{4}$/.test(digits) ? digits : null;
}

export type ParsedRecipient = { ok: true; value: GiftRecipientInput } | { ok: false; error: string };

export function parseRecipient(body: unknown): ParsedRecipient {
  const record = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const name = normalizeRecipientName(record.name);
  if (!name) return { ok: false, error: `받은 분 이름을 적어 주세요. (${RECIPIENT_NAME_MAX}자까지)` };
  const phone = normalizePhoneLast4(record.phone_last4);
  if (!phone) return { ok: false, error: '휴대폰 뒤 4자리를 숫자로 적어 주세요.' };
  return { ok: true, value: { name, phone_last4: phone } };
}

/** 설문 링크를 다시 보낼 수 있는 날 = 받은 날 + 90일 */
export function sendAgainOn(givenOn: string): string {
  return addDays(givenOn, GIFT_RECIPIENT_HOLD_DAYS);
}

/** 오늘 명단에 남아 있어야 하는 가장 이른 받은 날 (이보다 이르면 90일이 지났다) */
export function oldestHeldGivenOn(today: string): string {
  return addDays(today, -(GIFT_RECIPIENT_HOLD_DAYS - 1));
}

/** 오늘 아직 보내면 안 되는 분인가 */
export function isHeld(givenOn: string, today: string): boolean {
  return givenOn <= today && today < sendAgainOn(givenOn);
}

/** 직접 추가할 때의 받은 날 — 실제 날짜이고, 오늘부터 89일 전 사이 */
export function isValidGivenOn(input: unknown, today: string): input is string {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const parsed = Date.parse(`${input}T00:00:00Z`);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString().slice(0, 10) !== input) return false;
  return input >= oldestHeldGivenOn(today) && input <= today;
}

/** 명단 찾기 — 숫자면 뒤 4자리, 아니면 이름(띄어쓰기·대소문자 무시, 일부만 맞아도) */
export function matchRecipient(row: GiftRecipientInput, query: string): boolean {
  const q = query.replace(/\s+/g, '').toLowerCase();
  if (!q) return true;
  if (/^\d+$/.test(q)) return row.phone_last4.includes(q);
  return row.name.replace(/\s+/g, '').toLowerCase().includes(q);
}
