'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import InflowDashboard from '@/components/admin/inflow/InflowDashboard';
import InflowReviewTab from '@/components/admin/inflow/InflowReviewTab';
import LeadContentLinks from '@/components/admin/inflow/LeadContentLinks';
import {
  INFLOW_CHANNELS,
  INFLOW_CHANNEL_LABELS,
  INFLOW_CHANNEL_COLORS,
  getInflowChannelLabel,
  AGENCY_PRESETS,
  type InflowChannel,
  type InflowLeadRow,
  type InflowLeadInsert,
  type LeadContentLinkRow,
  type MarketingCampaignRow,
  type MarketingContentRow,
} from '@/types/admin';
import {
  CHANNEL_CATEGORIES,
  CHANNEL_CATEGORY_LABELS,
  CHANNEL_DETAIL_PRESETS,
  LEAD_OUTCOMES,
  LEAD_OUTCOME_LABELS,
  PATIENT_ORIGINS,
  PATIENT_ORIGIN_LABELS,
  TREATMENT_TAGS,
  TREATMENT_TAG_LABELS,
  needsReview,
  type ChannelCategory,
} from '@/lib/inflow/taxonomy';
import { buildLeadsCsv } from '@/lib/inflow/csv';

// ─── 날짜 유틸 (로컬 기준 YYYY-MM-DD) ────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayStr(): string {
  return toDateStr(new Date());
}
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}
function formatMD(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${week})`;
}

const INPUT_CLS =
  'w-full h-9 px-3 text-sm border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d]';

type Tab = 'entry' | 'stats' | 'review';

// ─── 메인 페이지 ────────────────────────────────────
export default function InflowPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>('entry');
  const [leads, setLeads] = useState<InflowLeadRow[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);
  const [contents, setContents] = useState<MarketingContentRow[]>([]);
  const [links, setLinks] = useState<LeadContentLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 대시보드·검토 탭에서 여는 공용 수정 모달
  const [editLead, setEditLead] = useState<InflowLeadRow | null>(null);

  // 첫 로드는 loading 초기값(true)이 스피너를 담당하고, 이후 갱신은 깜빡임 없이 백그라운드로 반영한다.
  const loadLeads = useCallback(async () => {
    const [leadsRes, campaignsRes, contentsRes, linksRes] = await Promise.all([
      supabase
        .from('inflow_leads')
        .select('*')
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_contents').select('*').order('posted_at', { ascending: false }),
      supabase.from('lead_content_links').select('*'),
    ]);
    if (leadsRes.error) {
      setError('데이터를 불러오지 못했습니다. (테이블/권한 확인: supabase/migrations/038_marketing_attribution.sql)');
      setLeads([]);
    } else {
      setError(null);
      setLeads((leadsRes.data ?? []) as InflowLeadRow[]);
    }
    // 마케팅 테이블은 없어도 기존 기능이 동작하도록 소프트 실패
    setCampaigns((campaignsRes.data ?? []) as MarketingCampaignRow[]);
    setContents((contentsRes.data ?? []) as MarketingContentRow[]);
    setLinks((linksRes.data ?? []) as LeadContentLinkRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const reviewCount = useMemo(
    () =>
      leads.filter((l) =>
        needsReview({
          patient_origin: l.patient_origin ?? null,
          channel_category: l.channel_category ?? null,
          treatment_tags: l.treatment_tags ?? [],
          classified_at: l.classified_at ?? null,
        })
      ).length,
    [leads]
  );

  const TAB_LABELS: Record<Tab, string> = {
    entry: '일일 입력',
    stats: '통계',
    review: '표준화 검토',
  };

  return (
    <div>
      {/* 헤더 + 탭 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">유입 통계</h2>
          <p className="text-xs text-[#8a8a8a] mt-0.5">
            신규 연락 → 예약 → 내원 → 결제 흐름을 채널·시술·캠페인별로 기록·집계합니다.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-1 self-start">
          {(['entry', 'stats', 'review'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-[#6d4e42] font-medium shadow-sm' : 'text-[#8a8a8a] hover:text-[#575756]'
              }`}
            >
              {TAB_LABELS[t]}
              {t === 'review' && reviewCount > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 align-middle">
                  {reviewCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-[#b4988d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'entry' ? (
        <EntryTab leads={leads} supabase={supabase} campaigns={campaigns} contents={contents} onChanged={loadLeads} />
      ) : tab === 'stats' ? (
        <InflowDashboard leads={leads} campaigns={campaigns} contents={contents} links={links} onEdit={setEditLead} />
      ) : (
        <InflowReviewTab leads={leads} supabase={supabase} onEdit={setEditLead} onApplied={loadLeads} />
      )}

      {editLead && (
        <LeadFormModal
          supabase={supabase}
          campaigns={campaigns}
          contents={contents}
          defaultDate={todayStr()}
          editTarget={editLead}
          managerOptions={Array.from(new Set(leads.map((l) => l.manager).filter(Boolean))) as string[]}
          onClose={() => setEditLead(null)}
          onSaved={() => {
            setEditLead(null);
            loadLeads();
          }}
        />
      )}
    </div>
  );
}

