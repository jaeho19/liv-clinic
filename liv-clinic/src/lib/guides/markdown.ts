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
  const cjkRe = /[぀-ヿ㐀-鿿가-힯]/g;
  const cjk = (text.match(cjkRe) ?? []).length;
  const words = (text.replace(cjkRe, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

function requireString(data: Record<string, string | string[]>, key: string): string {
  const v = data[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`frontmatter "${key}" is required`);
  return v.trim();
}

function requireEnum<T extends string>(data: Record<string, string | string[]>, key: string, allowed: readonly T[]): T {
  const v = requireString(data, key);
  if (!(allowed as readonly string[]).includes(v)) {
    throw new Error(`frontmatter "${key}" must be one of ${allowed.join('|')}, got "${v}"`);
  }
  return v as T;
}

export function parseGuide(src: string, ctx: { locale: GuideLocale; slug: string }): GuideDoc {
  const { data, body } = parseFrontmatter(src);
  const keywords = Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [];
  if (keywords.length === 0) throw new Error('frontmatter "keywords" needs at least one item');
  const updated = requireString(data, 'updated');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
    throw new Error(`frontmatter "updated" must be YYYY-MM-DD, got "${updated}"`);
  }
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
