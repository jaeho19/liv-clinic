import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildSystemPrompt } from '../translation';

// MODEL은 모듈 로드 시점에 고정되므로(translation.ts 상단 const),
// env 정리 후 매번 새로 import해야 기본값 경로를 검증할 수 있다.
async function importTranslate() {
  vi.resetModules();
  return (await import('../translation')).translate;
}

function okResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

function requestedModel(fetchMock: ReturnType<typeof vi.fn>): string | undefined {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return (JSON.parse(init.body as string) as { model?: string }).model;
}

describe('translate model selection', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_TRANSLATION_MODEL;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.OPENAI_TRANSLATION_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_TRANSLATION_MODEL;
    else process.env.OPENAI_TRANSLATION_MODEL = originalModel;
  });

  it('requests gpt-5.6-luna when OPENAI_TRANSLATION_MODEL is not set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('안녕하세요'));
    vi.stubGlobal('fetch', fetchMock);

    const translate = await importTranslate();
    const result = await translate('Hello', 'en', 'ko');

    expect(result.status).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // gpt-4.1-nano는 2026-10-23 종료. OpenAI 지정 대체 모델이 gpt-5.6-luna다.
    expect(requestedModel(fetchMock)).toBe('gpt-5.6-luna');
  });

  it('honors OPENAI_TRANSLATION_MODEL when set (Netlify env가 코드 기본값을 덮어쓴다)', async () => {
    process.env.OPENAI_TRANSLATION_MODEL = 'custom-model';
    const fetchMock = vi.fn().mockResolvedValue(okResponse('안녕하세요'));
    vi.stubGlobal('fetch', fetchMock);

    const translate = await importTranslate();
    await translate('Hello', 'en', 'ko');

    expect(requestedModel(fetchMock)).toBe('custom-model');
  });
});

// 파라미터를 하나라도 틀리면 400이 나는데, translate()의 실패 정책이 "원문 그대로 반환"이라
// 화면은 멀쩡해 보이면서 번역만 조용히 꺼진다. 그래서 바디 조립을 직접 고정한다.
describe('buildOpenAIBody — 모델 계열 분기', () => {
  const originalEffort = process.env.OPENAI_TRANSLATION_REASONING_EFFORT;

  afterEach(() => {
    if (originalEffort === undefined) delete process.env.OPENAI_TRANSLATION_REASONING_EFFORT;
    else process.env.OPENAI_TRANSLATION_REASONING_EFFORT = originalEffort;
  });

  async function importBody() {
    vi.resetModules();
    return await import('../translation');
  }

  it('구형 계열(gpt-4.1-mini)은 temperature와 max_tokens를 보낸다', async () => {
    const { buildOpenAIBody } = await importBody();
    const body = buildOpenAIBody('gpt-4.1-mini', 'sys', 'hi');

    expect(body.temperature).toBe(0.2);
    expect(body.max_tokens).toBe(800);
    expect(body).not.toHaveProperty('max_completion_tokens');
    expect(body).not.toHaveProperty('reasoning_effort');
  });

  it('gpt-5 계열은 temperature를 빼고 max_completion_tokens를 보낸다', async () => {
    const { buildOpenAIBody } = await importBody();
    const body = buildOpenAIBody('gpt-5.6-luna', 'sys', 'hi');

    // temperature 비기본값은 400 unsupported_value로 거부된다
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('max_tokens');
    expect(body.max_completion_tokens).toBe(800);
  });

  it("gpt-5 계열의 reasoning_effort 기본값은 'none'이다 (지연·비용 방어)", async () => {
    delete process.env.OPENAI_TRANSLATION_REASONING_EFFORT;
    const { buildOpenAIBody } = await importBody();

    expect(buildOpenAIBody('gpt-5.6-luna', 'sys', 'hi').reasoning_effort).toBe('none');
  });

  it('OPENAI_TRANSLATION_REASONING_EFFORT로 override할 수 있다', async () => {
    process.env.OPENAI_TRANSLATION_REASONING_EFFORT = 'low';
    const { buildOpenAIBody } = await importBody();

    expect(buildOpenAIBody('gpt-5.6-luna', 'sys', 'hi').reasoning_effort).toBe('low');
  });

  it('계열 판정: gpt-5*/o1/o3/o4는 reasoning, gpt-4*는 아니다', async () => {
    const { isReasoningFamily } = await importBody();

    expect(isReasoningFamily('gpt-5.6-luna')).toBe(true);
    expect(isReasoningFamily('gpt-5-mini')).toBe(true);
    expect(isReasoningFamily('o3-mini')).toBe(true);
    expect(isReasoningFamily('gpt-4.1-mini')).toBe(false);
    expect(isReasoningFamily('gpt-4o-mini')).toBe(false);
  });

  it('메시지 구조는 계열과 무관하게 동일하다', async () => {
    const { buildOpenAIBody } = await importBody();

    for (const model of ['gpt-4.1-mini', 'gpt-5.6-luna']) {
      const body = buildOpenAIBody(model, 'SYSTEM', 'USER');
      expect(body.model).toBe(model);
      expect(body.messages).toEqual([
        { role: 'system', content: 'SYSTEM' },
        { role: 'user', content: 'USER' },
      ]);
    }
  });
});

describe('buildSystemPrompt — 말투 (원장님 요청 2026-09-03)', () => {
  it('한국어 → 손님 언어는 따뜻하고 친근한 안내 데스크 말투를 지시한다', () => {
    const p = buildSystemPrompt('ko', 'en');
    expect(p).toContain('warm, friendly and welcoming');
    expect(p).toContain('Do not add greetings, emojis, or any sentence that is not in the source');
    expect(p).toContain('English');
  });
  it('손님 언어 → 한국어(직원이 읽는 쪽)는 그대로 ~합니다체', () => {
    const p = buildSystemPrompt('en', 'ko');
    expect(p).not.toContain('warm, friendly');
    expect(p).toContain('~합니다체');
  });
  it('브랜드 보존 규칙은 양방향에 남아 있다', () => {
    expect(buildSystemPrompt('ko', 'ja')).toContain('Ulthera');
    expect(buildSystemPrompt('ja', 'ko')).toContain('울쎄라');
  });
});
