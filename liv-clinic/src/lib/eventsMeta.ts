import type { Locale } from '@/i18n/routing';
import { pickLocalizedStrict } from './i18nFallback';

/**
 * 이벤트 허브·상세 페이지가 공유하는 로케일별 기본 메타.
 *
 * Bing 진단(2026-09-06)의 "짧은 title/description" 대부분이 이벤트 페이지였다 —
 * 허브 제목이 12자(`이벤트 | 리브성형외과`)였고, 상세는 DB 설명이 13~36자이거나
 * 외국어 컬럼이 비어 한국어가 그대로 나갔다. 허브 제목은 여기서 늘리고, 상세 설명은
 * buildEventMetaDescription()이 이 공통 설명으로 보강한다.
 */
export interface EventsMeta {
  title: string;
  description: string;
  keywords: string[];
}

export const EVENTS_META: Record<Locale, EventsMeta> = {
  ko: {
    title: '이벤트·프로모션 안내 | 리브성형외과 신사역',
    description: '리브성형외과의 최신 이벤트와 특별 프로모션을 확인하세요. 울쎄라피, 써마지, 보톡스, 필러 등 다양한 시술 할인 혜택을 만나보세요.',
    keywords: ['리브성형외과 이벤트', '신사역 피부과 이벤트', '울쎄라 할인', '써마지 할인', '보톡스 이벤트', '필러 이벤트', '안티에이징 프로모션'],
  },
  en: {
    title: 'Events & Promotions | LIV Plastic Surgery, Seoul',
    description: 'Discover the latest events and special promotions at LIV Plastic Surgery. Special offers on Ultherapy, Thermage, Botox, Filler and more.',
    keywords: ['LIV Plastic Surgery events', 'Seoul clinic promotion', 'Ultherapy discount', 'Thermage discount', 'Botox event', 'Filler event', 'anti-aging promotion'],
  },
  ja: {
    title: 'イベント・キャンペーン | LIV美容クリニック（江南）',
    description: 'LIV美容クリニックの最新イベントと特別プロモーションをご確認ください。ウルセラ、サーマクール（サーマジ）、ボトックス、フィラーなど様々な施術の割引特典。',
    keywords: ['LIV美容クリニック イベント', 'ソウルクリニックプロモーション', 'ウルセラ割引', 'サーマクール割引', 'ボトックスイベント', 'フィラーイベント'],
  },
  zh: {
    title: '活动与优惠 | LIV整形外科（首尔江南）',
    description: '查看首尔江南LIV整形外科的最新活动与特别优惠。超声刀、热玛吉、肉毒素、玻尿酸、水光针等各类项目的优惠信息，可中文咨询。新沙站步行1分钟。',
    keywords: ['LIV整形外科活动', '首尔诊所促销', '超声刀折扣', '热玛吉折扣', '肉毒素活动', '玻尿酸活动', '抗衰老促销'],
  },
  'zh-TW': {
    title: '活動與優惠 | LIV整形外科（首爾江南）',
    description: '查看首爾江南LIV整形外科的最新活動與特別優惠。音波拉提、鳳凰電波、肉毒桿菌、玻尿酸、水光針等各類療程的優惠資訊，可中文諮詢。新沙站步行1分鐘。',
    keywords: ['LIV整形外科活動', '首爾診所優惠', '超音波拉皮折扣', '電波拉皮折扣', '肉毒桿菌活動', '玻尿酸活動', '抗老化優惠'],
  },
  vi: {
    title: 'Sự kiện & ưu đãi | Phẫu thuật Thẩm mỹ LIV, Seoul',
    description: 'Khám phá các sự kiện mới nhất và ưu đãi đặc biệt tại Phẫu thuật Thẩm mỹ LIV. Ưu đãi cho Ultherapy, Thermage, Botox, Filler và nhiều liệu trình khác.',
    keywords: ['sự kiện LIV', 'ưu đãi phòng khám Seoul', 'giảm giá Ultherapy', 'giảm giá Thermage', 'sự kiện Botox', 'sự kiện Filler', 'khuyến mãi trẻ hóa'],
  },
  th: {
    title: 'กิจกรรมและโปรโมชั่น | ศัลยกรรมความงาม LIV โซล',
    description: 'ดูกิจกรรมล่าสุดและโปรโมชั่นพิเศษของ LIV ศัลยกรรมความงาม พร้อมส่วนลดสำหรับ Ultherapy, Thermage, โบท็อกซ์, ฟิลเลอร์ และหัตถการอื่นๆ',
    keywords: ['กิจกรรม LIV', 'โปรโมชั่นคลินิกโซล', 'ส่วนลด Ultherapy', 'ส่วนลด Thermage', 'กิจกรรมโบท็อกซ์', 'กิจกรรมฟิลเลอร์', 'โปรโมชั่นแอนตี้เอจจิ้ง'],
  },
  ru: {
    title: 'События и акции | Пластическая хирургия LIV, Сеул',
    description: 'Узнайте о последних событиях и специальных предложениях клиники LIV. Скидки на Ultherapy, Thermage, ботокс, филлеры и другие процедуры.',
    keywords: ['события LIV', 'акции клиники в Сеуле', 'скидка Ultherapy', 'скидка Thermage', 'акция ботокс', 'акция филлеры', 'антивозрастные предложения'],
  },
  fr: {
    title: 'Événements et promotions | LIV Chirurgie Esthétique, Séoul',
    description: 'Découvrez les derniers événements et promotions spéciales de LIV Chirurgie Esthétique. Offres sur Ultherapy, Thermage, Botox, acide hyaluronique et bien plus.',
    keywords: ['événements LIV', 'promotion clinique Séoul', 'remise Ultherapy', 'remise Thermage', 'événement Botox', 'événement acide hyaluronique', 'promotion anti-âge'],
  },
  mn: {
    title: 'Урамшуулал, хөнгөлөлт | LIV Гоо Заслын Эмнэлэг, Сөүл',
    description: 'LIV Гоо Заслын Эмнэлгийн шинэ урамшуулал, тусгай хөнгөлөлтийг үзнэ үү. Ultherapy, Thermage, Botox, Filler зэрэг эмчилгээний хөнгөлөлт.',
    keywords: ['LIV урамшуулал', 'Сөүлийн эмнэлгийн хөнгөлөлт', 'Ultherapy хямдрал', 'Thermage хямдрал', 'Botox урамшуулал', 'Filler урамшуулал', 'залуужуулах урамшуулал'],
  },
  ar: {
    title: 'العروض والحملات الترويجية | مستشفى ليف للتجميل، سيول',
    description: 'اكتشف أحدث العروض والحملات الترويجية في مستشفى ليف للتجميل. عروض على ألثيرابي وثيرماج والبوتوكس والفيلر وغيرها من الإجراءات.',
    keywords: ['عروض ليف', 'عروض عيادات سيول', 'خصم ألثيرابي', 'خصم ثيرماج', 'عرض البوتوكس', 'عرض الفيلر', 'عروض مكافحة الشيخوخة'],
  },
};

