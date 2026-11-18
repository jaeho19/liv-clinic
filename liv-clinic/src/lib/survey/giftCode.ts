import { GIFT_CODE_VALID_DAYS } from './questions';

/**
 * 답례품 번호 — 영문 대문자·숫자 6자리. 헷갈리는 0·O·1·I 는 쓰지 않는다(32글자).
 * DB CHECK (047): code ~ '^[2-9A-HJ-NP-Z]{6}$'
 */
export const GIFT_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const GIFT_CODE_LENGTH = 6;
const GIFT_CODE_RE = /^[2-9A-HJ-NP-Z]{6}$/;

type RandomBytes = (length: number) => Uint8Array;

const cryptoBytes: RandomBytes = (length) => {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

/** 256 은 32 의 배수라 하위 5비트만 쓰면 글자마다 확률이 같다. */
export function generateGiftCode(randomBytes: RandomBytes = cryptoBytes): string {
  const bytes = randomBytes(GIFT_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < GIFT_CODE_LENGTH; i += 1) {
    code += GIFT_CODE_ALPHABET[bytes[i] & 31];
  }
  return code;
}

/** 직원이 입력한 번호를 정리한다 — 소문자·공백·하이픈 허용. 형식이 틀리면 null. */
export function normalizeGiftCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, '');
  return GIFT_CODE_RE.test(cleaned) ? cleaned : null;
}

/** 화면 표시용: K7P3QD → K7P-3QD */
export function formatGiftCode(code: string): string {
  return code.length === GIFT_CODE_LENGTH ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** 서울 날짜(YYYY-MM-DD) */
export function seoulDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 날짜(YYYY-MM-DD)에 일수를 더한다 */
export function addDays(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

export type GiftCodeStatus = 'unused' | 'used' | 'expired';

/** 마지막으로 쓸 수 있는 날 = 발급일 + (유효 기간 − 1)일 */
export function giftCodeLastDay(issuedOn: string): string {
  return addDays(issuedOn, GIFT_CODE_VALID_DAYS - 1);
}

export function giftCodeStatus(
  row: { issued_on: string; redeemed_at: string | null },
  today: string = seoulDate(),
): GiftCodeStatus {
  if (row.redeemed_at) return 'used';
  return today > giftCodeLastDay(row.issued_on) ? 'expired' : 'unused';
}
