// STEP 3 검증 — 변환 품질 육안 확인용 대조 시트.
// 감소율 최고/최저 및 규격별 대표 이미지를 원본 옆에 나란히 붙인다.
// 실행: node scripts/03c-contact-sheet.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { require_ } from './lib.mjs'

const sharp = require_('sharp')
const rep = JSON.parse(await readFile('convert-report.json', 'utf8')).results

// 규격별 대표 1개 + 감소율 최고/최저
const picks = new Map()
for (const spec of new Set(rep.map((r) => r.spec))) {
  const g = rep.filter((r) => r.spec === spec)
  picks.set(g[Math.floor(g.length / 2)].path, `${spec} 대표`)
}
const sorted = [...rep].sort((a, b) => a.reduction - b.reduction)
picks.set(sorted[0].path, `감소율 최저 ${(sorted[0].reduction * 100).toFixed(0)}%`)
picks.set(sorted.at(-1).path, `감소율 최고 ${(sorted.at(-1).reduction * 100).toFixed(0)}%`)

const CELL = 300
const rows = []
for (const [path, label] of picks) {
  const r = rep.find((x) => x.path === path)
  // 원본과 변환본을 같은 크기로 맞춰 나란히 (위쪽 일부만 크롭해서 디테일이 보이게)
  const mk = async (buf) => sharp(buf).rotate()
    .resize({ width: CELL, height: CELL, fit: 'cover', position: 'top' })
    .png().toBuffer()
  const a = await mk(await readFile(join('backup', path)))
  const b = await mk(await readFile(join('dist', r.newPath)))
  const pair = await sharp({ create: { width: CELL * 2 + 8, height: CELL, channels: 3, background: '#fff' } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: CELL + 8, top: 0 }])
    .png().toBuffer()
  rows.push({ pair, label, r })
}

const W = CELL * 2 + 8
const H = rows.length * (CELL + 26)
const svgLabel = (text) =>
  Buffer.from(`<svg width="${W}" height="26"><rect width="${W}" height="26" fill="#111"/>` +
    `<text x="6" y="18" font-family="sans-serif" font-size="13" fill="#fff">${text}</text></svg>`)

const composites = []
for (const [i, row] of rows.entries()) {
  const top = i * (CELL + 26)
  const kb = (n) => (n / 1024).toFixed(0) + 'KB'
  composites.push({
    input: svgLabel(`${row.label} · ${row.r.path} · 원본 ${kb(row.r.srcBytes)} ${row.r.srcSize}  →  변환 ${kb(row.r.outBytes)} ${row.r.outSize}`),
    left: 0, top,
  })
  composites.push({ input: row.pair, left: 0, top: top + 26 })
}

const sheet = await sharp({ create: { width: W, height: H, channels: 3, background: '#fff' } })
  .composite(composites).png().toBuffer()
await writeFile('quality-check.png', sheet)
console.log(`quality-check.png 생성 — ${rows.length}쌍 (왼쪽 원본 / 오른쪽 변환, 상단 크롭)`)
