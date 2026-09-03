/**
 * 시술 가격 데이터
 *
 * 가격 문자열은 천 단위 콤마 포함 (예: '1,300,000').
 * suffix는 i18n에서 통화 기호/단위 접미사로 변환됩니다.
 * price가 null이면 '상담 후 결정'으로 표시됩니다.
 */

export type PriceSuffix = 'starting' | 'perPiece' | 'per100iu';

export type PriceRow = {
  /** i18n 키: pricing.labels.{treatmentId}.{rowKey} */
  rowKey: string;
  /** 숫자 문자열 (천 단위 콤마). null이면 '상담 후 결정' */
  price: string | null;
  /** 가격 단위 접미사 */
  suffix?: PriceSuffix;
};

export type PriceGroup = {
  /** i18n 키: pricing.labels.{treatmentId}.{groupKey} */
  groupKey: string;
  /** 보조 설명 (i18n 키). 예: 부위 설명 */
  subKey?: string;
  rows: PriceRow[];
};

export type TreatmentPricing = {
  id: string;
  groups: PriceGroup[];
};

export const PRICING: Record<string, TreatmentPricing> = {
  // ===== Lifting =====
  // 가격은 /pricing(pricingGuide.ts)의 공개값과 동일하게 유지한다.
  // 전부 null이라 시술 페이지에서 '상담 후 결정'만 나오던 것을 2026-09-03 정정.
  ulthera: {
    id: 'ulthera',
    groups: [
      {
        groupKey: 'name',
        rows: [
          { rowKey: 'upperFace', price: '780,000', suffix: 'starting' },
          { rowKey: 'lowerFace', price: '1,170,000', suffix: 'starting' },
          { rowKey: 'fullFace', price: '1,560,000', suffix: 'starting' },
          { rowKey: 'fullFaceNeck', price: '2,340,000', suffix: 'starting' },
        ],
      },
    ],
  },

  thermage: {
    id: 'thermage',
    groups: [
      {
        groupKey: 'name',
        rows: [
          { rowKey: 'shot300', price: '1,300,000', suffix: 'starting' },
          { rowKey: 'shot600', price: '2,400,000', suffix: 'starting' },
          { rowKey: 'shot900', price: '3,300,000', suffix: 'starting' },
          { rowKey: 'eyeTip225', price: '1,000,000', suffix: 'starting' },
          { rowKey: 'eyeTip450', price: '1,600,000', suffix: 'starting' },
        ],
      },
    ],
  },

  shurink: {
    id: 'shurink',
    groups: [
      {
        groupKey: 'shurinkLaser',
        subKey: 'shurinkAreas',
        rows: [
          { rowKey: 'shot300', price: '200,000', suffix: 'starting' },
          { rowKey: 'shot600', price: '400,000', suffix: 'starting' },
          { rowKey: 'shot900', price: '600,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'ultheraLaser',
        subKey: 'ultheraAreas',
        rows: [
          { rowKey: 'shot300', price: '1,200,000', suffix: 'starting' },
          { rowKey: 'shot600', price: '2,200,000', suffix: 'starting' },
        ],
      },
    ],
  },

  density: {
    id: 'density',
    groups: [
      {
        groupKey: 'hiTip',
        rows: [
          { rowKey: 'shot300', price: '890,000', suffix: 'starting' },
          { rowKey: 'shot600', price: '1,500,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'alphaTip',
        rows: [
          { rowKey: 'shot300', price: '990,000', suffix: 'starting' },
          { rowKey: 'shot600', price: '1,800,000', suffix: 'starting' },
        ],
      },
    ],
  },

  inmode: {
    id: 'inmode',
    groups: [
      {
        groupKey: 'name',
        rows: [
          { rowKey: 'fxForma', price: '250,000', suffix: 'starting' },
          { rowKey: 'fx', price: '150,000', suffix: 'starting' },
          { rowKey: 'forma', price: '200,000', suffix: 'starting' },
        ],
      },
    ],
  },

  // 이 표는 /pricing(pricingGuide.ts)과 같은 값을 써야 한다.
  // 과거 보톡스 행(제오민/앨러간/침샘)이 잘못 들어가 있었음 — 2026-09-03 정정.
  thread: {
    id: 'thread',
    groups: [
      {
        groupKey: 'name',
        rows: [
          { rowKey: 'aptosNamica', price: '3,000,000', suffix: 'starting' },
          { rowKey: 'aptosLight25', price: '1,500,000', suffix: 'starting' },
          { rowKey: 'aptosLight50', price: '2,500,000', suffix: 'starting' },
          { rowKey: 'silhouette', price: '1,000,000', suffix: 'starting' },
          { rowKey: 'mint', price: '800,000', suffix: 'starting' },
        ],
      },
    ],
  },

  // ===== AntiAging =====
  botox: {
    id: 'botox',
    groups: [
      {
        groupKey: 'botoxContour',
        subKey: 'contourAreas',
        rows: [
          { rowKey: 'domestic', price: '60,000', suffix: 'starting' },
          { rowKey: 'domesticPremium', price: '110,000', suffix: 'starting' },
          { rowKey: 'xeomin', price: '160,000', suffix: 'starting' },
          { rowKey: 'allergan', price: '190,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'botoxBody',
        subKey: 'bodyAreas',
        rows: [
          { rowKey: 'domesticPremium', price: '220,000', suffix: 'starting' },
          { rowKey: 'xeomin', price: '320,000', suffix: 'starting' },
        ],
      },
    ],
  },

  filler: {
    id: 'filler',
    groups: [
      {
        groupKey: 'chanelInjection',
        rows: [
          { rowKey: 'volume3cc', price: '330,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'otherFillers',
        rows: [
          { rowKey: 'consultOnly', price: null },
        ],
      },
    ],
  },

  skinbooster: {
    id: 'skinbooster',
    groups: [
      {
        groupKey: 'hilowave',
        rows: [
          { rowKey: 'volume2cc', price: '500,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'juvelook',
        rows: [
          { rowKey: 'volume10cc', price: '270,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'elementWhitening',
        rows: [
          { rowKey: 'volume2cc', price: '240,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'stemcell',
        rows: [
          { rowKey: 'volume5cc', price: '270,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'melasma',
        rows: [
          { rowKey: 'volume4cc', price: '240,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'glow',
        rows: [
          { rowKey: 'volume2cc', price: '240,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'rejuranHbPlus',
        rows: [
          { rowKey: 'volume1cc', price: '190,000', suffix: 'starting' },
          { rowKey: 'volume2cc', price: '340,000', suffix: 'starting' },
          { rowKey: 'volume4cc', price: '600,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'eyeRejuran',
        rows: [
          { rowKey: 'volume1cc', price: '190,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'rejuran',
        rows: [
          { rowKey: 'volume2cc', price: '300,000', suffix: 'starting' },
          { rowKey: 'volume4cc', price: '460,000', suffix: 'starting' },
        ],
      },
    ],
  },

  // ===== Laser =====
  pigmentation: {
    id: 'pigmentation',
    groups: [
      {
        groupKey: 'dualToning',
        subKey: 'dualToningDesc',
        rows: [
          { rowKey: 'single', price: '150,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'potenza',
        rows: [
          { rowKey: 'pumpingTip', price: '200,000', suffix: 'starting' },
        ],
      },
    ],
  },

  vascular: {
    id: 'vascular',
    groups: [
      {
        groupKey: 'dualToning',
        subKey: 'dualToningDesc',
        rows: [
          { rowKey: 'single', price: '150,000', suffix: 'starting' },
        ],
      },
    ],
  },

  skintone: {
    id: 'skintone',
    groups: [
      {
        groupKey: 'dualToning',
        subKey: 'dualToningDesc',
        rows: [
          { rowKey: 'single', price: '150,000', suffix: 'starting' },
        ],
      },
    ],
  },

  hairRemoval: {
    id: 'hairRemoval',
    groups: [
      {
        groupKey: 'dualToning',
        subKey: 'dualToningDesc',
        rows: [
          { rowKey: 'single', price: '150,000', suffix: 'starting' },
        ],
      },
    ],
  },

  tattoo: {
    id: 'tattoo',
    groups: [
      {
        groupKey: 'tattooLucas',
        rows: [
          { rowKey: 'onePart', price: '50,000', suffix: 'starting' },
        ],
      },
      {
        groupKey: 'co2Laser',
        subKey: 'co2Desc',
        rows: [
          { rowKey: 'dia3mm', price: '10,000', suffix: 'starting' },
          { rowKey: 'dia5mm', price: '30,000', suffix: 'starting' },
          { rowKey: 'diaOver5mm', price: '50,000', suffix: 'starting' },
          { rowKey: 'faceFull', price: '500,000', suffix: 'starting' },
          { rowKey: 'neckFull', price: '500,000', suffix: 'starting' },
        ],
      },
    ],
  },
};
