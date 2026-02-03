'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const limit = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (channelFilter) params.set('channel', channelFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/notifications/history?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setTotal(json.total || 0);
      }
    } finally { setLoading(false); }
  }, [page, channelFilter, statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

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
      <div className="flex gap-3 mb-4">
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
        <span className="text-sm text-[#8a8a8a] flex items-center">총 {total}건</span>
      </div>

      {/* 이력 테이블 */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#8a8a8a]">불러오는 중...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8a8a8a]">발송 이력이 없습니다.</div>
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
                {data.map(h => (
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
