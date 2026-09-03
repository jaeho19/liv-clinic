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

const INPUT = { concernId: 'sagging', description: '턱선이 흐려졌어요', lang: 'ko' as const };

describe('classify', () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
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
});
