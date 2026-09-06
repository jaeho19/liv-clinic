#!/usr/bin/env node
/**
 * content/guides/{locale}/{slug}.md → src/lib/guides/guides.generated.ts (+ guides.index.generated.ts)
 *
 * prebuild에서 실행된다. 검증 실패 = 빌드 실패:
 *   - frontmatter 필수값·enum·날짜 형식
 *   - status: published 인데 [검수 필요] 표식이 남아 있음
 *   - 같은 slug가 로케일마다 다른 category를 가짐
 * `_`로 시작하는 파일(예: _facts.md, _example.md)은 무시한다.
 * 생성물은 커밋한다(concernRules.generated.ts와 같은 이유).
 *
 * ⚠️ 반드시 `tsx`로 실행한다(`.ts`를 동적 import). Netlify는 Node 20이라 타입 스트리핑이 없다.
 * 실행: npm run build:guides   (= tsx scripts/compile-guides.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'content', 'guides');
const OUT = path.join(ROOT, 'src', 'lib', 'guides', 'guides.generated.ts');
const OUT_INDEX = path.join(ROOT, 'src', 'lib', 'guides', 'guides.index.generated.ts');

async function main() {
  const { parseGuide } = await import('../src/lib/guides/markdown.ts');
  const { GUIDE_LOCALES } = await import('../src/lib/guides/types.ts');

  const docs = [];
  const errors = [];
  for (const locale of GUIDE_LOCALES) {
    const dir = path.join(SRC, locale);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort();
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      if (!/^[a-z0-9-]+$/.test(slug)) {
        errors.push(`${locale}/${file}: slug must be lowercase a-z 0-9 and hyphens`);
        continue;
      }
      try {
        const doc = parseGuide(fs.readFileSync(path.join(dir, file), 'utf8'), { locale, slug });
        if (doc.status === 'published' && doc.reviewMarkers > 0) {
          errors.push(`${locale}/${slug}: status is published but ${doc.reviewMarkers} [검수 필요] marker(s) remain`);
        }
        docs.push(doc);
      } catch (e) {
        errors.push(`${locale}/${file}: ${e.message}`);
      }
    }
  }

  const bySlug = new Map();
  for (const d of docs) {
    if (!bySlug.has(d.slug)) bySlug.set(d.slug, []);
    bySlug.get(d.slug).push(d);
  }
  for (const [slug, list] of bySlug) {
    const cats = new Set(list.map((d) => d.category));
    if (cats.size > 1) errors.push(`${slug}: category differs across locales (${[...cats].join(', ')})`);
    const missing = GUIDE_LOCALES.filter((l) => !list.some((d) => d.locale === l));
    if (missing.length) console.warn(`[compile-guides] warn: ${slug} has no ${missing.join(', ')} version`);
  }

  if (errors.length) {
    console.error('[compile-guides] FAILED');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }

  const header = '// 자동 생성 — 직접 수정 금지. 원본: content/guides/{locale}/{slug}.md, 재생성: npm run build:guides\n';
  fs.writeFileSync(
    OUT,
    `${header}import type { GuideDoc } from './types';\n\nexport const GUIDES: readonly GuideDoc[] = ${JSON.stringify(docs, null, 2)};\n`,
    'utf8',
  );
  const index = docs.map(({ locale, slug, status, title, category }) => ({ locale, slug, status, title, category }));
  fs.writeFileSync(
    OUT_INDEX,
    `${header}import type { GuideIndexEntry } from './types';\n\nexport const GUIDE_INDEX: readonly GuideIndexEntry[] = ${JSON.stringify(index, null, 2)};\n`,
    'utf8',
  );
  const published = docs.filter((d) => d.status === 'published').length;
  console.log(
    `[compile-guides] ${docs.length} guide(s) (${published} published, ${docs.length - published} draft) → ${path.relative(ROOT, OUT)}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
