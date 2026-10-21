import 'server-only';
import type { ChatTurn } from './prompt';

// AI 응대의 OpenAI 호출 (스펙 2026-10-02 chat-ai-first-response §4.4). 번역(translation.ts)과 같은 키를 쓴다.
// throw 하지 않는다 — 실패는 결과값으로 돌려주고, 호출자(turn.ts)가 접수 안내로 대신한다.
// 번역 쪽의 buildOpenAIBody 는 모델 이름이 gpt-5·o 로 시작할 때만 새 파라미터 규칙을 쓰므로(isReasoningFamily)
// gpt-6 계열을 쓰는 여기서는 요청 본문을 따로 만든다.

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_AI_MODEL = 'gpt-6-sol';
const DEFAULT_REASONING_EFFORT = 'none';
const DEFAULT_TIMEOUT_MS = 12_000;
const MIN_TIMEOUT_MS = 2_000;
const MAX_TIMEOUT_MS = 30_000;
/** 답 + 요지 + 가예약 JSON. 시험에서 출력은 120~390토큰이었다 */
const MAX_OUTPUT_TOKENS = 900;

export interface AiCallConfig {
  model: string;
  /** 'none' 이 기본. none 을 받지 않는 모델(gpt-6.1-sol)에는 'low' */
  reasoningEffort: string;
  timeoutMs: number;
}

/** OPENAI_CHAT_AI_MODEL · OPENAI_CHAT_AI_REASONING_EFFORT · CHAT_AI_TIMEOUT_MS (2~30초로 자른다). */
export function readAiCallConfig(env: Record<string, string | undefined> = process.env): AiCallConfig {
  const timeout = Number(env.CHAT_AI_TIMEOUT_MS);
  return {
    model: (env.OPENAI_CHAT_AI_MODEL ?? '').trim() || DEFAULT_AI_MODEL,
    reasoningEffort: (env.OPENAI_CHAT_AI_REASONING_EFFORT ?? '').trim() || DEFAULT_REASONING_EFFORT,
    timeoutMs:
      Number.isFinite(timeout) && timeout > 0
        ? Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(timeout)))
        : DEFAULT_TIMEOUT_MS,
  };
}

export interface AiMessage {
  role: 'system' | ChatTurn['role'];
  content: string;
}

/** chat.completions 요청 본문. reasoningEffort 가 null 이면 그 항목을 넣지 않는다(모델 기본값). */
export function buildAiRequestBody(
  config: Pick<AiCallConfig, 'model'>,
  messages: AiMessage[],
  reasoningEffort: string | null
): Record<string, unknown> {
  return {
    model: config.model,
    messages,
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    response_format: { type: 'json_object' },
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
  };
}

export interface AiUsage {
  promptTokens: number | null;
  cachedTokens: number | null;
  completionTokens: number | null;
}

export type AiCallError = 'no_api_key' | 'timeout' | 'rate_limit' | 'api_error' | 'invalid_response' | 'network_error';

export type AiCallResult =
  | { ok: true; content: string; latencyMs: number; usage: AiUsage }
  | { ok: false; error: AiCallError; latencyMs: number; status?: number };

interface CompletionJson {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export interface AiCallOptions {
  /** 이번 호출의 시간 한도(ms) — 남은 시간이 config.timeoutMs 보다 짧을 때 호출자가 줄여 준다 */
  timeoutMs?: number;
  /** 테스트에서 바꿔 넣는다 */
  fetchImpl?: typeof fetch;
}

/**
 * 모델을 한 번 부른다. 시간 한도를 넘기면 끊는다.
 * 400 이고 오류 글에 reasoning 이 있으면(그 모델이 지정한 추론 강도를 받지 않음) 그 항목을 빼고 한 번 더 부른다.
 */
export async function callChatAi(messages: AiMessage[], config: AiCallConfig, options: AiCallOptions = {}): Promise<AiCallResult> {
  const start = Date.now();
  const elapsed = () => Date.now() - start;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: 'no_api_key', latencyMs: 0 };
  const doFetch = options.fetchImpl ?? fetch;
  const budget = options.timeoutMs ?? config.timeoutMs;

  const once = async (effort: string | null): Promise<AiCallResult & { reasoningRejected?: boolean }> => {
    const remaining = budget - elapsed();
    if (remaining <= 0) return { ok: false, error: 'timeout', latencyMs: elapsed() };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    try {
      const res = await doFetch(OPENAI_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(buildAiRequestBody(config, messages, effort)),
      });
      let json: CompletionJson | null = null;
      try {
        json = (await res.json()) as CompletionJson;
      } catch {
        json = null;
      }
      if (!res.ok) {
        const reasoningRejected = res.status === 400 && /reasoning/i.test(json?.error?.message ?? '');
        return {
          ok: false,
          error: res.status === 429 ? 'rate_limit' : 'api_error',
          status: res.status,
          latencyMs: elapsed(),
          reasoningRejected,
        };
      }
      const content = json?.choices?.[0]?.message?.content?.trim();
      if (!content) return { ok: false, error: 'invalid_response', latencyMs: elapsed() };
      return {
        ok: true,
        content,
        latencyMs: elapsed(),
        usage: {
          promptTokens: num(json?.usage?.prompt_tokens),
          cachedTokens: num(json?.usage?.prompt_tokens_details?.cached_tokens),
          completionTokens: num(json?.usage?.completion_tokens),
        },
      };
    } catch (e) {
      const aborted = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message));
      return { ok: false, error: aborted ? 'timeout' : 'network_error', latencyMs: elapsed() };
    } finally {
      clearTimeout(timer);
    }
  };

  const first = await once(config.reasoningEffort);
  if (!first.ok && first.reasoningRejected) {
    console.warn('[chat ai] reasoning effort rejected by the model, retrying without it:', config.model);
    const { reasoningRejected: _unused, ...second } = await once(null);
    void _unused;
    return second;
  }
  if (!first.ok) {
    const { reasoningRejected: _unused, ...rest } = first;
    void _unused;
    return rest;
  }
  return first;
}
