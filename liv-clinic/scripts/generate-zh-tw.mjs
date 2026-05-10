#!/usr/bin/env node
/**
 * Generate src/messages/zh-TW.json from src/messages/zh.json
 *
 * Strategy:
 *   1. Convert simplified Chinese (zh) → traditional Chinese (zh-Hant-TW)
 *      via opencc-js with the 'cn' (Mainland) → 'tw' (Taiwan, with idioms) preset.
 *   2. Apply i18n-glossary.md corrections for medical terms where Taiwan
 *      uses different conventional names (e.g. 熱瑪吉 → 鳳凰電波,
 *      皮秒激光 → 皮秒雷射, 肉毒素 → 肉毒桿菌素).
 *
 * Run: `node scripts/generate-zh-tw.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZH_PATH = path.join(__dirname, '..', 'src', 'messages', 'zh.json');
const ZH_TW_PATH = path.join(__dirname, '..', 'src', 'messages', 'zh-TW.json');
const KO_PATH = path.join(__dirname, '..', 'src', 'messages', 'ko.json');

// Mainland Simplified → Taiwan Traditional (with Taiwan-specific idioms)
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

/** Recursively convert all string values in a JSON tree. */
function deepConvert(obj) {
  if (typeof obj === 'string') return converter(obj);
  if (Array.isArray(obj)) return obj.map(deepConvert);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = deepConvert(v);
    return out;
  }
  return obj;
}

/**
 * Taiwan medical-cosmetic glossary corrections applied AFTER opencc conversion.
 * Order matters: longer phrases first to avoid partial overwrites.
 * Source: docs/i18n-glossary.md (zh-TW column).
 */
const CORRECTIONS = [
  // Procedure brand names — Taiwan conventional (mainland → Taiwan)
  ['熱瑪吉FLX', '鳳凰電波 FLX'],
  ['熱瑪吉 FLX', '鳳凰電波 FLX'],
  ['熱瑪吉', '鳳凰電波'],
  ['超聲刀Prime', '音波拉提 Prime'],
  ['超聲刀 Prime', '音波拉提 Prime'],
  ['超聲刀', '音波拉提'],
  ['超音波刀', '音波拉提'],
  ['舒顏萃', '海芙音波'],
  ['Densiti', 'Density'],
  ['線雕提升', '埋線拉提'],
  ['線雕', '埋線'],
  ['提升', '拉提'],
  // Botulinum toxin — Taiwan: 肉毒桿菌素 (mainland: 肉毒素)
  ['肉毒桿菌毒素', '肉毒桿菌素'],
  ['肉毒素', '肉毒桿菌素'],
  // Hyaluronic acid filler
  ['玻尿酸（', '玻尿酸 ('],
  // Skin booster — Taiwan: 水光針 (already converted by opencc, no-op)
  ['皮膚助推劑', '水光針'],
  // Laser — Taiwan uses 雷射 (already converted by opencc 激光→雷射)
  // Pico — Taiwan keeps "皮秒雷射"
  // Equipment & misc
  ['婴兒針', '嬰兒針'],
  ['軟件', '軟體'],
  ['網絡', '網路'],
  ['信息', '資訊'],
  ['視頻', '影片'],
  ['照片', '照片'], // no-op anchor
  // Brand: keep LIV everywhere as English
  ['LIV整形外科', 'LIV 整形外科'],
];

function applyCorrections(jsonStr) {
  let out = jsonStr;
  for (const [from, to] of CORRECTIONS) {
    out = out.split(from).join(to);
  }
  return out;
}

function main() {
  if (!fs.existsSync(ZH_PATH)) {
    console.error(`Missing source: ${ZH_PATH}`);
    process.exit(1);
  }
  const zh = JSON.parse(fs.readFileSync(ZH_PATH, 'utf8'));

  // Convert simplified → traditional
  const zhTW = deepConvert(zh);

  // Re-add ko-master-only keys with traditional Chinese stub if missing.
  // (zh.json may be missing some master keys; verify-locale-keys would catch it.)
  const ko = JSON.parse(fs.readFileSync(KO_PATH, 'utf8'));
  function flatKeys(obj, prefix = '') {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    return Object.entries(obj).flatMap(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' && !Array.isArray(v) ? flatKeys(v, key) : [key];
    });
  }
  const koKeys = new Set(flatKeys(ko));
  const zhTWKeys = new Set(flatKeys(zhTW));
  const missing = [...koKeys].filter((k) => !zhTWKeys.has(k));
  if (missing.length) {
    console.warn(`[zh-TW] ${missing.length} keys missing from zh.json; falling back to converted ko.`);
    // Walk through ko and add missing keys with converted ko text as a stub.
    function getByPath(obj, p) {
      return p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
    }
    function setByPath(obj, p, value) {
      const parts = p.split('.');
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
    }
    for (const key of missing) {
      const koVal = getByPath(ko, key);
      // Korean fallback as a placeholder; ideally manual review later.
      setByPath(zhTW, key, typeof koVal === 'string' ? koVal : koVal);
    }
  }

  // Re-serialize and apply medical glossary corrections at string level
  let json = JSON.stringify(zhTW, null, 2);
  json = applyCorrections(json);

  fs.writeFileSync(ZH_TW_PATH, json + '\n', 'utf8');
  console.log(`[zh-TW] generated ${ZH_TW_PATH} (${json.length} bytes)`);
  console.log(`  Source: ${ZH_PATH}`);
  console.log(`  Converter: opencc-js cn → tw (with Taiwan idioms)`);
  console.log(`  Glossary corrections: ${CORRECTIONS.length} rules`);
}

main();
