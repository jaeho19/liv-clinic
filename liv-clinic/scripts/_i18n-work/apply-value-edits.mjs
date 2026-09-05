// 번역 JSON 값 치환기 — 바이트 보존.
// 사용: node scripts/_i18n-work/apply-value-edits.mjs <edits.json>
// edits.json: [{ "file": "ja.json", "find": "...", "replace": "...", "all"?: true, "expect"?: n }]
//   - find/replace는 파일 원문(JSON 인코딩된 텍스트) 안의 부분 문자열. 한 줄 안에서만 찾는다.
//   - 기본은 정확히 1회 일치해야 하고, all:true면 expect 회수만큼 전부 치환한다.
// 메시지 파일은 혼합 EOL(\r\r\n, \r\n, \n, 고립 \r)이라 절대 재직렬화하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const listPath = process.argv[2];
if (!listPath) throw new Error('usage: node apply-value-edits.mjs <edits.json>');
const edits = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'messages');

const byFile = new Map();
for (const e of edits) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

for (const [file, list] of byFile) {
  const abs = path.join(root, file);
  const original = fs.readFileSync(abs, 'utf8');
  let raw = original;
  for (const { find, replace, all, expect } of list) {
    if (find.includes('\n')) throw new Error(`${file}: find must stay within one line: ${find.slice(0, 60)}`);
    const count = raw.split(find).length - 1;
    if (all) {
      if (expect !== undefined && count !== expect) throw new Error(`${file}: expected ${expect} matches, got ${count} for ${find.slice(0, 60)}`);
      if (count === 0) throw new Error(`${file}: no match for ${find.slice(0, 60)}`);
      raw = raw.split(find).join(replace);
    } else {
      if (count !== 1) throw new Error(`${file}: expected 1 match, got ${count} for ${find.slice(0, 60)}`);
      raw = raw.replace(find, () => replace);
    }
  }
  JSON.parse(raw); // 무결성
  fs.writeFileSync(abs, raw, 'utf8');
  const a = original.split('\n');
  const b = raw.split('\n');
  let changed = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) changed++;
  console.log(`${file}: ${list.length} edits, ${changed} lines changed, ${a.length === b.length ? 'line count unchanged' : 'LINE COUNT CHANGED!'}`);
}
