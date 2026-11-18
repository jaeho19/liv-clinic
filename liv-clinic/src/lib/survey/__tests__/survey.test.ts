import { describe, expect, it } from 'vitest';
import {
  RATING_QUESTION_IDS,
  SURVEY_LOCALES,
  SURVEY_PARTS,
  TREATMENT_IDS,
  GIFT_CODE_VALID_DAYS,
} from '../questions';
import { SURVEY_COPY, fillCopy } from '../copy';
import { surveySubmissionSchema, toSurveyResponseInsert, visibleParts } from '../schema';
import {
  formatGiftCode,
  generateGiftCode,
  giftCodeLastDay,
  giftCodeStatus,
  normalizeGiftCode,
  seoulDate,
} from '../giftCode';
import { npsOf, readRatings, seoulMonth, summarizeSurvey, type SurveyResponseLike } from '../summary';
import { buildSurveyCsv } from '../csv';
import { periodRange } from '../periods';

describe('관리자 기간', () => {
  it('이번 달·지난달·최근 3개월·올해 (연말·연초 넘김 포함)', () => {
    expect(periodRange('this_month', '2026-11-18')).toEqual({ from: '2026-11-01', to: '2026-11-18' });
    expect(periodRange('last_month', '2026-11-18')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(periodRange('last_month', '2027-01-05')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(periodRange('last_month', '2026-03-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(periodRange('last_3_months', '2027-01-05')).toEqual({ from: '2026-11-01', to: '2027-01-05' });
    expect(periodRange('this_year', '2026-11-18')).toEqual({ from: '2026-01-01', to: '2026-11-18' });
  });
});

const base = {
  locale: 'ko',
  version: 1,
  first_visit: true,
  treatments: ['botox'],
  ratings: { desk_kind: 5, nurse_pain: 4 },
  skipped_parts: [],
  recommend: 9,
};

describe('문항 구조', () => {
  it('대표원장 확정안: 평가 문항 11개 + 시작 2 + 추천 1 + 의견 1 = 15문항', () => {
    expect(RATING_QUESTION_IDS).toHaveLength(11);
    expect(2 + RATING_QUESTION_IDS.length + 1 + 1).toBe(15);
  });

  it('모든 평가 문항은 정확히 한 파트에 속하고, 파트마다 문항은 2개 이하', () => {
    const fromParts = SURVEY_PARTS.flatMap((p) => p.questions);
    expect([...fromParts].sort()).toEqual([...RATING_QUESTION_IDS].sort());
    for (const part of SURVEY_PARTS) expect(part.questions.length).toBeLessThanOrEqual(2);
  });

  it('직원 파트 이름은 원장님이 알려 준 호칭', () => {
    const labels = SURVEY_PARTS.map((p) => p.adminLabel);
    for (const title of ['상담실장', '데스크 코디네이터', '간호사', '피부관리사']) {
      expect(labels).toContain(title);
    }
  });
});

describe('문구 (5개 언어)', () => {
  it('언어마다 같은 키를 갖고 빈 문구가 없다', () => {
    const shape = (value: unknown): unknown =>
      value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, shape(v)]))
        : typeof value;
    const reference = shape(SURVEY_COPY.ko);
    for (const locale of SURVEY_LOCALES) {
      expect(shape(SURVEY_COPY[locale])).toEqual(reference);
    }
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        // detail(괄호 설명이 없는 시술)·subtitle(시설 파트)은 비어 있어도 된다 — 대신 언어마다 같이 비어야 한다
        const optional = path.endsWith('.detail') || path.endsWith('.subtitle');
        if (!optional) expect(value.trim(), path).not.toBe('');
        return;
      }
      if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    for (const locale of SURVEY_LOCALES) walk(SURVEY_COPY[locale], locale);
    for (const locale of SURVEY_LOCALES) {
      for (const id of TREATMENT_IDS) {
        expect(SURVEY_COPY[locale].treatments.items[id].detail === '', `${locale}.${id}.detail`).toBe(
          SURVEY_COPY.ko.treatments.items[id].detail === '',
        );
      }
      for (const part of SURVEY_PARTS) {
        expect(SURVEY_COPY[locale].parts[part.id].subtitle === '').toBe(SURVEY_COPY.ko.parts[part.id].subtitle === '');
      }
    }
  });

  it('모든 문항·시술·파트의 문구가 있다', () => {
    for (const locale of SURVEY_LOCALES) {
      const copy = SURVEY_COPY[locale];
      for (const id of RATING_QUESTION_IDS) expect(copy.questions[id], `${locale}.${id}`).toBeTruthy();
      for (const id of TREATMENT_IDS) expect(copy.treatments.items[id].label).toBeTruthy();
      for (const part of SURVEY_PARTS) expect(copy.parts[part.id].title).toBeTruthy();
      expect(copy.scale).toHaveLength(5);
    }
  });

  it('외국어 문구에 한글이 섞이지 않는다', () => {
    for (const locale of SURVEY_LOCALES.filter((l) => l !== 'ko')) {
      expect(JSON.stringify(SURVEY_COPY[locale]), locale).not.toMatch(/[가-힣]/);
    }
  });

  it('fillCopy 가 자리표시를 바꾼다', () => {
    expect(fillCopy('{answered}/{total} 답함', { answered: 3, total: 14 })).toBe('3/14 답함');
    expect(fillCopy('{days}일', { days: GIFT_CODE_VALID_DAYS })).toBe('90일');
    expect(fillCopy('{x} 그대로', {})).toBe('{x} 그대로');
  });
});

