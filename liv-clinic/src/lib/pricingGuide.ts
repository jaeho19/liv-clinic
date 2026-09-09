/**
 * 정식 가격표 페이지(/pricing) 전용 구조 데이터 (SSOT).
 *
 * 표시 문자열(시술명/기준/가격/카테고리명/안내문)은 i18n `pricingGuide` 네임스페이스에
 * 두고, 이 모듈은 카테고리·행 순서와 기존 시술 안내 경로를 정의한다.
 *
 * 주의: 기존 시술 상세 페이지가 사용하는 공용 데이터(`src/lib/pricing.ts`의 `PRICING`)와
 * 완전히 분리되어 있다. 이 페이지의 써마지 표에는 의도적으로 300샷·900샷을 포함하지 않는다.
 */

export interface PricingGuideCategory {
  /** i18n 카테고리 키 (`pricingGuide.categories.{id}`, `pricingGuide.rows.{id}.*`) */
  readonly id: string;
  /** i18n 행 키 (`pricingGuide.rows.{categoryId}.{rowId}.{name|basis|price}`) */
  readonly rows: readonly string[];
  /** 이 카테고리의 기존 시술 상세 경로 */
  readonly href: string;
  /** 별도 상세 페이지가 있는 행의 경로 */
  readonly rowHrefs?: Readonly<Record<string, string>>;
}

export const PRICING_GUIDE: readonly PricingGuideCategory[] = [
  {
    id: 'thread',
    rows: ['aptosNamica', 'aptosLight25', 'aptosLight50', 'silhouette', 'mint'],
    href: '/lifting/thread',
    rowHrefs: {
      aptosNamica: '/lifting/aptos',
      aptosLight25: '/lifting/aptos',
      aptosLight50: '/lifting/aptos',
    },
  },
  { id: 'filler', rows: ['domestic', 'domesticPremium', 'imported'], href: '/antiaging/filler' },
  { id: 'thermage', rows: ['flx600', 'eye225', 'eye450'], href: '/lifting/thermage' },
  { id: 'ulthera', rows: ['upperFace', 'lowerFace', 'fullFace', 'fullFaceNeck'], href: '/lifting/ulthera' },
] as const;

/** 하단 공통 안내문 키 (`pricingGuide.notes.{key}`) */
export const PRICING_GUIDE_NOTE_KEYS = ['vat', 'perSession', 'individual'] as const;
