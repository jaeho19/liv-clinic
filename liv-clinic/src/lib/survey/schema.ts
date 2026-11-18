import { z } from 'zod';
import {
  CONSULT_ONLY,
  RATING_QUESTION_IDS,
  SKIPPABLE_PART_IDS,
  SURVEY_LOCALES,
  SURVEY_PARTS,
  SURVEY_VERSION,
  TREATMENT_IDS,
  isPartShown,
  type RatingQuestionId,
  type SkippablePartId,
  type SurveyLocale,
  type TreatmentId,
} from './questions';

/**
 * 공개 설문 제출(POST /api/survey) 검증과 저장 형태로 바꾸기.
 * 화면(SurveyForm)도 같은 규칙(보이는 파트·넘긴 파트)을 쓰도록 visibleParts 를 내보낸다.
 */

const rating = z.number().int().min(1).max(5);

const ratingsShape = Object.fromEntries(
  RATING_QUESTION_IDS.map((id) => [id, rating.optional()]),
) as Record<RatingQuestionId, z.ZodOptional<typeof rating>>;

export const surveySubmissionSchema = z
  .object({
    locale: z.enum(SURVEY_LOCALES),
    version: z.literal(SURVEY_VERSION),
    first_visit: z.boolean(),
    treatments: z.array(z.enum(TREATMENT_IDS)).min(1).max(TREATMENT_IDS.length),
    treatment_other: z.string().trim().max(100).optional(),
    // 모르는 문항 id 가 오면 거절한다(오타·옛 화면이 엉뚱한 키를 저장하지 않게)
    ratings: z.strictObject(ratingsShape),
    skipped_parts: z.array(z.enum(SKIPPABLE_PART_IDS)).max(SKIPPABLE_PART_IDS.length).default([]),
    recommend: z.number().int().min(0).max(10),
    comment: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.treatments).size !== value.treatments.length) {
      ctx.addIssue({ code: 'custom', path: ['treatments'], message: 'duplicate treatment' });
    }
    if (value.treatments.includes(CONSULT_ONLY) && value.treatments.length > 1) {
      ctx.addIssue({ code: 'custom', path: ['treatments'], message: 'consult_only must be alone' });
    }
  });

export type SurveySubmission = z.infer<typeof surveySubmissionSchema>;

/** survey_responses 에 넣을 값 (id·created_at 은 DB 가 채운다). */
export interface SurveyResponseInsert {
  survey_version: number;
  locale: SurveyLocale;
  first_visit: boolean;
  treatments: TreatmentId[];
  treatment_other: string | null;
  ratings: Partial<Record<RatingQuestionId, number>>;
  skipped_parts: SkippablePartId[];
  recommend: number;
  comment: string | null;
}

/**
 * 이 응답에서 넘어간 파트 — 손님이 「오늘 만나지 않았어요」를 누른 파트와,
 * 「상담만 받음」이라 보이지 않은 시술 파트를 합친다.
 */
export function effectiveSkippedParts(
  treatments: readonly TreatmentId[],
  skipped: readonly SkippablePartId[],
): SkippablePartId[] {
  const set = new Set<SkippablePartId>(skipped);
  for (const part of SURVEY_PARTS) {
    if (!isPartShown(part, treatments) && (SKIPPABLE_PART_IDS as readonly string[]).includes(part.id)) {
      set.add(part.id as SkippablePartId);
    }
  }
  return SKIPPABLE_PART_IDS.filter((id) => set.has(id));
}

/** 화면에 보이고 넘기지 않은(답할) 파트 */
export function visibleParts(
  treatments: readonly TreatmentId[],
  skipped: readonly SkippablePartId[],
) {
  const skippedSet = new Set<string>(effectiveSkippedParts(treatments, skipped));
  return SURVEY_PARTS.filter((part) => isPartShown(part, treatments) && !skippedSet.has(part.id));
}

export function toSurveyResponseInsert(input: SurveySubmission): SurveyResponseInsert {
  const treatments = TREATMENT_IDS.filter((id) => input.treatments.includes(id));
  const skipped = effectiveSkippedParts(treatments, input.skipped_parts);
  const skippedSet = new Set<string>(skipped);

  // 넘긴 파트의 문항 점수는 버린다(화면에서 다시 답하기 전에 눌러 둔 값이 남아 올 수 있다)
  const ratings: Partial<Record<RatingQuestionId, number>> = {};
  for (const part of SURVEY_PARTS) {
    if (skippedSet.has(part.id)) continue;
    for (const questionId of part.questions) {
      const value = input.ratings[questionId];
      if (typeof value === 'number') ratings[questionId] = value;
    }
  }

  const other = input.treatment_other?.trim() ?? '';
  const comment = input.comment?.trim() ?? '';

  return {
    survey_version: input.version,
    locale: input.locale,
    first_visit: input.first_visit,
    treatments,
    treatment_other: treatments.includes('other') && other.length > 0 ? other : null,
    ratings,
    skipped_parts: skipped,
    recommend: input.recommend,
    comment: comment.length > 0 ? comment : null,
  };
}
