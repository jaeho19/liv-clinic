// STEP 1 — 전량 백업. 되돌릴 수 있는 지점을 먼저 만든다.
// 실행: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/01-backup.mjs
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { db, listAll, pool, mb, BUCKETS } from './lib.mjs'

const client = db()
const ROOT = 'backup'

const files = []
for (const bucket of BUCKETS) {
  const list = await listAll(client, bucket)
  for (const f of list) files.push({ bucket, ...f })
  console.log(`  목록 ${bucket}: ${list.length}개 / ${mb(list.reduce((s, f) => s + f.size, 0))} MB`)
}
console.log(`목록 합계: ${files.length}개 / ${mb(files.reduce((s, f) => s + f.size, 0))} MB\n`)

let done = 0
const failed = []
const manifest = await pool(files, 6, async (f) => {
  const dest = join(ROOT, f.bucket, f.path)
  // 이미 받은 파일은 건너뛴다 (중단 후 재실행 대비)
  try {
    const st = await stat(dest)
    if (st.size === f.size && f.size > 0) {
      done++
      return { ...f, bytes: st.size, skipped: true }
    }
  } catch { /* 없으면 새로 받는다 */ }

  const { data, error } = await client.storage.from(f.bucket).download(f.path)
  if (error) { failed.push(`${f.bucket}/${f.path}: ${error.message}`); return null }
  const buf = Buffer.from(await data.arrayBuffer())
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  done++
  if (done % 25 === 0) console.log(`  ${done}/${files.length} ...`)
  return { ...f, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex') }
})

const ok = manifest.filter(Boolean)
await writeFile(`${ROOT}/manifest.json`, JSON.stringify(ok, null, 2))

const totalBytes = ok.reduce((s, f) => s + f.bytes, 0)
console.log(`\n백업 완료: ${ok.length} 파일 / ${mb(totalBytes)} MB`)

// 검증 — 목록 크기와 실제 내려받은 바이트가 일치해야 한다
const mismatch = ok.filter((f) => f.bytes !== f.size)
if (failed.length) console.error(`\n다운로드 실패 ${failed.length}건:\n  ` + failed.join('\n  '))
if (mismatch.length) console.error(`\n크기 불일치 ${mismatch.length}건:\n  ` +
  mismatch.map((f) => `${f.bucket}/${f.path} 목록 ${f.size} vs 실제 ${f.bytes}`).join('\n  '))
if (failed.length || mismatch.length || ok.length !== files.length) {
  console.error('\n❌ 검증 실패 — 다음 단계로 넘어가지 말 것')
  process.exit(1)
}
console.log('✅ 검증 통과 — 목록/실파일 개수·바이트 일치')
