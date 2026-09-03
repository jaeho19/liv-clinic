import { describe, it, expect } from 'vitest';
import { shouldSendAutoAck } from '../autoAck';
import { getAutoAckTexts, VISITOR_LOCALES } from '../serverI18n';

describe('shouldSendAutoAck', () => {
  it('기다리는 중이 아니면(awaiting_since NULL) 안 보낸다', () => {
    expect(shouldSendAutoAck({ awaitingSince: null, autoAckAt: null })).toBe(false);
  });
  it('아직 한 번도 안 보냈으면 보낸다', () => {
    expect(shouldSendAutoAck({ awaitingSince: '2024-01-01T01:00:00Z', autoAckAt: null })).toBe(true);
  });
  it('이번 대기 구간이 시작된 뒤에 이미 보냈으면 안 보낸다', () => {
    expect(
      shouldSendAutoAck({ awaitingSince: '2024-01-01T01:00:00Z', autoAckAt: '2024-01-01T01:00:05Z' })
    ).toBe(false);
  });
  it('지난 대기 구간에 보낸 것이면(직원 답변 후 손님 재발신) 다시 보낸다', () => {
    expect(
      shouldSendAutoAck({ awaitingSince: '2024-01-02T09:00:00Z', autoAckAt: '2024-01-01T01:00:05Z' })
    ).toBe(true);
  });
});

describe('getAutoAckTexts', () => {
  it('10개 로케일 모두 영업시간 중/외 문구가 있고 서로 다르다', () => {
    for (const locale of VISITOR_LOCALES) {
      const open = getAutoAckTexts(locale, false);
      const off = getAutoAckTexts(locale, true);
      expect(open.localized.length).toBeGreaterThan(10);
      expect(off.localized.length).toBeGreaterThan(10);
      expect(open.localized).not.toBe(off.localized);
    }
  });
  it('한국어 원문은 로케일과 무관하게 같고, 영업시간 중/외가 다르다', () => {
    expect(getAutoAckTexts('en', false).ko).toBe(getAutoAckTexts('ja', false).ko);
    expect(getAutoAckTexts('en', false).ko).toContain('잠시만 기다려 주세요');
    expect(getAutoAckTexts('en', true).ko).toContain('상담 시간에 순서대로');
  });
});
