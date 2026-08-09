import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getNextOpenAt, _resetBusinessHoursForTesting } from '../businessHours';

// 기본 운영시간: 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (KST)
describe('getNextOpenAt', () => {
  beforeEach(() => {
    delete process.env.CHAT_BUSINESS_HOURS_JSON;
    _resetBusinessHoursForTesting();
  });
  afterEach(() => {
    delete process.env.CHAT_BUSINESS_HOURS_JSON;
    _resetBusinessHoursForTesting();
  });

  it('일요일 낮 → 월요일 10:00 KST', () => {
    // 2026-08-09(일) 14:00 KST = 05:00 UTC
    const now = new Date('2026-08-09T05:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-10T01:00:00.000Z');
  });

  it('토요일 마감(16시) 이후 → 월요일 10:00 KST', () => {
    // 2026-08-08(토) 17:00 KST = 08:00 UTC
    const now = new Date('2026-08-08T08:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-10T01:00:00.000Z');
  });

  it('금요일 밤 → 토요일 10:00 KST', () => {
    // 2026-08-07(금) 20:00 KST = 11:00 UTC
    const now = new Date('2026-08-07T11:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-08T01:00:00.000Z');
  });

  it('평일 오픈 전 → 같은 날 10:00 KST', () => {
    // 2026-08-10(월) 08:00 KST = 2026-08-09T23:00:00Z
    const now = new Date('2026-08-09T23:00:00Z');
    expect(getNextOpenAt(now)?.toISOString()).toBe('2026-08-10T01:00:00.000Z');
  });

  it('영업 중 → null', () => {
    // 2026-08-10(월) 12:00 KST = 03:00 UTC
    expect(getNextOpenAt(new Date('2026-08-10T03:00:00Z'))).toBeNull();
  });

  it('전일 휴무 설정이면 null (무한 루프 방지)', () => {
    process.env.CHAT_BUSINESS_HOURS_JSON = JSON.stringify({
      weekday: null,
      saturday: null,
      sunday: null,
    });
    _resetBusinessHoursForTesting();
    expect(getNextOpenAt(new Date('2026-08-09T05:00:00Z'))).toBeNull();
  });
});
