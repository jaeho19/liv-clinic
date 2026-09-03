// STEP 5 — DB URL 교체. 배열 컬럼이 함정이다.
//
// 런북 SQL 대비 보강한 점:
//  1) 컬럼을 손으로 열거하지 않고 information_schema 에서 읽는다 (다국어 4벌 누락 방지)
//  2) 빈 배열 {} 에 array_agg 를 쓰면 NULL 이 된다 → cardinality > 0 조건을 건다
//  3) 잔여 확장자 검사를 Storage URL 로 한정한다.
//     로컬 /images/*.jpg 경로가 섞여 있어 무조건 검사하면 게이트가 절대 안 열린다
//  4) 커밋 전에 배열 길이·원소 순서를 before/after 로 대조한다 (같은 트랜잭션 안에서)
//
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/05-dburl.mjs [--commit]
import { readFile } from 'node:fs/promises'
import { pg, PUBLIC_PREFIX } from './lib.mjs'

const COMMIT = process.argv.includes('--commit')
const TABLES = ['events', 'popups', 'before_after']
const SUFFIX = 'bak_0903'

// imgmap.csv 읽기 (따옴표로 감싼 2열)
const csv = await readFile('imgmap.csv', 'utf8')
const pairs = csv.trim().split('\n').slice(1).map((line) => {
  const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/)
  if (!m) throw new Error('imgmap.csv 파싱 실패: ' + line)
  return [m[1].replace(/""/g, '"'), m[2].replace(/""/g, '"')]
})
console.log(`매핑 ${pairs.length}건 로드`)

const c = await pg()

// 대상 컬럼 (텍스트 / 텍스트 배열)
const { rows: cols } = await c.query(`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema='public' and table_name = any($1)
    and (data_type in ('text','character varying') or data_type='ARRAY')
  order by table_name, ordinal_position`, [TABLES])

// 기본키
const { rows: pks } = await c.query(`
  select tc.table_name, kcu.column_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
  where tc.table_schema='public' and tc.constraint_type='PRIMARY KEY' and tc.table_name = any($1)`, [TABLES])
const pk = Object.fromEntries(pks.map((r) => [r.table_name, r.column_name]))
console.log('기본키:', JSON.stringify(pk))

const isStorage = (v) => typeof v === 'string' && v.includes(PUBLIC_PREFIX)
const snapshot = async () => {
  const out = {}
  for (const t of TABLES) {
    const cs = cols.filter((x) => x.table_name === t)
    const list = cs.map((x) => `"${x.column_name}"`).join(', ')
    const { rows } = await c.query(`select "${pk[t]}" as __pk, ${list} from public."${t}" order by 1`)
    out[t] = rows
  }
  return out
}

