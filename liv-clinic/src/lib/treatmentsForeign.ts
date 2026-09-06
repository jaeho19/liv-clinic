/**
 * 시술 페이지 "외국인 환자 안내" 블록(P1-2) — en·ja·zh·zh-TW 전용 사전.
 * 번역 JSON에 키를 추가하지 않기 위해 TS에 둔다. 값은 사이트에 이미 있는 사실만:
 *   duration ← treatmentsI18n(getLocalizedTreatment) / laser layout serviceData,
 *   stay     ← international.stay.rows(울쎄라·써마지·보톡스·필러·스킨부스터·실리프팅) 또는 공통 문장,
 *   name     ← treatments.{cat}.{id}.name 메시지(ja 써마지는 P0 표기 サーマクール（サーマジ）병기).
 * 비행 가능 시점 등 사이트에 없는 수치는 넣지 않는다(계획 D6).
 */
import { isGuideLocale, type GuideLocale } from '@/lib/guides/types';

export const TREATMENT_FOREIGN_IDS = [
  'ulthera',
  'thermage',
  'onda',
  'density',
  'inmode',
  'shurink',
  'thread',
  'aptos',
  'botox',
  'filler',
  'skinbooster',
  'skincare',
  'pigmentation',
  'vascular',
  'skintone',
  'hair-removal',
  'tattoo',
] as const;
export type TreatmentForeignId = (typeof TREATMENT_FOREIGN_IDS)[number];

export interface ForeignCommon {
  eyebrow: string;
  heading: string;
  price: string;
  priceDesc: string;
  time: string;
  language: string;
  languageDesc: string;
  payment: string;
  paymentDesc: string;
  ctaInternational: string;
  ctaGuide: string;
  ctaBook: string;
  /** 당일 시술·재방문 표기가 사이트에 없는 시술의 공통 문장 */
  stayGeneric: string;
  faqPrice: (name: string) => { q: string; a: string };
  faqStay: (name: string, duration: string, stay: string) => { q: string; a: string };
}

