import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildAiRequestBody, callChatAi, DEFAULT_AI_MODEL, readAiCallConfig, type AiCallConfig, type AiMessage } from '../openai';

const CONFIG: AiCallConfig = { model: 'gpt-6-sol', reasoningEffort: 'none', timeoutMs: 12_000 };
const MESSAGES: AiMessage[] = [
  { role: 'system', content: 'rules' },
  { role: 'user', content: 'Hello' },
];

const jsonResponse = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;
const okBody = {
  choices: [{ message: { content: ' {"reply":"Hi"} ' } }],
  usage: { prompt_tokens: 9560, completion_tokens: 162, prompt_tokens_details: { cached_tokens: 9544 } },
};

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key';
});
afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  vi.restoreAllMocks();
});

describe('readAiCallConfig', () => {
  it('환경변수가 없으면 기본값: gpt-6-sol · none · 12초', () => {
    expect(readAiCallConfig({})).toEqual({ model: DEFAULT_AI_MODEL, reasoningEffort: 'none', timeoutMs: 12_000 });
    expect(DEFAULT_AI_MODEL).toBe('gpt-6-sol');
  });

  it('값을 읽고, 시간 한도는 2~30초로 자른다', () => {
    expect(
      readAiCallConfig({ OPENAI_CHAT_AI_MODEL: ' gpt-6.1-sol ', OPENAI_CHAT_AI_REASONING_EFFORT: 'low', CHAT_AI_TIMEOUT_MS: '8000' })
    ).toEqual({ model: 'gpt-6.1-sol', reasoningEffort: 'low', timeoutMs: 8000 });
    expect(readAiCallConfig({ CHAT_AI_TIMEOUT_MS: '500' }).timeoutMs).toBe(2000);
    expect(readAiCallConfig({ CHAT_AI_TIMEOUT_MS: '99999' }).timeoutMs).toBe(30_000);
    expect(readAiCallConfig({ CHAT_AI_TIMEOUT_MS: 'abc' }).timeoutMs).toBe(12_000);
    expect(readAiCallConfig({ OPENAI_CHAT_AI_MODEL: '  ' }).model).toBe('gpt-6-sol');
  });
});

describe('buildAiRequestBody', () => {
  it('JSON 응답 형식 · 출력 한도 · 추론 강도를 넣는다', () => {
    expect(buildAiRequestBody(CONFIG, MESSAGES, 'none')).toEqual({
      model: 'gpt-6-sol',
      messages: MESSAGES,
      max_completion_tokens: 900,
      response_format: { type: 'json_object' },
      reasoning_effort: 'none',
    });
  });

  it('추론 강도가 null 이면 그 항목을 넣지 않는다', () => {
    expect('reasoning_effort' in buildAiRequestBody(CONFIG, MESSAGES, null)).toBe(false);
  });
});

describe('callChatAi', () => {
  it('성공: 내용과 토큰 수(캐시 포함)를 돌려준다', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, okBody));
    const r = await callChatAi(MESSAGES, CONFIG, { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toMatchObject({
      ok: true,
      content: '{"reply":"Hi"}',
      usage: { promptTokens: 9560, cachedTokens: 9544, completionTokens: 162 },
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    expect(JSON.parse(String(init.body)).reasoning_effort).toBe('none');
  });

  it('키가 없으면 부르지 않고 no_api_key', async () => {
    delete process.env.OPENAI_API_KEY;
    const fetchImpl = vi.fn();
    const r = await callChatAi(MESSAGES, CONFIG, { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ok: false, error: 'no_api_key', latencyMs: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('429 → rate_limit, 500 → api_error (상태 코드 포함)', async () => {
    const limited = await callChatAi(MESSAGES, CONFIG, {
      fetchImpl: (async () => jsonResponse(429, { error: { message: 'slow down' } })) as unknown as typeof fetch,
    });
    expect(limited).toMatchObject({ ok: false, error: 'rate_limit', status: 429 });
    const broken = await callChatAi(MESSAGES, CONFIG, {
      fetchImpl: (async () => jsonResponse(500, {})) as unknown as typeof fetch,
    });
    expect(broken).toMatchObject({ ok: false, error: 'api_error', status: 500 });
    expect('reasoningRejected' in broken).toBe(false);
  });

  it('내용이 비어 있으면 invalid_response', async () => {
    const r = await callChatAi(MESSAGES, CONFIG, {
      fetchImpl: (async () => jsonResponse(200, { choices: [{ message: { content: '  ' } }] })) as unknown as typeof fetch,
    });
    expect(r).toMatchObject({ ok: false, error: 'invalid_response' });
  });

  it('시간 한도를 넘기면 끊고 timeout', async () => {
    const fetchImpl = (async (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      })) as unknown as typeof fetch;
    const r = await callChatAi(MESSAGES, CONFIG, { fetchImpl, timeoutMs: 30 });
    expect(r).toMatchObject({ ok: false, error: 'timeout' });
  });

  it('네트워크 오류는 network_error — throw 하지 않는다', async () => {
    const r = await callChatAi(MESSAGES, CONFIG, {
      fetchImpl: (async () => {
        throw new Error('ECONNRESET');
      }) as unknown as typeof fetch,
    });
    expect(r).toMatchObject({ ok: false, error: 'network_error' });
  });

  it('모델이 추론 강도를 받지 않으면(400) 그 항목을 빼고 한 번 더 부른다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(400, { error: { message: "Unsupported value: 'reasoning_effort' does not support 'none'" } }))
      .mockResolvedValueOnce(jsonResponse(200, okBody));
    const r = await callChatAi(MESSAGES, { ...CONFIG, model: 'gpt-6.1-sol' }, { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const second = JSON.parse(String((fetchImpl.mock.calls[1] as unknown as [string, RequestInit])[1].body));
    expect('reasoning_effort' in second).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('다른 400 은 다시 부르지 않는다', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(400, { error: { message: 'invalid model' } }));
    const r = await callChatAi(MESSAGES, CONFIG, { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toMatchObject({ ok: false, error: 'api_error', status: 400 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
