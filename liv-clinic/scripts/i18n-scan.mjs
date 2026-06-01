// i18n consistency scanner. Design Ref: §6.1
// Usage: node scripts/i18n-scan.mjs
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOCALES, SOURCE, flatten, loadLocale, hasKorean, icuVars, isLeafEqual, WORK_DIR,
} from './i18n-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(__dirname, '../src');

mkdirSync(WORK_DIR, { recursive: true });

const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(loadLocale(l))]));
const koFlat = flat[SOURCE];
const koKeys = Object.keys(koFlat);
const koTop = new Set(Object.keys(loadLocale(SOURCE)));

const report = { source: SOURCE, totalKeys: koKeys.length, locales: {}, namespaces: {}, hardcoded: [] };

for (const l of LOCALES) {
  if (l === SOURCE) continue;
  const f = flat[l];
  const keys = Object.keys(f);
  const missing = koKeys.filter((k) => !(k in f));
  const extra = keys.filter((k) => !(k in koFlat));
  const empty = keys.filter((k) => f[k] === '');
  const koStale = koKeys.filter((k) => k in f && hasKorean(koFlat[k]) && isLeafEqual(f[k], koFlat[k]));
  const icuMismatch = koKeys.filter(
    (k) => k in f && icuVars(koFlat[k]).join('|') !== icuVars(f[k]).join('|'),
  );
  report.locales[l] = {
    missing: missing.length, extra: extra.length, empty: empty.length,
    koStale: koStale.length, icuMismatch: icuMismatch.length,
    missingKeys: missing, extraKeys: extra, koStaleKeys: koStale,
    icuMismatchKeys: icuMismatch.slice(0, 50),
  };
  for (const k of missing) {
    const ns = k.split('.')[0];
    report.namespaces[ns] = report.namespaces[ns] || {};
    report.namespaces[ns][l] = (report.namespaces[ns][l] || 0) + 1;
  }
}

// Static source scan: namespace existence + hardcoded Korean (non-comment).
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      if (['node_modules', '.next', 'messages'].includes(e.name)) continue;
      walk(p, acc);
    } else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const files = walk(SRC_DIR);
const nsRe = /(?:useTranslations|getTranslations)\(\s*[^)'"`]*["'`]([^"'`]+)["'`]/g;
const brokenNs = [];
const commentRe = /^\s*(\/\/|\*|\/\*)/;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  let m;
  const local = new RegExp(nsRe.source, 'g');
  while ((m = local.exec(text))) {
    const root = m[1].split('.')[0];
    if (root && !koTop.has(root)) brokenNs.push({ file: file.replace(SRC_DIR + '/', 'src/'), ns: m[1] });
  }
  if (file.includes('/messages/')) continue;
  let count = 0;
  for (const line of text.split(/\r?\n/)) {
    if (hasKorean(line) && !commentRe.test(line)) count += 1;
  }
  if (count > 0) report.hardcoded.push({ file: file.replace(SRC_DIR + '/', 'src/'), lines: count });
}
report.brokenNamespaces = brokenNs;
report.hardcoded.sort((a, b) => b.lines - a.lines);

writeFileSync(`${WORK_DIR}/_scan.json`, JSON.stringify(report, null, 2));

// Console summary
console.log(`\n=== i18n scan (source=${SOURCE}, ${koKeys.length} keys) ===`);
console.log('locale  | missing | extra | empty | koStale | icuMismatch');
for (const l of LOCALES) {
  if (l === SOURCE) continue;
  const r = report.locales[l];
  console.log(
    `${l.padEnd(7)} | ${String(r.missing).padStart(7)} | ${String(r.extra).padStart(5)} | ${String(r.empty).padStart(5)} | ${String(r.koStale).padStart(7)} | ${r.icuMismatch}`,
  );
}
console.log(`\nbrokenNamespaces: ${brokenNs.length}`, brokenNs.map((b) => `${b.ns}(${b.file})`).join(', ') || '(none)');
console.log(`hardcoded Korean files: ${report.hardcoded.length} (top: ${report.hardcoded.slice(0, 5).map((h) => `${h.file}:${h.lines}`).join(', ')})`);
console.log(`\nFull report → scripts/_i18n-work/_scan.json`);
