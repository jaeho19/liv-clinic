import {
  CLOSING_SOON_MIN,
  dayRangeMinutes,
  getBusinessHoursConfig,
  getClosedDates,
  type BusinessHoursConfig,
} from '@/lib/chat/businessHours';

// AI 응대가 쓰는 달력 (스펙 2026-10-02 chat-ai-first-response §4.4·§4.5·§4.6 C-10).
// 전부 한국 날짜·시각 기준. 진료 시간과 휴진일을 인자로 받는 순수 함수라 테스트에서 값을 넣어 본다.
// 운영 값은 currentCalendarContext() 가 businessHours.ts 에서 읽어 온다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
/** 다음 영업일을 찾을 때 훑는 날 수 (businessHours.getNextOpenAt 과 같다) */
const NEXT_OPEN_SCAN_DAYS = 14;
/** 가예약을 받는 가장 먼 날 */
const MAX_BOOKING_DAYS_AHEAD = 365;

export interface CalendarContext {
  hours: BusinessHoursConfig;
  /** 휴진일(한국 날짜 YYYY-MM-DD) */
  closedDates: ReadonlySet<string>;
}

/** 운영 설정(CHAT_BUSINESS_HOURS_JSON · CHAT_CLOSED_DATES)으로 만든 달력 조건. */
export function currentCalendarContext(): CalendarContext {
  return { hours: getBusinessHoursConfig(), closedDates: getClosedDates() };
}

interface KstNow {
  dateKey: string;
  /** 자정부터의 분 */
  minutes: number;
  hhmm: string;
}

function kstNow(now: Date): KstNow {
  const iso = new Date(now.getTime() + KST_OFFSET_MS).toISOString();
  return { dateKey: iso.slice(0, 10), minutes: Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)), hhmm: iso.slice(11, 16) };
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' 가 실제로 있는 날짜인가 (2026-02-30 같은 값을 거른다). */
export function isRealDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

export function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

const weekdayOf = (dateKey: string): number => new Date(`${dateKey}T00:00:00Z`).getUTCDay();
const hhmm = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export interface DayStatus {
  dateKey: string;
  /** 0 = 일요일 … 6 = 토요일 */
  weekday: number;
  /** 진료 시간(자정부터의 분). 쉬는 날이면 null */
  range: { startMin: number; endMin: number } | null;
  /** open = 여는 날, weekly_closed = 매주 쉬는 요일, holiday = 등록된 휴진일 */
  reason: 'open' | 'weekly_closed' | 'holiday';
}

export function dayStatus(dateKey: string, ctx: CalendarContext): DayStatus {
  const weekday = weekdayOf(dateKey);
  if (ctx.closedDates.has(dateKey)) return { dateKey, weekday, range: null, reason: 'holiday' };
  const range = dayRangeMinutes(ctx.hours, weekday);
  return { dateKey, weekday, range, reason: range ? 'open' : 'weekly_closed' };
}

/**
 * 휴진 여부를 아는 마지막 날 — 휴진일이 등록된 마지막 달의 말일.
 * 등록된 휴진일이 없거나 모두 지난 달의 것이면 이번 달 말일로 본다(휴진일은 달마다 등록한다).
 */
export function holidayHorizon(now: Date, closedDates: ReadonlySet<string>): string {
  const today = kstNow(now).dateKey;
  const latest = [...closedDates].sort().pop();
  const month = latest && latest.slice(0, 7) > today.slice(0, 7) ? latest.slice(0, 7) : today.slice(0, 7);
  const [year, mon] = month.split('-').map(Number);
  return new Date(Date.UTC(year, mon, 0)).toISOString().slice(0, 10); // 다음 달 0일 = 이번 달 말일
}

/** 프롬프트의 CALENDAR — 오늘부터 days 일을 한 줄씩. */
export function buildCalendarText(now: Date, ctx: CalendarContext, days = 45): string {
  const today = kstNow(now).dateKey;
  const horizon = holidayHorizon(now, ctx.closedDates);
  const lines: string[] = [];
  for (let i = 0; i < days; i++) {
    const s = dayStatus(addDays(today, i), ctx);
    const tag = i === 0 ? ' (today)' : i === 1 ? ' (tomorrow)' : '';
    let state: string;
    if (s.range) {
      const span = `${hhmm(s.range.startMin)}-${hhmm(s.range.endMin)}`;
      state = s.dateKey <= horizon ? `open ${span}` : `usually open ${span} (holidays not registered yet)`;
    } else if (s.reason === 'holiday') {
      state = 'CLOSED (clinic holiday)';
    } else {
      state = s.weekday === 0 ? 'CLOSED (Sunday)' : 'CLOSED';
    }
    lines.push(`${s.dateKey} ${WEEKDAY_EN[s.weekday]}${tag}: ${state}`);
  }
  return lines.join('\n');
}

