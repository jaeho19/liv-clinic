/**
 * 내원객 만족도 설문 — 문항 구조의 단일 진실 공급원.
 *
 * 2026-11-18 대표원장 답변으로 확정한 15문항(계획서 claude.ai/artifact/J8zNRAf51hunVkg7QqC1qz):
 *   1 첫 방문 · 2 받은 시술 · 3~13 파트별 평가(1~5점) · 14 종합 평가(추천, 1~5점) · 15 자유 의견
 * 화면 문구는 copy.ts, 저장 형식은 schema.ts, 결과 계산은 summary.ts 가 이 파일을 따른다.
 *
 * 문항을 바꾸면 SURVEY_VERSION 을 올린다 — 옛 응답과 새 응답을 관리자 화면에서 구분하기 위해서다.
 * 순수 데이터 모듈이라 서버·클라이언트 어디서나 import 할 수 있다.
 */

// 2 = 2026-11-18 종합 평가(추천)를 0~10점에서 1~5점으로 바꿈. 1(0~10점)은 시험 응답뿐이라 관리자 화면에서 뺀다.
export const SURVEY_VERSION = 2;

/** 같은 휴대폰에서 다시 응답할 수 있기까지의 날 수(재방문 손님용, 사용자 2026-11-18). */
export const RESUBMIT_AFTER_DAYS = 3;

/** 설문을 보여 주는 언어. 나머지 로케일은 영어 화면으로 보낸다. */
export const SURVEY_LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW'] as const;
export type SurveyLocale = (typeof SURVEY_LOCALES)[number];

export function isSurveyLocale(value: string): value is SurveyLocale {
  return (SURVEY_LOCALES as readonly string[]).includes(value);
}

/** 2번 문항 — 오늘 받은 시술 (홈페이지 메뉴 기준, 대표원장 확인). */
export const TREATMENT_IDS = [
  'lifting_device',
  'thread_lift',
  'botox',
  'filler',
  'skin_booster',
  'laser',
  'hair_removal',
  'skincare',
  'consult_only',
  'other',
] as const;
export type TreatmentId = (typeof TREATMENT_IDS)[number];

/** 「상담만 받음」은 다른 시술과 같이 고를 수 없다. */
export const CONSULT_ONLY: TreatmentId = 'consult_only';

/** 평가 문항(3~13번). 5단계: 1 전혀 아니다 ~ 5 매우 그렇다. */
export const RATING_QUESTION_IDS = [
  'desk_kind',
  'desk_flow',
  'counsel_fit',
  'counsel_cost',
  'doctor_explain',
  'doctor_risk',
  'nurse_kind',
  'nurse_pain',
  'skin_kind',
  'skin_care',
  'facility_clean',
] as const;
export type RatingQuestionId = (typeof RATING_QUESTION_IDS)[number];

export const PART_IDS = ['desk', 'counselor', 'doctor', 'nurse', 'skincare', 'facility'] as const;
export type PartId = (typeof PART_IDS)[number];

/** 「오늘 만나지 않았어요」로 통째로 넘길 수 있는 파트. */
export const SKIPPABLE_PART_IDS = ['counselor', 'doctor', 'nurse', 'skincare'] as const;
export type SkippablePartId = (typeof SKIPPABLE_PART_IDS)[number];

export interface SurveyPart {
  id: PartId;
  questions: readonly RatingQuestionId[];
  /** 「오늘 만나지 않았어요」 단추를 보여 준다 */
  skippable: boolean;
  /** 「상담만 받음」만 고르면 이 파트는 보이지 않는다(시술을 받은 분만 만나는 파트) */
  procedureOnly: boolean;
  /** 관리자 화면 이름(쉬운 한국어) */
  adminLabel: string;
}

