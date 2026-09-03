#!/usr/bin/env node
/**
 * data/*.csv 3종을 검증하고 src/lib/data/concernRules.generated.ts 로 굽는다.
 *
 * prebuild 에서 verify:i18n 앞에 실행된다. 검증 실패는 빌드 실패다 —
 * 검수 안 된 문구와 답이 없는 질문이 배포되지 않게 하는 장치다.
 *
 * 생성물은 커밋한다. 빌드가 깨져도 이전 값으로 돌아갈 수 있고,
 * 규칙표 변경이 diff에 드러난다.
 *
 * ⚠️ 이 스크립트는 반드시 `tsx` 로 실행한다 (`package.json` 의 prebuild).
 *    `node` 로 바꾸지 말 것 — main() 이 `src/lib/constants.ts` 를 동적 import 하는데,
 *    Netlify 는 `netlify.toml` 에서 NODE_VERSION=20 을 고정하고 있고 Node 20 에는
 *    타입 스트리핑이 없어 `Unknown file extension ".ts"` 로 빌드가 죽는다.
 *    로컬 Node 24 는 타입을 기본으로 벗겨내서 이 실패가 보이지 않는다 (2026-09-03 실제 발생).
 *    로컬에서 Netlify 환경을 흉내내려면:
 *      node --no-experimental-strip-types ./node_modules/tsx/dist/cli.mjs scripts/compile-concern-rules.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'src', 'lib', 'data', 'concernRules.generated.ts');

const LANGS = ['ko', 'en', 'ja', 'zh'];
const ALLOWED_ANSWER_SOURCES = new Set([
  'duration', 'anesthesia', 'recovery', 'results', 'cautions',
  'benefits', 'process', 'targetAreas', 'idealFor',
]);
const ALLOWED_REVIEWERS = new Set(['원장', '실장', '원장,실장']);
const CONSULT_ONLY = 'consultOnly';

/** 검증만 한다. 파일 시스템을 모른다 (테스트를 위해 export). */
export function validateRows({ rules, terms, questions }, treatmentIds) {
  const errors = [];

  rules.forEach((r, i) => {
    const at = `concern-rules.csv:${i + 2}`;
    if (!r.concern_id) errors.push(`${at} concern_id 가 비었습니다`);
    if (!r.treatment_id) errors.push(`${at} treatment_id 가 비었습니다`);
    else if (r.treatment_id !== CONSULT_ONLY && !treatmentIds.has(r.treatment_id))
      errors.push(`${at} treatment_id '${r.treatment_id}' 가 TREATMENTS 에 없습니다`);
    if (!/^\d+$/.test(String(r.display_order ?? '')))
      errors.push(`${at} display_order 는 숫자여야 합니다`);
    if (!r.reason_ko) errors.push(`${at} reason_ko 가 비었습니다`);
    if (!r.reviewed_by) errors.push(`${at} reviewed_by 가 비었습니다 — 검수 전에는 배포할 수 없습니다`);
    else if (!ALLOWED_REVIEWERS.has(r.reviewed_by))
      errors.push(`${at} reviewed_by 는 '원장' · '실장' · '원장,실장' 만 허용됩니다 (받은 값: ${r.reviewed_by})`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.reviewed_at ?? '')))
      errors.push(`${at} reviewed_at 은 YYYY-MM-DD 형식이어야 합니다`);
  });

  terms.forEach((t, i) => {
    const at = `concern-terms.csv:${i + 2}`;
    if (!t.term_id) errors.push(`${at} term_id 가 비었습니다`);
    if (!t.concern_id) errors.push(`${at} concern_id 가 비었습니다`);
    if (!t.label_ko) errors.push(`${at} label_ko 가 비었습니다`);
  });

  questions.forEach((q, i) => {
    const at = `prep-questions.csv:${i + 2}`;
    if (!q.question_id) errors.push(`${at} question_id 가 비었습니다`);
    if (!q.text_ko) errors.push(`${at} text_ko 가 비었습니다`);
    if (!ALLOWED_ANSWER_SOURCES.has(q.answer_source))
      errors.push(`${at} answer_source '${q.answer_source}' 는 TREATMENTS 필드가 아닙니다 — 답이 없는 질문은 만들 수 없습니다`);
  });

  return errors;
}

function readCsv(name) {
  const text = fs.readFileSync(path.join(DATA, name), 'utf8');
  const { data, errors } = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  if (errors.length) throw new Error(`${name} 파싱 실패: ${errors[0].message}`);
  return data;
}

function langMap(row, prefix) {
  return Object.fromEntries(LANGS.map((l) => [l, row[`${prefix}_${l}`] || '']));
}

function warnMissingTranslations(rules) {
  for (const r of rules) {
    const missing = LANGS.filter((l) => l !== 'ko' && !r[`reason_${l}`]);
    if (missing.length) {
      console.warn(
        `[concern-rules] ${r.concern_id}/${r.treatment_id}: reason_${missing.join(', reason_')} 비어 있음 — 해당 언어에서는 시술명만 표시됩니다`
      );
    }
  }
}

async function main() {
  const { TREATMENTS } = await import('../src/lib/constants.ts');
  const treatmentIds = new Set(Object.values(TREATMENTS).flatMap((g) => Object.keys(g)));

  const rules = readCsv('concern-rules.csv');
  const terms = readCsv('concern-terms.csv');
  const questions = readCsv('prep-questions.csv');

  const errors = validateRows({ rules, terms, questions }, treatmentIds);
  if (errors.length) {
    console.error('[concern-rules] 검증 실패:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  warnMissingTranslations(rules);

  const body = `// 이 파일은 scripts/compile-concern-rules.mjs 가 생성합니다. 직접 수정하지 마세요.
// 원본: data/concern-rules.csv · data/concern-terms.csv · data/prep-questions.csv
import type { ConcernRule, ConcernTerm, PrepQuestion } from '@/lib/consultPrep/types';

export const CONCERN_RULES: ConcernRule[] = ${JSON.stringify(
    rules.map((r) => ({
      concernId: r.concern_id,
      treatmentId: r.treatment_id,
      displayOrder: Number(r.display_order),
      reason: langMap(r, 'reason'),
      caution: langMap(r, 'caution'),
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
    })),
    null,
    2
  )};

export const CONCERN_TERMS: ConcernTerm[] = ${JSON.stringify(
    terms.map((t) => ({
      termId: t.term_id,
      concernId: t.concern_id,
      label: langMap(t, 'label'),
      bodyArea: t.body_area,
    })),
    null,
    2
  )};

export const PREP_QUESTIONS: PrepQuestion[] = ${JSON.stringify(
    questions.map((q) => ({
      questionId: q.question_id,
      appliesTo: q.applies_to,
      text: langMap(q, 'text'),
      answerSource: q.answer_source,
    })),
    null,
    2
  )};
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body, 'utf8');
  console.log(
    `[concern-rules] ok: 규칙 ${rules.length} · 용어 ${terms.length} · 질문 ${questions.length} → ${path.relative(ROOT, OUT)}`
  );
}

if (process.argv[1] && process.argv[1].endsWith('compile-concern-rules.mjs')) {
  main().catch((e) => {
    console.error('[concern-rules] ' + e.message);
    process.exit(1);
  });
}
