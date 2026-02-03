'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from './ImageUploader';
import type { PopupRow } from '@/types/admin';

interface PopupFormProps {
  popup?: PopupRow;
}

function toLocalDatetimeString(isoString: string) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PopupForm({ popup }: PopupFormProps) {
  const router = useRouter();
  const isEdit = !!popup;

  const [form, setForm] = useState({
    title: popup?.title ?? '',
    image_url: popup?.image_url ?? null,
    link_url: popup?.link_url ?? '',
    link_target: popup?.link_target ?? '_self',
    display_start: popup ? toLocalDatetimeString(popup.display_start) : '',
    display_end: popup ? toLocalDatetimeString(popup.display_end) : '',
    is_active: popup?.is_active ?? true,
    width: popup?.width ?? 480,
    sort_order: popup?.sort_order ?? 0,
    show_on_mobile: popup?.show_on_mobile ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.display_start || !form.display_end) {
      setError('제목, 시작일시, 종료일시는 필수입니다.');
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      display_start: new Date(form.display_start).toISOString(),
      display_end: new Date(form.display_end).toISOString(),
    };

    try {
      const url = isEdit ? `/api/admin/popups/${popup.id}` : '/api/admin/popups';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '저장에 실패했습니다.');
        setSaving(false);
        return;
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setSaving(false);
      return;
    }

    router.push('/admin/popups');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-[#575756] mb-1.5">
          팝업 제목 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          placeholder="예: 1월 신년 이벤트 팝업"
          required
        />
        <p className="text-xs text-[#b4b4b4] mt-1">관리자용 제목입니다. 사이트에는 표시되지 않습니다.</p>
      </div>

      {/* Image */}
      <ImageUploader
        bucket="popups"
        folder={popup?.id ?? 'new'}
        value={form.image_url}
        onChange={(url) => updateField('image_url', url)}
        label="팝업 이미지"
      />

      {/* Link */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#575756] mb-1.5">링크 URL</label>
          <input
            type="url"
            value={form.link_url}
            onChange={(e) => updateField('link_url', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            placeholder="https://..."
          />
          <p className="text-xs text-[#b4b4b4] mt-1">이미지 클릭 시 이동할 URL</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">열기 방식</label>
          <select
            value={form.link_target}
            onChange={(e) => updateField('link_target', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          >
            <option value="_self">현재 창</option>
            <option value="_blank">새 창</option>
          </select>
        </div>
      </div>

      {/* Display Period */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">
            노출 시작 <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.display_start}
            onChange={(e) => updateField('display_start', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">
            노출 종료 <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.display_end}
            onChange={(e) => updateField('display_end', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            required
          />
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">팝업 너비 (px)</label>
          <input
            type="number"
            value={form.width}
            onChange={(e) => updateField('width', parseInt(e.target.value) || 480)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            min={200}
            max={800}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">정렬 순서</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          />
          <p className="text-xs text-[#b4b4b4] mt-1">숫자가 작을수록 먼저 표시됩니다.</p>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField('is_active', e.target.checked)}
            className="rounded border-[#e5e5e5]"
          />
          활성화
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.show_on_mobile}
            onChange={(e) => updateField('show_on_mobile', e.target.checked)}
            className="rounded border-[#e5e5e5]"
          />
          모바일에서도 표시
        </label>
      </div>

      {/* Preview */}
      {form.image_url && (
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-2">미리보기</label>
          <div className="inline-block bg-white rounded-xl shadow-xl border border-[#e5e5e5] overflow-hidden" style={{ width: Math.min(form.width, 400) }}>
            <div className="flex justify-end p-2">
              <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">✕</span>
            </div>
            <img src={form.image_url} alt="Preview" className="w-full" />
            <div className="flex justify-between p-3 border-t border-[#e5e5e5] text-xs text-[#8a8a8a]">
              <span>오늘 하루 보지 않기</span>
              <span>닫기</span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#b4988d] text-white rounded-lg hover:bg-[#a08474] disabled:bg-[#d4c4bb] text-sm font-medium transition-colors cursor-pointer"
        >
          {saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] text-sm transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </form>
  );
}
