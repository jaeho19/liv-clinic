/**
 * 의료광고 금지 표현 검사.
 *
 * 목록의 출처는 `ConcernPathways.tsx` 상단 주석의 운영 규칙이다.
 * 이 모듈은 무엇을 검사하는지 모른다 — 문자열을 받아 통과/차단만 돌려준다.
 * 호출부에서 차단된 문장은 대체하지 말고 **통째로 생략**한다.
 */

/** 단순 포함 검사 대상 */
const BANNED_SUBSTRINGS = [
  '최고',
  '유일',
  '1위',
  '100%',
  '완벽',
  '영구',
  '부작용 없',
  '보장',
  '확실',
  '즉시 효과',
] as const;

/** 정규식 검사 대상 — 히트 시 라벨을 hits에 넣는다 */
const BANNED_PATTERNS: ReadonlyArray<{ label: string; re: RegExp }> = [
  { label: '가격표현', re: /\d[\d,]*\s*(원|만원|만 원)/ },
  { label: '할인표현', re: /\d+\s*%\s*(할인|세일)/ },
  { label: '전후비교', re: /(시술|수술)\s*전후/ },
];

export interface AdCopyResult {
  ok: boolean;
  hits: string[];
}

export function checkAdCopy(text: string): AdCopyResult {
  const hits: string[] = [];

  for (const word of BANNED_SUBSTRINGS) {
    if (text.includes(word)) hits.push(word);
  }
  for (const { label, re } of BANNED_PATTERNS) {
    if (re.test(text)) hits.push(label);
  }

  return { ok: hits.length === 0, hits };
}