export const FOREIGN_COMMON: Record<GuideLocale, ForeignCommon> = {
  en: {
    eyebrow: 'For international patients',
    heading: 'Visiting from abroad?',
    price: 'Same price list',
    priceDesc:
      'International patients pay from the same price list as local patients — there is no foreigner surcharge. Prices are per session and exclude VAT.',
    time: 'Time & stay',
    language: 'Language',
    languageDesc:
      'Consultations in English, Japanese and Chinese; interpretation is arranged free of charge on request. WhatsApp · LINE · WeChat · live chat on this site.',
    payment: 'Payment',
    paymentDesc: 'Visa · Mastercard · American Express · JCB · UnionPay · KRW cash',
    ctaInternational: 'Information for international patients',
    ctaGuide: 'Read the guide',
    ctaBook: 'Book a consultation',
    stayGeneric: 'The number of sessions and any follow-up are confirmed at your consultation.',
    faqPrice: (name) => ({
      q: `Do international patients pay more for ${name}?`,
      a: `No. The same price list applies to everyone — there is no foreigner surcharge and no fee for interpretation. Prices are per session and exclude VAT.`,
    }),
    faqStay: (name, duration, stay) => ({
      q: `How long should I plan for ${name} in Seoul?`,
      a: `The treatment itself takes about ${duration}. ${stay} Many patients are treated on the same day as their consultation, and there is no hospitalization.`,
    }),
  },
  ja: {
    eyebrow: '海外からの患者さまへ',
    heading: '海外からお越しの方へ',
    price: '同一料金',
    priceDesc:
      '海外からの患者さまも韓国の患者さまと同じ料金表です。外国人向けの追加料金はありません。料金は1回あたり・VAT別途です。',
    time: '所要時間と滞在',
    language: '言語',
    languageDesc:
      '英語・日本語・中国語で相談でき、ご希望に応じて通訳を無料で手配します。LINE・WhatsApp・WeChat・サイト内チャット。',
    payment: 'お支払い',
    paymentDesc: 'Visa · Mastercard · American Express · JCB · UnionPay · 韓国ウォン(KRW) 現金',
    ctaInternational: '海外からの患者さま向け案内',
    ctaGuide: 'ガイドを読む',
    ctaBook: '相談を予約する',
    stayGeneric: '回数や再来院の要否はカウンセリングで確認します。',
    faqPrice: (name) => ({
      q: `${name}は外国人だと料金が高くなりますか？`,
      a: `いいえ。どなたにも同じ料金表が適用され、外国人向けの追加料金や通訳の費用はありません。料金は1回あたり・VAT別途です。`,
    }),
    faqStay: (name, duration, stay) => ({
      q: `${name}のためにソウルに何日必要ですか？`,
      a: `施術そのものは約${duration}です。${stay} カウンセリング当日に施術を受ける方が多く、入院は不要です。`,
    }),
  },
  zh: {
    eyebrow: '国际患者须知',
    heading: '从海外来院？',
    price: '同一价格表',
    priceDesc: '国际患者与韩国患者使用同一价格表，没有外国人附加费。价格为单次、不含增值税。',
    time: '时间与停留',
    language: '语言',
    languageDesc: '提供英语、日语、中文咨询，如有需要可免费安排翻译。微信 · WhatsApp · LINE · 网站在线聊天。',
    payment: '付款',
    paymentDesc: 'Visa · Mastercard · American Express · JCB · 银联(UnionPay) · 韩元(KRW)现金',
    ctaInternational: '国际患者须知',
    ctaGuide: '阅读指南',
    ctaBook: '预约咨询',
    stayGeneric: '疗程次数与是否需要复诊以面诊为准。',
    faqPrice: (name) => ({
      q: `外国人做${name}会更贵吗？`,
      a: `不会。所有患者使用同一价格表，没有外国人附加费，翻译也不另收费。价格为单次、不含增值税。`,
    }),
    faqStay: (name, duration, stay) => ({
      q: `做${name}需要在首尔停留多久？`,
      a: `项目本身约需${duration}。${stay} 许多患者在面诊当天即可接受治疗，无需住院。`,
    }),
  },
  'zh-TW': {
    eyebrow: '國際患者須知',
    heading: '從海外來院？',
    price: '同一價格表',
    priceDesc: '國際患者與韓國患者使用同一價格表，沒有外國人附加費。價格為單次、未含加值稅（VAT）。',
    time: '時間與停留',
    language: '語言',
    languageDesc: '提供英語、日語、中文諮詢，如有需要可免費安排翻譯。LINE · WhatsApp · WeChat · 網站線上聊天。',
    payment: '付款',
    paymentDesc: 'Visa · Mastercard · American Express · JCB · 銀聯(UnionPay) · 韓元(KRW)現金',
    ctaInternational: '國際患者須知',
    ctaGuide: '閱讀指南',
    ctaBook: '預約諮詢',
    stayGeneric: '療程次數與是否需要回診以面診為準。',
    faqPrice: (name) => ({
      q: `外國人做${name}會比較貴嗎？`,
      a: `不會。所有患者使用同一價格表，沒有外國人附加費，翻譯也不另外收費。價格為單次、未含加值稅（VAT）。`,
    }),
    faqStay: (name, duration, stay) => ({
      q: `做${name}需要在首爾停留多久？`,
      a: `療程本身約需${duration}。${stay} 許多患者在面診當天即可接受治療，無需住院。`,
    }),
  },
};

interface ForeignEntry {
  name: string;
  duration: string;
  /** 사이트(international.stay.rows)에 표기가 있는 시술만. 없으면 FOREIGN_COMMON.stayGeneric */
  stay?: string;
  /** 게시된 가이드가 있을 때만 링크된다(publicIndex.isGuidePublished) */
  guideSlug?: string;
}

