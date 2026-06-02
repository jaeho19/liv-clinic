'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { PopupRow } from '@/types/admin';
import { getPopupStatus } from '@/types/admin';

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-green-100 text-green-700' },
  scheduled: { label: '예정', color: 'bg-blue-100 text-blue-700' },
  ended: { label: '종료', color: 'bg-gray-100 text-gray-500' },
  disabled: { label: '비활성', color: 'bg-red-100 text-red-500' },
};

export default function PopupsAdminPage() {
  const [popups, setPopups] = useState<PopupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/popups');
      if (res.ok) {
        const data = await res.json();
        setPopups(data ?? []);
      }
    } catch {
      // fetch error
    }
    setLoading(false);
  };

  useEffect(() => { fetchPopups(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/popups/${deleteTarget}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchPopups();
  };

  const toggleActive = async (popup: PopupRow) => {
    await fetch(`/api/admin/popups/${popup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !popup.is_active }),
    });
    fetchPopups();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">팝업관리</h2>
        <Link
          href="/admin/popups/new"
          className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors"
        >
          + 새 팝업
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">로딩중...</div>
      ) : popups.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">
          등록된 팝업이 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {popups.map((popup) => {
            const status = getPopupStatus(popup);
            const badge = STATUS_BADGES[status];
            return (
              <div key={popup.id} className="relative bg-white rounded-xl border border-[#e5e5e5] p-3 lg:p-4">
                <div className="flex items-start gap-3 lg:gap-4">
                  {popup.image_url ? (
                    <img
                      src={popup.image_url}
                      alt={popup.title}
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border border-[#e5e5e5]"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#f6f6f6] rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0">
                      🪟
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm lg:text-base text-[#6d4e42] truncate">{popup.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#8a8a8a]">
                      {new Date(popup.display_start).toLocaleDateString('ko-KR')} ~ {new Date(popup.display_end).toLocaleDateString('ko-KR')}
                      {!popup.show_on_mobile && ' · 모바일 숨김'}
                      {` · 롤링 ${Math.round((popup.rolling_interval_ms ?? 5000) / 1000)}초`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 lg:mt-0 lg:absolute lg:right-4 lg:top-1/2 lg:-translate-y-1/2">
                  <button
                    onClick={() => toggleActive(popup)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-sm border rounded-lg transition-colors cursor-pointer ${
                      popup.is_active
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {popup.is_active ? '비활성화' : '활성화'}
                  </button>
                  <Link
                    href={`/admin/popups/${popup.id}/edit`}
                    className="flex-1 sm:flex-none text-center px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(popup.id)}
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
        title="팝업 삭제"
        message="이 팝업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
