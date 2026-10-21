import { describe, it, expect, afterEach } from 'vitest';
import { _resetBusinessHoursForTesting } from '@/lib/chat/businessHours';
import {
  addDays,
  buildCalendarText,
  checkBookingSlot,
  currentCalendarContext,
  dayStatus,
  holidayHorizon,
  nowLine,
  promiseEnglish,
  replyPromise,
  type CalendarContext,
} from '../calendar';

const CTX: CalendarContext = {
  hours: { weekday: ['10:00', '19:00'], saturday: ['10:00', '16:00'], sunday: null },
  closedDates: new Set(['2026-10-05', '2026-10-15', '2026-10-21', '2026-10-29']),
};
const NO_HOLIDAYS: CalendarContext = { ...CTX, closedDates: new Set() };
/** 한국 시각으로 적는다: kst('2026-10-02 16:20') */
const kst = (s: string) => new Date(`${s.replace(' ', 'T')}:00+09:00`);
const FRI_1620 = kst('2026-10-02 16:20');

describe('dayStatus', () => {
  it('평일·토요일의 진료 시간, 일요일과 휴진일', () => {
    expect(dayStatus('2026-10-14', CTX)).toEqual({
      dateKey: '2026-10-14',
      weekday: 3,
      range: { startMin: 600, endMin: 1140 },
      reason: 'open',
    });
    expect(dayStatus('2026-10-17', CTX).range).toEqual({ startMin: 600, endMin: 960 });
    expect(dayStatus('2026-10-18', CTX)).toMatchObject({ weekday: 0, range: null, reason: 'weekly_closed' });
    expect(dayStatus('2026-10-15', CTX)).toMatchObject({ weekday: 4, range: null, reason: 'holiday' });
  });
});

describe('addDays · holidayHorizon', () => {
  it('날짜를 더한다(달·해를 넘어간다)', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-02', 0)).toBe('2026-10-02');
  });

  it('휴진일이 등록된 마지막 달의 말일까지만 휴진 여부를 안다', () => {
    expect(holidayHorizon(FRI_1620, CTX.closedDates)).toBe('2026-10-31');
    expect(holidayHorizon(FRI_1620, new Set(['2026-10-05', '2026-11-11']))).toBe('2026-11-30');
  });

  it('등록된 휴진일이 없거나 모두 지난 달이면 이번 달 말일', () => {
    expect(holidayHorizon(FRI_1620, new Set())).toBe('2026-10-31');
    expect(holidayHorizon(kst('2027-02-10 12:00'), new Set(['2026-10-05']))).toBe('2027-02-28');
  });
});

describe('buildCalendarText', () => {
  const lines = buildCalendarText(FRI_1620, CTX).split('\n');

  it('오늘부터 45일, 오늘·내일 표시', () => {
    expect(lines).toHaveLength(45);
    expect(lines[0]).toBe('2026-10-02 Fri (today): open 10:00-19:00');
    expect(lines[1]).toBe('2026-10-03 Sat (tomorrow): open 10:00-16:00');
    expect(lines[44].startsWith('2026-11-15 Sun')).toBe(true);
  });

  it('일요일과 휴진일', () => {
    expect(lines[2]).toBe('2026-10-04 Sun: CLOSED (Sunday)');
    expect(lines[3]).toBe('2026-10-05 Mon: CLOSED (clinic holiday)');
  });

  it('휴진일이 등록되지 않은 달은 "보통 열림"으로 적는다', () => {
    expect(lines).toContain('2026-10-31 Sat: open 10:00-16:00');
    expect(lines).toContain('2026-11-01 Sun: CLOSED (Sunday)');
    expect(lines).toContain('2026-11-02 Mon: usually open 10:00-19:00 (holidays not registered yet)');
  });

  it('한국 날짜 기준이다 (UTC로는 전날 밤)', () => {
    expect(buildCalendarText(new Date('2026-10-02T15:30:00Z'), CTX, 1)).toBe('2026-10-03 Sat (today): open 10:00-16:00');
  });
});

