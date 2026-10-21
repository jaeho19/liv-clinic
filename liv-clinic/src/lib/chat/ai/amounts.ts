// 금액처럼 보이는 글자를 찾는다 (스펙 2026-10-02 chat-ai-first-response §4.6 검사 C-2). 순수 함수.
// 검사(guards.ts)와 이력 가리기(prompt.ts 의 maskAmounts)가 같은 식을 쓴다 — 한쪽만 고쳐서 어긋나지 않게.
// 원칙: 의심스러우면 금액으로 본다. 잘못 보아도 AI가 한 번 다시 쓰거나 직원이 답할 뿐이다.
// 식을 고칠 때는 __tests__/guardsCorpus.ts 의 말뭉치(빠져나가던 글 · 멀쩡한 글)를 함께 돌려 본다.

export interface Normalized {
  /** 검사용 글 — 전각 글자·다른 문자의 숫자·줄표를 보통 글자로 바꾼 것 */
  text: string;
  /** 기준이 되는 글 — 원문을 NFC 로 합친 것. starts · ends 는 이 글의 자리다 */
  source: string;
  /** text 의 i번째 글자가 source 의 starts[i] 부터 ends[i] 앞까지에서 왔다 */
  starts: number[];
  ends: number[];
}

const DECIMAL_DIGIT_RE = new RegExp('\\p{Nd}', 'u');
/** 줄표로 읽을 글자 — 가타카나 장음 기호(ー)는 넣지 않는다 */
const DASHES = new Set([0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2212, 0xfe58, 0xfe63]);
/**
 * 지우고 보는 글자 — 숫자·낱말 사이에 끼워도 눈에는 그대로 보이는 것들:
 * 보이지 않는 서식 글자(방향 표시 · 폭 없는 공백 등), 취소선·키캡 같은 겹치는 기호, 모양 선택자, 아랍 문자의 늘임표와 모음 부호.
 */
const DROPPED_RE = new RegExp('[\\p{Cf}\\u034F\\u0335-\\u0338\\u20D2-\\u20E4\\uFE00-\\uFE0F\\u180B-\\u180F\\u0640\\u064B-\\u0652\\u0670]', 'u');
/** 아랍 문자의 퍼센트 기호 · 소수점 · 천 단위 기호 · 쉼표 */
const CHAR_MAP = new Map<number, string>([
  [0x066a, '%'],
  [0x066b, '.'],
  [0x066c, ','],
  [0x060c, ','],
]);
/** 동그라미 안의 숫자(❶ ➀ ➊ ⓵ …) — NFKC 가 숫자로 바꾸지 않는 것들. 각 묶음은 1~9 */
const DINGBAT_ONES = [0x2776, 0x2780, 0x278a, 0x24f5];

function dingbatDigit(cp: number): string | null {
  if (cp === 0x24ff) return '0';
  for (const base of DINGBAT_ONES) if (cp >= base && cp <= base + 8) return String(cp - base + 1);
  return null;
}

/** 다른 문자의 숫자(아랍·태국 등)가 나타내는 값. 숫자가 아니면 null. 숫자는 문자마다 0~9 가 이어져 있다. */
function digitValue(cp: number): number | null {
  if (cp < 0x80 || !DECIMAL_DIGIT_RE.test(String.fromCodePoint(cp))) return null;
  let value = 0;
  while (value < 9 && DECIMAL_DIGIT_RE.test(String.fromCodePoint(cp - value - 1))) value += 1;
  return value;
}

/**
 * 검사용 글을 만든다. 손님에게 나가는 글은 바꾸지 않는다 — 금액·전화번호·퍼센트를 찾을 때만 쓴다.
 * ２４０万 → 240万 · ٢٤٠ → 240 · ๒๔๐ → 240 · 20٪ → 20% · 010‑1234 → 010-1234 · 2\u200e400 → 2400
 */
export function normalizeForCheck(text: string): Normalized {
  const source = text.normalize('NFC');
  let out = '';
  const starts: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < source.length; ) {
    const cp = source.codePointAt(i) ?? 0;
    const len = cp > 0xffff ? 2 : 1;
    const ch = String.fromCodePoint(cp);
    let piece: string;
    if (cp < 0x80) piece = ch;
    else if (DROPPED_RE.test(ch)) piece = '';
    else if (DASHES.has(cp)) piece = '-';
    else if (CHAR_MAP.has(cp)) piece = CHAR_MAP.get(cp) ?? '';
    else if (dingbatDigit(cp) !== null) piece = dingbatDigit(cp) ?? '';
    else {
      piece = ch.normalize('NFKC');
      const only = Array.from(piece);
      const value = only.length === 1 ? digitValue(only[0].codePointAt(0) ?? 0) : null;
      if (value !== null) piece = String(value);
    }
    for (let k = 0; k < piece.length; k += 1) {
      starts.push(i);
      ends.push(i + len);
    }
    out += piece;
    i += len;
  }
  return { text: out, source, starts, ends };
}

