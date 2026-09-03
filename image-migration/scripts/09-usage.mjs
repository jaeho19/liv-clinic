// 전체 버킷 사용량 현황. 이번 작업으로 실제로 얼마나 줄었는지 확인용.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/09-usage.mjs
import { pg, mb } from './lib.mjs'

const c = await pg()
const { rows } = await c.query(`
  select b.name as bucket, b.public,
         count(o.id)::int as files,
         coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint as bytes
  from storage.buckets b
  left join storage.objects o on o.bucket_id = b.id
  group by b.name, b.public
  order by bytes desc`)

console.log('버킷            공개   파일수      용량')
console.log('─'.repeat(44))
let files = 0, bytes = 0
for (const r of rows) {
  files += r.files; bytes += Number(r.bytes)
  console.log(`${r.bucket.padEnd(16)}${(r.public ? 'Y' : 'N').padEnd(6)}${String(r.files).padStart(5)}${mb(Number(r.bytes)).padStart(11)} MB`)
}
console.log('─'.repeat(44))
console.log(`${'합계'.padEnd(15)}${''.padEnd(6)}${String(files).padStart(5)}${mb(bytes).padStart(11)} MB`)

// 형식별
const { rows: fmt } = await c.query(`
  select o.metadata->>'mimetype' as mime, count(*)::int as n,
         coalesce(sum((o.metadata->>'size')::bigint),0)::bigint as bytes
  from storage.objects o group by 1 order by bytes desc`)
console.log('\n형식별')
for (const f of fmt) {
  console.log(`  ${String(f.mime).padEnd(14)}${String(f.n).padStart(5)}개${mb(Number(f.bytes)).padStart(9)} MB`)
}
await c.end()
