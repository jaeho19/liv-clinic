// STEP 7 — 원본 삭제. 되돌릴 수 없는 단계.
//
// 안전장치 (전부 통과해야 삭제한다):
//  1) backup/ 의 모든 파일이 manifest 와 바이트·sha256 까지 일치
//  2) 삭제 후보가 DB 어디에서도 참조되지 않음 (지금 다시 조회해서 확인)
//  3) 삭제 후보 전부가 backup/ 에 실물로 존재
//  4) 삭제 후 남을 파일 수 = 현재 참조 건수
//
// 모드:
//   --replaced-only  webp로 교체된 원본 144개만 삭제, 미참조 고아 89개는 남긴다 (기본)
//   --all            미참조 고아까지 전부 삭제
//
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/07-delete.mjs [--all] [--commit]
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { db, pg, pool, mb, PUBLIC_PREFIX } from './lib.mjs'

const COMMIT = process.argv.includes('--commit')
const ALL = process.argv.includes('--all')
const TABLES = ['events', 'popups', 'before_after']

// ── 1) 백업 무결성 ────────────────────────────────────────────
const manifest = JSON.parse(await readFile('backup/manifest.json', 'utf8'))
console.log(`백업 무결성 검사 (${manifest.length}개)...`)
const bad = []
await pool(manifest, 8, async (m) => {
  const p = join('backup', m.bucket, m.path)
  let st
  try { st = await stat(p) } catch { bad.push(`없음: ${m.bucket}/${m.path}`); return }
  if (st.size !== m.size) { bad.push(`크기 불일치: ${m.bucket}/${m.path} ${st.size} vs ${m.size}`); return }
  if (m.sha256) {
    const h = createHash('sha256').update(await readFile(p)).digest('hex')
    if (h !== m.sha256) bad.push(`해시 불일치: ${m.bucket}/${m.path}`)
  }
})
if (bad.length) {
  console.error(`\n❌ 백업 무결성 실패 ${bad.length}건 — 삭제 중단:\n  ` + bad.slice(0, 10).join('\n  '))
  process.exit(1)
}
console.log(`✅ 백업 ${manifest.length}개 / ${mb(manifest.reduce((s, m) => s + m.size, 0))} MB 무결 (sha256 대조)`)

// ── 2) 현재 참조 목록을 DB에서 새로 뽑는다 ─────────────────────
const c = await pg()
const { rows: cols } = await c.query(`
  select table_name, column_name, data_type from information_schema.columns
  where table_schema='public' and table_name = any($1)
    and (data_type in ('text','character varying') or data_type='ARRAY')`, [TABLES])

const referenced = new Set()
for (const { table_name: t, column_name: col, data_type: dt } of cols) {
  const sql = dt === 'ARRAY'
    ? `select u.val from public."${t}" x, unnest(x."${col}") u(val) where u.val like '%' || $1 || '%'`
    : `select x."${col}" as val from public."${t}" x where x."${col}" like '%' || $1 || '%'`
  let rows
  try { ({ rows } = await c.query(sql, [PUBLIC_PREFIX])) }
  catch (e) { if (/operator does not exist|cannot be matched/i.test(e.message)) continue; throw e }
  for (const r of rows) {
    let p = r.val.slice(r.val.indexOf(PUBLIC_PREFIX) + PUBLIC_PREFIX.length).split('?')[0]
    try { p = decodeURIComponent(p) } catch { /* 그대로 */ }
    referenced.add(p)
  }
}

const { rows: objs } = await c.query(`
  select b.name as bucket, o.name as path, coalesce((o.metadata->>'size')::bigint,0) as size
  from storage.objects o join storage.buckets b on b.id = o.bucket_id
  where b.name = any($1) order by b.name, o.name`, [['events', 'popups', 'before-after']])
await c.end()

const all = objs.map((o) => ({ bucket: o.bucket, path: o.path, key: `${o.bucket}/${o.path}`, size: Number(o.size) }))
const keep = all.filter((o) => referenced.has(o.key))
const unref = all.filter((o) => !referenced.has(o.key))

// webp로 교체된 원본 = 3단계에서 변환한 소스 파일들
const replacedSet = new Set(
  JSON.parse(await readFile('convert-report.json', 'utf8')).results.map((r) => r.path))
const del = ALL ? unref : unref.filter((o) => replacedSet.has(o.key))
const held = unref.filter((o) => !del.includes(o))

