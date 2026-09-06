'use client';

import { useState } from 'react';
import { LOCALES } from '@/i18n/routing';
import { LOCALE_META } from '@/i18n/locales-meta';
import { REVIEW_TREATMENT_KEYS, type ReviewTreatmentKey } from '@/lib/reviews/adminReviewInput';

// 쉬운 한국어 라벨(운영자 화면). 값은 공개 후기 폼과 같은 키를 쓴다.
const TREATMENT_LABELS: Record<ReviewTreatmentKey, string> = {
  lifting: '리프팅',
  antiaging: '안티에이징',
  laser: '레이저',
  signature: '시그니처',
  botox: '보톡스',
  filler: '필러',
  skinbooster: '스킨부스터',
  other: '기타',
};

const today = () => new Date().toISOString().slice(0, 10);

type FormState = {
  locale: string;
  author_name: string;
  country: string;
  treatment_category: ReviewTreatmentKey;
  rating: number;
  content: string;
  received_on: string;
  is_published: boolean;
  is_verified: boolean;
};

/**
 * 후기 직접 등록(P1-4). 환자에게 받은 후기를 관리자가 여러 작성자명으로 대신 올린다.
 * 출처·동의 항목은 넣지 않는다(2026-09-06 지시).
 */
export default function ReviewDirectForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>({
    locale: 'en',
    author_name: '',
    country: '',
    treatment_category: 'lifting',
    rating: 5,
    content: '',
    received_on: today(),
    is_published: true,
    is_verified: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          country: form.country.trim() || undefined,
          received_on: form.received_on || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? '등록에 실패했습니다.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full min-h-[44px] rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-[#575756] focus:border-[#b4988d] focus:outline-none';
  const label = 'block text-xs text-[#8a8a8a] mb-1';

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-[#e5e5e5] p-4 lg:p-5 grid gap-4 mb-4">
      <div>
        <h3 className="font-bold text-[#6d4e42]">후기 직접 등록</h3>
        <p className="text-xs text-[#8a8a8a] mt-1">
          환자에게 받은 후기를 대신 올립니다. 표시될 이름은 자유롭게 적을 수 있고, &quot;바로 게시&quot;를 켜면 저장 즉시 후기
          페이지에 보입니다.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>표시될 이름 *</label>
          <input
            className={input}
            value={form.author_name}
            onChange={(e) => set('author_name', e.target.value)}
            maxLength={60}
            placeholder="예: Sarah K."
            required
          />
        </div>
        <div>
          <label className={label}>언어 * (어느 언어 후기 페이지에 보일지)</label>
          <select className={input} value={form.locale} onChange={(e) => set('locale', e.target.value)}>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_META[l].name} ({l})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>나라 (선택)</label>
          <input
            className={input}
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            maxLength={60}
            placeholder="예: Singapore"
          />
        </div>
        <div>
          <label className={label}>시술 *</label>
          <select
            className={input}
            value={form.treatment_category}
            onChange={(e) => set('treatment_category', e.target.value as ReviewTreatmentKey)}
          >
            {REVIEW_TREATMENT_KEYS.map((k) => (
              <option key={k} value={k}>
                {TREATMENT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>별점 *</label>
          <select className={input} value={form.rating} onChange={(e) => set('rating', Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} ({n}점)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>받은 날짜 (후기 페이지에 이 날짜로 표시)</label>
          <input
            type="date"
            className={input}
            value={form.received_on}
            onChange={(e) => set('received_on', e.target.value)}
            max={today()}
          />
        </div>
      </div>
      <div>
        <label className={label}>내용 * (10~2000자)</label>
        <textarea
          className={`${input} min-h-[120px]`}
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          minLength={10}
          maxLength={2000}
          required
        />
        <p className="text-xs text-[#8a8a8a] mt-1 text-right">{form.content.length} / 2000</p>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-[#575756]">
        <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer">
          <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
          바로 게시
        </label>
        <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer">
          <input type="checkbox" checked={form.is_verified} onChange={(e) => set('is_verified', e.target.checked)} />
          치료 확인 표시
        </label>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-4 rounded-lg border border-[#e5e5e5] text-sm text-[#575756] hover:bg-[#f6f6f6] cursor-pointer"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] px-5 rounded-lg bg-[#b4988d] text-white text-sm hover:bg-[#a08474] disabled:opacity-50 cursor-pointer"
        >
          {saving ? '등록 중…' : '등록'}
        </button>
      </div>
    </form>
  );
}
