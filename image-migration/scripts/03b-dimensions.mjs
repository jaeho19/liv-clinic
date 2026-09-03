// STEP 3 보조 — 원본 치수 조사. WebP는 한 변 16383px 제한이 있다.
// 실행: node scripts/03b-dimensions.mjs
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { require_ } from './lib.mjs'

const sharp = require_('sharp')
const WEBP_MAX = 16383
const plan = JSON.parse(await readFile('roles.json', 'utf8')).plan

const rows = []
for (const item of plan) {
  const buf = await readFile(join('backup', item.path))
  const m = await sharp(buf).metadata()
  // .rotate() 후 기준: EXIF 90/270도면 가로세로가 바뀐다
  const swap = [5, 6, 7, 8].includes(m.orientation ?? 1)
  const w = swap ? m.height : m.width
  const h = swap ? m.width : m.height
  const scale = Math.min(1, item.width / w)          // withoutEnlargement
  rows.push({ path: item.path, w, h, ratio: h / w, outW: Math.round(w * scale), outH: Math.round(h * scale), target: item.width })
}

const over = rows.filter((r) => r.outH > WEBP_MAX || r.outW > WEBP_MAX)
console.log(`전체 ${rows.length}개 중 WebP 한계(${WEBP_MAX}px) 초과 ${over.length}개\n`)
for (const r of over.sort((a, b) => b.outH - a.outH)) {
  console.log(`  ${String(r.w).padStart(5)}x${String(r.h).padStart(6)}  (세로/가로 ${r.ratio.toFixed(1)}배)  → ${r.outW}x${r.outH}  ${r.path}`)
}

console.log('\n세로로 긴 상위 15개 (한계 이내 포함)')
for (const r of [...rows].sort((a, b) => b.ratio - a.ratio).slice(0, 15)) {
  const flag = r.outH > WEBP_MAX ? ' ❌' : ''
  console.log(`  ${String(r.w).padStart(5)}x${String(r.h).padStart(6)}  비율 ${r.ratio.toFixed(1)}  → ${r.outW}x${r.outH}${flag}  ${r.path}`)
}

const tall = rows.filter((r) => r.ratio > 5)
console.log(`\n세로/가로 5배 초과(긴 상세 이미지): ${tall.length}개`)
