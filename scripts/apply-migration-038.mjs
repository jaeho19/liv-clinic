// 038_marketing_attribution 적용 스크립트 (읽기: .env.local의 DATABASE_URL)
// 실행: cd liv-clinic && node ../scripts/apply-migration-038.mjs
// 이 PC는 TLS 가로채기 프록시 뒤에 있어 ssl.rejectUnauthorized=false 필요 (로컬 한정).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clinicDir = path.resolve(__dirname, '../liv-clinic');
const require = createRequire(path.join(clinicDir, 'package.json'));
const { Client } = require('pg');

const env = fs.readFileSync(path.join(clinicDir, '.env.local'), 'utf8');
const m = env.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?\s*$/m);
if (!m) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sqlPath = path.join(clinicDir, 'supabase/migrations/038_marketing_attribution.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new Client({ connectionString: m[1], ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('connected. applying 038_marketing_attribution.sql ...');
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('migration applied.');

  const cols = await client.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'inflow_leads' AND column_name IN
      ('patient_origin','channel_category','channel_detail','treatment_tags','paid',
       'paid_date','paid_amount_krw','outcome','campaign_id','manager','classified_at')
      ORDER BY column_name`
  );
  console.log('inflow_leads new columns:', cols.rows.map((r) => r.column_name).join(', '));

  const utm = await client.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name = 'consultation_requests' AND column_name LIKE 'utm_%' ORDER BY column_name`
  );
  console.log('consultation_requests utm columns:', utm.rows.map((r) => r.column_name).join(', '));

  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN
     ('marketing_campaigns','marketing_contents','lead_content_links') ORDER BY tablename`
  );
  console.log('new tables:', tables.rows.map((r) => r.tablename).join(', '));

  const pol = await client.query(
    `SELECT tablename, count(*)::int n FROM pg_policies
      WHERE tablename IN ('marketing_campaigns','marketing_contents','lead_content_links')
      GROUP BY tablename ORDER BY tablename`
  );
  console.log('policies:', pol.rows.map((r) => `${r.tablename}=${r.n}`).join(', '));

  const legacy = await client.query(`SELECT count(*)::int n FROM inflow_leads`);
  console.log('inflow_leads row count (unchanged expected: 202):', legacy.rows[0].n);
} catch (e) {
  try { await client.query('ROLLBACK'); } catch { /* noop */ }
  console.error('MIGRATION FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
