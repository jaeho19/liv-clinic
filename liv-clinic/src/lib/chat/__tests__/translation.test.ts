import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

  it('requests gpt-4.1-nano when OPENAI_TRANSLATION_MODEL is not set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('안녕하세요'));
    vi.stubGlobal('fetch', fetchMock);

    const translate = await importTranslate();
    const result = await translate('Hello', 'en', 'ko');

    expect(result.status).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedModel(fetchMock)).toBe('gpt-4.1-nano');
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
