// 후속 점검 — 이미지 감량 작업이 유지되고 있는지 자동 확인.
// egress 숫자만 대시보드에서 사람이 봐야 하고, 나머지는 전부 여기서 확인된다.
//
// 실행: cd D:\dev\LIV_homepage\image-migration
//       NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/10-followup-check.mjs
import { pg, pool, checkUrl, mb, PUBLIC_PREFIX, CACHE_MAX_AGE } from './lib.mjs'

const TABLES = ['events', 'popups', 'before_after']
const BUCKETS = ['events', 'popups', 'before-after']
const BASELINE = { referenced: 144, servingMB: 9.3, totalFiles: 233, totalMB: 138.3, orphans: 89 }

const fail = []
const warn = []

const c = await pg()

// ── 1) DB가 참조하는 Storage URL 전량 (컬럼 동적 조회 — 배열/다국어 누락 방지) ──
const { rows: cols } = await c.query(`
  select table_name, column_name, data_type from information_schema.columns
  where table_schema='public' and table_name = any($1)
    and (data_type in ('text','character varying') or data_type='ARRAY')`, [TABLES])

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

// ── 2) 스토리지 현황 ──
const { rows: objs } = await c.query(`
  select b.name as bucket, o.name as path,
         coalesce((o.metadata->>'size')::bigint,0) as size,
         o.metadata->>'mimetype' as mime,
         o.metadata->>'cacheControl' as cc,
         o.created_at
  from storage.objects o join storage.buckets b on b.id = o.bucket_id
  where b.name = any($1)`, [BUCKETS])
await c.end()

const all = objs.map((o) => ({ ...o, size: Number(o.size), key: `${o.bucket}/${o.path}` }))
const decode = (s) => { try { return decodeURIComponent(s) } catch { return s } }
const refKeys = new Set(refs.map((r) => decode(r.url.slice(r.url.indexOf(PUBLIC_PREFIX) + PUBLIC_PREFIX.length).split('?')[0])))
const used = all.filter((o) => refKeys.has(o.key))
const orphans = all.filter((o) => !refKeys.has(o.key))

console.log('═'.repeat(62))
console.log('  이미지 감량 후속 점검')
console.log('═'.repeat(62))
console.log(`\n[1] 스토리지 현황`)
console.log(`    전체        ${String(all.length).padStart(4)}개  ${mb(all.reduce((s, o) => s + o.size, 0)).padStart(7)} MB   (기준 ${BASELINE.totalFiles}개 / ${BASELINE.totalMB} MB)`)
console.log(`    DB 참조     ${String(used.length).padStart(4)}개  ${mb(used.reduce((s, o) => s + o.size, 0)).padStart(7)} MB   (기준 ${BASELINE.referenced}개 / ${BASELINE.servingMB} MB)  ← 실 서빙량`)
console.log(`    미참조 고아 ${String(orphans.length).padStart(4)}개  ${mb(orphans.reduce((s, o) => s + o.size, 0)).padStart(7)} MB   (기준 ${BASELINE.orphans}개, 서빙 안 됨)`)

// ── 3) 수정 배포 이후 올라온 파일이 규칙을 지키는가 ──
//
// 기준일이 중요하다. 롤링 N일로 잡으면 보류 중인 고아 89개(수정 이전 원본)가
// "규칙 위반 신규 파일"로 잡히는 오탐이 난다. 파이프라인 수정이 배포된 시점 이후만 본다.
const FIX_DEPLOYED_AT = new Date('2026-09-03T05:02:10Z')   // PR #35 머지 시각
const since = FIX_DEPLOYED_AT
const recent = all.filter((o) => new Date(o.created_at) > since)
const badNew = recent.filter((o) => o.mime !== 'image/webp' || !String(o.cc).includes(`max-age=${CACHE_MAX_AGE}`))
console.log(`\n[2] 파이프라인 수정 배포(${FIX_DEPLOYED_AT.toISOString().slice(0, 10)}) 이후 업로드 ${recent.length}개`)
if (recent.length === 0) {
  console.log('    (신규 업로드 없음 — 파이프라인은 다음 이벤트 등록 때 실증된다)')
  warn.push('배포 이후 신규 업로드가 없어 파이프라인이 실사용으로는 아직 검증되지 않음')
} else if (badNew.length === 0) {
  console.log('    ✅ 전부 image/webp + max-age=31536000 — 파이프라인이 지켜지고 있다')
  const avg = recent.reduce((s, o) => s + o.size, 0) / recent.length / 1024
  console.log(`       평균 ${avg.toFixed(0)}KB/장 (수정 전 평균 1,100KB)`)
} else {
  console.log(`    ❌ 규칙을 어긴 신규 파일 ${badNew.length}개 — 업로드 경로가 우회되고 있다:`)
  for (const o of badNew.slice(0, 10)) {
    console.log(`       ${o.key}  mime=${o.mime}  cc=${o.cc}  ${(o.size / 1024).toFixed(0)}KB`)
  }
  fail.push(`신규 파일 ${badNew.length}개가 webp/장기캐시 규칙을 벗어남`)
}