/** 검사에 쓰는 글 한 줄 — 글자 자리는 필요 없을 때. 반각 가나의 탁점처럼 따로 떨어진 부호를 다시 합친다. */
export function toCheckText(text: string): string {
  return normalizeForCheck(text).text.normalize('NFC');
}

// ── 통화·단위 낱말이 붙은 금액 ────────────────────────────────────────────
// 숫자 하나: 2,400,000 · 2.400.000 · 1 500 000 · 2400000 · 2,4 · 1.8
const NUM = String.raw`\d+(?:[.,' ]\d{3})*(?:[.,]\d+)?`;
const SYMBOL = String.raw`[₩$€£¥₫฿₽₮₹]`;
const CODE = '(?:KRW|USD|JPY|CNY|RMB|EUR|GBP|THB|VND|RUB|MNT|SGD|HKD|TWD|AUD|CAD|CHF|AED|SAR|MYR|PHP|IDR|INR|NZD|NTD|KZT)';
const NOT_LATIN = '(?![A-Za-z])';
const NOT_CYRILLIC = '(?![а-яёөү])';
const NOT_VIETNAMESE = '(?![A-Za-zÀ-ỹ])';
const ARABIC_LETTERS = String.raw`[\u0600-\u06FF]`;

/** 숫자·단위 뒤에 오는 통화 낱말 */
const CURRENCY_AFTER = [
  String.raw`wons?(?![A-Za-z'’])`, // "15 won't" 는 아니다
  String.raw`(?:US|U\.S\.|American|Korean|South Korean|Singapore|Hong Kong|Australian|Canadian|Taiwan|NT)\s+(?:dollars?|won)${NOT_LATIN}`,
  `(?:dollars?|bucks|yens?|yuans?|euros?|pounds?|quid|baht|ringgit|pesos?|rupees?|rupiah|dirhams?|riyals?|rou?bles?|francs?|dong|tugriks?|livres?)${NOT_LATIN}`,
  '원(?![하장내래인칙활])', // "원하시면" · "원장" · "원래" 는 아니다
  '달러|불(?![가-힣])|엔(?![가-힣])|위안|유로|바트',
  'ウォン|円|ドル|ユーロ|人民元|バーツ|ポンド',
  '韓元|韩元|韓幣|韩币|韓圜|韓圓|韩圆',
  '日元(?![旦日宵気氣通のぁ-ん])|日圓|日币|日幣', // "1日元旦" · "2～3日元気に" 는 아니다
  '美元|美金|人民币|人民幣|欧元|歐元|港币|港幣|港元|新?台币|新?台幣|英镑|英鎊|泰铢|泰銖|卢布|盧布|澳元|加元|新币|新幣',
  '元(?![旦月化素气氣気管通宵])|[块塊](?![头頭儿兒])|美?刀(?![口具片子])',
  `вон(?:а|ы|ов)?${NOT_CYRILLIC}`,
  String.raw`руб(?:л[а-яё]*)?\.?${NOT_CYRILLIC}`,
  String.raw`долл[а-яё]*\.?`,
  `евро${NOT_CYRILLIC}|юан[а-яё]*|[ий]ен[а-яё]{0,2}${NOT_CYRILLIC}|фунт[а-яё]*|бакс[а-яё]*|тенге|сум${NOT_CYRILLIC}|у\\.\\s?е\\.`,
  String.raw`đồng(?!\s+(?:nghiệp|ý|thời|hồ|hành))|VNĐ|đ${NOT_VIETNAMESE}|đô(?:\s?la)?${NOT_VIETNAMESE}|yên${NOT_VIETNAMESE}|tệ${NOT_VIETNAMESE}`,
  'วอน|บาท|ดอลลาร์|ดอลล่าร์|ดอล|เหรียญ|เยน|หยวน|ยูโร',
  `وون|ون(?!${ARABIC_LETTERS})|دولار${ARABIC_LETTERS}*|ريال|درهم|يورو|دينار|جنيه|ليرة|روبل|يوان|ين(?!${ARABIC_LETTERS})|ر\\.س|د\\.إ`,
  String.raw`төгрөг[а-яёөү]*|төг\.?${NOT_CYRILLIC}`,
].join('|');
const CURRENCY_TAIL = `(?:${SYMBOL}|${CODE}${NOT_LATIN}|${CURRENCY_AFTER})`;