export const SURVEY_PARTS: readonly SurveyPart[] = [
  { id: 'desk', questions: ['desk_kind', 'desk_flow'], skippable: false, procedureOnly: false, adminLabel: '데스크 코디네이터' },
  { id: 'counselor', questions: ['counsel_fit', 'counsel_cost'], skippable: true, procedureOnly: false, adminLabel: '상담실장' },
  { id: 'doctor', questions: ['doctor_explain', 'doctor_risk'], skippable: true, procedureOnly: false, adminLabel: '원장' },
  { id: 'nurse', questions: ['nurse_kind', 'nurse_pain'], skippable: true, procedureOnly: true, adminLabel: '간호사' },
  { id: 'skincare', questions: ['skin_kind', 'skin_care'], skippable: true, procedureOnly: true, adminLabel: '피부관리사' },
  { id: 'facility', questions: ['facility_clean'], skippable: false, procedureOnly: false, adminLabel: '시설' },
];

/** 관리자 화면·엑셀에 쓰는 짧은 문항 이름. 전체 문장은 copy.ts 의 ko 문구. */
export const QUESTION_ADMIN_LABELS: Record<RatingQuestionId, string> = {
  desk_kind: '친절하게 맞아 줌',
  desk_flow: '예약·접수·수납이 빠르고 편리',
  counsel_fit: '꼭 필요한 시술 위주로 권함',
  counsel_cost: '결제 전에 비용을 분명히 안내',
  doctor_explain: '상태를 보고 쉽게 설명',
  doctor_risk: '효과·부작용을 미리 알려 줌',
  nurse_kind: '친절하게 대해 줌',
  nurse_pain: '시술 중 통증·불편을 살핌',
  skin_kind: '친절하게 대해 줌',
  skin_care: '관리를 꼼꼼하게 해 줌',
  facility_clean: '청결하고 쾌적함',
};

export const TREATMENT_ADMIN_LABELS: Record<TreatmentId, string> = {
  lifting_device: '리프팅 장비',
  thread_lift: '실리프팅',
  botox: '보톡스',
  filler: '필러',
  skin_booster: '스킨부스터',
  laser: '레이저',
  hair_removal: '제모',
  skincare: '스킨케어(피부관리)',
  consult_only: '상담만 받음',
  other: '기타',
};

export function partOfQuestion(id: RatingQuestionId): SurveyPart {
  const part = SURVEY_PARTS.find((p) => p.questions.includes(id));
  if (!part) throw new Error(`unknown survey question: ${id}`);
  return part;
}

/** 이 시술 선택에서 보이는 파트인가 — 「상담만 받음」만 고르면 시술 파트는 숨긴다. */
export function isPartShown(part: SurveyPart, treatments: readonly TreatmentId[]): boolean {
  if (!part.procedureOnly) return true;
  const consultOnly = treatments.length === 1 && treatments[0] === CONSULT_ONLY;
  return !consultOnly;
}

/** 공개 설문 주소. */
export const SURVEY_PUBLIC_PATH = '/ko/survey';

/**
 * 카톡으로 보내는 짧은 주소(관리자 「설문 주소 복사」·「카톡 문구 복사」) — liv-clinic.net/survey.
 * 미들웨어가 리다이렉트 없이 /ko/survey 화면을 그대로 보여 준다(주소창은 /survey 그대로).
 * 카카오톡은 주소별로 미리보기(썸네일)를 오래 캐시한다. /ko/survey 는 썸네일을 넣기 전(2026-11-18 22시)에 이미
 * 공유돼 썸네일 없는 미리보기가 남았고, ?from=kakao 를 붙여도 바뀌지 않는다는 사용자 제보가 있어 처음 보는 경로로 옮겼다.
 * 썸네일을 다시 바꾸면 카카오 공유 디버거에서 이 주소를 초기화하거나, 새 경로를 하나 더 만든다.
 */
export const SURVEY_SHARE_PATH = '/survey';

/** 답례품 번호 유효 기간(일) — 계획서 「남은 질문」, 대표원장 확인 전 임시값. */
export const GIFT_CODE_VALID_DAYS = 90;
