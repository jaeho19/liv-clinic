// STEP 2 — DB 참조 맵. 실제로 쓰이는 파일을 가려낸다.
// 컬럼을 열거하면 gallery_images* 같은 배열/다국어 컬럼을 빠뜨린다.
// 행 전체를 JSON 문자열로 바꿔 URL 패턴을 긁는다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/02-refmap.mjs
import { writeFile } from 'node:fs/promises'
import { pg, mb, PUBLIC_PREFIX } from './lib.mjs'

const CANDIDATE_TABLES = [
  'events', 'popups', 'before_after',
  'reviews', 'marketing_contents', 'notification_templates',
]

const c = await pg()

// 1) 실제 존재하는 테이블만 대상으로 삼는다
const { rows: existing } = await c.query(
  `select table_name from information_schema.tables
   where table_schema = 'public' and table_name = any($1)`,
  [CANDIDATE_TABLES],
)
const tables = existing.map((r) => r.table_name)
console.log('대상 테이블:', tables.join(', '))
const missing = CANDIDATE_TABLES.filter((t) => !tables.includes(t))
if (missing.length) console.log('(없는 테이블, 건너뜀:', missing.join(', ') + ')')

// 2) 행 전체 → JSON 텍스트 → URL 추출
const union = tables
  .map((t) => `select '${t}' as tbl, to_jsonb(t)::text as j from public.${t} t`)
  .join('\n  union all ')

const { rows: refRows } = await c.query(`
  with rows as (
    ${union}
  )
  select distinct tbl,
    -- 백슬래시를 쓰면 SQL 리터럴에서 이스케이프가 꼬여 문자 클래스가 망가진다.
    -- (\\s 가 "s 제외"로 해석돼 events/ 가 event 에서 끊긴 적 있음) POSIX 클래스를 쓴다.
    (regexp_matches(j, '${PUBLIC_PREFIX}([^"?[:space:]]+)', 'g'))[1] as object_path
  from rows
`)

// 3) Storage 전체 목록 (402와 무관하게 테이블 직접 조회)
const { rows: objRows } = await c.query(`
  select b.name as bucket, o.name as path,
         coalesce((o.metadata->>'size')::bigint, 0) as size,
         o.metadata->>'mimetype' as mime
  from storage.objects o
  join storage.buckets b on b.id = o.bucket_id
  order by b.name, o.name
`)

await c.end()

// 4) 참조 경로 정규화 — DB 값은 퍼센트 인코딩돼 있을 수 있다
const decode = (s) => { try { return decodeURIComponent(s) } catch { return s } }
const referenced = new Map()   // "bucket/path" -> [테이블…]
for (const r of refRows) {
  const key = decode(r.object_path)
  if (!referenced.has(key)) referenced.set(key, [])
  if (!referenced.get(key).includes(r.tbl)) referenced.get(key).push(r.tbl)
}

// 5) 대조
const objects = objRows.map((o) => ({ ...o, size: Number(o.size), key: `${o.bucket}/${o.path}` }))
const objKeys = new Set(objects.map((o) => o.key))
const used = objects.filter((o) => referenced.has(o.key))
const orphans = objects.filter((o) => !referenced.has(o.key))
// DB가 가리키는데 스토리지에 없는 것 = 이미 깨진 링크
const dangling = [...referenced.keys()].filter((k) => !objKeys.has(k))

const prefixOf = (o) => {
  const seg = o.path.split('/')
  return seg.length > 1 ? `${o.bucket}/${seg[0]}` : `${o.bucket}/(root)`
}
const groups = new Map()
for (const o of objects) {
  const g = groups.get(prefixOf(o)) ?? { orphan: 0, orphanMB: 0, used: 0, usedMB: 0 }
  if (referenced.has(o.key)) { g.used++; g.usedMB += o.size } else { g.orphan++; g.orphanMB += o.size }
  groups.set(prefixOf(o), g)
}

console.log('\n버킷/prefix          고아  고아MB   참조   참조MB')
console.log('─'.repeat(52))
for (const [k, g] of [...groups].sort()) {
  console.log(
    k.padEnd(20) + String(g.orphan).padStart(4) + mb(g.orphanMB).padStart(8) +
    String(g.used).padStart(7) + mb(g.usedMB).padStart(9))
}
console.log('─'.repeat(52))
console.log('합계'.padEnd(19) + String(orphans.length).padStart(4) +
  mb(orphans.reduce((s, o) => s + o.size, 0)).padStart(8) +
  String(used.length).padStart(7) + mb(used.reduce((s, o) => s + o.size, 0)).padStart(9))

console.log(`\n전체 ${objects.length}개 / ${mb(objects.reduce((s, o) => s + o.size, 0))} MB`)
console.log(`DB 참조 고유 경로 ${referenced.size}건 (그중 스토리지에 실재 ${used.length}건)`)
if (dangling.length) {
  console.log(`\n⚠️ DB는 가리키는데 스토리지에 없는 경로 ${dangling.length}건 (이미 깨진 링크):`)
  for (const d of dangling.slice(0, 20)) console.log('   ' + d)
  if (dangling.length > 20) console.log(`   ... 외 ${dangling.length - 20}건`)
}

await writeFile('refmap.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  tables,
  objects,
  referenced: Object.fromEntries(referenced),
  used: used.map((o) => o.key),
  orphans: orphans.map((o) => ({ key: o.key, size: o.size, mime: o.mime })),
  dangling,
}, null, 2))
console.log('\nrefmap.json 기록 완료')

if (objects.length !== 233) {
  console.log(`\n※ 스토리지 파일 수가 백업 시점(233)과 다르다: ${objects.length}`)
}
