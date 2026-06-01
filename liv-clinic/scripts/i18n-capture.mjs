// Runtime Korean-leak scanner. Design Ref: §6 Test Plan (L3 runtime).
// Fetches each route per locale from the dev server, strips tags, counts Korean (Hangul) chars.
// ASCII-only output (counts) — display-safe.
// Usage: node scripts/i18n-capture.mjs [baseUrl]
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const LOCALES = ['en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'];
const ROUTES = [
  '', '/about', '/about/staff', '/about/equipment', '/about/location',
  '/signature', '/lifting', '/lifting/ulthera', '/antiaging', '/antiaging/filler',
  '/laser', '/medical', '/gallery', '/promotion', '/contact',
];
const HANGUL = /[가-힣]/g;

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    return { status: res.status, body: await res.text() };
  } catch (e) {
    return { status: 0, body: '', err: String(e.name || e) };
  } finally {
    clearTimeout(t);
  }
}

mkdirSync('scripts/_i18n-work', { recursive: true });
const results = {};
const offenders = [];
for (const loc of LOCALES) {
  results[loc] = { total: 0, routes: {} };
  for (const r of ROUTES) {
    const url = `${BASE}/${loc}${r}`;
    const { status, body, err } = await fetchText(url);
    const ko = status === 200 ? (strip(body).match(HANGUL) || []).length : -1;
    results[loc].routes[r || '/'] = { status, ko };
    if (ko > 0) { results[loc].total += ko; offenders.push({ loc, route: r || '/', ko }); }
    process.stdout.write(`${loc}${r || '/'} status=${status} ko=${ko}${err ? ' ' + err : ''}\n`);
  }
}
offenders.sort((a, b) => b.ko - a.ko);
writeFileSync('scripts/_i18n-work/_runtime.json', JSON.stringify({ results, offenders }, null, 2));

process.stdout.write('\n===== SUMMARY =====\n');
for (const loc of LOCALES) {
  const bad = Object.values(results[loc].routes).filter((v) => v.ko > 0).length;
  const non200 = Object.values(results[loc].routes).filter((v) => v.status !== 200).length;
  process.stdout.write(`${loc.padEnd(6)} totalKo=${String(results[loc].total).padStart(5)} pagesWithKo=${bad} non200=${non200}\n`);
}
process.stdout.write(`\nOFFENDERS(${offenders.length}): ${offenders.slice(0, 20).map((o) => `${o.loc}${o.route}=${o.ko}`).join(' ') || 'none'}\n`);