describe('제출 검증', () => {
  it('기본 응답을 받는다', () => {
    expect(surveySubmissionSchema.safeParse(base).success).toBe(true);
  });

  it('설문 화면이 실제로 보내는 모양(빈 기타 칸·허니팟 포함)을 받는다 — 2026-11-18 로컬 미리보기에서 잡은 요청', () => {
    const sent = {
      locale: 'ko', version: 1, first_visit: false, treatments: ['lifting_device', 'skincare'], treatment_other: '',
      ratings: { desk_kind: 5, desk_flow: 4, doctor_explain: 5, doctor_risk: 3, nurse_kind: 5, nurse_pain: 4, skin_kind: 5, skin_care: 5, facility_clean: 4 },
      skipped_parts: ['counselor'], recommend: 9, comment: '원장님 설명이 자세해서 좋았어요.', website: '',
    };
    const row = toSurveyResponseInsert(surveySubmissionSchema.parse(sent));
    expect(row).toMatchObject({ treatment_other: null, skipped_parts: ['counselor'], recommend: 9, first_visit: false });
    expect(Object.keys(row.ratings)).toHaveLength(9);
    expect('website' in row).toBe(false);
  });

  it('필수 문항(첫 방문·시술·추천)이 빠지면 거절', () => {
    for (const key of ['first_visit', 'treatments', 'recommend'] as const) {
      const rest: Record<string, unknown> = { ...base };
      delete rest[key];
      expect(surveySubmissionSchema.safeParse(rest).success, key).toBe(false);
    }
    expect(surveySubmissionSchema.safeParse({ ...base, treatments: [] }).success).toBe(false);
  });

  it('점수 범위·모르는 문항·모르는 언어를 거절', () => {
    expect(surveySubmissionSchema.safeParse({ ...base, recommend: 11 }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, recommend: 8.5 }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, ratings: { desk_kind: 0 } }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, ratings: { desk_kind: 6 } }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, ratings: { lang: 3 } }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, locale: 'vi' }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, version: 2 }).success).toBe(false);
  });

  it('「상담만 받음」은 다른 시술과 같이 고를 수 없고, 같은 시술 두 번도 거절', () => {
    expect(surveySubmissionSchema.safeParse({ ...base, treatments: ['consult_only', 'botox'] }).success).toBe(false);
    expect(surveySubmissionSchema.safeParse({ ...base, treatments: ['botox', 'botox'] }).success).toBe(false);
  });

  it('자유 의견은 1000자까지', () => {
    expect(surveySubmissionSchema.safeParse({ ...base, comment: 'a'.repeat(1000) }).success).toBe(true);
    expect(surveySubmissionSchema.safeParse({ ...base, comment: 'a'.repeat(1001) }).success).toBe(false);
  });
});

