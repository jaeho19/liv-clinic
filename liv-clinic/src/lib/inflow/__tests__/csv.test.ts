import { describe, expect, test } from 'vitest';
import { buildCsv, buildLeadsCsv, LEADS_CSV_HEADERS } from '../csv';

describe('buildCsv', () => {
  test('BOM으로 시작하고 모든 셀을 따옴표로 감싼다', () => {
    const csv = buildCsv([{ a: '1' }], [{ header: 'A', value: (r) => r.a }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"A"');
    expect(csv).toContain('"1"');
  });

  test('셀 안의 따옴표는 ""로 이스케이프한다', () => {
    const csv = buildCsv([{ memo: '그는 "OK"라 함' }], [{ header: '비고', value: (r) => r.memo }]);
    expect(csv).toContain('"그는 ""OK""라 함"');
  });

  test('null/undefined는 빈 셀', () => {
    const csv = buildCsv([{ v: null as string | null }], [{ header: 'V', value: (r) => r.v }]);
    expect(csv.split('\n')[1]).toBe('""');
  });
});

describe('buildLeadsCsv — 신규 표준화 컬럼 포함', () => {
  const lead = {
    contact_date: '2026-08-01',
    channel: 'wechat',
    agency: '바이올렛',
    is_returning: false,
    name: '테스트',
    wechat_id: 'w1',
    kakao_id: null,
    phone: null,
    treatment: '울쎄라',
    reserved: true,
    reserved_date: '2026-08-02',
    visited: false,
    visited_date: null,
    note: null,
    patient_origin: 'foreign',
    channel_category: 'foreign_agency',
    channel_detail: '바이올렛',
    treatment_tags: ['ulthera', 'botox'],
    paid: true,
    paid_date: '2026-08-03',
    paid_amount_krw: 1500000,
    outcome: null,
    manager: '김실장',
  };

  test('헤더에 국내외·유입경로·시술태그·결제·담당자 컬럼이 있다', () => {
    for (const h of ['국내/해외', '유입 대분류', '세부 채널', '시술 태그', '결제', '결제일', '결제금액(원)', '취소/노쇼', '담당자', '현재 단계']) {
      expect(LEADS_CSV_HEADERS).toContain(h);
    }
  });

  test('시술 태그는 한글 라벨을 |로 잇고, 미분류/미입력은 빈 셀', () => {
    const csv = buildLeadsCsv([lead]);
    expect(csv).toContain('"울쎄라|보톡스"');
    expect(csv).toContain('"해외"');
    expect(csv).toContain('"1500000"');
  });

  test('결제금액 미입력은 0이 아니라 빈 셀이다', () => {
    const csv = buildLeadsCsv([{ ...lead, paid_amount_krw: null }]);
    const line = csv.split('\n')[1];
    expect(line).not.toContain('"0"');
  });
});