describe('checkBookingSlot', () => {
  const check = (date: string, time: string | null, now = FRI_1620) => checkBookingSlot(date, time, now, CTX);

  it('열린 날의 진료 시간 안이면 ok (시간이 없으면 날짜만 본다)', () => {
    expect(check('2026-10-14', '14:00')).toBe('ok');
    expect(check('2026-10-14', '10:00')).toBe('ok');
    expect(check('2026-10-14', '18:59')).toBe('ok');
    expect(check('2026-10-14', null)).toBe('ok');
    expect(check('2026-11-16', '14:00')).toBe('ok'); // 휴진일 미등록 달 — 직원이 확정 때 본다
  });

  it('휴진일·일요일은 closed_day', () => {
    expect(check('2026-10-15', '14:00')).toBe('closed_day');
    expect(check('2026-10-18', null)).toBe('closed_day');
  });

  it('진료 시간 밖은 outside_hours (마감 시각 자체도 밖이다)', () => {
    expect(check('2026-10-14', '09:30')).toBe('outside_hours');
    expect(check('2026-10-14', '19:00')).toBe('outside_hours');
    expect(check('2026-10-17', '16:30')).toBe('outside_hours'); // 토요일은 16시까지
  });

  it('지난 날, 오늘의 지난 시각은 past', () => {
    expect(check('2026-10-01', '14:00')).toBe('past');
    expect(check('2026-10-02', '15:00')).toBe('past'); // 지금 16:20
    expect(check('2026-10-02', '17:00')).toBe('ok');
    expect(check('2026-10-02', null)).toBe('ok');
    // 오늘 진료가 끝난 뒤의 "오늘, 시간은 아무 때나"도 지난 것이다
    expect(check('2026-10-02', null, kst('2026-10-02 18:59'))).toBe('ok');
    expect(check('2026-10-02', null, kst('2026-10-02 19:00'))).toBe('past');
    expect(check('2026-10-03', null, kst('2026-10-03 16:30'))).toBe('past'); // 토요일은 16시까지
  });

  it('형식이 틀리거나 1년보다 먼 날은 invalid', () => {
    expect(check('2026-02-30', null)).toBe('invalid');
    expect(check('tomorrow', null)).toBe('invalid');
    expect(check('2026-10-14', '14:60')).toBe('invalid');
    expect(check('2026-10-14', '2pm')).toBe('invalid');
    expect(check('2028-01-10', '14:00')).toBe('invalid');
  });
});

describe('replyPromise', () => {
  it('상담 시간 중이면 open', () => {
    expect(replyPromise(FRI_1620, CTX)).toEqual({ slot: 'open', nextBusinessDay: null });
  });

  it('마감 1시간 전부터는 closing — 다음 영업일을 함께 준다', () => {
    expect(replyPromise(kst('2026-10-02 18:10'), CTX)).toEqual({ slot: 'closing', nextBusinessDay: '2026-10-03' });
    expect(replyPromise(kst('2026-10-02 18:00'), CTX).slot).toBe('closing');
    expect(replyPromise(kst('2026-10-02 17:59'), CTX).slot).toBe('open');
    // 토요일 15:10 — 일요일과 10/5 휴진을 건너뛴다
    expect(replyPromise(kst('2026-10-03 15:10'), CTX)).toEqual({ slot: 'closing', nextBusinessDay: '2026-10-06' });
  });

  it('상담 시간 밖이면 closed — 문 열기 전이면 오늘, 아니면 다음 영업일', () => {
    expect(replyPromise(kst('2026-10-02 20:00'), CTX)).toEqual({ slot: 'closed', nextBusinessDay: '2026-10-03' });
    expect(replyPromise(kst('2026-10-02 07:00'), CTX)).toEqual({ slot: 'closed', nextBusinessDay: '2026-10-02' });
    expect(replyPromise(kst('2026-10-03 17:00'), CTX)).toEqual({ slot: 'closed', nextBusinessDay: '2026-10-06' });
    expect(replyPromise(kst('2026-10-05 12:00'), CTX)).toEqual({ slot: 'closed', nextBusinessDay: '2026-10-06' }); // 휴진일 낮
  });

  it('14일 안에 여는 날이 없으면 nextBusinessDay 는 null', () => {
    const never: CalendarContext = { hours: { weekday: null, saturday: null, sunday: null }, closedDates: new Set() };
    expect(replyPromise(FRI_1620, never)).toEqual({ slot: 'closed', nextBusinessDay: null });
  });
});

describe('프롬프트에 넣는 문장', () => {
  it('promiseEnglish', () => {
    expect(promiseEnglish({ slot: 'open', nextBusinessDay: null })).toBe('today (Korea time)');
    expect(promiseEnglish({ slot: 'closing', nextBusinessDay: '2026-10-03' })).toBe(
      'today if possible, otherwise on the morning of the next business day (2026-10-03 Sat, Korea time)'
    );
    expect(promiseEnglish({ slot: 'closed', nextBusinessDay: '2026-10-06' })).toBe(
      'on the morning of the next business day (2026-10-06 Tue, Korea time)'
    );
    expect(promiseEnglish({ slot: 'closed', nextBusinessDay: null })).toBe('on the next business day');
  });

  it('nowLine', () => {
    expect(nowLine(FRI_1620, CTX)).toBe('2026-10-02 Fri 16:20 — the clinic is open right now.');
    expect(nowLine(kst('2026-10-04 11:00'), CTX)).toBe('2026-10-04 Sun 11:00 — the clinic is closed right now.');
    expect(nowLine(kst('2026-10-02 18:30'), NO_HOLIDAYS)).toBe('2026-10-02 Fri 18:30 — the clinic is open right now.');
  });
});

describe('currentCalendarContext', () => {
  afterEach(() => {
    delete process.env.CHAT_CLOSED_DATES;
    _resetBusinessHoursForTesting();
  });

  it('운영 설정의 진료 시간과 휴진일을 읽는다', () => {
    process.env.CHAT_CLOSED_DATES = '2026-10-05, 2026-10-15';
    _resetBusinessHoursForTesting();
    const ctx = currentCalendarContext();
    expect([...ctx.closedDates].sort()).toEqual(['2026-10-05', '2026-10-15']);
    expect(ctx.hours.saturday).toEqual(['10:00', '16:00']);
  });
});
