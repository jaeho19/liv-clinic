import 'server-only';

// 운영시간 판정 (KST 기준)
// - 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (사용자 확정, 2026-05-08)
// - 환경변수 CHAT_BUSINESS_HOURS_JSON 으로 override 가능
// - 휴진일: 환경변수 CHAT_CLOSED_DATES="2026-10-03,2026-10-09" (한국 날짜). 그날은 하루 종일 영업시간 외로 본다 (2026-10-01)
// - 채팅 자체는 24/7 가능, 이 모듈은 *응답 가능 안내 여부* 판단용

type DayRange = [string, string] | null; // ["10:00","19:00"] or null

export interface BusinessHoursConfig {
  weekday: DayRange;
  saturday: DayRange;
  sunday: DayRange;
}

const DEFAULT_HOURS: BusinessHoursConfig = {
  weekday: ['10:00', '19:00'],
  saturday: ['10:00', '16:00'],
  sunday: null,
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

let cachedConfig: BusinessHoursConfig | null = null;
let cachedClosedDates: Set<string> | null = null;

function loadConfig(): BusinessHoursConfig {
  if (cachedConfig) return cachedConfig;
  const raw = process.env.CHAT_BUSINESS_HOURS_JSON;
  if (!raw) {
    cachedConfig = DEFAULT_HOURS;
    return cachedConfig;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<BusinessHoursConfig>;
    // 키가 존재하면 명시적 null("휴무")도 그대로 존중한다 — `??`는 null을 기본값으로
    // 되돌려 휴무 설정을 불가능하게 만들므로 사용하지 않는다.
    cachedConfig = {
      weekday: 'weekday' in parsed ? (parsed.weekday ?? null) : DEFAULT_HOURS.weekday,
      saturday: 'saturday' in parsed ? (parsed.saturday ?? null) : DEFAULT_HOURS.saturday,
      sunday: 'sunday' in parsed ? (parsed.sunday ?? null) : DEFAULT_HOURS.sunday,
    };
    return cachedConfig;
  } catch {
    cachedConfig = DEFAULT_HOURS;
    return cachedConfig;
  }
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' 가 실제로 있는 날짜인가 (2026-02-30 같은 값은 Date가 다음 달로 넘겨 버리므로 되돌려 비교한다). */
function isRealDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

/** CHAT_CLOSED_DATES → 한국 날짜 집합. 형식이 틀린 항목은 버리고 경고 1줄. */
function loadClosedDates(): Set<string> {
  if (cachedClosedDates) return cachedClosedDates;
  const dates = new Set<string>();
  const ignored: string[] = [];
  for (const part of (process.env.CHAT_CLOSED_DATES ?? '').split(',')) {
    const value = part.trim();
    if (!value) continue;
    if (isRealDateKey(value)) dates.add(value);
    else ignored.push(value);
  }
  if (ignored.length > 0) {
    console.warn('[business hours] CHAT_CLOSED_DATES ignored entries:', ignored.join(', '));
  }
  cachedClosedDates = dates;
  return dates;
}

interface KstParts {
  hour: number;
  minute: number;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dateKey: string; // 'YYYY-MM-DD' (한국 날짜)
}

function getKstParts(date: Date): KstParts {
  // KST = UTC+9. 서머타임 없음.
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    weekday: kst.getUTCDay(),
    dateKey: kst.toISOString().slice(0, 10),
  };
}

function rangeForWeekday(cfg: BusinessHoursConfig, weekday: number): DayRange {
  if (weekday === 0) return cfg.sunday;
  if (weekday === 6) return cfg.saturday;
  return cfg.weekday;
}

function parseHHMM(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

/** 그 요일의 영업 구간을 자정부터의 분으로 (순수). 휴무·형식 오류면 null. 휴진일은 보지 않는다. */
export function dayRangeMinutes(
  cfg: BusinessHoursConfig,
  weekday: number
): { startMin: number; endMin: number } | null {
  const range = rangeForWeekday(cfg, weekday);
  if (!range) return null;
  const start = parseHHMM(range[0]);
  const end = parseHHMM(range[1]);
  if (!start || !end) return null;
  return { startMin: start.h * 60 + start.m, endMin: end.h * 60 + end.m };
}

export function isBusinessHours(now = new Date()): boolean {
  const { hour, minute, weekday, dateKey } = getKstParts(now);
  if (loadClosedDates().has(dateKey)) return false;
  const range = dayRangeMinutes(loadConfig(), weekday);
  if (!range) return false;
  const cur = hour * 60 + minute;
  return cur >= range.startMin && cur < range.endMin;
}

export type BusinessSlot = 'open' | 'closing' | 'closed';

/** 마감까지 이만큼(분) 이하로 남으면 '마감 임박' — 접수 안내 문장과 하루 두 번 요약의 기준. */
export const CLOSING_SOON_MIN = 60;

/** 접수 안내 문장을 가르는 시간대. closed = 영업시간 외 또는 휴진일. */
export function businessSlot(now = new Date()): BusinessSlot {
  if (!isBusinessHours(now)) return 'closed';
  const { hour, minute, weekday } = getKstParts(now);
  const range = dayRangeMinutes(loadConfig(), weekday);
  if (!range) return 'closed';
  return range.endMin - (hour * 60 + minute) <= CLOSING_SOON_MIN ? 'closing' : 'open';
}

/**
 * 다음 오픈 시각(UTC Date). 영업 중이거나 계산 불가(전일 휴무)면 null.
 * KST 기준으로 오늘부터 최대 14일을 탐색한다 (휴진일은 건너뛴다).
 */
export function getNextOpenAt(now = new Date()): Date | null {
  if (isBusinessHours(now)) return null;
  const cfg = loadConfig();
  const closed = loadClosedDates();
  const nowMs = now.getTime();
  const kstNow = new Date(nowMs + KST_OFFSET_MS);
  for (let offset = 0; offset <= 14; offset++) {
    const kstDay = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + offset)
    );
    if (closed.has(kstDay.toISOString().slice(0, 10))) continue;
    const range = dayRangeMinutes(cfg, kstDay.getUTCDay());
    if (!range) continue;
    const openMs = kstDay.getTime() + range.startMin * 60_000 - KST_OFFSET_MS;
    if (openMs > nowMs) return new Date(openMs);
  }
  return null;
}

export function getBusinessHoursConfig(): BusinessHoursConfig {
  return loadConfig();
}

// 테스트용 캐시 리셋
export function _resetBusinessHoursForTesting() {
  cachedConfig = null;
  cachedClosedDates = null;
}
