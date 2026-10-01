// 채팅 말풍선의 글에서 눌러서 열 수 있는 주소를 가른다 (스펙 2026-10-01 §4.10). 순수 함수 — 손님 화면에서 쓴다.

export interface LinkPart {
  kind: 'text' | 'link';
  value: string;
}

// http(s) 주소만. 주소에 쓸 수 있는 ASCII 글자만 받는다 — 일본어·중국어 글이 띄어쓰기 없이 뒤에 붙어도 주소가 거기서 끝난다.
const URL_RE = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
// 주소 끝에 붙은 문장부호는 링크에서 뺀다 (전각 문장부호는 위 글자 집합에 없어 처음부터 들어오지 않는다).
const TRAILING_PUNCT_RE = /[.,;:!?)\]'"]+$/;
const SCHEME_ONLY_RE = /^https?:\/\/$/;

export function splitLinks(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    const url = m[0].replace(TRAILING_PUNCT_RE, '');
    if (SCHEME_ONLY_RE.test(url)) continue;
    if (start > last) parts.push({ kind: 'text', value: text.slice(last, start) });
    parts.push({ kind: 'link', value: url });
    last = start + url.length;
  }
  if (last < text.length || parts.length === 0) parts.push({ kind: 'text', value: text.slice(last) });
  return parts;
}
