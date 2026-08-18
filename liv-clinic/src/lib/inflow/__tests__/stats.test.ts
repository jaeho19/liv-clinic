import { describe, expect, test } from 'vitest';
import {
  applyDimensionFilters,
  filterByContactDate,
  computeKpis,
  computeTrend,
  bucketKey,
  groupCounts,
  computeFunnel,
  beforeAfterComparison,
  computeCampaignPerf,
  splitTopGroups,
} from '../stats';
import type { StatsLead } from '../stats';

function make(partial: Partial<StatsLead>): StatsLead {
  return {
    contact_date: '2026-08-01',
    channel: 'kakao',
    agency: null,
    is_returning: false,
    reserved: false,
    reserved_date: null,
    visited: false,
    visited_date: null,
    paid: false,
    paid_date: null,
    paid_amount_krw: null,
    outcome: null,
    patient_origin: null,
    channel_category: null,
    channel_detail: null,
    treatment_tags: [],
    manager: null,
    campaign_id: null,
    ...partial,
  };
}

const RANGE = { from: '2026-08-01', to: '2026-08-31' };

describe('applyDimensionFilters', () => {
  test('국내/해외 필터 — unclassified는 NULL만 잡는다', () => {
    const rows = [
      make({ patient_origin: 'domestic' }),
      make({ patient_origin: 'foreign' }),
      make({ patient_origin: null }),
    ];
    expect(applyDimensionFilters(rows, { origin: 'domestic' })).toHaveLength(1);
    expect(applyDimensionFilters(rows, { origin: 'unclassified' })).toHaveLength(1);
    expect(applyDimensionFilters(rows, {})).toHaveLength(3);
  });

  test('채널 대분류·세부 채널 필터', () => {
    const rows = [
      make({ channel_category: 'app', channel_detail: '바비톡' }),
      make({ channel_category: 'app', channel_detail: '강남언니' }),
      make({ channel_category: null }),
    ];
    expect(applyDimensionFilters(rows, { channelCategory: 'app' })).toHaveLength(2);
    expect(applyDimensionFilters(rows, { channelCategory: 'app', channelDetail: '바비톡' })).toHaveLength(1);
    expect(applyDimensionFilters(rows, { channelCategory: 'unclassified' })).toHaveLength(1);
  });

  test('시술 태그·단계·결제·취소노쇼·담당자 필터', () => {
    const rows = [
      make({ treatment_tags: ['aptos'], reserved: true, manager: '김실장' }),
      make({ treatment_tags: ['botox'], reserved: true, visited: true, paid: true, paid_amount_krw: 500000 }),
      make({ outcome: 'no_show', reserved: true }),
    ];
    expect(applyDimensionFilters(rows, { treatmentTag: 'aptos' })).toHaveLength(1);
    expect(applyDimensionFilters(rows, { stage: 'paid' })).toHaveLength(1);
    expect(applyDimensionFilters(rows, { stage: 'reserved' })).toHaveLength(2);
    expect(applyDimensionFilters(rows, { paid: true })).toHaveLength(1);
    expect(applyDimensionFilters(rows, { outcome: 'no_show' })).toHaveLength(1);
    expect(applyDimensionFilters(rows, { outcome: 'none' })).toHaveLength(2);
    expect(applyDimensionFilters(rows, { manager: '김실장' })).toHaveLength(1);
  });
});