describe('저장 형태로 바꾸기', () => {
  const parse = (value: unknown) => toSurveyResponseInsert(surveySubmissionSchema.parse(value));

  it('넘긴 파트의 점수는 버리고, 시술은 목록 순서로', () => {
    const row = parse({
      ...base,
      treatments: ['laser', 'botox'],
      ratings: { desk_kind: 4, nurse_kind: 2, nurse_pain: 3, skin_care: 5 },
      skipped_parts: ['skincare'],
    });
    expect(row.treatments).toEqual(['botox', 'laser']);
    expect(row.ratings).toEqual({ desk_kind: 4, nurse_kind: 2, nurse_pain: 3 });
    expect(row.skipped_parts).toEqual(['skincare']);
  });

  it('「상담만 받음」이면 간호사·피부관리사 파트는 넘긴 것으로 저장', () => {
    const row = parse({ ...base, treatments: ['consult_only'], ratings: { nurse_kind: 5, counsel_fit: 4 } });
    expect(row.skipped_parts).toEqual(['nurse', 'skincare']);
    expect(row.ratings).toEqual({ counsel_fit: 4 });
  });

  it('빈 의견·기타 시술 없이 적은 기타 이름은 null', () => {
    const row = parse({ ...base, comment: '   ', treatment_other: '리쥬란' });
    expect(row.comment).toBeNull();
    expect(row.treatment_other).toBeNull();
    const withOther = parse({ ...base, treatments: ['other'], treatment_other: ' 리쥬란 ' });
    expect(withOther.treatment_other).toBe('리쥬란');
  });

  it('visibleParts: 상담만 받으면 시술 파트가 빠지고, 넘긴 파트도 빠진다', () => {
    expect(visibleParts(['consult_only'], []).map((p) => p.id)).toEqual(['desk', 'counselor', 'doctor', 'facility']);
    expect(visibleParts(['botox'], ['doctor']).map((p) => p.id)).toEqual([
      'desk', 'counselor', 'nurse', 'skincare', 'facility',
    ]);
  });
});

describe('답례품 번호', () => {
  it('6자리, 헷갈리는 글자 없음, DB 정규식과 같다', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateGiftCode();
      expect(code).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
    }
    // 하위 5비트: 0→2, 31→Z, 32→2, 255→Z, 8→A, 9→B
    expect(generateGiftCode(() => new Uint8Array([0, 31, 32, 255, 8, 9]))).toBe('2Z2ZAB');
  });

  it('직원 입력을 정리한다', () => {
    expect(normalizeGiftCode(' k7p-3qd ')).toBe('K7P3QD');
    expect(normalizeGiftCode('K7P3Q')).toBeNull();
    expect(normalizeGiftCode('O7P3QD')).toBeNull(); // O 는 쓰지 않는 글자
    expect(formatGiftCode('K7P3QD')).toBe('K7P-3QD');
  });

  it('유효 기간: 발급일 포함 90일, 쓴 번호는 used', () => {
    expect(giftCodeLastDay('2026-11-18')).toBe('2027-02-15');
    expect(giftCodeStatus({ issued_on: '2026-11-18', redeemed_at: null }, '2027-02-15')).toBe('unused');
    expect(giftCodeStatus({ issued_on: '2026-11-18', redeemed_at: null }, '2027-02-16')).toBe('expired');
    expect(giftCodeStatus({ issued_on: '2026-11-18', redeemed_at: '2026-11-19T01:00:00Z' }, '2026-11-20')).toBe('used');
  });

  it('서울 날짜: UTC 15시 = 서울 다음 날 0시', () => {
    expect(seoulDate(new Date('2026-11-18T14:59:00Z'))).toBe('2026-11-18');
    expect(seoulDate(new Date('2026-11-18T15:00:00Z'))).toBe('2026-11-19');
  });
});

function response(over: Partial<SurveyResponseLike>): SurveyResponseLike {
  return {
    created_at: '2026-11-18T03:00:00Z',
    locale: 'ko',
    first_visit: true,
    treatments: ['botox'],
    treatment_other: null,
    ratings: {},
    skipped_parts: [],
    recommend: 10,
    comment: null,
    ...over,
  };
}

