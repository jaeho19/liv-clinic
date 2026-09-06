#!/usr/bin/env node
/**
 * docs/05-handoff/p1-review-checklist.md 생성 — 가이드별 [검수 필요] 표식과 가격·시간 문장 위치(파일:행)를 표로.
 * 실행: node scripts/guide-review-checklist.mjs   (liv-clinic 폴더에서)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content', 'guides');
const OUT = path.join(ROOT, '..', 'docs', '05-handoff', 'p1-review-checklist.md');
const MARK = /\[검수 필요[^\]]*\]/g;
const CLAIM = /(KRW|₩|万円|ウォン|韓元|韩元|分钟|分鐘|minutes?|min\b|\d+\s*分|時間|小时|小時|days?|週|周|weeks?|months?|ヶ月|个月|個月)/;

const rows = [];
for (const locale of ['en', 'ja', 'zh', 'zh-TW']) {
  const dir = path.join(SRC, locale);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !x.startsWith('_')).sort()) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/);
    const status = (lines.find((l) => l.startsWith('status:')) ?? '').replace('status:', '').trim();
    const title = (lines.find((l) => l.startsWith('title:')) ?? '').replace('title:', '').trim().replace(/^"|"$/g, '');
    const marks = [];
    const claims = [];
    lines.forEach((l, i) => {
      const m = l.match(MARK);
      if (m) marks.push(`${i + 1}: ${m.join(' ')}`);
      else if (CLAIM.test(l) && !/^\|\s*-/.test(l) && !l.startsWith('description:')) claims.push(String(i + 1));
    });
    rows.push({
      file: `liv-clinic/content/guides/${locale}/${f}`,
      url: `/${locale}/guides/${f.replace(/\.md$/, '')}`,
      title,
      status,
      marks,
      claims,
    });
  }
}

const total = rows.reduce((n, r) => n + r.marks.length, 0);
const md = [
  '# P1 가이드 검수 요청 목록 (자동 생성 — `node scripts/guide-review-checklist.mjs`)',
  '',
  `생성 ${new Date().toISOString().slice(0, 10)}. 초안(draft)은 배포 후 아래 미리보기 URL로 직접 열어볼 수 있다(검색엔진에는 노출되지 않는다).`,
  '',
  '**검수 방법**: (1) 미리보기 URL을 열어 읽는다. 초안에서는 `[검수 필요: …]` 표식이 노란색으로 보인다. (2) 표식 문장은 확인된 사실로 고쳐 쓰거나 문장째 지운다(파일을 직접 편집하거나 고칠 내용을 알려주면 반영). (3) 가격·시간 문장 행은 `_facts.md`와 대조된 값이지만 한 번 더 훑어본다. (4) 검수가 끝난 편은 파일 frontmatter의 `status: draft`를 `status: published`로 바꾼다 — 표식이 남아 있으면 빌드가 막는다.',
  '',
  '| 파일 | 미리보기 URL | 상태 | [검수 필요] 표식 (행: 내용) | 가격·시간 문장 행 |',
  '|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.file}<br>${r.title} | https://liv-clinic.net${r.url} | ${r.status} | ${r.marks.length ? r.marks.join('<br>') : '없음'} | ${r.claims.join(', ') || '-'} |`,
  ),
  '',
  `합계: 파일 ${rows.length}개, 표식 ${total}건`,
  '',
  '표식이 가장 많이 묻는 것: 시술 후 비행 가능 시점, 붓기·붉음이 가라앉는 기간, 음주·사우나 제한 — 사이트에 근거가 없어 원장님 확인이 필요한 항목이다. 한 번 답을 주시면 6주제 모두에 같은 값을 반영한다.',
].join('\n');

fs.writeFileSync(OUT, md + '\n', 'utf8');
console.log(`[review-checklist] ${rows.length} files, ${total} markers → ${path.relative(ROOT, OUT)}`);
