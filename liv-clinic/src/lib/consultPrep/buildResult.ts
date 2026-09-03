/**
 * 선택 결과(id 목록)를 화면이 그대로 그릴 수 있는 값으로 조립한다.
 *
 * 정렬 보장은 rules.ts의 treatmentsFor()가 한다(displayOrder 오름차순).
 * 여기서는 그 순서를 지키기 위해 LLM이 돌려준 sel.treatmentIds 배열을 순회하지 않고,
 * treatmentsFor()가 돌려주는 규칙표를 순회하며 선택된 id만 걸러낸다 — LLM 순서를 믿지 않는다.
 */
import { TREATMENTS } from '@/lib/constants';
import { treatmentsFor, termsFor, questionsFor, pickText } from './rules';
import { CONSULT_ONLY, type PrepLang } from './types';
import type { PrepSelection } from './classify';

const TREATMENT_HREF: Record<string, string> = {
  ulthera: '/lifting/ulthera',
  thermage: '/lifting/thermage',
  shurink: '/lifting/shurink',
  density: '/lifting/density',
  inmode: '/lifting/inmode',
  thread: '/lifting/thread',
  aptos: '/lifting/aptos',
  onda: '/lifting/onda',
  botox: '/antiaging/botox',
  filler: '/antiaging/filler',
  skinbooster: '/antiaging/skinbooster',
  skincare: '/antiaging/skincare',
  // 레이저 토닝은 전용 페이지가 없다. 피부톤 페이지로 보낸다 (2026-09-03, 운영 확인 대기).
  toning: '/laser/skintone',
};

interface TreatmentMeta {
  name: string;
  duration: string;
  anesthesia: string;
  recovery: string;
  cautions: string[];
}

function metaOf(id: string): TreatmentMeta | null {
  for (const group of Object.values(TREATMENTS)) {
    const t = (group as Record<string, unknown>)[id] as
      | { name: string; duration?: string; anesthesia?: string; recovery?: string; cautions?: string[] }
      | undefined;
    if (t) {
      return {
        name: t.name,
        duration: t.duration ?? '',
        anesthesia: t.anesthesia ?? '',
        recovery: t.recovery ?? '',
        cautions: t.cautions ?? [],
      };
    }
  }
  return null;
}

export interface PrepCardResult {
  restatement: string;
  lowConfidence: boolean;
  terms: Array<{ id: string; label: string }>;
  treatments: Array<{
    id: string;
    name: string;
    reason: string;
    caution: string;
    consultOnly: boolean;
    href: string | null;
    duration: string;
    anesthesia: string;
    recovery: string;
    cautions: string[];
  }>;
  questions: Array<{ id: string; text: string }>;
}

export function buildResult(
  sel: PrepSelection,
  concernId: string,
  lang: PrepLang
): PrepCardResult {
  const picked = new Set(sel.treatmentIds);
  const rules = treatmentsFor(concernId).filter((r) => picked.has(r.treatmentId));

  const treatments = rules.map((r) => {
    const consultOnly = r.treatmentId === CONSULT_ONLY;
    const meta = consultOnly ? null : metaOf(r.treatmentId);
    return {
      id: r.treatmentId,
      name: meta?.name ?? '',
      reason: pickText(r.reason, lang),
      caution: pickText(r.caution, lang),
      consultOnly,
      href: consultOnly ? null : TREATMENT_HREF[r.treatmentId] ?? null,
      duration: meta?.duration ?? '',
      anesthesia: meta?.anesthesia ?? '',
      recovery: meta?.recovery ?? '',
      cautions: meta?.cautions ?? [],
    };
  });

  const termById = new Map(termsFor(concernId).map((t) => [t.termId, t]));
  const terms = sel.termIds
    .map((id) => termById.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({ id: t.termId, label: pickText(t.label, lang) }));

  const qById = new Map(
    questionsFor(concernId, sel.treatmentIds).map((q) => [q.questionId, q])
  );
  const questions = sel.questionIds
    .map((id) => qById.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((q) => ({ id: q.questionId, text: pickText(q.text, lang) }));

  return {
    restatement: sel.restatement,
    lowConfidence: sel.lowConfidence,
    terms,
    treatments,
    questions,
  };
}