// temp/ 에 다시 쌓이는지 — 배포 이후 생성분만 본다.
// 기존 temp/ 파일 125개는 정상이다: 참조본 50개(webp로 교체, 경로 유지) + 보류 고아 75개.
const inTemp = all.filter((o) => o.path.startsWith('temp/'))
const newTemp = inTemp.filter((o) => new Date(o.created_at) > since)
console.log(`\n    temp/ 잔존 ${inTemp.length}개 (기존분 — 참조 webp + 보류 고아, 정상)`)
if (newTemp.length) {
  console.log(`    ⚠️ 배포 이후 temp/ 에 생긴 파일 ${newTemp.length}개 — 저장 시 이동이 안 되고 있을 수 있다`)
  for (const o of newTemp.slice(0, 5)) console.log(`       ${o.key}`)
  warn.push(`배포 이후 temp/ 신규 ${newTemp.length}개 — finalize 이동 실패 가능성`)
}

// ── 4) 참조 URL 전수 헬스체크 ──
console.log(`\n[3] DB 참조 URL ${refs.length}건 전수 확인 중...`)
const bad = []
let bytes = 0
await pool(refs, 8, async (r) => {
  const res = await checkUrl(r.url)
  if (!res.ok) bad.push([res.reason, r.where, r.url.slice(-60), res.detail])
  else bytes += res.size
})
if (bad.length === 0) {
  console.log(`    ✅ ${refs.length}건 전부 정상 (image/webp + max-age=${CACHE_MAX_AGE}) · 실 서빙 총량 ${mb(bytes)} MB`)
} else {
  console.log(`    ❌ 문제 ${bad.length}건:`)
  for (const b of bad.slice(0, 15)) console.log(`       ${String(b[0]).padEnd(10)} ${b[1].padEnd(24)} ...${b[2]} ${b[3]}`)
  fail.push(`참조 URL ${bad.length}건이 깨졌거나 형식이 다름`)
}

const nonWebp = refs.filter((r) => !/\.webp$/i.test(r.url.split('?')[0]))
if (nonWebp.length) {
  console.log(`\n    ⚠️ 확장자가 webp가 아닌 참조 ${nonWebp.length}건`)
  for (const r of nonWebp.slice(0, 8)) console.log(`       ${r.where}  ...${r.url.slice(-52)}`)
  warn.push(`비-webp 참조 ${nonWebp.length}건`)
}

// ── 5) 결론 ──
console.log('\n' + '═'.repeat(62))
if (fail.length) {
  console.log('  ❌ 문제 발견 — 아래 항목을 Claude에게 그대로 전달할 것')
  for (const f of fail) console.log('     · ' + f)
} else if (warn.length) {
  console.log('  ⚠️ 치명적이지 않은 항목 있음')
  for (const w of warn) console.log('     · ' + w)
} else {
  console.log('  ✅ 코드/스토리지 쪽은 전부 정상. 남은 건 대시보드의 egress 숫자뿐.')
}
console.log('═'.repeat(62))
console.log('\n다음: Supabase → Organization → Usage → Cached Egress 의')
console.log('      "절대값(GB)" 과 청구주기 시작일을 확인해 Claude에게 알려줄 것.')
console.log('      (퍼센트는 Pro 한도 250GB 기준이라 의미 없음)')

process.exit(fail.length ? 1 : 0)
