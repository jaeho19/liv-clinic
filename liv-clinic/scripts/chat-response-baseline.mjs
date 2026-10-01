// 채팅 응답 실측 (읽기 전용) — "연락처 먼저" 설계(docs/superpowers/specs/2026-10-01-chat-contact-first-design.md)의
// 목표 G-1~G-6을 같은 정의로 다시 재기 위한 스크립트. 아무것도 변경하지 않는다(READ ONLY 트랜잭션).
//
// 실행 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/chat-response-baseline.mjs [--since 2026-05-08] [--card-since 2026-08-09]
//
// 정의
//   - 시험 세션 제외: 이름에 test/테스트/smoke 가 있거나, 첫 손님 글이 3자 이하이거나 한글이 섞임.
//   - 직원 답변: sender='operator' AND source <> 'auto' (자동 안내 제외).
//   - 영업중: 평일 10:00–19:00, 토 10:00–16:00 (KST, 코드 기본값). 휴진일(CHAT_CLOSED_DATES)은 반영하지 않는다.
//   - 다시 닿을 길 없음: 이메일·메신저 연락처가 없고, 직원 답변이 없거나 답변 뒤 손님이 다시 말하지 않음.
//   - 이름·연락처 값은 읽지 않고 유무만 센다.
//   - 이벤트 안내(항목 9): 자동 안내(source='auto') 가운데 본문이 이벤트 페이지 주소(…/events 또는 …/events/…)로 끝나는 글.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { Client } = require('pg');

// .env.local — 여러 줄 값(GOOGLE_PRIVATE_KEY 등)이 있으므로 한 줄 값만 취한다.
const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of raw.split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 없음 (liv-clinic/.env.local)');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`${name} 은 YYYY-MM-DD 형식이어야 합니다`);
  return v ?? fallback;
};
const SINCE = arg('--since', '2026-05-08');
const CARD_SINCE = arg('--card-since', '2026-08-09');

const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query('BEGIN READ ONLY');

const q = async (label, sql) => {
  const { rows } = await db.query(sql);
  console.log(`\n── ${label} ──`);
  if (!rows.length) console.log('  (없음)');
  else console.table(rows);
  return rows;
};

// 042 적용 전에도 돌 수 있게 새 컬럼 유무를 먼저 본다.
const { rows: colRows } = await db.query(
  `SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='visitor_messenger_clicked'`
);
const CLICKED = colRows.length > 0 ? 'cs.visitor_messenger_clicked' : 'NULL::text';
const { rows: hintColRows } = await db.query(
  `SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='event_hint_at'`
);
const HAS_EVENT_HINT = hintColRows.length > 0;

const base = (since) => `
WITH s AS (
  SELECT cs.id, cs.visitor_locale, cs.visitor_email, cs.visitor_messenger_channel, cs.visitor_messenger_handle,
         ${CLICKED} AS clicked,
         (SELECT min(m.created_at) FROM public.chat_messages m WHERE m.session_id = cs.id AND m.sender = 'visitor') AS first_visitor_at,
         (SELECT max(m.created_at) FROM public.chat_messages m WHERE m.session_id = cs.id AND m.sender = 'visitor') AS last_visitor_at,
         (SELECT m.original_text FROM public.chat_messages m WHERE m.session_id = cs.id AND m.sender = 'visitor' ORDER BY m.created_at LIMIT 1) AS first_text,
         (SELECT min(m.created_at) FROM public.chat_messages m WHERE m.session_id = cs.id AND m.sender = 'operator' AND m.source <> 'auto') AS first_human_at
    FROM public.chat_sessions cs
   WHERE cs.created_at >= timestamptz '${since} 00:00+09'
     AND coalesce(cs.visitor_name, '') !~* '(test|테스트|smoke)'
), b AS (
  SELECT s.*, (first_visitor_at AT TIME ZONE 'Asia/Seoul') AS fv_kst,
         EXTRACT(EPOCH FROM (first_human_at - first_visitor_at)) / 60.0 AS wait_min,
         (char_length(btrim(first_text)) <= 3 OR first_text ~ '[가-힣ㄱ-ㅎㅏ-ㅣ]') AS looks_test
    FROM s WHERE first_visitor_at IS NOT NULL
), c AS (
  SELECT b.*,
         CASE
           WHEN EXTRACT(ISODOW FROM fv_kst) BETWEEN 1 AND 5 AND fv_kst::time >= '10:00' AND fv_kst::time < '19:00' THEN '영업중'
           WHEN EXTRACT(ISODOW FROM fv_kst) = 6 AND fv_kst::time >= '10:00' AND fv_kst::time < '16:00' THEN '영업중'
           ELSE '영업외' END AS slot,
         (visitor_email IS NOT NULL AND visitor_email <> '') AS has_email,
         (visitor_messenger_handle IS NOT NULL) AS has_handle,
         (clicked IS NOT NULL) AS has_click
    FROM b
), r AS (SELECT * FROM c WHERE NOT looks_test)`;

