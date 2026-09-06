# 외국인 검색 노출 개선 P1(콘텐츠) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **실행 결과 (2026-09-06):** Task 0~14 완료. 브랜치 `feature/foreign-seo-p1`(커밋 24개) → master `6087034` 머지·배포, 프로덕션 확인표 통과, 이벤트 설명 DB 반영 완료. 가이드 24편은 사장님 결정("가장 일반적인 내용으로 반영", 기준표 `content/guides/_review-answers.md`)에 따라 표식 117건을 일반 안내 문장으로 바꾸고 **전부 `published`**(사이트맵 28건). Task 15(사장님 자료: 404 CSV·Bing/Yandex·GA4)만 자료 대기. 보고서 `docs/04-report/features/foreign-seo-p1.report.md`. 실행 중 추가된 것: 허브 `dynamicParams=false`(notFound만으로는 200), 가이드 경로의 푸터 언어 링크·언어 전환기를 존재하는 언어로만 잇는 `localeSwitchPath`, 근거 시트에 의료 Q&A 전체와 레이저 상세(유형별 회수) 추가.

**Goal:** `docs/01-plan/features/foreign-seo-improvement.plan.md` §5 P1(P1-1 가이드 허브, P1-2 시술 페이지 외국인 블록, P1-3 가격 페이지, P1-4 후기, P1-5 이벤트 외국어 설명, P1-6 언어별 OG 이미지)을 사장님 결정(`docs/05-handoff/foreign-seo-p1-user-inputs.md` §E, 2026-09-06)에 맞춰 구현한다. 외국인이 검색하는 질문(가격·소요 시간·예약 방법·일정)에 답하는 페이지를 en·ja·zh·zh-TW 4개 언어로 만들고, 검수 전 초안이 색인되지 않게 하는 안전장치를 함께 넣는다.

**Architecture:** 가이드 본문은 `liv-clinic/content/guides/{locale}/{slug}.md`(Markdown + frontmatter)가 원본이고, `prebuild`의 `tsx scripts/compile-guides.mjs`가 이를 `src/lib/guides/guides.generated.ts`(커밋 대상, 기존 `concernRules.generated.ts` 패턴)로 굽는다. 페이지는 서버 컴포넌트가 생성물을 읽어 렌더하므로 런타임 파일 접근이 없다(Netlify 함수 번들 문제 회피). 번역 JSON에는 키를 추가하지 않는다(11개 파일 정합성 게이트) — 가이드 UI 문구·시술 페이지 외국인 블록·가격 안내는 4개 언어 TS 사전(`src/lib/guides/ui.ts`, `src/lib/treatmentsForeign.ts`, `src/lib/pricingForeign.ts`)으로 둔다. `status: draft` 가이드는 직접 URL로만 열리고 noindex·허브/사이트맵 제외이며, `[검수 필요]` 표식이 남은 채 `published`로 바꾸면 빌드가 실패한다. 후기 직접 등록은 기존 `reviews` 테이블·관리자 API에 POST 하나를 더한다. 이벤트 외국어 설명과 OG 이미지는 문서·정적 파일로 만들고 DB 반영은 사장님 확인 후 한다.

**Tech Stack:** Next.js 16.1.1(App Router, Turbopack), next-intl 4.6, React 19, Tailwind 4, Supabase(anon/service-role), zod, sharp 0.34, tsx(prebuild), Vitest 4, Netlify. 새 npm 패키지는 추가하지 않는다(프록시 뒤라 `npm install` 불가 — Markdown 파서는 직접 작성).

## Global Constraints

- 모든 npm 명령은 `D:\dev\LIV_homepage\liv-clinic`에서 실행한다. 임시 스크립트·스크린샷은 상위 `D:\dev\LIV_homepage\`에 둔다.
- TLS 프록시: 빌드 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, Node fetch·pg·npx `NODE_TLS_REJECT_UNAUTHORIZED=0 npm_config_strict_ssl=false`, curl `-k`. DB 직접 접근은 `liv-clinic/.env.local`의 `DATABASE_URL` + `file:///D:/dev/LIV_homepage/liv-clinic/node_modules/pg/lib/index.js` import + `ssl: { rejectUnauthorized: false }`.
- **번역 JSON(`src/messages/*.json`)에 키를 추가·삭제하지 않는다.** 값 수정은 `scripts/_i18n-work/apply-value-edits.mjs`(바이트 보존, 1회 일치 검증)로만 하고 `git diff --numstat`으로 변경 줄 수를 확인한다. `prebuild`가 `verify:i18n`을 실행한다.
- **새 페이지·문구는 en·ja·zh·zh-TW 4개 로케일만** 만든다(C1 결정). 다른 7개 로케일(ko 포함)에서 `/guides`는 404다. ru·vi·th·mn·fr·ar 페이지는 현행 유지(C6; fr·ar는 미언급이라 유지, 보고서에서 확인 요청).
- **사이트에 없는 의료적 수치(회복 기간·비행 가능 시점·통증 정도 등)는 만들지 않는다.** 필요하면 본문에 `[검수 필요: 무엇이 확인돼야 하는지]`를 남긴다. `published` 가이드에 이 표식이 남아 있으면 `compile-guides`가 빌드를 실패시킨다.
- **"유치기관"(외국인환자 유치 의료기관) 표현을 쓰지 않는다**(B5 미확인). 후기 등록 폼에 **출처·동의 항목을 넣지 않는다**(2026-09-06 지시).
- 의료광고 표현 금지: 최상급·보장·비교우위·할인 강조·환자 유인 문구. 가이드는 정보 제공형("~할 수 있습니다", 가격은 "부터"·"1회 기준·VAT 별도"). 가격은 `/pricing`(`pricingGuide` 네임스페이스·`src/lib/pricing.ts`)의 공개값만 인용하고 **VAT 별도**라는 사이트 표기를 그대로 따른다.
- 용어: `docs/i18n-glossary.md` + P0 표기 — ja: ウルセラ(ウルセラプライム)·サーマクール（サーマジ）FLX·カロスキル·新沙(シンサ)·美容皮膚科·**LIV美容クリニック** / zh-TW: 音波拉提(Ultherapy)·鳳凰電波(Thermage)·林蔭道·新沙站·除刺青·雷射(激光) 병기·**LIV整形外科** / zh: 超声刀·热玛吉·**LIV整形外科** / en: Ultherapy Prime·Thermage FLX·Garosu-gil·Sinsa Station·**LIV Plastic Surgery**(별칭 LIV Clinic). zh-TW 문자열에 간체 전용 글자가 섞이면 테스트가 실패한다(정규식은 Task 9).
- 저자 표기 기본값은 **병원(clinic)** 이다. 원장 명의(`reviewer: dr-kim`)는 원장이 실제로 검수한 편에만 사장님이 frontmatter를 바꿔 켠다(C3: 원장 검수 시간을 잡지 않음).
- 리포 전체 eslint는 기존 오류 57건. lint 게이트는 변경 파일에만 `npx eslint <files>`.
- 브랜치 `feature/foreign-seo-p1`에서 작업하고 **작업 파일만** `git add`한다. 워킹트리의 무관한 수정(`CLAUDE.md`, `docs/04-report/features/marketing-attribution.report.md`)과 다수의 untracked 파일은 건드리지 않는다. 커밋 메시지는 한국어 요약 + `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- **프로덕션 DB 쓰기(이벤트 설명 반영)와 master 머지·배포는 사장님 확인 후**에만 한다(Task 12·13 체크포인트). 그 전까지 브랜치·문서·로컬 검증으로 진행한다.
- 로컬 dev 서버는 다른 세션의 `.next/dev/lock` 충돌이 있으니 검증은 `next build` + `next start --port 3010`으로 한다. 백그라운드 서버 명령을 `| head`로 파이프하지 않는다.

### 결정 사항(기본값 — 사장님이 바꾸면 해당 Task만 수정)

| # | 결정 | 기본값 | 근거 |
|---|---|---|---|
| D1 | 가이드 6편 구성 | 계획서의 1·3·9·11·16·18은 "울쎄라 가격"·"외국인 예약" 2주제의 언어별 판이라, **6개 주제 × 4개 언어 = 24편**으로 재구성(Task 3 표) | §E "각 편을 4개 언어로" |
| D2 | 초안 공개 방식 | `status: draft` = 직접 URL로만 열림(noindex, 허브·사이트맵 제외, 상단에 "검수 중" 띠). 사장님 검수 후 frontmatter를 `published`로 바꾸면 색인·허브·hreflang·사이트맵에 포함 | 검수 전 번역이 검색에 잡히지 않게 |
| D3 | 참고 환산(USD/JPY/TWD) | 가격 페이지에는 넣지 않는다(환율 갱신 부담·의료광고 오해). 가이드 본문에서만 "2026-09 기준 약 …" 형태로 반올림 표기 | B1 미답 |
| D4 | 이벤트 zh-TW 컬럼 | 추가하지 않고 zh(간체) 폴백 유지. 대신 이벤트 상세 메타데이터가 zh-TW에서 한국어로 떨어지는 버그만 고침 | 컬럼 추가는 DB 변경 → 사장님 결정 |
| D5 | 이벤트 제목 | 제목은 "September Promotion" 유지, 설명만 3~5문장으로 | 제목 변경은 선택지로 제시 |
| D6 | 시술 페이지 블록의 비행 시점 | 넣지 않는다(사이트에 근거 없음). 소요 시간·당일/재방문(사이트 표기가 있는 6종)·통역·결제·예약만 | §E |
| D7 | 후기 목록 노출 | 현행 유지(모든 언어 후기를 한 목록에 표시). 언어별 필터는 후기가 쌓인 뒤 재검토 | 범위 밖 |

---

### Task 0: 브랜치·기준선

**Files:** 없음(git 상태만)

- [ ] **Step 1: 브랜치 생성**

```bash
cd /d/dev/LIV_homepage && git checkout -b feature/foreign-seo-p1
```

- [ ] **Step 2: 기준선 게이트(모두 통과해야 시작)**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx tsc --noEmit && npx vitest run && npm run verify:i18n
```
Expected: tsc 오류 0, vitest 32 파일 446 테스트 통과(P0 기준선), verify:i18n 11개 로케일 in sync. 숫자를 기록해 둔다(보고서에 씀).

---

### Task 1: 가이드 콘텐츠 파이프라인 (Markdown → 생성 TS)

**Files:**
- Create: `liv-clinic/src/lib/guides/types.ts`
- Create: `liv-clinic/src/lib/guides/markdown.ts`
- Create: `liv-clinic/src/lib/guides/__tests__/markdown.test.ts`
- Create: `liv-clinic/scripts/compile-guides.mjs`
- Create: `liv-clinic/content/guides/README.md`
- Create: `liv-clinic/content/guides/en/_example.md` (파서 테스트용 표본이 아니라 작성 규칙 예시; `_` 접두는 컴파일 제외)
- Modify: `liv-clinic/package.json` (`prebuild`, `build:guides`)
- Generated: `liv-clinic/src/lib/guides/guides.generated.ts`, `liv-clinic/src/lib/guides/guides.index.generated.ts`

**Interfaces:**
- Produces: `GUIDE_LOCALES`, `isGuideLocale(l): l is GuideLocale`, 타입 `GuideDoc/GuideBlock/GuideFaq/GuideStatus/GuideCategory/GuideReviewer` (types.ts); `parseGuide(src, { locale, slug }): GuideDoc`, `REVIEW_MARKER` (markdown.ts); 생성물 `GUIDES: readonly GuideDoc[]`, `GUIDE_INDEX: readonly { locale; slug; status; title; category }[]`.

- [ ] **Step 1: 타입 모듈**

`liv-clinic/src/lib/guides/types.ts`:
```ts
/**
 * 외국인 가이드(P1-1) 타입. 생성 모듈(guides.generated.ts)을 import하지 않으므로
 * 클라이언트 컴포넌트(Footer 등)에서도 안전하게 import할 수 있다.
 */
export const GUIDE_LOCALES = ['en', 'ja', 'zh', 'zh-TW'] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

export function isGuideLocale(locale: string): locale is GuideLocale {
  return (GUIDE_LOCALES as readonly string[]).includes(locale);
}

export type GuideStatus = 'draft' | 'published';
export type GuideCategory = 'price' | 'booking' | 'comparison' | 'aftercare' | 'treatment';
/** 저자 표기. 기본 clinic. dr-kim은 원장이 실제 검수한 편에만 켠다. */
export type GuideReviewer = 'clinic' | 'dr-kim';

export type GuideBlock =
  | { type: 'h2'; text: string; id: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'note'; text: string };

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideFrontmatter {
  title: string;
  description: string;
  keywords: string[];
  category: GuideCategory;
  status: GuideStatus;
  /** YYYY-MM-DD — 화면의 "업데이트"와 Article.dateModified */
  updated: string;
  reviewer: GuideReviewer;
  /** 관련 시술 경로(로케일 접두 없음). 예: '/lifting/ulthera' */
  treatment?: string;
}

export interface GuideDoc extends GuideFrontmatter {
  locale: GuideLocale;
  slug: string;
  blocks: GuideBlock[];
  faq: GuideFaq[];
  readingMinutes: number;
  /** 본문에 남은 [검수 필요 …] 표식 수. published면 0이어야 한다. */
  reviewMarkers: number;
}

export interface GuideIndexEntry {
  locale: GuideLocale;
  slug: string;
  status: GuideStatus;
  title: string;
  category: GuideCategory;
}
```

- [ ] **Step 2: 실패하는 파서 테스트**

`liv-clinic/src/lib/guides/__tests__/markdown.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseFrontmatter, parseBlocks, parseGuide, REVIEW_MARKER } from '../markdown';

const SAMPLE = `---
title: "Ultherapy in Seoul: 2026 price guide"
description: What Ultherapy Prime costs at LIV and how to plan a visit.
keywords:
  - ultherapy korea price
  - ultherapy seoul cost
category: price
status: draft
updated: 2026-09-06
reviewer: clinic
treatment: /lifting/ulthera
---

Intro paragraph with **bold** and a [link](/pricing).
Second line of the same paragraph.

## Prices

| Area | Shots | Price |
|---|---|---|
| Upper face | 200-300 | KRW 780,000~ |

- one
- two

1. first
2. second

> Prices exclude VAT. [검수 필요: 비행 가능 시점]

## FAQ

### Do foreigners pay more?

No. The same price list applies.

### Can I fly the next day?

[검수 필요: 원장 확인] Not stated on the site.
`;

describe('parseFrontmatter', () => {
  it('reads scalars and lists', () => {
    const { data, body } = parseFrontmatter(SAMPLE);
    expect(data.title).toBe('Ultherapy in Seoul: 2026 price guide');
    expect(data.keywords).toEqual(['ultherapy korea price', 'ultherapy seoul cost']);
    expect(data.treatment).toBe('/lifting/ulthera');
    expect(body.startsWith('\nIntro paragraph')).toBe(true);
  });

  it('throws without frontmatter', () => {
    expect(() => parseFrontmatter('no frontmatter')).toThrow(/frontmatter/);
  });
});

describe('parseBlocks', () => {
  it('builds blocks and pulls the FAQ section out', () => {
    const { body } = parseFrontmatter(SAMPLE);
    const { blocks, faq } = parseBlocks(body);
    expect(blocks[0]).toEqual({ type: 'p', text: 'Intro paragraph with **bold** and a [link](/pricing). Second line of the same paragraph.' });
    expect(blocks[1]).toMatchObject({ type: 'h2', text: 'Prices', id: 'prices' });
    expect(blocks[2]).toEqual({ type: 'table', header: ['Area', 'Shots', 'Price'], rows: [['Upper face', '200-300', 'KRW 780,000~']] });
    expect(blocks[3]).toEqual({ type: 'ul', items: ['one', 'two'] });
    expect(blocks[4]).toEqual({ type: 'ol', items: ['first', 'second'] });
    expect(blocks[5]).toMatchObject({ type: 'note' });
    expect(blocks.some((b) => b.type === 'h2' && /faq/i.test(b.text))).toBe(false);
    expect(faq).toEqual([
      { q: 'Do foreigners pay more?', a: 'No. The same price list applies.' },
      { q: 'Can I fly the next day?', a: '[검수 필요: 원장 확인] Not stated on the site.' },
    ]);
  });

  it('gives CJK headings stable positional ids', () => {
    const { blocks } = parseBlocks('## 価格の目安\n\n本文。\n');
    expect(blocks[0]).toMatchObject({ type: 'h2', id: 's1' });
  });
});

describe('parseGuide', () => {
  it('returns a GuideDoc with marker count and reading time', () => {
    const doc = parseGuide(SAMPLE, { locale: 'en', slug: 'ultherapy-cost-seoul' });
    expect(doc.locale).toBe('en');
    expect(doc.slug).toBe('ultherapy-cost-seoul');
    expect(doc.status).toBe('draft');
    expect(doc.reviewMarkers).toBe(2);
    expect(doc.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(doc.faq).toHaveLength(2);
  });

  it('rejects missing required fields and bad enums', () => {
    const bad = SAMPLE.replace('category: price', 'category: sale');
    expect(() => parseGuide(bad, { locale: 'en', slug: 'x' })).toThrow(/category/);
    const noDesc = SAMPLE.replace(/description: .*\n/, '');
    expect(() => parseGuide(noDesc, { locale: 'en', slug: 'x' })).toThrow(/description/);
  });

  it('REVIEW_MARKER matches the Korean marker with or without a note', () => {
    expect('a [검수 필요] b [검수 필요: 근거 없음] c'.match(REVIEW_MARKER)).toHaveLength(2);
  });
});
```

- [ ] **Step 3: 실패 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/guides
```
Expected: FAIL — `Cannot find module '../markdown'`.

- [ ] **Step 4: 파서 구현**

`liv-clinic/src/lib/guides/markdown.ts`:
```ts
/**
 * 가이드 Markdown 부분집합 파서. 외부 의존성 없음(프록시 뒤라 패키지 추가 불가).
 *
 * 지원: frontmatter(스칼라·"- " 목록), ## / ###, 문단, "- " 목록, "1. " 목록,
 * "| a | b |" 표(둘째 줄 구분선), "> " 안내문, 인라인 **굵게**·[텍스트](url).
 * "## FAQ" 이후의 "### 질문" + 답 문단은 faq[]로 분리한다(FAQPage 스키마용).
 */
import type {
  GuideBlock,
  GuideCategory,
  GuideDoc,
  GuideFaq,
  GuideFrontmatter,
  GuideLocale,
  GuideReviewer,
  GuideStatus,
} from './types';

export const REVIEW_MARKER = /\[검수 필요[^\]]*\]/g;

const CATEGORIES: readonly GuideCategory[] = ['price', 'booking', 'comparison', 'aftercare', 'treatment'];
const STATUSES: readonly GuideStatus[] = ['draft', 'published'];
const REVIEWERS: readonly GuideReviewer[] = ['clinic', 'dr-kim'];

function unquote(value: string): string {
  const t = value.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

export function parseFrontmatter(src: string): { data: Record<string, string | string[]>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(src);
  if (!m) throw new Error('frontmatter missing (--- block at top of file)');
  const data: Record<string, string | string[]> = {};
  let list: string[] | null = null;
  for (const raw of m[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) {
      list.push(unquote(item[1]));
      continue;
    }
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`bad frontmatter line: ${line}`);
    const [, key, value] = kv;
    if (value === '') {
      list = [];
      data[key] = list;
    } else {
      list = null;
      data[key] = unquote(value);
    }
  }
  return { data, body: src.slice(m[0].length) };
}

