import 'server-only';

// 운영시간 판정 (KST 기준)
// - 평일 10:00–19:00, 토 10:00–16:00, 일 휴무 (사용자 확정, 2026-05-08)
// - 환경변수 CHAT_BUSINESS_HOURS_JSON 으로 override 가능
// - 채팅 자체는 24/7 가능, 이 모듈은 *응답 가능 안내 여부* 판단용

type DayRange = [string, string] | null; // ["10:00","19:00"] or null

interface BusinessHoursConfig {
  weekday: DayRange;
  saturday: DayRange;
  sunday: DayRange;
}

const DEFAULT_HOURS: BusinessHoursConfig = {
  weekday: ['10:00', '19:00'],
  saturday: ['10:00', '16:00'],
  sunday: null,
};

let cachedConfig: BusinessHoursConfig | null = null;

function loadConfig(): BusinessHoursConfig {
  if (cachedConfig) return cachedConfig;
  const raw = process.env.CHAT_BUSINESS_HOURS_JSON;
  if (!raw) {
    cachedConfig = DEFAULT_HOURS;
    return cachedConfig;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<BusinessHoursConfig>;
    cachedConfig = {
      weekday: parsed.weekday ?? DEFAULT_HOURS.weekday,
      saturday: parsed.saturday ?? DEFAULT_HOURS.saturday,
      sunday: parsed.sunday ?? DEFAULT_HOURS.sunday,
    };
    return cachedConfig;
  } catch {
    cachedConfig = DEFAULT_HOURS;
    return cachedConfig;
  }
}

interface KstParts {
  hour: number;
  minute: number;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

function getKstParts(date: Date): KstParts {
  // KST = UTC+9. 서머타임 없음.
  const utcMs = date.getTime();
  const kst = new Date(utcMs + 9 * 60 * 60 * 1000);
  return {
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    weekday: kst.getUTCDay(),
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

export function isBusinessHours(now = new Date()): boolean {
  const cfg = loadConfig();
  const { hour, minute, weekday } = getKstParts(now);
  const range = rangeForWeekday(cfg, weekday);
  if (!range) return false;
  const start = parseHHMM(range[0]);
  const end = parseHHMM(range[1]);
  if (!start || !end) return false;
  const cur = hour * 60 + minute;
  const startMin = start.h * 60 + start.m;
  const endMin = end.h * 60 + end.m;
  return cur >= startMin && cur < endMin;
}

export function getBusinessHoursConfig(): BusinessHoursConfig {
  return loadConfig();
}

// 테스트용 캐시 리셋
export function _resetBusinessHoursForTesting() {
  cachedConfig = null;
}
