import 'server-only';

// 가격·프로모션 문의 판정 (스펙 2026-10-01 §4.10). AI 없이 낱말로만 본다 — 순수 함수.
// 서버 전용으로 쓴다: 낱말 경계 판정에 lookbehind를 쓰므로 손님 화면 번들에 넣지 않는다.

/**
 * 5% 직접 예약 배너가 입력창에 넣어 주는 문장(messages/*.json 의 chat.promoDraft, 11개 언어).
 * 이 문장에는 "할인·優惠·割引" 같은 낱말이 들어 있지만 손님이 쓴 가격 질문이 아니므로 판정 전에 지운다.
 * 메시지 JSON과 글자 하나까지 같아야 한다 — priceIntent.test.ts 가 확인한다.
 */
export const PROMO_DRAFTS: readonly string[] = [
  '직접 예약하고 싶어요. 5% 직접예약 할인 이벤트를 봤어요.',
  "I'd like to book directly - I saw the 5% direct-booking offer.",
  '直接予約したいです。5%の直接予約割引を見ました。',
  '我想直接预约，我看到了5%直接预约优惠。',
  '我想直接預約，我看到了5%直接預約優惠。',
  'Tôi muốn đặt lịch trực tiếp. Tôi đã thấy ưu đãi giảm 5% khi đặt lịch trực tiếp.',
  'ต้องการจองโดยตรง เห็นโปรโมชันส่วนลด 5% สำหรับการจองตรงผ่านแชท',
  'Хочу записаться напрямую. Меня интересует скидка 5% при прямой записи.',
  "Je souhaite réserver directement — j'ai vu l'offre de 5% de réduction pour une réservation directe.",
  'Би шууд захиалмаар байна. Шууд захиалгын 5% хямдралыг харлаа.',
  'أرغب في الحجز مباشرة — لقد رأيت عرض خصم 5% على الحجز المباشر.',
];

// 띄어 쓰는 언어 — 낱말 단위(앞뒤가 글자·숫자가 아님), 대소문자 무시.
const SPACED_WORDS: readonly string[] = [
  // 영어
  'price', 'prices', 'priced', 'pricing', 'cost', 'costs', 'how much', 'fee', 'fees', 'quote', 'quotation',
  'promotion', 'promotions', 'promo', 'discount', 'discounts', 'event', 'events',
  // 프랑스어
  'prix', 'tarif', 'tarifs', 'coût', 'coûte', 'réduction', 'remise',
  // 베트남어
  'giá', 'bao nhiêu tiền', 'chi phí', 'khuyến mãi', 'ưu đãi',
  // 러시아어
  'цена', 'цены', 'цену', 'цене', 'ценах', 'стоимость', 'стоимости', 'сколько стоит',
  'скидка', 'скидки', 'скидку', 'акция', 'акции', 'прайс',
  // 몽골어
  'үнэ', 'үнийн', 'үнэтэй', 'хямдрал', 'урамшуулал',
];

// 붙여 쓰는 언어 — 글에 들어 있으면.
const UNSPACED_WORDS: readonly string[] = [
  // 중국어(간체·번체)
  '价格', '價格', '价钱', '價錢', '多少钱', '多少錢', '价目', '價目', '费用', '費用', '总价', '總價',
  '报价', '報價', '价位', '價位', '收费', '收費', '优惠', '優惠', '折扣', '促销', '促銷',
  // 일본어
  '価格', '料金', '値段', '金額', '費用', 'いくら', 'キャンペーン', '割引', 'プロモーション', 'イベント',
  // 한국어
  '가격', '비용', '금액', '할인', '이벤트', '프로모션', '얼마예요', '얼마에요', '얼마인가요', '얼마입니까', '얼마죠',
  // 태국어
  'ราคา', 'กี่บาท', 'ค่าใช้จ่าย', 'โปรโมชั่น', 'โปรโมชัน', 'ส่วนลด',
  // 아랍어
  'سعر', 'أسعار', 'اسعار', 'بكم', 'تكلفة', 'خصم', 'عروض',
];

const nfc = (s: string): string => s.normalize('NFC');

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// tsconfig target(ES2017)의 정규식 리터럴 검사를 피하려고 생성자로 만든다(\p{…}·lookbehind는 Node가 지원한다).
const SPACED_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${SPACED_WORDS.map((w) => escapeRegExp(nfc(w)).replace(/ /g, '\\s+')).join('|')})(?![\\p{L}\\p{N}])`,
  'iu'
);
const UNSPACED = UNSPACED_WORDS.map(nfc);
const DRAFTS = PROMO_DRAFTS.map(nfc);

/** 배너가 넣어 준 문장을 지운 나머지 글. */
export function stripPromoDraft(text: string): string {
  let out = nfc(text);
  for (const draft of DRAFTS) out = out.split(draft).join(' ');
  return out;
}

/** 손님 글이 가격·프로모션을 묻는 것으로 보이는가. 손님 화면 언어와 상관없이 전체 낱말 목록을 본다. */
export function looksLikePriceQuestion(text: string): boolean {
  const body = stripPromoDraft(text);
  if (SPACED_RE.test(body)) return true;
  return UNSPACED.some((w) => body.includes(w));
}