console.log(`기간: ${SINCE} ~ 지금 · 연락처 카드 기준일: ${CARD_SINCE} · 클릭 컬럼: ${colRows.length > 0 ? '있음' : '없음(042 미적용)'}`);

await q('0. 시험으로 보여 제외한 세션', `${base(SINCE)}
  SELECT count(*) FILTER (WHERE looks_test) AS 제외, count(*) FILTER (WHERE NOT looks_test) AS 남음 FROM c`);

await q('1. 구간별 문의와 첫 직원 답변', `${base(SINCE)}
  SELECT slot AS 구간, count(*) AS 세션,
         count(*) FILTER (WHERE first_human_at IS NULL) AS 직원답변_없음,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY wait_min))::numeric, 1) AS 첫답변_중앙값_분
    FROM r GROUP BY ROLLUP(slot) ORDER BY 1`);

await q('2. 영업중 문의의 답변 속도', `${base(SINCE)}
  SELECT count(*) AS 전체,
         count(*) FILTER (WHERE wait_min <= 5) AS "5분내",
         count(*) FILTER (WHERE wait_min > 5 AND wait_min <= 15) AS "5~15분",
         count(*) FILTER (WHERE wait_min > 15 AND wait_min <= 60) AS "15~60분",
         count(*) FILTER (WHERE wait_min > 60) AS "1시간초과",
         count(*) FILTER (WHERE wait_min IS NULL) AS 무응답
    FROM r WHERE slot = '영업중'`);

await q('3. 답변 속도별 — 답변 뒤 손님이 다시 말했는가', `${base(SINCE)}
  SELECT CASE WHEN wait_min <= 5 THEN 'a. 5분내' WHEN wait_min <= 15 THEN 'b. 5~15분' ELSE 'c. 15분초과' END AS 답변속도,
         count(*) AS 세션,
         count(*) FILTER (WHERE last_visitor_at > first_human_at) AS 손님_다시말함
    FROM r WHERE first_human_at IS NOT NULL GROUP BY 1 ORDER BY 1`);

await q('4. [G-2] 연락처와 "다시 닿을 길 없음"', `${base(SINCE)}
  SELECT slot AS 구간, count(*) AS 세션,
         count(*) FILTER (WHERE has_email) AS 이메일,
         count(*) FILTER (WHERE has_handle) AS 메신저_연락처,
         count(*) FILTER (WHERE has_click) AS 메신저_버튼,
         count(*) FILTER (WHERE NOT has_email AND NOT has_handle) AS 연락처_전무,
         count(*) FILTER (WHERE NOT has_email AND NOT has_handle
                           AND (first_human_at IS NULL OR last_visitor_at <= first_human_at)) AS 다시_닿을_길_없음
    FROM r GROUP BY ROLLUP(slot) ORDER BY 1`);

await q(`5. [G-1] ${CARD_SINCE} 이후 — 연락 수단 확보(이메일·메신저 연락처·메신저 버튼)`, `${base(SINCE)}
  SELECT slot AS 구간, count(*) AS 세션,
         count(*) FILTER (WHERE has_email OR has_handle OR has_click) AS 연락수단_확보,
         count(*) FILTER (WHERE has_handle) AS 메신저_연락처,
         count(*) FILTER (WHERE visitor_messenger_channel = 'whatsapp') AS whatsapp,
         count(*) FILTER (WHERE visitor_messenger_channel = 'wechat') AS wechat,
         count(*) FILTER (WHERE visitor_messenger_channel = 'line') AS line
    FROM r WHERE first_visitor_at >= timestamptz '${CARD_SINCE} 00:00+09' GROUP BY ROLLUP(slot) ORDER BY 1`);

