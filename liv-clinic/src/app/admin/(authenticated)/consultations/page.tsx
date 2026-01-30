'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ConsultationRow } from '@/types/admin';
import { CONSULTATION_STATUS_LABELS } from '@/types/admin';
import type { ConsultationStatus } from '@/types/admin';
import type { Database } from '@/types/supabase';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const PAGE_SIZE = 20;

export default function ConsultationsPage() {
  const supabase = createClient();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

    const { data, count } = await query;
    setConsultations(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [statusFilter, searchQuery, page, supabase]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const updateStatus = async (id: string, newStatus: ConsultationStatus) => {
    if (newStatus === 'contacted') {
      await supabase.from('consultation_requests').update({
        status: newStatus,
        contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['consultation_requests']['Update']).eq('id', id);
    } else {
      await supabase.from('consultation_requests').update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['consultation_requests']['Update']).eq('id', id);
    }
    fetchConsultations();
  };

  const saveNotes = async (id: string) => {
    await supabase.from('consultation_requests').update({
      notes: editNotes,
      updated_at: new Date().toISOString(),
    } as Database['public']['Tables']['consultation_requests']['Update']).eq('id', id);
    setEditingId(null);
    fetchConsultations();
  };

  const downloadCSV = () => {
    const headers = ['이름', '전화번호', '이메일', '시술', '희망날짜', '희망시간', '문의내용', '상태', '메모', '접수일', '출처'];
    const rows = consultations.map((c) => [
      c.name,
      c.phone,
      c.email || '',
      c.treatment_type,
      c.preferred_date || '',
      c.preferred_time || '',
      (c.message || '').replace(/,/g, '，').replace(/\n/g, ' '),
      CONSULTATION_STATUS_LABELS[c.status as ConsultationStatus] || c.status,
      (c.notes || '').replace(/,/g, '，'),
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
  const statusTabs: Array<{ key: string; label: string }> = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '대기중' },
    { key: 'contacted', label: '연락완료' },
    { key: 'completed', label: '완료' },
    { key: 'cancelled', label: '취소' },
  ];

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setPage(0); }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#b4988d] text-white'
                    : 'text-[#8a8a8a] hover:bg-[#f6f6f6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="이름 또는 전화번호 검색"
            className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4988d] flex-1 min-w-[200px]"
          />
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
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">이름</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">전화번호</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">시술</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">상태</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">메모</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">접수일</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">출처</th>
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
                      <td className="py-3 px-4 font-medium">
                        {c.name}
                        {c.message && <span className="ml-1 text-[10px] text-[#b4988d]" title="문의내용 있음">&#9679;</span>}
                      </td>
                      <td className="py-3 px-4">{c.phone}</td>
                      <td className="py-3 px-4">{c.treatment_type}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={(e) => updateStatus(c.id, e.target.value as ConsultationStatus)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[c.status] || 'bg-gray-100'}`}
                        >
                          {Object.entries(CONSULTATION_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        {editingId === c.id ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-[#e5e5e5] rounded"
                              autoFocus
                            />
                            <button onClick={() => saveNotes(c.id)} className="text-xs text-[#b4988d] hover:underline cursor-pointer">저장</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-[#8a8a8a] hover:underline cursor-pointer">취소</button>
                          </div>
                        ) : (
                          <span
                            onClick={() => { setEditingId(c.id); setEditNotes(c.notes || ''); }}
                            className="text-xs text-[#8a8a8a] cursor-pointer hover:text-[#575756] truncate block"
                            title="클릭하여 메모 수정"
                          >
                            {c.notes || '메모 추가...'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#8a8a8a] whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-4 text-[#8a8a8a]">{c.source || 'website'}</td>
                    </tr>
                    {expandedId === c.id && (
                      <tr className="bg-[#f9f8f7] border-b border-[#f0f0f0]">
                        <td colSpan={8} className="py-4 px-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                            <div className="md:col-span-2">
                              <p className="text-[#8a8a8a] text-xs mb-1">문의 내용</p>
                              <p className="text-[#575756] whitespace-pre-wrap bg-white rounded-lg p-3 border border-[#e5e5e5]">
                                {c.message || <span className="text-[#c0c0c0]">문의 내용 없음</span>}
                              </p>
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
