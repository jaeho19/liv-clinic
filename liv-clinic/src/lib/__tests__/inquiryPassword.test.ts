import { describe, it, expect } from 'vitest';
import { hashInquiryPassword, verifyInquiryPassword } from '../inquiryPassword';

describe('inquiryPassword', () => {
  it('verifies a correct password', () => {
    const stored = hashInquiryPassword('secret123!');
    expect(verifyInquiryPassword('secret123!', stored)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const stored = hashInquiryPassword('secret123!');
    expect(verifyInquiryPassword('wrong', stored)).toBe(false);
  });

  it('rejects null/undefined/empty stored hash', () => {
    expect(verifyInquiryPassword('x', null)).toBe(false);
    expect(verifyInquiryPassword('x', undefined)).toBe(false);
    expect(verifyInquiryPassword('x', '')).toBe(false);
  });

  it('rejects malformed stored hash', () => {
    expect(verifyInquiryPassword('x', 'notvalid')).toBe(false);
    expect(verifyInquiryPassword('x', 'bcrypt:aa:bb')).toBe(false);
    expect(verifyInquiryPassword('x', 'scrypt:zz')).toBe(false);
  });

  it('uses a random salt (same input -> different stored values)', () => {
    expect(hashInquiryPassword('same')).not.toBe(hashInquiryPassword('same'));
  });

  it('is case-sensitive', () => {
    const stored = hashInquiryPassword('AbC');
    expect(verifyInquiryPassword('abc', stored)).toBe(false);
    expect(verifyInquiryPassword('AbC', stored)).toBe(true);
  });
});
