#!/usr/bin/env node
/**
 * IndexNow 수동 제출 — 배포 직후 사이트맵 전체를 한 번 알리거나, 특정 URL만 알린다.
 *
 *   node scripts/indexnow-submit.mjs --sitemap            # https://liv-clinic.net/sitemap.xml 전체
 *   node scripts/indexnow-submit.mjs https://liv-clinic.net/en/terms https://liv-clinic.net/ko/terms
 *   node scripts/indexnow-submit.mjs --sitemap --dry-run  # 보내지 않고 목록만
 *
 * 이 PC(TLS 가로채기 프록시)에서는 `NODE_TLS_REJECT_UNAUTHORIZED=0`을 앞에 붙여야 fetch가 된다.
 * 키·엔드포인트는 src/lib/indexnow.ts와 같다 (NEXT_PUBLIC_SITE_URL / INDEXNOW_KEY 로 덮어쓸 수 있다).
 */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net';
const KEY = process.env.INDEXNOW_KEY || 'e1df8e0ebf0144d48a69b03b8e4c605a';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX = 10000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const useSitemap = args.includes('--sitemap');
let urls = args.filter((a) => !a.startsWith('--'));

if (useSitemap) {
  const xml = await (await fetch(`${BASE_URL}/sitemap.xml`)).text();
  urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}
urls = [...new Set(urls)];
if (urls.length === 0) {
  console.error('제출할 URL이 없습니다. --sitemap 또는 URL을 넘기세요.');
  process.exit(1);
}
if (urls.length > MAX) {
  console.error(`URL이 ${urls.length}개 — IndexNow는 한 번에 ${MAX}개까지입니다.`);
  process.exit(1);
}

const keyLocation = `${BASE_URL}/${KEY}.txt`;
const keyRes = await fetch(keyLocation);
const keyBody = (await keyRes.text()).trim();
if (keyRes.status !== 200 || keyBody !== KEY) {
  console.error(`키 파일 확인 실패: ${keyLocation} → HTTP ${keyRes.status}, 본문 "${keyBody.slice(0, 40)}"`);
  process.exit(1);
}
console.log(`키 파일 OK: ${keyLocation}`);
console.log(`제출 URL ${urls.length}개 (첫 3개): ${urls.slice(0, 3).join(', ')}`);
if (dryRun) process.exit(0);

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(BASE_URL).host, key: KEY, keyLocation, urlList: urls }),
});
const text = await res.text();
console.log(`IndexNow 응답: HTTP ${res.status} ${text ? `— ${text.slice(0, 200)}` : '(본문 없음)'}`);
console.log(res.status === 200 ? '접수됨' : res.status === 202 ? '접수됨(키 검증 대기)' : '실패 — 상태 코드를 확인하세요 (403 키 불일치, 422 URL 호스트 불일치, 429 과다 요청)');
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