describe('computeKpis — 발생일 기준 집계', () => {
  test('각 지표는 해당 이벤트 날짜가 기간 안에 있을 때만 센다', () => {
    const rows = [
      make({ contact_date: '2026-08-05', reserved: true, reserved_date: '2026-08-07' }),
      // 7월에 연락했지만 8월에 내원 → visited만 잡힘
      make({ contact_date: '2026-07-20', visited: true, visited_date: '2026-08-02' }),
      // 9월 연락 → 아무것도 안 잡힘
      make({ contact_date: '2026-09-01' }),
    ];
    const k = computeKpis(rows, RANGE);
    expect(k.contacts).toBe(1);
    expect(k.reserved).toBe(1);
    expect(k.visited).toBe(1);
  });

  test('전환율은 분모가 0이면 null(– 표기용)', () => {
    const k = computeKpis([], RANGE);
    expect(k.contactToReserveRate).toBeNull();
    expect(k.reserveToVisitRate).toBeNull();
    expect(k.visitToPaidRate).toBeNull();
  });

  test('결제 금액은 입력된 값만 합산하고 미입력 건수를 별도로 센다', () => {
    const rows = [
      make({ paid: true, paid_date: '2026-08-10', paid_amount_krw: 1200000 }),
      make({ paid: true, paid_date: '2026-08-11', paid_amount_krw: null }),
    ];
    const k = computeKpis(rows, RANGE);
    expect(k.paidCount).toBe(2);
    expect(k.revenueKrw).toBe(1200000);
    expect(k.paidWithoutAmount).toBe(1);
  });

  test('취소·노쇼는 연락일 기준 기간 내 행에서 센다', () => {
    const rows = [
      make({ contact_date: '2026-08-03', outcome: 'cancelled' }),
      make({ contact_date: '2026-08-04', outcome: 'no_show' }),
      make({ contact_date: '2026-07-01', outcome: 'cancelled' }),
    ];
    const k = computeKpis(rows, RANGE);
    expect(k.cancelled).toBe(1);
    expect(k.noShow).toBe(1);
  });
});

describe('bucketKey / computeTrend', () => {
  test('bucketKey: 일=그대로, 주=월요일 시작일, 월=YYYY-MM', () => {
    expect(bucketKey('2026-08-13', 'day')).toBe('2026-08-13'); // 목요일
    expect(bucketKey('2026-08-13', 'week')).toBe('2026-08-10'); // 그 주 월요일
    expect(bucketKey('2026-08-13', 'month')).toBe('2026-08');
  });

  test('일 단위 추이는 빈 날짜도 0으로 채운다', () => {
    const rows = [
      make({ contact_date: '2026-08-01' }),
      make({ contact_date: '2026-08-03', reserved: true, reserved_date: '2026-08-03' }),
    ];
    const t = computeTrend(rows, { from: '2026-08-01', to: '2026-08-03' }, 'day');
    expect(t.map((p) => p.key)).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
    expect(t[0].contact).toBe(1);
    expect(t[1].contact).toBe(0);
    expect(t[2].reserved).toBe(1);
  });

  test('이벤트는 자기 발생일 버킷에 들어간다(연락일 아님)', () => {
    const rows = [
      make({ contact_date: '2026-08-01', paid: true, paid_date: '2026-08-03', paid_amount_krw: 100 }),
    ];
    const t = computeTrend(rows, { from: '2026-08-01', to: '2026-08-03' }, 'day');
    expect(t[0].paid).toBe(0);
    expect(t[2].paid).toBe(1);
  });
});

describe('groupCounts — 연락일 기준 코호트 그룹 집계', () => {
  test('채널 대분류별 유입·성과(코호트)', () => {
    const rows = [
      make({ channel_category: 'app', visited: true, paid: true, paid_amount_krw: 300000 }),
      make({ channel_category: 'app' }),
      make({ channel_category: null }),
      make({ contact_date: '2026-07-01', channel_category: 'app' }), // 기간 밖
    ];
    const g = groupCounts(rows, RANGE, (l) => l.channel_category);
    const app = g.find((x) => x.key === 'app');
    const un = g.find((x) => x.key === null);
    expect(app).toMatchObject({ contacts: 2, visited: 1, paid: 1, revenueKrw: 300000 });
    expect(un?.contacts).toBe(1);
  });
});

describe('computeFunnel', () => {
  test('KPI와 동일한 발생일 기준 카운트를 단계 순서로 반환', () => {
    const rows = [
      make({ contact_date: '2026-08-01', reserved: true, reserved_date: '2026-08-02', visited: true, visited_date: '2026-08-05' }),
    ];
    const f = computeFunnel(rows, RANGE);
    expect(f.map((s) => s.stage)).toEqual(['contact', 'reserved', 'visited', 'paid']);
    expect(f.map((s) => s.count)).toEqual([1, 1, 1, 0]);
  });
});