function headingId(text: string, ordinal: number): string {
  const latin = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return latin.length >= 3 ? latin : `s${ordinal}`;
}

const cells = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function parseBlocks(body: string): { blocks: GuideBlock[]; faq: GuideFaq[] } {
  const lines = body.split(/\r?\n/);
  const blocks: GuideBlock[] = [];
  const faq: GuideFaq[] = [];
  let inFaq = false;
  let question: string | null = null;
  let answer: string[] = [];
  const para: string[] = [];
  let h2Count = 0;

  const pushText = (text: string) => {
    if (inFaq && question) answer.push(text);
    else blocks.push({ type: 'p', text });
  };
  const flushPara = () => {
    if (!para.length) return;
    pushText(para.join(' ').trim());
    para.length = 0;
  };
  const flushFaq = () => {
    if (question) faq.push({ q: question, a: answer.join(' ').trim() });
    question = null;
    answer = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      flushPara();
      i++;
      continue;
    }
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      flushPara();
      flushFaq();
      const text = h2[1].trim();
      if (/^faq$/i.test(text)) {
        inFaq = true;
      } else {
        inFaq = false;
        h2Count++;
        blocks.push({ type: 'h2', text, id: headingId(text, h2Count) });
      }
      i++;
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h3) {
      flushPara();
      if (inFaq) {
        flushFaq();
        question = h3[1].trim();
      } else {
        blocks.push({ type: 'h3', text: h3[1].trim() });
      }
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      flushPara();
      const rows: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const header = cells(rows[0]);
      const data = rows.slice(1).filter((r) => !/^\|\s*:?-{2,}/.test(r)).map(cells);
      blocks.push({ type: 'table', header, rows: data });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^[-*]\s+/, '').trim());
      if (inFaq && question) answer.push(items.map((t) => `• ${t}`).join(' '));
      else blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\d+[.)]\s+/, '').trim());
      if (inFaq && question) answer.push(items.map((t, n) => `${n + 1}. ${t}`).join(' '));
      else blocks.push({ type: 'ol', items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara();
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) parts.push(lines[i++].replace(/^>\s?/, '').trim());
      const text = parts.join(' ');
      if (inFaq && question) answer.push(text);
      else blocks.push({ type: 'note', text });
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flushPara();
  flushFaq();
  return { blocks, faq };
}

