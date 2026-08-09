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

/**
 * 다음 오픈 시각(UTC Date). 영업 중이거나 계산 불가(전일 휴무)면 null.
 * KST 기준으로 오늘부터 최대 7일을 탐색한다.
 */
export function getNextOpenAt(now = new Date()): Date | null {
  if (isBusinessHours(now)) return null;
  const cfg = loadConfig();
  const nowMs = now.getTime();
  const kstNow = new Date(nowMs + 9 * 60 * 60 * 1000);
  for (let offset = 0; offset <= 7; offset++) {
    const kstDay = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + offset)
    );
    const range = rangeForWeekday(cfg, kstDay.getUTCDay());
    if (!range) continue;
    const start = parseHHMM(range[0]);
    if (!start) continue;
    const openMs =
      kstDay.getTime() + (start.h * 60 + start.m) * 60_000 - 9 * 60 * 60 * 1000;
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
}
