import { findLooseNumber, findStatedAmount, toCheckText } from './amounts';
import { parseBookingOutput, type BookingFields } from './booking';
import { priceTagPattern, TAG_LINE_REST_RE } from './knowledge';
import { offerTagPattern } from './knowledge/offers';

// AI 출력의 검사 (스펙 2026-10-02 chat-ai-first-response §4.6). 순수 함수 — I/O 없음.
// 걸리면 이유를 글자로 돌려준다. 호출자(turn.ts)가 한 번 다시 쓰게 하고, 또 걸리면 접수 안내로 대신한다.
// 원칙: 의심스러우면 막는다. 잘못 막아도 손님에게는 접수 안내가 나가고 직원이 답한다 — 틀린 금액이 나가는 것보다 낫다.
// 검사는 검사용 글(amounts.toCheckText — 전각 글자·다른 문자의 숫자를 보통 글자로 바꾸고 보이지 않는 글자를 지운 것)에 한다.
// 식을 고칠 때는 __tests__/guardsCorpus.ts 의 말뭉치(빠져나가던 글 · 멀쩡한 글)를 함께 돌려 본다.
// 외국어 낱말 목록은 원어민 검수를 받지 않았다 — 켠 뒤의 점검(chat-ai-review-export.mjs)에서 잘못 걸린 답을 보고 다듬는다.

export interface AiOutput {
  /** 손님에게 갈 글 (꼬리표 포함, 마크다운·이모지를 걸러 낸 것) */
  reply: string;
  /** 직원에게 보일 요지 (한국어 한두 문장) */
  staffNoteKo: string;
  booking: BookingFields;
  needsStaff: boolean;
  staffReasonKo: string | null;
  /** 손님이 사람인지 AI인지 물었다 — 답은 프로그램이 붙인다 */
  identityQuestion: boolean;
  /** 손님의 마지막 글을 읽은 반응 R1~R7 (제안형 응대 §4.2). 없거나 모르는 값이면 null */
  reaction: Reaction | null;
  /** 손님이 제안을 거절했거나 한 가지만 원한다고 했다 — 그 대화에서 제안을 멈춘다 (§4.5) */
  offerDeclined: boolean;
}

export type Reaction = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7';
const REACTIONS: ReadonlySet<string> = new Set(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);

const STAFF_NOTE_MAX = 300;
const STAFF_REASON_MAX = 80;

const EMOJI_RE = new RegExp('[\\p{Extended_Pictographic}\\uFE0F\\u200D]', 'gu');
/** [글자](주소) */
const MARKDOWN_LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

