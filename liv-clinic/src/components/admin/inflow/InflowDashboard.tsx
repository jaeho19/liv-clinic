'use client';

/**
 * 유입 통계 대시보드 탭 — 기존 '통계' 탭의 상위 호환.
 * 기존 지표(신규 연락/예약/내원, 퍼널, 채널 비교, 일자 추세)를 유지하면서
 * 결제·전환율·취소노쇼 KPI, 표준화 축(국내외/유입경로/시술태그) 필터·차트,
 * 캠페인 광고비 지표(CPL/CAC/ROAS — 광고비 없으면 '데이터 없음'), 상세 목록을 더한다.
 * 집계는 전량 클라이언트(현행 패턴 유지). 개인 식별정보는 상세 목록·CSV에만 나온다.
 */
import { useMemo, useState } from 'react';
import {
  getInflowChannelLabel,
  type InflowLeadRow,
  type LeadContentLinkRow,
  type MarketingCampaignRow,
  type MarketingContentRow,
} from '@/types/admin';
import {
  CHANNEL_CATEGORIES,
  CHANNEL_CATEGORY_COLORS,
  CHANNEL_CATEGORY_LABELS,
  LEAD_OUTCOME_LABELS,
  LEAD_STAGES,
  LEAD_STAGE_HEX,
  LEAD_STAGE_LABELS,
  PATIENT_ORIGIN_HEX,
  PATIENT_ORIGIN_LABELS,
  TREATMENT_TAGS,
  TREATMENT_TAG_LABELS,
  getChannelCategoryLabel,
  getLeadStage,
  getMissingFields,
  getPatientOriginLabel,
  getTreatmentTagLabel,
  type LeadStage,
} from '@/lib/inflow/taxonomy';
import {
  applyDimensionFilters,
  beforeAfterComparison,
  computeCampaignPerf,
  computeKpis,
  computeTrend,
  groupByTreatmentTag,
  groupCounts,
  type DimensionFilter,
  type Granularity,
  type StatsLead,
} from '@/lib/inflow/stats';
import { buildLeadsCsv } from '@/lib/inflow/csv';

const INPUT_CLS =
  'h-9 px-2.5 text-sm border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d] bg-white';

type StatsLeadWithId = StatsLead & { id: string };

