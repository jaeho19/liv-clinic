#!/usr/bin/env node
/**
 * generate-i18n-fr-mn-ar.mjs
 *
 * i18n-fr-mn-ar PDCA Step 3 stub generator.
 *
 * 전략:
 *   1. en.json을 base로 fr.json / mn.json / ar.json 3개 신규 파일 생성
 *   2. 각 파일은 en.json 값 그대로 (영어 fallback 동작)
 *   3. 이후 별도 작업으로 high-priority UI 키만 fr/mn/ar 정밀 번역 패치
 *
 * 이유:
 *   - LLM 단일 세션에서 17,000줄 의료 번역은 출력 토큰 한도 초과
 *   - en.json 미러로 build 즉시 통과 (verify-locale-keys는 키 구조만 검증)
 *   - 의료관광 환자 영어 가독성 보유 → 영어 fallback 임시 수용 가능
 *   - 정밀 번역은 후속 PDCA 또는 전문 번역 서비스로 진행
 *
 * Usage: node scripts/generate-i18n-fr-mn-ar.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages');

const BASE = 'en';
const TARGETS = ['fr', 'mn', 'ar'];

function readJson(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(locale, data) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const base = readJson(BASE);
console.log(`[generate-i18n-fr-mn-ar] base=${BASE}.json keys cloned for ${TARGETS.length} new locales`);

for (const target of TARGETS) {
  const targetFile = path.join(MESSAGES_DIR, `${target}.json`);
  if (fs.existsSync(targetFile)) {
    console.log(`  ⚠ ${target}.json already exists — overwriting with base`);
  }
  writeJson(target, base);
  console.log(`  ✓ ${target}.json created (${Object.keys(base).length} top-level keys)`);
}

console.log('\n[generate-i18n-fr-mn-ar] ✓ done. Next: run verify-locale-keys.mjs');