export type SlotCheck = 'ok' | 'invalid' | 'past' | 'closed_day' | 'outside_hours';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** 가예약의 날짜·시간을 본다 (검사 C-10). time 이 없으면 날짜만 본다 — 오늘이면 오늘 진료가 아직 남아 있어야 한다. */
export function checkBookingSlot(dateKey: string, time: string | null, now: Date, ctx: CalendarContext): SlotCheck {
  if (!isRealDateKey(dateKey)) return 'invalid';
  const t = time === null ? null : TIME_RE.exec(time);
  if (time !== null && !t) return 'invalid';
  const today = kstNow(now);
  if (dateKey > addDays(today.dateKey, MAX_BOOKING_DAYS_AHEAD)) return 'invalid';
  if (dateKey < today.dateKey) return 'past';
  const status = dayStatus(dateKey, ctx);
  if (!status.range) return 'closed_day';
  if (t) {
    const minutes = Number(t[1]) * 60 + Number(t[2]);
    if (dateKey === today.dateKey && minutes < today.minutes) return 'past';
    if (minutes < status.range.startMin || minutes >= status.range.endMin) return 'outside_hours';
  } else if (dateKey === today.dateKey && today.minutes >= status.range.endMin) {
    // "오늘, 시간은 아무 때나" — 오늘 진료가 이미 끝났다
    return 'past';
  }
  return 'ok';
}

export type PromiseSlot = 'open' | 'closing' | 'closed';

export interface ReplyPromise {
  /** open = 상담 시간 중, closing = 마감 1시간 전부터, closed = 상담 시간 밖(휴진일 포함) */
  slot: PromiseSlot;
  /** closing·closed 일 때 확정을 알릴 수 있는 다음 영업일(한국 날짜). open 이면 null, 14일 안에 여는 날이 없어도 null */
  nextBusinessDay: string | null;
}

/**
 * 손님에게 "언제 확정을 알려 드린다"고 약속할 수 있는가 (스펙 §4.5).
 * 원장님 결정 ③: 상담 시간 중이면 오늘 안에, 밖이면 다음 영업일 오전에. 마감 1시간 전부터는 "오늘 안에, 어려우면 다음 영업일 오전에".
 */
export function replyPromise(now: Date, ctx: CalendarContext): ReplyPromise {
  const today = kstNow(now);
  const status = dayStatus(today.dateKey, ctx);
  const inHours = status.range !== null && today.minutes >= status.range.startMin && today.minutes < status.range.endMin;
  const firstOpenFrom = (startOffset: number): string | null => {
    for (let i = startOffset; i <= NEXT_OPEN_SCAN_DAYS; i++) {
      const key = addDays(today.dateKey, i);
      if (dayStatus(key, ctx).range) return key;
    }
    return null;
  };
  if (inHours && status.range) {
    const closing = status.range.endMin - today.minutes <= CLOSING_SOON_MIN;
    return closing ? { slot: 'closing', nextBusinessDay: firstOpenFrom(1) } : { slot: 'open', nextBusinessDay: null };
  }
  // 문 열기 전이면 오늘이 다음 영업일이다
  const beforeOpening = status.range !== null && today.minutes < status.range.startMin;
  return { slot: 'closed', nextBusinessDay: firstOpenFrom(beforeOpening ? 0 : 1) };
}

/** 프롬프트에 넣는 약속 문구 (영어) — "we will get back to you {…}". */
export function promiseEnglish(p: ReplyPromise): string {
  if (p.slot === 'open') return 'today (Korea time)';
  if (!p.nextBusinessDay) return p.slot === 'closing' ? 'today if possible' : 'on the next business day';
  const day = `${p.nextBusinessDay} ${WEEKDAY_EN[weekdayOf(p.nextBusinessDay)]}`;
  return p.slot === 'closing'
    ? `today if possible, otherwise on the morning of the next business day (${day}, Korea time)`
    : `on the morning of the next business day (${day}, Korea time)`;
}

/** 프롬프트의 NOW 줄. */
export function nowLine(now: Date, ctx: CalendarContext): string {
  const today = kstNow(now);
  const open = replyPromise(now, ctx).slot !== 'closed';
  return `${today.dateKey} ${WEEKDAY_EN[weekdayOf(today.dateKey)]} ${today.hhmm} — the clinic is ${open ? 'open' : 'closed'} right now.`;
}
