'use client';

import { useState, useEffect, useMemo } from 'react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Database } from '@/types/supabase';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];

type FilterKey = 'all' | 'pending' | 'published';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '검토대기' },
  { key: 'published', label: '게시중' },
];

function StarRating({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="text-sm text-[#d9a441]" aria-label={`별점 ${safe}점`}>
      {'★'.repeat(safe)}
      <span className="text-[#e5e5e5]">{'★'.repeat(5 - safe)}</span>
    </span>
  );
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error('후기 목록을 불러오지 못했습니다.');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('fetchReviews failed:', e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'pending') return reviews.filter((r) => !r.is_published);
    if (filter === 'published') return reviews.filter((r) => r.is_published);
    return reviews;
  }, [reviews, filter]);

  const handlePatch = async (row: ReviewRow, patch: { is_published?: boolean; is_verified?: boolean }) => {
    setActionId(row.id);
    try {
      const res = await fetch(`/api/admin/reviews/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('후기 수정에 실패했습니다.');
      await fetchReviews();
    } catch (e) {
      console.error('handlePatch failed:', e);
      alert('작업에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setActionId(target.id);
    try {
      const res = await fetch(`/api/admin/reviews/${target.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('후기 삭제에 실패했습니다.');
      setDeleteTarget(null);
      await fetchReviews();
    } catch (e) {
      console.error('handleDelete failed:', e);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">시술 후기 관리</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[44px] px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
              filter === f.key
                ? 'bg-[#b4988d] text-white border-[#b4988d]'
                : 'border-[#e5e5e5] text-[#575756] hover:bg-[#f6f6f6]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-[#8a8a8a]">{filtered.length}개</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">로딩중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">
          등록된 후기가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((row) => {
            const busy = actionId === row.id;
            return (
              <div key={row.id} className="bg-white rounded-xl border border-[#e5e5e5] p-3 lg:p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-medium text-sm text-[#6d4e42]">{row.author_name}</h3>
                      {row.country && (
                        <span className="text-xs text-[#8a8a8a]">{row.country}</span>
                      )}
                      <StarRating rating={row.rating} />
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#b4988d]/10 text-[#6d4e42] font-medium">
                        {row.treatment_category}
                      </span>
                      {row.source === 'video' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                          영상
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          방문작성
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#f6f6f6] text-[#8a8a8a] uppercase">
                        {row.locale}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          row.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {row.is_published ? '게시중' : '검토대기'}
                      </span>
                      {row.is_verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          치료확인됨
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#575756] line-clamp-2 break-words">{row.content}</p>

                    {row.source === 'video' && row.video_url && (
                      <a
                        href={row.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1.5 text-xs text-[#b4988d] underline break-all hover:text-[#a08474]"
                      >
                        영상 링크 열기
                      </a>
                    )}

                    <p className="text-xs text-[#8a8a8a] mt-1.5">
                      등록: {new Date(row.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-[#f0f0f0]">
                  <button
                    onClick={() => handlePatch(row, { is_published: !row.is_published })}
                    disabled={busy}
                    className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-sm border border-[#e5e5e5] text-[#575756] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {busy ? '...' : row.is_published ? '게시취소' : '게시'}
                  </button>
                  <button
                    onClick={() => handlePatch(row, { is_verified: !row.is_verified })}
                    disabled={busy}
                    className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-sm border border-[#e5e5e5] text-[#575756] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {busy ? '...' : row.is_verified ? '확인해제' : '확인표시'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(row)}
                    disabled={busy}
                    className="flex-1 sm:flex-none min-h-[44px] px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
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
        title="후기 삭제"
        message="이 후기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
