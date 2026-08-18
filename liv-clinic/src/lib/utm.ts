/**
 * 세션 첫 터치 UTM 캡처.
 *
 * 랜딩 시 URL의 utm_* 파라미터를 sessionStorage에 저장해 두었다가
 * 상담 폼 제출 시 consultation_requests.utm_* 컬럼으로 보낸다.
 * 첫 터치 유지: 이미 저장된 값이 있으면 이후 페이지의 UTM으로 덮어쓰지 않는다.
 * 스토리지 접근 실패(시크릿 모드 등)는 조용히 무시한다 — 추적은 부가 기능이다.
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export const UTM_STORAGE_KEY = 'liv_utm_first_touch';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const UTM_KEYS: [string, keyof UtmParams][] = [
  ['utm_source', 'source'],
  ['utm_medium', 'medium'],
  ['utm_campaign', 'campaign'],
  ['utm_content', 'content'],
];

const MAX_LEN = 100;

function sanitize(v: string): string {
  return v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, MAX_LEN);
}

export function parseUtmFromSearch(search: string): UtmParams | null {
  if (!search) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  const out: UtmParams = {};
  let found = false;
  for (const [queryKey, key] of UTM_KEYS) {
    const raw = params.get(queryKey);
    if (!raw) continue;
    const clean = sanitize(raw);
    if (!clean) continue;
    out[key] = clean;
    found = true;
  }
  return found ? out : null;
}

export function captureUtm(search: string, storage: StorageLike): void {
  try {
    if (storage.getItem(UTM_STORAGE_KEY)) return; // 첫 터치 유지
    const utm = parseUtmFromSearch(search);
    if (!utm) return;
    storage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // 스토리지 불가 환경 — 무시
  }
}

/** UTM DB 컬럼 값 (consultation_requests.utm_*) */
export interface UtmColumns {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
}

/**
 * API 요청 본문(camelCase)에서 UTM 컬럼 값을 안전하게 추출한다.
 * 문자열이 아니거나 비어 있으면 null — 상담 저장을 절대 실패시키지 않는 부가 필드.
 */
export function pickUtmFields(body: unknown): UtmColumns {
  const rec = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const get = (key: string): string | null => {
    const v = rec[key];
    if (typeof v !== 'string') return null;
    const clean = sanitize(v.trim());
    return clean === '' ? null : clean;
  };
  return {
    utm_source: get('utmSource'),
    utm_medium: get('utmMedium'),
    utm_campaign: get('utmCampaign'),
    utm_content: get('utmContent'),
  };
}

/**
 * 폼 제출 본문에 붙일 camelCase UTM 필드.
 * 인자를 생략하면 브라우저 sessionStorage를 쓰고, SSR/차단 환경에선 빈 객체.
 */
export function storedUtmBody(storage?: StorageLike): Record<string, string> {
  let target = storage;
  if (!target) {
    if (typeof window === 'undefined') return {};
    try {
      target = window.sessionStorage;
    } catch {
      return {};
    }
  }
  const utm = readStoredUtm(target);
  if (!utm) return {};
  const out: Record<string, string> = {};
  if (utm.source) out.utmSource = utm.source;
  if (utm.medium) out.utmMedium = utm.medium;
  if (utm.campaign) out.utmCampaign = utm.campaign;
  if (utm.content) out.utmContent = utm.content;
  return out;
}

export function readStoredUtm(storage: StorageLike): UtmParams | null {
  try {
    const raw = storage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const rec = parsed as Record<string, unknown>;
    const out: UtmParams = {};
    let found = false;
    for (const [, key] of UTM_KEYS) {
      const v = rec[key];
      if (typeof v === 'string' && v) {
        out[key] = sanitize(v);
        found = true;
      }
    }
    return found ? out : null;
  } catch {
    return null;
  }
}