const SAME_DAY: Record<GuideLocale, string> = {
  en: 'Same day · no revisit required.',
  ja: '当日 · 再来院不要。',
  zh: '当天 · 无需复诊。',
  'zh-TW': '當天 · 無需回診。',
};
const THREAD_STAY: Record<GuideLocale, string> = {
  en: 'Optional check about 1 week later, or a remote photo check.',
  ja: '約1週間後に任意の確認、または写真によるオンライン確認。',
  zh: '约1周后可选复查，或远程照片复查。',
  'zh-TW': '約1週後可選擇回診複查，或以照片遠距複查。',
};

const GUIDE_FOR: Partial<Record<TreatmentForeignId, string>> = {
  ulthera: 'ultherapy-cost-seoul',
  thermage: 'ultherapy-vs-thermage-vs-shurink',
  shurink: 'ultherapy-vs-thermage-vs-shurink',
  botox: 'botox-filler-cost-seoul',
  filler: 'botox-filler-cost-seoul',
  tattoo: 'tattoo-removal-pico-seoul',
};

/** [locale][id] — name·duration은 사이트 메시지/데이터 값, stay는 위 두 사전 중 하나 */
const ENTRIES: Record<GuideLocale, Record<TreatmentForeignId, { name: string; duration: string }>> = {
  en: {
    ulthera: { name: 'Ultherapy Prime', duration: '60–90 minutes' },
    thermage: { name: 'Thermage FLX', duration: '45–60 minutes' },
    onda: { name: 'ONDA', duration: 'face 15–30 minutes / about 10 minutes per body area' },
    density: { name: 'Density', duration: '40–60 minutes' },
    inmode: { name: 'InMode', duration: '30–60 minutes' },
    shurink: { name: 'Shurink', duration: '30–45 minutes' },
    thread: { name: 'Thread Lift', duration: '30–60 minutes' },
    aptos: { name: 'APTOS Bio Lifting', duration: '30–60 minutes' },
    botox: { name: 'Botox', duration: '10–20 minutes' },
    filler: { name: 'Filler', duration: '20–40 minutes' },
    skinbooster: { name: 'Skin Booster', duration: '30–45 minutes' },
    skincare: { name: 'Skincare', duration: '60–90 minutes' },
    pigmentation: { name: 'Pigmentation Treatment', duration: '20–40 minutes' },
    vascular: { name: 'Vascular Treatment', duration: '15–30 minutes' },
    skintone: { name: 'Skin Texture', duration: '30–45 minutes' },
    'hair-removal': { name: 'Laser Hair Removal', duration: '15–60 minutes, depending on the area' },
    tattoo: { name: 'Tattoo Removal', duration: '15–30 minutes' },
  },
  ja: {
    ulthera: { name: 'ウルセラ（ウルセラプライム）', duration: '60-90分' },
    thermage: { name: 'サーマクール（サーマジ）FLX', duration: '45-60分' },
    onda: { name: 'オンダ', duration: '顔15-30分 / ボディは1部位あたり約10分' },
    density: { name: 'デンシティ', duration: '40-60分' },
    inmode: { name: 'インモード', duration: '30-60分' },
    shurink: { name: 'シュリンク', duration: '30-45分' },
    thread: { name: '糸リフト（スレッドリフト）', duration: '30-60分' },
    aptos: { name: 'アプトス バイオリフティング', duration: '30-60分' },
    botox: { name: 'ボトックス', duration: '10-20分' },
    filler: { name: 'フィラー（ヒアルロン酸）', duration: '20-40分' },
    skinbooster: { name: 'スキンブースター', duration: '30-45分' },
    skincare: { name: 'スキンケア', duration: '60-90分' },
    pigmentation: { name: '色素治療', duration: '20-40分' },
    vascular: { name: '血管治療', duration: '15-30分' },
    skintone: { name: '肌質改善', duration: '30-45分' },
    'hair-removal': { name: 'レーザー脱毛', duration: '15-60分（部位による）' },
    tattoo: { name: 'タトゥー除去', duration: '15-30分' },
  },
  zh: {
    ulthera: { name: '超声刀 Prime', duration: '60-90分钟' },
    thermage: { name: '热玛吉 FLX', duration: '45-60分钟' },
    onda: { name: 'ONDA', duration: '面部15-30分钟 / 身体每个部位约10分钟' },
    density: { name: 'Density', duration: '40-60分钟' },
    inmode: { name: 'InMode', duration: '30-60分钟' },
    shurink: { name: 'Shurink', duration: '30-45分钟' },
    thread: { name: '线雕', duration: '30-60分钟' },
    aptos: { name: 'APTOS 生物提升', duration: '30-60分钟' },
    botox: { name: '肉毒素', duration: '10-20分钟' },
    filler: { name: '玻尿酸', duration: '20-40分钟' },
    skinbooster: { name: '水光针', duration: '30-45分钟' },
    skincare: { name: '皮肤管理', duration: '60-90分钟' },
    pigmentation: { name: '色素治疗', duration: '20-40分钟' },
    vascular: { name: '血管治疗', duration: '15-30分钟' },
    skintone: { name: '肤质改善', duration: '30-45分钟' },
    'hair-removal': { name: '激光脱毛', duration: '15-60分钟（视部位而定）' },
    tattoo: { name: '纹身去除', duration: '15-30分钟' },
  },
  'zh-TW': {
    ulthera: { name: '音波拉提 Prime', duration: '60-90分鐘' },
    thermage: { name: '鳳凰電波 FLX', duration: '45-60分鐘' },
    onda: { name: 'ONDA', duration: '臉部15-30分鐘 / 身體每個部位約10分鐘' },
    density: { name: 'Density', duration: '40-60分鐘' },
    inmode: { name: 'InMode', duration: '30-60分鐘' },
    shurink: { name: 'Shurink', duration: '30-45分鐘' },
    thread: { name: '埋線拉提', duration: '30-60分鐘' },
    aptos: { name: 'APTOS 生物拉提', duration: '30-60分鐘' },
    botox: { name: '肉毒桿菌素', duration: '10-20分鐘' },
    filler: { name: '玻尿酸', duration: '20-40分鐘' },
    skinbooster: { name: '水光針', duration: '30-45分鐘' },
    skincare: { name: '皮膚管理', duration: '60-90分鐘' },
    pigmentation: { name: '色素治療', duration: '20-40分鐘' },
    vascular: { name: '血管治療', duration: '15-30分鐘' },
    skintone: { name: '膚質改善', duration: '30-45分鐘' },
    'hair-removal': { name: '雷射除毛（激光脫毛）', duration: '15-60分鐘（依部位而定）' },
    tattoo: { name: '除刺青（紋身去除）', duration: '15-30分鐘' },
  },
};

