'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { BeforeAfterRow } from '@/types/admin';

export default function BeforeAfterAdminPage() {
  const supabase = createClient();
  const [items, setItems] = useState<BeforeAfterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BeforeAfterRow | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('before_after')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.category.toLowerCase().includes(q) ||
        i.title_ko.toLowerCase().includes(q) ||
        (i.title_en && i.title_en.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, search, categoryFilter]);

  const handleToggleVisible = async (row: BeforeAfterRow) => {
    setTogglingId(row.id);
    await supabase
      .from('before_after')
      .update({ is_visible: !row.is_visible })
      .eq('id', row.id);
    await fetchItems();
    setTogglingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Delete image from storage first
    if (deleteTarget.image_url) {
      try {
        const url = new URL(deleteTarget.image_url);
        const parts = url.pathname.split(`/storage/v1/object/public/before-after/`);
        if (parts[1]) {
          await supabase.storage.from('before-after').remove([parts[1]]);
        }
      } catch (e) {
        console.warn('Storage delete failed:', e);
      }
    }
    await supabase.from('before_after').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-[#6d4e42]">전후사진관리</h2>
        <Link
          href="/admin/before-after/new"
          className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] transition-colors"
        >
          + 새 전후사진
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        >
          <option value="all">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="카테고리/제목 검색..."
          className="flex-1 max-w-sm border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
        />
        <span className="text-sm text-[#8a8a8a]">{filtered.length}개</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">로딩중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center text-[#8a8a8a]">
          {search || categoryFilter !== 'all' ? '검색 결과가 없습니다.' : '등록된 전후사진이 없습니다.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((row) => (
            <div key={row.id} className="bg-white rounded-xl border border-[#e5e5e5] p-3 lg:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="relative shrink-0 w-full sm:w-40 aspect-[2/1] rounded-lg overflow-hidden bg-[#f6f6f6]">
                <Image
                  src={row.image_url}
                  alt={row.title_ko || row.category}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 160px, 100vw"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#b4988d]/10 text-[#6d4e42] font-medium">
                    {row.category}
                  </span>
                  {!row.is_visible && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                      비공개
                    </span>
                  )}
                  <span className="text-xs text-[#8a8a8a]">정렬 #{row.sort_order}</span>
                </div>
                <h3 className="font-medium text-sm text-[#6d4e42] truncate">
                  {row.title_ko || <span className="text-[#b4b4b4]">제목 없음</span>}
                </h3>
                <p className="text-xs text-[#8a8a8a] mt-0.5">
                  등록: {new Date(row.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggleVisible(row)}
                  disabled={togglingId === row.id}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-[#e5e5e5] text-[#575756] rounded-lg hover:bg-[#f6f6f6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {togglingId === row.id ? '...' : row.is_visible ? '비공개로' : '공개로'}
                </button>
                <Link
                  href={`/admin/before-after/${row.id}/edit`}
                  className="flex-1 sm:flex-none text-center px-3 py-1.5 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] transition-colors"
                >
                  수정
                </Link>
                <button
                  onClick={() => setDeleteTarget(row)}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="전후사진 삭제"
        message="이 전후사진을 삭제하시겠습니까? Storage의 이미지도 함께 삭제됩니다. 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
