'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ConsultationRow } from '@/types/admin';
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

  // Unique assignees for filter
  const [assignees, setAssignees] = useState<string[]>([]);

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

  const updateField = async (id: string, field: string, value: unknown) => {
    await supabase
      .from('consultation_requests')
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['consultation_requests']['Update'])
      .eq('id', id);
    setEditingField(null);
    fetchConsultations();
  };

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    const updateData: Database['public']['Tables']['consultation_requests']['Update'] = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'completed' || newStatus === 'reservation_confirmed') {
      updateData.contacted_at = new Date().toISOString();
    }
    await supabase.from('consultation_requests').update(updateData).eq('id', id);
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#6d4e42]">상담관리</h2>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer"
        >
          CSV 다운로드
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 mb-4">
        {/* Status tabs - scrollable */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="이름 또는 전화번호 검색"
            className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4988d] flex-1 min-w-[180px]"
          />
          <select
            value={assigneeFilter}
            onChange={(e) => { setAssigneeFilter(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4988d] cursor-pointer"
          >
            <option value="all">담당자 전체</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-[#575756] cursor-pointer">
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8a8a8a]">로딩중...</div>
        ) : consultations.length === 0 ? (
          <div className="p-8 text-center text-[#8a8a8a]">상담 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
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
                      className={`border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] cursor-pointer ${expandedId === c.id ? 'bg-[#fafafa]' : ''}`}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
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
                        <td colSpan={9} className="py-4 px-6">
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
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => updateField(c.id, 'notes', editValue)}
                                  className="text-sm border border-[#b4988d] rounded px-2 py-1 w-full h-20 resize-none"
                                  autoFocus
                                />
                              ) : (
                                <p
                                  className="text-[#575756] whitespace-pre-wrap bg-white rounded-lg p-3 border border-[#e5e5e5] cursor-pointer hover:border-[#b4988d] min-h-[50px]"
                                  onClick={() => { setEditingField({ id: c.id, field: 'notes' }); setEditValue(c.notes || ''); }}
                                >
                                  {c.notes || <span className="text-[#c0c0c0]">클릭하여 메모 추가</span>}
                                </p>
                              )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e5e5]">
            <p className="text-sm text-[#8a8a8a]">
              총 {total}건 (페이지 {page + 1}/{totalPages})
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
    </div>
  );
}
