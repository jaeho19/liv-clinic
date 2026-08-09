import 'server-only';

// 단순 in-memory rate limit. Vercel/Edge에서 인스턴스가 분리되면 정확도가 떨어지지만
// 1차 어뷰즈 방지로는 충분. 운영 트래픽이 커지면 Upstash Redis 또는 supabase 카운터로 교체.

const PER_MIN = Number(process.env.CHAT_RATE_LIMIT_PER_MIN ?? 10);
const PER_SESSION_TOTAL = Number(process.env.CHAT_RATE_LIMIT_PER_SESSION ?? 100);
const SESSIONS_PER_IP_DAILY = Number(process.env.CHAT_RATE_LIMIT_SESSIONS_PER_IP_DAILY ?? 50);

interface Bucket {
  windowStartMs: number;
  count: number;
}

interface SessionTotals {
  total: number;
  firstAtMs: number;
}

interface IpDailyBucket {
  dayKey: string; // YYYY-MM-DD (KST)
  count: number;
}

const sessionMinute = new Map<string, Bucket>();
const sessionTotal = new Map<string, SessionTotals>();
const ipDaily = new Map<string, IpDailyBucket>();

const MAX_ENTRIES = 10_000;

function trimIfTooLarge<K, V>(map: Map<K, V>) {
  if (map.size <= MAX_ENTRIES) return;
  // 가장 오래된 1/4를 잘라낸다 (Map 삽입 순서 = 오래된 순서 보장)
  const toDelete = Math.floor(MAX_ENTRIES / 4);
  let i = 0;
  for (const k of map.keys()) {
    map.delete(k);
    if (++i >= toDelete) break;
  }
}

function kstDateKey(now = new Date()): string {
  const utcMs = now.getTime();
  const kstMs = utcMs + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10);
}

export interface RateLimitDecision {
  allowed: boolean;
  reason?: 'per_minute' | 'per_session' | 'per_ip_daily' | 'contact_daily';
  retryAfterSec?: number;
}

export function checkSessionMessageLimit(sessionId: string): RateLimitDecision {
  const now = Date.now();
  const minute = sessionMinute.get(sessionId);
  if (!minute || now - minute.windowStartMs >= 60_000) {
    sessionMinute.set(sessionId, { windowStartMs: now, count: 1 });
  } else {
    if (minute.count >= PER_MIN) {
      const retryAfterSec = Math.max(1, Math.ceil((60_000 - (now - minute.windowStartMs)) / 1000));
      return { allowed: false, reason: 'per_minute', retryAfterSec };
    }
    minute.count += 1;
  }
  trimIfTooLarge(sessionMinute);

  const totals = sessionTotal.get(sessionId) ?? { total: 0, firstAtMs: now };
  if (totals.total >= PER_SESSION_TOTAL) {
    return { allowed: false, reason: 'per_session' };
  }
  totals.total += 1;
  sessionTotal.set(sessionId, totals);
  trimIfTooLarge(sessionTotal);

  return { allowed: true };
}

export function checkIpSessionDailyLimit(ipHash: string | null): RateLimitDecision {
  if (!ipHash) return { allowed: true };
  const dayKey = kstDateKey();
  const bucket = ipDaily.get(ipHash);
  if (!bucket || bucket.dayKey !== dayKey) {
    ipDaily.set(ipHash, { dayKey, count: 1 });
  } else {
    if (bucket.count >= SESSIONS_PER_IP_DAILY) {
      return { allowed: false, reason: 'per_ip_daily' };
    }
    bucket.count += 1;
  }
  trimIfTooLarge(ipDaily);
  return { allowed: true };
}

const CONTACT_SAVES_PER_DAY = Number(process.env.CHAT_RATE_LIMIT_CONTACT_PER_DAY ?? 5);
const contactDaily = new Map<string, IpDailyBucket>();

// 오프시간 캡처 블록의 연락처 저장 — 세션당 일일 제한 (마지막 값으로 덮어쓰기 허용)
export function checkContactSaveLimit(sessionId: string): RateLimitDecision {
  const dayKey = kstDateKey();
  const bucket = contactDaily.get(sessionId);
  if (!bucket || bucket.dayKey !== dayKey) {
    contactDaily.set(sessionId, { dayKey, count: 1 });
  } else {
    if (bucket.count >= CONTACT_SAVES_PER_DAY) {
      return { allowed: false, reason: 'contact_daily' };
    }
    bucket.count += 1;
  }
  trimIfTooLarge(contactDaily);
  return { allowed: true };
}

// 테스트/개발용 리셋
export function _resetRateLimitForTesting() {
  sessionMinute.clear();
  sessionTotal.clear();
  ipDaily.clear();
  contactDaily.clear();
}
