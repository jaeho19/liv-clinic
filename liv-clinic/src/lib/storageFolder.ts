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

const countAlphanumerics = (value: string): number => value.match(ALPHANUMERIC)?.length ?? 0;

/**
 * Normalizes a storage folder name into a key segment Supabase Storage accepts.
 * ASCII slugs pass through unchanged; a fully non-ASCII slug collapses to `temp`,
 * which is where those uploads already landed before the slug reached the uploader.
 */
export function sanitizeStorageFolder(folder: string): string {
  const normalized = folder
    .replace(UNSAFE_CHARACTERS, '-')
    .replace(SEPARATOR_RUN, '-')
    .replace(EDGE_SEPARATORS, '')
    .toLowerCase()
    .slice(0, MAX_LENGTH)
    .replace(EDGE_SEPARATORS, '');

  return countAlphanumerics(normalized) >= MIN_ALPHANUMERICS ? normalized : FALLBACK_FOLDER;
}
