// STEP 8 준비 — storage.objects RLS 정책 확인.
// temp/ → 정식 경로 이동(move)은 UPDATE 권한이 필요하다. 관리자 세션으로 가능한지 본다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/08a-policies.mjs
import { pg } from './lib.mjs'

const c = await pg()
const { rows } = await c.query(`
  select policyname, cmd, roles::text, qual, with_check
  from pg_policies where schemaname='storage' and tablename='objects'
  order by cmd, policyname`)
console.log(`storage.objects 정책 ${rows.length}개\n`)
for (const r of rows) {
  console.log(`[${r.cmd}] ${r.policyname}   roles=${r.roles}`)
  if (r.qual) console.log(`    USING       ${String(r.qual).replace(/\s+/g, ' ').slice(0, 160)}`)
  if (r.with_check) console.log(`    WITH CHECK  ${String(r.with_check).replace(/\s+/g, ' ').slice(0, 160)}`)
}

const { rows: b } = await c.query(`select name, public, file_size_limit, allowed_mime_types from storage.buckets order by name`)
console.log('\n버킷')
for (const x of b) {
  console.log(`  ${x.name.padEnd(16)} public=${x.public}  limit=${x.file_size_limit ?? '-'}  mime=${x.allowed_mime_types ?? '-'}`)
}
await c.end()