// ─── 일일 입력 탭 ────────────────────────────────────
function EntryTab({
  leads,
  supabase,
  campaigns,
  contents,
  onChanged,
}: {
  leads: InflowLeadRow[];
  supabase: ReturnType<typeof createClient>;
  campaigns: MarketingCampaignRow[];
  contents: MarketingContentRow[];
  onChanged: () => void;
}) {
  const [date, setDate] = useState(todayStr());
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InflowLeadRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const visibleLeads = useMemo(() => {
    if (q) {
      return leads.filter((l) =>
        [l.name, l.wechat_id, l.kakao_id, l.phone]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      );
    }
    return leads.filter((l) => l.contact_date === date);
  }, [leads, q, date]);

  const dayStats = useMemo(() => {
    const contacts = leads.filter((l) => l.contact_date === date).length;
    const reserved = leads.filter((l) => l.reserved && l.reserved_date === date).length;
    const visited = leads.filter((l) => l.visited && l.visited_date === date).length;
    const paid = leads.filter((l) => l.paid && l.paid_date === date).length;
    return { contacts, reserved, visited, paid };
  }, [leads, date]);

  const toggleField = async (lead: InflowLeadRow, field: 'reserved' | 'visited' | 'paid') => {
    setBusyId(lead.id);
    const next = !lead[field];
    const dateField = field === 'reserved' ? 'reserved_date' : field === 'visited' ? 'visited_date' : 'paid_date';
    const patch: Record<string, unknown> = { [field]: next };
    // 새로 체크 시 날짜 자동 기입(없을 때만), 해제 시 날짜 제거
    patch[dateField] = next ? lead[dateField] ?? todayStr() : null;
    await supabase.from('inflow_leads').update(patch).eq('id', lead.id);
    setBusyId(null);
    onChanged();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('inflow_leads').delete().eq('id', deleteTarget);
    setDeleteTarget(null);
    onChanged();
  };

  const exportCsv = () => {
    // 기존 14열 순서를 유지하고 표준화 열(국내외·유입경로·태그·결제 등)을 뒤에 덧붙인다
    const csv = buildLeadsCsv(
      visibleLeads.map((l) => ({
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
    a.download = `유입통계_${q ? '검색' : date}_${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* 날짜 이동 + 추가 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="w-9 h-9 flex items-center justify-center border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
            aria-label="이전 날짜"
          >
            ‹
          </button>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value || todayStr())}
            className="h-9 px-3 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#b4988d]"
          />
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= todayStr()}
            className="w-9 h-9 flex items-center justify-center border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-40"
            aria-label="다음 날짜"
          >
            ›
          </button>
          <button
            onClick={() => setDate(todayStr())}
            className="h-9 px-3 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
          >
            오늘
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="h-9 px-3 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
          >
            CSV
          </button>
          <button
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="h-9 px-4 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer"
          >
            + 신규 리드
          </button>
        </div>
      </div>

      {/* 검색 */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="이름·위챗ID·카카오ID·전화 검색 (전 기간)"
        className="w-full h-10 px-3 text-sm border border-[#e5e5e5] rounded-lg mb-3 focus:outline-none focus:border-[#b4988d]"
      />

      {/* 일자 요약 */}
      {!q && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <DaySummaryCard label="신규 연락" value={dayStats.contacts} color="text-blue-600" />
          <DaySummaryCard label="예약" value={dayStats.reserved} color="text-amber-600" />
          <DaySummaryCard label="내원" value={dayStats.visited} color="text-emerald-600" />
          <DaySummaryCard label="결제" value={dayStats.paid} color="text-purple-600" />
        </div>
      )}

      {/* 리스트 */}
      {visibleLeads.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a] text-sm">
          {q ? '검색 결과가 없습니다.' : `${formatMD(date)} 등록된 리드가 없습니다. "+ 신규 리드"로 추가하세요.`}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] divide-y divide-[#f0f0f0]">
          {visibleLeads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              busy={busyId === lead.id}
              showDate={!!q}
              onToggle={toggleField}
              onEdit={() => {
                setEditTarget(lead);
                setModalOpen(true);
              }}
              onDelete={() => setDeleteTarget(lead.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <LeadFormModal
          supabase={supabase}
          campaigns={campaigns}
          contents={contents}
          defaultDate={date}
          editTarget={editTarget}
          managerOptions={Array.from(new Set(leads.map((l) => l.manager).filter(Boolean))) as string[]}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onChanged();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="리드 삭제"
        message="이 리드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DaySummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-3 text-center">
      <p className="text-xs text-[#8a8a8a] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function LeadRow({
  lead,
  busy,
  showDate,
  onToggle,
  onEdit,
  onDelete,
}: {
  lead: InflowLeadRow;
  busy: boolean;
  showDate: boolean;
  onToggle: (lead: InflowLeadRow, field: 'reserved' | 'visited' | 'paid') => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const channelColor = INFLOW_CHANNEL_COLORS[lead.channel as InflowChannel] ?? 'bg-gray-300';
  const ident = lead.name || lead.wechat_id || lead.kakao_id || lead.phone || '(이름 없음)';
  return (
    <div className={`p-3 lg:p-4 ${busy ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full text-white ${channelColor}`}>
          {getInflowChannelLabel(lead.channel)}
        </span>
        {lead.agency && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
            {lead.agency}
          </span>
        )}
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full ${
            lead.is_returning ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {lead.is_returning ? '재진' : '신규'}
        </span>
        <span className="font-medium text-sm text-[#6d4e42]">{ident}</span>
        {lead.treatment && <span className="text-xs text-[#8a8a8a]">· {lead.treatment}</span>}
        {showDate && <span className="text-xs text-[#8a8a8a]">· 연락 {formatMD(lead.contact_date)}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleChip
          active={lead.reserved}
          onClick={() => onToggle(lead, 'reserved')}
          activeClass="bg-amber-500 text-white border-amber-500"
          label={lead.reserved ? `예약 ✓ ${lead.reserved_date ? formatMD(lead.reserved_date) : ''}` : '예약'}
        />
        <ToggleChip
          active={lead.visited}
          onClick={() => onToggle(lead, 'visited')}
          activeClass="bg-emerald-500 text-white border-emerald-500"
          label={lead.visited ? `내원 ✓ ${lead.visited_date ? formatMD(lead.visited_date) : ''}` : '내원'}
        />
        <ToggleChip
          active={lead.paid ?? false}
          onClick={() => onToggle(lead, 'paid')}
          activeClass="bg-purple-500 text-white border-purple-500"
          label={lead.paid ? `결제 ✓ ${lead.paid_date ? formatMD(lead.paid_date) : ''}` : '결제'}
        />
        {lead.outcome && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            {LEAD_OUTCOME_LABELS[lead.outcome as (typeof LEAD_OUTCOMES)[number]] ?? lead.outcome}
          </span>
        )}
        <div className="flex-1" />
        {lead.note && <span className="text-xs text-[#8a8a8a] truncate max-w-[40%]">{lead.note}</span>}
        <button
          onClick={onEdit}
          className="px-2.5 py-1 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="px-2.5 py-1 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
        active ? activeClass : 'border-[#e5e5e5] text-[#8a8a8a] hover:bg-[#f6f6f6]'
      }`}
    >
      {label}
    </button>
  );
}

// ─── 리드 입력/수정 모달 ─────────────────────────────
function LeadFormModal({
  supabase,
  campaigns,
  contents,
  defaultDate,
  editTarget,
  onClose,
  onSaved,
  managerOptions = [],
}: {
  supabase: ReturnType<typeof createClient>;
  campaigns: MarketingCampaignRow[];
  contents: MarketingContentRow[];
  defaultDate: string;
  editTarget: InflowLeadRow | null;
  onClose: () => void;
  onSaved: () => void;
  managerOptions?: string[];
}) {
  const [form, setForm] = useState<InflowLeadInsert>(() => ({
    contact_date: editTarget?.contact_date ?? defaultDate,
    channel: editTarget?.channel ?? 'wechat',
    agency: editTarget?.agency ?? '',
    is_returning: editTarget?.is_returning ?? false,
    name: editTarget?.name ?? '',
    wechat_id: editTarget?.wechat_id ?? '',
    kakao_id: editTarget?.kakao_id ?? '',
    phone: editTarget?.phone ?? '',
    treatment: editTarget?.treatment ?? '',
    reserved: editTarget?.reserved ?? false,
    reserved_date: editTarget?.reserved_date ?? null,
    visited: editTarget?.visited ?? false,
    visited_date: editTarget?.visited_date ?? null,
    note: editTarget?.note ?? '',
    // 표준화 필드 (미입력 = null 유지, 임의 기본값 금지)
    patient_origin: editTarget?.patient_origin ?? null,
    channel_category: editTarget?.channel_category ?? null,
    channel_detail: editTarget?.channel_detail ?? '',
    treatment_tags: editTarget?.treatment_tags ?? [],
    paid: editTarget?.paid ?? false,
    paid_date: editTarget?.paid_date ?? null,
    paid_amount_krw: editTarget?.paid_amount_krw ?? null,
    outcome: editTarget?.outcome ?? null,
    campaign_id: editTarget?.campaign_id ?? null,
    manager: editTarget?.manager ?? '',
  }));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof InflowLeadInsert>(key: K, value: InflowLeadInsert[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleTag = (tag: string) =>
    setForm((f) => {
      const tags = f.treatment_tags ?? [];
      return { ...f, treatment_tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] };
    });

  const detailPresets = form.channel_category
    ? CHANNEL_DETAIL_PRESETS[form.channel_category as ChannelCategory] ?? []
    : [];

  const handleSave = async () => {
    setSaving(true);
    // 빈 문자열 → null 정리
    const clean = (v: string | null | undefined) => {
      const s = (v ?? '').toString().trim();
      return s === '' ? null : s;
    };
    const payload: InflowLeadInsert = {
      contact_date: form.contact_date,
      channel: form.channel,
      agency: clean(form.agency),
      is_returning: form.is_returning,
      name: clean(form.name),
      wechat_id: clean(form.wechat_id),
      kakao_id: clean(form.kakao_id),
      phone: clean(form.phone),
      treatment: clean(form.treatment),
      reserved: form.reserved,
      reserved_date: form.reserved ? form.reserved_date || form.contact_date : null,
      visited: form.visited,
      visited_date: form.visited ? form.visited_date || form.contact_date : null,
      note: clean(form.note),
      patient_origin: form.patient_origin ?? null,
      channel_category: form.channel_category ?? null,
      channel_detail: clean(form.channel_detail),
      treatment_tags: form.treatment_tags ?? [],
      paid: form.paid ?? false,
      paid_date: form.paid ? form.paid_date || form.contact_date : null,
      paid_amount_krw: form.paid ? form.paid_amount_krw ?? null : null,
      outcome: form.outcome ?? null,
      campaign_id: form.campaign_id || null,
      manager: clean(form.manager),
    };
    if (editTarget) {
      await supabase.from('inflow_leads').update(payload).eq('id', editTarget.id);
    } else {
      await supabase.from('inflow_leads').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    // items-center 금지: 패널이 화면보다 길면 위쪽이 스크롤 불가 영역이 됨 → 패널 m-auto로 중앙정렬
    <div className="fixed inset-0 z-50 flex bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-5 max-w-2xl w-full shadow-xl m-auto">
        <h3 className="font-bold text-[#6d4e42] mb-4">{editTarget ? '리드 수정' : '신규 리드 추가'}</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="연락일">
            <input
              type="date"
              value={form.contact_date}
              max={todayStr()}
              onChange={(e) => set('contact_date', e.target.value)}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="문의 수단">
            <select
              value={form.channel}
              onChange={(e) => set('channel', e.target.value as InflowChannel)}
              className={INPUT_CLS}
            >
              {INFLOW_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {INFLOW_CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="에이전시 (직접유입이면 비움)">
            <input
              type="text"
              list="agency-presets"
              value={form.agency ?? ''}
              onChange={(e) => set('agency', e.target.value)}
              placeholder="예: 바이올렛"
              className={INPUT_CLS}
            />
            <datalist id="agency-presets">
              {AGENCY_PRESETS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
          <Field label="구분">
            <div className="flex gap-1.5 h-9">
              {[
                { v: false, label: '신규' },
                { v: true, label: '재진' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => set('is_returning', o.v)}
                  className={`flex-1 text-sm rounded-lg border transition-colors cursor-pointer ${
                    form.is_returning === o.v
                      ? 'bg-[#6d4e42] text-white border-[#6d4e42]'
                      : 'border-[#e5e5e5] text-[#8a8a8a] hover:bg-[#f6f6f6]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="이름">
            <input type="text" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="전화">
            <input type="text" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="위챗 ID">
            <input type="text" value={form.wechat_id ?? ''} onChange={(e) => set('wechat_id', e.target.value)} className={INPUT_CLS} />
          </Field>
          <Field label="카카오 ID">
            <input type="text" value={form.kakao_id ?? ''} onChange={(e) => set('kakao_id', e.target.value)} className={INPUT_CLS} />
          </Field>

          {/* ─ 표준화: 국내외 / 유입 경로 ─ */}
          <Field label="국내/해외">
            <div className="flex gap-1.5 h-9">
              {[
                { v: null as string | null, label: '미분류' },
                ...PATIENT_ORIGINS.map((o) => ({ v: o as string | null, label: PATIENT_ORIGIN_LABELS[o] })),
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => set('patient_origin', o.v)}
                  className={`flex-1 text-sm rounded-lg border transition-colors cursor-pointer ${
                    (form.patient_origin ?? null) === o.v
                      ? 'bg-[#6d4e42] text-white border-[#6d4e42]'
                      : 'border-[#e5e5e5] text-[#8a8a8a] hover:bg-[#f6f6f6]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="담당자">
            <input
              type="text"
              list="manager-presets"
              value={form.manager ?? ''}
              onChange={(e) => set('manager', e.target.value)}
              className={INPUT_CLS}
            />
            <datalist id="manager-presets">
              {managerOptions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>

          <Field label="유입 경로 (어디서 알고 왔나)">
            <select
              value={form.channel_category ?? ''}
              onChange={(e) => {
                set('channel_category', e.target.value || null);
                if (!e.target.value) set('channel_detail', '');
              }}
              className={INPUT_CLS}
            >
              <option value="">미분류</option>
              {CHANNEL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="세부 채널">
            <input
              type="text"
              list="channel-detail-presets"
              value={form.channel_detail ?? ''}
              onChange={(e) => set('channel_detail', e.target.value)}
              placeholder={form.channel_category === 'app' ? '예: 바비톡' : ''}
              disabled={!form.channel_category}
              className={`${INPUT_CLS} disabled:opacity-40`}
            />
            <datalist id="channel-detail-presets">
              {detailPresets.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>

          <Field label="관심/예약 시술 (원문)" full>
            <input type="text" value={form.treatment ?? ''} onChange={(e) => set('treatment', e.target.value)} className={INPUT_CLS} />
          </Field>

          <Field label="시술 태그 (복수 선택)" full>
            <div className="flex flex-wrap gap-1.5">
              {TREATMENT_TAGS.map((t) => {
                const active = (form.treatment_tags ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#b4988d] text-white border-[#b4988d]'
                        : 'border-[#e5e5e5] text-[#8a8a8a] hover:bg-[#f6f6f6]'
                    }`}
                  >
                    {TREATMENT_TAG_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* 예약 */}
          <Field label="예약">
            <label className="flex items-center gap-2 h-9 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.reserved}
                onChange={(e) => set('reserved', e.target.checked)}
                className="w-4 h-4 accent-[#b4988d]"
              />
              예약 전환됨
            </label>
          </Field>
          <Field label="예약일">
            <input
              type="date"
              value={form.reserved_date ?? ''}
              disabled={!form.reserved}
              onChange={(e) => set('reserved_date', e.target.value || null)}
              className={`${INPUT_CLS} disabled:opacity-40`}
            />
          </Field>

          {/* 내원 */}
          <Field label="내원">
            <label className="flex items-center gap-2 h-9 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.visited}
                onChange={(e) => set('visited', e.target.checked)}
                className="w-4 h-4 accent-[#b4988d]"
              />
              내원 완료
            </label>
          </Field>
          <Field label="내원일">
            <input
              type="date"
              value={form.visited_date ?? ''}
              disabled={!form.visited}
              onChange={(e) => set('visited_date', e.target.value || null)}
              className={`${INPUT_CLS} disabled:opacity-40`}
            />
          </Field>

          {/* 결제 */}
          <Field label="결제">
            <label className="flex items-center gap-2 h-9 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.paid}
                onChange={(e) => set('paid', e.target.checked)}
                className="w-4 h-4 accent-[#b4988d]"
              />
              결제 완료
            </label>
          </Field>
          <Field label="결제일">
            <input
              type="date"
              value={form.paid_date ?? ''}
              disabled={!form.paid}
              onChange={(e) => set('paid_date', e.target.value || null)}
              className={`${INPUT_CLS} disabled:opacity-40`}
            />
          </Field>

          <Field label="결제금액(원) — 미입력 시 '금액 미입력'으로 집계">
            <input
              type="number"
              min={0}
              step={10000}
              value={form.paid_amount_krw ?? ''}
              disabled={!form.paid}
              onChange={(e) => set('paid_amount_krw', e.target.value === '' ? null : Number(e.target.value))}
              className={`${INPUT_CLS} disabled:opacity-40`}
            />
          </Field>
          <Field label="취소/노쇼">
            <select
              value={form.outcome ?? ''}
              onChange={(e) => set('outcome', e.target.value || null)}
              className={INPUT_CLS}
            >
              <option value="">해당 없음</option>
              {LEAD_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {LEAD_OUTCOME_LABELS[o]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="광고 캠페인" full>
            <select
              value={form.campaign_id ?? ''}
              onChange={(e) => set('campaign_id', e.target.value || null)}
              className={INPUT_CLS}
            >
              <option value="">연결 안 함</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ''}
                </option>
              ))}
            </select>
          </Field>

          {editTarget && (
            <Field label="콘텐츠 연결 (귀속: 직접/보조/추정/출처불명)" full>
              <LeadContentLinks leadId={editTarget.id} contents={contents} supabase={supabase} />
            </Field>
          )}

          <Field label="비고" full>
            <textarea
              value={form.note ?? ''}
              onChange={(e) => set('note', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg outline-none focus:border-[#b4988d] resize-none"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 공용 input 스타일 */}
      <style jsx>{`
        :global(.input) {
          width: 100%;
          height: 2.25rem;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e5e5;
          border-radius: 0.5rem;
          outline: none;
        }
        :global(textarea.input) {
          height: auto;
          padding: 0.5rem 0.75rem;
        }
        :global(.input:focus) {
          border-color: #b4988d;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs text-[#8a8a8a] mb-1">{label}</label>
      {children}
    </div>
  );
}
