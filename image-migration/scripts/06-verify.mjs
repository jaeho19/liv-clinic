// STEP 6 — 전수 검증. 눈으로 보지 말고 스크립트로 확인한다.
// DB에 실제로 남아 있는 모든 Storage URL을 다시 긁어 하나씩 찔러본다.
// (HEAD가 아니라 1바이트 Range GET — 이유는 lib.mjs 의 checkUrl 참고)
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/06-verify.mjs
import { writeFile } from 'node:fs/promises'
import { pg, pool, checkUrl, mb, PUBLIC_PREFIX } from './lib.mjs'

const TABLES = ['events', 'popups', 'before_after']

const c = await pg()
const { rows: cols } = await c.query(`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema='public' and table_name = any($1)
    and (data_type in ('text','character varying') or data_type='ARRAY')
  order by table_name, ordinal_position`, [TABLES])

const refs = []
for (const { table_name: t, column_name: col, data_type: dt } of cols) {
  const sql = dt === 'ARRAY'
    ? `select u.val from public."${t}" x, unnest(x."${col}") u(val) where u.val like '%' || $1 || '%'`
    : `select x."${col}" as val from public."${t}" x where x."${col}" like '%' || $1 || '%'`
  let rows
  try { ({ rows } = await c.query(sql, [PUBLIC_PREFIX])) }
  catch (e) { if (/operator does not exist|cannot be matched/i.test(e.message)) continue; throw e }
  for (const r of rows) refs.push({ where: `${t}.${col}`, url: r.val })
}
await c.end()

console.log(`DB에 남은 Storage URL ${refs.length}건 검증 중...`)

const bad = []
let bytes = 0
await pool(refs, 8, async (r) => {
  const res = await checkUrl(r.url)
  if (!res.ok) bad.push([res.reason, r.where, r.url, res.detail])
  else bytes += res.size
})

console.log(`\n실 서빙 총량 ${mb(bytes)} MB (${refs.length}개)`)

const nonWebp = refs.filter((r) => !/\.webp$/i.test(r.url.split('?')[0]))
if (nonWebp.length) {
  console.error(`\n❌ 확장자가 webp가 아닌 URL ${nonWebp.length}건:`)
  for (const r of nonWebp.slice(0, 10)) console.error(`   ${r.where}  ${r.url}`)
}

if (bad.length) {
  console.error(`\n❌ 접근 실패/형식 오류 ${bad.length}건:`)
  for (const b of bad.slice(0, 25)) console.error(`   ${b[0].padEnd(10)} ${b[1].padEnd(26)} ${b[2]} ${b[3]}`)
  await writeFile('verify-failures.json', JSON.stringify(bad, null, 2))
  process.exit(1)
}
if (nonWebp.length) process.exit(1)

console.log(`✅ 검증 통과 — ${refs.length}건 전부 200/206 + image/webp + max-age=31536000`)
console.log('   다음: 실제 사이트에서 이벤트 목록 → 상세 → 팝업 → before/after 를 4개 언어로 확인')
