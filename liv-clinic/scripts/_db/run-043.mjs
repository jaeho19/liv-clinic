// 마이그레이션 043 을 운영 DB에 적용하거나(--apply), 트랜잭션 안에서 검증만 하고 되돌린다(기본).
// 사용 (liv-clinic 폴더에서):
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-043.mjs           # 검증만 (ROLLBACK)
//   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/_db/run-043.mjs --apply   # 검증이 통과하면 적용 (COMMIT)
// .env.local 의 DATABASE_URL 을 쓴다. 다른 세션이 테이블을 잡고 있으면 5초 기다리다 그만둔다.
import fs from 'node:fs';
import pg from 'pg';
import { verify043 } from './verify-043.mjs';

const FILE = 'supabase/migrations/043_chat_ai_first_response.sql';
const apply = process.argv.includes('--apply');

const env = fs.readFileSync('.env.local', 'utf8');
const m = env.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
if (!m) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new pg.Client({ connectionString: m[1], ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query(fs.readFileSync(FILE, 'utf8'));
  console.log(`[run-043] ${FILE} executed inside transaction`);

  const result = await verify043((sql, params) => client.query(sql, params).then((r) => r.rows));
  console.log(result.ok ? '[verify] 043 OK' : `[verify] 043 MISMATCH — do not apply (${result.fails.join(' / ')})`);

  if (apply && result.ok) {
    await client.query('COMMIT');
    console.log('[run-043] COMMITTED');
  } else {
    await client.query('ROLLBACK');
    console.log(apply ? '[run-043] ROLLED BACK (verify failed)' : '[run-043] ROLLED BACK (dry run)');
    if (!result.ok) process.exitCode = 1;
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[run-043] failed:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