/** 마크다운 기호와 이모지를 걸러 낸다(검사 실패로 치지 않는다). 줄 머리의 `- `·`* ` 는 `• ` 로, 마크다운 링크는 글자와 주소로 바꾼다. */
export function cleanReply(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(EMOJI_RE, '')
    .replace(MARKDOWN_LINK_RE, (_m, label: string, url: string) => (label.trim() === url ? url : `${label.trim()} ${url}`))
    .replace(/\*\*|__|`/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[ \t]*[-*][ \t]+/gm, '• ')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const short = (v: unknown, max: number): string =>
  typeof v === 'string' ? Array.from(v.replace(/\s+/g, ' ').trim()).slice(0, max).join('') : '';

/** 모델이 낸 JSON 을 읽는다. JSON 이 아니거나 reply 가 없으면 null (검사 C-1). 정체 질문(identity_question)이면 빈 reply 도 받는다. */
export function parseAiOutput(content: string): AiOutput | null {
  let o: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    o = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  if (typeof o.reply !== 'string') return null;
  const reply = cleanReply(o.reply);
  const identityQuestion = o.identity_question === true;
  // 정체만 물은 글에는 AI가 쓸 말이 없을 수 있다 — 그때는 프로그램이 붙이는 답만 나간다
  if (!reply && !identityQuestion) return null;
  const reason = short(o.staff_reason_ko, STAFF_REASON_MAX);
  const reaction = typeof o.reaction === 'string' && REACTIONS.has(o.reaction.trim().toUpperCase()) ? o.reaction.trim().toUpperCase() : null;
  return {
    reply,
    staffNoteKo: short(o.staff_note_ko, STAFF_NOTE_MAX),
    booking: parseBookingOutput(o.booking),
    needsStaff: o.needs_staff === true,
    staffReasonKo: reason || null,
    identityQuestion,
    reaction: reaction as Reaction | null,
    offerDeclined: o.offer_declined === true,
  };
}

export interface GuardContext {
  /** 오늘 유효한 가격 줄의 꼬리표 */
  rowIds: ReadonlySet<string>;
  /** 오늘 쓸 수 있는 제안 줄 · 혜택 문장의 꼬리표 (C01… · B01). 없으면 B01 만 */
  offerIds?: ReadonlySet<string>;
  /** 써도 되는 주소 (검사 C-7) */
  allowedUrls: readonly string[];
  /** 써도 되는 퍼센트 — '5' (검사 C-3) */
  allowedPercents: ReadonlySet<string>;
  /** 써도 되는 전화번호의 숫자만 — 병원 번호와 손님이 연락처로 남긴 번호 (검사 C-8). 8~15자리만 본다 */
  allowedPhoneDigits: readonly string[];
  /** 써도 되는 메일 주소 — 손님이 연락처로 남긴 것 (검사 C-7) */
  allowedEmails: readonly string[];
  /** 써도 되는 메신저 아이디 — 병원 것과 손님이 연락처로 남긴 것 (검사 C-8) */
  allowedHandles: readonly string[];
}

export const MAX_TAGS = 6;
/** AI가 쓴 글의 길이 한도 — 한글·한자·가나 같은 넓은 글자는 두 칸으로 센다 */
export const MAX_REPLY_UNITS = 900;

// ── C-4 꼬리표 ──────────────────────────────────────────────────────────
/** 괄호 없이 쓴 꼬리표 (P006 · p006 · P-006 · [[P006]] · 키릴 Р005 · C01 · B01 · T03) — 손님에게 그대로 나가면 안 된다 */
const LOOSE_TAG_RE = new RegExp(
  '(?<![\\p{L}\\p{N}])(?:[PMFTCB\\u0420\\u041C\\u03A1\\u039C\\u0421\\u0412\\u0422][\\s_-]?|[pmftcb])\\d{2,4}(?![\\p{L}\\p{N}])',
  'u'
);
/** 이력에 넣는 표시(assemble.ts · prompt.ts)를 AI가 따라 쓴 것 */
const HISTORY_MARKER_RE =
  /[[(【<]\s*(?:(?:price[\s-]+line\s+shown|tentative\s+booking\s+summary|told\s+the\s+visitor|suggestion\s+shown|direct[\s-]+booking\s+benefit)[^\])】>\n]{0,160}[\])】>]?|(?:amount|price|our\s+staff)\s*[\])】>])/i;

// ── C-3 퍼센트 · 할인율 ──────────────────────────────────────────────────
const PERCENT_NUMBER = String.raw`\d+(?:[.,]\d+)?`;
/** 숫자가 없어도 퍼센트를 말하는 낱말 */
const PERCENT_WORD = [
  '%',
  String.raw`percent(?![A-Za-z])|per[-\s]?cent(?![A-Za-z])|pct(?![A-Za-z])`,
  '퍼센트|パーセント',
  'phần trăm|phan tram',
  String.raw`процент[а-яё]*|проц\.?(?![а-яё])`,
  String.raw`pour\s?cent(?![A-Za-z])`,
  'เปอร์เซ็นต์|เปอร์เซนต์',
  'بالمئة|بالمائة|بالمائه|بالمية|بالميه|في المئة|في المائة|في المية',
].join('|');
/** 숫자 뒤에 올 때만 퍼센트인 낱말 — '프로모션', 몽골어 'хувилбар'(선택지) · 'хувийн мэдээлэл'(개인 정보)을 막지 않게 */
const PERCENT_WORD_AFTER_NUMBER = String.raw`프로(?![가-힣])|퍼(?![가-힣])|パー(?![ァ-ヶー])|хув(?!илбар|цас|ийн\s+мэдээл)[а-яёөү]*|เปอร์(?!เซ)|p\.\s?(?:100|c\.)|pc(?![A-Za-z])`;
const PERCENT_RE = new RegExp(
  `(${PERCENT_NUMBER})?[\\s-]?(?:${PERCENT_WORD})|(${PERCENT_NUMBER})[\\s-]?(?:${PERCENT_WORD_AFTER_NUMBER})`,
  'gi'
);
/** ร้อยละ 20 (태국어 — 낱말이 숫자 앞에 온다) */
const TH_PERCENT_RE = new RegExp(`ร้อยละ\\s?(${PERCENT_NUMBER})`, 'g');
/** 百分之二十 */
const ZH_PERCENT_RE = /百分之\s?([一二三四五六七八九十百零〇两兩点點.\d]+)/g;
/** 八折 · 95折 — 九五折(5% 할인)만 된다 */
const ZH_DISCOUNT_RE = /([一二三四五六七八九〇零\d.]+)\s?折/g;
const ZH_DISCOUNT_OK = new Set(['九五', '95', '9.5']);
/** 2割引 */
const JA_DISCOUNT_RE = /[\d一二三四五六七八九十]+(?:[.,]\d+)?\s?割/g;
/** % 기호 없이 말하는 할인 — 반값 · 몇 분의 일 · 20 off · 1+1 */
const DISCOUNT_PHRASE_RES: RegExp[] = [
  /half[-\s](?:price|off)|\b(?:a|one|two|three)[\s-](?:half|third|quarter|fifth|tenth)s?\s+(?:off|cheaper|less|discount)\b|\bhalf\s+(?:of\s+)?(?:the\s+|our\s+|its\s+)?(?:\w+\s+)?(?:price|cost|fee)\b|\bhalf\s+of\s+(?:the\s+following|what|that|this)\b|\b\d+\s?points?\s+off\b|\b(?:\d+|ten|twenty|thirty|forty|fifty)\s+off\b|\b(?:buy\s+one,?\s+get\s+one|(?:two|2)\s+for\s+(?:the\s+price\s+of\s+)?(?:one|1))\b|(?<![\d:])\d\s?\+\s?1(?!\d)/gi,
  /半額|半値|半分の(?:価格|料金|値段|お値段)|[0-9一二三四五六七八九十]\s?分の\s?[0-9一二三四五六七八九十]\s?(?:オフ|引き|割引)/g,
  /半价|半價|[对對]折|[减減]半|一半的?(?:价格|價格|价钱|價錢)|(?:便宜|优惠|優惠|[减減降打让讓])[^，。,.\n]{0,4}[一二三四五六七八九两兩\d]\s?成|\d+\s?[个個][点點]|[买買]一送一/g,
  /반값|반액|절반\s?(?:가격|값)|\d\s?할(?![가-힣])/g,
  /nửa\s+(?:giá|tiền)|(?:giảm|bớt|chỉ)\s+(?:còn\s+)?(?:một|1)\s+nửa|(?:một|1)\s+nửa\s+(?:giá|tiền|chi phí)|mua\s+\d\s+tặng\s+\d/gi,
  /ครึ่งราคา|ครึ่งหนึ่ง|ครึ่งนึง|ครึ่งเดียว|\d\s?แถม\s?\d/g,
  /пол\s?цены|половин[а-яё]*\s+(?:цены|стоимости)|вдвое\s+дешевле|(?:треть|четверть)\s+дешевле|дешевле\s+на\s+(?:треть|четверть|половину)|два\s+по\s+цене\s+одного/gi,
  /moiti[ée]\s+(?:du\s+)?(?:prix|tarif)|demi[-\s]tarif|\b(?:un|deux)\s+(?:tiers|quart|cinquième)\s+de\s+(?:réduction|remise|moins)|deux\s+pour\s+le\s+prix\s+d['’]un/gi,
  /(?:арван|хорин|гучин|дөчин|тавин|жаран|далан|наян|ерэн|зуун|таван|арав)\s+хув[а-яёөү]*|(?:тал|хагас)\s+үнэ[а-яёөү]*|үнийн\s+тал/gi,
  /نصف\s+(?:السعر|الثمن)|خصم\s+(?:النصف|الربع|الخمس|الثلث)/g,
];

// ── C-5 금지 표현 (의료광고 — consultPrep/adGuard.ts 의 목록에서 채팅에 맞는 것만. 할인·프로모션 낱말은 막지 않는다) ──
// 먼저 소문자로 바꾸고, 주장이 아닌 흔한 말(일정을 묻는 말 · 정직한 부정문)을 지운 다음 본다.
// 지우는 식은 좁게 쓴다 — "효과를 보증할 수 있습니다"까지 지우면 주장이 빠져나간다.
const SCHEDULING_WORD = String.raw`\b(?:what|which|when|whichever|whatever|time|date|day|slot|hour|morning|afternoon|evening)\b[^.!?\n]{0,30}?`;
const HARMLESS_PHRASES: RegExp[] = [
  // 일정을 묻는 말
  new RegExp(String.raw`${SCHEDULING_WORD}\b(?:works?|worked|suits?|fits?)\s+(?:for\s+)?(?:you\s+)?best\b`, 'g'),
  new RegExp(String.raw`${SCHEDULING_WORD}\b(?:is|be|are|would\s+be)\s+best\s+for\s+you\b`, 'g'),
  /\bbest\s+(?:times?|days?|dates?|way\s+to\s+(?:get|reach|come|contact|travel|find)|contact|number|regards|wishes)\b/g,
  /\bdo(?:ing)?\s+(?:our|my)\s+(?:very\s+)?best\b/g,
  /\bit(?:['’]s|\s+is|\s+would\s+be)\s+best\s+to\s+(?:come|arrive|book|bring|avoid|wear|check|contact|let|reserve|visit|schedule)\b/g,
  /(?:^|\n)\s*perfect\s*[,!.]/g,
  /\b(?:that['’]s|that\s+is|sounds|(?:[ap]m|:\d\d)\s+is)\s+perfect\b/g,
  /\b(?:that|this|it|time|date|day)\s+(?:\w+\s+){0,2}(?:works?|fits?)\s+perfectly\b/g,
  // 정직한 부정문 — 영어
  /\b(?:not|isn['’]t|aren['’]t|non|semi|no\s+treatment\s+is|rather\s+than)[-\s]*(?:a\s+|an\s+|considered\s+|truly\s+)?permanent(?:ly)?\b/g,
  /\b(?:cannot|can['’]t|can\s+not|could\s+not|couldn['’]t|do\s+not|don['’]t|does\s+not|doesn['’]t|unable\s+to|not\s+able\s+to|no|not|never|without(?:\s+any)?)\s+(?:a\s+|be\s+|fully\s+)?guarantee[a-z]*\b/g,
  /\b(?:isn['’]t|aren['’]t|wasn['’]t|won['’]t|wouldn['’]t)\s+(?:be\s+|fully\s+|ever\s+)?guarantee[a-z]*\b/g,
  /\b(?:do\s+not|don['’]t|cannot|can['’]t|unable\s+to)\s+(?:offer|give|provide|make)\s+(?:a\s+|any\s+)?guarantee[a-z]*\b/g,
  /\bguarantee[a-z]*\s+(?:cannot|can['’]t|can\s+not)\s+be\s+(?:given|offered|made)\b/g,
  /\b(?:cannot|can['’]t|could\s+not|couldn['’]t)\s+(?:say|claim|promise)\s+(?:that\s+)?(?:there\s+(?:are|will\s+be)\s+)?no\s+side[-\s]?effects?\b/g,
  /\bno\s+treatment\s+is\s+(?:completely\s+|entirely\s+)?(?:without|free\s+of|free\s+from)\s+side[-\s]?effects?\b/g,
  /(?:\bnot|n['’]t|\bnever)\s+(?:(?:going\s+to\s+)?(?:last|stay|remain|hold|work)s?\s+)?(?:forever|permanently|for\s+life)\b/g,
  /\bno\s+(?:treatment|procedure)\s+is\s+(?:completely\s+|entirely\s+|totally\s+)?(?:risk[-\s]free|without\s+risks?|free\s+of\s+risks?)\b|(?:\bnot|n['’]t|\bnever)\s+(?:completely\s+|entirely\s+|totally\s+)?risk[-\s]free\b/g,
  // 프랑스어 — 긴 꼴을 먼저 지운다("ne peut pas garantir qu'il n'y a aucun effet secondaire" 의 앞부분만 지우면 뒤가 주장으로 남는다)
  /\bne\s+(?:peut|peux|pouvons|saurait|saurions|pourrions)\s+pas\s+(?:dire|affirmer|prétendre|promettre|garantir)\s+qu['’]il\s+n['’]y\s+a(?:it|ura)?\s+(?:aucun\s+|pas\s+d['’])effets?\s+secondaires?/g,
  /\bmeilleure?s?\s+(?:délais?|moments?|créneaux?|horaires?|heures?|dates?|jours?|salutations|vœux|itinéraires?|(?:moyens?|façons?)\s+de\s+(?:vous\s+|nous\s+)?(?:joindre|contacter|venir|rendre))/g,
  /\bne\s+(?!\S+\s+que\s)(?!\S+\s+pas,)(?:\S+\s+){0,3}garanti\S*/g,
  /\bsans\s+garantie\b|\bpas\s+(?:de\s+)?garanti\S*|\baucune\s+garantie\b|\bimpossible\s+de\s+garantir\b/g,
  /\b(?:pas|non)\s+(?:un\s+|une\s+)?(?:résultat\s+|solution\s+)?permanente?s?\b|\baucun\s+traitement\s+n['’]est\s+sans\s+effets?\s+secondaires?/g,
  // 러시아어 — "вполне гарантируем" 의 "не" 를 부정으로 읽지 않게 앞 글자를 본다
  /(?<![а-яё])не\s+(?:можем\s+|могу\s+|может\s+|можно\s+|даём\s+|даем\s+)?гарант[а-яё]*|(?:невозможно|нельзя)\s+гарант[а-яё]*|гарант[а-яё]*\s+(?:результат[а-яё]*\s+)?(?:(?:мы\s+)?не\s+мо[жг][а-яё]*|невозможно|нельзя)|(?:нет|без)\s+гарант[а-яё]*/g,
  /не\s+навсегда|нельзя\s+сказать,?\s+что\s+побочных\s+эффектов\s+(?:нет|не\s+бывает)|(?:всего|с)\s+наилучш(?:его|ими\s+пожеланиями)/g,
  /(?<![а-яё])не\s+(?:является\s+|будет\s+|бывает\s+)?(?:постоянн|перманентн|пожизненн|вечн)[а-яё]*/g,
  // 일본어 — 부정으로 끝나는 꼴만("保証できます" 는 주장이다)
  /保証(?:は|を|も)?(?:できません|できかねます|できない|できず|でき兼ねます|いたしかねます|致しかねます|しかねます|するものではありません|することはできません|はいたしておりません|しておりません|はしておりません|はございません|はありません|されるものではありません)/g,
  /(?:(?:半)?永久|永遠|永続)(?:的)?(?:(?:な|する)(?:もの|効果|結果|わけ))?で(?:は|も)(?:ありません|なく|ない|ございません)|永続(?:は)?(?:しません|しない)|永久脱毛ではなく/g,
  /(?:(?:永久|永遠)(?:的)?に(?:は)?|一生)(?:効果[がはも])?(?:続|持続|維持|残|効)[ぁ-ん]{0,8}?(?:わけではありません|わけではない|ものではありません|ものではない|ことはありません|ことはない|とは限りません|きません|しません)/g,
  /副作用(?:が|は)(?:全く|まったく|一切)?ない(?:わけでは|とは(?:言え|いえ|限り))/g,
  // 중국어
  /(?:不是|并非|並非|并不是|並不是|不会|不會|无法|無法|不能|不可能|并不能|並不能)(?:永久|永远|永遠|终身|終身|一[劳勞]永逸)/g,
  /(?:无法|無法|不能|难以|難以|不敢|不会|不會|没有|沒有|不做|不作|不)(?:向您|对您|對您|完全|任何|做出|给出|給出)?(?:任何)?(?:保证|保證)|保证金|保證金/g,
  /(?:不能说|不能說|不可能|并非|並非|不是)(?:完全|绝对|絕對)?(?:没有|沒有|无|無)副作用/g,
  // 한국어
  /영구(?:적)?(?:이|인\s?것[이은도]|인\s?건|이지는|이지|이진)?\s?(?:않|아니|아닙)|영구(?:적)?이라고\s?(?:할|말씀드릴)\s?수(?:는)?\s?없|영구(?:적)?이라고\s?(?:하기|말씀드리기|보기)(?:는)?\s?어렵/g,
  /보장(?:할 수는? 없|해 드릴 수는? 없|하기(?:는)? 어렵|은 어렵|되지는? 않|드릴 수 없|하지 않|해 드리기 어렵|드리기 어렵)/g,
  /부작용이 없다고 (?:할|말씀드릴) 수(?:는)? 없/g,
  // 베트남어 · 태국어 · 아랍어 · 몽골어 — 긴 꼴("…라고 말할 수는 없다")을 먼저 지운다
  /không\s+thể\s+(?:nói|khẳng định|cam kết|đảm bảo|bảo đảm)\s+(?:là\s+|rằng\s+)?(?:hoàn toàn\s+)?không\s+có\s+tác dụng phụ|không\s+phải\s+(?:là\s+)?(?:hoàn toàn\s+)?không\s+có\s+tác dụng phụ/g,
  /không\s+(?:phải\s+(?:là\s+)?|(?:kéo dài|duy trì|tồn tại|giữ được|có tác dụng|có hiệu quả|mang lại hiệu quả)\s+)?vĩnh viễn/g,
  /không\s+(?:có\s+gì\s+|thể\s+|hề\s+)?(?:cam kết|đảm bảo|bảo đảm)/g,
  /ไม่สามารถ(?:บอก|พูด|ยืนยัน|รับรอง)(?:ได้)?ว่า(?:จะ)?ไม่มีผลข้างเคียง|ไม่ใช่ว่า(?:จะ)?ไม่มีผลข้างเคียง/g,
  /ไม่(?:ได้|ใช่)?(?:อยู่|คงอยู่|คง|เป็น)?(?:แบบ|อย่าง)?ถาวร|ไม่(?:สามารถ|ได้|มีการ)?(?:รับประกัน|การันตี)/g,
  /(?:เวลา|วัน|ช่วง)(?:ไหน)?(?:ที่)?(?:สะดวก|ดี)ที่สุด/g,
  /لا\s+(?:يمكن(?:نا)?|نستطيع)\s+(?:القول|أن\s+نقول|الجزم|التأكيد)\s+(?:إنه|أنه|بأنه|أن|بأن)\s*لا\s+توجد\s+(?:أي\s+)?آثار\s+جانبية/g,
  /(?:غير|ليست|ليس)\s+مضمون[؀-ۿ]*|لا\s+(?:نضمن|يمكننا\s+ضمان|نستطيع\s+ضمان|يمكن\s+ضمان)/g,
  /(?:мөнхийн|байнгын|баталгаатай)\s+биш|баталгаа\s+өг[а-яёөү]*\s+(?:боломжгүй|чадахгүй|аргагүй)|баталгаа\s+(?:өгөхгүй|байхгүй)|баталгаажуул[а-яёөү]*\s+(?:боломжгүй|чадахгүй|аргагүй)|баталгаажуулахгүй/g,
];

const BANNED_SUBSTRINGS = [
  // 한국어
  '최고', '유일', '100%', '완벽', '영구', '부작용 없', '부작용이 없', '부작용은 없', '보장',
  // 일본어·중국어
  '最强', '最強', '最優秀', '最优秀', 'ナンバーワン', '唯一', '完璧', '完美', '永久', '无副作用', '無副作用',
  '保証', '保证', '保證', '第一名', '排名第一', '業界一', '世界一',
  // 베트남어·태국어
  'vĩnh viễn', 'hoàn hảo', 'không có tác dụng phụ', 'không gây tác dụng phụ', 'cam kết',
  'ดีที่สุด', 'รับประกัน', 'การันตี', 'ถาวร', 'สมบูรณ์แบบ', 'ไม่มีผลข้างเคียง',
  // 러시아어·몽골어
  'наилучш', 'навсегда', 'идеальн',
  'хамгийн сайн', 'баталгаатай', 'гаж нөлөөгүй',
  // 프랑스어·아랍어
  'sans effet secondaire', 'sans effets secondaires', 'aucun effet secondaire',
  "pas d'effet secondaire", 'pas d’effet secondaire', "pas d'effets secondaires", 'pas d’effets secondaires',
  'مضمون', 'مثالي', 'بدون آثار جانبية', 'بلا آثار جانبية', 'لا توجد آثار جانبية', 'لا آثار جانبية',
] as const;

// 흔한 말과 겹치는 낱말은 주장하는 꼴만 막는다 — "您最好提前预约"(미리 예약하시는 게 좋습니다) · "Để đảm bảo có chỗ"(자리를 잡으려면) · "من الأفضل أن …"(~하는 편이 좋습니다)
const BANNED_PATTERNS: ReadonlyArray<{ label: string; re: RegExp }> = [
  // 영어
  { label: 'best', re: /\bbest\b/ },
  { label: 'perfect', re: /\bperfect(?:ly|ion)?\b|\bflawless\b/ },
  { label: 'permanent', re: /\bpermanent(?:ly|e|es|s)?\b|\b(?:forever|for\s+life|lifelong|life[-\s]long|everlasting|never\s+wears?\s+off)\b/ },
  {
    label: 'guarantee',
    re: /\bguarantee[a-z]*\b|\bresults?\s+(?:are|is)\s+(?:assured|certain)\b|\bwe\s+promise\s+(?:you(?:['’]ll|\s+will)\s+look|results?)\b|\bmoney[-\s]back\b|\bfull\s+refund\b|\b(?:definitely|always)\s+works?\b/,
  },
  {
    label: 'no side effects',
    re: /(?:\b(?:no|not|never|zero|without)|n['’]t)\s+(?:(?:have|has|having|cause|causes|causing|experience|see|expect|be|any|known|real|serious|significant|major|lasting|notable|a|the)\s+){0,3}(?:side[-\s]?effects?|adverse\s+effects?)\b|\b(?:free\s+of|free\s+from)\s+(?:any\s+)?side[-\s]?effects?\b|\bside[-\s]?effect[-\s]?free\b|\bside[-\s]?effects?\s+(?:never|are\s+nonexistent|do\s+not\s+occur|don['’]t\s+occur)|\b(?:risk[-\s]free|zero\s+risk|no\s+risk)\b/,
  },
  {
    label: 'no.1',
    re: /\bno\.?\s?1\b|\bnumber[-\s]+(?:one|1)\b|#\s?1\b|\b(?:top|leading|finest|safest|greatest|premier)\s+(?:\w+\s+)?(?:clinic|hospital|doctors?|surgeons?|specialists?|provider|centre|center)\b|\b(?:top[-\s]rated|unmatched|unrivall?ed|world[-\s]class|second\s+to\s+none|ranked\s+first|safest|most\s+effective)\b|\bbetter\s+than\s+(?:any|other|all)\b/,
  },
  {
    label: 'the only',
    re: /\b(?:the\s+)?(?:only|sole)\s+(?:\w+[-\s]){0,2}(?:clinic|hospital|doctor|provider|partner|centre|center)\b|\bone\s+and\s+only\b|\bonly\s+we\b/,
  },
  // 일본어
  { label: '最高', re: /最高(?![可达達为為至で\d]|気温|原则|原則)/ },
  {
    label: '一番',
    re: /一番(?:です|人気|効果|おすすめ)|当院が一番|ベスト(?:な|の(?:施術|治療|結果|クリニック))|最良|最も優れ|ナンバー\s?1|[日韓]国?一(?:の|です)|日本一|トップクラス|オンリーワン|当院だけ|パーフェクト|完全に安全|保障|確実に(?:効果|結果|改善|若返)|必ず効果|絶対(?:に)?(?:安全|効果|大丈夫|おすすめ)|(?:効果|結果)(?:を|は)お約束|永続|永遠|一生続/,
  },
  {
    label: '副作用なし',
    re: /副作用(?:は|が|も|の)?(?:ほとんど|一切|全く|まったく|ほぼ|特に)?(?:な[いくしかさ]|無[いくし]|ありません|ございません|ゼロ|出ません|起こりません|起きません)|副作用の心配(?:は|も)?(?:ありません|ございません|ない|なく|いりません)|副作用フリー|ノーリスク|リスクは(?:ありません|ございません)/,
  },
  // 중국어
  { label: '最好的', re: /最好的(?!时间|時間|方式|办法|辦法|联系方式|聯絡方式|聯繫方式)/ },
  { label: '最佳', re: /最佳(?!时间|時間|时机|時機|方式|路线|路線|到院时间|到院時間)/ },
  {
    label: '最好',
    re: /(?:效果|技术|技術|口碑|服务|服務)最好|[医醫]院最好|我[们們]是最(?:棒|好|强|強)|最(?:棒|专业|專業|先进|先進|安全|有效)|(?:韩国|韓國|首尔|首爾|全国|全國|业内|業內)第一|顶级|頂級|顶尖|頂尖|首屈一指|独家|獨家|仅此一家|僅此一家|只有我们|只有我們/,
  },
  {
    label: '保证',
    re: /有保障|品质保障|品質保障|包您|确保效果|確保效果|承[诺諾](?:效果|结果|結果|有效)|一定有效|[绝絕][对對](?:安全|有效|没问题|沒問題|可以|放心)|百分百|永远|永遠|终身|終身|一劳永逸|一勞永逸/,
  },
  {
    label: '没有副作用',
    re: /(?:无|無|没有|沒有|不会有|不會有|零)(?:任何|什么|什麼)?(?:的)?副作用|[没沒]副作用|不[会會](?:产生|產生|出现|出現|有)(?:任何)?副作用|副作用[为為]零|不存在副作用|不用担心副作用|不用擔心副作用|[没沒]有不良反应|[没沒]有不良反應|[零无無]风险|[零无無]風險/,
  },
  // 한국어
  {
    label: '부작용 없음',
    re: /부작용\s?(?:도|이|은)?\s?(?:전혀\s)?없(?!다고)|부작용\s?(?:걱정\s?없|제로)|(?:제일|가장)\s?좋(?!은\s?(?:시간|날|날짜|방법|때))|\d\s?위(?![가-힣])|1등|넘버원|최상|베스트|저희만|퍼펙트|완전히\s?안전|보증(?!금)|확실한\s?효과|반드시\s?효과|무조건\s?효과|영원히|평생|백\s?프로/,
  },
  // 베트남어
  { label: 'tốt nhất', re: /(?<!(?:thời gian|thời điểm|ngày|giờ|lúc|là)\s)tốt nhất(?!\s+(?:là|nên|bạn nên))/ },
  {
    label: 'đảm bảo',
    re: /(?:đảm bảo|bảo đảm)\s+(?:kết quả|hiệu quả|an toàn|thành công)|(?:kết quả|hiệu quả)\s+(?:được\s+|sẽ\s+)?(?:đảm bảo|bảo đảm)|(?<!không\s(?:thể\s)?)(?:đảm bảo|bảo đảm)\s+(?:sẽ|không)|bảo hành|chắc chắn hiệu quả/,
  },
  {
    label: 'hàng đầu',
    re: /hàng đầu|số (?:1|một)(?![\d/])\s+(?:hàn|seoul|thế giới|châu á)|top 1|(?:uy tín|hiệu quả|an toàn) nhất|(?:phòng khám|nơi|địa chỉ|bác sĩ|cơ sở)\s+duy nhất|an toàn tuyệt đối|tuyệt đối an toàn|hiệu quả tuyệt đối|mãi mãi|suốt đời|trọn đời/,
  },
  {
    label: 'không tác dụng phụ',
    re: /(?<!không phải (?:là )?)(?:không|chẳng)(?:\s+hề)?(?:\s+(?:có|để lại|gây))?(?:\s+bất kỳ)?\s+(?:tác dụng phụ|phản ứng phụ|biến chứng)/,
  },
  // 태국어
  {
    label: 'อันดับ 1',
    re: /อันดับ\s?(?:1|หนึ่ง)|เบอร์\s?(?:1|หนึ่ง)|ที่หนึ่งใน|(?:ยอดเยี่ยม|ปลอดภัย|เห็นผล)ที่สุด|ดีสุด|แห่งเดียว|หนึ่งเดียว|ที่เดียวเท่านั้น|ตลอดไป|ตลอดชีวิต|ไร้ผลข้างเคียง|ไม่มีอาการข้างเคียง|ปราศจากผลข้างเคียง|ไม่(?:ทำให้)?เกิดผลข้างเคียง|(?<!รับ)ประกันผล|รับรอง(?:ผล|ว่า)|เห็นผล(?:แน่นอน|ชัวร์)|เพอร์เฟ[กค]|ไร้ที่ติ|100\s?เปอร์/,
  },
  // 러시아어
  {
    label: 'лучший',
    re: /лучш(?:ий|ая|ее|ие|ую|его|ей|им|их|ими|ем|е\s+всех|е,?\s+чем)(?![а-яё])(?!\s+(?:время|день|дата|дату|случае|способ\s+(?:связ|добрат|оплат)))/,
  },
  { label: 'гарантия', re: /гарант[а-яё]*|обещаем\s+результат|точно\s+поможет/ },
  {
    label: 'без побочных',
    re: /(?:без|нет|никаких)\s+побочных|побочных\s+(?:эффектов|действий)\s+(?:нет|не\s+бывает|не\s+будет|не\s+возникает)|отсутствуют\s+побочные|побочные\s+эффекты\s+отсутствуют|без\s+каких-либо\s+побочных|не\s+(?:вызывает|имеет)\s+побочных|без\s+побочек|без\s+осложнений/,
  },
  {
    label: 'номер один',
    re: /номер\s+один|первое\s+место|топ-?1|ведущ[а-яё]+\s+клиник|единственн[а-яё]+\s+(?:клиник|центр|врач|место)|только\s+у\s+нас|сам(?:ый|ая|ое|ые)\s+(?:безопасн|эффективн)|безупречн|совершенно\s+безопасн|абсолютно\s+безопасн|постоянн[а-яё]+\s*(?:эффект|результат)|эффект\s+постоянн|(?:эффект|результат)[^.!?\n]{0,60}?(?<![а-яё])(?:постоянн|вечн)(?:ый|ым|ен|на|ая|ое)(?![а-яё])|перманентн|пожизненн|на\s+всю\s+жизнь|вечн[а-яё]+\s+результат/,
  },
  // 프랑스어
  { label: 'meilleur', re: /\bmeilleure?s?\b/ },
  { label: 'garanti', re: /\bgaranti[a-zé]*|\brésultats?\s+assurés?\b|\bpromettons\s+un\s+résultat|\bsatisfait\s+ou\s+remboursé\b/ },
  {
    label: 'la seule',
    re: /\b(?:la\s+seule|le\s+seul|l['’]unique)\s+(?:\w+\s+)?(?:clinique|centre|établissement)|\bclinique\s+unique\b|\brésultats?\s+parfaits?\b|\bparfaitement\s+(?:sûr|sans|naturel)|\btop\s+clinique\b|\b(?:résultats?|effets?)\s+définitifs?\b|(?:^|[^a-zà-ÿ])à\s+vie\b|\bpour\s+toujours\b|\bn[°º]\s?1\b|\bnuméro\s+(?:1|un)\b/,
  },
  { label: 'sans effets', re: /\bzéro\s+effet|\b(?:sans|aucun)\s+effets?\s+indésirables?|\b(?:sans\s+aucun|aucun)\s+risque\b/ },
  // 몽골어
  {
    label: 'шилдэг',
    re: /шилдэг|тэргүүлэх|номер\s+нэг|цорын\s+ганц|төгс(?![а-яёөү])|мөнхийн|байнгын\s+үр|үр\s+(?:дүн|нөлөө)[а-яёөү]*\s+(?:нь\s+)?байнгын|насан\s+туршийн|баталгаа\s+өг|үр\s+дүнг\s+батална|үр\s+(?:дүн|нөлөө)[а-яёөү]*\s+(?:[а-яёөү]+\s+)?баталгаажуул|гаж\s+нөлөө\s+(?:байхгүй|үгүй)|сөрөг\s+нөлөөгүй|зуун\s+хувь|хамгийн\s+(?:шилдэг|аюулгүй)|эрсдэлгүй/,
  },
  // 아랍어
  {
    label: 'أفضل',
    re: /[أا]فضل\s+(?:عيادة|مستشفى|طبيب|نتيجة|النتائج|نتائج|سعر|الأسعار|علاج|جودة|العيادات|الأطباء|مركز)|(?:نحن|عيادتنا|هي)\s+ال[أا]فضل|ال[أا]فضل\s+في|الأولى\s+في|رقم\s+(?:1|واحد)\s+في|(?:العيادة|المركز|المكان)\s+الوحيد[ةه]?/,
  },
  { label: 'ضمان', re: /نضمن|ضمان\s+(?:النتيجة|النتائج|نتيجة|كامل)|[أا]ضمن\s+ل|تضمن\s+العيادة|بضمان|أكيدة|مية\s+مية/ },
  {
    label: 'دائم',
    re: /(?<!ليست\s|ليس\s|غير\s)دائم[ةه]?(?![؀-ۿ])|إلى\s+الأبد|مدى\s+الحياة|(?:بدون|دون|بلا|ليس\s+ل(?:ه|ها)|لا\s+(?:يوجد|توجد))\s+(?:أي\s+)?(?:آثار|اثار|أعراض|اعراض|مضاعفات)|خالي?\s+من\s+الآثار/,
  },
  // 유인 · 압박 (제안형 응대 §4.5 — 엑셀 시트 1 마-1). 프로모션 기간을 사실로 말하는 것("10/31까지")은 막지 않는다.
  // "서두르실 필요 없어요" · "no hurry" 같은 반대 뜻은 지나가게 한다.
  {
    label: 'pressure',
    re: new RegExp(
      [
        String.raw`\b(?:only\s+today|today\s+only|last\s+chance|(?:do\s+not|don['’]t)\s+miss|act\s+now|selling\s+out|while\s+(?:stocks?|supplies)\s+last)\b`,
        String.raw`(?<!\bno\s)(?<!\bno\s+need\s+to\s)(?<!n['’]t\s)(?<!\bnot\s+in\s+a\s)\bhurry\b`,
        String.raw`\blimited\s+(?:quantit(?:y|ies)|stock|slots?|spots?|availability|places|seats)\b|\b(?:only\s+)?a\s+few\s+(?:slots?|spots?|places)\s+left\b|\balmost\s+(?:fully\s+)?booked\b`,
        String.raw`지금만|오늘만|오늘\s?(?:결제|예약)하시면|마지막\s?기회|놓치지\s?마|서두르(?!실\s?필요|지\s?않|지\s?마)|자리가\s?(?:거의\s)?없|한정\s?수량|마감\s?임박|선착순`,
        '今だけ|本日限り|本日限定|最後のチャンス|お見逃しなく|お急ぎください|残りわずか|数量限定|先着',
        '仅限今天|只限今天|今天截止|最后机会|最後機會|不要错过|不要錯過|别错过|別錯過|抓紧|抓緊|名额有限|名額有限|限量|仅剩|僅剩|先到先得',
        'chỉ hôm nay|cơ hội cuối|đừng bỏ lỡ|nhanh tay|số lượng có hạn',
        'วันนี้เท่านั้น|โอกาสสุดท้าย|อย่าพลาด|จำนวนจำกัด',
        String.raw`только\s+сегодня|последний\s+шанс|не\s+упустите|(?<!не\s)спешите|количество\s+ограничено`,
        String.raw`aujourd['’]hui\s+seulement|seulement\s+aujourd['’]hui|dernière\s+chance|ne\s+manquez\s+pas|dépêchez-vous|places\s+limitées|quantités?\s+limitées?`,
        String.raw`зөвхөн\s+өнөөдөр|сүүлчийн\s+боломж|битгий\s+алдаарай|бүү\s+алдаарай|тоо\s+хязгаартай|яараарай`,
        String.raw`اليوم\s+فقط|الفرصة\s+الأخيرة|لا\s+تفوت|عدد\s+محدود|كمية\s+محدودة`,
      ].join('|')
    ),
  },
];

// ── C-6 AI·봇·자동 응대라는 말, 사람이라는 말 ("사람인가요?"의 답은 프로그램이 붙인다) ─────────────
// "자동으로 차감된다" · "automatically applied" 같은 문장까지 막지 않도록 '자동'은 응대·도우미와 붙은 꼴만 본다.
// 사람이라는 말은 "제가 사람입니다" 꼴만 막는다 — "직원이 오늘 답해 드립니다"는 약속이지 정체에 대한 말이 아니다.
const NOT_CYRILLIC_BEFORE = '(?<![а-яёөү])';
const NOT_CYRILLIC_AFTER = '(?![а-яёөү])';
const ARABIC = String.raw`[؀-ۿ]`;
const AI_WORD_PATTERNS: RegExp[] = [
  /\bA\.?I\b/, // 대문자만 — "Thai" 는 아니다
  /\bIA\b|\bI\.A\b/,
  /(?<![А-Яа-яЁё])ИИ(?![А-Яа-яЁё])/,
  /\b(?:an?|as|the)\s+ai\b|\bA\s?I\s+(?:assistant|agent)\b/i,
  /\b(?:chat)?bots?\b/i,
  /\brobots?\b/i,
  /\b(?:chat)?gpt\b|\bgpt[-\s]?\d|\bopenai\b|\bllm\b|\bneural\s+network\b/i,
  /language model/i,
  /artificial[-\s]intelligence|\b(?:virtual|digital|smart|automated)\s+(?:consultant|helper|concierge|assistant|agent)\b/i,
  /\bautomat(?:ed|ion)\b|\bauto[-\s]generated\b|\b(?:machine|computer)[-\s]generated\b|\bgenerated\s+automatically\b/i,
  /\bautomatic\s+(?:assistant|agent|system|repl(?:y|ies)|responses?|messages?)\b/i,
  /\bauto[-\s]?(?:repl(?:y|ies)|responder|responses?)\b/i,
  /人工智能|人工智慧|机器人|機器人|自[动動](?:回[复復覆应應]|助手|助理|客服|[应應]答|[发發]送)|智能助手|智能客服|智能助理|智慧助理|智慧客服|[虚虛][拟擬](?:助手|助理|客服)|数字人|數位人|数字助理|线上助理|(?:电脑|電腦)程序|我是(?:机器|機器|程序)/,
  /自動(?:応答|返信|対応|メッセージ|案内|チャット|システム)|チャットボット|ボット|人工知能|バーチャルアシスタント|エーアイ|機械です/,
  /인공지능|챗봇|(?<![가-힣])봇(?:입니다|이에요|이야)|로봇|자동\s?(?:응대|응답|답변|안내|시스템)|에이아이/,
  /trí tuệ nhân tạo|trợ lý (?:ảo|tự động|số|trực tuyến)|(?:trả lời|tin nhắn|hệ thống|phản hồi)\s+tự động|tự động\s+trả lời|phần mềm|rô-?\s?bốt/i,
  /ปัญญาประดิษฐ์|บอท(?!็อก|อก)|บอต|เอไอ|หุ่นยนต์|ผู้ช่วย(?:อัตโนมัติ|เสมือน|ดิจิทัล)|(?:ระบบ|ตอบ(?:กลับ)?|ข้อความ)อัตโนมัติ/,
  new RegExp(
    `искусственн|робот|чат-?бот|автоответ|нейросет|автоматическ[а-яё]*\\s+(?:помощник|ответ|ассистент|система|сообщени|режим)|виртуальн[а-яё]*\\s+(?:помощник|ассистент)|${NOT_CYRILLIC_BEFORE}бот(?:а|у|ом|е|ы|ов)?${NOT_CYRILLIC_AFTER}`,
    'i'
  ),
  /intelligence artificielle|assistante?\s+(?:virtuelle?|automatique|automatisée?)|\b(?:réponses?|systèmes?|messages?)\s+automati(?:que|sée?)s?|agent\s+conversationnel|programme\s+informatique|\bune\s+ia\b/i,
  /хиймэл оюун|автомат(?:аар)?\s+(?:туслах|хариул|систем)|виртуал\s+туслах/i,
  new RegExp(
    `[إا]صطناعي|روبوت|مساعدة?\\s+(?:ال)?(?:[آا]لي|[آا]لية|افتراضي|افتراضية|رقمي|رقمية)|(?:رد|ردود|الرد|نظام)\\s+(?:ال)?(?:آلي|تلقائي|تلقائية|الآلي)|(?<!${ARABIC})(?:ال)?بوت(?!${ARABIC})`
  ),
  // 사람(또는 기계)이라고 스스로 말하는 것
  /\b(?:i(?:['’]m|\s+am)|you(?:['’]re|\s+are)\s+(?:talking|speaking|chatting)\s+(?:to|with))\s+(?:not\s+)?(?:an?\s+|the\s+|one\s+of\s+(?:the\s+|our\s+)?)?(?:real\s+|actual\s+|live\s+|human\s+)?(?:\w+,\s+(?:an?\s+|one\s+of\s+(?:the\s+|our\s+)?))?(?:person|people|humans?|agents?|staff|consultants?|coordinators?|nurses?|employees?|member|machine|software|algorithm|computer\s+program)\b|\bnot\s+a\s+machine\b|\bhuman[-\s]like\b/i,
  /(?:我|本人|这边|這邊|这里|這裡)(?:们|們)?(?:不|就)?是(?:真人|人工|人类|人類|真实的人|真實的人|工作人员|工作人員|本院客服|咨询师|諮詢師|人(?![员員工性]))/,
  /(?:私|わたし|わたくし|こちら)(?:は|が)?.{0,8}(?:人間|スタッフです)|はい、人です|人間です|生身|本物のスタッフ/,
  /(?:네|예),?\s?(?:저는\s)?사람입니다|(?:실제|진짜)\s?(?:사람|상담원|직원)|저는\s?(?:상담원|직원|기계|프로그램)/,
  /tôi là (?:máy|con người|người thực|người thật|nhân viên)|เป็น(?:คน|มนุษย์)(?:ค่ะ|ครับ|จริง)|คนจริง|เจ้าหน้าที่จริง|พนักงานจริง|แอดมินตอบเอง/i,
  new RegExp(
    `${NOT_CYRILLIC_BEFORE}я\\s*-?\\s*(?:не\\s+)?(?:живой\\s+|реальный\\s+|настоящий\\s+)?(?:человек|сотрудник|оператор|консультант|администратор|программа|машина)${NOT_CYRILLIC_AFTER}|с\\s+вами\\s+(?:общается|говорит|переписывается)\\s+(?:живой\\s+|реальный\\s+|настоящий\\s+)?человек`,
    'i'
  ),
  /\bje\s+suis\s+(?:bien\s+)?(?:une?\s+)?(?:vraie?\s+)?(?:personne|humaine?|conseill(?:er|ère)|membre|machine|programme)\b|\ben\s+chair\s+et\s+en\s+os\b/i,
  new RegExp(`би\\s+(?:жинхэнэ\\s+|амьд\\s+)?(?:хүн|ажилтан|чатбот|программ|машин)${NOT_CYRILLIC_AFTER}`, 'i'),
  /أنا\s+(?:إنسان|موظفة?|شخص|برنامج|آلة|شاتبوت)/,
];

// ── 검사가 아는 언어로 썼는가 ───────────────────────────────────────────
// 답은 영어 · 일본어 · 중국어 · 베트남어 · 태국어 · 러시아어 · 프랑스어 · 몽골어 · 아랍어 · 한국어로만 쓴다(지시문).
// 그 밖의 언어로 쓴 금지 표현은 위의 목록이 알아보지 못하므로, 그런 답은 통째로 다시 쓰게 한다.
/** 검사가 모르는 문자 — 아르메니아 · 히브리 · 인도계 · 라오 · 티베트 · 미얀마 · 크메르 */
const OTHER_SCRIPT_RE = /[԰-׿ऀ-෿຀-࿿က-႟ក-៿]/;
/** 그 언어에서만 흔한 낱말 — 서로 다른 것이 둘 이상 나오면 그 언어로 쓴 글로 본다 (사람 이름과 겹치는 짧은 낱말은 뺐다) */
const OTHER_LANGUAGE_WORDS: ReadonlyArray<readonly [string, RegExp]> = [
  ['es', /\b(?:usted|gracias|hola|cuesta|precio|puede|quiere|nuestra|tratamiento|descuento|efectos|cita|día|qué|está)\b/gi],
  ['de', /\b(?:und|nicht|wir|können|bitte|termin|kostet|für|behandlung|rabatt|oder|ist|eine|das|sie)\b/gi],
  ['pt', /\b(?:você|obrigad[oa]|custa|cerca|damos|preço|não|tratamento|consulta|desconto|nossa|está|efeitos)\b/gi],
  ['it', /\b(?:grazie|prezzo|trattamento|siamo|può|della|nostro|sconto|effetti|circa)\b/gi],
  ['id', /\b(?:kami|anda|harga|untuk|dengan|tidak|sekitar|diskon|terima)\b/gi],
  ['tr', /\b(?:fiyat[ıi]?|için|değil|teşekkür|randevu|indirim|yaklaşık)\b/gi],
];

function otherLanguage(text: string): string | null {
  if (OTHER_SCRIPT_RE.test(text)) return 'script';
  for (const [lang, re] of OTHER_LANGUAGE_WORDS) {
    const distinct = new Set((text.match(re) ?? []).map((w) => w.toLowerCase()));
    if (distinct.size >= 2) return lang;
  }
  return null;
}

// ── C-7 주소 · C-8 전화번호 · 메신저 아이디 ─────────────────────────────
// 주소에 쓸 수 있는 ASCII 글자만 받는다(linkify.ts 와 같다) — 일본어·중국어 글이 띄어쓰기 없이 뒤에 붙어도 주소가 거기서 끝난다.
const URL_CHARS = String.raw`[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]`;
/** 어떤 꼴의 주소든(https · Https · line:// …) — 자료에 있는 것과 글자 하나까지 같아야 한다 */
const URL_SOURCE = `[A-Za-z][A-Za-z0-9+.-]*:\\/\\/${URL_CHARS}+`;
const URL_RE = new RegExp(URL_SOURCE, 'g');
/** 주소 바로 뒤에 전각 문장부호·한자가 붙은 곳 — 검사용 글로 바꾸면 전각 괄호·쉼표가 주소 글자가 되므로 먼저 띄운다 */
const URL_THEN_WIDE_RE = new RegExp(`(${URL_SOURCE})(?=[^\\x00-\\x7F])`, 'g');
const EMAIL_RE = /[A-Za-z0-9._%+-]+\s?@\s?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
/** http 없이 쓴 주소 (www.example.com · line.me/ti/p/… · youtu.be/…) — 손님 화면에서 눌리지 않고, 자료에 있는 주소인지도 알 수 없다 */
const BARE_DOMAIN_RE = new RegExp(
  String.raw`(?<![A-Za-z0-9@._/-])(?:[A-Za-z0-9-]+\.)+(?:(?:com|net|org|kr|io|me|jp|cn|app|link|ly|gl|info|biz|ru|fr|vn|tw|hk|sg|uk|page|site|xyz|shop|clinic|cc|tv|gg|co|ee|ai|asia|top|vip|online|store|live|club|agency)(?![A-Za-z0-9-])(?:\/${URL_CHARS}*)?|[A-Za-z]{2,}\/[A-Za-z0-9_@]${URL_CHARS}*)`,
  'gi'
);
/** "ID: xxx" · "아이디 xxx" · "微信号 xxx" 뒤의 아이디 */
const ID_AFTER_WORD_RE = /(\bID\b|아이디|微信号|微信號|账号|帳號|アイディー)\s*(?:is\b|:|は)?\s*@?([A-Za-z0-9][A-Za-z0-9._-]{3,})/g;
/** @아이디 */
const AT_HANDLE_RE = /(?<![A-Za-z0-9._%+-])@([A-Za-z0-9_][A-Za-z0-9_.]{2,})/g;

const YEAR = String.raw`(?:19|20|25)\d{2}`;
const MONTH = '(?:0?[1-9]|1[0-2])';
const DAY = String.raw`(?:0?[1-9]|[12]\d|3[01])`;
/** 2026-10-14 · 2026.10.14 · 2026. 10. 14 · 2026/10/16 — 전화번호 검사에서 뺀다. 진짜 날짜 꼴만("+82-10-6888-…" 을 날짜로 읽지 않게) */
const YMD_DATE_RE = new RegExp(String.raw`\b${YEAR}\s?[-./]\s?${MONTH}\s?[-./]\s?${DAY}\b`, 'g');
/** 14.10.2026 · 10-16-2026 · 14/10/2026 */
const DMY_DATE_RE = new RegExp(String.raw`(?<![\d+][-./\s]?)\b(?:${DAY}[-./]${MONTH}|${MONTH}[-./]${DAY})[-./]${YEAR}\b`, 'g');
/** 10.00-19.00 · 10.14-10.17 · 2025-2026 — 점으로 쓴 시각·날짜의 범위, 연도의 범위 */
const DOT_RANGE_RE = new RegExp(
  String.raw`(?<![\d.+-])(?:[01]?\d|2[0-4]|3[01])[.:][0-5]\d\s?-\s?(?:[01]?\d|2[0-4]|3[01])[.:][0-5]\d(?![\d-])(?!\.\d)|(?<![\d.+-])${YEAR}-${YEAR}(?![\d-])(?!\.\d)`,
  'g'
);
/** 구분 기호가 섞인 여덟 자리 이상의 숫자열 — 전화번호 후보 */
const PHONE_LIKE_RE = /\+?\(?\d(?:[\s().-]{0,2}\d){7,}/g;
const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_DIGITS = 15;

const digitsOf = (s: string): string => s.replace(/\D/g, '');
const trimUrl = (u: string): string => u.replace(/[.,;:!?)\]'"]+$/, '').replace(/\/$/, '');
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 넓은 글자(한글·한자·가나 등)를 두 칸으로 센 길이. */
export function textUnits(s: string): number {
  let n = 0;
  for (const ch of s) n += (ch.codePointAt(0) ?? 0) > 0x2e7f ? 2 : 1;
  return n;
}

/**
 * 써도 되는 전화번호를 글에서 찾는 식. 나라 번호를 뺀 꼴("9123 4567")도 받도록 뒤쪽 여덟 자리 이상이면 같은 번호로 본다.
 * 긴 것부터 찾는다. 전화번호 길이(8~15자리)가 아닌 것은 쓰지 않는다.
 */
function allowedPhonePatterns(allowed: readonly string[]): RegExp[] {
  const forms = new Set<string>();
  for (const raw of allowed) {
    const digits = digitsOf(raw);
    if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) continue;
    for (let cut = 0; digits.length - cut >= MIN_PHONE_DIGITS; cut += 1) forms.add(digits.slice(cut));
  }
  return [...forms]
    .sort((a, b) => b.length - a.length)
    .map((form) => new RegExp(`(?<!\\d)(?:\\+|0)?${form.split('').join('[\\s().-]{0,3}')}(?!\\d)`, 'g'));
}

function bannedHit(text: string): string | null {
  let lower = text.toLowerCase();
  for (const re of HARMLESS_PHRASES) lower = lower.replace(re, ' ');
  const word = BANNED_SUBSTRINGS.find((w) => lower.includes(w));
  if (word) return word;
  return BANNED_PATTERNS.find((p) => p.re.test(lower))?.label ?? null;
}

/**
 * AI가 쓴 글을 검사한다 (C-2 ~ C-9). 걸린 이유의 목록을 돌려준다 — 비어 있으면 통과.
 * 꼬리표({{P000}} 꼴)는 프로그램이 금액 줄로 바꾸므로 검사에서 뺀다.
 */
export function checkReplyText(reply: string, ctx: GuardContext): string[] {
  const issues: string[] = [];
  const tags = [...reply.matchAll(priceTagPattern())].map((m) => m[1]);
  const offerTags = [...reply.matchAll(offerTagPattern())].map((m) => m[1]);
  const own = reply.replace(priceTagPattern(), ' ').replace(offerTagPattern(), ' ');
  const text = toCheckText(own.replace(URL_THEN_WIDE_RE, '$1 '));

  // C-4 꼬리표 — 금액 줄은 6개까지. 제안 · 혜택 꼬리표의 수는 조립 단계(offerCaps.ts)가 줄인다
  const distinct = new Set(tags);
  for (const id of distinct) if (!ctx.rowIds.has(id)) issues.push(`tag_unknown:${id}`);
  if (distinct.size > MAX_TAGS) issues.push(`tag_too_many:${distinct.size}`);
  const offerIds = ctx.offerIds ?? new Set(['B01']);
  for (const id of new Set(offerTags)) if (!offerIds.has(id)) issues.push(`tag_unknown:${id}`);
  // C-7 주소 · 메일 — 금액·전화번호·꼬리표 검사 전에 떼어 둔다(주소 안의 글자를 두 번 보지 않게)
  const allowedUrls = new Set(ctx.allowedUrls.map(trimUrl));
  const urlIssues: string[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const url = trimUrl(m[0]);
    if (!allowedUrls.has(url)) urlIssues.push(`url:${url}`);
  }
  let rest = text.replace(URL_RE, ' ');
  const allowedEmails = new Set(ctx.allowedEmails.map((e) => e.trim().toLowerCase()));
  for (const m of rest.matchAll(EMAIL_RE)) {
    if (!allowedEmails.has(m[0].replace(/\s/g, '').toLowerCase())) urlIssues.push(`url:${m[0]}`);
  }
  rest = rest.replace(EMAIL_RE, ' ');
  for (const m of rest.matchAll(BARE_DOMAIN_RE)) urlIssues.push(`url:${trimUrl(m[0])}`);
  rest = rest.replace(BARE_DOMAIN_RE, ' ');

  // 꼬리표 비슷한 것이 남아 있으면 손님에게 그대로 나간다
  if (/[{}]/.test(rest) || LOOSE_TAG_RE.test(rest)) issues.push('tag_broken');
  // 꼬리표는 제 줄에 따로 — 문장 안에 섞으면 금액 줄을 넣을 자리가 없어 문장이 깨진다
  const inline = reply.split('\n').some((line) => {
    if (!priceTagPattern().test(line) && !offerTagPattern().test(line)) return false;
    return !TAG_LINE_REST_RE.test(line.replace(priceTagPattern(), '').replace(offerTagPattern(), ''));
  });
  if (inline) issues.push('tag_inline');
  const marker = HISTORY_MARKER_RE.exec(rest);
  if (marker) issues.push(`marker:${marker[0]}`);
  issues.push(...urlIssues);

  // C-8 메신저 아이디 — 병원 것 · 손님이 연락처로 남긴 것이 아니면 걸린다
  const allowedHandles = new Set(ctx.allowedHandles.map((h) => h.trim().replace(/^@/, '').toLowerCase()));
  const badHandles = new Set<string>();
  for (const m of rest.matchAll(ID_AFTER_WORD_RE)) {
    const id = m[2].replace(/[.,]+$/, '');
    // 영어 "ID" 뒤의 보통 낱말("ID card")은 아이디가 아니다 — 숫자나 _ . - 가 든 것만 본다
    if (m[1] === 'ID' && !/[\d_.-]/.test(id)) continue;
    if (!allowedHandles.has(id.toLowerCase())) badHandles.add(id);
  }
  for (const m of rest.matchAll(AT_HANDLE_RE)) {
    const id = m[1].replace(/[.,]+$/, '');
    if (!allowedHandles.has(id.toLowerCase())) badHandles.add(id);
  }
  for (const id of badHandles) issues.push(`handle:${id}`);
  // 써도 되는 아이디는 지운다 — 아이디 속의 숫자("sakura_0328")를 금액으로 읽지 않게
  for (const h of allowedHandles) {
    if (h.length >= 3) rest = rest.replace(new RegExp(escapeRegExp(h), 'gi'), ' ');
  }

  // C-2 (가) 통화·단위 낱말이 붙은 금액, 글자로 쓴 금액 — 전화번호를 지우기 전에 본다.
  // 손님이 "1500000 won" 이라고 썼어도 AI가 따라 쓰면 걸린다(전화번호처럼 보인다고 봐주지 않는다).
  let money = findStatedAmount(rest);

  // C-8 전화번호처럼 보이는 숫자 — 날짜는 빼고, 써도 되는 번호(병원 · 손님 연락처)는 지운다
  rest = rest.replace(YMD_DATE_RE, ' ').replace(DMY_DATE_RE, ' ').replace(DOT_RANGE_RE, ' ');
  for (const re of allowedPhonePatterns(ctx.allowedPhoneDigits)) rest = rest.replace(re, ' ');
  rest = rest.replace(PHONE_LIKE_RE, (found) => {
    // 구분 기호 없이 숫자만 이어진 것은 아래 금액 검사가 본다
    if (/^\d+$/.test(found)) return found;
    issues.push(`number:${found.trim()}`);
    return ' ';
  });

  // C-2 (나) 통화 표시 없이 쓴 금액일 수 있는 숫자 — 천 단위로 묶은 숫자, 네 자리 이상의 맨 숫자
  if (money === null) money = findLooseNumber(rest);
  if (money !== null) issues.push(`money:${money}`);

  // C-3 퍼센트 · 할인율
  for (const m of text.matchAll(PERCENT_RE)) {
    const n = (m[1] ?? m[2])?.replace(',', '.');
    if (!n || !ctx.allowedPercents.has(n)) issues.push(`percent:${m[0].trim()}`);
  }
  for (const m of text.matchAll(TH_PERCENT_RE)) {
    if (!ctx.allowedPercents.has(m[1].replace(',', '.'))) issues.push(`percent:${m[0]}`);
  }
  for (const m of text.matchAll(ZH_PERCENT_RE)) {
    if (m[1] !== '五' && !ctx.allowedPercents.has(m[1])) issues.push(`percent:${m[0]}`);
  }
  for (const m of text.matchAll(ZH_DISCOUNT_RE)) {
    if (!ZH_DISCOUNT_OK.has(m[1])) issues.push(`percent:${m[0]}`);
  }
  for (const m of text.matchAll(JA_DISCOUNT_RE)) issues.push(`percent:${m[0]}`);
  for (const re of DISCOUNT_PHRASE_RES) for (const m of text.matchAll(re)) issues.push(`percent:${m[0].trim()}`);

  // C-5 금지 표현
  const banned = bannedHit(text);
  if (banned) issues.push(`banned:${banned}`);

  // C-6 AI·봇·자동 응대 · 사람
  const aiHit = AI_WORD_PATTERNS.map((re) => re.exec(text)).find(Boolean);
  if (aiHit) issues.push(`ai_word:${aiHit[0]}`);

  // 검사가 아는 언어로 썼는가
  const language = otherLanguage(rest);
  if (language) issues.push(`language:${language}`);

  // C-9 길이
  const units = textUnits(own);
  if (units > MAX_REPLY_UNITS) issues.push(`too_long:${units}`);

  return issues;
}

/**
 * 프로그램이 넣는 문장(제안 줄 · 혜택 문장)의 검사 — 금지 표현 · 압박 · AI라는 말만 본다.
 * 금액 · 퍼센트는 프로그램이 정해 쓰는 것이라 보지 않는다. 자료 검사 테스트(offers.test.ts)가 쓴다.
 */
export function claimIssues(text: string): string[] {
  const t = toCheckText(text);
  const issues: string[] = [];
  const banned = bannedHit(t);
  if (banned) issues.push(`banned:${banned}`);
  const aiHit = AI_WORD_PATTERNS.map((re) => re.exec(t)).find(Boolean);
  if (aiHit) issues.push(`ai_word:${aiHit[0]}`);
  return issues;
}

/** 가예약 요약에 그대로 찍힐 수 있는 칸 — 읽지 못한 시각(time)은 시간 메모가 되어 요약에 찍힌다 */
const BOOKING_TEXT_FIELDS = ['treatment', 'name', 'timeNote', 'time'] as const;

/**
 * 가예약 요약에 그대로 찍히는 칸(시술 · 이름 · 시간 메모 · 시각)도 같은 검사를 한다 — 금액·할인율·금지 표현이 요약을 타고 나가지 않게.
 * 걸린 칸은 비운다("이번에 받은 것 없음"). 직원만 보는 칸(treatmentKo)은 그대로 둔다.
 */
export function sanitizeBookingText(booking: BookingFields, ctx: GuardContext): { booking: BookingFields; dropped: string[] } {
  const next: BookingFields = { ...booking };
  const dropped: string[] = [];
  for (const field of BOOKING_TEXT_FIELDS) {
    const value = next[field];
    if (value === null) continue;
    // 여기 든 꼬리표는 금액 줄로 바뀌지 않는다 — 괄호가 있으면 버린다
    if (/[{}｛｝[\]]/.test(value) || checkReplyText(value, ctx).length > 0) {
      next[field] = null;
      dropped.push(field);
    }
  }
  return { booking: next, dropped };
}

/** 검사에 걸린 이유를 모델에게 돌려줄 말로 바꾼다 (다시 쓰게 할 때 시스템 글에 덧붙인다). */
export function retryFeedback(issues: string[]): string {
  const lines = issues.map((issue) => {
    const [code, ...restParts] = issue.split(':');
    const detail = restParts.join(':');
    switch (code) {
      case 'json':
        return 'Your output was not a valid JSON object in the required shape. Return only the JSON object.';
      case 'money':
        return `You typed an amount of money or a bare number ("${detail}"). Never type amounts, in digits or in words — use the tags from PRICE ROWS only, and do not repeat amounts the visitor wrote.`;
      case 'percent':
        return `Do not write the percentage or discount rate "${detail}". The only one you may mention is the 5% direct-booking benefit, written as "5%".`;
      case 'tag_unknown':
        return `The tag {{${detail}}} does not exist. Use only tags that appear in PRICE ROWS or OFFER ROWS, and {{B01}} for the direct-booking benefit.`;
      case 'tag_too_many':
        return `You used ${detail} price tags. Use at most ${MAX_TAGS}.`;
      case 'tag_broken':
        return 'A price tag was malformed. Copy tags exactly as they appear in PRICE ROWS, with two curly braces on each side, and write nothing that looks like a tag anywhere else.';
      case 'tag_inline':
        return 'Put each price tag on its own line with nothing else on that line (a bullet is fine). Do not write a tag inside a sentence.';
      case 'marker':
        return `Do not write notes in square brackets such as "${detail}". Text in square brackets in earlier messages is a record added by the system. To show a price again, write its tag again.`;
      case 'banned':
        if (detail === 'pressure') {
          return 'Do not pressure the visitor (only today, last chance, hurry, limited slots, do not miss and the like). You may state a promotion period as a plain fact.';
        }
        return `Do not use the expression "${detail}" or any superlative, guarantee, "permanent" or "no side effects" claim. If you need to say that something is not guaranteed or not permanent, say what is true instead (for example how long it usually lasts).`;
      case 'ai_word':
        return `Do not mention AI, bots or automation, and do not say that you are a person or a staff member ("${detail}"). If the visitor asks who they are talking to, set identity_question=true and leave the answer to the system.`;
      case 'url':
        return `Do not write "${detail}". Only the links that appear in CLINIC FACTS are allowed, copied exactly and starting with https://. Do not write e-mail addresses other than the visitor's own.`;
      case 'number':
        return `Do not write the number "${detail}". Only the clinic's phone numbers and the visitor's own contact may appear.`;
      case 'handle':
        return `Do not write the messenger ID "${detail}". Only the clinic's own IDs from CLINIC FACTS and the visitor's own contact may appear.`;
      case 'language':
        return 'Write the reply in the language named in VISITOR LANGUAGE. Only English, Japanese, Chinese, Vietnamese, Thai, Russian, French, Mongolian, Arabic and Korean are allowed.';
      case 'too_long':
        return 'The reply is too long. Keep it under 110 words (about 220 characters for Chinese or Japanese).';
      case 'booking_closed_day':
        return `${detail} is a closed day. Do not accept it: tell the visitor it is closed, offer the nearest open days from CALENDAR, and leave booking.date empty.`;
      case 'booking_outside_hours':
        return `${detail} is outside opening hours for that day. Tell the visitor the opening hours and ask for a time within them; leave booking.time and booking.time_note empty.`;
      case 'booking_past':
        return `${detail} is in the past. Ask the visitor for a future date and leave booking.date empty.`;
      default:
        return `Fix this problem: ${issue}`;
    }
  });
  return ['Your previous draft was rejected. Rewrite it and fix every point below.', ...lines.map((l) => `- ${l}`)].join('\n');
}
