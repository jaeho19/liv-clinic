// STEP 2 보조 — public 스키마 전체 테이블을 훑어 Storage URL 참조 누락이 없는지 확인.
// 02-refmap.mjs 는 6개 테이블만 본다. 삭제는 되돌릴 수 없으므로 전수로 한 번 더 본다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/02b-scan-all-tables.mjs
import { pg, PUBLIC_PREFIX } from './lib.mjs'

const KNOWN = ['events', 'popups', 'before_after', 'reviews', 'marketing_contents', 'notification_templates']

const c = await pg()
const { rows: tbls } = await c.query(`
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`)
console.log(`public 테이블 총 ${tbls.length}개 스캔`)

const hits = []
for (const { table_name: t } of tbls) {
  const { rows } = await c.query(
    `select count(*)::int n from public."${t}" x where to_jsonb(x)::text like '%' || $1 || '%'`,
    [PUBLIC_PREFIX])
  if (rows[0].n) hits.push({ table: t, rows: rows[0].n, known: KNOWN.includes(t) })
}
await c.end()

console.log('\nStorage URL을 담은 테이블:')
for (const h of hits) {
  console.log(`  ${h.table.padEnd(28)}${String(h.rows).padStart(5)} 행   ${h.known ? '(02단계에 포함됨)' : '⚠️ 누락!'}`)
}

const missed = hits.filter((h) => !h.known)
if (missed.length) {
  console.error(`\n❌ 02-refmap.mjs 가 놓친 테이블 ${missed.length}개: ${missed.map((h) => h.table).join(', ')}`)
  console.error('   02-refmap.mjs 의 CANDIDATE_TABLES 에 추가하고 다시 돌릴 것')
  process.exit(1)
}
console.log('\n✅ 누락된 참조 테이블 없음 — 02단계 참조맵이 전수를 덮는다')
