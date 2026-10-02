// 열려 있는 손님 방의 이름을 새 규칙(날짜-이름)으로 바꾼다 — 배포 뒤 한 번 돌리는 운영 스크립트.
// 스펙: docs/superpowers/specs/2026-10-01-slack-room-look-design.md §3.7
//
// 실행 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs            ← 미리 보기. 아무것도 바꾸지 않는다
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/slack-rename-open-rooms.mjs --commit   ← 실제로 바꾼다 (원장님 승인 뒤에만)
//
// 대상   slack_mode='room' 이고 채널이 있고 status='open' 이고 완료(resolved_at)되지 않은 세션. 이미 새 꼴이면 건너뛴다.
// 새 이름 src/lib/chat/roomName.ts 의 roomNameCandidates — 운영 코드와 같은 규칙. 날짜는 세션을 만든 날(한국 시각).
// Slack  conversations.rename (우리 봇이 만든 방이라 가능, groups:write). name_taken 이면 다음 후보(-2, -3, -참조코드).
//        분당 20회 한도라 호출마다 3.3초 쉰다. 보관된 방은 is_archived 로 실패하므로 건너뛰고 적어 둔다.
// 토큰   .env.slack-trial.local 의 SLACK_BOT_TOKEN — 이 PC에서는 Netlify 값이 가려져 읽히지 않는다. 값은 화면에 찍지 않는다.
// 참고   Node 24는 .ts 를 바로 import 한다. 실행할 때 뜨는 MODULE_TYPELESS_PACKAGE_JSON 경고는 무시해도 된다.

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isDatedRoomName, roomNameCandidates } from '../src/lib/chat/roomName.ts';

const require = createRequire(new URL('../package.json', import.meta.url));
const { Client } = require('pg');

const COMMIT = process.argv.includes('--commit');
const RENAME_INTERVAL_MS = 3300;

/** KEY=값 한 줄만 읽는다 (.env.local 에는 여러 줄 값도 있다). */
function readEnv(file, key) {
  const url = new URL(`../${file}`, import.meta.url);
  if (!existsSync(url)) return '';
  for (const line of readFileSync(url, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
  }
  return '';
}

const DATABASE_URL = readEnv('.env.local', 'DATABASE_URL');
if (!DATABASE_URL) throw new Error('DATABASE_URL 없음 (liv-clinic/.env.local)');
const TOKEN = readEnv('.env.slack-trial.local', 'SLACK_BOT_TOKEN');
if (COMMIT && !TOKEN.startsWith('xoxb-')) {
  throw new Error('SLACK_BOT_TOKEN 없음 (liv-clinic/.env.slack-trial.local 에 xoxb- 로 시작하는 봇 토큰이 있어야 한다)');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function renameChannel(channel, name) {
  try {
    const res = await fetch('https://slack.com/api/conversations.rename', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel, name }),
    });
    const json = await res.json();
    return json.ok ? { ok: true, name: json.channel?.name ?? name } : { ok: false, error: json.error ?? 'invalid_response' };
  } catch (e) {
    return { ok: false, error: `fetch_failed: ${e?.message ?? e}` };
  }
}

const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
if (!COMMIT) await db.query('BEGIN READ ONLY');

const { rows } = await db.query(
  `SELECT id, visitor_name, visitor_locale, slack_channel_id, slack_room_name, created_at
     FROM chat_sessions
    WHERE slack_mode = 'room' AND slack_channel_id IS NOT NULL AND status = 'open' AND resolved_at IS NULL
    ORDER BY created_at ASC`
);

const targets = rows.filter((r) => !isDatedRoomName(r.slack_room_name));
console.log(`열려 있는 방 ${rows.length}개 · 이미 새 이름 ${rows.length - targets.length}개 · 바꿀 방 ${targets.length}개`);
console.log(COMMIT ? '실제로 바꿉니다 (--commit)\n' : '미리 보기입니다 — 아무것도 바꾸지 않습니다. 실제로 바꾸려면 --commit\n');

const planned = new Set(rows.map((r) => r.slack_room_name).filter(isDatedRoomName));
// 이미 새 이름인 방도 표에 보여 준다 — 배포 뒤 새로 생긴 방이 새 규칙으로 만들어졌는지 확인하는 데 쓴다.
const report = rows
  .filter((r) => isDatedRoomName(r.slack_room_name))
  .map((r) => ({ 지금: r.slack_room_name, 새이름: r.slack_room_name, 결과: '이미 새 이름' }));

for (const r of targets) {
  const candidates = roomNameCandidates({
    visitorName: r.visitor_name,
    visitorLocale: r.visitor_locale,
    sessionId: r.id,
    at: r.created_at,
  });

  if (!COMMIT) {
    // 같은 묶음 안에서 겹치는 이름만 미리 피한다. Slack 쪽(보관된 방 포함) 겹침은 --commit 때 name_taken 으로 드러난다.
    const name = candidates.find((n) => !planned.has(n)) ?? candidates[candidates.length - 1];
    planned.add(name);
    report.push({ 지금: r.slack_room_name, 새이름: name, 결과: '미리 보기' });
    continue;
  }

  let outcome = '실패: name_taken';
  for (const name of candidates) {
    const res = await renameChannel(r.slack_channel_id, name);
    await sleep(RENAME_INTERVAL_MS);
    if (res.ok) {
      await db.query('UPDATE chat_sessions SET slack_room_name = $1 WHERE id = $2', [res.name, r.id]);
      outcome = res.name;
      break;
    }
    if (res.error === 'name_taken') continue;
    outcome = res.error === 'is_archived' ? '건너뜀: 보관된 방' : `실패: ${res.error}`;
    break;
  }
  const done = !outcome.startsWith('실패') && !outcome.startsWith('건너뜀');
  report.push({ 지금: r.slack_room_name, 새이름: done ? outcome : candidates[0], 결과: done ? '바꿈' : outcome });
}

console.table(report);
if (COMMIT) {
  const changed = report.filter((x) => x.결과 === '바꿈').length;
  console.log(`바꾼 방 ${changed}개 / 대상 ${targets.length}개`);
}

if (!COMMIT) await db.query('ROLLBACK');
await db.end();
