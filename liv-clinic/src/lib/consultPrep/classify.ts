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
import { treatmentsFor, termsFor, questionsFor } from './rules';
import type { PrepLang } from './types';
import { isReasoningFamily } from '@/lib/chat/translation';

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

/**
 * 모델 계열에 맞는 chat.completions 요청 바디.
 *
 * reasoning 계열(gpt-5 / o1 / o3 / o4)과 구형 계열(gpt-4o / 4.1 등)은 파라미터 규칙이 다르고
 * 하나라도 어긋나면 400이 난다 — throw-free 계약이라 400도 조용한 규칙표 폴백이 된다.
 * translation.ts의 isReasoningFamily로 분기를 코드에 고정한다(buildOpenAIBody는 재사용하지
 * 않는다 — 그쪽은 MAX_OUTPUT_TOKENS가 800이고 response_format이 없다).
 */
function buildRequestBody(model: string, prompt: string, userText: string): Record<string, unknown> {
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: userText },
  ];

  if (isReasoningFamily(model)) {
    return {
      model,
      messages,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      reasoning_effort: process.env.CONSULT_PREP_REASONING_EFFORT || 'none',
      response_format: { type: 'json_object' },
    };
  }

  return {
    model,
    messages,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };
}

/** classify가 실제로 읽는 필드 — 이 중 하나도 없으면 응답에 쓸 게 없다. */
const EXPECTED_KEYS = ['term_ids', 'treatment_ids', 'question_ids', 'restatement', 'confidence'] as const;

/** 폴백 사유. 로그에는 이 코드와 HTTP 상태만 남긴다 — 손님 입력은 절대 넣지 않는다. */
type FallbackReason =
  | 'no_api_key'
  | 'invalid_json'
  | 'not_an_object'
  | 'empty_payload'
  | 'timeout'
  | 'fetch_error'
  | `http_${number}`;

type CallResult = { raw: RawSelection; reason?: undefined } | { raw: null; reason: FallbackReason };

function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === 'AbortError' || e.message.toLowerCase().includes('abort'));
}

async function callModel(prompt: string, userText: string): Promise<CallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { raw: null, reason: 'no_api_key' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(buildRequestBody(MODEL, prompt, userText)),
    });
    if (!res.ok) return { raw: null, reason: `http_${res.status}` };

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) return { raw: null, reason: 'invalid_json' };

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { raw: null, reason: 'invalid_json' };
    }
    // JSON.parse는 성공해도 배열/숫자/문자열/불리언일 수 있다 — 순수 객체가 아니면 폴백.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { raw: null, reason: 'not_an_object' };
    }
    // 순수 객체여도 우리가 읽는 다섯 키(term_ids/treatment_ids/question_ids/restatement/
    // confidence) 중 단 하나도 없으면 이 응답은 내용이 전혀 없는 것과 같다 — 그대로 두면
    // 모든 필드가 규칙표 폴백인데 confidence 부재로 lowConfidence만 false로 새어나간다.
    const hasExpectedKey = EXPECTED_KEYS.some((key) => key in (parsed as Record<string, unknown>));
    if (!hasExpectedKey) {
      return { raw: null, reason: 'empty_payload' };
    }
    return { raw: parsed as RawSelection };
  } catch (e) {
    return { raw: null, reason: isAbortError(e) ? 'timeout' : 'fetch_error' };
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

  const result = await callModel(buildPrompt(concernId, lang), description);
  if (!result.raw) {
    // 사유 코드와 HTTP 상태만 남긴다 — description/restatement 등 손님 입력은 로그에 넣지 않는다.
    console.warn(`[consult-prep] LLM fallback: ${result.reason}`);
    return base;
  }
  const raw = result.raw;

  // 세 목록 모두 **이 고민 스코프** 안에서만 검사한다.
  // 전역 은행 멤버십(isKnownTerm/isKnownQuestion)으로 검사하면, 다른 고민 소속의 실재
  // id가 여기를 통과한 뒤 buildResult의 termsFor(concernId)/questionsFor(concernId,…)
  // 조회에서 전부 사라진다 — 카드 1이 빈 목록이 되고 카드 3이 3개를 못 채운다.
  const allowedTreatments = new Set(treatmentsFor(concernId).map((r) => r.treatmentId));
  const allowedTerms = new Set(termsFor(concernId).map((t) => t.termId));

  const termIds = [
    ...new Set(asStringArray(raw.term_ids).filter((id) => allowedTerms.has(id))),
  ].slice(0, 3);

  let treatmentIds = asStringArray(raw.treatment_ids)
    .filter((id) => allowedTreatments.has(id))
    .slice(0, TREATMENT_COUNT);
  if (treatmentIds.length === 0) treatmentIds = base.treatmentIds;

  // 질문 스코프는 treatmentIds가 확정된 **뒤에** 계산해야 한다 — appliesTo 에
  // `treatment:{id}` 형태가 있어 후보 시술에 따라 허용 집합이 달라진다.
  // 걸러낸 다음 채워야 3개가 된다. 순서를 뒤집으면 카드 3이 2개로 나온다.
  const scopedQuestions = questionsFor(concernId, treatmentIds);
  const allowedQuestions = new Set(scopedQuestions.map((q) => q.questionId));

  const questionIds = [
    ...new Set(asStringArray(raw.question_ids).filter((id) => allowedQuestions.has(id))),
  ];
  for (const q of scopedQuestions) {
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
