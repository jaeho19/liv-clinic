#!/usr/bin/env node
/**
 * 칼럼·가이드 대표 사진 만들기.
 *
 *   node scripts/build-guide-covers.mjs            # 전부
 *   node scripts/build-guide-covers.mjs double-chin-cover   # 이름을 준 것만
 *
 * 대표 사진은 "글의 시술·장비·부위가 바로 보이는 사진"이어야 한다(README "이미지").
 * 그래서 홈페이지에 이미 있는 사진을 자르거나 나란히 놓아서 만든다 — 장비 모양은 손대지 않는다.
 * 결과: public/images/guides/<이름>.webp (1600×900) + <이름>-share.jpg (1200×675, og:image 짝).
 *
 * PC 화면에서는 대표 사진이 21:9 띠로 잘린다(위아래 12%씩). 중요한 것은 가운데 686px 안에 둔다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(ROOT, 'public', 'images');
const OUT = path.join(IMG, 'guides');
const SRC = path.join(ROOT, 'content', 'guides', '_figures', 'sources');
const W = 1600;
const H = 900;

/** 장비 사진(누끼 PNG) 위치 — 장비 소개 페이지(/about/equipment)가 쓰는 것과 같은 파일 */
const DEVICE = (name) => path.join(IMG, 'equipment', 'processed', `equipment_${name}.png`);

const COVERS = {
  // 실리프팅: 압토스 연수 시술 사진(압토스 페이지 맨 위 사진). 세로 사진(EXIF 회전)에서 가로 띠를 잘라 쓴다.
  'thread-lift-cover': {
    kind: 'crop',
    file: path.join(IMG, 'aptos', 'procedure-main.jpg'),
    region: { left: 0, top: 1340, width: 3024, height: 1701 },
  },
  // 스킨부스터: Higgsfield(gpt_image_2_6)로 만든 원본을 _figures/sources 에 보관한다.
  'skin-booster-cover': {
    kind: 'crop',
    file: path.join(SRC, 'skin-booster-cover.webp'),
  },
  // 비교 글: 장비 두 대를 같은 배경에 나란히. crop 은 누끼에 남은 얼룩을 잘라내는 범위.
  'density-thermage-cover': {
    kind: 'pair',
    left: { file: DEVICE('density') },
    right: { file: DEVICE('thermage'), crop: { left: 394, top: 120, width: 194, height: 790 } },
  },
  'double-chin-cover': {
    kind: 'pair',
    left: { file: DEVICE('onda') },
    right: { file: DEVICE('inmode') },
  },
};

/* ── 장비 두 대 나란히 ─────────────────────────────────────────── */
const FLOOR_Y = 778; // 장비 바닥 선. 21:9 띠의 아래 끝(793px)보다 위
const DEVICE_H = 610; // 장비 높이. 21:9 띠(107~793px) 안에 들어온다

const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4eee9"/><stop offset="1" stop-color="#eadfd7"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d6cc"/><stop offset="1" stop-color="#eee5de"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  <rect y="${FLOOR_Y - 46}" width="${W}" height="${H - FLOOR_Y + 46}" fill="url(#floor)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
</svg>`);

async function device({ file, crop }) {
  let img = sharp(file);
  if (crop) img = sharp(await img.extract(crop).png().toBuffer());
  const trimmed = await img.trim({ threshold: 8 }).png().toBuffer();
  // 원본이 작고 무른 편이라 가볍게 선명도만 올린다(모양을 새로 그리는 업스케일은 쓰지 않는다)
  return sharp(trimmed).resize({ height: DEVICE_H }).sharpen({ sigma: 0.7 }).png().toBuffer({ resolveWithObject: true });
}

function floorShadow(deviceWidth) {
  const w = Math.round(deviceWidth * 1.25);
  const h = 46;
  const pad = 80;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad}" height="${h + pad}"><ellipse cx="${(w + pad) / 2}" cy="${(h + pad) / 2}" rx="${w / 2}" ry="${h / 2}" fill="#5b4338" fill-opacity="0.34"/></svg>`;
  return sharp(Buffer.from(svg)).blur(16).png().toBuffer({ resolveWithObject: true });
}

async function buildPair({ left, right }) {
  const layers = [];
  for (const [spec, cx] of [
    [left, W * 0.31],
    [right, W * 0.69],
  ]) {
    const d = await device(spec);
    const s = await floorShadow(d.info.width);
    layers.push({ input: s.data, left: Math.round(cx - s.info.width / 2), top: Math.round(FLOOR_Y - s.info.height / 2 - 4) });
    layers.push({ input: d.data, left: Math.round(cx - d.info.width / 2), top: FLOOR_Y - d.info.height });
  }
  return sharp(backdrop).composite(layers).png().toBuffer();
}

/* ── 사진에서 잘라내기 ─────────────────────────────────────────── */
async function buildCrop({ file, region }) {
  let img = sharp(file).rotate(); // EXIF 방향 반영
  if (region) img = img.extract(region);
  return img.resize(W, H, { fit: 'cover' }).png().toBuffer();
}

/* ── 실행 ─────────────────────────────────────────────────────── */
const only = process.argv.slice(2);
const names = only.length ? only : Object.keys(COVERS);
for (const name of names) {
  const spec = COVERS[name];
  if (!spec) {
    console.error(`모르는 이름: ${name} (가능: ${Object.keys(COVERS).join(', ')})`);
    process.exit(1);
  }
  const master = spec.kind === 'pair' ? await buildPair(spec) : await buildCrop(spec);
  // 움직이는 버전을 만들 때 시작 장면으로 올릴 무손실 원본이 필요하면: GUIDE_COVER_MASTER_DIR=<폴더>
  if (process.env.GUIDE_COVER_MASTER_DIR) fs.writeFileSync(path.join(process.env.GUIDE_COVER_MASTER_DIR, `${name}.png`), master);
  const webp = await sharp(master).webp({ quality: 86 }).toFile(path.join(OUT, `${name}.webp`));
  const share = await sharp(master).resize(1200, 675).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, `${name}-share.jpg`));
  console.log(`${name}: webp ${Math.round(webp.size / 1024)}KB · share ${Math.round(share.size / 1024)}KB`);
}
