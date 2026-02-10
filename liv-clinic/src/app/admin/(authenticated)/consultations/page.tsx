'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ConsultationRow } from '@/types/admin';
import VoiceNoteInput from '@/components/admin/VoiceNoteInput';
import HybridForm from '@/components/admin/hybrid-form/HybridForm';
import FormTemplateSelector from '@/components/admin/hybrid-form/FormTemplateSelector';
import ConsultationTimeline from '@/components/admin/ConsultationTimeline';
import type { SmartFormTemplate, HybridFormData } from '@/types/smart-forms';
import { hybridFormDataToText } from '@/types/smart-forms';
import { useConsultationRealtime } from '@/hooks/useConsultationRealtime';
import { useBrowserNotification } from '@/hooks/useBrowserNotification';
import { useCallbackChecker } from '@/hooks/useCallbackChecker';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  CONSULTATION_STATUS_LABELS,
  PROCEDURE_TAG_OPTIONS,
  BUDGET_RANGE_OPTIONS,
} from '@/types/admin';
import type { LeadStatus } from '@/types/admin';
import type { Database } from '@/types/supabase';

const PAGE_SIZE = 20;

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'callback_scheduled', label: '콜백 예정' },
  { key: 'no_answer', label: '부재중' },
  { key: 're_contact', label: '재연락' },
  { key: 'reservation_confirmed', label: '예약확정' },
  { key: 'no_show', label: '노쇼' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
];

