// 슬러그(또는 id)를 입력하기 전에 올린 이미지는 Storage의 temp/ 에 떨어진다.
// 저장이 확정되는 시점에 정식 폴더로 옮기고, 폼 값의 URL을 새 URL로 바꿔준다.
//
// 옮기기는 서버 라우트가 한다 — storage.objects 에 authenticated 용 UPDATE 정책이 없어
// 브라우저 세션의 move() 는 거부되기 때문이다.

const isTempUrl = (value: unknown, bucket: string): value is string =>
  typeof value === 'string' && value.includes(`/storage/v1/object/public/${bucket}/temp/`);

/** 문자열/문자열배열 필드를 훑어 temp/ URL을 전부 모은다. */
function collectTempUrls(record: Record<string, unknown>, bucket: string): string[] {
  const found = new Set<string>();
  for (const value of Object.values(record)) {
    if (isTempUrl(value, bucket)) found.add(value);
    else if (Array.isArray(value)) {
      for (const item of value) if (isTempUrl(item, bucket)) found.add(item);
    }
  }
  return [...found];
}

/** 매핑에 따라 문자열/배열 필드의 URL을 교체한다. 배열은 순서를 유지한다. */
function applyMap<T extends Record<string, unknown>>(record: T, map: Record<string, string>): T {
  const next: Record<string, unknown> = { ...record };
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string' && map[value]) next[key] = map[value];
    else if (Array.isArray(value)) {
      next[key] = value.map((item) => (typeof item === 'string' && map[item] ? map[item] : item));
    }
  }
  return next as T;
}

/**
 * `record` 안의 temp/ 이미지 URL을 `folder` 기준 정식 경로로 옮기고, URL이 교체된 사본을 돌려준다.
 * 옮길 게 없거나 요청이 실패하면 원본을 그대로 돌려준다 — 이미지 정리 때문에 저장이 막히면 안 된다.
 */
export async function finalizeTempImages<T extends Record<string, unknown>>(
  record: T,
  options: { bucket: 'events' | 'popups' | 'before-after'; folder: string }
): Promise<T> {
  const urls = collectTempUrls(record, options.bucket);
  if (urls.length === 0) return record;

  try {
    const res = await fetch('/api/admin/images/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: options.bucket, folder: options.folder, urls }),
    });
    if (!res.ok) return record;
    const { map } = (await res.json()) as { map?: Record<string, string> };
    if (!map || Object.keys(map).length === 0) return record;
    return applyMap(record, map);
  } catch {
    return record;
  }
}
