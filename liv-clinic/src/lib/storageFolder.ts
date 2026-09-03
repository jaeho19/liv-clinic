// Supabase Storage rejects object keys containing non-ASCII characters with
// 400 InvalidKey ("Invalid key: 8월-프로모션/probe.png"), so every folder segment
// built from user-authored text (event slugs, popup ids) has to be normalized first.

const UNSAFE_CHARACTERS = /[^A-Za-z0-9._-]+/g;
const SEPARATOR_RUN = /-{2,}/g;
const EDGE_SEPARATORS = /^[-.]+|[-.]+$/g;
const ALPHANUMERIC = /[A-Za-z0-9]/g;

const MAX_LENGTH = 60;
const FALLBACK_FOLDER = 'temp';
const MIN_ALPHANUMERICS = 2;
const DISCRIMINATOR_LENGTH = 8;

const countAlphanumerics = (value: string): number => value.match(ALPHANUMERIC)?.length ?? 0;

// 슬러그에서 안정적인 짧은 ASCII 식별자를 만든다 (FNV-1a 32bit).
// 암호용이 아니라 폴더를 구분하기 위한 것이므로 충돌 저항성은 이 정도면 충분하다.
const discriminator = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(DISCRIMINATOR_LENGTH - 2, '0').slice(0, DISCRIMINATOR_LENGTH - 2);
};

/**
 * Normalizes a storage folder name into a key segment Supabase Storage accepts.
 *
 * ASCII slugs pass through unchanged. A slug that loses (almost) everything to
 * normalization — a Korean event slug, say — gets a stable per-slug folder such as
 * `ev-1a2b3c` instead of the shared `temp`.
 *
 * 예전에는 이런 슬러그가 전부 `temp`로 접혔다. 그래서 서로 다른 이벤트의 이미지가
 * events/temp 한 폴더에 125장까지 섞여 어느 파일이 살아 있는지 가려낼 수 없었다.
 * 입력이 아예 비어 있을 때만 `temp`를 쓴다 (파생시킬 원본이 없다).
 */
export function sanitizeStorageFolder(folder: string): string {
  const normalized = folder
    .replace(UNSAFE_CHARACTERS, '-')
    .replace(SEPARATOR_RUN, '-')
    .replace(EDGE_SEPARATORS, '')
    .toLowerCase()
    .slice(0, MAX_LENGTH)
    .replace(EDGE_SEPARATORS, '');

  if (countAlphanumerics(normalized) >= MIN_ALPHANUMERICS) return normalized;
  if (folder.trim() === '') return FALLBACK_FOLDER;

  const suffix = `ev-${discriminator(folder.trim())}`;
  return normalized === '' ? suffix : `${normalized}-${suffix}`.slice(0, MAX_LENGTH).replace(EDGE_SEPARATORS, '');
}
