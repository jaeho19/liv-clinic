/** 1차 지원 언어. 나머지 7개 로케일에서는 진입점을 노출하지 않는다. */
export type PrepLang = 'ko' | 'en' | 'ja' | 'zh';
export const PREP_LANGS: readonly PrepLang[] = ['ko', 'en', 'ja', 'zh'] as const;

/**
 * TREATMENTS에 없는 특수 값. "수술 상담이 필요한 고민"을 표현한다.
 * 카드 2에는 상담 안내 행으로 렌더하고, 카드 4(소요시간·회복)에서는 제외한다.
 */
export const CONSULT_ONLY = 'consultOnly';

export interface ConcernRule {
  concernId: string;
  /** TREATMENTS의 id 또는 CONSULT_ONLY */
  treatmentId: string;
  displayOrder: number;
  reason: Record<PrepLang, string>;
  caution: Record<PrepLang, string>;
  reviewedBy: string;
  reviewedAt: string;
}

export interface ConcernTerm {
  termId: string;
  concernId: string;
  label: Record<PrepLang, string>;
  bodyArea: string;
}

export interface PrepQuestion {
  questionId: string;
  /** '*' | `concern:{id}` | `treatment:{id}` */
  appliesTo: string;
  text: Record<PrepLang, string>;
  /** TREATMENTS의 필드명. 답이 존재하지 않는 질문은 만들 수 없다. */
  answerSource: string;
}

/** answerSource로 허용되는 TREATMENTS 필드 */
export const ALLOWED_ANSWER_SOURCES = [
  'duration',
  'anesthesia',
  'recovery',
  'results',
  'cautions',
  'benefits',
  'process',
  'targetAreas',
  'idealFor',
] as const;

/** reviewed_by로 허용되는 값 */
export const ALLOWED_REVIEWERS = ['원장', '실장', '원장,실장'] as const;
