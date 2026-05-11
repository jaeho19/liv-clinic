#!/usr/bin/env node
/**
 * Apply translations from _translated.{locale}.json back into the locale's
 * messages JSON, preserving nested structure and pre-existing translations.
 *
 * Input: liv-clinic/scripts/_translated.{locale}.json (flat key.path -> translated value)
 * Effect: updates liv-clinic/src/messages/{locale}.json in place.
 *
 * Usage: node scripts/i18n-apply-translations.mjs [fr|mn|ar]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages');

function setByPath(obj, dottedKey, value) {
  const parts = dottedKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || cur[p] === null || typeof cur[p] !== 'object') {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

const targetLocales = process.argv[2] ? [process.argv[2]] : ['fr', 'mn', 'ar'];

for (const locale of targetLocales) {
  const messagesFile = path.join(MESSAGES_DIR, `${locale}.json`);
  const translationsFile = path.join(__dirname, `_translated.${locale}.json`);
  if (!fs.existsSync(translationsFile)) {
    console.log(`[${locale}] no _translated.${locale}.json found, skipping`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
  const translations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));
  let applied = 0;
  for (const [k, v] of Object.entries(translations)) {
    setByPath(data, k, v);
    applied++;
  }
  fs.writeFileSync(messagesFile, JSON.stringify(data, null, 2) + '\n');
  console.log(`[${locale}] applied ${applied} translations → ${path.relative(process.cwd(), messagesFile)}`);
}
