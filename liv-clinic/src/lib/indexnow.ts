import { LOCALES } from '@/i18n/routing';
import { BASE_URL } from './seo';
import { isPreviewDeployment } from './siteEnvironment';

/**
 * IndexNow — 페이지가 생기거나 바뀌었을 때 Bing(및 IndexNow 참여 엔진: Naver, Yandex, Seznam…)에
 * 알리는 프로토콜. 접수 성공은 실제 수집·색인·검색 또는 AI 인용을 보장하지 않는다.
 *
 * - 키는 비밀이 아니다. `https://liv-clinic.net/<key>.txt`에 같은 값이 있으면 소유 증명이 된다
 *   (파일: liv-clinic/public/<key>.txt, 미들웨어 matcher는 점(.) 경로를 건너뛰어 정적으로 서빙된다).
 * - 실패해도 절대 관리자 요청을 막지 않는다 — 결과는 로그만 남긴다.
 * - preview/branch 배포에서는 force 여부와 무관하게 보내지 않는다.
 * - 개발 환경(NODE_ENV≠production)은 수동 스크립트의 force 옵션으로만 보낸다.
 */
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'e1df8e0ebf0144d48a69b03b8e4c605a';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
/** 한 번의 POST에 담을 수 있는 최대 URL 수(프로토콜 제한). */
export const INDEXNOW_MAX_URLS = 10000;

export type IndexNowResult = {
  ok: boolean;
  status?: number;
  skipped?: 'no-urls' | 'disabled' | 'not-production' | 'preview';
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
  /** 개발 환경 게이트만 무시한다. preview/disabled 차단은 유지한다. */
  force?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export async function notifyIndexNow(urls: readonly string[], options: NotifyOptions = {}): Promise<IndexNowResult> {
  const env = options.env ?? process.env;
  if (urls.length === 0) return { ok: true, skipped: 'no-urls' };
  if (env.INDEXNOW_DISABLED === '1') return { ok: true, skipped: 'disabled' };
  // The default call must retain literal process.env access inside the shared helper
  // so Next bakes the build context into SSR/ISR functions as well.
  const preview = options.env
    ? isPreviewDeployment(env.LIV_BUILD_CONTEXT || env.CONTEXT)
    : isPreviewDeployment();
  if (preview) return { ok: true, skipped: 'preview' };
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
