import {
  RATING_QUESTION_IDS,
  SURVEY_PARTS,
  TREATMENT_IDS,
  isPartShown,
  type PartId,
  type RatingQuestionId,
  type TreatmentId,
} from './questions';

/**
 * 관리자 화면 「만족도 설문」의 숫자 계산 — 순수 함수(테스트: __tests__/summary.test.ts).
 *
 * - 추천 지수 = 9~10점 비율 − 0~6점 비율 (×100, 정수, -100~100)
 * - 파트 점수 = 그 파트 문항 점수(1~5)를 모두 모은 평균. 넘긴 파트·보이지 않은 파트는 빠진다.
 * - 달은 서울 시각 기준.
 */

export interface SurveyResponseLike {
  id?: string;
  created_at: string;
  survey_version?: number;
  locale: string;
  first_visit: boolean;
  treatments: string[];
  treatment_other: string | null;
  ratings: unknown;
  skipped_parts: string[];
  recommend: number;
  comment: string | null;
}

export interface ScoreStat {
  avg: number | null;
  /** 점수를 준 응답 수 */
  n: number;
}

export interface PartStat extends ScoreStat {
  id: PartId;
  /** 「오늘 만나지 않았어요」나 「상담만 받음」으로 이 파트를 넘긴 응답 수 */
  skipped: number;
}

export interface QuestionStat extends ScoreStat {
  id: RatingQuestionId;
  part: PartId;
  /** 1~2점(아니다 이하) 비율 0~1 */
  lowShare: number | null;
}

export interface MonthStat {
  month: string;
  count: number;
  nps: number | null;
  recommendAvg: number | null;
  parts: Record<PartId, number | null>;
}

export interface TreatmentStat {
  id: TreatmentId;
  count: number;
  nps: number | null;
}

export interface SurveyComment {
  created_at: string;
  comment: string;
  recommend: number;
  treatments: string[];
  treatment_other: string | null;
  first_visit: boolean;
}

export interface SurveySummary {
  count: number;
  nps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  recommendAvg: number | null;
  firstVisitShare: number | null;
  parts: PartStat[];
  questions: QuestionStat[];
  months: MonthStat[];
  treatments: TreatmentStat[];
  comments: SurveyComment[];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/** 응답의 ratings JSON 에서 문항 점수만 꺼낸다(모르는 키·이상한 값은 버림). */
export function readRatings(raw: unknown): Partial<Record<RatingQuestionId, number>> {
  const out: Partial<Record<RatingQuestionId, number>> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const record = raw as Record<string, unknown>;
  for (const id of RATING_QUESTION_IDS) {
    const value = record[id];
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
      out[id] = value;
    }
  }
  return out;
}

export function npsOf(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

/** created_at(UTC ISO) → 서울 기준 'YYYY-MM' */
export function seoulMonth(createdAt: string): string {
  return new Date(Date.parse(createdAt) + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

function partSkipped(response: SurveyResponseLike, partId: PartId): boolean {
  const part = SURVEY_PARTS.find((p) => p.id === partId)!;
  if (!isPartShown(part, response.treatments as TreatmentId[])) return true;
  return response.skipped_parts.includes(partId);
}

function partScores(responses: SurveyResponseLike[], partId: PartId) {
  const part = SURVEY_PARTS.find((p) => p.id === partId)!;
  const values: number[] = [];
  let answered = 0;
  let skipped = 0;
  for (const response of responses) {
    if (partSkipped(response, partId)) {
      skipped += 1;
      continue;
    }
    const ratings = readRatings(response.ratings);
    const mine = part.questions
      .map((q) => ratings[q])
      .filter((v): v is number => typeof v === 'number');
    if (mine.length > 0) answered += 1;
    values.push(...mine);
  }
  return { avg: mean(values), n: answered, skipped };
}

export function summarizeSurvey(responses: SurveyResponseLike[]): SurveySummary {
  const count = responses.length;
  const scores = responses.map((r) => r.recommend);

  const parts: PartStat[] = SURVEY_PARTS.map((part) => ({ id: part.id, ...partScores(responses, part.id) }));

  const questions: QuestionStat[] = SURVEY_PARTS.flatMap((part) =>
    part.questions.map((questionId) => {
      const values = responses
        .filter((r) => !partSkipped(r, part.id))
        .map((r) => readRatings(r.ratings)[questionId])
        .filter((v): v is number => typeof v === 'number');
      return {
        id: questionId,
        part: part.id,
        avg: mean(values),
        n: values.length,
        lowShare: values.length > 0 ? values.filter((v) => v <= 2).length / values.length : null,
      };
    }),
  );

  const byMonth = new Map<string, SurveyResponseLike[]>();
  for (const response of responses) {
    const month = seoulMonth(response.created_at);
    byMonth.set(month, [...(byMonth.get(month) ?? []), response]);
  }
  const months: MonthStat[] = [...byMonth.keys()].sort().map((month) => {
    const rows = byMonth.get(month)!;
    const monthScores = rows.map((r) => r.recommend);
    const partAvgs = Object.fromEntries(
      SURVEY_PARTS.map((part) => [part.id, partScores(rows, part.id).avg]),
    ) as Record<PartId, number | null>;
    return {
      month,
      count: rows.length,
      nps: npsOf(monthScores),
      recommendAvg: mean(monthScores),
      parts: partAvgs,
    };
  });

  const treatments: TreatmentStat[] = TREATMENT_IDS.map((id) => {
    const rows = responses.filter((r) => r.treatments.includes(id));
    return { id, count: rows.length, nps: npsOf(rows.map((r) => r.recommend)) };
  })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const comments: SurveyComment[] = responses
    .filter((r) => typeof r.comment === 'string' && r.comment.trim().length > 0)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((r) => ({
      created_at: r.created_at,
      comment: r.comment!.trim(),
      recommend: r.recommend,
      treatments: r.treatments,
      treatment_other: r.treatment_other,
      first_visit: r.first_visit,
    }));

  return {
    count,
    nps: npsOf(scores),
    promoters: scores.filter((s) => s >= 9).length,
    passives: scores.filter((s) => s === 7 || s === 8).length,
    detractors: scores.filter((s) => s <= 6).length,
    recommendAvg: mean(scores),
    firstVisitShare: count > 0 ? responses.filter((r) => r.first_visit).length / count : null,
    parts,
    questions,
    months,
    treatments,
    comments,
  };
}
