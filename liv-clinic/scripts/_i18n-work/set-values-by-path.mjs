/**
 * 번역 JSON 의 값을 "경로"로 짚어 바꾼다 — 바이트 보존.
 *
 * apply-value-edits.mjs 는 글자를 찾아 바꾸므로, 같은 글자가 여러 곳에 있는 짧은 값("300 shots", "Domestic")에는
 * 쓰기 어렵다. 이 스크립트는 `pricing.labels.thermage.name` 같은 경로로 한 줄을 짚어 그 줄의 값만 바꾼다.
 *
 * 사용 (liv-clinic 폴더에서):
 *   node scripts/_i18n-work/set-values-by-path.mjs <edits.json>           # 미리보기 (파일을 바꾸지 않는다)
 *   node scripts/_i18n-work/set-values-by-path.mjs <edits.json> --write   # 기록
 * edits.json: { "<언어>": { "<점으로 이은 경로>": "<새 값>", … }, … }
 *
 * 메시지 파일은 줄바꿈이 섞여 있어(\r\r\n · \r\n · \n) 다시 직렬화하지 않는다. \n 만 경계로 줄을 나누고,
 * 들여쓰기(2칸 단위)로 경로를 따라가 그 줄의 값 부분만 새로 쓴다. 줄의 들여쓰기 · 쉼표 · 줄바꿈 바이트는 그대로 둔다.
 * 바꾼 뒤에는 JSON 으로 읽어 "짚은 경로만 바뀌었는가"를 확인하고, 하나라도 어긋나면 그 파일은 쓰지 않는다.
 * 이미 새 값인 경로는 건너뛴다(다시 돌려도 안전하다).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const listPath = process.argv[2];
if (!listPath) throw new Error('usage: node set-values-by-path.mjs <edits.json> [--write]');
const WRITE = process.argv.includes('--write');
const DIR = fileURLToPath(new URL('../../src/messages/', import.meta.url));
const edits = JSON.parse(readFileSync(listPath, 'utf8'));

/** \n 만 경계로 줄을 나눈다 — 각 조각은 자기 줄바꿈 바이트를 그대로 갖는다. */
function splitLines(raw) {
  const out = [];
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\n') {
      out.push(raw.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < raw.length) out.push(raw.slice(start));
  return out;
}

const KEY_LINE = /^( *)"((?:[^"\\]|\\.)*)":[ \t]*(.*?)(\r*\n?)$/;
const STRING_VALUE = /^"(?:[^"\\]|\\.)*"(,?)$/;

const getPath = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** 두 JSON 값에서 서로 다른 잎의 경로를 모은다. */
function diffPaths(a, b, prefix, out) {
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      diffPaths(a[key], b[key], prefix ? `${prefix}.${key}` : key, out);
    }
  } else if (a !== b) {
    out.push(prefix);
  }
  return out;
}

let failed = 0;
for (const [locale, table] of Object.entries(edits)) {
  const file = path.join(DIR, `${locale}.json`);
  const raw = readFileSync(file, 'utf8');
  const lines = splitLines(raw);
  if (lines.join('') !== raw) {
    console.log(`!! ${locale}: 라운드트립 실패 — 건드리지 않음`);
    failed++;
    continue;
  }
  const before = JSON.parse(raw);

  // 줄마다 경로를 붙인다 (들여쓰기 2칸 = 한 단계)
  const lineOf = new Map();
  const stack = [];
  lines.forEach((line, index) => {
    const m = KEY_LINE.exec(line);
    if (!m) return;
    const level = m[1].length / 2 - 1;
    if (!Number.isInteger(level) || level < 0) return;
    stack.length = level;
    stack[level] = JSON.parse(`"${m[2]}"`);
    const dotted = stack.join('.');
    lineOf.set(dotted, lineOf.has(dotted) ? -1 : index); // 같은 경로가 두 번 나오면 쓰지 않는다
  });

  const wanted = Object.entries(table);
  const problems = [];
  const changedPaths = [];
  let skipped = 0;
  for (const [dotted, value] of wanted) {
    const current = getPath(before, dotted);
    if (typeof value !== 'string' || value.trim() === '') {
      problems.push(`${dotted}: 새 값이 비어 있다`);
      continue;
    }
    if (typeof current !== 'string') {
      problems.push(`${dotted}: 글자 값이 아니거나 없는 경로다`);
      continue;
    }
    if (current === value) {
      skipped++;
      continue;
    }
    const index = lineOf.get(dotted);
    const m = index !== undefined && index >= 0 ? KEY_LINE.exec(lines[index]) : null;
    const tail = m ? STRING_VALUE.exec(m[3]) : null;
    if (!m || !tail) {
      problems.push(`${dotted}: 줄을 찾지 못했다`);
      continue;
    }
    lines[index] = `${m[1]}"${m[2]}": ${JSON.stringify(value)}${tail[1]}${m[4]}`;
    changedPaths.push(dotted);
  }

  const out = lines.join('');
  let after = null;
  try {
    after = JSON.parse(out);
  } catch (err) {
    problems.push(`JSON 깨짐: ${err.message}`);
  }
  if (after) {
    const diff = diffPaths(before, after, '', []).sort();
    const expected = [...changedPaths].sort();
    if (JSON.stringify(diff) !== JSON.stringify(expected)) problems.push(`짚은 경로와 실제로 바뀐 경로가 다르다 (${diff.length} / ${expected.length})`);
    for (const [dotted, value] of wanted) {
      if (typeof value === 'string' && getPath(after, dotted) !== value && !problems.some((p) => p.startsWith(dotted))) {
        problems.push(`${dotted}: 값이 들어가지 않았다`);
      }
    }
    if (splitLines(out).length !== splitLines(raw).length) problems.push('줄 수가 달라졌다');
  }
  if (problems.length > 0) {
    console.log(`!! ${locale}: ${problems.length}건\n   ${problems.join('\n   ')}`);
    failed++;
    continue;
  }
  console.log(`${WRITE ? '기록' : '미리보기'} ${locale}: ${changedPaths.length}줄 바꿈${skipped ? `, ${skipped}줄은 이미 같은 값` : ''}`);
  if (WRITE && changedPaths.length > 0) writeFileSync(file, out, 'utf8');
}
console.log(failed ? `실패 ${failed}건` : '전체 정상');
if (failed) process.exitCode = 1;