const SAME_DAY_IDS: readonly TreatmentForeignId[] = ['ulthera', 'thermage', 'botox', 'filler', 'skinbooster'];
const THREAD_IDS: readonly TreatmentForeignId[] = ['thread', 'aptos'];

export interface ForeignInfo extends ForeignEntry {
  stay: string;
  faqs: { q: string; a: string }[];
}

export function getTreatmentForeignInfo(id: TreatmentForeignId, locale: string): ForeignInfo | null {
  if (!isGuideLocale(locale)) return null;
  const common = FOREIGN_COMMON[locale];
  const entry = ENTRIES[locale][id];
  if (!entry) return null;
  const stay = SAME_DAY_IDS.includes(id)
    ? SAME_DAY[locale]
    : THREAD_IDS.includes(id)
      ? THREAD_STAY[locale]
      : common.stayGeneric;
  const guideSlug = GUIDE_FOR[id];
  return {
    ...entry,
    stay,
    ...(guideSlug ? { guideSlug } : {}),
    faqs: [common.faqPrice(entry.name), common.faqStay(entry.name, entry.duration, stay)],
  };
}

export function getTreatmentForeignFaqs(id: TreatmentForeignId, locale: string): { q: string; a: string }[] {
  return getTreatmentForeignInfo(id, locale)?.faqs ?? [];
}
