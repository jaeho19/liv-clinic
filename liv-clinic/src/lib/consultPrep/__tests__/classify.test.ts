import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function importClassify() {
  vi.resetModules();
  return (await import('../classify')).classify;
}

function okResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
  };
}

/** fetch mock에 실제로 넘어간 요청 바디를 꺼낸다. translation.test.ts의 requestedModel과 같은 패턴. */
function requestedBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

const INPUT = { concernId: 'sagging', description: '턱선이 흐려졌어요', lang: 'ko' as const };

describe('classify', () => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_CONSULT_PREP_MODEL;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_CONSULT_PREP_MODEL;
    else process.env.OPENAI_CONSULT_PREP_MODEL = originalModel;
  });

  it('정상 응답을 그대로 통과시킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: ['jawline_sagging'],
      treatment_ids: ['aptos', 'ulthera'],
      question_ids: ['q_sessions', 'q_recovery', 'q_cautions'],
      restatement: '턱선이 흐려진 것이 신경 쓰이신다는 말씀이군요.',
      confidence: 'high',
    })));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.termIds).toEqual(['jawline_sagging']);
    expect(out.treatmentIds).toEqual(['aptos', 'ulthera']);
    expect(out.questionIds).toHaveLength(3);
    expect(out.restatement).toContain('턱선');
    expect(out.lowConfidence).toBe(false);
  });

  it('사전에 없는 term_id는 버린다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: ['jawline_sagging', '지어낸용어'],
      treatment_ids: ['aptos'],
      question_ids: ['q_sessions'],
      restatement: '',
      confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).termIds).toEqual(['jawline_sagging']);
  });

  it('규칙표에 없는 treatment_id는 버린다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos', 'botox'], question_ids: [],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    // botox 는 sagging 규칙표에 없다
    expect((await classify(INPUT)).treatmentIds).toEqual(['aptos']);
  });

  it('treatment_ids가 비면 규칙표 상위 3개로 채운다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: [], question_ids: [],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).treatmentIds).toEqual(['aptos', 'thread', 'ulthera']);
  });

  it('금지어가 든 restatement는 통째로 생략한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: [],
      restatement: '최고의 결과를 보장합니다',
      confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).restatement).toBe('');
  });

  it('question_ids가 3개 미만이면 규칙표에서 채워 3개를 만든다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: ['q_sessions'],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.questionIds).toHaveLength(3);
    expect(out.questionIds[0]).toBe('q_sessions');
  });

  it('API 실패해도 throw 하지 않고 규칙표 결과를 돌려준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.treatmentIds).toEqual(['aptos', 'thread', 'ulthera']);
    expect(out.questionIds).toHaveLength(3);
    expect(out.restatement).toBe('');
    expect(out.lowConfidence).toBe(true);
  });

  it('JSON이 아닌 응답도 throw 하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '안녕하세요' } }] }),
    }));
    const classify = await importClassify();
    expect((await classify(INPUT)).lowConfidence).toBe(true);
  });

  it('API 키가 없어도 throw 하지 않는다', async () => {
    delete process.env.OPENAI_API_KEY;
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.treatmentIds.length).toBeGreaterThan(0);
    expect(out.lowConfidence).toBe(true);
  });

  it("confidence가 'low'면 lowConfidence를 세운다", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: [],
      restatement: '', confidence: 'low',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).lowConfidence).toBe(true);
  });

  // --- 리뷰 Important 1: 파싱은 성공했지만 순수 객체가 아닌 응답 ---

  it('파싱 결과가 JSON 문자열(따옴표 포함)이면 throw 없이 lowConfidence를 세운다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      // 모델이 마크다운/설명 없이 순수 문자열만 반환한 경우 — JSON.parse는 성공하지만 결과가 string이다.
      json: async () => ({ choices: [{ message: { content: '"안녕하세요"' } }] }),
    }));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.lowConfidence).toBe(true);
    expect(out.treatmentIds).toEqual(['aptos', 'thread', 'ulthera']);
  });

  it('파싱 결과가 배열이면 throw 없이 lowConfidence를 세운다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '[]' } }] }),
    }));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.lowConfidence).toBe(true);
    expect(out.treatmentIds).toEqual(['aptos', 'thread', 'ulthera']);
  });

  // --- 리뷰 Important 2: 모델 계열 분기 ---

  it('비-reasoning 모델(gpt-4o-mini)은 reasoning_effort 없이 max_tokens/temperature를 보낸다', async () => {
    process.env.OPENAI_CONSULT_PREP_MODEL = 'gpt-4o-mini';
    const fetchMock = vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: [],
      restatement: '', confidence: 'high',
    }));
    vi.stubGlobal('fetch', fetchMock);
    const classify = await importClassify();
    await classify(INPUT);

    const body = requestedBody(fetchMock);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body).not.toHaveProperty('reasoning_effort');
    expect(body).not.toHaveProperty('max_completion_tokens');
    expect(body.max_tokens).toBe(500);
    expect(body.temperature).toBe(0.2);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('기본 모델(reasoning 계열)은 max_tokens/temperature 없이 reasoning_effort를 보낸다', async () => {
    delete process.env.OPENAI_CONSULT_PREP_MODEL;
    const fetchMock = vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'], question_ids: [],
      restatement: '', confidence: 'high',
    }));
    vi.stubGlobal('fetch', fetchMock);
    const classify = await importClassify();
    await classify(INPUT);

    const body = requestedBody(fetchMock);
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('temperature');
    expect(body.max_completion_tokens).toBe(500);
    expect(body).toHaveProperty('reasoning_effort');
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  // --- 리뷰 Important 3: 폴백 사유를 관측 가능하게 로그로 남긴다 ---

  it('API 실패 시 사유(http_500)를 콘솔 경고로 남기고 손님 입력은 남기지 않는다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const classify = await importClassify();
    await classify(INPUT);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const logged = warnSpy.mock.calls[0].join(' ');
    expect(logged).toContain('http_500');
    expect(logged).not.toContain(INPUT.description);
  });

  it('API 키가 없을 때는 사유(no_api_key)를 콘솔 경고로 남긴다', async () => {
    delete process.env.OPENAI_API_KEY;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const classify = await importClassify();
    await classify(INPUT);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0].join(' ')).toContain('no_api_key');
  });

  // --- 리뷰 Important 4: term_ids / question_ids 중복 제거 ---

  it('term_id가 중복으로 오면 제거된 채로 나간다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: ['jawline_sagging', 'jawline_sagging', 'jawline_sagging'],
      treatment_ids: ['aptos'], question_ids: [],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    expect((await classify(INPUT)).termIds).toEqual(['jawline_sagging']);
  });

  it('question_id가 중복으로 오면 제거하고 규칙표에서 채워 서로 다른 3개를 만든다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({
      term_ids: [], treatment_ids: ['aptos'],
      question_ids: ['q_sessions', 'q_sessions', 'q_sessions'],
      restatement: '', confidence: 'high',
    })));
    const classify = await importClassify();
    const out = await classify(INPUT);
    expect(out.questionIds).toHaveLength(3);
    expect(new Set(out.questionIds).size).toBe(3);
    expect(out.questionIds[0]).toBe('q_sessions');
  });
});