describe('beforeAfterComparison — 캠페인 전후 비교', () => {
  test('기간별 일평균 연락 건수를 계산한다', () => {
    const rows = [
      make({ contact_date: '2026-08-04' }), // 이전 (08-01~08-10 이전 10일)
      make({ contact_date: '2026-08-12' }),
      make({ contact_date: '2026-08-13' }), // 집행 중 (08-11~08-20)
      make({ contact_date: '2026-08-25' }), // 이후
    ];
    const c = beforeAfterComparison(rows, { start_date: '2026-08-11', end_date: '2026-08-20' })!;
    expect(c.during.count).toBe(2);
    expect(c.during.days).toBe(10);
    expect(c.before.count).toBe(1);
    expect(c.before.days).toBe(10);
    expect(c.after.count).toBe(1);
    expect(c.during.perDay).toBeCloseTo(0.2);
  });

  test('기간 정보가 없으면 null', () => {
    expect(beforeAfterComparison([], { start_date: null, end_date: null })).toBeNull();
  });
});

describe('computeCampaignPerf — 광고비 지표', () => {
  const campaigns = [
    { id: 'c1', name: '바비톡 8월', spend_krw: 1000000, start_date: '2026-08-01', end_date: '2026-08-31' },
    { id: 'c2', name: '무광고비', spend_krw: null, start_date: null, end_date: null },
  ];

  test('광고비가 있으면 CPL·CAC·ROAS를 계산한다', () => {
    const rows = [
      make({ campaign_id: 'c1', paid: true, paid_date: '2026-08-15', paid_amount_krw: 2500000 }),
      make({ campaign_id: 'c1' }),
    ];
    const perf = computeCampaignPerf(rows, RANGE, campaigns);
    const c1 = perf.find((p) => p.id === 'c1')!;
    expect(c1.leads).toBe(2);
    expect(c1.costPerLead).toBe(500000);
    expect(c1.costPerPaid).toBe(1000000);
    expect(c1.roas).toBeCloseTo(2.5);
  });

  test('광고비가 없으면 지표는 null("데이터 없음" — 0 아님)', () => {
    const rows = [make({ campaign_id: 'c2' })];
    const perf = computeCampaignPerf(rows, RANGE, campaigns);
    const c2 = perf.find((p) => p.id === 'c2')!;
    expect(c2.leads).toBe(1);
    expect(c2.costPerLead).toBeNull();
    expect(c2.roas).toBeNull();
  });

  test('리드가 0이어도 0으로 나누지 않는다', () => {
    const perf = computeCampaignPerf([], RANGE, campaigns);
    expect(perf.find((p) => p.id === 'c1')!.costPerLead).toBeNull();
  });
});

describe('filterByContactDate', () => {
  test('상세 목록용 — 연락일 기준으로 자른다', () => {
    const rows = [make({ contact_date: '2026-08-01' }), make({ contact_date: '2026-07-31' })];
    expect(filterByContactDate(rows, RANGE)).toHaveLength(1);
  });
});

describe('splitTopGroups — 비교 카드 상위 제외', () => {
  const rows = (ns: number[]) => ns.map((n, i) => ({ contacts: n, id: i }));

  test('excludeTop 0 이하면 전부 visible (정렬만 적용)', () => {
    const r = rows([5, 3, 1]);
    expect(splitTopGroups(r, 0)).toEqual({ excluded: [], visible: r });
    expect(splitTopGroups(r, -1)).toEqual({ excluded: [], visible: r });
  });

  test('contacts 상위부터 제외한다 (미정렬 입력 포함)', () => {
    const s = splitTopGroups(rows([3, 10, 7, 1]), 2);
    expect(s.excluded.map((x) => x.contacts)).toEqual([10, 7]);
    expect(s.visible.map((x) => x.contacts)).toEqual([3, 1]);
  });

  test('동률은 입력 순서를 유지한다(안정 분리)', () => {
    const r = [
      { contacts: 5, id: 'a' },
      { contacts: 5, id: 'b' },
      { contacts: 2, id: 'c' },
    ];
    const s = splitTopGroups(r, 1);
    expect(s.excluded.map((x) => x.id)).toEqual(['a']);
    expect(s.visible.map((x) => x.id)).toEqual(['b', 'c']);
  });

  test('행 수 이상을 제외하면 전부 excluded', () => {
    const s = splitTopGroups(rows([2, 1]), 5);
    expect(s.visible).toEqual([]);
    expect(s.excluded.map((x) => x.contacts)).toEqual([2, 1]);
  });

  test('입력 배열을 변형하지 않는다', () => {
    const r = rows([1, 9, 4]);
    const copy = r.map((x) => ({ ...x }));
    splitTopGroups(r, 1);
    expect(r).toEqual(copy);
  });
});
