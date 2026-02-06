'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { EventRow } from '@/types/admin';
import { EVENT_CATEGORY_LABELS, getEventStatusFromRow } from '@/types/admin';
import type { EventCategory } from '@/types/admin';

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: '진행중', color: 'bg-green-100 text-green-700' },
  ended: { label: '종료', color: 'bg-gray-100 text-gray-500' },
  draft: { label: '임시저장', color: 'bg-amber-100 text-amber-700' },
};

export default function EventsAdminPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter((e) =>
      e.title_ko.toLowerCase().includes(q) ||
      (e.title_en && e.title_en.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q))
    );
  }, [events, search]);

  const handleDuplicate = async (event: EventRow) => {
    setDuplicating(event.id);
    try {
      const { id, created_at, ...rest } = event;
      void id; void created_at;
      const { error } = await supabase.from('events').insert({
        ...rest,
        title_ko: `${event.title_ko} (복사본)`,
        title_en: event.title_en ? `${event.title_en} (Copy)` : event.title_en,
        is_published: false,
      });
      if (!error) await fetchEvents();
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('events').delete().eq('id', deleteTarget);
    setDeleteTarget(null);
    fetchEvents();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">이벤트관리</h2>
        <Link
          href="/admin/events/new"
          className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors"
        >
          + 새 이벤트
        </Link>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이벤트명 검색..."
          className="flex-1 max-w-sm border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        />
        <span className="text-sm text-[#8a8a8a]">{filtered.length}개</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">로딩중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">
          {search ? '검색 결과가 없습니다.' : '등록된 이벤트가 없습니다.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((event) => {
            const status = getEventStatusFromRow(event);
            const badge = STATUS_BADGES[status];
            return (
              <div key={event.id} className="bg-white rounded-xl border border-[#e5e5e5] p-3 lg:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:contents">
                  {event.poster_image ? (
                    <Image
                      src={event.poster_image}
                      alt={event.title_ko}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover shrink-0 w-14 h-14 sm:w-20 sm:h-20"
                      style={{ width: undefined, height: undefined }}
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#f6f6f6] rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0">
                      🎉
                    </div>
                  )}

                  <div className="flex-1 min-w-0 sm:hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-[#6d4e42] truncate">{event.title_ko}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a8a8a]">
                      {EVENT_CATEGORY_LABELS[event.category as EventCategory] || event.category} · {event.start_date} ~ {event.end_date}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[#6d4e42] truncate">{event.title_ko}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8a8a8a]">
                    {EVENT_CATEGORY_LABELS[event.category as EventCategory] || event.category} · {event.start_date} ~ {event.end_date}
                    {event.featured && ' · ⭐ 추천'}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDuplicate(event)}
                    disabled={duplicating === event.id}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-[#e5e5e5] text-[#8a8a8a] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {duplicating === event.id ? '복제중...' : '복제'}
                  </button>
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="flex-1 sm:flex-none text-center px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(event.id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="이벤트 삭제"
        message="이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
