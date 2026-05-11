#!/usr/bin/env node
/**
 * verify-locale-keys.mjs
 *
 * Build-time guard that ensures every locale message file has the same
 * key structure as the master (ko.json). Prevents partial-translation
 * drift from reaching production.
 *
 * Run: `node scripts/verify-locale-keys.mjs`
 * Wired via `prebuild` in package.json so `npm run build` enforces it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages');
const MASTER = 'ko';
const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

function flatKeys(obj, prefix = '') {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) ? flatKeys(v, key) : [key];
  });
}

function readJson(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing message file: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const masterKeys = new Set(flatKeys(readJson(MASTER)));
console.log(`[verify-locale-keys] master (${MASTER}.json) has ${masterKeys.size} keys`);

// Policy:
//   - missing keys (in master but not in locale) → FAIL (untranslated content)
//   - extra keys (in locale but not in master)   → WARN only
//     (some keys are intentionally locale-specific, e.g. wechatPage.* on zh,
//      chat.* on en/ja/zh because ChatWidget is hidden on ko)
let failed = false;
let warnings = 0;
for (const loc of LOCALES) {
  if (loc === MASTER) continue;
  const keys = new Set(flatKeys(readJson(loc)));
  const missing = [...masterKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !masterKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✓ ${loc}: in sync`);
    continue;
  }

  if (missing.length > 0) {
    failed = true;
    console.error(`  ✗ ${loc}: missing ${missing.length} key(s) from master`);
    console.error(`    missing (first 10):`, missing.slice(0, 10));
  } else {
    console.log(`  ✓ ${loc}: in sync (with master keys)`);
  }
  if (extra.length > 0) {
    warnings += extra.length;
    console.warn(`  ⚠ ${loc}: ${extra.length} locale-only key(s) (informational)`);
    if (process.env.VERIFY_I18N_VERBOSE) {
      console.warn(`    extra:`, extra.slice(0, 10));
    }
  }
}

if (failed) {
  console.error('\n[verify-locale-keys] FAILED — locale files missing master keys.');
  process.exit(1);
}
if (warnings > 0) {
  console.log(`\n[verify-locale-keys] ✓ all master keys present (${warnings} locale-only keys, informational)`);
} else {
  console.log('\n[verify-locale-keys] ✓ all locale files in sync');
}
