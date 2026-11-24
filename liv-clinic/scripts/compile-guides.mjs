#!/usr/bin/env node
/**
 * content/guides/{locale}/{slug}.md → src/lib/guides/guides.generated.ts (+ guides.index.generated.ts)
 *
 * prebuild에서 실행된다. 검증 실패 = 빌드 실패:
 *   - frontmatter 필수값·enum·날짜 형식
 *   - status: published 인데 [검수 필요] 표식이 남아 있음
 *   - 한국어 칼럼(ko)이 published 인데 reviewer 가 dr-kim 이 아님(원장 감수 전에는 공개하지 않는다)
 *   - 같은 slug가 로케일마다 다른 category를 가짐
 *   - 원고가 가리키는 이미지(cover·본문 그림)가 public/images/guides/ 에 없음
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
  const { parseGuide, publishBlockers } = await import('../src/lib/guides/markdown.ts');
  const { ARTICLE_LOCALES, missingGuideLocales } = await import('../src/lib/guides/types.ts');
  const { guideImagePaths } = await import('../src/lib/guides/images.ts');

  const docs = [];
  const errors = [];
  for (const locale of ARTICLE_LOCALES) {
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
        for (const reason of publishBlockers(doc)) errors.push(`${locale}/${slug}: ${reason}`);
        for (const img of guideImagePaths(doc)) {
          if (!fs.existsSync(path.join(ROOT, 'public', img))) errors.push(`${locale}/${slug}: image file missing — public${img}`);
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
    // 한국어 칼럼만 있는 slug는 번역 대상이 아니다 — 외국인 가이드의 빠진 외국어판만 알린다
    const missing = missingGuideLocales(list.map((d) => d.locale));
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
