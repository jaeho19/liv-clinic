// STEP 3 준비 — 각 이미지가 "어느 컬럼에서" 참조되는지 뽑는다.
// 규격(장변/품질)이 용도별로 다르므로 역할을 알아야 한다.
// 컬럼을 손으로 열거하면 다국어/배열 컬럼을 빠뜨리므로 information_schema 에서 동적으로 읽는다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/03a-roles.mjs
import { writeFile } from 'node:fs/promises'
import { pg, PUBLIC_PREFIX } from './lib.mjs'

const TABLES = ['events', 'popups', 'before_after']

const c = await pg()

// 텍스트 계열 컬럼만 대상. ARRAY 는 unnest 로 편다.
const { rows: cols } = await c.query(`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema = 'public' and table_name = any($1)
    and (data_type in ('text','character varying') or data_type = 'ARRAY')
  order by table_name, ordinal_position`, [TABLES])

const refs = []   // { table, column, url, path }
for (const { table_name: t, column_name: col, data_type: dt } of cols) {
  const sql = dt === 'ARRAY'
    ? `select u.val from public."${t}" x, unnest(x."${col}") u(val) where u.val like '%' || $1 || '%'`
    : `select x."${col}" as val from public."${t}" x where x."${col}" like '%' || $1 || '%'`
  let rows
  try {
    ({ rows } = await c.query(sql, [PUBLIC_PREFIX]))
  } catch (e) {
    // text[] 가 아닌 배열(예: jsonb[], int[])은 like 비교가 안 된다 — 건너뛴다
    if (/operator does not exist|cannot be matched/i.test(e.message)) continue
    throw e
  }
  for (const r of rows) {
    const i = r.val.indexOf(PUBLIC_PREFIX)
    if (i === -1) continue
    let path = r.val.slice(i + PUBLIC_PREFIX.length).split('?')[0]
    try { path = decodeURIComponent(path) } catch { /* 그대로 */ }
    refs.push({ table: t, column: col, url: r.val, path })
  }
}
await c.end()

// 규격 결정 — 한 파일이 여러 역할이면 가장 큰 장변을 쓴다(작게 만들었다가 큰 자리에 쓰면 흐려진다)
const SPEC = {
  'events.gallery_images': { width: 1600, quality: 78, label: '갤러리' },
  'events.poster_image': { width: 1200, quality: 80, label: '포스터' },
  'events.thumbnail_image': { width: 400, quality: 72, label: '썸네일' },
  'popups.image_url': { width: 1000, quality: 80, label: '팝업' },
  'before_after.image_url': { width: 1200, quality: 82, label: 'before/after' },
}
// 다국어 접미사(_en/_ja/_zh)를 떼어 기본 컬럼으로 정규화
const baseKey = (t, col) => `${t}.${col.replace(/_(en|ja|zh)$/, '')}`

const byPath = new Map()
for (const r of refs) {
  const key = baseKey(r.table, r.column)
  const spec = SPEC[key]
  if (!spec) { console.warn(`⚠️ 규격 미정 컬럼: ${key} (${r.path})`); continue }
  const cur = byPath.get(r.path) ?? { path: r.path, roles: new Set(), urls: new Set(), width: 0, quality: 0, thumb: false }
  cur.roles.add(spec.label)
  cur.urls.add(r.url)
  if (spec.width > cur.width) { cur.width = spec.width; cur.quality = spec.quality }
  if (key === 'events.thumbnail_image') cur.thumb = true
  byPath.set(r.path, cur)
}

const plan = [...byPath.values()].map((v) => ({
  path: v.path, width: v.width, quality: v.quality,
  roles: [...v.roles], urls: [...v.urls], thumb: v.thumb,
}))

// 컬럼별 참조 건수
const perCol = new Map()
for (const r of refs) {
  const k = `${r.table}.${r.column}`
  perCol.set(k, (perCol.get(k) ?? 0) + 1)
}
console.log('컬럼별 참조 건수')
for (const [k, n] of [...perCol].sort()) console.log(`  ${k.padEnd(34)}${String(n).padStart(4)}`)

const perSpec = new Map()
for (const p of plan) {
  const k = `${p.width}px q${p.quality}`
  perSpec.set(k, (perSpec.get(k) ?? 0) + 1)
}
console.log('\n규격별 파일 수 (중복 역할은 큰 쪽으로 통일)')
for (const [k, n] of [...perSpec].sort()) console.log(`  ${k.padEnd(34)}${String(n).padStart(4)}`)
console.log(`\n썸네일(-thumb.webp) 추가 생성 대상: ${plan.filter((p) => p.thumb).length}개`)

const multi = plan.filter((p) => p.roles.length > 1)
if (multi.length) {
  console.log(`\n여러 역할로 쓰이는 파일 ${multi.length}개 (큰 규격 적용):`)
  for (const p of multi) console.log(`  ${p.path}  [${p.roles.join(' + ')}] → ${p.width}px`)
}

console.log(`\n고유 파일 ${plan.length}개 / 참조 URL ${refs.length}건`)
await writeFile('roles.json', JSON.stringify({ generatedAt: new Date().toISOString(), plan, refCount: refs.length }, null, 2))
console.log('roles.json 기록 완료')
