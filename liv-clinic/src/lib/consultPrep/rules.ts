/**
 * 생성된 규칙표를 조회한다. 순수 함수만 두고 LLM·네트워크·DB를 모른다.
 *
 * 정렬은 반드시 displayOrder 고정값이다. 점수 정렬을 도입하면 화면이
 * '목록'에서 '추천'으로 바뀐다 — 설계 문서 §3 참조.
 */
import {
  CONCERN_RULES,
  CONCERN_TERMS,
  PREP_QUESTIONS,
} from '@/lib/data/concernRules.generated';
import type { ConcernRule, ConcernTerm, PrepQuestion, PrepLang } from './types';

export function treatmentsFor(concernId: string): ConcernRule[] {
  return CONCERN_RULES.filter((r) => r.concernId === concernId).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export function termsFor(concernId: string): ConcernTerm[] {
  return CONCERN_TERMS.filter((t) => t.concernId === concernId);
}

export function questionsFor(concernId: string, treatmentIds: string[]): PrepQuestion[] {
  const wanted = new Set([
    '*',
    `concern:${concernId}`,
    ...treatmentIds.map((id) => `treatment:${id}`),
  ]);
  return PREP_QUESTIONS.filter((q) => wanted.has(q.appliesTo));
}

const TERM_IDS = new Set(CONCERN_TERMS.map((t) => t.termId));
const QUESTION_IDS = new Set(PREP_QUESTIONS.map((q) => q.questionId));

/**
 * ⚠️ 이것은 **전역 존재 검사**일 뿐, 고민 스코프 검사가 아니다.
 *
 * LLM 응답 검증에 이걸 쓰면 안 된다 — 다른 고민 소속의 실재 id가 통과해 버리고,
 * 그 뒤 `termsFor(concernId)` / `questionsFor(concernId, …)` 조회에서 조용히 사라져
 * 카드가 비어 나온다(2026-09-03 리뷰 Important 2). 검증에는 반드시
 * `termsFor()` / `questionsFor()` 로 만든 허용 집합을 써라.
 */
export function isKnownTerm(id: string): boolean {
  return TERM_IDS.has(id);
}

/** ⚠️ 전역 존재 검사. 주의사항은 `isKnownTerm` 주석 참조. */
export function isKnownQuestion(id: string): boolean {
  return QUESTION_IDS.has(id);
}

/** 해당 언어 문자열. 비어 있으면 빈 문자열 — 한국어로 흘리지 않는다. */
export function pickText(map: Record<PrepLang, string>, lang: PrepLang): string {
  return map[lang] ?? '';
}
