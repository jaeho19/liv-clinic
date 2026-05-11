#!/usr/bin/env node
/**
 * Extract untranslated keys per locale by diffing against en.json.
 * A key is "untranslated" if its value === en.json's value (en mirror).
 *
 * Output: liv-clinic/scripts/_untranslated.{locale}.json
 *   shape: { "key.path": "english source text", ... }
 *
 * Usage: node scripts/i18n-extract-untranslated.mjs [fr|mn|ar]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages');
const OUT_DIR = __dirname;

function flatten(obj, prefix = '', out = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else if (Array.isArray(v)) {
      // Skip arrays — they're structured data (FAQ lists, doctor activities)
      // and cannot be diffed/translated as simple strings.
      continue;
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf8'));
const enFlat = flatten(en);

const targetLocales = process.argv[2] ? [process.argv[2]] : ['fr', 'mn', 'ar'];

for (const locale of targetLocales) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const flat = flatten(data);
  const untranslated = {};
  for (const k of Object.keys(enFlat)) {
    if (flat[k] === enFlat[k]) untranslated[k] = enFlat[k];
  }
  const outFile = path.join(OUT_DIR, `_untranslated.${locale}.json`);
  fs.writeFileSync(outFile, JSON.stringify(untranslated, null, 2) + '\n');
  console.log(`[${locale}] ${Object.keys(untranslated).length} untranslated keys → ${path.relative(process.cwd(), outFile)}`);
}
