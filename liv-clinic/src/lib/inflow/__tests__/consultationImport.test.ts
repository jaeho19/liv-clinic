import { describe, expect, test } from 'vitest';
import {
  buildInflowLeadFromConsultation,
  kstDateOf,
  originFromLocale,
  resolveLocale,
  FORM_TYPE_DETAILS,
} from '../consultationImport';

const LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar'] as const;

describe('kstDateOf — UTC → KST(UTC+9) 날짜', () => {
  test('UTC 저녁은 KST 다음날이 된다', () => {
    expect(kstDateOf('2026-08-18T16:30:00.000Z')).toBe('2026-08-19');
  });

  test('UTC 오전은 같은 날', () => {
    expect(kstDateOf('2026-08-18T02:00:00.000Z')).toBe('2026-08-18');
  });

  test('KST 자정 경계(15:00Z)', () => {
    expect(kstDateOf('2026-08-17T15:00:00.000Z')).toBe('2026-08-18');
  });
});

describe('originFromLocale — 페이지 언어 → 국내/해외', () => {
  test('ko는 국내, 그 외 지원 로케일은 해외', () => {
    expect(originFromLocale('ko')).toBe('domestic');
    expect(originFromLocale('zh')).toBe('foreign');
    expect(originFromLocale('en')).toBe('foreign');
  });

  test('로케일을 모르면 null(미분류 — 추정 금지)', () => {
    expect(originFromLocale(null)).toBeNull();
    expect(originFromLocale('xx')).toBeNull();
  });
});

describe('resolveLocale — 경로 후보들에서 로케일 추출', () => {
  test('첫 번째로 매칭되는 경로의 로케일을 쓴다', () => {
    expect(resolveLocale(['/ko/events/promo'], LOCALES)).toBe('ko');
    expect(resolveLocale([null, '/zh'], LOCALES)).toBe('zh');
  });

  test('로케일 경로가 아니면 null', () => {
    expect(resolveLocale(['/admin/inflow', 'website'], LOCALES)).toBeNull();
    expect(resolveLocale([], LOCALES)).toBeNull();
  });
});

describe('buildInflowLeadFromConsultation — 상담 → 유입 리드 매핑', () => {
  const base = {
    id: 'c-1',
    name: '테스트',
    phone: '01012345678',
    email: 'a@b.c',
    treatment_type: '울쎄라피 프라임',
    source: '/ko/events/promo',
    created_at: '2026-08-18T02:00:00.000Z',
  };

  test('핵심 필드 매핑 (문의 수단=website, 유입 경로=homepage/폼 유형)', () => {
    const lead = buildInflowLeadFromConsultation(base, { formType: 'quick', locale: 'ko' });
    expect(lead).toMatchObject({
      contact_date: '2026-08-18',
      channel: 'website',
      channel_category: 'homepage',
      channel_detail: FORM_TYPE_DETAILS.quick,
      patient_origin: 'domestic',
      name: '테스트',
      phone: '01012345678',
      treatment: '울쎄라피 프라임',
      consultation_id: 'c-1',
      is_returning: false,
    });
  });

  test('확실한 시술명만 태그로 변환한다', () => {
    expect(buildInflowLeadFromConsultation(base, { formType: 'quick', locale: 'ko' }).treatment_tags).toEqual(['ulthera']);
    expect(
      buildInflowLeadFromConsultation({ ...base, treatment_type: '빠른 상담' }, { formType: 'quick', locale: 'ko' })
        .treatment_tags
    ).toEqual([]);
  });

  test('비고에 자동 연동 표식·경로·이메일이 남는다', () => {
    const lead = buildInflowLeadFromConsultation(base, { formType: 'quick', locale: 'ko' });
    expect(lead.note).toContain('자동 연동');
    expect(lead.note).toContain('/ko/events/promo');
    expect(lead.note).toContain('a@b.c');
  });

  test('폼 식별자 문자열은 경로로 취급하지 않는다', () => {
    const lead = buildInflowLeadFromConsultation(
      { ...base, source: 'consultation-form', email: null },
      { formType: 'consultation', locale: null }
    );
    expect(lead.note).not.toContain('consultation-form');
    expect(lead.patient_origin).toBeNull();
  });

  test('캠페인 매칭 결과를 그대로 싣는다', () => {
    expect(
      buildInflowLeadFromConsultation(base, { formType: 'contact', locale: 'zh', campaignId: 'camp-9' }).campaign_id
    ).toBe('camp-9');
  });
});
