'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { ConsultationRow } from '@/types/admin';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types/admin';
import type { LeadStatus } from '@/types/admin';
import type { Database } from '@/types/supabase';
import Link from 'next/link';

export default function TodayCallbacks() {
  const supabase = createClient();
  const [callbacks, setCallbacks] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCallbacks = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('consultation_requests')
        .select('*')
        .in('status', ['callback_scheduled', 'no_answer', 're_contact'])
        .gte('next_followup_at', `${today}T00:00:00`)
        .lte('next_followup_at', `${today}T23:59:59`)
        .order('next_followup_at', { ascending: true })
        .limit(10);

      setCallbacks(data ?? []);
      setLoading(false);
    };
    fetchCallbacks();
  }, [supabase]);

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    await supabase
      .from('consultation_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        contacted_at: newStatus === 'reservation_confirmed' ? new Date().toISOString() : undefined,
      } as Database['public']['Tables']['consultation_requests']['Update'])
      .eq('id', id);
    setCallbacks((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
        <p className="text-sm text-[#8a8a8a]">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#6d4e42]">오늘 콜백해야 할 목록</h3>
          {callbacks.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
              {callbacks.length}건
            </span>
          )}
        </div>
        <Link href="/admin/consultations" className="text-sm text-[#b4988d] hover:underline">
          전체보기
        </Link>
      </div>

      {callbacks.length === 0 ? (
        <p className="text-sm text-[#8a8a8a] py-2 text-center">오늘 예정된 콜백이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {callbacks.map((c) => {
            const followupTime = c.next_followup_at
              ? new Date(c.next_followup_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '';
            const isPast = c.next_followup_at ? new Date(c.next_followup_at) < new Date() : false;

            return (
              <div
                key={c.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isPast ? 'border-red-200 bg-red-50/50' : 'border-[#e5e5e5] bg-[#fafafa]'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-xs font-mono ${isPast ? 'text-red-500 font-bold' : 'text-blue-600'}`}>
                    {followupTime}
                  </span>
                  <span className="font-medium text-sm truncate">{c.name}</span>
                  <span className="text-xs text-[#8a8a8a]">{c.phone}</span>
                  {c.procedure_tags && c.procedure_tags.length > 0 && (
                    <div className="hidden md:flex gap-1">
                      {c.procedure_tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#f0f0f0] rounded text-[#575756]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {c.assignee && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#b4988d]/10 text-[#6d4e42] rounded">
                      {c.assignee}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${LEAD_STATUS_COLORS[c.status as LeadStatus] || 'bg-gray-100'}`}>
                    {LEAD_STATUS_LABELS[c.status as LeadStatus] || c.status}
                  </span>
                  <button
                    onClick={() => updateStatus(c.id, 'no_answer')}
                    className="text-[10px] px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"
                    title="부재중"
                  >
                    부재
                  </button>
                  <button
                    onClick={() => updateStatus(c.id, 'reservation_confirmed')}
                    className="text-[10px] px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer"
                    title="예약확정"
                  >
                    예약확정
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
