/**
 * 가이드·칼럼 화면 문구(ko·en·ja·zh·zh-TW). 번역 JSON에 키를 늘리지 않기 위해 TS에 둔다.
 * 한국어(ko)는 국내 환자용 「칼럼」, 나머지는 외국인 가이드다.
 * 원장 표기는 sections.doctors.kim(name·title·specialty) 메시지 값과 같게 유지한다.
 */
import type { ArticleLocale, GuideCategory } from './types';

export interface GuideUi {
  guides: string;
  hubTitle: string;
  /** 허브 제목 위 작은 글씨 */
  hubEyebrow: string;
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

export const GUIDE_UI: Record<ArticleLocale, GuideUi> = {
  ko: {
    guides: '칼럼',
    hubTitle: '리브 칼럼',
    hubEyebrow: '의료정보',
    hubIntro:
      '리프팅·안티에이징 시술을 알아볼 때 자주 묻는 질문을 하나씩 풀어 드립니다. 모든 글은 김수영 대표원장이 직접 감수합니다.',
    hubEmpty: '칼럼을 준비하고 있습니다.',
    updated: '수정일',
    readingTime: (m) => `읽는 데 약 ${m}분`,
    author: '글',
    reviewedBy: '감수',
    clinicAuthor: '리브성형외과',
    doctorAuthor: '김수영 대표원장 (성형외과 전문의)',
    toc: '이 글의 순서',
    faq: '자주 묻는 질문',
    relatedTreatment: '관련 시술',
    viewTreatment: '시술 안내 보기',
    pricing: '가격 안내',
    international: '해외 환자 안내',
    bookCta: '상담 예약',
    chatCta: '채팅 문의',
    backToGuides: '칼럼 전체 보기',
    draftBanner: '검수 중인 초안입니다. 검색에 노출되지 않으며 내용이 바뀔 수 있습니다.',
    disclaimer:
      '이 글은 일반적인 의료 정보이며 진단이나 처방을 대신하지 않습니다. 시술 가능 여부와 계획은 내원 상담에서 정해지고, 효과와 회복 기간에는 개인차가 있습니다. 시술 후 붓기·멍·통증 등의 부작용이 생길 수 있으니 의료진과 충분히 상담하시기 바랍니다. 가격은 1회 기준·VAT 별도이며 상담 후 확정됩니다.',
    category: {
      price: '가격',
      booking: '예약·내원',
      comparison: '시술 비교',
      aftercare: '시술 후 관리',
      treatment: '시술 정보',
    },
  },
  en: {
    guides: 'Guides for international patients',
    hubTitle: 'Guides for international patients',
    hubEyebrow: 'Information for international patients',
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
    hubEyebrow: '海外からの患者さまへ',
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
    hubEyebrow: '国际患者须知',
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
    hubEyebrow: '國際患者須知',
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
