import { describe, expect, it } from 'vitest';
import { GIFT_RECIPIENT_HOLD_DAYS } from '../questions';
import {
  isHeld,
  isValidGivenOn,
  matchRecipient,
  normalizePhoneLast4,
  normalizeRecipientName,
  oldestHeldGivenOn,
  parseRecipient,
  sendAgainOn,
} from '../giftRecipients';

describe('답례품 받은 분 — 적는 정보 정리', () => {
  it('이름: 앞뒤 공백을 지우고 가운데 공백은 하나로', () => {
    expect(normalizeRecipientName('  김  수영 ')).toBe('김 수영');
    expect(normalizeRecipientName('Mary Jane')).toBe('Mary Jane');
    expect(normalizeRecipientName('王小明')).toBe('王小明');
  });

  it('이름: 비었거나 40자를 넘으면 받지 않는다', () => {
    expect(normalizeRecipientName('')).toBeNull();
    expect(normalizeRecipientName('   ')).toBeNull();
    expect(normalizeRecipientName(undefined)).toBeNull();
    expect(normalizeRecipientName(123)).toBeNull();
    expect(normalizeRecipientName('가'.repeat(40))).toBe('가'.repeat(40));
    expect(normalizeRecipientName('가'.repeat(41))).toBeNull();
  });

  it('휴대폰 뒤 4자리: 숫자만 남겨 정확히 4자리일 때만', () => {
    expect(normalizePhoneLast4('1234')).toBe('1234');
    expect(normalizePhoneLast4(' 0 5 7 8 ')).toBe('0578');
    expect(normalizePhoneLast4('-5678')).toBe('5678');
    // 전체 번호는 받지 않는다(서버에 전체 번호를 보내지 않기 위해 화면에서 먼저 막는다)
    expect(normalizePhoneLast4('010-1234-5678')).toBeNull();
    expect(normalizePhoneLast4('123')).toBeNull();
    expect(normalizePhoneLast4('12345')).toBeNull();
    expect(normalizePhoneLast4('abcd')).toBeNull();
    expect(normalizePhoneLast4(1234)).toBeNull();
  });

  it('요청 본문에서 받은 분을 꺼낸다 — 틀리면 쉬운 안내 문구', () => {
    expect(parseRecipient({ name: ' 이하나 ', phone_last4: '0101' })).toEqual({
      ok: true,
      value: { name: '이하나', phone_last4: '0101' },
    });
    const noName = parseRecipient({ name: '', phone_last4: '0101' });
    expect(noName.ok).toBe(false);
    if (!noName.ok) expect(noName.error).toContain('이름');
    const badPhone = parseRecipient({ name: '이하나', phone_last4: '010-1111-0101' });
    expect(badPhone.ok).toBe(false);
    if (!badPhone.ok) expect(badPhone.error).toContain('뒤 4자리');
    expect(parseRecipient(null).ok).toBe(false);
  });
});

describe('답례품 받은 분 — 90일 규칙', () => {
  it('기간은 90일', () => {
    expect(GIFT_RECIPIENT_HOLD_DAYS).toBe(90);
  });

  it('다시 보낼 수 있는 날 = 받은 날 + 90일 (해 넘김 포함)', () => {
    expect(sendAgainOn('2026-11-24')).toBe('2027-02-22');
    expect(sendAgainOn('2026-12-31')).toBe('2027-03-31');
  });

  it('받은 날부터 다시 보낼 수 있는 날 전날까지만 명단에 남는다', () => {
    expect(isHeld('2026-11-24', '2026-11-24')).toBe(true);
    expect(isHeld('2026-11-24', '2027-02-21')).toBe(true);
    expect(isHeld('2026-11-24', '2027-02-22')).toBe(false);
    expect(oldestHeldGivenOn('2027-02-21')).toBe('2026-11-24');
    expect(oldestHeldGivenOn('2027-02-22')).toBe('2026-11-25');
  });

  it('직접 추가할 때 받은 날은 오늘부터 89일 전까지', () => {
    expect(isValidGivenOn('2026-11-24', '2026-11-24')).toBe(true);
    expect(isValidGivenOn('2026-08-27', '2026-11-24')).toBe(true);
    expect(isValidGivenOn('2026-08-26', '2026-11-24')).toBe(false);
    expect(isValidGivenOn('2026-11-25', '2026-11-24')).toBe(false);
    expect(isValidGivenOn('2026-02-30', '2026-11-24')).toBe(false);
    expect(isValidGivenOn('11/24', '2026-11-24')).toBe(false);
    expect(isValidGivenOn(undefined, '2026-11-24')).toBe(false);
  });
});

describe('답례품 받은 분 — 찾기', () => {
  const row = { name: '김 수영', phone_last4: '5678' };

  it('빈 검색어는 모두 보여 준다', () => {
    expect(matchRecipient(row, '')).toBe(true);
    expect(matchRecipient(row, '   ')).toBe(true);
  });

  it('이름은 띄어쓰기·대소문자 상관없이 일부만 맞아도', () => {
    expect(matchRecipient(row, '김수영')).toBe(true);
    expect(matchRecipient(row, '수영')).toBe(true);
    expect(matchRecipient(row, '박')).toBe(false);
    expect(matchRecipient({ name: 'Mary Jane', phone_last4: '0001' }, 'mary')).toBe(true);
  });

  it('숫자는 뒤 4자리로 찾는다', () => {
    expect(matchRecipient(row, '5678')).toBe(true);
    expect(matchRecipient(row, '78')).toBe(true);
    expect(matchRecipient(row, '1234')).toBe(false);
  });
});
