'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
  INFLOW_CHANNELS,
  INFLOW_CHANNEL_LABELS,
  INFLOW_CHANNEL_COLORS,
  getInflowChannelLabel,
  AGENCY_PRESETS,
  type InflowChannel,
  type InflowLeadRow,
  type InflowLeadInsert,
} from '@/types/admin';

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

type Tab = 'entry' | 'stats';
type StatsPeriod = '7d' | '30d' | '90d' | 'month';

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  '7d': '최근 7일',
  '30d': '최근 30일',
  '90d': '최근 90일',
  month: '이번 달',
};

function periodRange(period: StatsPeriod): { from: string; to: string } {
  const today = new Date();
  const to = toDateStr(today);
  if (period === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateStr(first), to };
  }
  const days = period === '7d' ? 6 : period === '30d' ? 29 : 89;
  return { from: shiftDate(to, -days), to };
}

function inRange(dateStr: string | null, from: string, to: string): boolean {
  if (!dateStr) return false;
  return dateStr >= from && dateStr <= to;
}

// ─── 메인 페이지 ────────────────────────────────────
export default function InflowPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>('entry');
  const [leads, setLeads] = useState<InflowLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('inflow_leads')
      .select('*')
      .order('contact_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) {
      setError('데이터를 불러오지 못했습니다. (테이블/권한 확인: inflow-leads-table.sql)');
      setLeads([]);
    } else {
      setLeads((data ?? []) as InflowLeadRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return (
    <div>
      {/* 헤더 + 탭 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">유입 통계</h2>
          <p className="text-xs text-[#8a8a8a] mt-0.5">
            신규 연락 → 예약 → 내원 흐름을 채널·에이전시별로 기록·집계합니다.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-1 self-start">
          {(['entry', 'stats'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-[#6d4e42] font-medium shadow-sm' : 'text-[#8a8a8a] hover:text-[#575756]'
              }`}
            >
              {t === 'entry' ? '일일 입력' : '통계'}
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
        <EntryTab leads={leads} supabase={supabase} onChanged={loadLeads} />
      ) : (
        <StatsTab leads={leads} />
      )}
    </div>
  );
}

// ─── 일일 입력 탭 ────────────────────────────────────
function EntryTab({
  leads,
  supabase,
  onChanged,
}: {
  leads: InflowLeadRow[];
  supabase: ReturnType<typeof createClient>;
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
    return { contacts, reserved, visited };
  }, [leads, date]);

  const toggleField = async (lead: InflowLeadRow, field: 'reserved' | 'visited') => {
    setBusyId(lead.id);
    const next = !lead[field];
    const dateField = field === 'reserved' ? 'reserved_date' : 'visited_date';
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
    const headers = [
      '연락일',
      '채널',
      '에이전시',
      '구분',
      '이름',
      '위챗ID',
      '카카오ID',
      '전화',
      '시술',
      '예약',
      '예약일',
      '내원',
      '내원일',
      '비고',
    ];
    const rows = visibleLeads.map((l) => [
      l.contact_date,
      getInflowChannelLabel(l.channel),
      l.agency ?? '',
      l.is_returning ? '재진' : '신규',
      l.name ?? '',
      l.wechat_id ?? '',
      l.kakao_id ?? '',
      l.phone ?? '',
      l.treatment ?? '',
      l.reserved ? 'O' : '',
      l.reserved_date ?? '',
      l.visited ? 'O' : '',
      l.visited_date ?? '',
      (l.note ?? '').replace(/"/g, '""'),
    ]);
    const BOM = '﻿';
    const csv =
      BOM +
      [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          <DaySummaryCard label="신규 연락" value={dayStats.contacts} color="text-blue-600" />
          <DaySummaryCard label="예약" value={dayStats.reserved} color="text-amber-600" />
          <DaySummaryCard label="내원" value={dayStats.visited} color="text-emerald-600" />
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
          defaultDate={date}
          editTarget={editTarget}
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
  onToggle: (lead: InflowLeadRow, field: 'reserved' | 'visited') => void;
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
  defaultDate,
  editTarget,
  onClose,
  onSaved,
}: {
  supabase: ReturnType<typeof createClient>;
  defaultDate: string;
  editTarget: InflowLeadRow | null;
  onClose: () => void;
  onSaved: () => void;
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
  }));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof InflowLeadInsert>(key: K, value: InflowLeadInsert[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-5 max-w-lg w-full shadow-xl my-8">
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
          <Field label="채널">
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

          <Field label="관심/예약 시술" full>
            <input type="text" value={form.treatment ?? ''} onChange={(e) => set('treatment', e.target.value)} className={INPUT_CLS} />
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

// ─── 통계 탭 ────────────────────────────────────────
function StatsTab({ leads }: { leads: InflowLeadRow[] }) {
  const [period, setPeriod] = useState<StatsPeriod>('30d');
  const { from, to } = useMemo(() => periodRange(period), [period]);

  const agg = useMemo(() => {
    const contacts = leads.filter((l) => inRange(l.contact_date, from, to));
    const reserved = leads.filter((l) => l.reserved && inRange(l.reserved_date, from, to));
    const visited = leads.filter((l) => l.visited && inRange(l.visited_date, from, to));

    // 채널별 (신규 연락 기준)
    const channelMap = new Map<string, number>();
    for (const l of contacts) channelMap.set(l.channel, (channelMap.get(l.channel) ?? 0) + 1);
    const byChannel = INFLOW_CHANNELS.map((c) => ({ channel: c, count: channelMap.get(c) ?? 0 })).filter(
      (x) => x.count > 0
    );

    // 에이전시 vs 직접 (신규 연락 기준)
    const agencyContacts = contacts.filter((l) => l.agency).length;
    const directContacts = contacts.length - agencyContacts;
    const agencyVisited = visited.filter((l) => l.agency).length;
    const directVisited = visited.length - agencyVisited;

    // 일자별 추세
    const dayMap = new Map<string, { contact: number; reserved: number; visited: number }>();
    const ensure = (d: string) => {
      if (!dayMap.has(d)) dayMap.set(d, { contact: 0, reserved: 0, visited: 0 });
      return dayMap.get(d)!;
    };
    for (const l of contacts) ensure(l.contact_date).contact++;
    for (const l of reserved) ensure(l.reserved_date!).reserved++;
    for (const l of visited) ensure(l.visited_date!).visited++;
    const daily = Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const c = contacts.length;
    return {
      contacts: c,
      reserved: reserved.length,
      visited: visited.length,
      reserveRate: c > 0 ? (reserved.length / c) * 100 : 0,
      visitRate: c > 0 ? (visited.length / c) * 100 : 0,
      byChannel,
      agencyContacts,
      directContacts,
      agencyVisited,
      directVisited,
      daily,
    };
  }, [leads, from, to]);

  return (
    <div>
      {/* 기간 필터 */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(['7d', '30d', '90d', 'month'] as StatsPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
              period === p
                ? 'bg-[#6d4e42] text-white'
                : 'border border-[#e5e5e5] text-[#575756] hover:bg-[#f6f6f6]'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        <span className="text-xs text-[#8a8a8a] ml-1">
          {formatMD(from)} ~ {formatMD(to)}
        </span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="신규 연락" value={agg.contacts} icon="📞" color="bg-blue-50 text-blue-700" />
        <KpiCard label="예약" value={agg.reserved} icon="📅" color="bg-amber-50 text-amber-700" />
        <KpiCard label="내원" value={agg.visited} icon="🏥" color="bg-emerald-50 text-emerald-700" />
        <KpiCard
          label="전환율"
          value={`${agg.reserveRate.toFixed(0)}% / ${agg.visitRate.toFixed(0)}%`}
          sub="예약 / 내원"
          icon="📈"
          color="bg-purple-50 text-purple-700"
        />
      </div>

      {/* 퍼널 */}
      <FunnelChart contacts={agg.contacts} reserved={agg.reserved} visited={agg.visited} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChannelChart data={agg.byChannel} />
        <AgencyChart
          agencyContacts={agg.agencyContacts}
          directContacts={agg.directContacts}
          agencyVisited={agg.agencyVisited}
          directVisited={agg.directVisited}
        />
      </div>

      {/* 일자별 추세 */}
      <DailyTrend daily={agg.daily} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#e5e5e5]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-sm text-[#8a8a8a]">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color} inline-block px-2 py-0.5 rounded-lg`}>{value}</p>
      {sub && <p className="text-xs text-[#8a8a8a] mt-2">{sub}</p>}
    </div>
  );
}

function FunnelChart({ contacts, reserved, visited }: { contacts: number; reserved: number; visited: number }) {
  const max = Math.max(contacts, 1);
  const rows = [
    { label: '신규 연락', value: contacts, color: 'bg-blue-400', rate: '' },
    {
      label: '예약',
      value: reserved,
      color: 'bg-amber-400',
      rate: contacts > 0 ? `${((reserved / contacts) * 100).toFixed(0)}%` : '',
    },
    {
      label: '내원',
      value: visited,
      color: 'bg-emerald-400',
      rate: contacts > 0 ? `${((visited / contacts) * 100).toFixed(0)}%` : '',
    },
  ];
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-4">전환 퍼널</h3>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#575756]">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#6d4e42]">{r.value}</span>
                {r.rate && <span className="text-xs text-[#8a8a8a]">({r.rate})</span>}
              </div>
            </div>
            <div className="w-full bg-[#f0f0f0] rounded-full h-3">
              <div className={`h-3 rounded-full ${r.color} transition-all`} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelChart({ data }: { data: { channel: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-4">채널별 신규 연락</h3>
      {data.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">데이터가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {data
            .sort((a, b) => b.count - a.count)
            .map((d) => {
              const pct = total > 0 ? ((d.count / total) * 100).toFixed(0) : '0';
              const color = INFLOW_CHANNEL_COLORS[d.channel as InflowChannel] ?? 'bg-[#b4988d]';
              return (
                <div key={d.channel}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#575756]">{getInflowChannelLabel(d.channel)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#6d4e42]">{d.count}</span>
                      <span className="text-xs text-[#8a8a8a]">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#f0f0f0] rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${color} transition-all`} style={{ width: `${(d.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function AgencyChart({
  agencyContacts,
  directContacts,
  agencyVisited,
  directVisited,
}: {
  agencyContacts: number;
  directContacts: number;
  agencyVisited: number;
  directVisited: number;
}) {
  const rows = [
    { label: '에이전시', contacts: agencyContacts, visited: agencyVisited, color: 'bg-rose-400' },
    { label: '직접 유입', contacts: directContacts, visited: directVisited, color: 'bg-[#b4988d]' },
  ];
  const max = Math.max(agencyContacts, directContacts, 1);
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="font-bold text-sm text-[#6d4e42] mb-1">에이전시 vs 직접 유입</h3>
      <p className="text-[11px] text-[#8a8a8a] mb-4">신규 연락 기준 · 괄호는 내원 수</p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#575756]">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#6d4e42]">{r.contacts}</span>
                <span className="text-xs text-emerald-600">(내원 {r.visited})</span>
              </div>
            </div>
            <div className="w-full bg-[#f0f0f0] rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${r.color} transition-all`} style={{ width: `${(r.contacts / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyTrend({ daily }: { daily: { date: string; contact: number; reserved: number; visited: number }[] }) {
  const max = Math.max(...daily.map((d) => Math.max(d.contact, d.reserved, d.visited)), 1);
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-[#6d4e42]">일자별 추세</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> 연락
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> 예약
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 내원
          </span>
        </div>
      </div>
      {daily.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-6 text-center">데이터가 없습니다.</p>
      ) : (
        <>
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {daily.map((d) => (
              <div key={d.date} className="flex-1 min-w-[16px] flex flex-col items-center gap-px group relative h-full justify-end">
                <div className="w-full flex items-end justify-center gap-px h-full">
                  <div className="w-1/3 bg-blue-400 rounded-t-sm min-h-[2px]" style={{ height: `${(d.contact / max) * 100}%` }} />
                  <div className="w-1/3 bg-amber-400 rounded-t-sm min-h-[2px]" style={{ height: `${(d.reserved / max) * 100}%` }} />
                  <div className="w-1/3 bg-emerald-400 rounded-t-sm min-h-[2px]" style={{ height: `${(d.visited / max) * 100}%` }} />
                </div>
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#6d4e42] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  <p className="font-medium">{formatMD(d.date)}</p>
                  <p>연락 {d.contact} / 예약 {d.reserved} / 내원 {d.visited}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1 overflow-x-auto">
            {daily.map((d, i) => {
              const show = daily.length <= 10 || (daily.length <= 35 ? i % 5 === 0 : i % 10 === 0);
              return (
                <div key={d.date} className="flex-1 min-w-[16px] text-center">
                  {show && <span className="text-[9px] text-[#8a8a8a]">{formatMD(d.date).slice(0, -4)}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