/** 숫자 앞에 오는 통화 표시 */
const CURRENCY_BEFORE = `(?:${SYMBOL}|(?<![A-Za-z])${CODE}|韓元|韩元|韓幣|韩币|人民币|人民幣|美元|美金|日元|日圓)`;

/** 숫자 뒤에 붙는 단위 낱말 (5k · 2.4 million · 2,4 млн · 240万 · 50만) — 한 글자 M 은 따로 본다 */
const MAGNITUDE_AFTER = [
  // "mn" 은 넣지 않는다 — 프랑스어에서 분(minutes)의 줄임이다("30 mn"). 소수가 붙은 "1.8mn" 만 아래에서 본다
  `(?:thousand|millions?|billion|milliers?|mille|mln|mio|mil|mill|thou|thsd|tsd|grand|lakhs?|crores?)${NOT_LATIN}`,
  String.raw`k(?![A-Za-z]|-[A-Za-z])`, // 30kJ · 5 km · 2 kg · "2 K-beauty" 는 아니다
  String.raw`triệu(?!\s+chứng)|trieu${NOT_LATIN}|nghìn|ngàn|tỷ(?!\s+lệ)${NOT_VIETNAMESE}|tr\d?${NOT_VIETNAMESE}`, // "triệu chứng"(증상)은 아니다
  String.raw`млн|млрд|миллион[а-яё]*|тыс(?:яч[а-яё]*)?\.?${NOT_CYRILLIC}`,
  'ล้าน|แสน|หมื่น|พัน(?!ธ)',
  `مليون|ملايين|(?:ألف|الف|آلاف)(?!${ARABIC_LETTERS})`, // "الفحص"(검사)은 아니다
  `сая(?!хан)[а-яёөү]{0,4}${NOT_CYRILLIC}|мянга[а-яёөү]*`, // "саяхан"(얼마 전)은 아니다
  '百万|[多余餘来來]?\\s?[万萬億亿]|千(?![葉叶])',
  String.raw`천\s?만|여?\s?만(?![큼])|여?\s?억|천\s?원`,
].join('|');

/** 숫자 없이도 통화 낱말 앞에 오면 금액인 단위 낱말 (два миллиона вон · hai triệu won · 二百万ウォン) */
const MAGNITUDE_WORD = [
  String.raw`миллион[а-яё]*|млн\.?|тысяч[а-яё]*|тыс\.?`,
  'triệu|nghìn|ngàn',
  'ล้าน|แสน|หมื่น|พัน',
  `مليون${ARABIC_LETTERS}{0,3}|ملايين|ألف|الف|آلاف|ألفان`,
  'сая|мянга[а-яёөү]*',
  `millions?|milliers?|mille`,
  '万|萬|億|亿|千|百',
].join('|');

const EN_NUMBER_WORD =
  'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred';
const EN_CURRENCY = String.raw`(?:won|dollars?|yen|yuan|euros?|pounds?)(?![A-Za-z'’])`;
/** 한자 숫자 — 갖은자(壹贰叁… 금액을 적을 때 쓰는 글자)도 넣는다 */
const CJK_NUMERAL = '[一二三四五六七八九十百两兩〇零壱弐参壹贰貳叁參肆伍陆陸柒捌玖拾佰仟]';
/** 흔한 음절 '일'·'이' 는 한 글자로는 보지 않는다 ("토요일만 원장님" 을 금액으로 읽지 않게) */
const KO_NUMERAL = '[삼사오육칠팔구십백천]';
const KO_NUMERAL_ANY = '[일이삼사오육칠팔구십백천]';
const VI_NUMBER_WORD = 'một|hai|ba|bốn|tư|năm|lăm|sáu|bảy|tám|chín|mười|mươi|chục|trăm|vài|mấy|nửa';
const TH_NUMBER_WORD = 'หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|ร้อย|เอ็ด|ครึ่ง|หลาย|หลัก';
const RU_NUMBER_WORD =
  '[а-яё]+сот|сто|двести|триста|четыреста|[а-яё]*десят|двадцать|тридцать|сорок|девяносто|одна|две|три|четыре|пять|шесть|семь|восемь|девять|десять|[а-яё]+надцать|полторы|несколько|пару?';
