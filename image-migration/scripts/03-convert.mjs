// STEP 3 — 변환. backup/ 의 참조 이미지를 규격표대로 dist/ 에 WebP로 만든다.
// 고아 파일은 변환하지 않는다(7단계에서 삭제).
// 실행: node scripts/03-convert.mjs        ← 네트워크를 쓰지 않으므로 TLS env 불필요
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { require_, mb } from './lib.mjs'

const sharp = require_('sharp')
const plan = JSON.parse(await readFile('roles.json', 'utf8')).plan

// WebP는 한 변이 16383px를 넘으면 인코딩이 실패한다.
// 세로로 긴 이벤트 상세 이미지(최대 1920x20322)가 여기 걸린다.
// height 상한 + fit:'inside' 로 비율을 유지한 채 한계 안으로 넣는다.
// 한계에 걸리지 않는 이미지에는 아무 영향이 없다.
const WEBP_MAX = 16383

const webpPath = (p) => p.replace(/\.[^./]+$/, '.webp')

const results = []
const failed = []
for (const [i, item] of plan.entries()) {
  const src = join('backup', item.path)
  const buf = await readFile(src)
  const meta = await sharp(buf).metadata()

  let out
  try {
    out = await sharp(buf)
      .rotate()                                            // EXIF 회전 반영 (필수)
      .resize({
        width: item.width,
        height: WEBP_MAX,
        fit: 'inside',                                     // 비율 유지, 상자 안에 맞춘다
        withoutEnlargement: true,                          // 작은 원본은 늘리지 않음
      })
      .webp({ quality: item.quality, effort: 6 })
      .toBuffer()
  } catch (e) {
    failed.push({ path: item.path, size: `${meta.width}x${meta.height}`, error: e.message })
    continue
  }

  const dest = join('dist', webpPath(item.path))
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, out)

  const outMeta = await sharp(out).metadata()
  results.push({
    path: item.path,
    newPath: webpPath(item.path),
    roles: item.roles,
    spec: `${item.width}px q${item.quality}`,
    srcBytes: buf.length,
    outBytes: out.length,
    reduction: 1 - out.length / buf.length,
    srcSize: `${meta.width}x${meta.height}`,
    outSize: `${outMeta.width}x${outMeta.height}`,
    hadExifOrientation: (meta.orientation ?? 1) !== 1,
    urls: item.urls,
  })
  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${plan.length} ...`)
}

const srcTotal = results.reduce((s, r) => s + r.srcBytes, 0)
const outTotal = results.reduce((s, r) => s + r.outBytes, 0)
const overall = 1 - outTotal / srcTotal

console.log(`\n원본  ${mb(srcTotal)} MB (${results.length}개)`)
console.log(`변환  ${mb(outTotal)} MB`)
console.log(`감소율 ${(overall * 100).toFixed(1)}%   평균 ${(outTotal / results.length / 1024).toFixed(0)} KB/장`)

console.log('\n규격별')
const bySpec = new Map()
for (const r of results) {
  const g = bySpec.get(r.spec) ?? { n: 0, src: 0, out: 0 }
  g.n++; g.src += r.srcBytes; g.out += r.outBytes
  bySpec.set(r.spec, g)
}
for (const [k, g] of [...bySpec].sort()) {
  console.log(`  ${k.padEnd(12)}${String(g.n).padStart(4)}개  ${mb(g.src).padStart(7)} → ${mb(g.out).padStart(6)} MB  (${((1 - g.out / g.src) * 100).toFixed(1)}% 감소, 평균 ${(g.out / g.n / 1024).toFixed(0)}KB)`)
}

const exif = results.filter((r) => r.hadExifOrientation)
console.log(`\nEXIF 회전이 있던 파일: ${exif.length}개 (.rotate() 로 반영됨)`)

const low = results.filter((r) => r.reduction < 0.4)
if (low.length) {
  console.log(`\n⚠️ 감소율 40% 미만 ${low.length}개 — 개별 판단 필요:`)
  for (const r of low.sort((a, b) => a.reduction - b.reduction)) {
    console.log(`  ${(r.reduction * 100).toFixed(1).padStart(6)}%  ${(r.srcBytes / 1024).toFixed(0).padStart(5)}KB → ${(r.outBytes / 1024).toFixed(0).padStart(5)}KB  ${r.srcSize}→${r.outSize}  ${r.path}`)
  }
}

const bigger = results.filter((r) => r.outBytes >= r.srcBytes)
if (bigger.length) console.log(`\n⚠️ 변환 후 더 커진 파일 ${bigger.length}개: ${bigger.map((r) => r.path).join(', ')}`)

// 5단계 DB 교체용 매핑 (old URL → new URL)
const rows = [['old', 'new']]
for (const r of results) {
  for (const u of r.urls) rows.push([u, webpPath(u)])
}
const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
await writeFile('imgmap.csv', csv + '\n')
await writeFile('convert-report.json', JSON.stringify({ generatedAt: new Date().toISOString(), overall, srcTotal, outTotal, results }, null, 2))
console.log(`\nimgmap.csv (${rows.length - 1}건), convert-report.json 기록 완료`)

if (failed.length) {
  console.error(`\n❌ 변환 실패 ${failed.length}개:`)
  for (const f of failed) console.error(`   ${f.path} (${f.size}): ${f.error}`)
  process.exit(1)
}
if (results.length !== plan.length) {
  console.error(`\n❌ 변환 수 불일치: 계획 ${plan.length} vs 결과 ${results.length}`)
  process.exit(1)
}
if (overall < 0.8) {
  console.error(`\n❌ 전체 감소율 ${(overall * 100).toFixed(1)}% < 80% — 규격을 재검토할 것`)
  process.exit(1)
}
console.log(`✅ 검증 통과 — ${results.length}개 전량 변환, 전체 감소율 80% 이상`)
