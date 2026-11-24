/**
 * public/llms.txt 의 한국어 칼럼 목록. AI 검색(ChatGPT·Perplexity·Claude 등)이 사이트를 읽을 때
 * 먼저 찾는 안내 파일이라, 칼럼을 공개하면 여기에도 바로 올라가야 한다 — 손으로 챙기면 빠뜨리므로
 * compile-guides 가 표식 사이를 자동으로 채운다.
 *
 * 이 파일은 compile-guides(tsx)가 불러온다 — seo.ts 같은 무거운 모듈을 import하지 말 것.
 */
import { COLUMN_LOCALE, type GuideDoc } from './types';
import { GUIDE_UI } from './ui';

/** llms.txt 는 운영 주소를 그대로 적는 정적 파일이다(다른 구역도 같은 주소를 쓴다). */
const SITE = 'https://liv-clinic.net';
const START = /<!-- columns:start[^>]*-->/;
const END = '<!-- columns:end -->';

type Listed = Pick<GuideDoc, 'locale' | 'slug' | 'status' | 'title' | 'description'>;

/** 공개된 한국어 칼럼을 llms.txt 형식의 줄로. 공개된 칼럼이 없으면 빈 배열(구역을 만들지 않는다). */
export function columnsForLlms(docs: readonly Listed[]): string[] {
  const columns = docs.filter((d) => d.locale === COLUMN_LOCALE && d.status === 'published');
  if (columns.length === 0) return [];
  const ui = GUIDE_UI[COLUMN_LOCALE];
  const base = `${SITE}/${COLUMN_LOCALE}/guides`;
  return [
    `## 칼럼 (Korean columns) — ${ui.author} ${ui.doctorAuthor}`,
    '',
    `- [${ui.hubTitle} 전체 보기](${base})`,
    ...columns.map((d) => `- [${d.title}](${base}/${d.slug}): ${d.description}`),
  ];
}

/** llms.txt 본문에서 표식 사이만 바꾼다. 표식이 없으면 그대로 돌려준다. 줄바꿈은 파일의 것을 따른다. */
export function syncColumnsBlock(text: string, docs: readonly Listed[]): string {
  const start = text.match(START);
  if (!start || start.index === undefined) return text;
  const from = start.index + start[0].length;
  const to = text.indexOf(END, from);
  if (to === -1) return text;
  const eol = text.slice(from, from + 2) === '\r\n' ? '\r\n' : '\n';
  const lines = columnsForLlms(docs);
  const block = lines.length ? `${eol}${eol}${lines.join(eol)}${eol}${eol}` : eol;
  return text.slice(0, from) + block + text.slice(to);
}
