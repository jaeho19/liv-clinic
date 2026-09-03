import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  treatmentsFor, termsFor, questionsFor, isKnownTerm, isKnownQuestion, pickText,
} from '../rules';
import { CONSULT_ONLY } from '../types';

describe('treatmentsFor', () => {
  it('displayOrder 오름차순으로 돌려준다', () => {
    const rows = treatmentsFor('sagging');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((r) => r.displayOrder)).toEqual([...rows.map((r) => r.displayOrder)].sort((a, b) => a - b));
  });

  it('sagging의 첫 시술은 aptos다 (고정 순서)', () => {
    expect(treatmentsFor('sagging')[0].treatmentId).toBe('aptos');
  });

  it('수술 상담이 필요한 고민은 consultOnly를 첫 행으로 둔다', () => {
    expect(treatmentsFor('underEye')[0].treatmentId).toBe(CONSULT_ONLY);
  });

  it('없는 고민에는 빈 배열을 돌려준다', () => {
    expect(treatmentsFor('nope')).toEqual([]);
  });
});

describe('termsFor', () => {
  it('해당 고민의 용어만 돌려준다', () => {
    const terms = termsFor('texture');
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.every((t) => t.concernId === 'texture')).toBe(true);
  });
});

describe('questionsFor', () => {
  it("appliesTo가 '*'인 질문을 항상 포함한다", () => {
    const ids = questionsFor('texture', ['skinbooster']).map((q) => q.questionId);
    expect(ids).toContain('q_sessions');
  });

  it('concern 한정 질문은 해당 고민에서만 나온다', () => {
    expect(questionsFor('sagging', ['aptos']).map((q) => q.questionId)).toContain('q_thread_type');
    expect(questionsFor('texture', ['skinbooster']).map((q) => q.questionId)).not.toContain('q_thread_type');
  });
});

describe('isKnownTerm / isKnownQuestion', () => {
  it('실재하는 id에만 true를 준다', () => {
    expect(isKnownTerm('jawline_sagging')).toBe(true);
    expect(isKnownTerm('made_up')).toBe(false);
    expect(isKnownQuestion('q_sessions')).toBe(true);
    expect(isKnownQuestion('q_made_up')).toBe(false);
  });
});

describe('pickText', () => {
  it('해당 언어를 돌려준다', () => {
    expect(pickText({ ko: '가', en: 'a', ja: 'あ', zh: '啊' }, 'ja')).toBe('あ');
  });

  it('비어 있으면 빈 문자열을 돌려준다 (한국어로 흘리지 않는다)', () => {
    expect(pickText({ ko: '가', en: '', ja: '', zh: '' }, 'en')).toBe('');
  });
});

// 정렬 로직 강제 검증 — .sort() 제거 시 반드시 실패해야 함
describe('treatmentsFor sort enforcement', () => {
  it('displayOrder가 뒤섞인 데이터도 올바르게 정렬한다', async () => {
    vi.resetModules();

    // displayOrder가 의도적으로 뒤섞인 가짜 데이터로 mock
    vi.doMock('@/lib/data/concernRules.generated', () => ({
      CONCERN_RULES: [
        {
          concernId: 'test_sort',
          treatmentId: 'third',
          displayOrder: 3,
          reason: { ko: '', en: '', ja: '', zh: '' },
          caution: { ko: '', en: '', ja: '', zh: '' },
          reviewedBy: 'test',
          reviewedAt: '2026-01-01',
        },
        {
          concernId: 'test_sort',
          treatmentId: 'first',
          displayOrder: 1,
          reason: { ko: '', en: '', ja: '', zh: '' },
          caution: { ko: '', en: '', ja: '', zh: '' },
          reviewedBy: 'test',
          reviewedAt: '2026-01-01',
        },
        {
          concernId: 'test_sort',
          treatmentId: 'second',
          displayOrder: 2,
          reason: { ko: '', en: '', ja: '', zh: '' },
          caution: { ko: '', en: '', ja: '', zh: '' },
          reviewedBy: 'test',
          reviewedAt: '2026-01-01',
        },
      ],
      CONCERN_TERMS: [],
      PREP_QUESTIONS: [],
    }));

    // mocked 모듈 재임포트
    const rulesModule = await import('../rules');
    const sorted = rulesModule.treatmentsFor('test_sort');

    // 정렬이 제대로 작동하면 [1, 2, 3] 순서
    // .sort() 호출이 없으면 [3, 1, 2]가 나와 이 테스트는 실패한다
    expect(sorted.map((r) => r.displayOrder)).toEqual([1, 2, 3]);
    expect(sorted[0].treatmentId).toBe('first');
    expect(sorted[1].treatmentId).toBe('second');
    expect(sorted[2].treatmentId).toBe('third');
  });
});
