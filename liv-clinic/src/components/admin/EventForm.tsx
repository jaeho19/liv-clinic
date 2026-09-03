'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import ImageUploader from './ImageUploader';
import { finalizeTempImages } from '@/lib/finalizeTempImages';
import { EVENT_CATEGORY_LABELS, RELATED_TREATMENT_OPTIONS } from '@/types/admin';
import type { EventCategory, EventRow } from '@/types/admin';
import type { MonthlyPromotionDraft } from '@/lib/monthlyPromotionTemplate';

interface EventFormProps {
  event?: EventRow;
  /** 신규 등록 시 미리 채울 값 (매달 프로모션 템플릿 등) — 수정 모드에서는 무시된다. */
  defaults?: Partial<MonthlyPromotionDraft>;
}

const GALLERY_FIELDS = [
  { key: 'gallery_images', label: '갤러리 이미지 (한국어·기본)' },
  { key: 'gallery_images_en', label: '갤러리 이미지 (English)' },
  { key: 'gallery_images_ja', label: '갤러리 이미지 (日本語)' },
  { key: 'gallery_images_zh', label: '갤러리 이미지 (中文)' },
] as const;

type GalleryFieldKey = (typeof GALLERY_FIELDS)[number]['key'];

export default function EventForm({ event, defaults }: EventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!event;

  const [form, setForm] = useState({
    slug: event?.slug ?? defaults?.slug ?? '',
    title_ko: event?.title_ko ?? defaults?.title_ko ?? '',
    title_en: event?.title_en ?? defaults?.title_en ?? '',
    title_ja: event?.title_ja ?? defaults?.title_ja ?? '',
    title_zh: event?.title_zh ?? defaults?.title_zh ?? '',
    description_ko: event?.description_ko ?? defaults?.description_ko ?? '',
    description_en: event?.description_en ?? defaults?.description_en ?? '',
    description_ja: event?.description_ja ?? defaults?.description_ja ?? '',
    description_zh: event?.description_zh ?? defaults?.description_zh ?? '',
    poster_image: event?.poster_image ?? null,
    poster_image_en: event?.poster_image_en ?? null,
    poster_image_ja: event?.poster_image_ja ?? null,
    poster_image_zh: event?.poster_image_zh ?? null,
    thumbnail_image: event?.thumbnail_image ?? null,
    gallery_images: event?.gallery_images ?? [],
    gallery_images_en: event?.gallery_images_en ?? [],
    gallery_images_ja: event?.gallery_images_ja ?? [],
    gallery_images_zh: event?.gallery_images_zh ?? [],
    start_date: event?.start_date ?? defaults?.start_date ?? '',
    end_date: event?.end_date ?? defaults?.end_date ?? '',
    category: event?.category ?? defaults?.category ?? 'all',
    featured: event?.featured ?? defaults?.featured ?? false,
    related_treatments: event?.related_treatments ?? defaults?.related_treatments ?? [],
    is_published: event?.is_published ?? false,
    sort_order: event?.sort_order ?? defaults?.sort_order ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.slug || !form.title_ko || !form.start_date || !form.end_date) {
      setError('슬러그, 제목(한국어), 시작일, 종료일은 필수입니다.');
      return;
    }

    setSaving(true);

    // 슬러그 입력 전에 올린 이미지는 temp/ 에 있다. 저장이 확정된 지금 정식 폴더로 옮긴다.
    const payload = await finalizeTempImages(form, { bucket: 'events', folder: form.slug });

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', event.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('events').insert(payload);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push('/admin/events');
    router.refresh();
  };

  // 여러 장을 동시에 올리므로 함수형 setState — 업로드가 끝나기 전 값을 읽으면 마지막 장만 남는다.
  const appendGalleryImages = (key: GalleryFieldKey, urls: string[]) => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ...urls] }));
  };

  const removeGalleryImage = (key: GalleryFieldKey, index: number) => {
    updateField(key, form[key].filter((_, i) => i !== index));
  };

  const toggleTreatment = (value: string) => {
    const current = form.related_treatments;
    if (current.includes(value)) {
      updateField('related_treatments', current.filter((t) => t !== value));
    } else {
      updateField('related_treatments', [...current, value]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-[#575756] mb-1.5">
          슬러그 (URL) <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            placeholder="event-url-slug"
          />
          <button
            type="button"
            onClick={() => updateField('slug', generateSlug(form.title_ko))}
            className="px-3 py-2 text-sm border border-[#e5e5e5] rounded-lg hover:bg-[#f6f6f6] cursor-pointer whitespace-nowrap"
          >
            자동생성
          </button>
        </div>
      </div>

      {/* Titles */}
      <fieldset className="border border-[#e5e5e5] rounded-lg p-4">
        <legend className="text-sm font-medium text-[#575756] px-2">제목</legend>
        <div className="grid gap-3">
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1">한국어 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title_ko}
              onChange={(e) => updateField('title_ko', e.target.value)}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
              required
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

      {/* Descriptions */}
      <fieldset className="border border-[#e5e5e5] rounded-lg p-4">
        <legend className="text-sm font-medium text-[#575756] px-2">설명</legend>
        <div className="grid gap-3">
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1">한국어 <span className="text-red-400">*</span></label>
            <textarea
              value={form.description_ko}
              onChange={(e) => updateField('description_ko', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d] resize-y"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8a8a8a] mb-1">English</label>
            <textarea
              value={form.description_en}
              onChange={(e) => updateField('description_en', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d] resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1">日本語</label>
              <textarea
                value={form.description_ja}
                onChange={(e) => updateField('description_ja', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d] resize-y"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8a8a8a] mb-1">中文</label>
              <textarea
                value={form.description_zh}
                onChange={(e) => updateField('description_zh', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d] resize-y"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Images */}
      <fieldset className="border border-[#e5e5e5] rounded-lg p-4">
        <legend className="text-sm font-medium text-[#575756] px-2">이미지</legend>
        <p className="text-xs text-[#b4b4b4] mb-4">
          외국어 이미지를 등록하지 않으면 해당 언어 페이지에는 한국어 이미지가 표시됩니다.
          <br />
          포스터는 언어별로 대표 1장만 등록됩니다. 여러 장을 한 번에 올리려면 아래 <span className="font-medium">갤러리 이미지</span>를 이용하세요.
        </p>
        <div className="grid gap-4">
          <ImageUploader
            bucket="events"
            folder={form.slug || 'temp'}
            preset="poster"
            value={form.poster_image}
            onChange={(url) => updateField('poster_image', url)}
            label="포스터 이미지 (한국어·기본)"
            maxSizeMb={10}
          />
          <ImageUploader
            bucket="events"
            folder={form.slug || 'temp'}
            preset="poster"
            value={form.poster_image_en}
            onChange={(url) => updateField('poster_image_en', url)}
            label="포스터 이미지 (English)"
            maxSizeMb={10}
          />
          <ImageUploader
            bucket="events"
            folder={form.slug || 'temp'}
            preset="poster"
            value={form.poster_image_ja}
            onChange={(url) => updateField('poster_image_ja', url)}
            label="포스터 이미지 (日本語)"
            maxSizeMb={10}
          />
          <ImageUploader
            bucket="events"
            folder={form.slug || 'temp'}
            preset="poster"
            value={form.poster_image_zh}
            onChange={(url) => updateField('poster_image_zh', url)}
            label="포스터 이미지 (中文)"
            maxSizeMb={10}
          />
          <ImageUploader
            bucket="events"
            folder={form.slug || 'temp'}
            preset="thumbnail"
            value={form.thumbnail_image}
            onChange={(url) => updateField('thumbnail_image', url)}
            label="썸네일 이미지"
            maxSizeMb={10}
          />
          {GALLERY_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-[#575756] mb-1.5">{field.label}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form[field.key].map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover border border-[#e5e5e5]" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(field.key, i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <ImageUploader
                bucket="events"
                folder={form.slug || 'temp'}
                multiple
                maxSizeMb={10}
                onUploadMany={(urls) => appendGalleryImages(field.key, urls)}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Dates & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">
            시작일 <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">
            종료일 <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => updateField('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">카테고리</label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          >
            {Object.entries(EVENT_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#575756] mb-1.5">정렬 순서</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]"
          />
        </div>
      </div>

      {/* Related Treatments */}
      <div>
        <label className="block text-sm font-medium text-[#575756] mb-2">관련 시술</label>
        <div className="flex flex-wrap gap-2">
          {RELATED_TREATMENT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.related_treatments.includes(opt.value)}
                onChange={() => toggleTreatment(opt.value)}
                className="rounded border-[#e5e5e5]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => updateField('featured', e.target.checked)}
            className="rounded border-[#e5e5e5]"
          />
          추천 이벤트
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => updateField('is_published', e.target.checked)}
            className="rounded border-[#e5e5e5]"
          />
          발행 (체크하면 사이트에 공개)
        </label>
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