const FR_NUMBER_WORD = 'cent|cents|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt|trente|quarante|cinquante|soixante';
const MN_NUMBER_WORD =
  'нэг|хоёр|гурван?|дөрвөн?|таван?|зургаан?|долоон?|найман?|есөн?|арван?|хорин?|гучин?|дөчин?|тавин?|жаран?|далан?|наян?|ерэн?|зуун?|хагас|хэдэн';

const STATED_AMOUNT_PATTERNS: RegExp[] = [
  // KRW 500,000 · ₩1590000 · $350 · 人民币2300 · "KRW: 990" · "USD (approx. 1700)"
  new RegExp(
    `${CURRENCY_BEFORE}(?:\\s?|[\\s:=~\\u2248(-]{1,3}(?:approx\\.?\\s?|about\\s|around\\s|ca\\.?\\s?)?)${NUM}(?:\\s?(?:${MAGNITUDE_AFTER}))?`,
    'i'
  ),
  // 2,400,000 won · 2300 人民币 · 780 000 ₩ · ٢٤٠٠٠٠٠ وون · 1700 US dollars
  new RegExp(`${NUM}\\s?${CURRENCY_TAIL}`, 'i'),
  // 1700 (USD) · 1700/USD · 990 in KRW
  new RegExp(
    `${NUM}\\s?[(/-]\\s?${CODE}${NOT_LATIN}|${NUM}\\s+in\\s+(?:${CODE}|US\\s+dollars|dollars|won|euros|yen)${NOT_LATIN}`,
    'i'
  ),
  // 5k · 780 thousand · 2,4 млн вон · 240万ウォン · 200多万 · 50만 원 · 2tr4 · 2.4 саяас
  new RegExp(`${NUM}\\s?(?:${MAGNITUDE_AFTER})(?:\\s?(?:de\\s+|d['’])?${CURRENCY_TAIL})?`, 'i'),
  // 2.4-million-won
  /\d+(?:[.,]\d+)?-(?:thousand|million|billion)\b/i,
  // 1.8M · 2M · 1.8 M · 2 MM — 대문자일 때. 소문자 m · mn 은 소수가 붙을 때만("2.4m" · "1.8mn" — "50 m" 는 거리, "30 mn" 은 분이다)
  /\d+(?:[.,]\d+)?\s?MM?(?![A-Za-z])|\d+[.,]\d+\s?mn?(?![A-Za-z])/,
  // 240w · 24个w (중국어권의 '万' 줄임)
  /\d\s?[个個]?[wW](?![A-Za-z])/,
  // 500к · 500кк · "500 к вон"
  /\d[кК]{1,2}(?![а-яёА-ЯЁ])|\d\s?[кК]{1,2}\s+(?:вон|руб|долл|тенге|KRW)/,
  // two million (four hundred thousand) won · a couple of million · two and a half million · fifteen hundred
  new RegExp(
    String.raw`\b(?:a|several|half a|${EN_NUMBER_WORD})(?:[\s-]+(?:and\s+)?(?:${EN_NUMBER_WORD}))*[\s-]+(?:thousand|million|billion)\b(?:\s+${EN_CURRENCY})?` +
      String.raw`|\b(?:couple|few)\s+(?:of\s+)?(?:hundred\s+)?(?:thousand|million|mil|grand)\b` +
      String.raw`|\b(?:half|quarters?)\s+(?:a\s+|of\s+a\s+)?(?:million|mil)\b` +
      String.raw`|\band\s+a\s+half\s+(?:million|thousand|mil|grand)\b` +
      String.raw`|\b(?:${EN_NUMBER_WORD})[\s-]+(?:mil|grand)\b` +
      String.raw`|\b(?:${EN_NUMBER_WORD})[\s-]+hundred\b(?!\s+(?:shots?|units?))`,
    'i'
  ),
  // five hundred won · fifty dollars
  new RegExp(String.raw`\b(?:${EN_NUMBER_WORD}|thousand|million|billion)\s+${EN_CURRENCY}`, 'i'),
  // million(s) · milliers — 낱말만으로도. deux cents · cinq mille
  new RegExp(
    String.raw`\bmillions?\b|\bmilliers?\b|\b(?:${FR_NUMBER_WORD})\s+mille\b|\bmille\s+(?:cent|deux|trois|quatre|cinq|six|sept|huit|neuf)\b|\b(?:deux|trois|quatre|cinq|six|sept|huit|neuf|quinze)\s+cents?\b`,
    'i'
  ),
  // два миллиона вон · hai triệu won · สองล้านวอน · deux millions de wons
  new RegExp(`(?:${MAGNITUDE_WORD})\\s?(?:de\\s+|d['’])?(?:${CURRENCY_AFTER})`, 'i'),
  // hai triệu · bốn mươi triệu
  new RegExp(String.raw`(?:${VI_NUMBER_WORD})\s+(?:triệu(?!\s+chứng)|nghìn|ngàn|tỷ(?!\s+lệ))`, 'i'),
  // สองล้าน · เจ็ดหมื่น
  new RegExp(`(?:${TH_NUMBER_WORD})\\s?(?:ล้าน|แสน|หมื่น)`),
  // миллион — 낱말만으로도. пятьсот тысяч
  new RegExp(String.raw`миллион|млн|млрд|(?:${RU_NUMBER_WORD})\s+тысяч`, 'i'),
  // хоёр сая · дөрвөн зуун мянга
  new RegExp(String.raw`(?:${MN_NUMBER_WORD})\s+(?:сая|мянга|тэрбум)`, 'i'),
  // مليون · مليونين · ألفي · خمسمئة — 낱말만으로도
  /مليون|ملايين|آلاف|ألفي|ألفين|ألفان|(?:خمس|ست|سبع|ثمان|تسع|أربع|ثلاث)م(?:ئ|ائ)ة|مئتا|مئتي|مئتين|مائتا|مائتي|مائتين/,
  // 二百四十万 · 两百多万 · 一百来万 — "千万不要"(부디 ~하지 마세요) · "千万小心" 은 아니다
  new RegExp(
    `(?:${CJK_NUMERAL}\\s?[多余餘来來]?\\s?[万萬億亿]|千\\s?[万萬](?![不别別要记記注小当當保])|千\\s?[億亿])(?:\\s?(?:${CURRENCY_AFTER}))?`
  ),
  // 五千元 · 三百円 · 两千四 · にひゃくよんじゅうまんウォン(가나로 쓴 수 + 통화)
  new RegExp(
    `[一二三四五六七八九十百千万萬两兩拾佰仟]\\s?(?:${CURRENCY_AFTER})|[一二三四五六七八九两兩]\\s?千(?![葉叶万萬])|(?:まん|マン|せん|ひゃく)\\s?(?:ウォン|円|えん|ドル)`
  ),
  // 이백사십만 · 이백여만 · 이만 원 · 오천 원
  new RegExp(
    `${KO_NUMERAL_ANY}{2,}\\s?여?\\s?만(?![큼에])|${KO_NUMERAL}\\s?여?\\s?(?:만|억)\\s?원(?![하장내래인칙활])|[일이]\\s?(?:만|억)\\s?원(?![하장내래인칙활])|[삼사오육칠팔구]\\s?천\\s?원(?![하장내래인칙활])`
  ),
];

