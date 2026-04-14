'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import ImageUploader from './ImageUploader';
import type { BeforeAfterRow } from '@/types/admin';

interface BeforeAfterFormProps {
  record?: BeforeAfterRow;
}

export default function BeforeAfterForm({ record }: BeforeAfterFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!record;

  const [form, setForm] = useState({
    category: record?.category ?? '',
    title_ko: record?.title_ko ?? '',
    title_en: record?.title_en ?? '',
    title_ja: record?.title_ja ?? '',
    title_zh: record?.title_zh ?? '',
    image_url: record?.image_url ?? '',
    sort_order: record?.sort_order ?? 0,
    is_visible: record?.is_visible ?? true,
  });

  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('before_after').select('category');
      if (data) {
        const unique = Array.from(new Set(data.map((d) => d.category).filter(Boolean)));
        setExistingCategories(unique.sort());
      }
    })();
  }, [supabase]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.category.trim()) {
      setError('카테고리는 필수입니다.');
      return;
    }
    if (!form.image_url) {
      setError('이미지는 필수입니다.');
      return;
    }

    const payload = {
      category: form.category.trim(),
      title_ko: form.title_ko,
      title_en: form.title_en,
      title_ja: form.title_ja,
      title_zh: form.title_zh,
      image_url: form.image_url,
      sort_order: form.sort_order,
      is_visible: form.is_visible,
    };

    setSaving(true);

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('before_after')
        .update(payload)
        .eq('id', record.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('before_after').insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push('/admin/before-after');
    router.refresh();
  };

  // Supabase Storage keys allow only ASCII. Hash non-ASCII category to a short hex id
  // so Korean/CJK categories still get a stable folder without exposing raw user input.
  const toAsciiFolder = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return 'uncategorized';
    const asciiOnly = trimmed.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (asciiOnly && /[a-z0-9]/.test(asciiOnly)) return asciiOnly.slice(0, 40);
    // Non-ASCII only: fold to a stable 8-char hash
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = ((hash << 5) - hash + trimmed.charCodeAt(i)) | 0;
    }
    return `cat-${Math.abs(hash).toString(16)}`;
  };
  const folder = toAsciiFolder(form.category);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-[#575756] mb-1.5">
          카테고리 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          list="before-after-categories"
          value={form.category}
          onChange={(e) => updateField('category', e.target.value)}
          className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          placeholder="예: 리프팅, 필러, 보톡스"
          required
        />
        <datalist id="before-after-categories">
          {existingCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {existingCategories.length > 0 && (
          <p className="mt-1 text-xs text-[#8a8a8a]">
            기존 카테고리: {existingCategories.join(', ')}
          </p>
        )}
      </div>

      {/* Titles */}
      <fieldset className="border border-[#e5e5e5] rounded-lg p-4">
        <legend className="text-sm font-medium text-[#575756] px-2">제목 (선택)</legend>
        <div className="grid gap-3">
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1">한국어</label>
            <input
              type="text"
              value={form.title_ko}
              onChange={(e) => updateField('title_ko', e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1">English</label>
            <input
              type="text"
              value={form.title_en}
              onChange={(e) => updateField('title_en', e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1">日本語</label>
              <input
                type="text"
                value={form.title_ja}
                onChange={(e) => updateField('title_ja', e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1">中文</label>
              <input
                type="text"
                value={form.title_zh}
                onChange={(e) => updateField('title_zh', e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Image */}
      <div>
        <ImageUploader
          bucket="before-after"
          folder={folder}
          value={form.image_url || null}
          onChange={(url) => updateField('image_url', url ?? '')}
          label="전후 합본 이미지 (권장: 1200 x 600, 최대 10MB)"
          maxSizeMb={10}
        />
      </div>

      {/* Sort & Visibility */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">정렬 순서</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          />
          <p className="mt-1 text-xs text-[#8a8a8a]">낮을수록 먼저 노출</p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => updateField('is_visible', e.target.checked)}
              className="rounded border-[#e5e5e5]"
            />
            공개 (체크하면 사이트에 노출)
          </label>
        </div>
      </div>

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
