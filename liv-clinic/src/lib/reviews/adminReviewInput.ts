import { z } from 'zod';
import type { Database } from '@/types/supabase';
import { LOCALES } from '@/i18n/routing';

/** 공개 후기 폼과 같은 키 — ReviewsList가 reviews.form.treatmentOptions.<key>로 라벨을 찾는다. */
export const REVIEW_TREATMENT_KEYS = [
  'lifting',
  'antiaging',
  'laser',
  'signature',
  'botox',
  'filler',
  'skinbooster',
  'other',
] as const;
export type ReviewTreatmentKey = (typeof REVIEW_TREATMENT_KEYS)[number];

/**
 * 관리자 직접 등록 입력(P1-4, B6). 환자에게 받은 후기를 관리자가 대신 올린다.
 * 출처·동의 항목은 의도적으로 없다(2026-09-06 지시). source는 항상 'onsite'.
 */
export const adminReviewInputSchema = z.object({
  locale: z.enum(LOCALES),
  author_name: z.string().trim().min(1, '이름을 입력해 주세요').max(60, '이름은 60자까지'),
  country: z.string().trim().max(60, '나라는 60자까지').optional(),
  treatment_category: z.enum(REVIEW_TREATMENT_KEYS),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(10, '내용은 10자 이상').max(2000, '내용은 2000자까지'),
  /** 후기를 받은 날짜(YYYY-MM-DD). 비우면 등록 시각이 된다 */
  received_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD').optional(),
  is_published: z.boolean().default(false),
  is_verified: z.boolean().default(false),
});
export type AdminReviewInput = z.infer<typeof adminReviewInputSchema>;

type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

/** 받은 날짜는 KST 정오로 저장해 날짜 표시가 시간대에 밀리지 않게 한다. */
export function toReviewInsert(input: AdminReviewInput): ReviewInsert {
  return {
    locale: input.locale,
    author_name: input.author_name,
    country: input.country && input.country.length > 0 ? input.country : null,
    treatment_category: input.treatment_category,
    rating: input.rating,
    content: input.content,
    source: 'onsite',
    is_published: input.is_published,
    is_verified: input.is_verified,
    ...(input.received_on ? { created_at: `${input.received_on}T12:00:00+09:00` } : {}),
  };
}