console.log(`\n모드: ${ALL ? '--all (고아까지 전부 삭제)' : '--replaced-only (교체된 원본만 삭제, 고아 보류)'}`)
console.log(`현재 스토리지 ${all.length}개 / ${mb(all.reduce((s, o) => s + o.size, 0))} MB`)
console.log(`  DB 참조(유지)   ${keep.length}개 / ${mb(keep.reduce((s, o) => s + o.size, 0))} MB`)
console.log(`  삭제 대상       ${del.length}개 / ${mb(del.reduce((s, o) => s + o.size, 0))} MB`)
if (held.length) console.log(`  보류(미참조 고아) ${held.length}개 / ${mb(held.reduce((s, o) => s + o.size, 0))} MB`)

if (!ALL && del.length !== replacedSet.size) {
  console.error(`\n❌ 교체 원본 ${replacedSet.size}개 중 삭제 대상이 ${del.length}개 — 개수가 맞지 않는다`)
  process.exit(1)
}

// ── 3) 삭제 후보가 전부 백업에 있는가 ──────────────────────────
const backedUp = new Set(manifest.map((m) => `${m.bucket}/${m.path}`))
const notBacked = del.filter((o) => !backedUp.has(o.key))
if (notBacked.length) {
  console.error(`\n❌ 백업에 없는 삭제 후보 ${notBacked.length}건 — 삭제 중단:`)
  for (const o of notBacked.slice(0, 15)) console.error('   ' + o.key)
  process.exit(1)
}
console.log(`✅ 삭제 후보 ${del.length}개 전부 backup/ 에 존재`)

// ── 4) 참조 중인 파일이 삭제 목록에 섞이지 않았는가 ─────────────
const oops = del.filter((o) => referenced.has(o.key))
if (oops.length || keep.length !== referenced.size) {
  console.error(`\n❌ 참조 대조 이상: 참조 ${referenced.size}건 vs 유지 ${keep.length}개, 오염 ${oops.length}건 — 삭제 중단`)
  process.exit(1)
}

// 분류 내역
const byPrefix = new Map()
for (const o of del) {
  const seg = o.path.split('/')
  const k = `${o.bucket}/${seg.length > 1 ? seg[0] : '(root)'}`
  const g = byPrefix.get(k) ?? { n: 0, b: 0 }
  g.n++; g.b += o.size
  byPrefix.set(k, g)
}
console.log('\n삭제 내역')
for (const [k, g] of [...byPrefix].sort()) console.log(`  ${k.padEnd(34)}${String(g.n).padStart(4)}개  ${mb(g.b).padStart(7)} MB`)

if (!COMMIT) {
  console.log('\n(드라이런) 실제 삭제: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/07-delete.mjs --commit')
  process.exit(0)
}

// ── 실행 ──────────────────────────────────────────────────────
const client = db()
const byBucket = new Map()
for (const o of del) {
  if (!byBucket.has(o.bucket)) byBucket.set(o.bucket, [])
  byBucket.get(o.bucket).push(o.path)
}
let removed = 0
for (const [bucket, paths] of byBucket) {
  for (let i = 0; i < paths.length; i += 100) {   // remove()는 배열로, 100개씩 끊어서
    const chunk = paths.slice(i, i + 100)
    const { error } = await client.storage.from(bucket).remove(chunk)
    if (error) throw new Error(`${bucket} 삭제 실패: ${error.message}`)
    removed += chunk.length
    console.log(`  ${bucket}: ${removed}/${del.length} ...`)
  }
}
console.log(`\n삭제 완료 ${removed}개`)

// ── 사후 확인 ────────────────────────────────────────────────
const c2 = await pg()
const { rows: after } = await c2.query(`
  select count(*)::int n, coalesce(sum((o.metadata->>'size')::bigint),0)::bigint b
  from storage.objects o join storage.buckets b on b.id = o.bucket_id where b.name = any($1)`,
  [['events', 'popups', 'before-after']])
await c2.end()
const expected = keep.length + held.length
console.log(`남은 파일 ${after[0].n}개 / ${mb(Number(after[0].b))} MB (기대 ${expected}개 = 참조 ${keep.length} + 보류 ${held.length})`)
if (after[0].n !== expected) {
  console.error('❌ 남은 파일 수가 기대와 다르다')
  process.exit(1)
}
console.log('✅ 삭제 검증 통과')
