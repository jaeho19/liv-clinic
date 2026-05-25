/**
 * 첫방문 1회 체험가 SSOT (Single Source of Truth)
 *
 * Design Ref: §3 데이터 모델 (docs/02-design/features/first-visit-trial-events.design.md)
 * Plan SC-1: 모든 가격/할인율은 소스(docx) 표기값과 일치해야 함.
 *
 * - 가격은 정수(원). originalPrice = null 이면 '체험가만' 표기(제모).
 * - discountRate 는 소스(docx) 표기값을 그대로 사용(반올림 일치 확인 완료).
 *
 * ⚠️ 임상·카피·가격은 병원 최종 검수 필요(병원 확인).
 */

export type TrialCategory =
  | 'hairRemoval'
  | 'skincare'
  | 'botox'
  | 'injection'
  | 'lifting';

export type TrialItem = {
  /** i18n 키: firstVisit.items.{id}.name / .desc / (.option) */
  id: string;
  category: TrialCategory;
  /** null = 체험가만 표기(정가 없음) */
  originalPrice: number | null;
  /** 첫방문 체험가(원) */
  trialPrice: number;
  /** 할인율(%). 예: 47 → "-47%". null = 할인 배지 없음 */
  discountRate: number | null;
  /** true면 firstVisit.items.{id}.option 보조 문구 노출(프리미엄 스킨케어 택1 안내) */
  hasOption?: boolean;
};

/** 카테고리 노출 순서 */
export const TRIAL_CATEGORY_ORDER: TrialCategory[] = [
  'hairRemoval',
  'skincare',
  'botox',
  'injection',
  'lifting',
];

/**
 * Plan SC-1: docx 가격 대조 검증 완료.
 * 임상·카피·가격 검수 필요(병원 확인).
 */
export const FIRST_VISIT_TRIALS: TrialItem[] = [
  { id: 'armpitHairRemoval', category: 'hairRemoval', originalPrice: null, trialPrice: 5000, discountRate: null },
  { id: 'lipHairRemoval', category: 'hairRemoval', originalPrice: null, trialPrice: 5000, discountRate: null },
  { id: 'premiumSkincare', category: 'skincare', originalPrice: 150000, trialPrice: 80000, discountRate: 47, hasOption: true },
  { id: 'botoxKr', category: 'botox', originalPrice: 60000, trialPrice: 36000, discountRate: 40 },
  { id: 'botoxDe', category: 'botox', originalPrice: 160000, trialPrice: 104000, discountRate: 35 },
  { id: 'botoxUs', category: 'botox', originalPrice: 190000, trialPrice: 123000, discountRate: 35 },
  { id: 'rejuran2cc', category: 'injection', originalPrice: 300000, trialPrice: 195000, discountRate: 35 },
  { id: 'rejuran2cc3x', category: 'injection', originalPrice: 920000, trialPrice: 560000, discountRate: 39 },
  { id: 'ivCustom', category: 'injection', originalPrice: 50000, trialPrice: 29000, discountRate: 42 },
  { id: 'inmode', category: 'lifting', originalPrice: 250000, trialPrice: 149000, discountRate: 40 },
  { id: 'ulthera300', category: 'lifting', originalPrice: 1470000, trialPrice: 990000, discountRate: 33 },
];

export type TrialGroup = {
  category: TrialCategory;
  items: TrialItem[];
};

/** 카테고리별 그룹핑(노출 순서 보존, 빈 그룹 제거) */
export function groupByCategory(items: TrialItem[] = FIRST_VISIT_TRIALS): TrialGroup[] {
  return TRIAL_CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}