await q('6. 언어별', `${base(SINCE)}
  SELECT visitor_locale AS 언어, count(*) AS 세션,
         count(*) FILTER (WHERE has_email) AS 이메일,
         count(*) FILTER (WHERE has_handle) AS 메신저_연락처
    FROM r GROUP BY 1 ORDER BY 2 DESC`);

await q('7. 주별 추이', `${base(SINCE)}
  SELECT to_char(date_trunc('week', fv_kst), 'MM-DD') AS 주_시작, count(*) AS 세션,
         count(*) FILTER (WHERE has_email OR has_handle OR has_click) AS 연락수단_확보,
         count(*) FILTER (WHERE first_human_at IS NULL) AS 직원답변_없음
    FROM r GROUP BY 1 ORDER BY 1`);

// G-5: 자동 안내가 손님 글 뒤 몇 초 만에 나갔는가 (시험 세션 포함 — 지연은 누가 쓰든 같다).
await q('8. [G-5] 자동 안내 지연(초) — 직전 손님 글 기준', `
  WITH d AS (
    SELECT EXTRACT(EPOCH FROM (a.created_at - v.created_at)) AS sec, a.created_at
      FROM public.chat_messages a
      JOIN LATERAL (
        SELECT created_at FROM public.chat_messages v
         WHERE v.session_id = a.session_id AND v.sender = 'visitor' AND v.created_at <= a.created_at
         ORDER BY v.created_at DESC LIMIT 1) v ON true
     WHERE a.source = 'auto' AND a.created_at >= timestamptz '${SINCE} 00:00+09')
  SELECT count(*) AS 횟수,
         round(min(sec)::numeric, 1) AS 최소,
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY sec))::numeric, 1) AS 중앙값,
         round(max(sec)::numeric, 1) AS 최대,
         to_char(max(created_at) AT TIME ZONE 'Asia/Seoul', 'MM-DD HH24:MI') AS 마지막_KST
    FROM d`);

// G-6: 가격·프로모션을 물은 손님이 이벤트 안내(프로모션 링크)를 몇 초 만에 받았는가.
// 시험 세션은 이름으로만 뺀다(첫 글 기준은 쓰지 않는다 — 대화 중간의 가격 질문도 세기 때문이다).
if (HAS_EVENT_HINT) {
  await q('9. [G-6] 이벤트 안내 — 나간 세션·손님 글에서 안내까지(초)·연락 수단 확보', `
    WITH h AS (
      SELECT a.session_id,
             EXTRACT(EPOCH FROM (a.created_at - v.created_at)) AS sec
        FROM public.chat_messages a
        JOIN LATERAL (
          SELECT created_at FROM public.chat_messages v
           WHERE v.session_id = a.session_id AND v.sender = 'visitor' AND v.created_at <= a.created_at
           ORDER BY v.created_at DESC LIMIT 1) v ON true
       WHERE a.source = 'auto'
         AND a.original_text ~ 'https?://[^[:space:]]+/events(/[^[:space:]]*)?$'
         AND a.created_at >= timestamptz '${SINCE} 00:00+09'),
    s AS (
      SELECT h.session_id, min(h.sec) AS first_sec, count(*) AS hints,
             bool_or((cs.visitor_email IS NOT NULL AND cs.visitor_email <> '')
                     OR cs.visitor_messenger_handle IS NOT NULL
                     OR ${CLICKED} IS NOT NULL) AS has_means
        FROM h JOIN public.chat_sessions cs ON cs.id = h.session_id
       WHERE coalesce(cs.visitor_name, '') !~* '(test|테스트|smoke)'
       GROUP BY h.session_id)
    SELECT count(*) AS 세션, coalesce(sum(hints), 0) AS 안내_횟수,
           round(min(first_sec)::numeric, 1) AS 최소,
           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY first_sec))::numeric, 1) AS 중앙값,
           round(max(first_sec)::numeric, 1) AS 최대,
           count(*) FILTER (WHERE has_means) AS 연락수단_확보
      FROM s`);
} else {
  console.log('\n── 9. [G-6] 이벤트 안내 ──\n  (건너뜀 — event_hint_at 컬럼 없음, 042 미적용)');
}

await db.query('ROLLBACK');
await db.end();
console.log('\n완료 (READ ONLY 트랜잭션 — 아무것도 변경하지 않았습니다)');
