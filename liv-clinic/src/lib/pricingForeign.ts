/**
 * 가격 페이지 "외국인 환자 안내"(P1-3) — en·ja·zh·zh-TW 전용 문구.
 * 사실은 사이트 기존 표기만: 동일 가격표(international.why / medical foreign-pricing-same),
 * VAT 별도(pricingGuide.notes.vat), 결제수단(international.payment.methods), 통역 무료(international.communication).
 * 참고 환산(USD/JPY/TWD)은 넣지 않는다(계획 D3).
 */
import type { GuideLocale } from '@/lib/guides/types';

export interface PricingForeignCopy {
  heading: string;
  items: string[];
  /** pricing layout의 meta description 뒤에 이어 붙이는 한 문장(120자 미만) */
  metaSuffix: string;
  ctaInternational: string;
  ctaGuides: string;
}

export const PRICING_FOREIGN: Record<GuideLocale, PricingForeignCopy> = {
  en: {
    heading: 'For international patients',
    items: [
      'International patients pay from this same price list — there is no foreigner surcharge.',
      'Prices are per session and exclude VAT; the final amount is confirmed after your consultation.',
      'Payment: Visa · Mastercard · American Express · JCB · UnionPay · KRW cash.',
      'Consultations in English, Japanese and Chinese; interpretation is arranged free of charge on request.',
    ],
    metaSuffix: 'Same prices for international patients, VAT excluded, international cards accepted.',
    ctaInternational: 'Information for international patients',
    ctaGuides: 'Guides for international patients',
  },
  ja: {
    heading: '海外からの患者さまへ',
    items: [
      '海外からの患者さまもこの料金表と同じ料金です。外国人向けの追加料金はありません。',
      '料金は1回あたり・VAT別途で、最終的な金額はカウンセリング後に確定します。',
      'お支払い：Visa · Mastercard · American Express · JCB · UnionPay · 韓国ウォン(KRW) 現金。',
      '英語・日本語・中国語で相談でき、ご希望に応じて通訳を無料で手配します。',
    ],
    metaSuffix: '海外からの患者さまも同一料金・VAT別途・海外カード利用可。',
    ctaInternational: '海外からの患者さま向け案内',
    ctaGuides: '海外からの患者さま向けガイド',
  },
  zh: {
    heading: '国际患者须知',
    items: [
      '国际患者使用与本价格表相同的价格，没有外国人附加费。',
      '价格为单次、不含增值税（VAT），最终金额以咨询后为准。',
      '付款：Visa · Mastercard · American Express · JCB · 银联(UnionPay) · 韩元(KRW)现金。',
      '提供英语、日语、中文咨询，如有需要可免费安排翻译。',
    ],
    metaSuffix: '国际患者同价、不含增值税（VAT）、可用国际信用卡。',
    ctaInternational: '国际患者须知',
    ctaGuides: '国际患者指南',
  },
  'zh-TW': {
    heading: '國際患者須知',
    items: [
      '國際患者使用與本價格表相同的價格，沒有外國人附加費。',
      '價格為單次、未含加值稅（VAT），最終金額以諮詢後為準。',
      '付款：Visa · Mastercard · American Express · JCB · 銀聯(UnionPay) · 韓元(KRW)現金。',
      '提供英語、日語、中文諮詢，如有需要可免費安排翻譯。',
    ],
    metaSuffix: '國際患者同價、未含加值稅（VAT）、可用國際信用卡。',
    ctaInternational: '國際患者須知',
    ctaGuides: '國際患者指南',
  },
};
