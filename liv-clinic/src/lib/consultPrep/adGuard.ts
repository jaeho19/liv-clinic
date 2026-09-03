/**
 * 의료광고 금지 표현 검사.
 *
 * 목록의 출처는 `ConcernPathways.tsx` 상단 주석의 운영 규칙이다.
 * 이 모듈은 무엇을 검사하는지 모른다 — 문자열을 받아 통과/차단만 돌려준다.
 * 호출부에서 차단된 문장은 대체하지 말고 **통째로 생략**한다.
 *
 * ## 왜 4개 언어를 한 번에 검사하는가
 *
 * `classify.ts`의 프롬프트는 모델에게 `ONE sentence in ${lang}`(ko/en/ja/zh)을 시키고,
 * 그 결과가 이 함수를 거쳐 화면에 오른다. 그런데 `checkAdCopy(text)`는 언어를 모른다 —
 * 호출부가 언어를 넘기지 않기 때문이다. 그래서 시그니처를 바꾸는 대신 **전 언어 목록을
 * 항상 다 검사한다.** 교차 언어 오탐(한국어 문장이 영어 규칙에 걸리는 등)은 실질적으로
 * 문자 집합이 갈려 거의 없고, 설령 걸려도 안전한 방향으로 실패한다 — 문장이 생략될 뿐이다.
 * 반대로 통과시키면 의료광고법 위반이 화면에 뜬다. 그래서 의심스러우면 차단한다.
 */

/** 단순 포함 검사 대상 — 한국어 */
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

/**
 * 단순 포함 검사 대상 — 일본어·중국어.
 *
 * CJK는 단어 경계가 없으므로 부분일치가 곧 올바른 검사다.
 * 두 언어가 한자를 공유하므로(`永久` `唯一` 등) 한 배열에 중복 없이 모은다.
 * 다른 항목의 부분문자열이 되는 값은 넣지 않는다(예: `半永久`는 `永久`가 이미 잡는다).
 */
const BANNED_SUBSTRINGS_CJK = [
  // 최고 / 유일 / 1위
  '最高', '最上級', '最好', '最佳', '最强', '最優秀',
  'ナンバーワン', '1位', '唯一',
  // 완벽 / 영구
  '完璧', '完美', '完全に', '永久',
  // 부작용 없음
  '副作用がな', '副作用はな', '副作用のな', '副作用な',
  '无副作用', '無副作用', '没有副作用', '沒有副作用',
  // 보장 / 확실
  '保証', '保证', '保證', '確実', '确保', '確保',
  // 즉시 효과
  '即効', '即時効果', 'すぐに効果',
  '立即见效', '立竿见影', '马上见效', '即刻见效', '瞬间见效',
] as const;

/**
 * 정규식 검사 대상 — 히트 시 라벨을 hits에 넣는다.
 *
 * 영어는 부분일치 오탐(`only` → `commonly`, `best` → `bestow`)을 피하려 단어 경계(`\b`)를
 * 쓰고 대소문자를 구분하지 않는다(`Perfect` `GUARANTEE`도 잡아야 한다).
 */
const BANNED_PATTERNS: ReadonlyArray<{ label: string; re: RegExp }> = [
  // --- 한국어 (기존) ---
  { label: '가격표현', re: /\d[\d,]*\s*(원|만원|만 원)/ },
  { label: '할인표현', re: /\d+\s*%\s*(할인|세일)/ },
  { label: '전후비교', re: /(시술|수술)\s*전후/ },

  // --- 영어 금지 개념 ---
  { label: 'best', re: /\bbest\b/i },
  { label: 'only', re: /\bonly\b/i },
  { label: 'unique', re: /\b(?:unique|unrivall?ed|unmatched|one[-\s]of[-\s]a[-\s]kind)\b/i },
  { label: 'no.1', re: /(?:\bno\.?\s*1\b|#\s*1\b|\bnumber\s+one\b|\bfirst\s+place\b|\btop\s*1\b)/i },
  { label: '100%표현', re: /100\s*%/ },
  { label: 'perfect', re: /\bperfect\w*\b/i },
  { label: 'permanent', re: /\b(?:permanent\w*|forever|lifelong|life[-\s]long)\b/i },
  {
    label: 'no side effect',
    re: /(?:\b(?:no|zero|without|free\s+of|free\s+from)\s+side[-\s]?effects?\b|\bside[-\s]?effect[-\s]?free\b)/i,
  },
  { label: 'guarantee', re: /\b(?:guarantee\w*|guaranty)\b/i },
  { label: 'certain', re: /\b(?:certain\w*|definitely|absolutely|surely|for\s+sure)\b/i },
  { label: 'immediate', re: /\b(?:immediate\w*|instant\w*|right\s+away)\b/i },

  // --- 1위 (한자권) ---
  // `第一次`(중국어 "처음")와 `第一印象`(일본어 "첫인상")은 광고 표현이 아니라 일상어라
  // 제외한다. 그 밖의 `第一`은 순위 주장으로 보고 차단한다.
  { label: '第一', re: /第一(?!次|印象)/ },

  // --- 외화 가격 ---
  { label: '외화가격', re: /\d[\d,.]*\s*(?:USD|KRW|EUR|JPY|CNY|RMB|dollars?|won|yen|yuan)\b/i },
  { label: '외화가격(한자)', re: /\d[\d,.]*\s*(?:万円|元|円)/ },
  { label: '통화기호', re: /[$¥￥€₩]\s*\d/ },

  // --- 할인 (영어·일본어·중국어) ---
  { label: '할인표현(영문)', re: /(?:\d+\s*%\s*(?:off|discount|sale)\b|\b(?:discount(?:ed|s)?|on\s+sale|special\s+(?:price|offer)|promotion)\b)/i },
  { label: '할인표현(한자)', re: /(?:割引|セール|特価|オフ価格|折扣|打折|优惠|優惠|特惠)/ },

  // --- 전후 비교 (영어·일본어·중국어) ---
  { label: '전후비교(영문)', re: /\bbefore\s*(?:and|&|\/|-|to)\s*after\b/i },
  { label: '전후비교(한자)', re: /(?:施術前後|ビフォーアフター|ビフォー・アフター|术前术后|術前術後|前后对比|前後對比)/ },
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
  for (const word of BANNED_SUBSTRINGS_CJK) {
    if (text.includes(word)) hits.push(word);
  }
  for (const { label, re } of BANNED_PATTERNS) {
    if (re.test(text)) hits.push(label);
  }

  return { ok: hits.length === 0, hits };
}
