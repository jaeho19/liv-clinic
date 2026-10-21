// AI 응대 점검용 내보내기 (읽기 전용) — AI를 켠 뒤 매주, AI가 답한 대화를 처음부터 끝까지 읽기 위한 파일을 만든다
// (설계서 docs/superpowers/specs/2026-10-02-chat-ai-first-response-design.md §4.14).
// 틀린 사실 · 어색한 말 · 직원에게 넘겼어야 할 질문 · 답이 나가지 못한 차례(이유 포함)를 찾는 데 쓴다.
// 아무것도 변경하지 않는다(READ ONLY 트랜잭션). 이메일 · 전화번호는 가려서 쓴다.
// 결과 폴더(output/ai-first-response/review)는 git 이 추적하지 않는다 — 손님 글이 들어 있으니 커밋하지 않는다.
//
// 실행 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/chat-ai-review-export.mjs [--since 2026-10-05] [--include-test] [--out <폴더>]
//   --since         이 날(한국 날짜)부터 AI가 불린 대화. 기본은 7일 전
//   --include-test  시험 문의(이름에 test · 테스트 · smoke)도 넣는다 — 켜기 전 시험(CHAT_AI=test)을 읽을 때
//   --out           결과 폴더. 기본 ../output/ai-first-response/review

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { AI_TABLES_SQL, aiReviewMessagesSql, aiReviewMissesSql, renderAiReview } from './_db/chat-ai-metrics.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const { Client } = require('pg');

// .env.local — 여러 줄 값(GOOGLE_PRIVATE_KEY 등)이 있으므로 한 줄 값만 취한다.
const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of raw.split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 없음 (liv-clinic/.env.local)');

const KST_MS = 9 * 60 * 60 * 1000;
const kstDate = (ms) => new Date(ms + KST_MS).toISOString().slice(0, 10);
const valueOf = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const SINCE = valueOf('--since') ?? kstDate(Date.now() - 7 * 24 * 60 * 60 * 1000);
if (!/^\d{4}-\d{2}-\d{2}$/.test(SINCE)) throw new Error('--since 는 YYYY-MM-DD 형식이어야 합니다');
const INCLUDE_TEST = process.argv.includes('--include-test');
const OUT_DIR = valueOf('--out') ?? path.join(process.cwd(), '..', 'output', 'ai-first-response', 'review');

const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query('BEGIN READ ONLY');
  const { rows: tables } = await db.query(AI_TABLES_SQL);
  if (!tables[0]?.turns) {
    console.log('chat_ai_turns 테이블이 없습니다 — 043 을 적용하기 전입니다.');
  } else {
    const { rows: messages } = await db.query(aiReviewMessagesSql(SINCE));
    const { rows: misses } = await db.query(aiReviewMissesSql(SINCE));
    const text = renderAiReview(messages, misses, { since: SINCE, includeTest: INCLUDE_TEST });
    mkdirSync(OUT_DIR, { recursive: true });
    const file = path.join(OUT_DIR, `review-${SINCE}-to-${kstDate(Date.now())}${INCLUDE_TEST ? '-with-test' : ''}.md`);
    writeFileSync(file, text, 'utf8');
    console.log(text.split('\n')[2]);
    console.log(`답이 나가지 못한 차례 ${misses.length}건 (시험 세션 포함)`);
    console.log('결과', file);
  }
  await db.query('ROLLBACK');
} finally {
  await db.end();
}