/** CJK 400자/분 + 라틴 200단어/분, 최소 1분 */
export function estimateReadingMinutes(text: string): number {
  const cjk = (text.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) ?? []).length;
  const words = (text.replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

function requireString(data: Record<string, string | string[]>, key: string): string {
  const v = data[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`frontmatter "${key}" is required`);
  return v.trim();
}

function requireEnum<T extends string>(data: Record<string, string | string[]>, key: string, allowed: readonly T[]): T {
  const v = requireString(data, key);
  if (!(allowed as readonly string[]).includes(v)) throw new Error(`frontmatter "${key}" must be one of ${allowed.join('|')}, got "${v}"`);
  return v as T;
}

export function parseGuide(src: string, ctx: { locale: GuideLocale; slug: string }): GuideDoc {
  const { data, body } = parseFrontmatter(src);
  const keywords = Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [];
  if (keywords.length === 0) throw new Error('frontmatter "keywords" needs at least one item');
  const updated = requireString(data, 'updated');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) throw new Error(`frontmatter "updated" must be YYYY-MM-DD, got "${updated}"`);
  const fm: GuideFrontmatter = {
    title: requireString(data, 'title'),
    description: requireString(data, 'description'),
    keywords,
    category: requireEnum(data, 'category', CATEGORIES),
    status: requireEnum(data, 'status', STATUSES),
    updated,
    reviewer: requireEnum(data, 'reviewer', REVIEWERS),
    ...(typeof data.treatment === 'string' && data.treatment ? { treatment: data.treatment } : {}),
  };
  const { blocks, faq } = parseBlocks(body);
  const reviewMarkers = (body.match(REVIEW_MARKER) ?? []).length;
  return {
    ...fm,
    locale: ctx.locale,
    slug: ctx.slug,
    blocks,
    faq,
    readingMinutes: estimateReadingMinutes(body),
    reviewMarkers,
  };
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/guides
```
Expected: PASS (7 tests).

- [ ] **Step 6: 컴파일 스크립트**

`liv-clinic/scripts/compile-guides.mjs` (반드시 `tsx`로 실행 — `.ts`를 import한다. 사유는 `compile-concern-rules.mjs` 머리말과 같다):
```js
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
  console.log(`[compile-guides] ${docs.length} guide(s) (${published} published, ${docs.length - published} draft) → ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 7: package.json 스크립트**

`liv-clinic/package.json` `scripts`:
```json
"build:guides": "tsx scripts/compile-guides.mjs",
"prebuild": "tsx scripts/compile-concern-rules.mjs && tsx scripts/compile-guides.mjs && npm run verify:i18n",
```

- [ ] **Step 8: 작성 규칙 문서와 빈 생성물**

`liv-clinic/content/guides/README.md`:
```markdown
# 외국인 가이드 원고 (P1-1)

- 경로: `content/guides/{en|ja|zh|zh-TW}/{slug}.md` — slug는 4개 언어가 **같아야** hreflang이 묶인다.
- `_`로 시작하는 파일은 컴파일하지 않는다(`_facts.md`, `_example.md`).
- 빌드 전 `npm run build:guides`가 `src/lib/guides/guides.generated.ts`를 만든다(커밋한다).
- frontmatter 필수: `title`, `description`, `keywords`(목록), `category`(price|booking|comparison|aftercare|treatment), `status`(draft|published), `updated`(YYYY-MM-DD), `reviewer`(clinic|dr-kim). 선택: `treatment`(예: /lifting/ulthera).
- `status: draft` = 직접 URL로만 열림(noindex, 허브·사이트맵·hreflang 제외, 화면 상단 "검수 중" 띠). 검수가 끝나면 `published`로 바꾼다.
- 사이트에 근거가 없는 의료적 수치는 쓰지 말고 `[검수 필요: 무엇을 확인해야 하는지]`를 남긴다. published에 표식이 남으면 빌드가 실패한다.
- 본문 문법: `##` 절, `###` 소절, 문단, `- ` 목록, `1. ` 목록, `| a | b |` 표(둘째 줄 `|---|`), `> ` 안내문, `**굵게**`, `[텍스트](/경로)`. 내부 링크는 로케일 접두 없이 쓴다(렌더 시 붙는다).
- `## FAQ` 아래 `### 질문` + 답 문단은 FAQPage 스키마로 나간다. 3~6개.
- 근거 시트: `_facts.md`(Task 2에서 생성). 여기에 없는 가격·시간·자격은 쓰지 않는다.
```

```bash
cd /d/dev/LIV_homepage/liv-clinic && mkdir -p content/guides/en content/guides/ja content/guides/zh content/guides/zh-TW && npm run build:guides
```
Expected: `[compile-guides] 0 guide(s) (0 published, 0 draft)`, 생성 파일 2개가 `GUIDES = []`, `GUIDE_INDEX = []`로 만들어짐.

- [ ] **Step 9: Netlify Node 20 흉내로 스크립트 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && node --no-experimental-strip-types ./node_modules/tsx/dist/cli.mjs scripts/compile-guides.mjs
```
Expected: 같은 출력. (`.ts` 동적 import가 tsx 없이도 깨지지 않는지 보는 것이 목적)

- [ ] **Step 10: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/src/lib/guides liv-clinic/scripts/compile-guides.mjs liv-clinic/content/guides liv-clinic/package.json && git commit -m "feat(guides): 외국인 가이드 Markdown 파이프라인 — 파서·컴파일 스크립트·검수 표식 게이트

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 사실 정보 시트(가이드 근거) 생성

가이드 24편은 이 시트에 있는 사실만 쓴다(§E: B 정보는 사이트에서 추출). 사람이 손으로 옮기지 않고 스크립트가 코드·메시지에서 뽑아내므로, 가격이 바뀌면 다시 돌리면 된다.

**Files:**
- Create: `liv-clinic/scripts/dump-guide-facts.mjs`
- Generated: `liv-clinic/content/guides/_facts.md` (커밋)

**Interfaces:**
- Consumes: `PRICING`(`src/lib/pricing.ts`), `PRICING_GUIDE`(`src/lib/pricingGuide.ts`), `TREATMENTS`·`MEDICAL_QA`·`SITE_INFO`·`BUSINESS_HOURS`·`CERTIFICATIONS`(`src/lib/constants.ts`), `getLocalizedTreatment`(`src/lib/treatmentsI18n.ts`), 메시지 `pricingGuide`·`pricing.labels`·`international`·`sections.doctors`·`medical.faq`·`treatments.*.name`(en/ja/zh/zh-TW).

- [ ] **Step 1: 덤프 스크립트**

`liv-clinic/scripts/dump-guide-facts.mjs` (tsx로 실행):
```js
#!/usr/bin/env node
/**
 * 가이드 작성 근거 시트 생성: content/guides/_facts.md
 * 사이트 코드·메시지에 실제로 있는 값만 나열한다. 여기에 없는 수치는 가이드에 쓰지 않는다.
 * 실행: npx tsx scripts/dump-guide-facts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'ja', 'zh', 'zh-TW'];
const msg = Object.fromEntries(
  ['ko', ...LOCALES].map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'messages', `${l}.json`), 'utf8'))]),
);

async function main() {
  const { PRICING } = await import('../src/lib/pricing.ts');
  const { PRICING_GUIDE } = await import('../src/lib/pricingGuide.ts');
  const { TREATMENTS, MEDICAL_QA, SITE_INFO, BUSINESS_HOURS, CERTIFICATIONS, LASER_CATEGORIES } = await import('../src/lib/constants.ts');
  const { getLocalizedTreatment } = await import('../src/lib/treatmentsI18n.ts');

  const out = [];
  const h = (t) => out.push(`\n## ${t}\n`);
  const row = (cells) => out.push(`| ${cells.join(' | ')} |`);

  out.push('# 가이드 근거 시트 (자동 생성 — 수정하지 말고 `npx tsx scripts/dump-guide-facts.mjs`로 재생성)');
  out.push(`\n생성: ${new Date().toISOString().slice(0, 10)}. 출처는 각 표의 머리말에 있다. **여기에 없는 가격·시간·자격·비행 시점은 가이드에 쓰지 않는다.**`);

  h('1. 병원 기본 정보 (src/lib/constants.ts SITE_INFO·BUSINESS_HOURS)');
  out.push(`- 병원명: ${SITE_INFO.name} / ${SITE_INFO.nameEn} (ja LIV美容クリニック, zh·zh-TW LIV整形外科)`);
  out.push(`- 전화 ${SITE_INFO.phone} (국제 ${SITE_INFO.phoneInternational}), 이메일 ${SITE_INFO.email}`);
  out.push(`- 주소(en): ${SITE_INFO.address.en}`);
  out.push(`- 진료시간: 평일 ${BUSINESS_HOURS.weekday.open}–${BUSINESS_HOURS.weekday.close}, 토 ${BUSINESS_HOURS.saturday.open}–${BUSINESS_HOURS.saturday.close}, 일 휴무`);
  out.push('- 오시는 길(international.gettingHere, en): ' + msg.en.international.gettingHere.routes.map((r) => `${r.from}: ${r.detail}`).join(' / '));
  out.push(`- 인증(CERTIFICATIONS): ${CERTIFICATIONS.map((c) => c.id).join(', ')} → international.why.items[1](en): "${msg.en.international.why.items[1].desc}"`);

  h('2. 공개 가격표 /pricing (pricingGuide 네임스페이스; 1회 기준, VAT 별도)');
  for (const cat of PRICING_GUIDE) {
    out.push(`\n### ${cat.id} — ${LOCALES.map((l) => msg[l].pricingGuide.categories[cat.id]).join(' / ')}\n`);
    row(['rowId', ...LOCALES.map((l) => `${l} name`), 'basis(en)', 'price(en)']);
    row(['---', ...LOCALES.map(() => '---'), '---', '---']);
    for (const r of cat.rows) {
      row([r, ...LOCALES.map((l) => msg[l].pricingGuide.rows[cat.id][r].name), msg.en.pricingGuide.rows[cat.id][r].basis, msg.en.pricingGuide.rows[cat.id][r].price]);
    }
  }
  out.push('\n안내문(en): ' + Object.values(msg.en.pricingGuide.notes).join(' '));

  h('3. 시술 페이지 가격 (src/lib/pricing.ts PRICING; 원, "부터")');
  for (const [id, p] of Object.entries(PRICING)) {
    const labels = msg.en.pricing.labels[id === 'hair-removal' ? 'hairRemoval' : id] ?? {};
    for (const g of p.groups) {
      for (const r of g.rows) {
        row([id, g.groupKey, r.rowKey, labels[r.rowKey] ?? '', r.price ?? '상담 후 결정', r.suffix ?? '']);
      }
    }
  }

  h('4. 시술 정보 — 소요 시간·마취·회복·효과 지속 (TREATMENTS + treatmentsI18n, 4개 언어)');
  for (const cat of ['lifting', 'antiaging']) {
    for (const [id, base] of Object.entries(TREATMENTS[cat])) {
      out.push(`\n### ${cat}/${id}\n`);
      row(['locale', 'name', 'duration', 'anesthesia', 'recovery', 'results']);
      row(['---', '---', '---', '---', '---', '---']);
      for (const l of ['ko', ...LOCALES]) {
        const loc = l === 'ko' ? base : getLocalizedTreatment(base, id, l);
        const name = l === 'ko' ? base.name : msg[l].treatments?.[cat]?.[id]?.name ?? '';
        row([l, name, loc.duration ?? '', loc.anesthesia ?? '', loc.recovery ?? '', loc.results ?? '']);
      }
      out.push('\n주의(ko cautions): ' + (base.cautions ?? []).join(' / '));
      out.push('FAQ(ko): ' + (base.faqs ?? []).map((f) => `Q ${f.q} → ${f.shortA ?? f.a}`).join(' | '));
    }
  }
  out.push('\n### laser 카테고리 (LASER_CATEGORIES; 소요 시간은 각 layout.tsx serviceData 참고)\n');
  for (const c of LASER_CATEGORIES) out.push(`- ${c.id}: ${c.nameEn} — ${c.shortDesc}`);

  h('5. 외국인 안내 페이지 사실 (international 네임스페이스, en 기준; 다른 언어는 같은 키)');
  const intl = msg.en.international;
  out.push(`- hero.subtitle: ${intl.hero.subtitle}`);
  out.push('- why.items: ' + intl.why.items.map((i) => `${i.title} — ${i.desc}`).join(' / '));
  out.push(`- communication.desc: ${intl.communication.desc}`);
  out.push('- channels: ' + intl.communication.channels.map((c) => `${c.lang}: ${c.value}`).join(' / '));
  out.push(`- booking.desc: ${intl.booking.desc}; steps: ` + intl.booking.steps.map((s, i) => `${i + 1}) ${s.title} — ${s.desc}`).join(' '));
  out.push('- stay.rows: ' + intl.stay.rows.map((r) => `${r.treatment}: ${r.stay}`).join(' / ') + ` (note: ${intl.stay.note})`);
  out.push(`- aftercare.desc: ${intl.aftercare.desc}`);
  out.push(`- payment: ${intl.payment.desc} ${intl.payment.methods}`);

  h('6. 외국인 관련 Q&A (MEDICAL_QA foreign-*; ko 원문. 외국어 답은 medical.faq 메시지에 있음)');
  for (const qa of MEDICAL_QA.filter((q) => q.id.startsWith('foreign-'))) {
    out.push(`- **${qa.id}** Q ${qa.question} → ${qa.answer}`);
  }

  h('7. 의료진 (sections.doctors.kim, 4개 언어)');
  for (const l of LOCALES) {
    const d = msg[l].sections.doctors.kim;
    out.push(`- ${l}: ${d.name} / ${d.nameEn} / ${d.title} / ${d.specialty} / 학력: ${d.education.join('; ')} / 자격: ${d.certifications.join('; ')} / 전문: ${d.specialties.join('; ')}`);
  }
  out.push('- SCI 논문 4편: src/app/[locale]/about/staff/page.tsx KIM_SCI_PUBLICATIONS (Arch Plast Surg 2024·2016, Dermatol Surg 2014, Microsurgery 2014) — 제목·저널만 인용, 링크 없음');

  h('8. 사이트에 없는 것 (가이드에서 [검수 필요]로 남길 항목)');
  out.push('- 시술별 비행 가능 시점, 붓기·붉음이 가라앉는 일수(울쎄라 "약간의 붓기·홍조 가능"만 있음), 술·사우나 제한 기간, 통증 점수');
  out.push('- 외국인 전용 패키지, 예약금·환불 규정(사이트: "상담 예약에는 예약금이 필요하지 않습니다"만 있음), Alipay/WeChat Pay 가능 여부');
  out.push('- 원장 논문 링크(PubMed/DOI), 장비 인증서 사진 사용 허가');

  fs.writeFileSync(path.join(ROOT, 'content', 'guides', '_facts.md'), out.join('\n') + '\n', 'utf8');
  console.log(`[dump-guide-facts] ${out.length} lines → content/guides/_facts.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 실행·확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx tsx scripts/dump-guide-facts.mjs && grep -c "" content/guides/_facts.md && grep -n "ulthera" content/guides/_facts.md | head -5
```
Expected: 파일 생성, 울쎄라 가격 4행(upperFace 780,000 / lowerFace 1,170,000 / fullFace 1,560,000 / fullFaceNeck 2,340,000)과 duration `60-90분`(ko)·`60-90 minutes`(en)이 보인다. `import` 경로나 메시지 키가 어긋나면 여기서 바로 고친다(구조는 이 계획 작성 시점에 확인한 것이다).

- [ ] **Step 3: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/scripts/dump-guide-facts.mjs liv-clinic/content/guides/_facts.md && git commit -m "docs(guides): 가이드 근거 시트 생성 스크립트와 _facts.md

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 가이드 라우트·메타데이터·스키마·사이트맵·푸터 링크

**Files:**
- Create: `liv-clinic/src/lib/guides/index.ts` (서버 전용 — 생성물 import)
- Create: `liv-clinic/src/lib/guides/publicIndex.ts` (클라이언트 안전 — 색인만 import)
- Create: `liv-clinic/src/lib/guides/ui.ts`
- Create: `liv-clinic/src/lib/guides/schema.ts`
- Create: `liv-clinic/src/lib/guides/__tests__/index.test.ts`
- Create: `liv-clinic/src/components/guides/GuideArticle.tsx`, `GuideInline.tsx`, `GuideCard.tsx`
- Create: `liv-clinic/src/app/[locale]/guides/page.tsx`, `liv-clinic/src/app/[locale]/guides/[slug]/page.tsx`
- Modify: `liv-clinic/src/lib/seo.ts` (`buildHreflangMap` 로케일 인자, `generatePageMetadata` `alternateLocales`/`ogType`, `defaultOgImage`)
- Modify: `liv-clinic/src/lib/sitemapPaths.ts`, `liv-clinic/src/app/sitemap.ts`
- Modify: `liv-clinic/src/components/layout/Footer.tsx`
- Modify: `liv-clinic/src/app/[locale]/international/page.tsx` (FAQ teaser 아래 가이드 링크)
- Test: `liv-clinic/src/lib/__tests__/seo.test.ts`, `liv-clinic/src/lib/__tests__/sitemapPaths.test.ts` (기존 파일에 추가)

**Interfaces:**
- Consumes: Task 1의 `GUIDES`, `GUIDE_INDEX`, 타입; 기존 `generatePageMetadata`, `generateWebPageSchema`, `generateFAQSchema`, `getSiteName`, `BASE_URL`, `LOCALE_META`.
- Produces: `listGuides(locale, {includeDrafts?})`, `getGuide(locale, slug)`, `guideLocalesFor(slug)`, `allGuideParams()`, `publishedGuideSlugs()` (index.ts); `isGuidePublished(locale, slug)`, `publishedGuideCount(locale)` (publicIndex.ts); `GUIDE_UI[locale]` (ui.ts); `buildGuideSchemas(guide)` (schema.ts); `generatePageMetadata({ ..., alternateLocales?, ogType? })`, `buildHreflangMap(path, locales?)`, `defaultOgImage(locale, alt)` (seo.ts).

- [ ] **Step 1: 실패하는 테스트 — hreflang 제한·OG 기본값·사이트맵**

`liv-clinic/src/lib/__tests__/seo.test.ts`에 추가:
```ts
import { BASE_URL, buildHreflangMap, defaultOgImage, generatePageMetadata } from '@/lib/seo';

describe('buildHreflangMap with a locale subset (guides)', () => {
  it('lists only the given locales and points x-default at en', () => {
    const map = buildHreflangMap('/guides/ultherapy-cost-seoul', ['en', 'ja', 'zh', 'zh-TW']);
    expect(Object.keys(map).sort()).toEqual(['en-US', 'ja-JP', 'x-default', 'zh-Hans-CN', 'zh-Hant-TW'].sort());
    expect(map['x-default']).toBe(`${BASE_URL}/en/guides/ultherapy-cost-seoul`);
  });
  it('falls back to the first locale for x-default when en is absent', () => {
    const map = buildHreflangMap('/guides/x', ['ja']);
    expect(map['x-default']).toBe(`${BASE_URL}/ja/guides/x`);
  });
});

describe('defaultOgImage', () => {
  it('uses the per-language 1200×630 image for guide locales', () => {
    expect(defaultOgImage('ja', 'x')).toMatchObject({ url: `${BASE_URL}/images/og/og-ja.jpg`, width: 1200, height: 630 });
    expect(defaultOgImage('zh-TW', 'x').url).toBe(`${BASE_URL}/images/og/og-zh-TW.jpg`);
  });
  it('keeps the shared og-image.jpg for other locales', () => {
    expect(defaultOgImage('ko', 'x')).toMatchObject({ url: `${BASE_URL}/images/og-image.jpg`, width: 1200, height: 800 });
    expect(defaultOgImage('vi', 'x').url).toBe(`${BASE_URL}/images/og-image.jpg`);
  });
});

describe('generatePageMetadata guide options', () => {
  it('threads alternateLocales and ogType through', () => {
    const meta = generatePageMetadata({ locale: 'ja', title: 't', description: 'd', path: '/guides/x', alternateLocales: ['en', 'ja'], ogType: 'article' });
    expect(Object.keys(meta.alternates!.languages as Record<string, string>)).toHaveLength(3);
    expect((meta.openGraph as { type?: string }).type).toBe('article');
  });
});
```

`liv-clinic/src/lib/__tests__/sitemapPaths.test.ts`에 추가:
```ts
import { buildSitemapPaths } from '@/lib/sitemapPaths';

describe('guides in sitemap', () => {
  it('never lists /guides for non-guide locales', () => {
    const guides = buildSitemapPaths().filter((p) => p.path.startsWith('/guides'));
    for (const g of guides) {
      expect(g.locales).toBeDefined();
      for (const l of g.locales!) expect(['en', 'ja', 'zh', 'zh-TW']).toContain(l);
    }
  });
});
```

`liv-clinic/src/lib/guides/__tests__/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { listGuides, getGuide, guideLocalesFor } from '../index';
import { GUIDES } from '../guides.generated';
import { isGuidePublished, publishedGuideCount } from '../publicIndex';

describe('guides index', () => {
  it('returns nothing for locales without guides', () => {
    expect(listGuides('ko')).toEqual([]);
    expect(getGuide('vi', 'anything')).toBeNull();
    expect(publishedGuideCount('ko')).toBe(0);
  });
  it('hides drafts unless asked', () => {
    for (const g of GUIDES) {
      const visible = listGuides(g.locale).some((x) => x.slug === g.slug);
      expect(visible).toBe(g.status === 'published');
      expect(listGuides(g.locale, { includeDrafts: true }).some((x) => x.slug === g.slug)).toBe(true);
      expect(isGuidePublished(g.locale, g.slug)).toBe(g.status === 'published');
    }
  });
  it('guideLocalesFor only counts published versions', () => {
    for (const g of GUIDES) {
      const locales = guideLocalesFor(g.slug);
      expect(locales.includes(g.locale)).toBe(g.status === 'published');
    }
  });
  it('every generated guide passes the content gates', () => {
    for (const g of GUIDES) {
      expect(g.title.length).toBeGreaterThan(10);
      expect(g.description.length).toBeGreaterThan(40);
      expect(g.faq.length).toBeGreaterThanOrEqual(3);
      if (g.status === 'published') expect(g.reviewMarkers).toBe(0);
      expect(g.title).not.toMatch(/유치기관/);
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/__tests__/seo.test.ts src/lib/__tests__/sitemapPaths.test.ts src/lib/guides
```
Expected: FAIL (`defaultOgImage` 없음, `../index` 없음, 두 번째 인자 무시로 키 12개).

- [ ] **Step 3: seo.ts 변경**

`buildHreflangMap` 교체:
```ts
/**
 * hreflang 대체 링크 맵. 기본은 11개 로케일 전체 + x-default → /en.
 * `locales`를 주면 그 로케일만 나열한다(가이드처럼 일부 언어에만 있는 페이지). x-default는 en, en이 없으면 첫 로케일.
 */
export function buildHreflangMap(path: string, locales: readonly string[] = LOCALES): Record<string, string> {
  const xDefault = locales.includes('en') ? 'en' : locales[0];
  return {
    ...Object.fromEntries(
      locales.map((code) => [LOCALE_META[code as Locale].hreflang, `${BASE_URL}/${code}${path}`]),
    ),
    'x-default': `${BASE_URL}/${xDefault}${path}`,
  };
}

/** 언어별 기본 OG 이미지(P1-6, 1200×630). 없는 로케일은 공용 og-image.jpg(1200×800). */
export const OG_IMAGE_LOCALES = ['en', 'ja', 'zh', 'zh-TW'] as const;
export function defaultOgImage(locale: string, alt: string) {
  if ((OG_IMAGE_LOCALES as readonly string[]).includes(locale)) {
    return { url: `${BASE_URL}/images/og/og-${locale}.jpg`, width: 1200, height: 630, alt };
  }
  return { url: `${BASE_URL}/images/og-image.jpg`, width: 1200, height: 800, alt };
}
```

`generatePageMetadata` 시그니처와 본문:
```ts
export function generatePageMetadata({
  locale, title, description, keywords, path = '', images = [],
  alternateLocales,
  ogType = 'website',
}: {
  locale: string; title?: string; description?: string; keywords?: string[]; path?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  /** 이 페이지가 존재하는 로케일만 hreflang에 나열(생략 = 전체) */
  alternateLocales?: readonly string[];
  ogType?: 'website' | 'article';
}): Metadata {
  // ... 기존 코드 ...
  const defaultImage = defaultOgImage(locale, siteName);
  // alternates.languages: buildHreflangMap(path, alternateLocales)
  // openGraph.type: ogType
```
(기존 `defaultImage` 객체 리터럴을 `defaultOgImage` 호출로 바꾸고, `languages: buildHreflangMap(path)` → `buildHreflangMap(path, alternateLocales)`, `type: 'website'` → `type: ogType`.)

- [ ] **Step 4: guides index·publicIndex·ui**

`liv-clinic/src/lib/guides/index.ts`:
```ts
/** 서버 전용 — 생성물 전체를 import한다. 클라이언트 컴포넌트에서는 publicIndex.ts를 쓸 것. */
import { GUIDES } from './guides.generated';
import { isGuideLocale, type GuideDoc, type GuideLocale } from './types';

export function listGuides(locale: string, opts?: { includeDrafts?: boolean }): GuideDoc[] {
  if (!isGuideLocale(locale)) return [];
  return GUIDES.filter((g) => g.locale === locale && (opts?.includeDrafts || g.status === 'published'));
}

export function getGuide(locale: string, slug: string): GuideDoc | null {
  if (!isGuideLocale(locale)) return null;
  return GUIDES.find((g) => g.locale === locale && g.slug === slug) ?? null;
}

/** 이 slug가 게시된 로케일 — hreflang·사이트맵용. 초안은 포함하지 않는다. */
export function guideLocalesFor(slug: string): GuideLocale[] {
  return GUIDES.filter((g) => g.slug === slug && g.status === 'published').map((g) => g.locale);
}

/** generateStaticParams용 — 초안도 정적 생성한다(직접 URL 검수용). */
export function allGuideParams(): { locale: GuideLocale; slug: string }[] {
  return GUIDES.map((g) => ({ locale: g.locale, slug: g.slug }));
}

export function publishedGuideSlugs(): string[] {
  return [...new Set(GUIDES.filter((g) => g.status === 'published').map((g) => g.slug))];
}
```

`liv-clinic/src/lib/guides/publicIndex.ts`:
```ts
/** 클라이언트 안전 — 제목·상태만 담긴 작은 색인. 본문은 포함하지 않는다. */
import { GUIDE_INDEX } from './guides.index.generated';
import { isGuideLocale } from './types';

export function isGuidePublished(locale: string, slug: string): boolean {
  return GUIDE_INDEX.some((g) => g.locale === locale && g.slug === slug && g.status === 'published');
}

export function publishedGuideCount(locale: string): number {
  if (!isGuideLocale(locale)) return 0;
  return GUIDE_INDEX.filter((g) => g.locale === locale && g.status === 'published').length;
}
```

`liv-clinic/src/lib/guides/ui.ts` (4개 언어 화면 문구 — JSON 키를 늘리지 않기 위해 TS에 둔다):
```ts
import type { GuideCategory, GuideLocale } from './types';

export interface GuideUi {
  guides: string; hubTitle: string; hubIntro: string; hubEmpty: string;
  updated: string; readingTime: (m: number) => string; author: string; reviewedBy: string; clinicAuthor: string; doctorAuthor: string;
  toc: string; faq: string; relatedTreatment: string; viewTreatment: string; pricing: string; international: string;
  bookCta: string; chatCta: string; backToGuides: string; draftBanner: string; disclaimer: string;
  category: Record<GuideCategory, string>;
}

export const GUIDE_UI: Record<GuideLocale, GuideUi> = {
  en: {
    guides: 'Guides for international patients', hubTitle: 'Guides for international patients',
    hubIntro: 'Prices, timing and how to plan a visit to LIV Plastic Surgery in Sinsa, Seoul — written for patients travelling from abroad.',
    hubEmpty: 'Guides are being prepared.', updated: 'Updated', readingTime: (m) => `${m} min read`,
    author: 'Written by', reviewedBy: 'Medically reviewed by', clinicAuthor: 'LIV Plastic Surgery', doctorAuthor: 'Dr. Sooyoung Kim, board-certified plastic surgeon',
    toc: 'In this guide', faq: 'Frequently asked questions', relatedTreatment: 'Related treatment', viewTreatment: 'See treatment page',
    pricing: 'Price list', international: 'Information for international patients', bookCta: 'Book a consultation', chatCta: 'Message us', backToGuides: 'All guides',
    draftBanner: 'Draft under review — this page is not indexed and may change.',
    disclaimer: 'This guide is general information, not medical advice or a diagnosis. Suitability and the final plan are decided at your in-person consultation, and prices are per session, before VAT, and confirmed after consultation.',
    category: { price: 'Price guide', booking: 'Booking', comparison: 'Comparison', aftercare: 'Aftercare & travel', treatment: 'Treatment guide' },
  },
  ja: {
    guides: '海外からの患者さま向けガイド', hubTitle: '海外からの患者さま向けガイド',
    hubIntro: 'ソウル・新沙(シンサ)のLIV美容クリニックで施術を受ける方のために、料金・所要時間・予約と滞在の計画をまとめました。',
    hubEmpty: 'ガイドを準備中です。', updated: '更新日', readingTime: (m) => `読了 約${m}分`,
    author: '執筆', reviewedBy: '医学監修', clinicAuthor: 'LIV美容クリニック', doctorAuthor: 'キム・スヨン院長（形成外科専門医）',
    toc: 'この記事の内容', faq: 'よくある質問', relatedTreatment: '関連する施術', viewTreatment: '施術ページを見る',
    pricing: '料金表', international: '海外からの患者さまへ', bookCta: '相談を予約する', chatCta: 'メッセージで問い合わせる', backToGuides: 'ガイド一覧',
    draftBanner: '検収中の下書きです。検索エンジンには登録されず、内容が変わる場合があります。',
    disclaimer: 'この記事は一般的な情報であり、診断や医学的助言ではありません。適応と最終的な施術計画は来院時のカウンセリングで決まります。料金は1回あたり・VAT別途で、カウンセリング後に確定します。',
    category: { price: '料金ガイド', booking: '予約方法', comparison: '比較', aftercare: 'アフターケアと旅程', treatment: '施術ガイド' },
  },
  zh: {
    guides: '国际患者指南', hubTitle: '国际患者指南',
    hubIntro: '为从海外前来首尔新沙站 LIV整形外科就诊的患者整理的价格、时间与行程规划。',
    hubEmpty: '指南准备中。', updated: '更新', readingTime: (m) => `阅读约${m}分钟`,
    author: '撰写', reviewedBy: '医学审核', clinicAuthor: 'LIV整形外科', doctorAuthor: '金秀英院长（整形外科专科医师）',
    toc: '本文内容', faq: '常见问题', relatedTreatment: '相关项目', viewTreatment: '查看项目页面',
    pricing: '价格表', international: '国际患者须知', bookCta: '预约咨询', chatCta: '发消息咨询', backToGuides: '全部指南',
    draftBanner: '审核中的草稿：不会被搜索引擎收录，内容可能变动。',
    disclaimer: '本文为一般性信息，不构成诊断或医疗建议。是否适合以及最终方案由到院面诊决定；价格为单次、不含增值税，以咨询后为准。',
    category: { price: '价格指南', booking: '预约方法', comparison: '对比', aftercare: '术后护理与行程', treatment: '项目指南' },
  },
  'zh-TW': {
    guides: '國際患者指南', hubTitle: '國際患者指南',
    hubIntro: '為從海外前來首爾新沙站（林蔭道旁）LIV整形外科就診的患者整理的價格、時間與行程規劃。',
    hubEmpty: '指南準備中。', updated: '更新', readingTime: (m) => `閱讀約${m}分鐘`,
    author: '撰寫', reviewedBy: '醫學審核', clinicAuthor: 'LIV整形外科', doctorAuthor: '金秀英院長（整形外科專科醫師）',
    toc: '本文內容', faq: '常見問題', relatedTreatment: '相關療程', viewTreatment: '查看療程頁面',
    pricing: '價格表', international: '國際患者須知', bookCta: '預約諮詢', chatCta: '傳訊息諮詢', backToGuides: '全部指南',
    draftBanner: '審核中的草稿：不會被搜尋引擎收錄，內容可能變動。',
    disclaimer: '本文為一般性資訊，不構成診斷或醫療建議。是否適合以及最終方案由到院面診決定；價格為單次、未含加值稅（VAT），以諮詢後為準。',
    category: { price: '價格指南', booking: '預約方法', comparison: '比較', aftercare: '術後照護與行程', treatment: '療程指南' },
  },
};
```
(원장 성함 표기 ja/zh/zh-TW는 `sections.doctors.kim.name` 메시지 값으로 실행 시 맞춘다 — 스텝 5 스키마도 같은 값을 쓴다.)

- [ ] **Step 5: 스키마 빌더**

`liv-clinic/src/lib/guides/schema.ts`:
```ts
import { getTranslations } from 'next-intl/server';
import { BASE_URL, generateFAQSchema, generateWebPageSchema, getSiteName } from '@/lib/seo';
import { LOCALE_META } from '@/i18n/locales-meta';
import { GUIDE_UI } from './ui';
import type { GuideDoc } from './types';

/** Article(저자·검수·수정일) + MedicalWebPage(빵부스러기) + FAQPage. 저자 기본은 병원, reviewer=dr-kim이면 원장 Physician @id. */
export async function buildGuideSchemas(guide: GuideDoc): Promise<object[]> {
  const ui = GUIDE_UI[guide.locale];
  const path = `/guides/${guide.slug}`;
  const url = `${BASE_URL}/${guide.locale}${path}`;
  const siteName = getSiteName(guide.locale);
  const [tCommon, tSections] = await Promise.all([
    getTranslations({ locale: guide.locale, namespace: 'common' }),
    getTranslations({ locale: guide.locale, namespace: 'sections' }),
  ]);
  const organization = { '@type': 'MedicalOrganization', '@id': `${BASE_URL}/#organization`, name: siteName, url: BASE_URL };
  const physician = {
    '@type': 'Physician',
    '@id': `${BASE_URL}/about/staff#dr-kim`,
    name: tSections('doctors.kim.name'),
    alternateName: tSections('doctors.kim.nameEn'),
    jobTitle: tSections('doctors.kim.specialty'),
    url: `${BASE_URL}/${guide.locale}/about/staff`,
  };
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: guide.title,
    description: guide.description,
    inLanguage: LOCALE_META[guide.locale].htmlLang,
    datePublished: guide.updated,
    dateModified: guide.updated,
    author: guide.reviewer === 'dr-kim' ? physician : organization,
    publisher: { '@type': 'Organization', name: siteName, url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` } },
    mainEntityOfPage: url,
    ...(guide.reviewer === 'dr-kim' ? { reviewedBy: physician } : {}),
    ...(guide.treatment ? { about: { '@type': 'MedicalProcedure', url: `${BASE_URL}/${guide.locale}${guide.treatment}` } } : {}),
  };
  const webPage = generateWebPageSchema({
    path,
    title: guide.title,
    description: guide.description,
    locale: guide.locale,
    type: 'MedicalWebPage',
    datePublished: guide.updated,
    dateModified: guide.updated,
    breadcrumbs: [
      { name: tCommon('home'), url: '/' },
      { name: ui.guides, url: '/guides' },
      { name: guide.title, url: path },
    ],
  });
  const schemas: object[] = [article, webPage];
  if (guide.faq.length > 0) schemas.push(generateFAQSchema(guide.faq.map((f) => ({ question: f.q, answer: f.a }))));
  return schemas;
}
```

- [ ] **Step 6: 렌더 컴포넌트**

`liv-clinic/src/components/guides/GuideInline.tsx` (서버 컴포넌트; `**굵게**`, `[텍스트](url)`, `[검수 필요…]` 강조):
```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[검수 필요[^\]]*\])/g;

export default function GuideInline({ text, locale, showMarkers }: { text: string; locale: string; showMarkers: boolean }) {
  const parts = text.split(TOKEN).filter((p) => p !== '');
  return (
    <>
      {parts.map((part, i): ReactNode => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-secondary">{part.slice(2, -2)}</strong>;
        if (part.startsWith('[검수 필요')) {
          return showMarkers ? <mark key={i} className="rounded bg-amber-200 px-1 text-amber-900">{part}</mark> : null;
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link;
          if (/^https?:\/\//.test(href)) {
            return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-secondary">{label}</a>;
          }
          return <Link key={i} href={`/${locale}${href}`} className="text-primary underline underline-offset-2 hover:text-secondary">{label}</Link>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
```

`liv-clinic/src/components/guides/GuideArticle.tsx` (서버 컴포넌트; 헤더·목차·본문·FAQ·CTA·면책):
```tsx
import Link from 'next/link';
import { GUIDE_UI } from '@/lib/guides/ui';
import type { GuideBlock, GuideDoc } from '@/lib/guides/types';
import GuideInline from './GuideInline';

function Block({ block, locale, showMarkers }: { block: GuideBlock; locale: string; showMarkers: boolean }) {
  const inline = (text: string) => <GuideInline text={text} locale={locale} showMarkers={showMarkers} />;
  switch (block.type) {
    case 'h2':
      return <h2 id={block.id} className="mt-12 mb-4 scroll-mt-28 text-h2 text-secondary">{inline(block.text)}</h2>;
    case 'h3':
      return <h3 className="mt-8 mb-3 text-h3 text-secondary">{inline(block.text)}</h3>;
    case 'p':
      return <p className="mb-4 text-body leading-relaxed text-mono">{inline(block.text)}</p>;
    case 'ul':
      return <ul className="mb-5 list-disc space-y-2 pl-6 text-body text-mono">{block.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>;
    case 'ol':
      return <ol className="mb-5 list-decimal space-y-2 pl-6 text-body text-mono">{block.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ol>;
    case 'note':
      return <div className="my-6 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-small leading-relaxed text-secondary">{inline(block.text)}</div>;
    case 'table':
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-small">
            <thead className="bg-background text-left text-secondary">
              <tr>{block.header.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{inline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-border">
                  {row.map((cell, c) => <td key={c} className="px-4 py-3 align-top text-mono">{inline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function GuideArticle({ guide }: { guide: GuideDoc }) {
  const ui = GUIDE_UI[guide.locale];
  const isDraft = guide.status !== 'published';
  const toc = guide.blocks.filter((b): b is Extract<GuideBlock, { type: 'h2' }> => b.type === 'h2');
  const prefix = `/${guide.locale}`;
  return (
    <article className="pb-16">
      {isDraft && (
        <div className="bg-amber-100 px-4 py-2 text-center text-small text-amber-900">{ui.draftBanner}</div>
      )}
      <header className="bg-gradient-to-b from-primary/10 to-background pt-28 pb-10 md:pt-32 md:pb-14">
        <div className="container-custom max-w-3xl">
          <nav className="mb-4 text-small text-mono-light" aria-label="Breadcrumb">
            <Link href={`${prefix}/guides`} className="hover:text-primary">{ui.guides}</Link>
          </nav>
          <p className="mb-3 font-serif text-h4 text-primary">{ui.category[guide.category]}</p>
          <h1 className="mb-4 text-h1 text-secondary md:text-display">{guide.title}</h1>
          <p className="mb-6 text-body leading-relaxed text-mono md:text-h4">{guide.description}</p>
          <p className="text-small text-mono-light">
            {ui.updated} {guide.updated} · {ui.readingTime(guide.readingMinutes)} · {guide.reviewer === 'dr-kim' ? `${ui.reviewedBy} ${ui.doctorAuthor}` : `${ui.author} ${ui.clinicAuthor}`}
          </p>
        </div>
      </header>

      <div className="container-custom max-w-3xl">
        {toc.length >= 3 && (
          <nav className="my-8 rounded-2xl border border-border bg-white p-5" aria-label={ui.toc}>
            <p className="mb-3 text-small font-medium text-secondary">{ui.toc}</p>
            <ol className="space-y-1.5 text-small text-mono">
              {toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="hover:text-primary">{h.text}</a></li>)}
            </ol>
          </nav>
        )}

        {guide.blocks.map((b, i) => <Block key={i} block={b} locale={guide.locale} showMarkers={isDraft} />)}

        {guide.faq.length > 0 && (
          <section className="mt-14" aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="mb-6 text-h2 text-secondary">{ui.faq}</h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-white">
              {guide.faq.map((f, i) => (
                <details key={i} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-body font-medium text-secondary marker:content-none">{f.q}</summary>
                  <p className="mt-3 text-body leading-relaxed text-mono"><GuideInline text={f.a} locale={guide.locale} showMarkers={isDraft} /></p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl bg-secondary px-6 py-8 text-white md:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link href={`${prefix}/contact`} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-7 py-3 font-medium hover:bg-white hover:text-secondary transition-colors">{ui.bookCta}</Link>
            <Link href={`${prefix}/international`} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium hover:bg-white/10 transition-colors">{ui.international}</Link>
            <Link href={`${prefix}/pricing`} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium hover:bg-white/10 transition-colors">{ui.pricing}</Link>
            {guide.treatment && (
              <Link href={`${prefix}${guide.treatment}`} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/60 px-7 py-3 font-medium hover:bg-white/10 transition-colors">{ui.viewTreatment}</Link>
            )}
          </div>
        </section>

        <p className="mt-8 text-small leading-relaxed text-mono-light">{ui.disclaimer}</p>
      </div>
    </article>
  );
}
```

`liv-clinic/src/components/guides/GuideCard.tsx`:
```tsx
import Link from 'next/link';
import { GUIDE_UI } from '@/lib/guides/ui';
import type { GuideDoc } from '@/lib/guides/types';

export default function GuideCard({ guide }: { guide: GuideDoc }) {
  const ui = GUIDE_UI[guide.locale];
  return (
    <Link href={`/${guide.locale}/guides/${guide.slug}`} className="block h-full rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md">
      <p className="mb-2 font-serif text-small text-primary">{ui.category[guide.category]}</p>
      <h2 className="mb-3 text-h4 text-secondary">{guide.title}</h2>
      <p className="mb-4 line-clamp-3 text-small leading-relaxed text-mono">{guide.description}</p>
      <p className="text-small text-mono-light">{ui.updated} {guide.updated} · {ui.readingTime(guide.readingMinutes)}</p>
    </Link>
  );
}
```

- [ ] **Step 7: 라우트**

`liv-clinic/src/app/[locale]/guides/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata, getSiteName } from '@/lib/seo';
import { listGuides } from '@/lib/guides';
import { GUIDE_LOCALES, isGuideLocale } from '@/lib/guides/types';
import { GUIDE_UI } from '@/lib/guides/ui';
import GuideCard from '@/components/guides/GuideCard';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isGuideLocale(locale)) return {};
  const ui = GUIDE_UI[locale];
  const meta = generatePageMetadata({
    locale,
    title: `${ui.hubTitle} | ${getSiteName(locale)}`,
    description: ui.hubIntro,
    path: '/guides',
    alternateLocales: GUIDE_LOCALES.filter((l) => listGuides(l).length > 0),
  });
  // 게시된 가이드가 하나도 없는 언어의 허브는 빈 페이지 — 색인하지 않는다
  return listGuides(locale).length > 0 ? meta : { ...meta, robots: { index: false, follow: true } };
}

export default async function GuidesHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isGuideLocale(locale)) notFound();
  setRequestLocale(locale);
  const ui = GUIDE_UI[locale];
  const guides = listGuides(locale);
  return (
    <>
      <section className="bg-gradient-to-b from-primary/10 to-background pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="container-custom max-w-3xl">
          <p className="mb-3 font-serif text-h4 text-primary">{ui.international}</p>
          <h1 className="mb-4 text-h1 text-secondary md:text-display">{ui.hubTitle}</h1>
          <p className="text-body leading-relaxed text-mono md:text-h4">{ui.hubIntro}</p>
        </div>
      </section>
      <section className="section-gap bg-background">
        <div className="container-custom">
          {guides.length === 0 ? (
            <p className="text-body text-mono-light">{ui.hubEmpty}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => <GuideCard key={g.slug} guide={g} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
```

`liv-clinic/src/app/[locale]/guides/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { generatePageMetadata, getSiteName, safeJsonLd } from '@/lib/seo';
import { allGuideParams, getGuide, guideLocalesFor } from '@/lib/guides';
import { buildGuideSchemas } from '@/lib/guides/schema';
import GuideArticle from '@/components/guides/GuideArticle';

export const revalidate = 3600;
// 4개 언어 × 존재하는 slug만 생성. 그 밖(ko/vi/… 또는 없는 slug)은 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return allGuideParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuide(locale, slug);
  if (!guide) return {};
  const published = guide.status === 'published';
  const meta = generatePageMetadata({
    locale,
    title: `${guide.title} | ${getSiteName(locale)}`,
    description: guide.description,
    keywords: guide.keywords,
    path: `/guides/${slug}`,
    alternateLocales: published ? guideLocalesFor(slug) : [locale],
    ogType: 'article',
  });
  return published ? meta : { ...meta, robots: { index: false, follow: false } };
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const guide = getGuide(locale, slug);
  if (!guide) notFound();
  setRequestLocale(locale);
  const schemas = await buildGuideSchemas(guide);
  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      ))}
      <GuideArticle guide={guide} />
    </>
  );
}
```

- [ ] **Step 8: 사이트맵**

`liv-clinic/src/lib/sitemapPaths.ts` — import와 `buildSitemapPaths` 끝부분:
```ts
import { guideLocalesFor, listGuides, publishedGuideSlugs } from '@/lib/guides';
import { GUIDE_LOCALES } from '@/lib/guides/types';
// ...
export function buildSitemapPaths(): SitemapPath[] {
  // ...기존 treatments 계산...
  // 가이드(P1-1): 게시본이 있는 언어에만. 허브는 게시 가이드가 1편 이상인 언어만.
  const hubLocales = GUIDE_LOCALES.filter((l) => listGuides(l).length > 0);
  const guides: SitemapPath[] = [
    ...(hubLocales.length > 0 ? [{ path: '/guides', priority: 0.8, changeFrequency: 'weekly' as const, locales: hubLocales }] : []),
    ...publishedGuideSlugs().map((slug) => ({
      path: `/guides/${slug}`, priority: 0.8, changeFrequency: 'monthly' as const, locales: guideLocalesFor(slug),
    })),
  ];
  const seen = new Set<string>();
  return [...STATIC_PATHS, ...treatments, ...guides].filter((p) => { /* 기존 중복 제거 그대로 */ });
}
```
`liv-clinic/src/app/sitemap.ts` 정적 루프의 alternates:
```ts
        // 단일 로케일 페이지는 대체 언어가 없다. 일부 로케일에만 있는 페이지(가이드)는 그 로케일끼리만 묶는다.
        ...(page.locales
          ? page.locales.length > 1 ? { alternates: { languages: buildHreflangMap(page.path, page.locales) } } : {}
          : { alternates: { languages: buildHreflangMap(page.path) } }),
```

- [ ] **Step 9: 푸터·국제환자 페이지 링크**

`Footer.tsx` — import `publishedGuideCount`(`@/lib/guides/publicIndex`), `isGuideLocale`(`@/lib/guides/types`), `GUIDE_UI`(`@/lib/guides/ui`); `/international` 항목 뒤에:
```tsx
              {isGuideLocale(locale) && publishedGuideCount(locale) > 0 && (
                <li>
                  <Link href="/guides" className="text-white/70 hover:text-white transition-colors inline-flex items-center min-h-[44px] py-2">
                    {GUIDE_UI[locale].guides}
                  </Link>
                </li>
              )}
```
`international/page.tsx` FAQ teaser 섹션의 `/medical` 링크 아래에 같은 조건으로 `/guides` 링크(`GUIDE_UI[locale].guides` + 화살표 아이콘 동일) 추가. 두 컴포넌트 모두 `'use client'`이므로 **`@/lib/guides`(본문 포함)를 import하지 않는다.**

- [ ] **Step 10: 테스트·타입 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/__tests__/seo.test.ts src/lib/__tests__/sitemapPaths.test.ts src/lib/guides && npx tsc --noEmit
```
Expected: 모두 PASS, tsc 0. (`GUIDES = []` 상태라 index 테스트의 루프는 비어 있다 — Task 4 이후 다시 의미를 가진다.)

- [ ] **Step 11: 임시 초안으로 라우트 동작 확인**

`content/guides/en/_example.md`를 `content/guides/en/smoke-test.md`로 복사(frontmatter status: draft) → `npm run build:guides` → `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build` → `npx next start --port 3010`(백그라운드) →
```bash
curl -sk -o /dev/null -w "%{http_code}\n" http://localhost:3010/en/guides/smoke-test     # 200
curl -sk http://localhost:3010/en/guides/smoke-test | grep -o 'name="robots" content="[^"]*"'   # noindex, nofollow
curl -sk -o /dev/null -w "%{http_code}\n" http://localhost:3010/ko/guides/smoke-test     # 404
curl -sk -o /dev/null -w "%{http_code}\n" http://localhost:3010/vi/guides               # 404
curl -sk http://localhost:3010/en/guides | grep -c "smoke-test"                           # 0 (초안은 허브에 없음)
curl -sk http://localhost:3010/sitemap.xml | grep -c "/guides"                            # 0
```
확인 후 `smoke-test.md`를 지우고 `npm run build:guides`로 생성물을 비운다. 서버를 종료한다.

- [ ] **Step 12: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/src/lib/guides liv-clinic/src/components/guides "liv-clinic/src/app/[locale]/guides" liv-clinic/src/lib/seo.ts liv-clinic/src/lib/sitemapPaths.ts liv-clinic/src/app/sitemap.ts liv-clinic/src/components/layout/Footer.tsx "liv-clinic/src/app/[locale]/international/page.tsx" liv-clinic/src/lib/__tests__/seo.test.ts liv-clinic/src/lib/__tests__/sitemapPaths.test.ts && git commit -m "feat(guides): /guides 허브·상세 라우트(en·ja·zh·zh-TW), Article·FAQ 스키마, 로케일 제한 hreflang·사이트맵, 언어별 OG 기본값

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: 가이드 초안 6주제 × 4개 언어 (24편) — 4a~4f

한 주제(4개 언어)가 한 Task다(4a~4f). 각 Task는 같은 절차를 따르고, 아래 표의 주제별 사양만 다르다. 순서는 4a부터(§E: 첫 편은 울쎄라 가격·일정). 각 언어판은 번역이 아니라 **그 언어의 검색 의도에 맞춰 다시 쓴 글**이어야 한다(C4). 분량 1,200–2,000자(라틴 기준 단어, CJK 기준 글자) — 억지로 늘리지 않는다.

**Files (Task마다):**
- Create: `liv-clinic/content/guides/en/{slug}.md`, `ja/{slug}.md`, `zh/{slug}.md`, `zh-TW/{slug}.md`
- Generated: `guides.generated.ts`, `guides.index.generated.ts` (재생성 후 커밋)

**Interfaces:**
- Consumes: `content/guides/_facts.md`(Task 2), `docs/i18n-glossary.md`, `content/guides/README.md`.
- Produces: `status: draft` 가이드 4편. slug는 4개 언어 동일.

| Task | slug | category | treatment | 계획서 원본 번호 | 언어별 검색 의도(제목 방향) |
|---|---|---|---|---|---|
| 4a | `ultherapy-cost-seoul` | price | /lifting/ulthera | 1·9·16 | en "Ultherapy in Seoul: 2026 price guide, what's included & how to plan your visit" / ja "韓国でウルセラを受ける前に：値段相場・ショット数・正規品の見分け方（新沙LIV）" / zh "首尔超声刀(Ultherapy)价格与行程规划：外国人同价" / zh-TW "韓國音波拉提(Ultherapy)價格與行程規劃｜首爾新沙 LIV" |
| 4b | `book-seoul-clinic-foreigner` | booking | (없음) | 3·11·18 | en "How to book a skin clinic in Seoul as a foreigner (no agency needed)" / ja "新沙・カロスキルで日本語対応の美容皮膚科を探して予約する方法" / zh "首尔江南医美诊所中文预约教学（微信/WhatsApp/在线聊天）" / zh-TW "首爾江南醫美診所 中文預約教學（LINE／WhatsApp／WeChat）" |
| 4c | `ultherapy-vs-thermage-vs-shurink` | comparison | /lifting | 2·10·17 | en "Ultherapy vs Thermage vs Shurink in Korea: how a Seoul clinic chooses" / ja "ウルセラ・サーマクール・シュリンクの違いと韓国での相場" / zh "超声刀、热玛吉、Shurink 怎么选：首尔诊所的对比与价格" / zh-TW "音波拉提 vs 鳳凰電波 vs Shurink：韓國診所的比較與價格" |
| 4d | `botox-filler-cost-seoul` | price | /antiaging/botox | 5·14·20 | en "Botox & filler in Seoul: prices, brands and same price for foreigners" / ja "韓国のボトックス・ヒアルロン酸の値段と選び方（外国人も同一料金）" / zh "首尔肉毒素与玻尿酸价格：品牌、单位与外国人同价" / zh-TW "首爾肉毒桿菌素與玻尿酸價格：品牌、劑量與外國人同價" |
| 4e | `tattoo-removal-pico-seoul` | treatment | /laser/tattoo | 6·19 | en "Tattoo removal in Seoul with pico laser: sessions, cost and travel timing" / ja "韓国でタトゥー除去：ピコレーザーの回数・費用・旅行日程" / zh "首尔皮秒激光洗纹身：疗程次数、费用与行程安排" / zh-TW "首爾皮秒雷射除刺青：療程次數、費用與行程安排" |
| 4f | `downtime-flight-travel-plan` | aftercare | /international | 8·12·15 | en "Can I fly after Ultherapy or Botox? Downtime and a 2–3 day Seoul treatment itinerary" / ja "施術後の飛行機搭乗とダウンタイム目安：1泊2日・2泊3日モデルプラン" / zh "做完项目能马上坐飞机吗？恢复期与首尔 2–3 天医美行程" / zh-TW "療程後可以搭飛機嗎？恢復期與首爾 2–3 天醫美行程" |

**본문 구성(모든 편 공통 — 순서는 언어별로 바꿔도 된다):**
1. 도입 2–3문장: 누구를 위한 글인지, LIV(신사역 1분·가로수길 옆·비수술 안티에이징·외국인 동일 가격)를 한 문장으로.
2. 핵심 답(가격/방법/비교) — 표 1개 이상. 가격은 `_facts.md` §2·§3 값만, "1회 기준·VAT 별도·상담 후 확정" 문구를 표 아래 `> ` 안내문으로.
3. 소요 시간·당일 시술·재방문(§4·§5 stay.rows). 붓기·비행·음주 등 사이트에 없는 수치는 `[검수 필요: …]`.
4. 예약·방문 절차(§5 booking.steps 5단계), 상담 채널(en WhatsApp·채팅 / ja LINE·채팅 / zh WeChat·채팅 / zh-TW LINE·WhatsApp·채팅), 통역 무료(요청 시), 진료시간, 오시는 길(인천공항 70–90분, 신사역 4번 출구 1분), 결제수단.
5. 적합/주의(§4 idealFor·cautions, 임산부·수유부 불가 등 사이트 문구만).
6. `## FAQ` 3–6개: §6 foreign Q&A와 시술 FAQ에서 고른 것 + 검색 의도 질문.
7. 마지막 문단에 "정확한 계획은 상담에서" 취지 한 문장(면책은 컴포넌트가 붙인다).

**금지:** 최상급("최고", "No.1", "가장 저렴"), 효과 보장, 타 병원·국가 비교 우위, 할인·이벤트 강조(9월 프로모션 언급 금지), "유치기관", 없는 수치. 브랜드 표기·용어는 Global Constraints.

**참고 환산(D3):** 가이드 본문에서만, 대표 가격 2–3개에 "약 US$…(2026-09 기준 환율 1 USD ≈ 1,3xx KRW)" 식으로 반올림. 환율은 실행일에 WebSearch로 확인해 `_facts.md`가 아닌 본문 안내문에 기준일과 함께 적는다(ja는 JPY, zh-TW는 TWD, zh는 USD·SGD 중 USD, en은 USD).

**언어별 특기:** ja — ウルセラ/ウルセラプライム 병기, サーマクール（サーマジ）, カロスキル·新沙(シンサ), 美容皮膚科, "正規品": 정품 인증 병원·정품 팁 확인 가능(§6 foreign-device-authentic) / zh-TW — 音波拉提(Ultherapy)·鳳凰電波(Thermage)·林蔭道·新沙站, 雷射(激光) 병기, 대만·홍콩 독자 기준(TWD) / zh — 간체, 超声刀·热玛吉, 微信(WeChat) 우선, 도입에 "중국 본토에서는 구글 접근이 어려워 이 글은 싱가포르·말레이시아 화교 독자와 위챗·小红书 공유용"이라는 문장은 **넣지 않는다**(독자에게 무의미) — 대신 `_facts.md`와 보고서에만 그 용도를 기록 / en — 미국·싱가포르·홍콩 영어 독자, "no agency/no broker" 프레임(§6 booking: 예약금 없음).

- [ ] **Step 1 (4a~4f 공통): 서브에이전트에 작성 위임**

서브에이전트 1개가 한 주제의 4개 언어 파일을 쓴다. 프롬프트 골격(주제별 표 값만 바꿔 넣는다):
```
당신은 리브성형외과(LIV Plastic Surgery, 서울 신사) 웹사이트의 외국인 가이드 원고를 쓴다.
읽을 것: liv-clinic/content/guides/README.md(문법·규칙), liv-clinic/content/guides/_facts.md(허용된 사실 전부), docs/i18n-glossary.md(용어),
docs/superpowers/plans/2026-09-06-foreign-seo-p1.md Task 4의 "본문 구성·금지·언어별 특기".
만들 파일(4개, slug 동일): liv-clinic/content/guides/{en,ja,zh,zh-TW}/<slug>.md
frontmatter: title(언어별 제목 방향: …), description(120–160자, 검색 결과용), keywords 4–8개(부록 B 후보 참고: …), category: <category>, status: draft, updated: 2026-09-06, reviewer: clinic, treatment: <treatment>.
규칙: _facts.md에 없는 가격·시간·의학 수치는 쓰지 말고 [검수 필요: 무엇] 표식을 남길 것. 4개 언어는 각각 그 언어 독자의 검색 의도에 맞춰 다시 쓸 것(직역 금지). zh-TW에 간체 글자 금지. 본문 1,200–2,000자.
끝나면 각 파일의 [검수 필요] 표식 목록(파일:내용)을 보고할 것.
```

- [ ] **Step 2: 컴파일·게이트**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npm run build:guides && npx vitest run src/lib/guides && node -e "
const {GUIDES}=require('./src/lib/guides/guides.generated.ts');" 2>/dev/null; npx tsx -e "import {GUIDES} from './src/lib/guides/guides.generated.ts'; for (const g of GUIDES.filter(g=>g.slug==='<slug>')) console.log(g.locale, g.readingMinutes+'min', 'faq', g.faq.length, 'markers', g.reviewMarkers, 'blocks', g.blocks.length)"
```
Expected: 4개 로케일 모두 생성, FAQ ≥3, 컴파일 경고 없음. zh-TW 간체 검사:
```bash
cd /d/dev/LIV_homepage/liv-clinic && python scripts/_i18n-work/zh-tw-simplified-scan.py content/guides/zh-TW/<slug>.md
```
(스크립트는 Task 9 Step 1에서 만든다. 4a를 Task 9보다 먼저 하면 Task 9 Step 1만 앞당겨 만든다.) Expected: 0건.

- [ ] **Step 3: 사람 눈 검토(작성자 아닌 세션이)**

4개 파일을 읽고 아래를 확인한다: (1) 금지 표현 없음, (2) 가격·시간이 `_facts.md`와 일치(표의 숫자를 하나씩 대조), (3) 링크 경로가 실제 라우트(`/lifting/ulthera`, `/pricing`, `/international`, `/contact`, `/laser/tattoo`, `/about/staff`), (4) 언어별로 구성이 다르며 직역이 아님, (5) 표식 문구가 "무엇을 확인해야 하는지"를 적고 있음. 문제는 파일을 고쳐 해결한다(재위임보다 빠르다).

- [ ] **Step 4: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/content/guides liv-clinic/src/lib/guides/guides.generated.ts liv-clinic/src/lib/guides/guides.index.generated.ts && git commit -m "content(guides): <slug> 초안 4개 언어 (draft, 검수 표식 N건)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **4a** `ultherapy-cost-seoul` — 위 절차 (Step 1~4)
- [ ] **4b** `book-seoul-clinic-foreigner` — 위 절차. 가격표 대신 "채널별 첫 메시지 예문"(각 언어로 3줄), 5단계 절차, 예약금 없음, 진료시간, 오시는 길 표
- [ ] **4c** `ultherapy-vs-thermage-vs-shurink` — 위 절차. 비교표는 `_facts.md` §4의 에너지 방식(HIFU/RF)·소요 시간·마취·회복·효과 지속 + §3 가격만. 우열 표현 금지("~에 적합" 서술은 사이트 FAQ 문구 범위 내)
- [ ] **4d** `botox-filler-cost-seoul` — 위 절차. 가격은 `PRICING.botox`·`PRICING.filler`(§3) + pricingGuide filler(§2). 브랜드명은 사이트에 있는 것만(가격표 라벨 확인), 없으면 일반 명칭
- [ ] **4e** `tattoo-removal-pico-seoul` — 위 절차. 회수·간격은 `treatments.laser.tattoo.detail.faq` 메시지(4개 언어)에 있는 답만 인용(`node -e` 로 덤프해 `_facts.md` 하단에 붙인 뒤 사용). 가격은 `PRICING.tattoo`
- [ ] **4f** `downtime-flight-travel-plan` — 위 절차. 비행 가능 시점은 전부 `[검수 필요]`; 사이트 사실(당일 시술·재방문 불필요·회복 "즉시 일상 복귀", 실리프팅 1주 후 선택 확인)만 단정. 모델 일정 표(1박2일/2박3일)는 "상담 → 시술 → 귀국" 시간 배치만

---

### Task 5: 시술 페이지 외국인 안내 블록 (P1-2)

17개 시술 상세(lifting 8·antiaging 4·laser 5)의 en·ja·zh·zh-TW 화면에 "외국인 환자 안내" 섹션을 넣고, 같은 내용의 Q&A 2개를 페이지의 MedicalService 스키마 FAQ에 합친다. 다른 로케일에서는 아무것도 렌더하지 않는다.

**Files:**
- Create: `liv-clinic/src/lib/treatmentsForeign.ts`
- Create: `liv-clinic/src/lib/__tests__/treatmentsForeign.test.ts`
- Create: `liv-clinic/src/components/sections/InternationalNotice.tsx` (+ `index.ts` export)
- Create: `liv-clinic/src/components/sections/__tests__/internationalNotice.presence.test.ts`
- Modify: 17개 `*Detail.tsx` (`UltheraDetail`, `ThermageDetail`, `OndaDetail`, `DensityDetail`, `InModeDetail`, `ShurinkDetail`, `ThreadDetail`, `AptosDetail`, `BotoxDetail`, `FillerDetail`, `SkinboosterDetail`, `SkincareDetail`(없으면 `antiaging/skincare/page.tsx`가 쓰는 컴포넌트), `PigmentationDetail`, `VascularDetail`, `SkinToneDetail`, `HairRemovalDetail`, `TattooRemovalDetail`)
- Modify: `liv-clinic/src/lib/schemaI18n.ts` (`buildTreatmentLeafSchemas` FAQ 병합), 5개 `laser/*/layout.tsx` (`serviceData.faqs` 병합)

**Interfaces:**
- Produces: `TREATMENT_FOREIGN_IDS`, `type TreatmentForeignId`, `getTreatmentForeignInfo(id, locale): ForeignInfo | null`, `getTreatmentForeignFaqs(id, locale): { q: string; a: string }[]`.
- `ForeignInfo = { name: string; duration: string; stay: string; guideSlug?: string; faqs: { q: string; a: string }[] }` + 로케일 공통 `ForeignCommon = { heading; eyebrow; price; priceDesc; time; language; languageDesc; payment; paymentDesc; ctaInternational; ctaGuide; ctaBook }`.

- [ ] **Step 1: 실패하는 테스트**

`liv-clinic/src/lib/__tests__/treatmentsForeign.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { TREATMENT_FOREIGN_IDS, getTreatmentForeignInfo, getTreatmentForeignFaqs, FOREIGN_COMMON } from '@/lib/treatmentsForeign';

const LOCALES = ['en', 'ja', 'zh', 'zh-TW'] as const;
const HANGUL = /[가-힯]/;
// P0 zh-tw-international-fix.py의 간체 전용 글자 + P1에서 추가 발견한 글자
const SIMPLIFIED = /[于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务预约线网针国际须区号层还问银韩现]/;

describe('treatmentsForeign', () => {
  it('covers all 17 treatment pages in all 4 locales without Korean text', () => {
    expect(TREATMENT_FOREIGN_IDS).toHaveLength(17);
    for (const id of TREATMENT_FOREIGN_IDS) {
      for (const locale of LOCALES) {
        const info = getTreatmentForeignInfo(id, locale);
        expect(info, `${id}/${locale}`).not.toBeNull();
        expect(info!.name.length).toBeGreaterThan(1);
        expect(info!.duration.length).toBeGreaterThan(1);
        expect(info!.stay.length).toBeGreaterThan(3);
        expect(info!.faqs).toHaveLength(2);
        for (const s of [info!.name, info!.duration, info!.stay, ...info!.faqs.flatMap((f) => [f.q, f.a])]) {
          expect(s, `${id}/${locale}: ${s}`).not.toMatch(HANGUL);
          if (locale === 'zh-TW') expect(s, `${id}/zh-TW: ${s}`).not.toMatch(SIMPLIFIED);
        }
      }
    }
  });
  it('returns null / [] for non-guide locales', () => {
    expect(getTreatmentForeignInfo('ulthera', 'ko')).toBeNull();
    expect(getTreatmentForeignFaqs('ulthera', 'vi')).toEqual([]);
  });
  it('common strings never mention 유치기관 or discounts', () => {
    for (const locale of LOCALES) {
      const all = Object.values(FOREIGN_COMMON[locale]).join(' ');
      expect(all).not.toMatch(/유치기관|discount|割引|折扣|优惠|優惠/i);
    }
  });
});
```

`liv-clinic/src/components/sections/__tests__/internationalNotice.presence.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(__dirname, '..');
const FILES: Record<string, string> = {
  UltheraDetail: 'ulthera', ThermageDetail: 'thermage', OndaDetail: 'onda', DensityDetail: 'density', InModeDetail: 'inmode',
  ShurinkDetail: 'shurink', ThreadDetail: 'thread', AptosDetail: 'aptos', BotoxDetail: 'botox', FillerDetail: 'filler',
  SkinboosterDetail: 'skinbooster', PigmentationDetail: 'pigmentation', VascularDetail: 'vascular', SkinToneDetail: 'skintone',
  HairRemovalDetail: 'hair-removal', TattooRemovalDetail: 'tattoo',
};

describe('InternationalNotice is mounted on every treatment detail', () => {
  for (const [file, id] of Object.entries(FILES)) {
    it(`${file}.tsx renders <InternationalNotice treatmentId="${id}" />`, () => {
      const src = fs.readFileSync(path.join(DIR, `${file}.tsx`), 'utf8');
      expect(src).toMatch(new RegExp(`<InternationalNotice\\s+treatmentId="${id}"`));
    });
  }
});
```
(skincare 상세 컴포넌트 파일명은 실행 시 `antiaging/skincare/page.tsx`에서 확인해 표에 추가한다 — 17번째.)

- [ ] **Step 2: 실패 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/__tests__/treatmentsForeign.test.ts src/components/sections/__tests__
```
Expected: FAIL (모듈 없음 / 정규식 불일치).

- [ ] **Step 3: 사전 모듈**

`liv-clinic/src/lib/treatmentsForeign.ts` 구조(값은 `_facts.md` §4 duration·§5 stay.rows·시술명 메시지에서 옮긴다; 아래는 en·ulthera 예시와 템플릿 함수):
```ts
/**
 * 시술 페이지 "외국인 환자 안내" 블록(P1-2) — en·ja·zh·zh-TW 전용 사전.
 * 번역 JSON에 키를 추가하지 않기 위해 TS에 둔다. 값은 사이트에 이미 있는 사실만:
 *   duration ← treatmentsI18n / laser layout serviceData, stay ← international.stay.rows(6종) 또는 공통 문장,
 *   name ← treatments.{cat}.{id}.name 메시지. 비행 가능 시점 등 사이트에 없는 수치는 넣지 않는다(D6).
 */
import { isGuideLocale, type GuideLocale } from '@/lib/guides/types';

export const TREATMENT_FOREIGN_IDS = [
  'ulthera', 'thermage', 'onda', 'density', 'inmode', 'shurink', 'thread', 'aptos',
  'botox', 'filler', 'skinbooster', 'skincare',
  'pigmentation', 'vascular', 'skintone', 'hair-removal', 'tattoo',
] as const;
export type TreatmentForeignId = (typeof TREATMENT_FOREIGN_IDS)[number];

export interface ForeignCommon {
  eyebrow: string; heading: string;
  price: string; priceDesc: string;
  time: string;
  language: string; languageDesc: string;
  payment: string; paymentDesc: string;
  ctaInternational: string; ctaGuide: string; ctaBook: string;
  /** 당일 시술·재방문 표기가 사이트에 없는 시술의 공통 문장 */
  stayGeneric: string;
  faqPrice: (name: string) => { q: string; a: string };
  faqStay: (name: string, duration: string, stay: string) => { q: string; a: string };
}

export const FOREIGN_COMMON: Record<GuideLocale, ForeignCommon> = {
  en: {
    eyebrow: 'For international patients', heading: 'Visiting from abroad?',
    price: 'Same price list', priceDesc: 'International patients pay from the same price list as local patients. Prices are per session and exclude VAT.',
    time: 'Time & stay',
    language: 'Language', languageDesc: 'Consultations in English, Japanese and Chinese; interpretation arranged free of charge on request. WhatsApp · LINE · WeChat · live chat.',
    payment: 'Payment', paymentDesc: 'Visa · Mastercard · American Express · JCB · UnionPay · KRW cash',
    ctaInternational: 'Information for international patients', ctaGuide: 'Read the guide', ctaBook: 'Book a consultation',
    stayGeneric: 'Usually completed in a single visit; whether a follow-up is needed is confirmed at your consultation.',
    faqPrice: (name) => ({ q: `Do international patients pay more for ${name}?`, a: `No. The same price list applies to everyone, with no foreigner surcharge and no fee for interpretation. Prices are per session and exclude VAT.` }),
    faqStay: (name, duration, stay) => ({ q: `How long should I plan for ${name} in Seoul?`, a: `The treatment itself takes about ${duration}. ${stay} Most patients are treated on the same day as their consultation.` }),
  },
  ja: { /* 같은 구조 — 値段は同一料金表·VAT別途, 当日施術, LINE優先 */ },
  zh: { /* 같은 구조 — 微信优先 */ },
  'zh-TW': { /* 같은 구조 — 번체, LINE·WhatsApp */ },
};

interface ForeignEntry { name: string; duration: string; stay?: string; guideSlug?: string }

/** [locale][id] — stay가 없으면 FOREIGN_COMMON.stayGeneric */
const ENTRIES: Record<GuideLocale, Record<TreatmentForeignId, ForeignEntry>> = {
  en: {
    ulthera: { name: 'Ultherapy Prime', duration: '60–90 minutes', stay: 'Same day · no revisit required.', guideSlug: 'ultherapy-cost-seoul' },
    thermage: { name: 'Thermage FLX', duration: '60–90 minutes', stay: 'Same day · no revisit required.', guideSlug: 'ultherapy-vs-thermage-vs-shurink' },
    // ... 나머지 15개: duration은 _facts.md §4의 en 값, laser 5종은 layout serviceData의 값을 영어로
  },
  // ja / zh / zh-TW 동일 구조
};

export interface ForeignInfo extends ForeignEntry { stay: string; faqs: { q: string; a: string }[] }

export function getTreatmentForeignInfo(id: TreatmentForeignId, locale: string): ForeignInfo | null {
  if (!isGuideLocale(locale)) return null;
  const common = FOREIGN_COMMON[locale];
  const entry = ENTRIES[locale][id];
  const stay = entry.stay ?? common.stayGeneric;
  return { ...entry, stay, faqs: [common.faqPrice(entry.name), common.faqStay(entry.name, entry.duration, stay)] };
}

export function getTreatmentForeignFaqs(id: TreatmentForeignId, locale: string): { q: string; a: string }[] {
  return getTreatmentForeignInfo(id, locale)?.faqs ?? [];
}
```

- [ ] **Step 4: 블록 컴포넌트**

`liv-clinic/src/components/sections/InternationalNotice.tsx`:
```tsx
'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FOREIGN_COMMON, getTreatmentForeignInfo, type TreatmentForeignId } from '@/lib/treatmentsForeign';
import { isGuideLocale } from '@/lib/guides/types';
import { isGuidePublished } from '@/lib/guides/publicIndex';

export default function InternationalNotice({ treatmentId }: { treatmentId: TreatmentForeignId }) {
  const locale = useLocale();
  if (!isGuideLocale(locale)) return null;
  const info = getTreatmentForeignInfo(treatmentId, locale);
  if (!info) return null;
  const c = FOREIGN_COMMON[locale];
  const guideHref = info.guideSlug && isGuidePublished(locale, info.guideSlug) ? `/guides/${info.guideSlug}` : null;
  const cells = [
    { title: c.price, body: c.priceDesc },
    { title: c.time, body: `${info.duration} · ${info.stay}` },
    { title: c.language, body: c.languageDesc },
    { title: c.payment, body: c.paymentDesc },
  ];
  return (
    <section className="section-gap-sm bg-white" aria-labelledby="intl-notice">
      <div className="container-custom">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-background p-6 md:p-10">
          <p className="mb-2 font-serif text-h4 text-primary">{c.eyebrow}</p>
          <h2 id="intl-notice" className="mb-6 text-h2 text-secondary">{c.heading} · {info.name}</h2>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cells.map((cell) => (
              <div key={cell.title} className="rounded-2xl bg-white p-5">
                <dt className="mb-1 text-small font-medium text-secondary">{cell.title}</dt>
                <dd className="text-small leading-relaxed text-mono">{cell.body}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 divide-y divide-border rounded-2xl bg-white">
            {info.faqs.map((f) => (
              <details key={f.q} className="px-5 py-4">
                <summary className="cursor-pointer list-none text-small font-medium text-secondary">{f.q}</summary>
                <p className="mt-2 text-small leading-relaxed text-mono">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/contact" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-secondary">{c.ctaBook}</Link>
            <Link href="/international" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white">{c.ctaInternational}</Link>
            {guideHref && (
              <Link href={guideHref} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-border px-6 py-3 font-medium text-secondary transition-colors hover:border-primary">{c.ctaGuide}</Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```
`src/components/sections/index.ts`에 `export { default as InternationalNotice } from './InternationalNotice';` 추가.

- [ ] **Step 5: 17개 상세 컴포넌트에 삽입**

각 `*Detail.tsx`에서 `{/* FAQ` 주석이 있는 섹션 **바로 앞**에 `<InternationalNotice treatmentId="<id>" />`를 넣는다(FAQ 섹션이 없으면 마지막 CTA 섹션 앞). import: `import InternationalNotice from './InternationalNotice';`. 삽입 위치를 찾는 명령:
```bash
cd /d/dev/LIV_homepage/liv-clinic && grep -n "{/\* FAQ\|FAQ Section\|<section" src/components/sections/UltheraDetail.tsx | tail -8
```

- [ ] **Step 6: 스키마 FAQ 병합**

`schemaI18n.ts` `buildTreatmentLeafSchemas`:
```ts
import { getTreatmentForeignFaqs, type TreatmentForeignId } from './treatmentsForeign';
// serviceData.faqs:
    faqs: [
      ...(loc.faqs ?? []).map((f) => ({ q: f.q, a: f.a })),
      ...getTreatmentForeignFaqs(id as TreatmentForeignId, locale),
    ],
```
5개 laser layout: `serviceData` 정의는 모듈 레벨이라 로케일을 모른다 → 레이아웃 본문에서 `{ ...serviceData, name, description, faqs: [...serviceData.faqs, ...getTreatmentForeignFaqs('tattoo', locale)] }` 식으로 병합(파일별 id: pigmentation·vascular·skintone·hair-removal·tattoo).

- [ ] **Step 7: 테스트·타입·화면 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/__tests__/treatmentsForeign.test.ts src/components/sections/__tests__ && npx tsc --noEmit && npx eslint src/lib/treatmentsForeign.ts src/components/sections/InternationalNotice.tsx src/lib/schemaI18n.ts
```
Expected: PASS, tsc 0, 신규 lint 오류 0. 빌드 후 `curl -sk http://localhost:3010/ja/lifting/ulthera | grep -c "海外からの"` ≥ 1, `/ko/lifting/ulthera`에는 블록 문자열 0, `/en/lifting/ulthera`의 JSON-LD에 "Do international patients pay more" 포함.

- [ ] **Step 8: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/src/lib/treatmentsForeign.ts liv-clinic/src/lib/__tests__/treatmentsForeign.test.ts liv-clinic/src/components/sections liv-clinic/src/lib/schemaI18n.ts "liv-clinic/src/app/[locale]/laser" && git commit -m "feat(seo): 시술 상세 17종에 외국인 환자 안내 블록(en·ja·zh·zh-TW) + FAQ 스키마 병합

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 가격 페이지 외국인 안내 (P1-3)

**Files:**
- Create: `liv-clinic/src/lib/pricingForeign.ts`
- Create: `liv-clinic/src/components/sections/InternationalPricingNote.tsx`
- Modify: `liv-clinic/src/components/sections/PricingGuide.tsx` (표 아래·안내문 위)
- Modify: `liv-clinic/src/app/[locale]/pricing/layout.tsx` (외국어 4개 로케일 메타 설명에 "same price · VAT excluded · cards" 요지 — `pricingGuide.hero.description` 그대로 두고 `description`에 `PRICING_FOREIGN[locale].metaSuffix`를 이어 붙인다)
- Test: `liv-clinic/src/lib/__tests__/pricingForeign.test.ts`

**Interfaces:**
- Produces: `PRICING_FOREIGN: Record<GuideLocale, { heading: string; items: string[]; metaSuffix: string; ctaInternational: string; ctaGuides: string }>`.

- [ ] **Step 1: 실패하는 테스트**

```ts
import { describe, it, expect } from 'vitest';
import { PRICING_FOREIGN } from '@/lib/pricingForeign';

describe('PRICING_FOREIGN', () => {
  it('has 4 locales, 3–5 items each, VAT wording consistent with pricingGuide.notes.vat', () => {
    for (const locale of ['en', 'ja', 'zh', 'zh-TW'] as const) {
      const p = PRICING_FOREIGN[locale];
      expect(p.items.length).toBeGreaterThanOrEqual(3);
      expect(p.items.join(' ')).toMatch(/VAT/);
      expect(p.items.join(' ')).not.toMatch(/[가-힯]/);
      expect(p.metaSuffix.length).toBeLessThan(120);
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/lib/__tests__/pricingForeign.test.ts` → 모듈 없음.

- [ ] **Step 3: 사전과 컴포넌트**

`liv-clinic/src/lib/pricingForeign.ts` (en 예시; ja/zh/zh-TW 같은 구조, 결제수단 문자열은 `international.payment.methods` 값을 그대로):
```ts
import type { GuideLocale } from '@/lib/guides/types';

export const PRICING_FOREIGN: Record<GuideLocale, { heading: string; items: string[]; metaSuffix: string; ctaInternational: string; ctaGuides: string }> = {
  en: {
    heading: 'For international patients',
    items: [
      'International patients pay from this same price list — there is no foreigner surcharge.',
      'Prices are per session and exclude VAT; the final amount is confirmed after your consultation.',
      'Payment: Visa · Mastercard · American Express · JCB · UnionPay · KRW cash.',
      'Consultations in English, Japanese and Chinese; interpretation arranged free of charge on request.',
    ],
    metaSuffix: 'Same prices for international patients, VAT excluded, international cards accepted.',
    ctaInternational: 'Information for international patients',
    ctaGuides: 'Guides for international patients',
  },
  ja: { /* 同一料金表・VAT別途・海外カード・日本語対応 */ },
  zh: { /* … */ },
  'zh-TW': { /* … */ },
};
```
`InternationalPricingNote.tsx`('use client'; `useLocale`; 로케일이 guide locale이 아니면 null; 제목 + `<ul>` + 링크 2개(`/international`, 게시 가이드가 있으면 `/guides`)). `PricingGuide.tsx`의 표 목록 `</div>` 뒤, `PRICING_GUIDE_NOTE_KEYS` 안내문 앞에 `<InternationalPricingNote />`.

- [ ] **Step 4: 확인·커밋**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/__tests__/pricingForeign.test.ts && npx tsc --noEmit && cd /d/dev/LIV_homepage && git add liv-clinic/src/lib/pricingForeign.ts liv-clinic/src/lib/__tests__/pricingForeign.test.ts liv-clinic/src/components/sections/InternationalPricingNote.tsx liv-clinic/src/components/sections/PricingGuide.tsx liv-clinic/src/components/sections/index.ts "liv-clinic/src/app/[locale]/pricing/layout.tsx" && git commit -m "feat(seo): 가격 페이지 외국인 안내(동일 가격·VAT 별도·해외 카드) en·ja·zh·zh-TW

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: 관리자 후기 직접 등록 (P1-4, B6)

관리자가 환자에게 받은 후기를 여러 작성자명으로 직접 등록한다. 필드: 작성자 표시명·언어·국가(선택)·시술 분류·별점·내용·받은 날짜·바로 게시·치료 확인 표시. **출처·동의 항목 없음.** 등록 즉시 게시를 고르면 해당 언어 후기 페이지의 noindex가 자동 해제된다(P0 T9, `revalidatePath`로 갱신).

**Files:**
- Create: `liv-clinic/src/lib/reviews/adminReviewInput.ts`
- Create: `liv-clinic/src/lib/reviews/__tests__/adminReviewInput.test.ts`
- Modify: `liv-clinic/src/app/api/admin/reviews/route.ts` (POST 추가)
- Create: `liv-clinic/src/components/admin/ReviewDirectForm.tsx`
- Modify: `liv-clinic/src/app/admin/(authenticated)/reviews/page.tsx` (버튼 + 폼 토글 + 등록 후 목록 새로고침)

**Interfaces:**
- Produces: `adminReviewInputSchema`(zod), `type AdminReviewInput`, `toReviewInsert(input): Database['public']['Tables']['reviews']['Insert']`, `REVIEW_TREATMENT_KEYS`(공개 폼과 같은 키: `lifting|antiaging|laser|signature|botox|filler|skinbooster|other` — `ReviewsList`가 `form.treatmentOptions.<key>`로 라벨을 찾으므로 자유 입력 금지).
- Consumes: `createServerClient`/`createAdminClient`, `revalidatePath`.

- [ ] **Step 1: 실패하는 테스트**

`liv-clinic/src/lib/reviews/__tests__/adminReviewInput.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { adminReviewInputSchema, toReviewInsert } from '../adminReviewInput';

const valid = {
  locale: 'en', author_name: 'Sarah K.', country: 'Singapore', treatment_category: 'lifting', rating: 5,
  content: 'Ultherapy went smoothly and the staff explained everything in English.',
  received_on: '2026-08-20', is_published: true, is_verified: false,
};

describe('adminReviewInputSchema', () => {
  it('accepts a complete input', () => {
    expect(adminReviewInputSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects unknown treatment keys, bad ratings, short content, bad dates', () => {
    expect(adminReviewInputSchema.safeParse({ ...valid, treatment_category: 'Ultherapy' }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, content: 'too short' }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, received_on: '2026/08/20' }).success).toBe(false);
    expect(adminReviewInputSchema.safeParse({ ...valid, locale: 'xx' }).success).toBe(false);
  });
  it('has no source/consent fields', () => {
    const keys = Object.keys(adminReviewInputSchema.shape);
    expect(keys).not.toContain('source');
    expect(keys).not.toContain('consent');
  });
  it('maps to a reviews insert with created_at at noon KST of the received date', () => {
    const row = toReviewInsert(adminReviewInputSchema.parse(valid));
    expect(row).toMatchObject({ locale: 'en', author_name: 'Sarah K.', country: 'Singapore', treatment_category: 'lifting', rating: 5, source: 'onsite', is_published: true, is_verified: false });
    expect(row.created_at).toBe('2026-08-20T12:00:00+09:00');
  });
  it('omits created_at when no date given and nulls empty country', () => {
    const row = toReviewInsert(adminReviewInputSchema.parse({ ...valid, received_on: undefined, country: '' }));
    expect(row.created_at).toBeUndefined();
    expect(row.country).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/lib/reviews` → 모듈 없음.

- [ ] **Step 3: 스키마 모듈**

`liv-clinic/src/lib/reviews/adminReviewInput.ts`:
```ts
import { z } from 'zod';
import type { Database } from '@/types/supabase';
import { LOCALES } from '@/i18n/routing';

/** 공개 후기 폼과 같은 키 — ReviewsList가 reviews.form.treatmentOptions.<key>로 라벨을 찾는다. */
export const REVIEW_TREATMENT_KEYS = ['lifting', 'antiaging', 'laser', 'signature', 'botox', 'filler', 'skinbooster', 'other'] as const;

/** 관리자 직접 등록 입력. 출처·동의 항목은 의도적으로 없다(2026-09-06 지시). */
export const adminReviewInputSchema = z.object({
  locale: z.enum(LOCALES),
  author_name: z.string().trim().min(1, '이름을 입력해 주세요').max(60, '이름은 60자까지'),
  country: z.string().trim().max(60).optional(),
  treatment_category: z.enum(REVIEW_TREATMENT_KEYS),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(10, '내용은 10자 이상').max(2000, '내용은 2000자까지'),
  /** 후기를 받은 날짜(YYYY-MM-DD). 비우면 등록 시각 */
  received_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD').optional(),
  is_published: z.boolean().default(false),
  is_verified: z.boolean().default(false),
});
export type AdminReviewInput = z.infer<typeof adminReviewInputSchema>;

type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

export function toReviewInsert(input: AdminReviewInput): ReviewInsert {
  return {
    locale: input.locale,
    author_name: input.author_name,
    country: input.country && input.country.length > 0 ? input.country : null,
    treatment_category: input.treatment_category,
    rating: input.rating,
    content: input.content,
    source: 'onsite',
    is_published: input.is_published,
    is_verified: input.is_verified,
    ...(input.received_on ? { created_at: `${input.received_on}T12:00:00+09:00` } : {}),
  };
}
```

- [ ] **Step 4: POST 핸들러**

`liv-clinic/src/app/api/admin/reviews/route.ts`에 추가:
```ts
import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminReviewInputSchema, toReviewInsert } from '@/lib/reviews/adminReviewInput';

// 관리자 직접 등록 — 환자에게 받은 후기를 관리자가 대신 입력한다.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = adminReviewInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.from('reviews').insert(toReviewInsert(parsed.data)).select().single();
    if (error) {
      console.error('POST /api/admin/reviews failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    try {
      revalidatePath('/', 'layout'); // 후기 페이지(및 noindex 판정) 갱신
    } catch (revalidateError) {
      console.warn('revalidatePath after review insert failed:', revalidateError);
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/reviews error:', e);
    return NextResponse.json({ error: '후기 등록에 실패했습니다.' }, { status: 500 });
  }
}
```

- [ ] **Step 5: 폼 컴포넌트**

`liv-clinic/src/components/admin/ReviewDirectForm.tsx` — 쉬운 한국어 라벨(운영자 피드백), 관리자 화면 색상 토큰(`#6d4e42`, `#b4988d`, `#e5e5e5`, `#575756`) 사용:
```tsx
'use client';

import { useState } from 'react';
import { LOCALES } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';
import { REVIEW_TREATMENT_KEYS } from '@/lib/reviews/adminReviewInput';

const TREATMENT_LABELS: Record<(typeof REVIEW_TREATMENT_KEYS)[number], string> = {
  lifting: '리프팅', antiaging: '안티에이징', laser: '레이저', signature: '시그니처', botox: '보톡스', filler: '필러', skinbooster: '스킨부스터', other: '기타',
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ReviewDirectForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    locale: 'en', author_name: '', country: '', treatment_category: 'lifting', rating: 5, content: '',
    received_on: today(), is_published: true, is_verified: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, country: form.country || undefined, received_on: form.received_on || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? '등록에 실패했습니다.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full min-h-[44px] rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-[#575756] focus:border-[#b4988d] focus:outline-none';
  const label = 'block text-xs text-[#8a8a8a] mb-1';

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-[#e5e5e5] p-4 lg:p-5 grid gap-4">
      <h3 className="font-bold text-[#6d4e42]">후기 직접 등록</h3>
      <p className="text-xs text-[#8a8a8a]">환자에게 받은 후기를 대신 올립니다. 표시될 이름은 자유롭게 적을 수 있습니다.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>표시될 이름 *</label><input className={input} value={form.author_name} onChange={(e) => set('author_name', e.target.value)} maxLength={60} required /></div>
        <div><label className={label}>언어 *</label>
          <select className={input} value={form.locale} onChange={(e) => set('locale', e.target.value)}>
            {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_META[l].name} ({l})</option>)}
          </select></div>
        <div><label className={label}>나라 (선택)</label><input className={input} value={form.country} onChange={(e) => set('country', e.target.value)} maxLength={60} placeholder="예: Singapore" /></div>
        <div><label className={label}>시술 *</label>
          <select className={input} value={form.treatment_category} onChange={(e) => set('treatment_category', e.target.value as typeof form.treatment_category)}>
            {REVIEW_TREATMENT_KEYS.map((k) => <option key={k} value={k}>{TREATMENT_LABELS[k]}</option>)}
          </select></div>
        <div><label className={label}>별점 *</label>
          <select className={input} value={form.rating} onChange={(e) => set('rating', Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
          </select></div>
        <div><label className={label}>받은 날짜</label><input type="date" className={input} value={form.received_on} onChange={(e) => set('received_on', e.target.value)} max={today()} /></div>
      </div>
      <div><label className={label}>내용 * (10~2000자)</label>
        <textarea className={`${input} min-h-[120px]`} value={form.content} onChange={(e) => set('content', e.target.value)} minLength={10} maxLength={2000} required />
        <p className="text-xs text-[#8a8a8a] mt-1 text-right">{form.content.length} / 2000</p></div>
      <div className="flex flex-wrap gap-4 text-sm text-[#575756]">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} /> 바로 게시</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_verified} onChange={(e) => set('is_verified', e.target.checked)} /> 치료 확인 표시</label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="min-h-[44px] px-4 rounded-lg border border-[#e5e5e5] text-sm text-[#575756]">취소</button>
        <button type="submit" disabled={saving} className="min-h-[44px] px-5 rounded-lg bg-[#b4988d] text-white text-sm disabled:opacity-50">{saving ? '등록 중…' : '등록'}</button>
      </div>
    </form>
  );
}
```
관리자 페이지: 제목 옆에 `후기 직접 등록` 버튼(`showForm` 토글), 필터 위에 `{showForm && <ReviewDirectForm onSaved={() => { setShowForm(false); fetchReviews(); }} onCancel={() => setShowForm(false)} />}`.

- [ ] **Step 6: 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/reviews && npx tsc --noEmit && npx eslint src/lib/reviews src/app/api/admin/reviews/route.ts src/components/admin/ReviewDirectForm.tsx "src/app/admin/(authenticated)/reviews/page.tsx"
```
Expected: PASS, tsc 0, 신규 lint 오류 0. 빌드 후 로컬 서버에서 `curl -sk -X POST -H 'content-type: application/json' -d '{}' -o /dev/null -w "%{http_code}\n" http://localhost:3010/api/admin/reviews` → `401`(세션 없음). 화면 확인은 Playwright MCP로 `/admin/login` 로그인 후 `/admin/reviews`에서 폼을 열고 **저장하지 않고** 스크린샷(`D:\dev\LIV_homepage\p1-admin-review-form.png`) — 실제 등록은 프로덕션 DB에 쓰이므로 하지 않는다(로컬도 같은 DB).

- [ ] **Step 7: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/src/lib/reviews liv-clinic/src/app/api/admin/reviews/route.ts liv-clinic/src/components/admin/ReviewDirectForm.tsx "liv-clinic/src/app/admin/(authenticated)/reviews/page.tsx" && git commit -m "feat(admin): 후기 직접 등록 — 작성자명·언어·국가·시술·별점·내용·받은 날짜, 바로 게시 (출처·동의 항목 없음)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: 9월 프로모션 외국어 설명 (P1-5, B7)

DB의 `2026-09-promotion` 설명은 한국어도 한 줄("리브성형외과 9월 프로모션")뿐이고, 조건은 포스터 8장에만 있다(2026-09-06 확인: 제목 "LIV 한가위 얼리 셀렉션", 기간 ~9/30, VAT 별도, "메세지 수신자 해당", 원데이 프로그램 30~79만원, 필러 프로그램 29~99만원, APTOS 패키지 100~300만원(온다 1회 포함), 온다 바디 90만원, 보톡스 DAY 5~12만원(국산), 프리미엄 리프팅 프로그램 159~390만원, 색소올킬 10주 90만원). 포스터 상단 배지가 "9월 이벤트 미정 / SEPTEMBER EVENT TBA"로 남아 있다(아트워크 오류로 보임 → 보고).

**Files:**
- Create: `docs/05-handoff/event-2026-09-foreign-copy.md` (초안 + 반영 절차)
- Create: `D:\dev\LIV_homepage\apply-event-2026-09-copy.mjs` (pg, `--commit` 없으면 dry-run)
- Modify: `liv-clinic/src/app/[locale]/events/[eventId]/page.tsx` (metadata의 `titleMap/descMap`을 `pickLocalized`로 — zh-TW가 한국어로 떨어지는 버그)
- Test: `liv-clinic/src/lib/__tests__/i18nFallback.test.ts` (없으면 생성: zh-TW → zh 폴백 확인)

- [ ] **Step 1: 초안 문서 작성**

`docs/05-handoff/event-2026-09-foreign-copy.md` 본문(사장님이 그대로 확인·수정):
```markdown
# 9월 프로모션(2026-09-promotion) 외국어 설명 초안 — 2026-09-06

근거: 관리자 이벤트의 한국어 포스터·갤러리 8장(DB 설명란은 한 줄뿐). 아래 문장은 포스터 조건만 옮겼고 새 조건을 만들지 않았다.
확인 필요: (1) 포스터 배지 "9월 이벤트 미정 / SEPTEMBER EVENT TBA"가 의도인지 (2) "메세지 수신자 해당" 조건을 외국어 설명에도 넣을지(아래 초안은 "예약 시 이벤트를 말씀해 주세요"로 완화) (3) 제목을 바꿀지(D5 기본: 유지)

## 한국어 (description_ko — 현재 "리브성형외과 9월 프로모션")
LIV 한가위 얼리 셀렉션. 9월 30일까지 원데이 피부 프로그램, 필러 프로그램, APTOS 실리프팅 패키지(온다 1회 포함), 보톡스 DAY 특가, 프리미엄 리프팅 프로그램, 색소올킬 10주 관리를 이벤트가로 진행합니다. 가격은 1회 기준·VAT 별도이며 개인별 상담 후 확정됩니다. 예약·문의 02-797-2773, 카카오채널 @리브성형외과.

## English (description_en)
LIV Chuseok Early Selection, through September 30. Event pricing on one-day skin programs (pores, pigmentation, acne, hydration), filler programs, APTOS thread-lift packages with one ONDA session included, a Botox day special, premium lifting programs combining Ultherapy Prime, Thermage FLX, Density and ONDA, and a 10-week pigmentation care program. Prices are per session and exclude VAT; the final plan is confirmed at your consultation. International patients pay the same event prices — please mention this event when you book by WhatsApp, LINE, WeChat or live chat.

## 日本語 (description_ja)
LIV 秋夕（チュソク）アーリーセレクション、9月30日まで。ワンデー肌プログラム（毛穴・色素・ニキビ・保湿）、フィラープログラム、ONDA 1回付きのAPTOS糸リフトパッケージ、ボトックスDAY特価、ウルセラプライム・サーマクールFLX・デンシティ・ONDAを組み合わせたプレミアムリフティングプログラム、10週間の色素ケアプログラムをイベント価格でご案内します。料金は1回あたり・VAT別途で、最終的な施術計画はカウンセリングで決まります。海外からの患者さまも同じイベント価格です。LINE・WhatsApp・チャットでご予約の際に本イベントをお伝えください。

## 中文（简体, description_zh — zh-TW 页面也显示此文）
LIV 中秋早鸟精选，活动至9月30日。一日护肤项目（毛孔、色素、痘痘、补水）、玻尿酸项目、含一次 ONDA 的 APTOS 线雕套餐、肉毒素日特价、结合超声刀 Prime／热玛吉 FLX／Density／ONDA 的高端提升项目，以及为期10周的色素管理项目，均以活动价提供。价格为单次、不含增值税，最终方案以面诊为准。国际患者享受同样的活动价，请在通过微信、WhatsApp、LINE 或在线聊天预约时告知本活动。

## 반영 방법 (둘 중 하나)
A. 관리자 화면: https://liv-clinic.net/admin/events → "9월 프로모션" 편집 → 설명(한국어/English/日本語/中文) 칸에 위 문장 붙여넣기 → 저장. (저장 시 팝업이 자동 갱신된다 — 041 트리거)
B. 스크립트: `NODE_TLS_REJECT_UNAUTHORIZED=0 node D:\dev\LIV_homepage\apply-event-2026-09-copy.mjs` (변경 전후를 출력만) → 확인 후 `--commit`.
반영 후 확인: `/en/events` 카드와 `/en/events/2026-09-promotion` 본문·meta description에 새 문장, `/zh-TW/events/2026-09-promotion`도 중문 표시.
```
(제목 변경 선택지: en "September Promotion — Chuseok Early Selection (until Sep 30)" 등 4개 언어를 문서 끝에 "선택"으로 덧붙인다.)

- [ ] **Step 2: 반영 스크립트**

`D:\dev\LIV_homepage\apply-event-2026-09-copy.mjs`:
```js
// 9월 프로모션 외국어 설명 반영. 기본 dry-run, --commit 있을 때만 UPDATE. 문안은 docs/05-handoff/event-2026-09-foreign-copy.md와 동일해야 한다.
import fs from 'node:fs';
import pg from 'file:///D:/dev/LIV_homepage/liv-clinic/node_modules/pg/lib/index.js';
const COPY = {
  description_ko: '…(문서의 한국어 문단)…',
  description_en: '…',
  description_ja: '…',
  description_zh: '…',
};
const env = fs.readFileSync('D:/dev/LIV_homepage/liv-clinic/.env.local', 'utf8');
const url = env.match(/^DATABASE_URL=["']?([^"'\r\n]+)/m)[1];
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
const before = await client.query("select description_ko, description_en, description_ja, description_zh from events where slug='2026-09-promotion'");
console.log('BEFORE', before.rows[0]);
if (process.argv.includes('--commit')) {
  const r = await client.query(
    "update events set description_ko=$1, description_en=$2, description_ja=$3, description_zh=$4, updated_at=now() where slug='2026-09-promotion' returning slug, updated_at",
    [COPY.description_ko, COPY.description_en, COPY.description_ja, COPY.description_zh],
  );
  console.log('UPDATED', r.rows[0]);
} else {
  console.log('DRY RUN — add --commit to apply. WOULD SET', COPY);
}
await client.end();
```

- [ ] **Step 3: 이벤트 상세 메타데이터 폴백 수정 + 테스트**

`liv-clinic/src/lib/__tests__/i18nFallback.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pickLocalized } from '@/lib/i18nFallback';

describe('pickLocalized (event copy)', () => {
  const c = { ko: '한국어', en: 'English', ja: '日本語', zh: '中文' };
  it('zh-TW falls back to zh, never ko while zh/en exist', () => {
    expect(pickLocalized(c, 'zh-TW')).toBe('中文');
    expect(pickLocalized({ ...c, zh: '' }, 'zh-TW')).toBe('English');
  });
  it('vi/th/ru/fr/mn/ar fall back to en', () => {
    for (const l of ['vi', 'th', 'ru', 'fr', 'mn', 'ar'] as const) expect(pickLocalized(c, l)).toBe('English');
  });
});
```
`events/[eventId]/page.tsx` `generateMetadata`: `titleMap/descMap` 대신
```ts
  const title = pickLocalized({ ko: event.title_ko, en: event.title_en, ja: event.title_ja, zh: event.title_zh }, locale as Locale) || event.title_ko;
  const description = pickLocalized({ ko: event.description_ko, en: event.description_en, ja: event.description_ja, zh: event.description_zh }, locale as Locale) || event.description_ko;
```
(zh-TW·vi 등 7개 로케일의 이벤트 상세 meta가 한국어로 나가던 문제. `FALLBACK_TITLES`도 `getSiteName(locale)`로 11개 로케일 대응.)

- [ ] **Step 4: 확인·커밋 (DB 반영은 하지 않는다)**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx vitest run src/lib/__tests__/i18nFallback.test.ts && npx tsc --noEmit && NODE_TLS_REJECT_UNAUTHORIZED=0 node /d/dev/LIV_homepage/apply-event-2026-09-copy.mjs | head -20
```
Expected: 테스트 PASS, 스크립트는 BEFORE(현재 한 줄 설명)와 DRY RUN 출력만.
```bash
cd /d/dev/LIV_homepage && git add docs/05-handoff/event-2026-09-foreign-copy.md "liv-clinic/src/app/[locale]/events/[eventId]/page.tsx" liv-clinic/src/lib/__tests__/i18nFallback.test.ts && git commit -m "docs(events): 9월 프로모션 외국어 설명 초안·반영 절차, 이벤트 상세 meta의 zh-TW 등 폴백 수정

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```
(`apply-event-2026-09-copy.mjs`는 상위 작업 폴더의 스크립트라 커밋하지 않는다.)

---

### Task 9: zh-TW 간체 잔존 교정 (P0 후속)

P0에서 85개를 고쳤지만 `international`·`metaSeo.international`·`formExtras`에 약 10개가 남아 있다(2026-09-06 스캔: 国际患者须知×3, 欢迎国际患者, 주소, stay.rows 肉毒素/填充/水光针/線雕提升, 银联·韩元, 还有其他疑问吗, 国家/地区, 韩国抗衰老). 가이드·블록이 이 페이지로 링크하므로 함께 고친다. `privacy`는 P0 정책대로 제외.

**Files:**
- Create: `liv-clinic/scripts/_i18n-work/zh-tw-simplified-scan.py` (파일·문자열의 간체 전용 글자 검출; Task 4 게이트에도 쓴다)
- Create: `liv-clinic/scripts/_i18n-work/value-edits.p1-zhtw.json`
- Modify: `liv-clinic/src/messages/zh-TW.json` (값만, 바이트 보존)

- [ ] **Step 1: 스캔 스크립트**

```python
#!/usr/bin/env python3
"""zh-TW 텍스트에서 간체 전용 글자를 찾는다. 사용: python zh-tw-simplified-scan.py <file.md|file.json> [...]
JSON이면 privacy.* 를 건너뛴다(P0 정책). 종료 코드 1 = 발견."""
import json, re, sys
SIMPLIFIED_ONLY = re.compile(r"[于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务预约线网针国际须区号层还问银韩现际际询验询购买质专业调节结构问题给说层线关开设础际护检备识别长变现额颈脸颊选择剂达显确满师内两个卖财优惠]")
# 주의: 优惠·实惠의 惠 등 번체와 공통인 글자는 넣지 않는다. 오탐이 나오면 여기서 뺀다.
def walk(o, p, hits):
    if isinstance(o, dict):
        for k, v in o.items(): walk(v, p + [k], hits)
    elif isinstance(o, list):
        for i, v in enumerate(o): walk(v, p + [str(i)], hits)
    elif isinstance(o, str):
        if p and p[0] == 'privacy': return
        if p[:2] == ['metaSeo', 'privacy']: return
        if SIMPLIFIED_ONLY.search(o): hits.append(('.'.join(p), o[:80]))
found = 0
for f in sys.argv[1:]:
    text = open(f, encoding='utf-8').read()
    hits = []
    if f.endswith('.json'): walk(json.loads(text), [], hits)
    else:
        for n, line in enumerate(text.splitlines(), 1):
            if SIMPLIFIED_ONLY.search(line): hits.append((f"line {n}", line.strip()[:80]))
    for where, sample in hits: print(f"{f}: {where}: {sample}")
    found += len(hits)
print(f"{found} hit(s)")
sys.exit(1 if found else 0)
```
실행 `python scripts/_i18n-work/zh-tw-simplified-scan.py src/messages/zh-TW.json` → 목록을 보고 오탐(고유명사·번체 공통 글자)은 정규식에서 빼고, 진짜 간체만 Step 2에 넣는다.

- [ ] **Step 2: 값 치환 목록** (`value-edits.p1-zhtw.json`; find는 파일 원문 한 줄 안의 부분 문자열)

```json
[
  { "file": "zh-TW.json", "find": "国际患者须知", "replace": "國際患者須知", "all": true, "expect": 3 },
  { "file": "zh-TW.json", "find": "欢迎国际患者", "replace": "歡迎國際患者" },
  { "file": "zh-TW.json", "find": "首尔特别市瑞草区Naruteo-ro 80号 自恩大厦4层", "replace": "首爾特別市瑞草區Naruteo-ro 80號 自恩大廈4樓" },
  { "file": "zh-TW.json", "find": "\"treatment\": \"肉毒素\"", "replace": "\"treatment\": \"肉毒桿菌素\"" },
  { "file": "zh-TW.json", "find": "\"treatment\": \"填充\"", "replace": "\"treatment\": \"玻尿酸\"" },
  { "file": "zh-TW.json", "find": "\"treatment\": \"水光针\"", "replace": "\"treatment\": \"水光針\"" },
  { "file": "zh-TW.json", "find": "\"treatment\": \"線雕提升\"", "replace": "\"treatment\": \"埋線拉提\"" },
  { "file": "zh-TW.json", "find": "银联(UnionPay) · 韩元(KRW)现金", "replace": "銀聯(UnionPay) · 韓元(KRW)現金" },
  { "file": "zh-TW.json", "find": "还有其他疑问吗？", "replace": "還有其他疑問嗎？" },
  { "file": "zh-TW.json", "find": "\"country\": \"国家/地区\"", "replace": "\"country\": \"國家/地區\"" },
  { "file": "zh-TW.json", "find": "韩国抗衰老 中文", "replace": "韓國抗老 中文" }
]
```
(`expect` 값과 존재 여부는 Step 1 스캔 결과로 맞춘다 — 도구가 불일치 시 실패하므로 안전하다.)

- [ ] **Step 3: 적용·검증**

```bash
cd /d/dev/LIV_homepage/liv-clinic && node scripts/_i18n-work/apply-value-edits.mjs scripts/_i18n-work/value-edits.p1-zhtw.json && npm run verify:i18n && git diff --numstat src/messages/zh-TW.json && python scripts/_i18n-work/zh-tw-simplified-scan.py src/messages/zh-TW.json | tail -3
```
Expected: verify:i18n in sync, numstat `N N src/messages/zh-TW.json`(변경 줄 수 = 편집한 줄 수, 전 라인 diff 아님), 스캔 잔여는 고유명사(千信惠 등) 뿐.

- [ ] **Step 4: 커밋**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/src/messages/zh-TW.json liv-clinic/scripts/_i18n-work/zh-tw-simplified-scan.py liv-clinic/scripts/_i18n-work/value-edits.p1-zhtw.json && git commit -m "i18n(zh-TW): international·metaSeo·formExtras 간체 잔존 11곳 번체 교정 + 스캔 스크립트

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: 언어별 OG 이미지 4종 (P1-6, B8)

`public/images/og/og-{en,ja,zh,zh-TW}.jpg` 1200×630. 배경 `hero/hero-1.jpg`(1920×1280) 가운데 크롭 + 어두운 그라데이션, 좌상단 로고(`logo.png` 206×48 → 흰색 반전 또는 그대로), 병원명 + 한 줄 카피. Task 3의 `defaultOgImage`가 이 파일을 가리킨다.

**Files:**
- Create: `liv-clinic/scripts/og/build-og-images.mjs`
- Create: `liv-clinic/scripts/og/og-template.html` (sharp SVG 텍스트가 CJK를 못 그릴 때의 대안: Playwright MCP 스크린샷)
- Create: `liv-clinic/public/images/og/og-en.jpg`, `og-ja.jpg`, `og-zh.jpg`, `og-zh-TW.jpg`

**카피(4개 언어):**
| locale | 큰 글자 | 작은 글자 |
|---|---|---|
| en | LIV Plastic Surgery | Non-surgical anti-aging · Sinsa Station, Seoul · English support |
| ja | LIV美容クリニック | ソウル新沙・カロスキルの美容皮膚科 · 日本語対応 |
| zh | LIV整形外科 | 首尔新沙站 非手术抗衰老 · 中文咨询 |
| zh-TW | LIV整形外科 | 首爾新沙站 非手術抗老 · 中文諮詢 |

- [ ] **Step 1: sharp 스크립트**

`liv-clinic/scripts/og/build-og-images.mjs`:
```js
// 언어별 OG 이미지 생성. 실행: node scripts/og/build-og-images.mjs  (Windows: 입력은 버퍼로 읽는다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'public', 'images', 'og');
const W = 1200, H = 630;
const COPY = {
  en: { title: 'LIV Plastic Surgery', sub: 'Non-surgical anti-aging · Sinsa Station, Seoul · English support', font: "'Segoe UI', Arial, sans-serif" },
  ja: { title: 'LIV美容クリニック', sub: 'ソウル新沙・カロスキルの美容皮膚科 · 日本語対応', font: "'Yu Gothic', 'Meiryo', sans-serif" },
  zh: { title: 'LIV整形外科', sub: '首尔新沙站 非手术抗衰老 · 中文咨询', font: "'Microsoft YaHei', 'Noto Sans SC', sans-serif" },
  'zh-TW': { title: 'LIV整形外科', sub: '首爾新沙站 非手術抗老 · 中文諮詢', font: "'Microsoft JhengHei', 'Noto Sans TC', sans-serif" },
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

fs.mkdirSync(OUT, { recursive: true });
const hero = fs.readFileSync(path.join(ROOT, 'public', 'images', 'hero', 'hero-1.jpg'));
const logo = await sharp(fs.readFileSync(path.join(ROOT, 'public', 'images', 'logo.png'))).resize({ width: 240 }).png().toBuffer();
const base = await sharp(hero).resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();

for (const [locale, c] of Object.entries(COPY)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#2b1d18" stop-opacity="0.85"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="80" y="470" fill="#ffffff" font-family="${c.font}" font-size="64" font-weight="700">${esc(c.title)}</text>
    <text x="80" y="530" fill="#f3e9e4" font-family="${c.font}" font-size="28">${esc(c.sub)}</text>
    <text x="80" y="580" fill="#d9c6bd" font-family="'Segoe UI', Arial, sans-serif" font-size="22" letter-spacing="2">liv-clinic.net</text>
  </svg>`;
  const out = path.join(OUT, `og-${locale}.jpg`);
  await sharp(base)
    .composite([{ input: Buffer.from(svg) }, { input: logo, top: 64, left: 80 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log(out, fs.statSync(out).size, 'bytes');
}
```

- [ ] **Step 2: 실행하고 눈으로 확인**

```bash
cd /d/dev/LIV_homepage/liv-clinic && node scripts/og/build-og-images.mjs
```
그 다음 `og-ja.jpg`와 `og-zh-TW.jpg`를 Read 도구로 열어 **CJK 글자가 네모(tofu)가 아닌지** 확인한다. 네모면 Step 3의 대안으로 간다. 로고가 어두운 배경에서 안 보이면 `sharp(...).negate({ alpha: false })`로 흰색 반전한 버퍼를 쓴다.

- [ ] **Step 3 (대안): HTML 템플릿 + Playwright MCP 스크린샷**

`scripts/og/og-template.html`(1200×630 고정, `?locale=ja`로 카피 선택, 시스템 CJK 폰트) → Playwright MCP `browser_navigate(file:///D:/dev/LIV_homepage/liv-clinic/scripts/og/og-template.html?locale=ja)` → `browser_resize(1200, 630)` → `browser_take_screenshot(fullPage=false, filename=D:\dev\LIV_homepage\og-ja.png)` → `sharp(png).jpeg({quality:82})`로 `public/images/og/og-ja.jpg`. 4개 반복. 브라우저 폰트 렌더라 CJK가 확실하다.

- [ ] **Step 4: 크기·메타 확인·커밋**

```bash
cd /d/dev/LIV_homepage/liv-clinic && node -e "const s=require('sharp');(async()=>{for(const l of ['en','ja','zh','zh-TW']){const m=await s('public/images/og/og-'+l+'.jpg').metadata();console.log(l,m.width,m.height,require('fs').statSync('public/images/og/og-'+l+'.jpg').size)}})()"
```
Expected: 4개 모두 1200×630, 각 200KB 이하. 빌드 후 `curl -sk http://localhost:3010/ja | grep -o 'og:image" content="[^"]*"'` → `/images/og/og-ja.jpg`; `/ko` → `/images/og-image.jpg`.
```bash
cd /d/dev/LIV_homepage && git add liv-clinic/scripts/og liv-clinic/public/images/og && git commit -m "feat(seo): 언어별 OG 이미지 4종(en·ja·zh·zh-TW, 1200×630) + 생성 스크립트

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: 통합 검증 (빌드·린트·로컬 프로덕션 서버)

**Files:** 없음(검증만). 결과는 Task 14 보고서 §3에 옮긴다.

- [ ] **Step 1: 게이트**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx tsc --noEmit && npx vitest run && npm run verify:i18n && git diff --name-only master...HEAD -- 'liv-clinic/src/**/*.ts' 'liv-clinic/src/**/*.tsx' | sed 's#^liv-clinic/##' | xargs npx eslint
```
Expected: tsc 0, vitest 전부 통과(기준선 446 + 신규), verify:i18n in sync, 변경 파일 lint 신규 오류 0(기존 `*Detail.tsx`의 impure render 경고류는 이번 변경 라인이 아니면 기록만).

- [ ] **Step 2: 빌드·서버**

```bash
cd /d/dev/LIV_homepage/liv-clinic && NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build 2>&1 | tail -20
```
Expected: `[compile-guides] 24 guide(s) (0 published, 24 draft)`, verify:i18n 통과, 빌드 성공(정적 페이지 수 = P0 504 + 가이드 허브 4 + 상세 24 = 532 근처). 그 뒤 `npx next start --port 3010`을 백그라운드로.

- [ ] **Step 3: 확인 표 (모두 기록)**

| 확인 | 명령 | 기대 |
|---|---|---|
| 허브 4개 언어 | `for l in en ja zh zh-TW; do curl -sk -o /dev/null -w "$l %{http_code}\n" localhost:3010/$l/guides; done` | 모두 200 |
| 허브 비대상 | `curl -sk -o /dev/null -w "%{http_code}\n" localhost:3010/ko/guides` / `/vi/guides` | 404 |
| 허브 noindex(게시 0편) | `curl -sk localhost:3010/en/guides \| grep -o 'name="robots" content="[^"]*"'` | noindex |
| 상세 초안 | `curl -sk localhost:3010/ja/guides/ultherapy-cost-seoul \| grep -c "検収中\|noindex"` | ≥ 2 |
| 상세 hreflang | 위 HTML의 `hreflang=` 수 | 2 (자기 자신 + x-default) — 초안이므로 |
| 상세 스키마 | `grep -o '"@type":"Article"\|"@type":"FAQPage"\|"@type":"MedicalWebPage"'` | 3종 모두 |
| 상세 비대상 | `curl -sk -o /dev/null -w "%{http_code}\n" localhost:3010/ko/guides/ultherapy-cost-seoul` | 404 |
| 사이트맵 | `curl -sk localhost:3010/sitemap.xml \| grep -c "/guides"` | 0 (게시 0편) |
| 시술 블록 | `curl -sk localhost:3010/zh-TW/lifting/ulthera \| grep -c "國際"` / `/ko/lifting/ulthera` | ≥1 / 0 |
| 시술 FAQ 스키마 | `curl -sk localhost:3010/en/lifting/thermage \| grep -o "Do international patients pay more[^?]*?"` | 1건 |
| 레이저 블록 | `curl -sk localhost:3010/en/laser/tattoo \| grep -c "Visiting from abroad"` | ≥1 |
| 가격 안내 | `curl -sk localhost:3010/ja/pricing \| grep -c "VAT"` | ≥ 2 (기존 안내문 + 새 블록) |
| OG 이미지 | `curl -sk localhost:3010/zh \| grep -o 'og:image" content="[^"]*"'` / `/ko` | og-zh.jpg / og-image.jpg |
| OG 파일 | `curl -sk -o /dev/null -w "%{http_code} %{size_download}\n" localhost:3010/images/og/og-en.jpg` | 200, ≤ 200000 |
| 이벤트 meta 폴백 | `curl -sk localhost:3010/zh-TW/events/2026-09-promotion \| grep -o 'name="description" content="[^"]*"'` | 한국어 아님 |
| 후기 API | `curl -sk -X POST -H 'content-type: application/json' -d '{}' -o /dev/null -w "%{http_code}\n" localhost:3010/api/admin/reviews` | 401 |
| zh-TW 간체 | `curl -sk localhost:3010/zh-TW/international \| python scripts/_i18n-work/zh-tw-simplified-scan.py /dev/stdin` | 0 hit(s) (고유명사 제외) |
| 홈 전송량 회귀 | `NODE_TLS_REJECT_UNAUTHORIZED=0 npm_config_strict_ssl=false npx --yes lighthouse@12 http://localhost:3010/en --preset=desktop --only-categories=performance,seo --chrome-flags="--headless=new --ignore-certificate-errors" --output=json --output-path=/d/dev/LIV_homepage/p1-lh-en.json --quiet` 후 `total-byte-weight`·SEO | P0(4.5~5.1MB, SEO 100)와 같은 수준 |

- [ ] **Step 4: 화면 스크린샷 (검수용, 상위 폴더에 저장)**

Playwright MCP로 1280×900·390×844에서 `/ja/guides/ultherapy-cost-seoul`, `/en/lifting/ulthera`(블록 위치까지 스크롤), `/zh-TW/pricing` → `D:\dev\LIV_homepage\p1-guide-ja.png`, `p1-block-en.png`, `p1-pricing-zhtw.png`, `p1-guide-ja-mobile.png`. 서버 종료.

---

### Task 12: 검수 요청 목록 + 사장님 체크포인트

**Files:**
- Create: `liv-clinic/scripts/guide-review-checklist.mjs`
- Generated: `docs/05-handoff/p1-review-checklist.md`
- Modify: `docs/05-handoff/foreign-seo-p1-user-inputs.md` (§F "P1 진행 상황·검수 요청" 추가)

- [ ] **Step 1: 체크리스트 생성 스크립트**

`liv-clinic/scripts/guide-review-checklist.mjs` (tsx로 실행; 생성물에서 표식·의료 주장 위치를 뽑는다):
```js
// docs/05-handoff/p1-review-checklist.md 생성 — 가이드별 [검수 필요] 표식과 가격·시간 문장 위치(파일:행)를 표로.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'content', 'guides');
const OUT = path.join(ROOT, '..', 'docs', '05-handoff', 'p1-review-checklist.md');
const MARK = /\[검수 필요[^\]]*\]/g;
const CLAIM = /(KRW|원|₩|万円|ウォン|韓元|韩元|분|minutes|分|min\b|時間|小时|小時|days?|日|週|周)/;
const rows = [];
for (const locale of ['en', 'ja', 'zh', 'zh-TW']) {
  const dir = path.join(SRC, locale);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !x.startsWith('_')).sort()) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/);
    const status = (lines.find((l) => l.startsWith('status:')) ?? '').replace('status:', '').trim();
    const marks = [], claims = [];
    lines.forEach((l, i) => {
      const m = l.match(MARK);
      if (m) marks.push(`${i + 1}: ${m.join(' ')}`);
      else if (CLAIM.test(l) && !l.startsWith('|--')) claims.push(`${i + 1}`);
    });
    rows.push({ file: `liv-clinic/content/guides/${locale}/${f}`, url: `/${locale}/guides/${f.replace(/\.md$/, '')}`, status, marks, claims });
  }
}
const md = [
  '# P1 가이드 검수 요청 목록 (자동 생성 — `npx tsx scripts/guide-review-checklist.mjs`)',
  '', `생성 ${new Date().toISOString().slice(0, 10)}. 초안은 사이트 배포 후 아래 URL로 직접 열어볼 수 있다(검색엔진 미노출). 검수가 끝난 편은 파일의 \`status: draft\`를 \`published\`로 바꾸고 표식을 지운 뒤 알려 주면 된다.`,
  '', '| 파일 | 미리보기 URL | 상태 | [검수 필요] 표식 | 가격·시간 문장 행 |', '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.file} | https://liv-clinic.net${r.url} | ${r.status} | ${r.marks.length ? r.marks.join('<br>') : '없음'} | ${r.claims.join(', ') || '-'} |`),
  '', `합계: 파일 ${rows.length}개, 표식 ${rows.reduce((n, r) => n + r.marks.length, 0)}건`,
].join('\n');
fs.writeFileSync(OUT, md + '\n', 'utf8');
console.log(`[review-checklist] ${rows.length} files → ${path.relative(ROOT, OUT)}`);
```

- [ ] **Step 2: 실행·§F 작성**

```bash
cd /d/dev/LIV_homepage/liv-clinic && npx tsx scripts/guide-review-checklist.mjs
```
`docs/05-handoff/foreign-seo-p1-user-inputs.md` 끝에 `## F. P1 진행 상황 (2026-09-xx)`: 완료 항목, 검수 요청(체크리스트 문서 링크, 이벤트 문안 문서 링크, 관리자 후기 등록 사용법 3줄), **사장님 결정 필요 목록**(D1~D7 요약 + 포스터 배지 "9월 이벤트 미정" + fr·ar 유지 확인 + 배포 승인), 배포 후 할 일(가이드 published 전환 방법).

- [ ] **Step 3: 커밋 후 사장님께 보고 — 여기서 멈춘다**

```bash
cd /d/dev/LIV_homepage && git add liv-clinic/scripts/guide-review-checklist.mjs docs/05-handoff/p1-review-checklist.md docs/05-handoff/foreign-seo-p1-user-inputs.md && git commit -m "docs: P1 검수 요청 목록·진행 상황(§F)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin feature/foreign-seo-p1
```
보고에 포함: 브랜치·커밋 수, 검증 표, 스크린샷 경로, 결정 필요 목록, "머지·배포해도 되는지"와 "이벤트 문안을 DB에 반영해도 되는지" 두 가지 질문. **승인 전에는 Task 13으로 가지 않는다.** (GitHub 원격 `jaeho19/liv-clinic`에 PR을 만들면 Netlify Deploy Preview가 생길 수 있다 — 생기면 URL을 함께 보고해 실제 화면으로 검수하게 한다.)

---

### Task 13: 머지·배포·프로덕션 검증·모바일 LCP (승인 후)

- [ ] **Step 1: 머지·푸시**

```bash
cd /d/dev/LIV_homepage && git checkout master && git pull --ff-only && git merge --no-ff feature/foreign-seo-p1 -m "Merge branch 'feature/foreign-seo-p1'" && git push origin master
```

- [ ] **Step 2: 배포 확인 (Netlify, 최대 25분 폴링)**

배포 마커: `curl -sk -o /dev/null -w "%{http_code}\n" https://liv-clinic.net/images/og/og-en.jpg` → 200이면 새 빌드. Task 11 Step 3의 표를 `https://liv-clinic.net`으로 다시 돌린다(허브 200/404, 초안 noindex, 시술 블록, 가격 안내, OG, 이벤트 meta, 사이트맵 `/guides` 0). 결과를 보고서 §8에 기록.

- [ ] **Step 3: 이벤트 문안 반영 (승인된 경우만)**

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node /d/dev/LIV_homepage/apply-event-2026-09-copy.mjs --commit
```
60초 후 `curl -sk https://liv-clinic.net/en/events/2026-09-promotion | grep -c "Chuseok Early Selection"` ≥ 1, `/zh-TW/...`에 중문. 관리자 화면에서 이벤트가 열리고 팝업 링크가 유지되는지 확인(041 트리거는 UPDATE 시 팝업을 덮어쓴다 — 포스터·기간은 그대로여야 한다).

- [ ] **Step 4: 모바일 LCP 측정 (C5)**

```bash
cd /d/dev/LIV_homepage/liv-clinic && NODE_TLS_REJECT_UNAUTHORIZED=0 npm_config_strict_ssl=false npx --yes lighthouse@12 https://liv-clinic.net/en --only-categories=performance --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --chrome-flags="--headless=new --ignore-certificate-errors" --output=json --output-path=/d/dev/LIV_homepage/p1-lh-mobile-en.json --quiet && node -e "const r=require('/d/dev/LIV_homepage/p1-lh-mobile-en.json');console.log('LCP',r.audits['largest-contentful-paint'].displayValue,'TBW',r.audits['total-byte-weight'].displayValue,'perf',r.categories.performance.score)"
```
사내 프록시 영향이 있으므로 https://pagespeed.web.dev/analysis?url=https://liv-clinic.net/en 결과(Chrome MCP로 열어 읽음)를 함께 기록. **LCP > 4초면** "모바일은 포스터만, PC만 영상" 전환을 보고서에 제안(구현은 별도 승인).

---

### Task 14: 보고서·메모리·계획서 갱신

**Files:**
- Create: `docs/04-report/features/foreign-seo-p1.report.md` (P0 보고서와 같은 절 구성: 요약 / 반영 내역(계획 번호) / 검증 기록 / 알게 된 것 / 하지 못한 것 / 사용자만 할 수 있는 작업 / 다음 단계 / 프로덕션 검증)
- Modify: `docs/01-plan/features/foreign-seo-improvement.plan.md` §5 P1-1 표 아래에 "2026-09 실행: 6주제×4개 언어로 재구성(D1), 실행 계획 링크"
- Modify: 이 계획 파일 머리말에 실행 결과 요약(P0 계획처럼)
- Memory: `liv-foreign-seo-audit-2026-09.md`에 P1 결과(브랜치·커밋·게시 전환 방법·남은 결정) 갱신, 필요하면 `MEMORY.md` 한 줄

- [ ] **Step 1: 보고서 작성** — Task 11·13의 표를 그대로 옮기고, "하지 못한 것"에 T5(404 목록 대기)·Bing/Yandex·GA4·zh-TW 이벤트 컬럼·참고 환산·후기 언어 필터를 사유와 함께 적는다.
- [ ] **Step 2: 커밋·푸시**

```bash
cd /d/dev/LIV_homepage && git add docs/04-report/features/foreign-seo-p1.report.md docs/01-plan/features/foreign-seo-improvement.plan.md docs/superpowers/plans/2026-09-06-foreign-seo-p1.md && git commit -m "docs: 외국인 검색 노출 개선 P1 완료 보고서

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git push origin master
```

---

### Task 15: 사장님 자료 도착 시 처리 (A1~A7 — 자료가 오면 실행)

자료는 `docs/05-handoff/p1-inputs/` 또는 구글 문서(https://docs.google.com/document/d/1JIHsqJTCpmyT1T9N977bsPoamgBFBlb1cnpNxqPuO4w/edit, `read_file_content`로 읽음)에 들어온다. 기다리지 않고 도착한 항목만 처리한다.

- [ ] **A1 `gsc-404.csv` → 리다이렉트 맵 (T5)**: CSV의 URL 열을 경로별로 집계 → 옛 워드프레스 패턴(`/?p=`, `/category/…`, `/en/…` 옛 슬러그, `/wp-content/…`)으로 묶고, 점(.)이 있는 경로와 쿼리 경로는 `netlify.toml` `[[redirects]]`, 그 밖은 `src/lib/legacyRedirects.ts`의 맵(테스트 `legacyRedirects.test.ts`에 상위 20개 사례 추가). 목적지는 가장 가까운 현재 페이지(시술명 → `/{locale}/lifting/...`, 없으면 로케일 홈). 처리 후 `gsc-discovered.csv`·`gsc-crawled.csv`로 외국어 미색인 페이지 목록을 보고서에 표로.
- [ ] **A3 Bing 수동 인증 코드** → `src/app/[locale]/layout.tsx` `<head>`에 `{process.env.NEXT_PUBLIC_BING_VERIFICATION && <meta name="msvalidate.01" content=… />}` + Netlify 환경변수 등록 안내(값은 코드에 넣지 않는다). **A4 Yandex** 같은 방식 `yandex-verification`.
- [ ] **A5 GA4 속성 ID** → Netlify 환경변수 `GA4_PROPERTY_ID` 교체 안내 + `/admin/analytics`가 0에서 벗어나는지 확인(메모리 `ga4-property-misconfigured` 갱신).
- [ ] **A6·A7 플랫폼 이름·GBP 현황** → 보고서 "사용자 작업" 표의 상태만 갱신(코드 변경 없음). GBP 예약 링크가 `/book`이 아니면 안내.

---

## 자기 점검 (작성 후 확인)

- 스펙 커버리지: P1-1 → Task 1·2·3·4, P1-2 → Task 5, P1-3 → Task 6, P1-4 → Task 7, P1-5 → Task 8, P1-6 → Task 10(+Task 3 `defaultOgImage`), §E의 A 자료 → Task 15, C5 LCP → Task 13, C6 fr·ar 확인 → Task 12 §F, 검수 목록(C3) → Task 12, zh-TW 용어(C4) → Task 9 + 테스트.
- 이름 일관성: `GUIDE_LOCALES`/`isGuideLocale`(types.ts) — Task 3·5·6에서 동일하게 import. `getTreatmentForeignInfo`/`getTreatmentForeignFaqs`/`FOREIGN_COMMON`(Task 5 테스트·컴포넌트·schemaI18n 동일). `buildHreflangMap(path, locales?)`·`defaultOgImage`·`alternateLocales`·`ogType`(Task 3 테스트·구현·라우트 동일). `adminReviewInputSchema`/`toReviewInsert`/`REVIEW_TREATMENT_KEYS`(Task 7). 생성물 두 파일명 `guides.generated.ts`·`guides.index.generated.ts`(Task 1 스크립트·Task 3 import·Task 4 커밋 동일).
- 자리표시자: Task 4의 가이드 본문과 Task 5·6의 ja/zh/zh-TW 사전 값은 실행 시 `_facts.md`·메시지 값에서 채우는 것으로 명시했다(계획에 24편 본문을 담지 않는 것은 의도). "적절히 처리" 류 지시 없음.

