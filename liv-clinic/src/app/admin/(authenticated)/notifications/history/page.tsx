'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { NotificationHistoryRow, PatientTreatmentRow, NotificationChannel, NotificationSendStatus } from '@/types/admin';
import { NOTIFICATION_CHANNEL_LABELS, NOTIFICATION_STATUS_LABELS, NOTIFICATION_STATUS_COLORS } from '@/types/admin';

interface HistoryItem extends NotificationHistoryRow {
  patient_treatments: PatientTreatmentRow | null;
}

export default function NotificationHistoryPage() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const limit = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (channelFilter) params.set('channel', channelFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await fetch(`/api/admin/notifications/history?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setTotal(json.total || 0);
      }
    } finally { setLoading(false); }
  }, [page, channelFilter, statusFilter, startDate, endDate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleExportCSV = useCallback(() => {
    if (data.length === 0) return;
    const header = '환자명,전화번호,시술,채널,상태,담당자,발송일시,메모';
    const rows = data.map((h) =>
      `"${h.patient_treatments?.patient_name || '-'}","${h.patient_treatments?.phone || '-'}","${h.patient_treatments?.treatment_name || '-'}","${h.channel}","${h.status}","${h.sent_by || '-'}","${new Date(h.sent_at).toLocaleString('ko-KR')}","${(h.notes || '').replace(/"/g, '""')}"`
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((h) =>
      (h.patient_treatments?.patient_name || '').toLowerCase().includes(q) ||
      (h.patient_treatments?.phone || '').includes(q)
    );
  }, [data, search]);

  const totalPages = Math.ceil(total / limit);

  const maskPhone = (phone: string) => {
    if (phone.length >= 8) return phone.slice(0, -4) + '****';
    return phone;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications" className="text-[#8a8a8a] hover:text-[#6d4e42] text-sm">&larr; 알림관리</Link>
          <h2 className="text-xl font-bold text-[#6d4e42]">발송 이력</h2>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="환자명 검색..."
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d] w-40"
        />
        <select className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={channelFilter} onChange={e => { setChannelFilter(e.target.value); setPage(1); }}>
          <option value="">전체 채널</option>
          <option value="kakao">카카오톡</option>
          <option value="sms">문자</option>
          <option value="call">전화</option>
        </select>
        <select className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">전체 상태</option>
          <option value="sent">발송완료</option>
          <option value="failed">실패</option>
          <option value="skipped">건너뜀</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        />
        <span className="text-xs text-[#8a8a8a] flex items-center">~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-[#8a8a8a]">총 {total}건</span>
          <button
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="px-3 py-2 text-xs border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      {/* 이력 테이블 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#8a8a8a]">불러오는 중...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8a8a8a]">{search ? '검색 결과가 없습니다.' : '발송 이력이 없습니다.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa]">
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">환자명</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">전화번호</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">시술</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">채널</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">상태</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">담당자</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">발송일시</th>
                  <th className="text-left py-3 px-4 text-[#8a8a8a] font-medium">메모</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(h => (
                  <tr key={h.id} className="border-b border-[#f0f0f0] last:border-0">
                    <td className="py-3 px-4 font-medium">{h.patient_treatments?.patient_name || '-'}</td>
                    <td className="py-3 px-4 text-[#8a8a8a]">{h.patient_treatments ? maskPhone(h.patient_treatments.phone) : '-'}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{h.patient_treatments?.treatment_name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">{NOTIFICATION_CHANNEL_LABELS[h.channel as NotificationChannel] || h.channel}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${NOTIFICATION_STATUS_COLORS[h.status as NotificationSendStatus] || 'bg-gray-100 text-gray-500'}`}>
                        {NOTIFICATION_STATUS_LABELS[h.status as NotificationSendStatus] || h.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8a8a8a]">{h.sent_by}</td>
                    <td className="py-3 px-4 text-[#8a8a8a]">{new Date(h.sent_at).toLocaleString('ko-KR')}</td>
                    <td className="py-3 px-4 text-[#8a8a8a] max-w-[200px] truncate">{h.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg disabled:opacity-50">이전</button>
          <span className="px-3 py-1.5 text-sm text-[#8a8a8a]">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg disabled:opacity-50">다음</button>
        </div>
      )}
    </div>
  );
}