// ── 통화 표시 없이 쓴 금액일 수 있는 숫자 ─────────────────────────────────
// 뒤에 `.123` · `,123` 이 더 이어지면 그 숫자의 가운데다 — 거기서 끊지 않는다.
const GROUP_END = String.raw`(?!\d)(?![.,]\d)`;
/** 뒤에 샷 · cc 같은 단위가 오면 금액이 아니다 ("1,200 shots" · "1000샷") */
const NOT_A_COUNT = String.raw`(?!\s?(?:shots?|units?|IU|kJ|cc|ml|샷|ショット|発|发|發|импульс|tirs|ช็อต))`;
/** 1,590,000 · 2.400.000 · 1'500'000 · 24,00,000(인도식) · 240,0000(네 자리 묶음) */
const GROUPED_NUMBER_PATTERNS: RegExp[] = [
  new RegExp(String.raw`(?<![\d.,])\d{1,3}(?:,\d{3})+(?:\.\d+)?${GROUP_END}${NOT_A_COUNT}`),
  new RegExp(String.raw`(?<![\d.,])\d{1,3}(?:\.\d{3})+(?:,\d+)?${GROUP_END}`),
  new RegExp(String.raw`(?<![\d'’])\d{1,3}(?:['’]\d{3})+(?!\d)`),
  /(?<![\d.,])\d{1,2}(?:,\d{2})+,\d{3}(?!\d)/,
  /(?<![\d.,])\d{1,4}(?:,\d{4})+(?!\d)/,
];
/**
 * 1 500 000 · 780 000 · "2, 400, 000" · "2·400·000" · "2 4 0 0 0 0 0" — 전화번호와 날짜를 지운 글에서만 본다.
 * 느슨한 구분 기호는 "000" 묶음으로 끝날 때만(금액은 대개 그렇게 끝난다 — "300, 600, 900 shots" 는 아니다).
 */