export default function ConsultationsPage() {
  const supabase = createClient();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [todayCallbackOnly, setTodayCallbackOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Inline edit states
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Smart Form states
  const [smartFormTemplate, setSmartFormTemplate] = useState<SmartFormTemplate | null>(null);
  const [smartFormMode, setSmartFormMode] = useState<'selector' | 'form' | 'legacy'>('selector');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState(false);

  // Unique assignees for filter
  const [assignees, setAssignees] = useState<string[]>([]);

  // Realtime & Notification
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);
  const { requestPermission, showNotification } = useBrowserNotification();

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('consultation_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
    }

    if (assigneeFilter !== 'all') {
      query = query.eq('assignee', assigneeFilter);
    }

    if (todayCallbackOnly) {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .gte('next_followup_at', `${today}T00:00:00`)
        .lte('next_followup_at', `${today}T23:59:59`);
    }

    const { data, count } = await query;
    setConsultations(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [statusFilter, searchQuery, assigneeFilter, todayCallbackOnly, page, supabase]);

  // Realtime subscription
  useConsultationRealtime({
    onInsert: (row) => {
      setConsultations((prev) => [row, ...prev]);
      setTotal((prev) => prev + 1);
      showNotification('새 상담 접수', {
        body: `${row.name} - ${row.treatment_type}`,
        tag: `consultation-${row.id}`,
      });
      setToast({ message: `새 상담: ${row.name} (${row.treatment_type})`, type: 'info' });
      setTimeout(() => setToast(null), 5000);
    },
    onUpdate: (row) => {
      setConsultations((prev) =>
        prev.map((c) => (c.id === row.id ? row : c))
      );
    },
    onDelete: (id) => {
      setConsultations((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    },
  });

  // Callback checker - alerts when scheduled callbacks are due
  useCallbackChecker(consultations, (c) => {
    showNotification('콜백 알림', {
      body: `${c.name} - ${c.treatment_type} 콜백 시간입니다`,
      tag: `callback-${c.id}`,
    });
    setToast({ message: `콜백 시간: ${c.name} (${c.treatment_type})`, type: 'warning' });
    setTimeout(() => setToast(null), 8000);
  });

  // Request notification permission on mount
  useEffect(() => {
    requestPermission().then(setNotificationsEnabled);
  }, [requestPermission]);

  // Fetch unique assignees on mount
  useEffect(() => {
    const fetchAssignees = async () => {
      const { data } = await supabase
        .from('consultation_requests')
        .select('assignee')
        .not('assignee', 'is', null)
        .not('assignee', 'eq', '');
      if (data) {
        const unique = [...new Set(data.map((d) => d.assignee).filter(Boolean))] as string[];
        setAssignees(unique);
      }
    };
    fetchAssignees();
  }, [supabase]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // 감사로그 기록
  const logAudit = async (action: string, target: string, detail: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        user_name: user?.email?.split('@')[0] || 'admin',
        action,
        target,
        detail,
      });
    } catch {
      // 감사로그 실패 시 무시 (핵심 기능에 영향 없도록)
    }
  };

  const updateField = async (id: string, field: string, value: unknown) => {
    const target = consultations.find((c) => c.id === id);
    await supabase
      .from('consultation_requests')
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['consultation_requests']['Update'])
      .eq('id', id);
    setEditingField(null);
    if (target) {
      logAudit('update', `상담 - ${target.name}`, `${field} 변경`);
    }
    fetchConsultations();
  };

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    const target = consultations.find((c) => c.id === id);
    const oldStatus = target?.status || '';
    const updateData: Database['public']['Tables']['consultation_requests']['Update'] = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'completed' || newStatus === 'reservation_confirmed') {
      updateData.contacted_at = new Date().toISOString();
    }
    await supabase.from('consultation_requests').update(updateData).eq('id', id);
    if (target) {
      const oldLabel = CONSULTATION_STATUS_LABELS[oldStatus] || oldStatus;
      const newLabel = CONSULTATION_STATUS_LABELS[newStatus] || newStatus;
      logAudit('update', `상담 - ${target.name}`, `상태 변경: ${oldLabel} → ${newLabel}`);
      // Record timeline
      fetch(`/api/admin/consultations/${id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'status_change',
          description: `${oldLabel} → ${newLabel}`,
          actor: 'admin',
          oldValue: oldStatus,
          newValue: newStatus,
        }),
      }).catch(() => {});
    }
    fetchConsultations();
  };

  const downloadCSV = () => {
    const headers = ['이름', '전화번호', '이메일', '시술', '관심시술', '담당자', '다음연락', '상태', '메모', '접수일', '출처'];
    const rows = consultations.map((c) => [
      c.name,
      c.phone,
      c.email || '',
      c.treatment_type,
      (c.procedure_tags || []).join('; '),
      c.assignee || '',
      c.next_followup_at ? new Date(c.next_followup_at).toLocaleString('ko-KR') : '',
      CONSULTATION_STATUS_LABELS[c.status] || c.status,
      (c.notes || '').replace(/,/g, '\uFF0C').replace(/\n/g, ' '),
      new Date(c.created_at).toLocaleString('ko-KR'),
      c.source || 'website',
    ]);

    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === consultations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(consultations.map((c) => c.id)));
    }
  };

  const bulkUpdateStatus = async (newStatus: LeadStatus) => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    await supabase
      .from('consultation_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() } as Database['public']['Tables']['consultation_requests']['Update'])
      .in('id', ids);
    const newLabel = CONSULTATION_STATUS_LABELS[newStatus] || newStatus;
    logAudit('update', `상담 ${ids.length}건`, `벌크 상태 변경 → ${newLabel}`);
    setSelectedIds(new Set());
    setBulkAction(false);
    fetchConsultations();
  };

  const bulkUpdateAssignee = async (assignee: string) => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    await supabase
      .from('consultation_requests')
      .update({ assignee, updated_at: new Date().toISOString() } as Database['public']['Tables']['consultation_requests']['Update'])
      .in('id', ids);
    logAudit('update', `상담 ${ids.length}건`, `벌크 담당자 배정: ${assignee}`);
    setSelectedIds(new Set());
    setBulkAction(false);
    fetchConsultations();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatFollowupTime = (dt: string | null) => {
    if (!dt) return null;
    const d = new Date(dt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm animate-pulse ${
          toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-[#6d4e42] text-white'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-3 text-white/70 hover:text-white cursor-pointer">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">상담관리</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const enabled = await requestPermission();
              setNotificationsEnabled(enabled);
            }}
            className={`px-3 py-1.5 lg:py-2 text-xs lg:text-sm rounded-lg border transition-colors cursor-pointer ${
              notificationsEnabled
                ? 'bg-[#b4988d] text-white border-[#b4988d]'
                : 'bg-white text-[#575756] border-[#e5e5e5] hover:bg-[#f6f6f6]'
            }`}
            title={notificationsEnabled ? '알림 활성화됨' : '알림 허용 필요'}
          >
            🔔 {notificationsEnabled ? '알림 ON' : '알림 OFF'}
          </button>
          <button
            onClick={downloadCSV}
            className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
          >
            CSV 다운로드
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-3 lg:p-4 mb-4">
        {/* Status tabs - scrollable */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
              className={`px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-[#b4988d] text-white'
                  : 'text-[#8a8a8a] hover:bg-[#f6f6f6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 lg:gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="이름 또는 전화번호 검색"
            className="px-3 py-2 lg:py-1.5 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4988d] sm:flex-1 sm:min-w-[180px]"
          />
          <div className="flex items-center gap-2">
            <select
              value={assigneeFilter}
              onChange={(e) => { setAssigneeFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 lg:py-1.5 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4988d] cursor-pointer flex-1 sm:flex-none"
            >
              <option value="all">담당자 전체</option>
              {assignees.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-[#575756] cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={todayCallbackOnly}
                onChange={(e) => { setTodayCallbackOnly(e.target.checked); setPage(0); }}
                className="rounded border-[#e5e5e5] accent-[#b4988d]"
              />
              오늘 콜백만
            </label>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#6d4e42] text-white rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{selectedIds.size}건 선택</span>
          <div className="flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => { if (e.target.value) bulkUpdateStatus(e.target.value as LeadStatus); e.target.value = ''; }}
              className="text-xs px-2 py-1.5 rounded-lg bg-white/20 text-white border-0 cursor-pointer"
            >
              <option value="" disabled>상태 일괄 변경</option>
              {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k} className="text-[#575756]">{v}</option>
              ))}
            </select>
            {!bulkAction ? (
              <button
                onClick={() => setBulkAction(true)}
                className="text-xs px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors cursor-pointer"
              >
                담당자 배정
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="담당자명"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                      bulkUpdateAssignee((e.target as HTMLInputElement).value.trim());
                    }
                    if (e.key === 'Escape') setBulkAction(false);
                  }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-white text-[#575756] w-24"
                />
                <button onClick={() => setBulkAction(false)} className="text-xs px-2 py-1.5 cursor-pointer hover:bg-white/20 rounded">
                  취소
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs px-3 py-1.5 border border-white/30 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-auto"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">로딩중...</div>
        ) : consultations.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">상담 내역이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => (
              <div key={c.id} className={`bg-white rounded-xl border overflow-hidden ${selectedIds.has(c.id) ? 'border-[#b4988d] ring-1 ring-[#b4988d]/30' : 'border-[#e5e5e5]'}`}>
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(c.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-[#e5e5e5] accent-[#b4988d] shrink-0"
                      />
                      <span className={`inline-block transition-transform text-xs text-[#8a8a8a] ${expandedId === c.id ? 'rotate-90' : ''}`}>&#9654;</span>
                      <span className="font-medium text-sm">
                        {c.name}
                        {c.message && <span className="ml-1 text-[10px] text-[#b4988d]">&#9679;</span>}
                      </span>
                    </div>
                    <select
                      value={c.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(c.id, e.target.value as LeadStatus); }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${
                        LEAD_STATUS_COLORS[c.status as LeadStatus] || 'bg-gray-100'
                      }`}
                    >
                      {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ml-5 space-y-1 text-xs text-[#8a8a8a]">
                    <p>{c.phone} · {c.treatment_type}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.assignee && <span>담당: {c.assignee}</span>}
                      {c.next_followup_at && (
                        <span className={c.next_followup_at && new Date(c.next_followup_at).toDateString() === new Date().toDateString() ? 'text-blue-600 font-medium' : ''}>
                          다음연락: {formatFollowupTime(c.next_followup_at)}
                        </span>
                      )}
                      <span>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {c.procedure_tags && c.procedure_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.procedure_tags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-[#f6f6f6] rounded text-[#575756]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === c.id && (
                  <div className="border-t border-[#e5e5e5] bg-[#f9f8f7] p-3">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[#8a8a8a] text-xs mb-1">담당자</p>
                          {editingField?.id === c.id && editingField.field === 'assignee' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => updateField(c.id, 'assignee', editValue || null)}
                              onKeyDown={(e) => { if (e.key === 'Enter') updateField(c.id, 'assignee', editValue || null); }}
                              className="w-full px-2 py-1 text-sm border border-[#b4988d] rounded"
                              autoFocus
                            />
                          ) : (
                            <p
                              className="text-[#575756] cursor-pointer hover:text-[#b4988d]"
                              onClick={() => { setEditingField({ id: c.id, field: 'assignee' }); setEditValue(c.assignee || ''); }}
                            >
                              {c.assignee || <span className="text-[#c0c0c0]">클릭하여 배정</span>}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-[#8a8a8a] text-xs mb-1">다음 연락</p>
                          {editingField?.id === c.id && editingField.field === 'next_followup_at' ? (
                            <input
                              type="datetime-local"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => updateField(c.id, 'next_followup_at', editValue ? new Date(editValue).toISOString() : null)}
                              className="w-full px-2 py-1 text-sm border border-[#b4988d] rounded"
                              autoFocus
                            />
                          ) : (
                            <p
                              className="text-[#575756] cursor-pointer hover:text-[#b4988d]"
                              onClick={() => { setEditingField({ id: c.id, field: 'next_followup_at' }); setEditValue(c.next_followup_at ? new Date(c.next_followup_at).toISOString().slice(0, 16) : ''); }}
                            >
                              {formatFollowupTime(c.next_followup_at) || <span className="text-[#c0c0c0]">클릭하여 설정</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[#8a8a8a] text-xs mb-1">이메일</p>
                          <p className="text-[#575756] text-sm">{c.email || <span className="text-[#c0c0c0]">-</span>}</p>
                        </div>
                        <div>
                          <p className="text-[#8a8a8a] text-xs mb-1">예상 예산</p>
                          {editingField?.id === c.id && editingField.field === 'budget_range' ? (
                            <select
                              value={editValue}
                              onChange={(e) => { setEditValue(e.target.value); updateField(c.id, 'budget_range', e.target.value || null); }}
                              className="text-sm border border-[#b4988d] rounded px-2 py-1 w-full"
                              autoFocus
                            >
                              <option value="">미정</option>
                              {BUDGET_RANGE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <p
                              className="text-[#575756] cursor-pointer hover:text-[#b4988d]"
                              onClick={() => { setEditingField({ id: c.id, field: 'budget_range' }); setEditValue(c.budget_range || ''); }}
                            >
                              {c.budget_range || <span className="text-[#c0c0c0]">클릭하여 설정</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[#8a8a8a] text-xs mb-1">문의 내용</p>
                        <p className="text-[#575756] whitespace-pre-wrap bg-white rounded-lg p-2.5 border border-[#e5e5e5] text-sm">
                          {c.message || <span className="text-[#c0c0c0]">문의 내용 없음</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#8a8a8a] text-xs mb-1">메모</p>
                        {editingField?.id === c.id && editingField.field === 'notes' ? (
                          <div>
                            {smartFormMode === 'selector' && (
                              <div className="mb-2">
                                <p className="text-xs text-[#a09080] mb-2">양식을 선택하세요</p>
                                <FormTemplateSelector
                                  categories={['consultation', 'quickNote']}
                                  onSelect={(t) => { setSmartFormTemplate(t); setSmartFormMode('form'); }}
                                  onFreeInput={() => setSmartFormMode('legacy')}
                                  compact
                                />
                              </div>
                            )}
                            {smartFormMode === 'form' && smartFormTemplate && (
                              <HybridForm
                                template={smartFormTemplate}
                                initialData={{ patientName: c.name }}
                                onSubmit={(_data, textOutput) => {
                                  updateField(c.id, 'notes', (c.notes ? c.notes + '\n\n' : '') + textOutput);
                                  setSmartFormMode('selector');
                                  setSmartFormTemplate(null);
                                }}
                                onCancel={() => { setSmartFormMode('selector'); setSmartFormTemplate(null); }}
                                compact
                              />
                            )}
                            {smartFormMode === 'legacy' && (
                              <>
                                <VoiceNoteInput
                                  value={editValue}
                                  onChange={setEditValue}
                                  availableTemplates={['consultation', 'quickNote']}
                                  placeholder="클릭하여 메모 추가 (음성 입력 가능)"
                                  rows={3}
                                />
                                <div className="flex gap-2 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateField(c.id, 'notes', editValue)}
                                    className="px-3 py-1 text-xs bg-[#6d4e42] text-white rounded-lg hover:bg-[#5a3d33] transition-colors cursor-pointer"
                                  >
                                    저장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setSmartFormMode('selector'); }}
                                    className="px-3 py-1 text-xs bg-white border border-[#e5e5e5] text-[#8a8a8a] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                                  >
                                    양식 선택
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingField(null)}
                                    className="px-3 py-1 text-xs bg-white border border-[#e5e5e5] text-[#8a8a8a] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                                  >
                                    취소
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <p
                            className="text-[#575756] whitespace-pre-wrap bg-white rounded-lg p-2.5 border border-[#e5e5e5] cursor-pointer hover:border-[#b4988d] min-h-[40px] text-sm"
                            onClick={() => { setEditingField({ id: c.id, field: 'notes' }); setEditValue(c.notes || ''); setSmartFormMode('selector'); setSmartFormTemplate(null); }}
                          >
                            {c.notes || <span className="text-[#c0c0c0]">클릭하여 메모 추가</span>}
                          </p>
                        )}
                      </div>
                      {/* Timeline */}
                      <ConsultationTimeline consultationId={c.id} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8a8a8a]">로딩중...</div>
        ) : consultations.length === 0 ? (
          <div className="p-8 text-center text-[#8a8a8a]">상담 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                  <th className="w-8 py-3 px-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === consultations.length && consultations.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#e5e5e5] accent-[#b4988d]"
                    />
                  </th>
                  <th className="w-8 py-3 px-2"></th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">이름</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">전화번호</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">관심 시술</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">담당자</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">다음 연락</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">상태</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">접수일</th>
                  <th className="text-left py-3 px-3 text-[#8a8a8a] font-medium">출처</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c) => (
                  <Fragment key={c.id}>
                    <tr
                      className={`border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] cursor-pointer ${expandedId === c.id ? 'bg-[#fafafa]' : ''} ${selectedIds.has(c.id) ? 'bg-[#b4988d]/5' : ''}`}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border-[#e5e5e5] accent-[#b4988d]"
                        />
                      </td>
                      <td className="py-3 px-2 text-center text-[#8a8a8a]">
                        <span className={`inline-block transition-transform text-xs ${expandedId === c.id ? 'rotate-90' : ''}`}>&#9654;</span>
                      </td>
                      <td className="py-3 px-3 font-medium whitespace-nowrap">
                        {c.name}
                        {c.message && <span className="ml-1 text-[10px] text-[#b4988d]" title="문의내용 있음">&#9679;</span>}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">{c.phone}</td>
                      <td className="py-3 px-3">
                        {c.procedure_tags && c.procedure_tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.procedure_tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 bg-[#f6f6f6] rounded text-[#575756]">{tag}</span>
                            ))}
                            {c.procedure_tags.length > 2 && (
                              <span className="text-xs text-[#8a8a8a]">+{c.procedure_tags.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#c0c0c0]">{c.treatment_type || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingField?.id === c.id && editingField.field === 'assignee' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => updateField(c.id, 'assignee', editValue || null)}
                            onKeyDown={(e) => { if (e.key === 'Enter') updateField(c.id, 'assignee', editValue || null); }}
                            className="w-20 px-1.5 py-0.5 text-xs border border-[#b4988d] rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={(e) => { e.stopPropagation(); setEditingField({ id: c.id, field: 'assignee' }); setEditValue(c.assignee || ''); }}
                            className="text-xs cursor-pointer hover:text-[#b4988d]"
                            title="클릭하여 수정"
                          >
                            {c.assignee || <span className="text-[#c0c0c0]">배정</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingField?.id === c.id && editingField.field === 'next_followup_at' ? (
                          <input
                            type="datetime-local"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => updateField(c.id, 'next_followup_at', editValue ? new Date(editValue).toISOString() : null)}
                            className="px-1.5 py-0.5 text-xs border border-[#b4988d] rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingField({ id: c.id, field: 'next_followup_at' });
                              setEditValue(c.next_followup_at ? new Date(c.next_followup_at).toISOString().slice(0, 16) : '');
                            }}
                            className={`text-xs cursor-pointer hover:text-[#b4988d] ${
                              c.next_followup_at && new Date(c.next_followup_at).toDateString() === new Date().toDateString()
                                ? 'text-blue-600 font-medium'
                                : ''
                            }`}
                            title="클릭하여 수정"
                          >
                            {formatFollowupTime(c.next_followup_at) || <span className="text-[#c0c0c0]">설정</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={(e) => updateStatus(c.id, e.target.value as LeadStatus)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${
                            LEAD_STATUS_COLORS[c.status as LeadStatus] || 'bg-gray-100'
                          }`}
                        >
                          {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-[#8a8a8a] whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-3 text-[#8a8a8a]">{c.source || 'website'}</td>
                    </tr>

                    {/* Expanded detail panel */}
                    {expandedId === c.id && (
                      <tr className="bg-[#f9f8f7] border-b border-[#f0f0f0]">
                        <td colSpan={10} className="py-4 px-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {/* Row 1 */}
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">이메일</p>
                              <p className="text-[#575756]">{c.email || <span className="text-[#c0c0c0]">-</span>}</p>
                            </div>
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">희망 일시</p>
                              <p className="text-[#575756]">
                                {c.preferred_date || c.preferred_time
                                  ? `${c.preferred_date || ''} ${c.preferred_time || ''}`.trim()
                                  : <span className="text-[#c0c0c0]">-</span>
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">예상 예산</p>
                              {editingField?.id === c.id && editingField.field === 'budget_range' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => { setEditValue(e.target.value); updateField(c.id, 'budget_range', e.target.value || null); }}
                                  className="text-sm border border-[#b4988d] rounded px-2 py-1"
                                  autoFocus
                                >
                                  <option value="">미정</option>
                                  {BUDGET_RANGE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <p
                                  className="text-[#575756] cursor-pointer hover:text-[#b4988d]"
                                  onClick={() => { setEditingField({ id: c.id, field: 'budget_range' }); setEditValue(c.budget_range || ''); }}
                                >
                                  {c.budget_range || <span className="text-[#c0c0c0]">클릭하여 설정</span>}
                                </p>
                              )}
                            </div>

                            {/* Row 2 */}
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">내원 가능 요일</p>
                              {editingField?.id === c.id && editingField.field === 'availability' ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => updateField(c.id, 'availability', editValue || null)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') updateField(c.id, 'availability', editValue || null); }}
                                  placeholder="예: 화, 목, 토"
                                  className="text-sm border border-[#b4988d] rounded px-2 py-1 w-full"
                                  autoFocus
                                />
                              ) : (
                                <p
                                  className="text-[#575756] cursor-pointer hover:text-[#b4988d]"
                                  onClick={() => { setEditingField({ id: c.id, field: 'availability' }); setEditValue(c.availability || ''); }}
                                >
                                  {c.availability || <span className="text-[#c0c0c0]">클릭하여 설정</span>}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">연락 결과</p>
                              {editingField?.id === c.id && editingField.field === 'followup_outcome' ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => updateField(c.id, 'followup_outcome', editValue || null)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') updateField(c.id, 'followup_outcome', editValue || null); }}
                                  className="text-sm border border-[#b4988d] rounded px-2 py-1 w-full"
                                  autoFocus
                                />
                              ) : (
                                <p
                                  className="text-[#575756] cursor-pointer hover:text-[#b4988d]"
                                  onClick={() => { setEditingField({ id: c.id, field: 'followup_outcome' }); setEditValue(c.followup_outcome || ''); }}
                                >
                                  {c.followup_outcome || <span className="text-[#c0c0c0]">클릭하여 입력</span>}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">관심 시술 태그</p>
                              <div className="flex flex-wrap gap-1">
                                {(c.procedure_tags || []).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 bg-[#b4988d]/10 text-[#6d4e42] rounded-full cursor-pointer hover:bg-red-50 hover:text-red-500"
                                    title="클릭하여 제거"
                                    onClick={() => updateField(c.id, 'procedure_tags', (c.procedure_tags || []).filter((t) => t !== tag))}
                                  >
                                    {tag} &times;
                                  </span>
                                ))}
                                <select
                                  onChange={(e) => {
                                    if (e.target.value && !(c.procedure_tags || []).includes(e.target.value)) {
                                      updateField(c.id, 'procedure_tags', [...(c.procedure_tags || []), e.target.value]);
                                    }
                                    e.target.value = '';
                                  }}
                                  className="text-xs px-1.5 py-0.5 border border-dashed border-[#e5e5e5] rounded text-[#8a8a8a] cursor-pointer"
                                  defaultValue=""
                                >
                                  <option value="" disabled>+ 추가</option>
                                  {PROCEDURE_TAG_OPTIONS.filter((opt) => !(c.procedure_tags || []).includes(opt)).map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Row 3 - Full width */}
                            <div className="md:col-span-2">
                              <p className="text-[#8a8a8a] text-xs mb-1">문의 내용</p>
                              <p className="text-[#575756] whitespace-pre-wrap bg-white rounded-lg p-3 border border-[#e5e5e5]">
                                {c.message || <span className="text-[#c0c0c0]">문의 내용 없음</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#8a8a8a] text-xs mb-1">메모</p>
                              {editingField?.id === c.id && editingField.field === 'notes' ? (
                                <div>
                                  {smartFormMode === 'selector' && (
                                    <div className="mb-2">
                                      <p className="text-xs text-[#a09080] mb-2">양식을 선택하세요</p>
                                      <FormTemplateSelector
                                        categories={['consultation', 'quickNote']}
                                        onSelect={(t) => { setSmartFormTemplate(t); setSmartFormMode('form'); }}
                                        onFreeInput={() => setSmartFormMode('legacy')}
                                        compact
                                      />
                                    </div>
                                  )}
                                  {smartFormMode === 'form' && smartFormTemplate && (
                                    <HybridForm
                                      template={smartFormTemplate}
                                      initialData={{ patientName: c.name }}
                                      onSubmit={(_data, textOutput) => {
                                        updateField(c.id, 'notes', (c.notes ? c.notes + '\n\n' : '') + textOutput);
                                        setSmartFormMode('selector');
                                        setSmartFormTemplate(null);
                                      }}
                                      onCancel={() => { setSmartFormMode('selector'); setSmartFormTemplate(null); }}
                                      compact
                                    />
                                  )}
                                  {smartFormMode === 'legacy' && (
                                    <>
                                      <VoiceNoteInput
                                        value={editValue}
                                        onChange={setEditValue}
                                        availableTemplates={['consultation', 'quickNote']}
                                        placeholder="클릭하여 메모 추가 (음성 입력 가능)"
                                        rows={4}
                                      />
                                      <div className="flex gap-2 mt-1.5">
                                        <button
                                          type="button"
                                          onClick={() => updateField(c.id, 'notes', editValue)}
                                          className="px-3 py-1 text-xs bg-[#6d4e42] text-white rounded-lg hover:bg-[#5a3d33] transition-colors cursor-pointer"
                                        >
                                          저장
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { setSmartFormMode('selector'); }}
                                          className="px-3 py-1 text-xs bg-white border border-[#e5e5e5] text-[#8a8a8a] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                                        >
                                          양식 선택
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingField(null)}
                                          className="px-3 py-1 text-xs bg-white border border-[#e5e5e5] text-[#8a8a8a] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                                        >
                                          취소
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p
                                  className="text-[#575756] whitespace-pre-wrap bg-white rounded-lg p-3 border border-[#e5e5e5] cursor-pointer hover:border-[#b4988d] min-h-[50px]"
                                  onClick={() => { setEditingField({ id: c.id, field: 'notes' }); setEditValue(c.notes || ''); setSmartFormMode('selector'); setSmartFormTemplate(null); }}
                                >
                                  {c.notes || <span className="text-[#c0c0c0]">클릭하여 메모 추가</span>}
                                </p>
                              )}
                            </div>
                            {/* Timeline */}
                            <div className="md:col-span-3">
                              <ConsultationTimeline consultationId={c.id} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 lg:px-4 py-3 mt-3 lg:mt-0 bg-white rounded-xl lg:rounded-none border border-[#e5e5e5] lg:border-t lg:border-x-0 lg:border-b-0">
          <p className="text-xs lg:text-sm text-[#8a8a8a]">
            총 {total}건 ({page + 1}/{totalPages})
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-sm border border-[#e5e5e5] rounded hover:bg-[#f6f6f6] disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              이전
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm border border-[#e5e5e5] rounded hover:bg-[#f6f6f6] disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
