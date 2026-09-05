// 정적 이미지 다이어트 — 재실행 가능.
// JPG는 같은 경로에 축소본을 덮어쓰고(참조 경로 유지), PNG는 WebP 형제 파일을 만든다.
// 대상: CSS background나 <img>로 원본이 그대로 나가는 사진(next/image 최적화를 타지 않는 것들).
// 사용: node scripts/optimize-static-images.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

const JPEG_IN_PLACE = [
  { file: 'aptos/presentation-mips.jpg', maxWidth: 1200 },
  { file: 'aptos/presentation.jpg', maxWidth: 1200 },
  { file: 'aptos/certification-ceremony.jpg', maxWidth: 900 },
  { file: 'hero/hero-1.jpg', maxWidth: 1920 },
];

// 시그니처 카드 일러스트 — PNG 1MB → WebP
const PNG_TO_WEBP_DIRS = ['signature'];

const kb = (p) => Math.round(fs.statSync(p).size / 1024);

// Windows에서 sharp가 입력 파일 핸들을 잠깐 붙들고 있어 같은 경로에 바로 쓰면 EBUSY/UNKNOWN이 난다.
// → 파일을 먼저 버퍼로 읽고(핸들 없음) 결과를 쓴다.
for (const job of JPEG_IN_PLACE) {
  const abs = path.join(IMAGES, job.file);
  const input = fs.readFileSync(abs);
  const meta = await sharp(input).metadata();
  if ((meta.width ?? 0) <= job.maxWidth && kb(abs) < 400) {
    console.log(`skip ${job.file} (${meta.width}px, ${kb(abs)}KB)`);
    continue;
  }
  const before = kb(abs);
  const buf = await sharp(input)
    .rotate()
    .resize({ width: job.maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(abs, buf);
  console.log(`${job.file}: ${before}KB → ${kb(abs)}KB`);
}

for (const dir of PNG_TO_WEBP_DIRS) {
  const abs = path.join(IMAGES, dir);
  for (const name of fs.readdirSync(abs).filter((n) => n.toLowerCase().endsWith('.png'))) {
    const src = path.join(abs, name);
    const out = src.replace(/\.png$/i, '.webp');
    const buf = await sharp(fs.readFileSync(src))
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    fs.writeFileSync(out, buf);
    console.log(`${dir}/${name}: ${kb(src)}KB → ${path.basename(out)} ${kb(out)}KB`);
  }
}
