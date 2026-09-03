import { describe, it, expect } from 'vitest';
import { buildResult } from '../buildResult';
import { CONSULT_ONLY } from '../types';

const SEL = {
  termIds: ['jawline_sagging'],
  treatmentIds: ['ulthera', 'aptos'],
  questionIds: ['q_sessions', 'q_recovery', 'q_cautions'],
  restatement: '턱선이 신경 쓰이신다는 말씀이군요.',
  lowConfidence: false,
};

describe('buildResult', () => {
  it('시술을 displayOrder 순으로 재정렬한다 (LLM 순서를 믿지 않는다)', () => {
    const out = buildResult(SEL, 'sagging', 'ko');
    expect(out.treatments.map((t) => t.id)).toEqual(['aptos', 'ulthera']);
  });

  it('시술 이름과 사유를 채운다', () => {
    const out = buildResult(SEL, 'sagging', 'ko');
    expect(out.treatments[0].name).toBe('압토스 바이오 리프팅');
    expect(out.treatments[0].reason).toContain('실');
  });

  it('카드 4 필드를 TREATMENTS에서 가져온다', () => {
    const t = buildResult(SEL, 'sagging', 'ko').treatments.find((x) => x.id === 'ulthera')!;
    expect(t.duration).toBe('60-90분');
    expect(t.recovery).toBe('즉시 일상 복귀 가능');
    expect(t.cautions.length).toBeGreaterThan(0);
  });

  it('consultOnly는 이름만 두고 소요시간·회복을 비운다', () => {
    const out = buildResult(
      { ...SEL, treatmentIds: [CONSULT_ONLY, 'filler'] }, 'underEye', 'ko');
    const row = out.treatments.find((t) => t.consultOnly)!;
    expect(row.duration).toBe('');
    expect(row.href).toBeNull();
    expect(row.reason).toContain('상담');
  });

  it('용어와 질문을 해당 언어로 채운다', () => {
    const out = buildResult(SEL, 'sagging', 'en');
    expect(out.terms[0].label).toBe('Jawline laxity');
    expect(out.questions[0].text).toBe('How many sessions would I need?');
  });

  it('없는 id는 조용히 건너뛴다', () => {
    const out = buildResult({ ...SEL, termIds: ['nope'], questionIds: ['nope'] }, 'sagging', 'ko');
    expect(out.terms).toEqual([]);
    expect(out.questions).toEqual([]);
  });
});