const LOOSE_GROUPED_RE = new RegExp(
  String.raw`(?<![\d.,])\d{1,3}(?: \d{3})+${GROUP_END}` +
    String.raw`|(?<![\d.,:])\d{1,3}(?:[\s,.'’·_/-]{1,3}\d{3})*[\s,.'’·_/-]{1,3}000(?![\d:])` +
    String.raw`|(?<![\d.:/-])\d(?:[\s.-]\d){4,}(?![\d:/])`
);
/** 구분 기호 없는 다섯 자리 이상, 그리고 연도가 아닌 네 자리(뒤에 샷·cc 같은 단위가 오면 아니다) */
const BARE_NUMBER_RE = new RegExp(
  String.raw`(?<!\d)\d{5,}(?!\d)` +
    String.raw`|(?<![A-Za-z\d_])(?!(?:19|20|25)\d\d(?!\d))\d{4}(?!\d)${NOT_A_COUNT}`
);

function firstMatch(patterns: readonly RegExp[], text: string): string | null {
  let best: { at: number; text: string } | null = null;
  for (const re of patterns) {
    const m = re.exec(text);
    if (m && (best === null || m.index < best.at)) best = { at: m.index, text: m[0] };
  }
  return best ? best.text.trim() : null;
}

/** 통화·단위 낱말이 붙은 금액, 글자로 쓴 금액을 찾는다 (검사용 글에서). 없으면 null. */
export function findStatedAmount(normalized: string): string | null {
  return firstMatch(STATED_AMOUNT_PATTERNS, normalized);
}

/**
 * 통화 표시 없이 쓴 금액일 수 있는 숫자를 찾는다 — 천 단위로 묶은 숫자, 네 자리 이상의 맨 숫자.
 * 날짜·전화번호·주소를 지운 글에 쓴다(그것들을 금액으로 읽지 않게).
 */
export function findLooseNumber(normalized: string): string | null {
  return firstMatch([...GROUPED_NUMBER_PATTERNS, LOOSE_GROUPED_RE, BARE_NUMBER_RE], normalized);
}

const MASK = '[amount]';
/** 이력에서 가릴 때는 띄어 쓴 묶음·맨 숫자를 보지 않는다 — 전화번호와 날짜가 섞여 있다 */
const MASK_PATTERNS: RegExp[] = [...STATED_AMOUNT_PATTERNS, ...GROUPED_NUMBER_PATTERNS];

/**
 * 직원이나 예전 답이 쓴 금액을 가린다 — 이력에 금액 숫자가 있으면 AI가 따라 쓴다.
 * 가린 곳 밖의 글자는 그대로다(원문을 NFC 로 합친 것).
 */
export function maskAmounts(text: string): string {
  const n = normalizeForCheck(text);
  const spans: Array<[number, number]> = [];
  for (const re of MASK_PATTERNS) {
    for (const m of n.text.matchAll(new RegExp(re.source, `${re.flags}g`))) {
      if (m[0].length === 0) continue;
      const from = m.index ?? 0;
      const raw = m[0];
      // 앞뒤의 띄어쓰기는 가리지 않는다
      const lead = raw.length - raw.trimStart().length;
      const to = from + raw.trimEnd().length;
      spans.push([n.starts[from + lead], n.ends[to - 1]]);
    }
  }
  if (spans.length === 0) return n.source;
  spans.sort((a, b) => a[0] - b[0]);
  let out = '';
  let at = 0;
  for (const [from, to] of spans) {
    if (to <= at) continue; // 앞의 것에 포함된다
    if (from >= at) out += n.source.slice(at, from) + MASK;
    // 앞의 것과 겹치면 이어 가린다(표시는 하나)
    at = to;
  }
  return out + n.source.slice(at);
}
