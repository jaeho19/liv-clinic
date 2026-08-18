/**
 * 유입 리드 집계 (전량 클라이언트 집계 — /admin/inflow 현행 패턴 유지).
 *
 * 날짜 기준 두 가지를 의도적으로 병행한다:
 * - KPI/추이/퍼널: **발생일 기준** — 각 이벤트(연락·예약·내원·결제)가 기간 안에
 *   발생한 건수. 기존 통계 탭과 동일한 산식이라 숫자 연속성이 유지된다.
 * - 그룹 비교(채널·시술·캠페인 등): **연락일 기준 코호트** — 기간 내 연락한 리드가
 *   이후 어디까지 전환됐는지. 채널 성과 비교는 이 방식이 맞다.
 * 화면 캡션에 어느 기준인지 반드시 표기할 것.
 */
import { LEAD_STAGES, getLeadStage, type LeadStage } from './taxonomy';

export interface StatsLead {
  contact_date: string;
  channel: string;
  agency: string | null;
  is_returning: boolean;
  reserved: boolean;
  reserved_date: string | null;
  visited: boolean;
  visited_date: string | null;
  paid: boolean;
  paid_date: string | null;
  paid_amount_krw: number | null;
  outcome: string | null;
  patient_origin: string | null;
  channel_category: string | null;
  channel_detail: string | null;
  treatment_tags: string[];
  manager: string | null;
  campaign_id: string | null;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface DimensionFilter {
  origin?: 'domestic' | 'foreign' | 'unclassified';
  channelCategory?: string; // ChannelCategory 또는 'unclassified'
  channelDetail?: string;
  treatmentTag?: string;
  stage?: LeadStage;
  outcome?: 'cancelled' | 'no_show' | 'none';
  manager?: string;
  paid?: boolean;
  campaignId?: string;
  isReturning?: boolean;
}

function inRange(dateStr: string | null, range: DateRange): boolean {
  if (!dateStr) return false;
  return dateStr >= range.from && dateStr <= range.to;
}

export function applyDimensionFilters(leads: StatsLead[], f: DimensionFilter): StatsLead[] {
  return leads.filter((l) => {
    if (f.origin) {
      if (f.origin === 'unclassified') {
        if (l.patient_origin) return false;
      } else if (l.patient_origin !== f.origin) return false;
    }
    if (f.channelCategory) {
      if (f.channelCategory === 'unclassified') {
        if (l.channel_category) return false;
      } else if (l.channel_category !== f.channelCategory) return false;
    }
    if (f.channelDetail && l.channel_detail !== f.channelDetail) return false;
    if (f.treatmentTag && !l.treatment_tags.includes(f.treatmentTag)) return false;
    if (f.stage && getLeadStage(l) !== f.stage) return false;
    if (f.outcome) {
      if (f.outcome === 'none') {
        if (l.outcome) return false;
      } else if (l.outcome !== f.outcome) return false;
    }
    if (f.manager && l.manager !== f.manager) return false;
    if (f.paid !== undefined && l.paid !== f.paid) return false;
    if (f.campaignId && l.campaign_id !== f.campaignId) return false;
    if (f.isReturning !== undefined && l.is_returning !== f.isReturning) return false;
    return true;
  });
}

/** 상세 목록·그룹 집계용 — 연락일 기준 절단 */
export function filterByContactDate(leads: StatsLead[], range: DateRange): StatsLead[] {
  return leads.filter((l) => inRange(l.contact_date, range));
}

// ─── KPI (발생일 기준) ──────────────────────────────
export interface KpiSummary {
  contacts: number;
  reserved: number;
  visited: number;
  paidCount: number;
  /** 기간 내 결제 건 중 금액이 입력된 것만 합산 (미입력은 0으로 치지 않는다) */
  revenueKrw: number;
  /** 금액 미입력 결제 건수 — 캡션 "금액 미입력 N건" 표기용 */
  paidWithoutAmount: number;
  cancelled: number;
  noShow: number;
  /** % (0~100). 분모 0이면 null → 화면에 '–' */
  contactToReserveRate: number | null;
  reserveToVisitRate: number | null;
  visitToPaidRate: number | null;
}

export function computeKpis(leads: StatsLead[], range: DateRange): KpiSummary {
  let contacts = 0;
  let reserved = 0;
  let visited = 0;
  let paidCount = 0;
  let revenueKrw = 0;
  let paidWithoutAmount = 0;
  let cancelled = 0;
  let noShow = 0;

  for (const l of leads) {
    const contactIn = inRange(l.contact_date, range);
    if (contactIn) {
      contacts++;
      if (l.outcome === 'cancelled') cancelled++;
      if (l.outcome === 'no_show') noShow++;
    }
    if (l.reserved && inRange(l.reserved_date, range)) reserved++;
    if (l.visited && inRange(l.visited_date, range)) visited++;
    if (l.paid && inRange(l.paid_date, range)) {
      paidCount++;
      if (l.paid_amount_krw != null) revenueKrw += l.paid_amount_krw;
      else paidWithoutAmount++;
    }
  }

  const rate = (num: number, den: number): number | null => (den > 0 ? (num / den) * 100 : null);
  return {
    contacts,
    reserved,
    visited,
    paidCount,
    revenueKrw,
    paidWithoutAmount,
    cancelled,
    noShow,
    contactToReserveRate: rate(reserved, contacts),
    reserveToVisitRate: rate(visited, reserved),
    visitToPaidRate: rate(paidCount, visited),
  };
}

// ─── 기간 버킷 ──────────────────────────────────────
export type Granularity = 'day' | 'week' | 'month';

function toDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function bucketKey(dateStr: string, g: Granularity): string {
  if (g === 'day') return dateStr;
  if (g === 'month') return dateStr.slice(0, 7);
  const d = toDate(dateStr);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 그 주 월요일
  return fmt(d);
}

export interface TrendPoint {
  key: string;
  contact: number;
  reserved: number;
  visited: number;
  paid: number;
}

/** 발생일 기준 추이. 기간 내 빈 버킷도 0으로 채운다(공백이 보여야 정직한 추이) */
export function computeTrend(leads: StatsLead[], range: DateRange, g: Granularity): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  const cursor = toDate(range.from);
  const end = toDate(range.to);
  while (cursor <= end) {
    const key = bucketKey(fmt(cursor), g);
    if (!buckets.has(key)) buckets.set(key, { key, contact: 0, reserved: 0, visited: 0, paid: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  const bump = (dateStr: string | null, field: 'contact' | 'reserved' | 'visited' | 'paid') => {
    if (!dateStr || !inRange(dateStr, range)) return;
    const b = buckets.get(bucketKey(dateStr, g));
    if (b) b[field]++;
  };
  for (const l of leads) {
    bump(l.contact_date, 'contact');
    if (l.reserved) bump(l.reserved_date, 'reserved');
    if (l.visited) bump(l.visited_date, 'visited');
    if (l.paid) bump(l.paid_date, 'paid');
  }
  return Array.from(buckets.values());
}

// ─── 그룹 비교 (연락일 기준 코호트) ───────────────────
export interface GroupCount {
  key: string | null;
  contacts: number;
  reserved: number;
  visited: number;
  paid: number;
  revenueKrw: number;
}

export function groupCounts(
  leads: StatsLead[],
  range: DateRange,
  keyFn: (l: StatsLead) => string | null
): GroupCount[] {
  const map = new Map<string | null, GroupCount>();
  for (const l of filterByContactDate(leads, range)) {
    const key = keyFn(l);
    let g = map.get(key);
    if (!g) {
      g = { key, contacts: 0, reserved: 0, visited: 0, paid: 0, revenueKrw: 0 };
      map.set(key, g);
    }
    g.contacts++;
    if (l.reserved) g.reserved++;
    if (l.visited) g.visited++;
    if (l.paid) {
      g.paid++;
      if (l.paid_amount_krw != null) g.revenueKrw += l.paid_amount_krw;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.contacts - a.contacts);
}

/** 시술 태그는 리드당 복수라 별도 그룹 집계 (태그 없는 리드는 null 그룹) */
export function groupByTreatmentTag(leads: StatsLead[], range: DateRange): GroupCount[] {
  const map = new Map<string | null, GroupCount>();
  const bump = (key: string | null, l: StatsLead) => {
    let g = map.get(key);
    if (!g) {
      g = { key, contacts: 0, reserved: 0, visited: 0, paid: 0, revenueKrw: 0 };
      map.set(key, g);
    }
    g.contacts++;
    if (l.reserved) g.reserved++;
    if (l.visited) g.visited++;
    if (l.paid) {
      g.paid++;
      if (l.paid_amount_krw != null) g.revenueKrw += l.paid_amount_krw;
    }
  };
  for (const l of filterByContactDate(leads, range)) {
    if (l.treatment_tags.length === 0) bump(null, l);
    else for (const tag of l.treatment_tags) bump(tag, l);
  }
  return Array.from(map.values()).sort((a, b) => b.contacts - a.contacts);
}

// ─── 퍼널 (KPI와 동일한 발생일 기준) ──────────────────
export interface FunnelStep {
  stage: LeadStage;
  count: number;
}

export function computeFunnel(leads: StatsLead[], range: DateRange): FunnelStep[] {
  const k = computeKpis(leads, range);
  const counts: Record<LeadStage, number> = {
    contact: k.contacts,
    reserved: k.reserved,
    visited: k.visited,
    paid: k.paidCount,
  };
  return LEAD_STAGES.map((stage) => ({ stage, count: counts[stage] }));
}

// ─── 캠페인 전후 비교 ───────────────────────────────
export interface WindowStat {
  from: string;
  to: string;
  count: number;
  days: number;
  perDay: number;
}

export interface BeforeAfter {
  before: WindowStat;
  during: WindowStat;
  after: WindowStat;
}

function diffDays(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86400000) + 1;
}

function shift(dateStr: string, days: number): string {
  const d = toDate(dateStr);
  d.setDate(d.getDate() + days);
  return fmt(d);
}

/** 캠페인 집행 기간과 같은 길이의 직전/직후 구간에서 신규 연락 건수를 비교 */
export function beforeAfterComparison(
  leads: StatsLead[],
  campaign: { start_date: string | null; end_date: string | null }
): BeforeAfter | null {
  if (!campaign.start_date || !campaign.end_date) return null;
  const days = diffDays(campaign.start_date, campaign.end_date);
  const windows: [keyof BeforeAfter, string, string][] = [
    ['before', shift(campaign.start_date, -days), shift(campaign.start_date, -1)],
    ['during', campaign.start_date, campaign.end_date],
    ['after', shift(campaign.end_date, 1), shift(campaign.end_date, days)],
  ];
  const out = {} as BeforeAfter;
  for (const [key, from, to] of windows) {
    const count = leads.filter((l) => l.contact_date >= from && l.contact_date <= to).length;
    out[key] = { from, to, count, days, perDay: count / days };
  }
  return out;
}

// ─── 캠페인별 광고비 지표 ────────────────────────────
export interface CampaignLike {
  id: string;
  name: string;
  spend_krw: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface CampaignPerf {
  id: string;
  name: string;
  spendKrw: number | null;
  leads: number;
  paidCount: number;
  revenueKrw: number;
  paidWithoutAmount: number;
  /** 광고비 미입력 또는 분모 0이면 null → 화면에 '데이터 없음' */
  costPerLead: number | null;
  costPerPaid: number | null;
  roas: number | null;
}

export function computeCampaignPerf(
  leads: StatsLead[],
  range: DateRange,
  campaigns: CampaignLike[]
): CampaignPerf[] {
  return campaigns.map((c) => {
    const rows = filterByContactDate(leads, range).filter((l) => l.campaign_id === c.id);
    const paidRows = rows.filter((l) => l.paid);
    const revenueKrw = paidRows.reduce((s, l) => s + (l.paid_amount_krw ?? 0), 0);
    const paidWithoutAmount = paidRows.filter((l) => l.paid_amount_krw == null).length;
    const spend = c.spend_krw;
    return {
      id: c.id,
      name: c.name,
      spendKrw: spend,
      leads: rows.length,
      paidCount: paidRows.length,
      revenueKrw,
      paidWithoutAmount,
      costPerLead: spend != null && rows.length > 0 ? spend / rows.length : null,
      costPerPaid: spend != null && paidRows.length > 0 ? spend / paidRows.length : null,
      roas: spend != null && spend > 0 ? revenueKrw / spend : null,
    };
  });
}

// ─── 비교 카드 상위 제외 (UI 토글용) ──────────────────
export interface TopSplit<T> {
  excluded: T[];
  visible: T[];
}

/**
 * contacts 상위 excludeTop개를 분리한다. 두 배열 모두 contacts 내림차순
 * (동률은 입력 순서 유지 — Array.sort 안정성), 입력 배열은 변형하지 않는다.
 * excludeTop이 음수면 0, 행 수 초과면 전부 excluded.
 */
export function splitTopGroups<T extends { contacts: number }>(
  rows: T[],
  excludeTop: number
): TopSplit<T> {
  const n = Math.max(0, Math.min(Math.trunc(excludeTop), rows.length));
  const sorted = [...rows].sort((a, b) => b.contacts - a.contacts);
  return { excluded: sorted.slice(0, n), visible: sorted.slice(n) };
}
