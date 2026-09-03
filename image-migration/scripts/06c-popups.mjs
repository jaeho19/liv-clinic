// STEP 6 보조 — 팝업 표시 조건 확인 (사이트에 안 뜨는 이유가 이미지 문제인지 가리기 위해)
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/06c-popups.mjs
import { pg } from './lib.mjs'

const c = await pg()
const { rows: cols } = await c.query(`
  select column_name, data_type from information_schema.columns
  where table_schema='public' and table_name='popups' order by ordinal_position`)
console.log('popups 컬럼:', cols.map((c) => c.column_name).join(', '))

const { rows } = await c.query(`select * from popups order by created_at desc nulls last`)
for (const r of rows) {
  console.log(`\n  ${r.title ?? '(제목없음)'}`)
  for (const k of ['id', 'is_active', 'display_start', 'display_end', 'display_order', 'link_url']) {
    if (k in r) console.log(`     ${k.padEnd(14)} ${r[k]}`)
  }
  console.log(`     image_url      ...${String(r.image_url ?? '').slice(-42)}`)
}
await c.end()
