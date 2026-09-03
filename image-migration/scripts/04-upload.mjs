// STEP 4 — 업로드. 캐시 헤더를 여기서 잡는다.
// Supabase 기본 cacheControl 은 3600초라 재방문자가 이미지를 매일 다시 받는다.
// 파일명이 타임스탬프 기반이라 같은 URL의 내용이 바뀔 일이 없으므로 1년 캐시가 안전하다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/04-upload.mjs
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db, pool, mb, publicUrl, checkUrl, CACHE_MAX_AGE } from './lib.mjs'

const CACHE = CACHE_MAX_AGE
const client = db()
const results = JSON.parse(await readFile('convert-report.json', 'utf8')).results

const targets = results.map((r) => {
  const i = r.newPath.indexOf('/')
  return { bucket: r.newPath.slice(0, i), path: r.newPath.slice(i + 1), key: r.newPath, bytes: r.outBytes }
})

let done = 0
const failed = []
await pool(targets, 6, async (t) => {
  const buf = await readFile(join('dist', t.key))
  const { error } = await client.storage.from(t.bucket).upload(t.path, buf, {
    contentType: 'image/webp',
    cacheControl: CACHE,
    upsert: true,
  })
  if (error) { failed.push(`${t.key}: ${error.message}`); return }
  done++
  if (done % 25 === 0) console.log(`  ${done}/${targets.length} ...`)
})

console.log(`\n업로드 ${done}/${targets.length}개 / ${mb(targets.reduce((s, t) => s + t.bytes, 0))} MB`)
if (failed.length) {
  console.error(`\n❌ 업로드 실패 ${failed.length}건:\n  ` + failed.join('\n  '))
  process.exit(1)
}

// 검증 — 전 파일 헤더 확인 (content-type: image/webp, cache-control: max-age=31536000)
console.log('\n헤더 전수 검증 중...')
const bad = []
await pool(targets, 8, async (t) => {
  const r = await checkUrl(publicUrl(t.bucket, t.path))
  if (!r.ok) bad.push([t.key, r.reason, r.detail])
  else if (r.size !== t.bytes) bad.push([t.key, 'SIZE', `${r.size} vs ${t.bytes}`])
})

if (bad.length) {
  console.error(`\n❌ 헤더 검증 실패 ${bad.length}건:`)
  for (const b of bad.slice(0, 20)) console.error(`   ${b[0]}  ${b[1]} ${b[2]}`)
  process.exit(1)
}
console.log(`✅ 검증 통과 — ${targets.length}개 전부 content-type: image/webp, cache-control: max-age=${CACHE}`)
