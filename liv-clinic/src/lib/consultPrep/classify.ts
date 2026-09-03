import 'server-only';

/**
 * LLM을 1회 호출해 **고르게만** 한다.
 *
 * 생성하는 것은 restatement 한 문장뿐이고, 그것도 금지어 검사를 통과해야 살아남는다.
 * 용어·시술·질문은 전부 사전/규칙표/은행에 실재하는 id여야 하며, 아니면 버린다.
 *
 * translation.ts 와 같은 throw-free 계약을 따른다 — 무슨 일이 나도 화면은 나온다.
 * 실패 시 규칙표만으로 결과를 만들고 lowConfidence 를 세운다.
 */
import { checkAdCopy } from './adGuard';
import { treatmentsFor, termsFor, questionsFor, isKnownTerm, isKnownQuestion } from './rules';
import type { PrepLang } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_CONSULT_PREP_MODEL ?? 'gpt-5.6-luna';
const TIMEOUT_MS = Number(process.env.CONSULT_PREP_TIMEOUT_MS ?? 5000);
const MAX_OUTPUT_TOKENS = 500;
const QUESTION_COUNT = 3;
const TREATMENT_COUNT = 3;

export interface PrepSelection {
  termIds: string[];
  treatmentIds: string[];
  questionIds: string[];
  /** 금지어에 걸리면 빈 문자열 */
  restatement: string;
  lowConfidence: boolean;
}

interface RawSelection {
  term_ids?: unknown;
  treatment_ids?: unknown;
  question_ids?: unknown;
  restatement?: unknown;
  confidence?: unknown;
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** 규칙표만으로 만드는 안전한 기본값 */
function fallback(concernId: string): PrepSelection {
  const treatmentIds = treatmentsFor(concernId).slice(0, TREATMENT_COUNT).map((r) => r.treatmentId);
  return {
    termIds: termsFor(concernId).slice(0, 1).map((t) => t.termId),
    treatmentIds,
    questionIds: questionsFor(concernId, treatmentIds).slice(0, QUESTION_COUNT).map((q) => q.questionId),
    restatement: '',
    lowConfidence: true,
  };
}

function buildPrompt(concernId: string, lang: PrepLang): string {
  const terms = termsFor(concernId);
  const rules = treatmentsFor(concernId);
  const questions = questionsFor(concernId, rules.map((r) => r.treatmentId));

  return [
    `You classify a cosmetic-clinic visitor's free-text concern. You do NOT diagnose, recommend, or invent.`,
    ``,
    `Choose ONLY from these ids. Never output an id that is not listed.`,
    ``,
    `TERM IDS: ${terms.map((t) => `${t.termId} (${t.label.ko})`).join(' | ')}`,
    `TREATMENT IDS: ${rules.map((r) => r.treatmentId).join(' | ')}`,
    `QUESTION IDS: ${questions.map((q) => `${q.questionId} (${q.text.ko})`).join(' | ')}`,
    ``,
    `Return ONLY a JSON object, no markdown fence:`,
    `{"term_ids":[],"treatment_ids":[],"question_ids":[],"restatement":"","confidence":"high"}`,
    ``,
    `Rules:`,
    `1. term_ids: up to 3, the terms that match what the visitor described.`,
    `2. treatment_ids: up to ${TREATMENT_COUNT}, only ids from TREATMENT IDS. Order does not matter — the UI re-sorts.`,
    `3. question_ids: exactly ${QUESTION_COUNT} ids from QUESTION IDS, the most useful for this visitor.`,
    `4. restatement: ONE sentence in ${lang}, restating what the visitor said so they feel understood.`,
    `   Do NOT name a diagnosis, do NOT promise any result, do NOT mention price or duration.`,
    `   If you cannot do this safely, return an empty string.`,
    `5. confidence: "low" if the description is too short or unrelated, else "high".`,
  ].join('\n');
}

async function callModel(prompt: string, userText: string): Promise<RawSelection | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userText },
        ],
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        reasoning_effort: process.env.CONSULT_PREP_REASONING_EFFORT || 'none',
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    return JSON.parse(content) as RawSelection;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function classify(input: {
  concernId: string;
  description: string;
  lang: PrepLang;
}): Promise<PrepSelection> {
  const { concernId, description, lang } = input;
  const base = fallback(concernId);

  const raw = await callModel(buildPrompt(concernId, lang), description);
  if (!raw) return base;

  const allowedTreatments = new Set(treatmentsFor(concernId).map((r) => r.treatmentId));

  const termIds = asStringArray(raw.term_ids).filter(isKnownTerm).slice(0, 3);

  let treatmentIds = asStringArray(raw.treatment_ids)
    .filter((id) => allowedTreatments.has(id))
    .slice(0, TREATMENT_COUNT);
  if (treatmentIds.length === 0) treatmentIds = base.treatmentIds;

  const questionIds = asStringArray(raw.question_ids).filter(isKnownQuestion);
  for (const q of questionsFor(concernId, treatmentIds)) {
    if (questionIds.length >= QUESTION_COUNT) break;
    if (!questionIds.includes(q.questionId)) questionIds.push(q.questionId);
  }

  const candidate = typeof raw.restatement === 'string' ? raw.restatement.trim() : '';
  const restatement = candidate && checkAdCopy(candidate).ok ? candidate : '';

  return {
    termIds: termIds.length ? termIds : base.termIds,
    treatmentIds,
    questionIds: questionIds.slice(0, QUESTION_COUNT),
    restatement,
    lowConfidence: raw.confidence === 'low',
  };
}
