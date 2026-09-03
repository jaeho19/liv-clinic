import { describe, it, expect } from 'vitest';
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
