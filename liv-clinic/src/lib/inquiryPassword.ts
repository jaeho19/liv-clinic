import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// 상담 문의 비밀번호 해시 — Node 내장 crypto scrypt (외부 의존성 없음).
// 저장 형식: "scrypt:<saltHex>:<hashHex>". 평문은 절대 저장하지 않는다.

const KEYLEN = 64;

export function hashInquiryPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEYLEN);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyInquiryPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = scryptSync(plain, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
