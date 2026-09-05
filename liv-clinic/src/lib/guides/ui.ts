/**
 * 가이드 화면 문구(en·ja·zh·zh-TW). 번역 JSON에 키를 늘리지 않기 위해 TS에 둔다.
 * 원장 표기는 sections.doctors.kim(name·title·specialty) 메시지 값과 같게 유지한다.
 */
import type { GuideCategory, GuideLocale } from './types';

export interface GuideUi {
  guides: string;
  hubTitle: string;
  hubIntro: string;
  hubEmpty: string;
  updated: string;
  readingTime: (minutes: number) => string;
  author: string;
  reviewedBy: string;
  clinicAuthor: string;
  doctorAuthor: string;
  toc: string;
  faq: string;
  relatedTreatment: string;
  viewTreatment: string;
  pricing: string;
  international: string;
  bookCta: string;
  chatCta: string;
  backToGuides: string;
  draftBanner: string;
  disclaimer: string;
  category: Record<GuideCategory, string>;
}

export const GUIDE_UI: Record<GuideLocale, GuideUi> = {
  en: {
    guides: 'Guides for international patients',
    hubTitle: 'Guides for international patients',
    hubIntro:
      'Prices, timing and how to plan a visit to LIV Plastic Surgery in Sinsa, Seoul — written for patients travelling from abroad.',
    hubEmpty: 'Guides are being prepared.',
    updated: 'Updated',
    readingTime: (m) => `${m} min read`,
    author: 'Written by',
    reviewedBy: 'Medically reviewed by',
    clinicAuthor: 'LIV Plastic Surgery',
    doctorAuthor: 'Dr. Sooyoung Kim, board-certified plastic surgeon',
    toc: 'In this guide',
    faq: 'Frequently asked questions',
    relatedTreatment: 'Related treatment',
    viewTreatment: 'See treatment page',
    pricing: 'Price list',
    international: 'Information for international patients',
    bookCta: 'Book a consultation',
    chatCta: 'Message us',
    backToGuides: 'All guides',
    draftBanner: 'Draft under review — this page is not indexed and may change.',
    disclaimer:
      'This guide is general information, not medical advice or a diagnosis. Suitability and the final plan are decided at your in-person consultation. Prices are per session, exclude VAT, and are confirmed after consultation.',
    category: {
      price: 'Price guide',
      booking: 'Booking',
      comparison: 'Comparison',
      aftercare: 'Aftercare & travel',
      treatment: 'Treatment guide',
    },
  },
  ja: {
    guides: '海外からの患者さま向けガイド',
    hubTitle: '海外からの患者さま向けガイド',
    hubIntro:
      'ソウル・新沙(シンサ)のLIV美容クリニックで施術を受ける方のために、料金・所要時間・予約と滞在の計画をまとめました。',
    hubEmpty: 'ガイドを準備中です。',
    updated: '更新日',
    readingTime: (m) => `読了 約${m}分`,
    author: '執筆',
    reviewedBy: '医学監修',
    clinicAuthor: 'LIV美容クリニック',
    doctorAuthor: 'キム・スヨン 代表院長（形成外科専門医）',
    toc: 'この記事の内容',
    faq: 'よくある質問',
    relatedTreatment: '関連する施術',
    viewTreatment: '施術ページを見る',
    pricing: '料金表',
    international: '海外からの患者さまへ',
    bookCta: '相談を予約する',
    chatCta: 'メッセージで問い合わせる',
    backToGuides: 'ガイド一覧',
    draftBanner: '検収中の下書きです。検索エンジンには登録されず、内容が変わる場合があります。',
    disclaimer:
      'この記事は一般的な情報であり、診断や医学的助言ではありません。適応と最終的な施術計画は来院時のカウンセリングで決まります。料金は1回あたり・VAT別途で、カウンセリング後に確定します。',
    category: {
      price: '料金ガイド',
      booking: '予約方法',
      comparison: '比較',
      aftercare: 'アフターケアと旅程',
      treatment: '施術ガイド',
    },
  },
  zh: {
    guides: '国际患者指南',
    hubTitle: '国际患者指南',
    hubIntro: '为从海外前来首尔新沙站 LIV整形外科就诊的患者整理的价格、时间与行程规划。',
    hubEmpty: '指南准备中。',
    updated: '更新',
    readingTime: (m) => `阅读约${m}分钟`,
    author: '撰写',
    reviewedBy: '医学审核',
    clinicAuthor: 'LIV整形外科',
    doctorAuthor: '金秀英 代表院长（整形外科专科医生）',
    toc: '本文内容',
    faq: '常见问题',
    relatedTreatment: '相关项目',
    viewTreatment: '查看项目页面',
    pricing: '价格表',
    international: '国际患者须知',
    bookCta: '预约咨询',
    chatCta: '发消息咨询',
    backToGuides: '全部指南',
    draftBanner: '审核中的草稿：不会被搜索引擎收录，内容可能变动。',
    disclaimer:
      '本文为一般性信息，不构成诊断或医疗建议。是否适合以及最终方案由到院面诊决定；价格为单次、不含增值税，以咨询后为准。',
    category: {
      price: '价格指南',
      booking: '预约方法',
      comparison: '对比',
      aftercare: '术后护理与行程',
      treatment: '项目指南',
    },
  },
  'zh-TW': {
    guides: '國際患者指南',
    hubTitle: '國際患者指南',
    hubIntro: '為從海外前來首爾新沙站（林蔭道旁）LIV整形外科就診的患者整理的價格、時間與行程規劃。',
    hubEmpty: '指南準備中。',
    updated: '更新',
    readingTime: (m) => `閱讀約${m}分鐘`,
    author: '撰寫',
    reviewedBy: '醫學審核',
    clinicAuthor: 'LIV整形外科',
    doctorAuthor: '金秀英 代表院長（整形外科專科醫生）',
    toc: '本文內容',
    faq: '常見問題',
    relatedTreatment: '相關療程',
    viewTreatment: '查看療程頁面',
    pricing: '價格表',
    international: '國際患者須知',
    bookCta: '預約諮詢',
    chatCta: '傳訊息諮詢',
    backToGuides: '全部指南',
    draftBanner: '審核中的草稿：不會被搜尋引擎收錄，內容可能變動。',
    disclaimer:
      '本文為一般性資訊，不構成診斷或醫療建議。是否適合以及最終方案由到院面診決定；價格為單次、未含加值稅（VAT），以諮詢後為準。',
    category: {
      price: '價格指南',
      booking: '預約方法',
      comparison: '比較',
      aftercare: '術後照護與行程',
      treatment: '療程指南',
    },
  },
};
