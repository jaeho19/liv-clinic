// AI 응대의 기본 가격 줄을 만든다 — 홈페이지 시술 페이지 가격표(src/lib/pricing.ts)의 금액과
// 그 번역(src/messages/*.json 의 pricing.labels)을 한 파일로 모은다. 읽기만 하고, 생성 파일 하나만 쓴다.
// 실행 (liv-clinic 폴더에서): node scripts/chat-ai-build-price-rows.mjs
// pricing.ts 나 pricing.labels 를 고치면 다시 실행한다 — 안 하면 knowledge.test.ts 가 실패해 알려 준다.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const OUT = 'src/lib/chat/ai/knowledge/priceRows.base.generated.ts';
const LOCALES = ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

const { PRICING } = await import(pathToFileURL(path.join(root, 'src/lib/pricing.ts')).href);
const labelsOf = (locale) =>
  JSON.parse(readFileSync(path.join(root, `src/messages/${locale}.json`), 'utf8')).pricing.labels;
const KO = labelsOf('ko');
const BY_LOCALE = Object.fromEntries(LOCALES.map((l) => [l, labelsOf(l)]));

/** 이름 = "묶음 이름 (부위) · 옵션". 번역이 없으면 멈춘다 — 빈 이름이 손님에게 나가면 안 된다. */
function labelOf(table, id, group, row, where) {
  const L = table[id];
  const pick = (key) => {
    const value = L?.[key];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`label missing: ${where} pricing.labels.${id}.${key}`);
    return value.trim();
  };
  const head = group.subKey ? `${pick(group.groupKey)} (${pick(group.subKey)})` : pick(group.groupKey);
  return `${head} · ${pick(row.rowKey)}`;
}

const rows = [];
for (const [id, treatment] of Object.entries(PRICING)) {
  for (const group of treatment.groups) {
    for (const row of group.rows) {
      if (row.price === null) continue; // '상담 후 결정' 줄은 금액이 없다
      if (row.suffix !== 'starting') throw new Error(`unsupported suffix ${row.suffix} at ${id}.${group.groupKey}.${row.rowKey}`);
      const amount = Number(row.price.replace(/,/g, ''));
      if (!Number.isInteger(amount) || amount <= 0) throw new Error(`bad price at ${id}.${group.groupKey}.${row.rowKey}`);
      rows.push({
        key: `${id}.${group.groupKey}.${row.rowKey}`,
        labelKo: labelOf(KO, id, group, row, 'ko'),
        amount,
        labels: Object.fromEntries(LOCALES.map((l) => [l, labelOf(BY_LOCALE[l], id, group, row, l)])),
      });
    }
  }
}

const q = (s) => JSON.stringify(s);
const lines = [
  '// 자동 생성 — 직접 고치지 않는다. 만드는 법: node scripts/chat-ai-build-price-rows.mjs',
  '// 출처: src/lib/pricing.ts 의 금액 + src/messages/*.json 의 pricing.labels (홈페이지 시술 페이지 가격표와 같은 값).',
  "import type { PriceRowSource } from './types';",
  '',
  'export const BASE_PRICE_ROWS: PriceRowSource[] = [',
];
for (const r of rows) {
  lines.push('  {');
  lines.push(`    key: ${q(r.key)},`);
  lines.push("    group: 'base',");
  lines.push(`    labelKo: ${q(r.labelKo)},`);
  lines.push(`    amount: ${r.amount},`);
  lines.push("    unit: 'starting',");
  lines.push('    labels: {');
  for (const l of LOCALES) lines.push(`      ${/^[a-z]+$/.test(l) ? l : q(l)}: ${q(r.labels[l])},`);
  lines.push('    },');
  lines.push('  },');
}
lines.push('];', '');
writeFileSync(path.join(root, OUT), lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}: ${rows.length} rows`);
