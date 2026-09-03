// 마이그레이션을 프로덕션 DB에 적용하거나(--apply) 트랜잭션 안에서 검증만 하고 되돌린다(기본).
// 사용:
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/040_chat_slack_rooms.sql          # 검증만 (ROLLBACK)
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-sql.mjs supabase/migrations/040_chat_slack_rooms.sql --apply  # 실제 적용
// .env.local의 DATABASE_URL을 쓴다 (한 줄 값만 읽는다 — 여러 줄 따옴표 값은 다른 키에만 있다).
import fs from 'node:fs';
import pg from 'pg';

const file = process.argv[2];
const apply = process.argv.includes('--apply');
if (!file) {
  console.error('usage: node scripts/_db/run-sql.mjs <file.sql> [--apply]');
  process.exit(1);
}
const env = fs.readFileSync('.env.local', 'utf8');
const m = env.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
if (!m) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const VERIFY = `
  INSERT INTO public.chat_sessions (visitor_locale, visitor_name) VALUES ('en', 'Verify 040') RETURNING id;
`;

const client = new pg.Client({ connectionString: m[1], ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(fs.readFileSync(file, 'utf8'));
  console.log(`[run-sql] ${file} executed inside transaction`);

  // 트리거 동작 검증 (항상 실행, 결과는 화면에만)
  const { rows: [s] } = await client.query(VERIFY);
  const q = (sql, params) => client.query(sql, params).then((r) => r.rows[0]);
  const state = () =>
    q(
      'SELECT unread_admin_count, awaiting_since, escalation_level, resolved_at, auto_ack_at FROM public.chat_sessions WHERE id = $1',
      [s.id]
    );
  await q("UPDATE public.chat_sessions SET resolved_at = now(), escalation_level = 2 WHERE id = $1", [s.id]);
  await q("INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang) VALUES ($1, 'visitor', 'hi', 'en')", [s.id]);
  const afterVisitor = await state();
  console.log('[verify] after visitor  :', afterVisitor);
  await q("INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source, translation_status) VALUES ($1, 'operator', '자동', 'ko', 'auto', 'success')", [s.id]);
  const afterAuto = await state();
  console.log('[verify] after auto ack :', afterAuto);
  await q("INSERT INTO public.chat_messages (session_id, sender, original_text, original_lang, source) VALUES ($1, 'operator', '답변', 'ko', 'slack')", [s.id]);
  const afterOperator = await state();
  console.log('[verify] after operator :', afterOperator);

  const ok =
    afterVisitor.unread_admin_count === 1 && afterVisitor.awaiting_since !== null && afterVisitor.resolved_at === null &&
    afterAuto.unread_admin_count === 1 && afterAuto.awaiting_since !== null && afterAuto.escalation_level === 2 &&
    afterOperator.unread_admin_count === 0 && afterOperator.awaiting_since === null && afterOperator.escalation_level === 0;
  console.log(ok ? '[verify] trigger OK' : '[verify] trigger MISMATCH — do not apply');

  // 검증용 행은 항상 지운다 (CASCADE로 메시지도)
  await client.query('DELETE FROM public.chat_sessions WHERE id = $1', [s.id]);

  if (apply && ok) {
    await client.query('COMMIT');
    console.log('[run-sql] COMMITTED');
  } else {
    await client.query('ROLLBACK');
    console.log(apply ? '[run-sql] ROLLED BACK (verify failed)' : '[run-sql] ROLLED BACK (dry run)');
    if (!ok) process.exitCode = 1;
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[run-sql] failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
