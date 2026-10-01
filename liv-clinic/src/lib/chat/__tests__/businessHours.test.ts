import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  businessSlot,
  dayRangeMinutes,
  getBusinessHoursConfig,
  getNextOpenAt,
  isBusinessHours,
  _resetBusinessHoursForTesting,
} from '../businessHours';

function resetEnv() {
  delete process.env.CHAT_BUSINESS_HOURS_JSON;
  delete process.env.CHAT_CLOSED_DATES;
  _resetBusinessHoursForTesting();
}

// 기본 운영시간: 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (KST)
describe('getNextOpenAt', () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

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

describe('휴진일 (CHAT_CLOSED_DATES)', () => {
  beforeEach(resetEnv);
  afterEach(() => {
    resetEnv();
    vi.restoreAllMocks();
  });

  it('휴진일에는 낮에도 영업시간이 아니다 — 다음 날은 정상', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-09';
    _resetBusinessHoursForTesting();
    // 2026-10-09(금) 12:00 KST = 03:00 UTC
    expect(isBusinessHours(new Date('2026-10-09T03:00:00Z'))).toBe(false);
    // 2026-10-10(토) 12:00 KST
    expect(isBusinessHours(new Date('2026-10-10T03:00:00Z'))).toBe(true);
  });

  it('휴진일 낮의 다음 오픈 시각은 다음 영업일 10:00 KST', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-09';
    _resetBusinessHoursForTesting();
    expect(getNextOpenAt(new Date('2026-10-09T03:00:00Z'))?.toISOString()).toBe('2026-10-10T01:00:00.000Z');
  });

  it('휴진일이 이어지면 모두 건너뛴다 (금·토 휴진 + 일요일 → 월요일)', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-09,2026-10-10';
    _resetBusinessHoursForTesting();
    // 2026-10-08(목) 20:00 KST = 11:00 UTC
    expect(getNextOpenAt(new Date('2026-10-08T11:00:00Z'))?.toISOString()).toBe('2026-10-12T01:00:00.000Z');
  });

  it('형식이 틀린 항목은 무시하고 경고를 한 번 남긴다', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.CHAT_CLOSED_DATES = ' 2026-10-09 , 10/03, 2026-13-40, 2026-02-30,';
    _resetBusinessHoursForTesting();
    expect(isBusinessHours(new Date('2026-10-09T03:00:00Z'))).toBe(false);
    // 2026-10-03(토) 12:00 KST — '10/03'은 형식이 틀려 휴진일로 치지 않는다
    expect(isBusinessHours(new Date('2026-10-03T03:00:00Z'))).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][1])).toBe('10/03, 2026-13-40, 2026-02-30');
  });

  it('비어 있으면 휴진일이 없다', () => {
    process.env.CHAT_CLOSED_DATES = '';
    _resetBusinessHoursForTesting();
    expect(isBusinessHours(new Date('2026-10-09T03:00:00Z'))).toBe(true);
  });
});

describe('businessSlot — 접수 안내 문장을 가르는 시간대', () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it('평일: 마감 61분 전 open, 60분 전부터 closing, 마감 뒤 closed', () => {
    // 2026-10-05(월). 17:59 KST = 08:59 UTC
    expect(businessSlot(new Date('2026-10-05T08:59:00Z'))).toBe('open');
    expect(businessSlot(new Date('2026-10-05T09:00:00Z'))).toBe('closing'); // 18:00
    expect(businessSlot(new Date('2026-10-05T09:59:00Z'))).toBe('closing'); // 18:59
    expect(businessSlot(new Date('2026-10-05T10:00:00Z'))).toBe('closed'); // 19:00
  });

  it('문 열기 전 새벽은 closed, 문 연 직후는 open', () => {
    expect(businessSlot(new Date('2026-10-05T00:59:00Z'))).toBe('closed'); // 09:59
    expect(businessSlot(new Date('2026-10-05T01:00:00Z'))).toBe('open'); // 10:00
  });

  it('토요일은 16시 마감 기준', () => {
    // 2026-10-10(토). 14:59 KST = 05:59 UTC
    expect(businessSlot(new Date('2026-10-10T05:59:00Z'))).toBe('open');
    expect(businessSlot(new Date('2026-10-10T06:00:00Z'))).toBe('closing'); // 15:00
    expect(businessSlot(new Date('2026-10-10T07:00:00Z'))).toBe('closed'); // 16:00
  });

  it('일요일과 휴진일은 closed', () => {
    expect(businessSlot(new Date('2026-10-11T03:00:00Z'))).toBe('closed'); // 일요일 12:00
    process.env.CHAT_CLOSED_DATES = '2026-10-05';
    _resetBusinessHoursForTesting();
    expect(businessSlot(new Date('2026-10-05T03:00:00Z'))).toBe('closed'); // 휴진일 12:00
  });
});

describe('dayRangeMinutes', () => {
  beforeEach(resetEnv);
  afterEach(resetEnv);

  it('요일별 영업 구간을 분으로 돌려준다', () => {
    const cfg = getBusinessHoursConfig();
    expect(dayRangeMinutes(cfg, 1)).toEqual({ startMin: 600, endMin: 1140 });
    expect(dayRangeMinutes(cfg, 6)).toEqual({ startMin: 600, endMin: 960 });
    expect(dayRangeMinutes(cfg, 0)).toBeNull();
  });

  it('시각 형식이 틀리면 null', () => {
    expect(dayRangeMinutes({ weekday: ['10시', '19:00'], saturday: null, sunday: null }, 1)).toBeNull();
  });
});
