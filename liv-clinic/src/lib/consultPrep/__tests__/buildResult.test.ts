import { describe, it, expect } from 'vitest';
import { createTranslator } from 'use-intl/core';
import { buildResult, treatmentGroupOf, type TreatmentNameResolver } from '../buildResult';
import { CONSULT_ONLY } from '../types';
import { CONCERN_RULES } from '@/lib/data/concernRules.generated';
import enMessages from '@/messages/en.json';
import jaMessages from '@/messages/ja.json';

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

  // 회귀 방지: TREATMENT_HREF에 규칙표(CONCERN_RULES)의 실제 treatmentId가 하나라도
  // 빠지면 그 시술의 href가 조용히 null로 새어나간다(toning 누락 사고 재발 방지).
  // 규칙표 CSV에 새 시술이 추가되고 TREATMENT_HREF를 안 챙기면 이 테스트가 실패해야 한다.
  it('규칙표의 모든 concern에서, consultOnly가 아닌 시술은 href가 채워진다', () => {
    const concernIds = [...new Set(CONCERN_RULES.map((r) => r.concernId))];
    expect(concernIds.length).toBeGreaterThan(0);

    for (const concernId of concernIds) {
      const treatmentIds = CONCERN_RULES.filter((r) => r.concernId === concernId).map(
        (r) => r.treatmentId
      );
      const out = buildResult(
        { ...SEL, treatmentIds },
        concernId,
        'ko'
      );
      for (const t of out.treatments) {
        if (t.id === CONSULT_ONLY) continue;
        expect(t.href, `${concernId}/${t.id} href should not be null`).not.toBeNull();
      }
    }
  });
});

// --- 리뷰(2026-09-03) Important 3: 카드 2의 시술명 로케일 ---
//
// TREATMENTS[...].name 은 한국어 고정이라 lang='en' 손님에게도 `울쎄라피 프라임`이 떴다.
// buildResult 는 순수 함수로 남기고, 번역 조회는 선택적 resolver 로 주입한다.

/**
 * API 라우트의 resolver 와 같은 규칙: `treatments.{그룹}.{id}.name`, 없으면 undefined.
 *
 * 라우트는 next-intl/server 의 getTranslations 를 쓰지만 그건 서버 컨텍스트를 요구한다.
 * getTranslations 가 돌려주는 것과 같은 use-intl 번역기를 여기서 직접 만들어, 실제
 * messages/*.json 에 대해 키 경로와 `has()` 폴백이 맞는지 검증한다.
 */
type LooseTranslator = { (key: string): string; has(key: string): boolean };

function resolverFor(locale: string, messages: Record<string, unknown>): TreatmentNameResolver {
  const t = createTranslator({
    locale,
    messages,
    namespace: 'treatments',
  }) as unknown as LooseTranslator;
  return (treatmentId: string) => {
    const group = treatmentGroupOf(treatmentId);
    if (!group) return undefined;
    const key = `${group}.${treatmentId}.name`;
    return t.has(key) ? t(key) : undefined;
  };
}

describe('treatmentGroupOf', () => {
  it.each([
    ['ulthera', 'lifting'],
    ['thermage', 'lifting'],
    ['aptos', 'lifting'],
    ['filler', 'antiaging'],
    ['skinbooster', 'antiaging'],
    ['toning', 'laser'],
  ])('%s → %s', (id, group) => {
    expect(treatmentGroupOf(id)).toBe(group);
  });

  it('TREATMENTS에 없는 값은 null이다', () => {
    expect(treatmentGroupOf(CONSULT_ONLY)).toBeNull();
    expect(treatmentGroupOf('made_up')).toBeNull();
  });

  // 회귀 방지: 규칙표에 새 시술이 들어왔는데 TREATMENTS에 없으면 i18n 키를 조립할 수 없다.
  it('규칙표의 모든 시술(consultOnly 제외)이 그룹에 매핑된다', () => {
    for (const id of new Set(CONCERN_RULES.map((r) => r.treatmentId))) {
      if (id === CONSULT_ONLY) continue;
      expect(treatmentGroupOf(id), `${id} has no TREATMENTS group`).not.toBeNull();
    }
  });
});

describe('buildResult — 시술명 로케일', () => {
  it('nameOf 를 안 넘기면 기존대로 TREATMENTS 의 한국어 이름을 쓴다', () => {
    const out = buildResult(SEL, 'sagging', 'en');
    expect(out.treatments.find((t) => t.id === 'ulthera')!.name).toBe('울쎄라피 프라임');
  });

  it('nameOf 를 넘기면 그 값을 쓴다', () => {
    const out = buildResult(SEL, 'sagging', 'en', (id) => `NAME:${id}`);
    expect(out.treatments.map((t) => t.name)).toEqual(['NAME:aptos', 'NAME:ulthera']);
  });

  const FALLBACK_CASES: Array<{ label: string; returned: string | null | undefined }> = [
    { label: 'undefined', returned: undefined },
    { label: 'null', returned: null },
    { label: '빈 문자열', returned: '' },
    { label: '공백만', returned: '   ' },
  ];

  it.each(FALLBACK_CASES)('resolver 가 $label 을 돌려주면 한국어로 폴백한다', ({ returned }) => {
    const out = buildResult(SEL, 'sagging', 'en', () => returned);
    expect(out.treatments.find((t) => t.id === 'ulthera')!.name).toBe('울쎄라피 프라임');
  });

  it('실제 en.json 으로 만든 resolver 는 카드 2에 영어 시술명을 낸다', () => {
    const out = buildResult(SEL, 'sagging', 'en', resolverFor('en', enMessages));
    expect(out.treatments.find((t) => t.id === 'ulthera')!.name).toBe('Ultherapy Prime');
    expect(out.treatments.find((t) => t.id === 'aptos')!.name).toBe('APTOS Bio Lifting');
  });

  it('실제 ja.json 으로 만든 resolver 는 카드 2에 일본어 시술명을 낸다', () => {
    const out = buildResult(SEL, 'sagging', 'ja', resolverFor('ja', jaMessages));
    expect(out.treatments.find((t) => t.id === 'ulthera')!.name).not.toBe('울쎄라피 프라임');
    expect(out.treatments.find((t) => t.id === 'ulthera')!.name).toBeTruthy();
  });

  // toning(레이저 토닝)만 4개 로케일 모두에 i18n 키가 없다 — 한국어로 폴백해야 한다.
  it('i18n 키가 없는 시술(toning)은 한국어 이름으로 폴백한다', () => {
    const sel = { ...SEL, treatmentIds: ['skinbooster', 'toning', 'skincare'] };
    const out = buildResult(sel, 'texture', 'en', resolverFor('en', enMessages));
    const byId = Object.fromEntries(out.treatments.map((t) => [t.id, t.name]));
    expect(byId.skinbooster).toBe('Skin Booster');
    expect(byId.skincare).toBe('Skincare');
    expect(byId.toning).toBe('레이저 토닝');
  });

  it('consultOnly 행은 resolver 를 넘겨도 이름이 비어 있다', () => {
    const out = buildResult(
      { ...SEL, treatmentIds: [CONSULT_ONLY, 'filler'] },
      'underEye',
      'en',
      resolverFor('en', enMessages)
    );
    expect(out.treatments.find((t) => t.consultOnly)!.name).toBe('');
    expect(out.treatments.find((t) => t.id === 'filler')!.name).toBe('Filler');
  });
});