function toStatsLead(l: InflowLeadRow): StatsLeadWithId {
  return {
    id: l.id,
    contact_date: l.contact_date,
    channel: l.channel,
    agency: l.agency,
    is_returning: l.is_returning,
    reserved: l.reserved,
    reserved_date: l.reserved_date,
    visited: l.visited,
    visited_date: l.visited_date,
    paid: l.paid ?? false,
    paid_date: l.paid_date ?? null,
    paid_amount_krw: l.paid_amount_krw ?? null,
    outcome: l.outcome ?? null,
    patient_origin: l.patient_origin ?? null,
    channel_category: l.channel_category ?? null,
    channel_detail: l.channel_detail ?? null,
    treatment_tags: l.treatment_tags ?? [],
    manager: l.manager ?? null,
    campaign_id: l.campaign_id ?? null,
  };
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

function formatKrw(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

function formatRate(v: number | null): string {
  return v == null ? '–' : `${v.toFixed(0)}%`;
}

const GRANULARITY_LABELS: Record<Granularity, string> = { day: '일간', week: '주간', month: '월간' };

interface Props {
  leads: InflowLeadRow[];
  campaigns: MarketingCampaignRow[];
  contents: MarketingContentRow[];
  links: LeadContentLinkRow[];
  onEdit: (lead: InflowLeadRow) => void;
}

export default function InflowDashboard({ leads, campaigns, contents, links, onEdit }: Props) {
  // ─── 필터 상태 ───
  const [from, setFrom] = useState(() => daysAgo(29));
  const [to, setTo] = useState(() => toDateStr(new Date()));
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [origin, setOrigin] = useState('');
  const [channelCategory, setChannelCategory] = useState('');
  const [channelDetail, setChannelDetail] = useState('');
  const [treatmentTag, setTreatmentTag] = useState('');
  const [stage, setStage] = useState('');
  const [outcome, setOutcome] = useState('');
  const [manager, setManager] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [contentId, setContentId] = useState('');

  const range = useMemo(() => ({ from, to }), [from, to]);

  const statsLeads = useMemo(() => leads.map(toStatsLead), [leads]);

  const managers = useMemo(
    () => Array.from(new Set(leads.map((l) => l.manager).filter(Boolean))) as string[],
    [leads]
  );
  const details = useMemo(
    () => Array.from(new Set(leads.map((l) => l.channel_detail).filter(Boolean))) as string[],
    [leads]
  );

  const dimFiltered = useMemo(() => {
    const f: DimensionFilter = {};
    if (origin) f.origin = origin as DimensionFilter['origin'];
    if (channelCategory) f.channelCategory = channelCategory;
    if (channelDetail) f.channelDetail = channelDetail;
    if (treatmentTag) f.treatmentTag = treatmentTag;
    if (stage) f.stage = stage as LeadStage;
    if (outcome) f.outcome = outcome as DimensionFilter['outcome'];
    if (manager) f.manager = manager;
    if (paidFilter) f.paid = paidFilter === 'paid';
    if (campaignId) f.campaignId = campaignId;
    let rows = applyDimensionFilters(statsLeads, f) as StatsLeadWithId[];
    if (contentId) {
      const linkedIds = new Set(links.filter((k) => k.content_id === contentId).map((k) => k.lead_id));
      rows = rows.filter((l) => linkedIds.has(l.id));
    }
    return rows;
  }, [statsLeads, origin, channelCategory, channelDetail, treatmentTag, stage, outcome, manager, paidFilter, campaignId, contentId, links]);

  const activeFilterCount = [origin, channelCategory, channelDetail, treatmentTag, stage, outcome, manager, paidFilter, campaignId, contentId].filter(Boolean).length;

  const resetFilters = () => {
    setOrigin('');
    setChannelCategory('');
    setChannelDetail('');
    setTreatmentTag('');
    setStage('');
    setOutcome('');
    setManager('');
    setPaidFilter('');
    setCampaignId('');
    setContentId('');
  };

  // ─── 집계 ───
  const kpis = useMemo(() => computeKpis(dimFiltered, range), [dimFiltered, range]);
  const trend = useMemo(() => computeTrend(dimFiltered, range, granularity), [dimFiltered, range, granularity]);
  const categoryGroups = useMemo(() => groupCounts(dimFiltered, range, (l) => l.channel_category), [dimFiltered, range]);
  const treatmentGroups = useMemo(() => groupByTreatmentTag(dimFiltered, range).slice(0, 12), [dimFiltered, range]);
  const originGroups = useMemo(() => groupCounts(dimFiltered, range, (l) => l.patient_origin), [dimFiltered, range]);
  const campaignPerf = useMemo(
    () => computeCampaignPerf(dimFiltered, range, campaigns).filter((p) => p.leads > 0 || p.spendKrw != null),
    [dimFiltered, range, campaigns]
  );

  return (
    <div>
      {/* ─── 필터 바 ─── */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={INPUT_CLS} aria-label="시작일" />
          <span className="text-xs text-[#8a8a8a]">~</span>
          <input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} className={INPUT_CLS} aria-label="종료일" />
          <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-0.5">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setFrom(daysAgo(d - 1));
                  setTo(toDateStr(new Date()));
                }}
                className="px-2.5 py-1.5 text-xs rounded-md text-[#575756] hover:bg-white cursor-pointer"
              >
                {d}일
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-0.5" role="group" aria-label="집계 단위">
            {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1.5 text-xs rounded-md cursor-pointer ${
                  granularity === g ? 'bg-white text-[#6d4e42] font-medium shadow-sm' : 'text-[#8a8a8a] hover:text-[#575756]'
                }`}
              >
                {GRANULARITY_LABELS[g]}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="text-xs text-[#b4988d] hover:underline cursor-pointer">
              필터 초기화 ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={INPUT_CLS} aria-label="국내/해외">
            <option value="">국내/해외 전체</option>
            <option value="domestic">국내</option>
            <option value="foreign">해외</option>
            <option value="unclassified">미분류</option>
          </select>
          <select value={channelCategory} onChange={(e) => { setChannelCategory(e.target.value); setChannelDetail(''); }} className={INPUT_CLS} aria-label="유입 대분류">
            <option value="">유입 경로 전체</option>
            {CHANNEL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CHANNEL_CATEGORY_LABELS[c]}</option>
            ))}
            <option value="unclassified">미분류</option>
          </select>
          <select value={channelDetail} onChange={(e) => setChannelDetail(e.target.value)} className={INPUT_CLS} aria-label="세부 채널">
            <option value="">세부 채널 전체</option>
            {details.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={treatmentTag} onChange={(e) => setTreatmentTag(e.target.value)} className={INPUT_CLS} aria-label="문의 시술">
            <option value="">문의 시술 전체</option>
            {TREATMENT_TAGS.map((t) => (
              <option key={t} value={t}>{TREATMENT_TAG_LABELS[t]}</option>
            ))}
          </select>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={INPUT_CLS} aria-label="현재 단계">
            <option value="">단계 전체</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>{LEAD_STAGE_LABELS[s]}</option>
            ))}
          </select>
          <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)} className={INPUT_CLS} aria-label="결제 여부">
            <option value="">결제 전체</option>
            <option value="paid">결제 완료</option>
            <option value="unpaid">미결제</option>
          </select>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={INPUT_CLS} aria-label="취소/노쇼">
            <option value="">취소·노쇼 전체</option>
            <option value="cancelled">취소</option>
            <option value="no_show">노쇼</option>
            <option value="none">해당 없음</option>
          </select>
          <select value={manager} onChange={(e) => setManager(e.target.value)} className={INPUT_CLS} aria-label="담당자">
            <option value="">담당자 전체</option>
            {managers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={INPUT_CLS} aria-label="캠페인">
            <option value="">캠페인 전체</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={contentId} onChange={(e) => setContentId(e.target.value)} className={INPUT_CLS} aria-label="콘텐츠">
            <option value="">콘텐츠 전체</option>
            {contents.map((c) => (
              <option key={c.id} value={c.id}>[{c.posted_at}] {c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── KPI 카드 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard label="신규 연락" value={String(kpis.contacts)} icon="📞" color="bg-blue-50 text-blue-700" />
        <KpiCard label="예약" value={String(kpis.reserved)} icon="📅" color="bg-amber-50 text-amber-700" />
        <KpiCard label="내원" value={String(kpis.visited)} icon="🏥" color="bg-emerald-50 text-emerald-700" />
        <KpiCard label="결제" value={String(kpis.paidCount)} icon="💳" color="bg-purple-50 text-purple-700" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard
          label="총 결제금액"
          value={kpis.paidCount === 0 ? '–' : formatKrw(kpis.revenueKrw)}
          sub={kpis.paidWithoutAmount > 0 ? `금액 미입력 ${kpis.paidWithoutAmount}건 제외` : undefined}
          icon="💰"
          color="bg-purple-50 text-purple-700"
          small
        />
        <KpiCard label="연락→예약" value={formatRate(kpis.contactToReserveRate)} icon="↗" color="bg-blue-50 text-blue-700" small />
        <KpiCard label="예약→내원" value={formatRate(kpis.reserveToVisitRate)} icon="↗" color="bg-amber-50 text-amber-700" small />
        <KpiCard label="내원→결제" value={formatRate(kpis.visitToPaidRate)} icon="↗" color="bg-emerald-50 text-emerald-700" small />
        <KpiCard
          label="취소·노쇼"
          value={`${kpis.cancelled} / ${kpis.noShow}`}
          sub="취소 / 노쇼 (연락일 기준)"
          icon="⚠️"
          color="bg-red-50 text-red-600"
          small
        />
      </div>

      {/* ─── 추이 ─── */}
      <TrendChart trend={trend} granularity={granularity} />

      {/* ─── 퍼널 ─── */}
      <FunnelCard kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <GroupBarCard
          title="유입 경로별 비교"
          caption="연락일 기준 코호트 · 괄호는 (내원·결제)"
          rows={categoryGroups.map((g) => ({
            key: g.key,
            label: getChannelCategoryLabel(g.key),
            badgeClass: g.key ? CHANNEL_CATEGORY_COLORS[g.key as keyof typeof CHANNEL_CATEGORY_COLORS] ?? 'bg-gray-400' : 'bg-gray-300',
            contacts: g.contacts,
            visited: g.visited,
            paid: g.paid,
          }))}
        />
        <GroupBarCard
          title="시술별 문의 비교"
          caption="연락일 기준 코호트 · 태그 복수 선택 시 중복 집계 · 괄호는 (내원·결제)"
          rows={treatmentGroups.map((g) => ({
            key: g.key,
            label: g.key ? getTreatmentTagLabel(g.key) : '태그 없음',
            badgeClass: g.key ? 'bg-[#b4988d]' : 'bg-gray-300',
            contacts: g.contacts,
            visited: g.visited,
            paid: g.paid,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <OriginCard groups={originGroups} />
        <CampaignBeforeAfterCard campaigns={campaigns} statsLeads={statsLeads} />
      </div>

      {/* ─── 캠페인 광고비 지표 ─── */}
      <CampaignPerfCard perf={campaignPerf} hasCampaigns={campaigns.length > 0} />

      {/* ─── 상세 목록 ─── */}
      <DetailTable
        leads={leads}
        allowedIds={useMemo(() => new Set(dimFiltered.map((l) => l.id)), [dimFiltered])}
        range={range}
        onEdit={onEdit}
      />
    </div>
  );
}

// ─── KPI 카드 ───────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 lg:p-5 border border-[#e5e5e5]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{icon}</span>
        <p className="text-xs lg:text-sm text-[#8a8a8a]">{label}</p>
      </div>
      <p className={`${small ? 'text-lg' : 'text-2xl'} font-bold ${color} inline-block px-2 py-0.5 rounded-lg`}>{value}</p>
      {sub && <p className="text-[11px] text-[#8a8a8a] mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── 추이 차트 (발생일 기준 4계열) ─────────────────────
function TrendChart({ trend, granularity }: { trend: { key: string; contact: number; reserved: number; visited: number; paid: number }[]; granularity: Granularity }) {
  const max = Math.max(...trend.map((d) => Math.max(d.contact, d.reserved, d.visited, d.paid)), 1);
  const labelEvery = trend.length <= 12 ? 1 : trend.length <= 35 ? 5 : 10;
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="font-bold text-sm text-[#6d4e42]">기간별 추이</h3>
        <div className="flex items-center gap-3 text-xs">
          {LEAD_STAGES.map((s) => (
            <span key={s} className="flex items-center gap-1 text-[#575756]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LEAD_STAGE_HEX[s] }} />
              {LEAD_STAGE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[#8a8a8a] mb-4">각 이벤트 발생일 기준 ({GRANULARITY_LABELS[granularity]})</p>
      {trend.every((d) => d.contact + d.reserved + d.visited + d.paid === 0) ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">기간 내 데이터가 없습니다.</p>
      ) : (
        <>
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {trend.map((d) => (
              <div key={d.key} className="flex-1 min-w-[20px] flex flex-col items-center h-full justify-end group relative">
                <div className="w-full flex items-end justify-center gap-px h-full">
                  {LEAD_STAGES.map((s) => {
                    const v = d[s === 'contact' ? 'contact' : s] as number;
                    return (
                      <div
                        key={s}
                        className="w-1/4 rounded-t-sm min-h-[2px]"
                        style={{ height: `${(v / max) * 100}%`, backgroundColor: LEAD_STAGE_HEX[s], opacity: v === 0 ? 0.15 : 1 }}
                      />
                    );
                  })}
                </div>
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#6d4e42] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  <p className="font-medium">{d.key}</p>
                  <p>
                    연락 {d.contact} / 예약 {d.reserved} / 내원 {d.visited} / 결제 {d.paid}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1 overflow-x-auto">
            {trend.map((d, i) => (
              <div key={d.key} className="flex-1 min-w-[20px] text-center">
                {i % labelEvery === 0 && <span className="text-[9px] text-[#8a8a8a]">{d.key.slice(5)}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 퍼널 ───────────────────────────────────────────
function FunnelCard({ kpis }: { kpis: ReturnType<typeof computeKpis> }) {
  const counts: Record<LeadStage, number> = {
    contact: kpis.contacts,
    reserved: kpis.reserved,
    visited: kpis.visited,
    paid: kpis.paidCount,
  };
  const rates: Partial<Record<LeadStage, number | null>> = {
    reserved: kpis.contactToReserveRate,
    visited: kpis.reserveToVisitRate,
    paid: kpis.visitToPaidRate,
  };
  const max = Math.max(kpis.contacts, 1);
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-1">전환 퍼널</h3>
      <p className="text-[11px] text-[#8a8a8a] mb-4">발생일 기준 · 괄호는 직전 단계 대비 전환율</p>
      <div className="space-y-3">
        {LEAD_STAGES.map((s) => (
          <div key={s}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#575756]">{LEAD_STAGE_LABELS[s]}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#6d4e42]">{counts[s]}</span>
                {rates[s] !== undefined && (
                  <span className="text-xs text-[#8a8a8a]">({formatRate(rates[s] ?? null)})</span>
                )}
              </div>
            </div>
            <div className="w-full bg-[#f0f0f0] rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${(counts[s] / max) * 100}%`, backgroundColor: LEAD_STAGE_HEX[s] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 그룹 막대 카드 (유입 경로/시술) ───────────────────
function GroupBarCard({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: { key: string | null; label: string; badgeClass: string; contacts: number; visited: number; paid: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.contacts), 1);
  const total = rows.reduce((s, r) => s + r.contacts, 0);
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-1">{title}</h3>
      <p className="text-[11px] text-[#8a8a8a] mb-4">{caption}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">기간 내 데이터가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const pct = total > 0 ? Math.round((r.contacts / total) * 100) : 0;
            return (
              <div key={r.key ?? '(미분류)'}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#575756]">{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#6d4e42]">{r.contacts}</span>
                    <span className="text-xs text-[#8a8a8a]">
                      {pct}% ({r.visited}·{r.paid})
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#f0f0f0] rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${r.badgeClass}`} style={{ width: `${(r.contacts / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 국내/해외 비율 ──────────────────────────────────
function OriginCard({ groups }: { groups: { key: string | null; contacts: number }[] }) {
  const total = groups.reduce((s, g) => s + g.contacts, 0);
  const seg = (key: string | null) => groups.find((g) => g.key === key)?.contacts ?? 0;
  const parts = [
    { label: PATIENT_ORIGIN_LABELS.domestic, value: seg('domestic'), color: PATIENT_ORIGIN_HEX.domestic },
    { label: PATIENT_ORIGIN_LABELS.foreign, value: seg('foreign'), color: PATIENT_ORIGIN_HEX.foreign },
    { label: '미분류', value: seg(null), color: '#d1d5db' },
  ];
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-1">국내·해외 환자 비율</h3>
      <p className="text-[11px] text-[#8a8a8a] mb-4">연락일 기준 코호트</p>
      {total === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">기간 내 데이터가 없습니다.</p>
      ) : (
        <>
          <div className="flex w-full h-5 rounded-full overflow-hidden gap-0.5 mb-3" role="img" aria-label="국내 해외 비율 막대">
            {parts.filter((p) => p.value > 0).map((p) => (
              <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} title={`${p.label} ${p.value}`} />
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {parts.map((p) => (
              <span key={p.label} className="flex items-center gap-1.5 text-sm text-[#575756]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                {p.label} <b className="text-[#6d4e42]">{p.value}</b>
                <span className="text-xs text-[#8a8a8a]">({total > 0 ? Math.round((p.value / total) * 100) : 0}%)</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 캠페인 전후 비교 ────────────────────────────────
function CampaignBeforeAfterCard({ campaigns, statsLeads }: { campaigns: MarketingCampaignRow[]; statsLeads: StatsLeadWithId[] }) {
  const withDates = useMemo(() => campaigns.filter((c) => c.start_date && c.end_date), [campaigns]);
  const [selected, setSelected] = useState('');
  const campaign = useMemo(
    () => withDates.find((c) => c.id === selected) ?? withDates[0] ?? null,
    [withDates, selected]
  );

  const comparison = useMemo(() => {
    if (!campaign) return null;
    // 캠페인이 채널을 지정했으면 그 채널 전체 유입으로, 아니면 캠페인 연결 리드로 비교
    let rows = statsLeads;
    if (campaign.channel_detail) rows = rows.filter((l) => l.channel_detail === campaign.channel_detail);
    else if (campaign.channel_category) rows = rows.filter((l) => l.channel_category === campaign.channel_category);
    else rows = rows.filter((l) => l.campaign_id === campaign.id);
    return beforeAfterComparison(rows, campaign);
  }, [campaign, statsLeads]);

  const basis = campaign?.channel_detail
    ? `세부 채널 "${campaign.channel_detail}" 전체 유입 기준`
    : campaign?.channel_category
      ? `유입 경로 "${getChannelCategoryLabel(campaign.channel_category)}" 전체 유입 기준`
      : '캠페인에 연결된 리드 기준';

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h3 className="font-bold text-sm text-[#6d4e42]">광고 집행 전후 비교</h3>
        {withDates.length > 0 && (
          <select value={campaign?.id ?? ''} onChange={(e) => setSelected(e.target.value)} className={INPUT_CLS} aria-label="캠페인 선택">
            {withDates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>
      {!campaign || !comparison ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">
          집행 기간(시작일·종료일)이 입력된 캠페인이 없습니다.
        </p>
      ) : (
        <>
          <p className="text-[11px] text-[#8a8a8a] mb-4">
            {campaign.start_date} ~ {campaign.end_date} · 동일 길이({comparison.during.days}일) 전후 구간 · {basis}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['집행 전', comparison.before],
                ['집행 중', comparison.during],
                ['집행 후', comparison.after],
              ] as const
            ).map(([label, w]) => (
              <div key={label} className="text-center bg-[#f6f6f6] rounded-lg p-3" title={`${w.from} ~ ${w.to}`}>
                <p className="text-xs text-[#8a8a8a] mb-1">{label}</p>
                <p className="text-xl font-bold text-[#6d4e42]">{w.count}</p>
                <p className="text-[11px] text-[#8a8a8a]">일평균 {w.perDay.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── 캠페인 광고비 지표 ──────────────────────────────
function CampaignPerfCard({ perf, hasCampaigns }: { perf: ReturnType<typeof computeCampaignPerf>; hasCampaigns: boolean }) {
  const noData = <span className="text-xs text-[#8a8a8a]">데이터 없음</span>;
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-1">캠페인별 광고비 지표</h3>
      <p className="text-[11px] text-[#8a8a8a] mb-4">
        연락일 기준 코호트 · 광고비가 입력된 캠페인만 계산 (미입력은 &lsquo;데이터 없음&rsquo;) ·
        광고비는 수수료·VAT 포함 총지출 · CAC = 광고비 ÷ 결제 환자 수 (리드당 비용은 보조 지표)
      </p>
      {perf.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-4 text-center">
          {hasCampaigns
            ? '기간 내 연결된 리드가 있는 캠페인이 없습니다.'
            : '등록된 캠페인이 없습니다. 사이드바 "마케팅 콘텐츠" 메뉴에서 캠페인을 등록하세요.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#8a8a8a] border-b border-[#f0f0f0]">
                <th className="py-2 pr-3 font-medium">캠페인</th>
                <th className="py-2 px-3 font-medium text-right">광고비</th>
                <th className="py-2 px-3 font-medium text-right">신규 연락</th>
                <th className="py-2 px-3 font-medium text-right">결제</th>
                <th className="py-2 px-3 font-medium text-right">결제금액</th>
                <th className="py-2 px-3 font-medium text-right">리드당 비용</th>
                <th className="py-2 px-3 font-medium text-right">CAC(결제당)</th>
                <th className="py-2 pl-3 font-medium text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((p) => (
                <tr key={p.id} className="border-b border-[#f6f6f6] last:border-0">
                  <td className="py-2 pr-3 text-[#575756]">{p.name}</td>
                  <td className="py-2 px-3 text-right">{p.spendKrw == null ? noData : formatKrw(p.spendKrw)}</td>
                  <td className="py-2 px-3 text-right font-medium text-[#6d4e42]">{p.leads}</td>
                  <td className="py-2 px-3 text-right">{p.paidCount}</td>
                  <td className="py-2 px-3 text-right">
                    {p.paidCount === 0 ? '–' : formatKrw(p.revenueKrw)}
                    {p.paidWithoutAmount > 0 && <span className="text-[10px] text-[#8a8a8a]"> (미입력 {p.paidWithoutAmount})</span>}
                  </td>
                  <td className="py-2 px-3 text-right">{p.costPerLead == null ? noData : formatKrw(Math.round(p.costPerLead))}</td>
                  <td className="py-2 px-3 text-right">{p.costPerPaid == null ? noData : formatKrw(Math.round(p.costPerPaid))}</td>
                  <td className="py-2 pl-3 text-right">{p.roas == null ? noData : `${(p.roas * 100).toFixed(0)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── 상세 목록 ──────────────────────────────────────
const PAGE_SIZE = 20;

type SortKey = 'contact_date' | 'stage' | 'amount';

function DetailTable({
  leads,
  allowedIds,
  range,
  onEdit,
}: {
  leads: InflowLeadRow[];
  allowedIds: Set<string>;
  range: { from: string; to: string };
  onEdit: (lead: InflowLeadRow) => void;
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('contact_date');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const stageOrder: Record<LeadStage, number> = { contact: 0, reserved: 1, visited: 2, paid: 3 };
    const rows = leads.filter((l) => {
      if (!allowedIds.has(l.id)) return false;
      if (l.contact_date < range.from || l.contact_date > range.to) return false;
      if (!q) return true;
      return [l.name, l.wechat_id, l.kakao_id, l.phone, l.treatment, l.manager]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
    const dir = sortDesc ? -1 : 1;
    return rows.sort((a, b) => {
      if (sortKey === 'contact_date') return a.contact_date.localeCompare(b.contact_date) * dir;
      if (sortKey === 'amount') return ((a.paid_amount_krw ?? -1) - (b.paid_amount_krw ?? -1)) * dir;
      const sa = stageOrder[getLeadStage({ reserved: a.reserved, visited: a.visited, paid: a.paid ?? false })];
      const sb = stageOrder[getLeadStage({ reserved: b.reserved, visited: b.visited, paid: b.paid ?? false })];
      return (sa - sb) * dir;
    });
  }, [leads, allowedIds, range, search, sortKey, sortDesc]);

  const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, maxPage);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const exportCsv = () => {
    const csv = buildLeadsCsv(
      filtered.map((l) => ({
        ...l,
        paid: l.paid ?? false,
        paid_date: l.paid_date ?? null,
        paid_amount_krw: l.paid_amount_krw ?? null,
        outcome: l.outcome ?? null,
        patient_origin: l.patient_origin ?? null,
        channel_category: l.channel_category ?? null,
        channel_detail: l.channel_detail ?? null,
        treatment_tags: l.treatment_tags ?? [],
        manager: l.manager ?? null,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `유입통계_${range.from}_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
    setPage(0);
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDesc ? ' ↓' : ' ↑') : '');

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div>
          <h3 className="font-bold text-sm text-[#6d4e42]">상세 목록</h3>
          <p className="text-[11px] text-[#8a8a8a]">필터 결과 {filtered.length}건 · 연락일 기준</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="이름·ID·전화·시술 검색"
            className={`${INPUT_CLS} w-52`}
          />
          <button onClick={exportCsv} className="h-9 px-3 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer">
            CSV
          </button>
        </div>
      </div>

      {pageRows.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-8 text-center">조건에 맞는 기록이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left text-xs text-[#8a8a8a] border-b border-[#f0f0f0]">
                <th className="py-2 pr-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('contact_date')}>
                  연락일{sortIndicator('contact_date')}
                </th>
                <th className="py-2 px-3 font-medium">고객</th>
                <th className="py-2 px-3 font-medium">유입 경로</th>
                <th className="py-2 px-3 font-medium">시술 태그</th>
                <th className="py-2 px-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('stage')}>
                  단계{sortIndicator('stage')}
                </th>
                <th className="py-2 px-3 font-medium text-right cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                  결제금액{sortIndicator('amount')}
                </th>
                <th className="py-2 px-3 font-medium">담당자</th>
                <th className="py-2 px-3 font-medium">입력 상태</th>
                <th className="py-2 pl-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((l) => {
                const stage = getLeadStage({ reserved: l.reserved, visited: l.visited, paid: l.paid ?? false });
                const missing = getMissingFields({
                  patient_origin: l.patient_origin ?? null,
                  channel_category: l.channel_category ?? null,
                  treatment_tags: l.treatment_tags ?? [],
                  classified_at: l.classified_at ?? null,
                });
                const ident = l.name || l.wechat_id || l.kakao_id || l.phone || '(이름 없음)';
                return (
                  <tr key={l.id} className="border-b border-[#f6f6f6] last:border-0">
                    <td className="py-2 pr-3 text-[#575756]">{l.contact_date}</td>
                    <td className="py-2 px-3">
                      <span className="font-medium text-[#6d4e42]">{ident}</span>
                      <span className="text-[11px] text-[#8a8a8a] ml-1.5">{getInflowChannelLabel(l.channel)}</span>
                      {l.outcome && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 ml-1.5">
                          {LEAD_OUTCOME_LABELS[l.outcome as keyof typeof LEAD_OUTCOME_LABELS] ?? l.outcome}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {l.channel_category ? (
                        <>
                          <span className="text-[#575756]">{getChannelCategoryLabel(l.channel_category)}</span>
                          {l.channel_detail && <span className="text-xs text-[#8a8a8a]"> · {l.channel_detail}</span>}
                          {l.patient_origin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f6f6f6] text-[#575756] ml-1.5">
                              {getPatientOriginLabel(l.patient_origin)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-[#8a8a8a]">미분류</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {(l.treatment_tags ?? []).length > 0 ? (
                        <span className="text-[#575756]">{(l.treatment_tags ?? []).map(getTreatmentTagLabel).join(', ')}</span>
                      ) : l.treatment ? (
                        <span className="text-xs text-[#8a8a8a]" title={l.treatment}>
                          (원문) {l.treatment.length > 14 ? l.treatment.slice(0, 14) + '…' : l.treatment}
                        </span>
                      ) : (
                        <span className="text-xs text-[#8a8a8a]">–</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: LEAD_STAGE_HEX[stage] }}
                      >
                        {LEAD_STAGE_LABELS[stage]}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-[#575756]">
                      {l.paid ? (l.paid_amount_krw != null ? formatKrw(l.paid_amount_krw) : '금액 미입력') : '–'}
                    </td>
                    <td className="py-2 px-3 text-[#575756]">{l.manager ?? '–'}</td>
                    <td className="py-2 px-3">
                      {missing.length > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">누락 {missing.length}</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600">완료</span>
                      )}
                    </td>
                    <td className="py-2 pl-3">
                      <button
                        onClick={() => onEdit(l)}
                        className="px-2.5 py-1 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {maxPage > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="px-3 py-1.5 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] disabled:opacity-40 cursor-pointer"
          >
            이전
          </button>
          <span className="text-xs text-[#8a8a8a]">
            {safePage + 1} / {maxPage + 1}
          </span>
          <button
            onClick={() => setPage(Math.min(maxPage, safePage + 1))}
            disabled={safePage === maxPage}
            className="px-3 py-1.5 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] disabled:opacity-40 cursor-pointer"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