try {
  // 0) 롤백용 백업 테이블 — 트랜잭션 밖에서 먼저 확정한다
  for (const t of TABLES) {
    const bak = `${t}_${SUFFIX}`
    const { rows } = await c.query(`select to_regclass($1) as r`, [`public.${bak}`])
    if (rows[0].r) {
      console.log(`  백업 테이블 ${bak} 이미 존재 — 유지`)
    } else {
      await c.query(`create table public."${bak}" as select * from public."${t}"`)
      const { rows: n } = await c.query(`select count(*)::int n from public."${bak}"`)
      console.log(`  백업 테이블 ${bak} 생성 (${n[0].n}행)`)
    }
  }

  // 1) 매핑 테이블
  await c.query(`drop table if exists _img_map`)
  await c.query(`create table _img_map (old text primary key, new text not null)`)
  await c.query(
    `insert into _img_map (old, new) select * from unnest($1::text[], $2::text[])`,
    [pairs.map((p) => p[0]), pairs.map((p) => p[1])])
  const { rows: mapN } = await c.query(`select count(*)::int n from _img_map`)
  console.log(`  _img_map ${mapN[0].n}건`)

  const before = await snapshot()

  await c.query('begin')

  // 2) 단일 텍스트 컬럼
  let single = 0
  for (const { table_name: t, column_name: col, data_type: dt } of cols) {
    if (dt === 'ARRAY') continue
    const r = await c.query(
      `update public."${t}" x set "${col}" = m.new from _img_map m where m.old = x."${col}"`)
    if (r.rowCount) { console.log(`    ${t}.${col}: ${r.rowCount}행`); single += r.rowCount }
  }

  // 3) 배열 컬럼 — 순서 보존, 빈 배열은 건드리지 않는다
  let arr = 0
  for (const { table_name: t, column_name: col, data_type: dt } of cols) {
    if (dt !== 'ARRAY') continue
    let r
    try {
      r = await c.query(`
        update public."${t}" x set "${col}" = (
          select array_agg(coalesce(m.new, u.url) order by u.ord)
          from unnest(x."${col}") with ordinality as u(url, ord)
          left join _img_map m on m.old = u.url
        )
        where x."${col}" is not null and cardinality(x."${col}") > 0
          -- Storage URL이 하나도 없는 배열(related_treatments 등)은 건드리지 않는다
          and exists (select 1 from unnest(x."${col}") e where e like '%' || $1 || '%')`,
        [PUBLIC_PREFIX])
    } catch (e) {
      if (/operator does not exist|cannot be matched|function unnest/i.test(e.message)) continue
      throw e
    }
    if (r.rowCount) { console.log(`    ${t}.${col}: ${r.rowCount}행 (배열)`); arr += r.rowCount }
  }
  console.log(`  단일 ${single}행 / 배열 ${arr}행 갱신`)

  const after = await snapshot()

  // ── 커밋 전 검증 ────────────────────────────────────────────
  const map = new Map(pairs)
  const problems = []

  // (a) Storage URL 중 webp가 아닌 것이 남았는가 (로컬 /images 경로는 제외)
  let remaining = 0
  for (const t of TABLES) {
    for (const row of after[t]) {
      for (const [k, v] of Object.entries(row)) {
        if (k === '__pk') continue
        const vals = Array.isArray(v) ? v : [v]
        for (const val of vals) {
          if (isStorage(val) && !/\.webp$/i.test(val.split('?')[0])) {
            remaining++
            if (remaining <= 10) problems.push(`잔여 비-webp: ${t}.${k} ${val}`)
          }
        }
      }
    }
  }

  // (b) 배열 길이 보존 + 원소 순서 보존
  for (const t of TABLES) {
    const bMap = new Map(before[t].map((r) => [String(r.__pk), r]))
    for (const aRow of after[t]) {
      const bRow = bMap.get(String(aRow.__pk))
      if (!bRow) { problems.push(`행 사라짐: ${t} pk=${aRow.__pk}`); continue }
      for (const [k, av] of Object.entries(aRow)) {
        if (k === '__pk') continue
        const bv = bRow[k]
        if (Array.isArray(bv) || Array.isArray(av)) {
          const b = bv ?? null, a = av ?? null
          if ((b === null) !== (a === null)) { problems.push(`NULL 변화: ${t}.${k} pk=${aRow.__pk} ${JSON.stringify(b)} → ${JSON.stringify(a)}`); continue }
          if (b === null) continue
          if (b.length !== a.length) { problems.push(`배열 길이 변화: ${t}.${k} pk=${aRow.__pk} ${b.length} → ${a.length}`); continue }
          for (let i = 0; i < b.length; i++) {
            const expect = map.get(b[i]) ?? b[i]
            if (a[i] !== expect) problems.push(`배열 순서/값 불일치: ${t}.${k} pk=${aRow.__pk} [${i}] 기대 ${expect} 실제 ${a[i]}`)
          }
        } else {
          const expect = map.get(bv) ?? bv
          if (av !== expect) problems.push(`값 불일치: ${t}.${k} pk=${aRow.__pk} 기대 ${expect} 실제 ${av}`)
        }
      }
    }
  }

  // (c) Storage URL 총 건수 보존
  const countStorage = (snap) => {
    let n = 0
    for (const t of TABLES) for (const row of snap[t]) for (const [k, v] of Object.entries(row)) {
      if (k === '__pk') continue
      for (const val of (Array.isArray(v) ? v : [v])) if (isStorage(val)) n++
    }
    return n
  }
  const bN = countStorage(before), aN = countStorage(after)
  if (bN !== aN) problems.push(`Storage URL 건수 변화: ${bN} → ${aN}`)

  console.log(`\n검증`)
  console.log(`  Storage URL 건수      ${bN} → ${aN}`)
  console.log(`  잔여 비-webp URL      ${remaining}`)
  console.log(`  배열/값 이상          ${problems.filter((p) => !p.startsWith('잔여')).length}`)

  if (problems.length || remaining > 0) {
    await c.query('rollback')
    console.error(`\n❌ 검증 실패 — 롤백함. 문제 ${problems.length}건 (상위 15건):`)
    for (const p of problems.slice(0, 15)) console.error('   ' + p)
    process.exit(1)
  }

  if (!COMMIT) {
    await c.query('rollback')
    console.log('\n✅ 검증 전부 통과 — 하지만 --commit 없이 실행해 롤백했다(드라이런).')
    console.log('   실제 반영: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/05-dburl.mjs --commit')
  } else {
    await c.query('commit')
    console.log('\n✅ 검증 전부 통과 — 커밋 완료')
  }
} catch (e) {
  try { await c.query('rollback') } catch { /* 이미 종료됨 */ }
  throw e
} finally {
  await c.end()
}
