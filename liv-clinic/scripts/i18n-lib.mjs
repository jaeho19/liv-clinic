// Shared helpers for i18n tooling (scan / extract / merge).
// Design Ref: §3 Data Model, §6 Implementation Details
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const MSG_DIR = resolve(__dirname, '../src/messages');
export const WORK_DIR = resolve(__dirname, '_i18n-work');

export const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
export const SOURCE = 'ko';
// en/ja/zh are already fully translated → reference set for translation.
export const REFERENCE_LOCALES = ['en', 'ja', 'zh'];
export const TARGET_LOCALES = ['zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

const KO_RE = /[가-힣]/;
const ICU_RE = /\{[^}]+\}/g;

export function loadLocale(locale) {
  return JSON.parse(readFileSync(`${MSG_DIR}/${locale}.json`, 'utf8'));
}

// Flatten nested object to dot-path → value (arrays serialized as JSON string, tagged).
export function flatten(obj, prefix = '', acc = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const np = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, np, acc);
    } else {
      acc[np] = v;
    }
  }
  return acc;
}

export function hasKorean(s) {
  return typeof s === 'string' && KO_RE.test(s);
}

// Extract the set of ICU placeholder tokens (e.g. {name}, {count, plural, ...}) varnames.
export function icuVars(value) {
  const s = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  const found = s.match(ICU_RE) || [];
  // Normalize: take the leading identifier inside the braces.
  return [...new Set(found.map((t) => t.slice(1, -1).split(/[,\s}]/)[0].trim()).filter(Boolean))].sort();
}

export function isLeafEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