export function eventsMetaFor(locale: string): EventsMeta {
  return EVENTS_META[locale as Locale] ?? EVENTS_META.en;
}

/** 상세 설명이 이보다 짧으면 공통 설명을 덧붙인다 (Bing "description too short" 회피, CJK 포함 안전값). */
export const EVENT_DESCRIPTION_MIN = 60;

type LegacyContent = Partial<Record<'ko' | 'en' | 'ja' | 'zh', string | null | undefined>>;

const CJK_LOCALES = new Set<string>(['ja', 'zh', 'zh-TW']);

/**
 * 이벤트 상세의 meta description.
 * - 해당 로케일(폴백 체인에서 ko 제외)의 원문이 없으면 그 로케일의 공통 설명을 쓴다
 *   (한국어 설명이 외국어 페이지 메타로 나가지 않게).
 * - 원문이 60자 미만이면 공통 설명을 뒤에 덧붙인다.
 */
export function buildEventMetaDescription(locale: string, content: LegacyContent | null | undefined): string {
  const generic = eventsMetaFor(locale).description;
  const own = locale === 'ko' ? content?.ko ?? '' : pickLocalizedStrict(content, locale as Locale) ?? '';
  const text = own.replace(/\s+/g, ' ').trim();
  if (!text) return generic;
  if (text.length >= EVENT_DESCRIPTION_MIN) return text;
  const endsWithPunctuation = /[.。!！?？]$/.test(text);
  const separator = endsWithPunctuation ? ' ' : CJK_LOCALES.has(locale) ? '。' : '. ';
  return `${text}${separator}${generic}`;
}

/** 라우트 파라미터의 슬러그는 퍼센트 인코딩된 채 올 수 있다(한글 슬러그) — DB 조회 전에 디코드. */
export function decodeEventSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
