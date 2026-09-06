// 언어별 OG 이미지 생성(P1-6): public/images/og/og-{en,ja,zh,zh-TW}.jpg 1200×630
// 실행: node scripts/og/build-og-images.mjs   (liv-clinic 폴더에서)
// Windows: sharp가 입력 파일 핸들을 잠깐 붙들므로 입력은 버퍼로 읽는다.
// CJK 글자가 네모(tofu)로 나오면 scripts/og/og-template.html + Playwright 스크린샷 대안을 쓴다(계획 Task 10 Step 3).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'public', 'images', 'og');
const W = 1200;
const H = 630;

const COPY = {
  en: {
    title: 'LIV Plastic Surgery',
    sub: 'Non-surgical anti-aging · Sinsa Station, Seoul · English support',
    font: "'Segoe UI', Arial, sans-serif",
  },
  ja: {
    title: 'LIV美容クリニック',
    sub: 'ソウル新沙・カロスキルの美容皮膚科 · 日本語対応',
    font: "'Yu Gothic UI', 'Yu Gothic', 'Meiryo', sans-serif",
  },
  zh: {
    title: 'LIV整形外科',
    sub: '首尔新沙站 非手术抗衰老 · 中文咨询',
    font: "'Microsoft YaHei', 'SimHei', sans-serif",
  },
  'zh-TW': {
    title: 'LIV整形外科',
    sub: '首爾新沙站 非手術抗老 · 中文諮詢',
    font: "'Microsoft JhengHei', 'PMingLiU', sans-serif",
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

fs.mkdirSync(OUT, { recursive: true });
const hero = fs.readFileSync(path.join(ROOT, 'public', 'images', 'hero', 'hero-1.jpg'));
// 로고(206×48, 어두운 글자)는 어두운 배경 위에서 안 보이므로 흰색으로 반전한다
const logo = await sharp(fs.readFileSync(path.join(ROOT, 'public', 'images', 'logo.png')))
  .resize({ width: 240 })
  .negate({ alpha: false })
  .png()
  .toBuffer();
const base = await sharp(hero).resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();

for (const [locale, c] of Object.entries(COPY)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000000" stop-opacity="0.18"/>
        <stop offset="0.55" stop-color="#2b1d18" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#2b1d18" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="80" y="462" fill="#ffffff" font-family="${c.font}" font-size="64" font-weight="700">${esc(c.title)}</text>
    <text x="80" y="522" fill="#f3e9e4" font-family="${c.font}" font-size="28">${esc(c.sub)}</text>
    <text x="80" y="574" fill="#d9c6bd" font-family="'Segoe UI', Arial, sans-serif" font-size="22" letter-spacing="2">liv-clinic.net</text>
  </svg>`;
  const out = path.join(OUT, `og-${locale}.jpg`);
  await sharp(base)
    .composite([
      { input: Buffer.from(svg) },
      { input: logo, top: 64, left: 80 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log(path.relative(ROOT, out), fs.statSync(out).size, 'bytes');
}
