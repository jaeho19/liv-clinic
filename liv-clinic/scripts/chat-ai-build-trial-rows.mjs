// AI 응대의 첫방문 체험가 줄을 만든다 (제안형 응대 — 스펙 2026-10-12 chat-ai-guided-offers §0.2).
// 홈페이지 첫방문 체험가(src/lib/firstVisitTrial.ts)의 금액과 그 이름(src/messages/*.json 의 firstVisit)을 한 파일로 모은다.
// 읽기만 하고, 생성 파일 하나만 쓴다.
// 실행 (liv-clinic 폴더에서): node scripts/chat-ai-build-trial-rows.mjs
// firstVisitTrial.ts 나 firstVisit 번역을 고치면 다시 실행한다 — 안 하면 offers.test.ts 가 실패해 알려 준다.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const OUT = 'src/lib/chat/ai/knowledge/priceRows.trial.ts';
const LOCALES = ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];

const { FIRST_VISIT_TRIALS } = await import(pathToFileURL(path.join(root, 'src/lib/firstVisitTrial.ts')).href);

/** messages/<언어>.json 에서 firstVisit 묶음(trialOnceNote 가 있는 객체)을 찾는다 */
function firstVisitOf(locale) {
  const stack = [JSON.parse(readFileSync(path.join(root, `src/messages/${locale}.json`), 'utf8'))];
  while (stack.length > 0) {
    const o = stack.pop();
    if (o && typeof o === 'object') {
      if ('trialOnceNote' in o) return o;
      stack.push(...Object.values(o));
    }
  }
  throw new Error(`firstVisit not found: ${locale}`);
}
const KO = firstVisitOf('ko');
const BY_LOCALE = Object.fromEntries(LOCALES.map((l) => [l, firstVisitOf(l)]));

/** 이름이 없으면 멈춘다 — 빈 이름이 손님에게 나가면 안 된다 */
const nameOf = (fv, id, where) => {
  const name = fv.items?.[id]?.name;
  if (typeof name !== 'string' || !name.trim()) throw new Error(`name missing: ${where} firstVisit.items.${id}.name`);
  return name.trim();
};

const q = (s) => JSON.stringify(s);
const lines = [
  '// 자동 생성 — 직접 고치지 않는다. 만드는 법: node scripts/chat-ai-build-trial-rows.mjs',
  '// 출처: src/lib/firstVisitTrial.ts 의 체험가 + src/messages/*.json 의 firstVisit(제목 · 품목 이름). 처음 방문하는 손님만, 1회.',
  '// 대표원장님 회신(2026-10-20, 제안 엑셀 시트 3의 6번): 가격 부담을 말하는 손님에게 저부담 대안으로 말해도 된다.',
  '// 체험가 시술은 채팅 예약 혜택(피부관리 · 수액 1회)에서 제외된다 — offers.ts.',
  "import type { PriceRowSource } from './types';",
  '',
  'export const TRIAL_PRICE_ROWS: PriceRowSource[] = [',
];
for (const item of FIRST_VISIT_TRIALS) {
  if (!Number.isInteger(item.trialPrice) || item.trialPrice <= 0) throw new Error(`bad trial price: ${item.id}`);
  lines.push('  {');
  lines.push(`    key: ${q(`trial.${item.id}`)},`);
  lines.push("    group: 'trial',");
  lines.push(`    labelKo: ${q(`첫방문 체험가 · ${nameOf(KO, item.id, 'ko')}`)},`);
  lines.push(`    amount: ${item.trialPrice},`);
  lines.push("    unit: 'fixed',");
  lines.push('    labels: {');
  for (const l of LOCALES) {
    const fv = BY_LOCALE[l];
    lines.push(`      ${/^[a-z]+$/.test(l) ? l : q(l)}: ${q(`${fv.title} · ${nameOf(fv, item.id, l)}`)},`);
  }
  lines.push('    },');
  lines.push('  },');
}
lines.push('];', '');
writeFileSync(path.join(root, OUT), lines.join('\n'), 'utf8');
console.log(`wrote ${OUT}: ${FIRST_VISIT_TRIALS.length} rows`);