describe('결과 계산', () => {
  it('추천 지수 = 9~10점 비율 − 0~6점 비율', () => {
    expect(npsOf([])).toBeNull();
    expect(npsOf([10, 9, 8, 7, 6])).toBe(20); // 2명 − 1명 / 5명
    expect(npsOf([0, 0, 10])).toBe(-33);
  });

  it('파트 점수는 넘긴 응답을 빼고 평균, 넘긴 수는 따로 센다', () => {
    const summary = summarizeSurvey([
      response({ ratings: { nurse_kind: 5, nurse_pain: 3, desk_kind: 4 } }),
      response({ ratings: { nurse_kind: 1 }, skipped_parts: [] }),
      response({ ratings: { desk_kind: 2 }, skipped_parts: ['nurse'] }),
      response({ treatments: ['consult_only'], ratings: { desk_kind: 5 } }),
    ]);
    const nurse = summary.parts.find((p) => p.id === 'nurse')!;
    expect(nurse.avg).toBe(3); // (5+3+1)/3
    expect(nurse.n).toBe(2);
    expect(nurse.skipped).toBe(2); // 직접 넘김 1 + 상담만 1
    const desk = summary.parts.find((p) => p.id === 'desk')!;
    expect(desk.avg).toBe(3.7); // (4+2+5)/3
    const nursePain = summary.questions.find((q) => q.id === 'nurse_pain')!;
    expect(nursePain).toMatchObject({ avg: 3, n: 1, lowShare: 0 });
    const nurseKind = summary.questions.find((q) => q.id === 'nurse_kind')!;
    expect(nurseKind.lowShare).toBe(0.5);
  });

  it('달은 서울 기준, 시술별 수와 의견(최신순)', () => {
    const summary = summarizeSurvey([
      response({ created_at: '2026-10-31T15:30:00Z', recommend: 5, comment: '대기가 길었어요' }), // 서울 11/1
      response({ created_at: '2026-10-31T14:30:00Z', treatments: ['laser', 'botox'], recommend: 9 }), // 서울 10/31
      response({ created_at: '2026-11-02T00:00:00Z', comment: '  친절했어요 ' }),
    ]);
    expect(summary.months.map((m) => [m.month, m.count])).toEqual([['2026-10', 1], ['2026-11', 2]]);
    expect(seoulMonth('2026-10-31T15:30:00Z')).toBe('2026-11');
    expect(summary.treatments[0]).toEqual({ id: 'botox', count: 3, nps: 33 });
    expect(summary.comments.map((c) => c.comment)).toEqual(['친절했어요', '대기가 길었어요']);
    expect(summary.firstVisitShare).toBe(1);
  });

  it('ratings 에 이상한 값이 있어도 무시한다', () => {
    expect(readRatings({ desk_kind: 3, desk_flow: '5', nurse_kind: 9, x: 1 })).toEqual({ desk_kind: 3 });
    expect(readRatings(null)).toEqual({});
    expect(summarizeSurvey([]).nps).toBeNull();
  });
});

describe('엑셀(CSV)', () => {
  it('BOM·서울 시각·문항 열·수식 방지', () => {
    const csv = buildSurveyCsv([
      response({
        created_at: '2026-11-18T15:05:00Z',
        treatments: ['botox', 'other'],
        treatment_other: '리쥬란',
        ratings: { desk_kind: 5 },
        skipped_parts: ['skincare'],
        comment: '=HYPERLINK("x")\n좋아요, 감사',
      }),
    ]);
    expect(csv.startsWith('﻿제출 시각,')).toBe(true);
    const [header, line] = csv.slice(1).split('\r\n');
    expect(header).toContain('데스크 코디네이터: 친절하게 맞아 줌');
    expect(line.startsWith('2026-11-19 00:05,ko,처음,"보톡스, 기타",리쥬란,5,')).toBe(true);
    expect(line).toContain('피부관리사');
    expect(line).toContain(`"'=HYPERLINK(""x"")\n좋아요, 감사"`);
  });
});
