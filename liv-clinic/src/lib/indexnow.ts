import { LOCALES } from '@/i18n/routing';
import { BASE_URL } from './seo';

/**
 * IndexNow — 페이지가 생기거나 바뀌었을 때 Bing(및 IndexNow 참여 엔진: Naver, Yandex, Seznam…)에
 * 즉시 알리는 프로토콜. ChatGPT 검색·DuckDuckGo가 Bing 색인을 쓰므로 Bing 반영 속도가 곧
 * AI 검색 노출 속도다. (Bing Webmaster 진단 2026-09-06: "IndexNow 미설정" High)
 *
 * - 키는 비밀이 아니다. `https://liv-clinic.net/<key>.txt`에 같은 값이 있으면 소유 증명이 된다
 *   (파일: liv-clinic/public/<key>.txt, 미들웨어 matcher는 점(.) 경로를 건너뛰어 정적으로 서빙된다).
 * - 실패해도 절대 관리자 요청을 막지 않는다 — 결과는 로그만 남긴다.
 * - 개발 환경(NODE_ENV≠production)에서는 보내지 않는다. 수동 제출 스크립트는 force로 보낸다.
 */
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'e1df8e0ebf0144d48a69b03b8e4c605a';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
/** 한 번의 POST에 담을 수 있는 최대 URL 수(프로토콜 제한). */
export const INDEXNOW_MAX_URLS = 10000;

export type IndexNowResult = {
  ok: boolean;
  status?: number;
  skipped?: 'no-urls' | 'disabled' | 'not-production';
  error?: string;
};

export function indexNowKeyLocation(): string {
  return `${BASE_URL}/${INDEXNOW_KEY}.txt`;
}

/** 로케일 없는 경로 목록 → 11개 로케일의 절대 URL(중복 제거). */
export function indexNowUrlsFor(paths: readonly string[], locales: readonly string[] = LOCALES): string[] {
  const urls = new Set<string>();
  for (const path of paths) {
    for (const locale of locales) urls.add(`${BASE_URL}/${locale}${path}`);
  }
  return [...urls];
}

/** 이벤트 생성·수정·삭제 뒤 알릴 URL — 목록 + (슬러그가 있으면) 상세. 한글 슬러그는 인코딩한다. */
export function eventIndexNowUrls(slug: string | null | undefined): string[] {
  const paths = ['/events'];
  if (slug) paths.push(`/events/${encodeURIComponent(slug)}`);
  return indexNowUrlsFor(paths);
}

/** 후기 등록·수정·삭제 뒤 알릴 URL — 후기 목록(홈 후기 섹션은 목록 페이지로 대표). */
export function reviewIndexNowUrls(): string[] {
  return indexNowUrlsFor(['/reviews']);
}

export interface NotifyOptions {
  /** 개발 환경 게이트를 무시하고 보낸다(수동 스크립트용). */
  force?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export async function notifyIndexNow(urls: readonly string[], options: NotifyOptions = {}): Promise<IndexNowResult> {
  const env = options.env ?? process.env;
  if (urls.length === 0) return { ok: true, skipped: 'no-urls' };
  if (env.INDEXNOW_DISABLED === '1') return { ok: true, skipped: 'disabled' };
  if (!options.force && env.NODE_ENV !== 'production') return { ok: true, skipped: 'not-production' };

  const payload = {
    host: new URL(BASE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: indexNowKeyLocation(),
    urlList: urls.slice(0, INDEXNOW_MAX_URLS),
  };

  try {
    const doFetch = options.fetchImpl ?? fetch;
    const res = await doFetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(options.timeoutMs ?? 5000),
    });
    // 200 OK, 202 Accepted(키 검증 대기) 둘 다 접수된 것이다.
    const ok = res.status === 200 || res.status === 202;
    if (!ok) console.warn(`indexnow: HTTP ${res.status} for ${payload.urlList.length} url(s)`);
    return { ok, status: res.status };
  } catch (error) {
    console.warn('indexnow: request failed', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
