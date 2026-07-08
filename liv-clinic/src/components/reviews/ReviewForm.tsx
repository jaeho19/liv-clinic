'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { StarRatingInput } from './StarRating';

// 후기 작성 폼의 시술 옵션 키 (라벨은 form.treatmentOptions.<key>에서 해석)
const TREATMENT_KEYS = [
  'lifting',
  'antiaging',
  'laser',
  'signature',
  'botox',
  'filler',
  'skinbooster',
  'other',
] as const;

const INPUT_CLASS =
  'w-full min-h-[44px] rounded-lg border border-border bg-white px-4 py-2.5 text-body text-mono transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40';

/** 공개 후기 작성 폼. 제출 성공 시 감사 상태로 전환된다. */
export default function ReviewForm() {
  const t = useTranslations('reviews');
  const locale = useLocale();

  const [authorName, setAuthorName] = useState('');
  const [country, setCountry] = useState('');
  const [treatment, setTreatment] = useState('');
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(''); // 허니팟

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  function reset() {
    setAuthorName('');
    setCountry('');
    setTreatment('');
    setRating(0);
    setContent('');
    setConsent(false);
    setCompany('');
    setError(null);
    setSucceeded(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (rating < 1) {
      setError(t('form.errorRating'));
      return;
    }
    if (content.trim().length < 10) {
      setError(t('form.errorLength'));
      return;
    }
    if (!consent) {
      setError(t('form.errorConsent'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          author_name: authorName.trim(),
          country: country.trim() || undefined,
          rating,
          treatment_category: treatment,
          content: content.trim(),
          consent,
          company, // 허니팟 (정상 사용자는 빈 값)
        }),
      });

      if (!res.ok) {
        setError(t('form.errorGeneric'));
        return;
      }
      setSucceeded(true);
    } catch (err) {
      console.error('review submit failed:', err);
      setError(t('form.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-h3 text-secondary">{t('form.successTitle')}</h3>
        <p className="mb-6 text-body text-mono leading-relaxed">{t('form.successBody')}</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-primary px-8 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {t('form.writeAnother')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
      <h3 className="mb-6 text-h3 text-secondary">{t('form.title')}</h3>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* 이름 */}
        <div>
          <label htmlFor="review-name" className="mb-1.5 block text-small font-medium text-secondary">
            {t('form.name')}
          </label>
          <input
            id="review-name"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t('form.namePlaceholder')}
            required
            maxLength={60}
            autoComplete="name"
            className={INPUT_CLASS}
          />
        </div>

        {/* 국가 (선택) */}
        <div>
          <label htmlFor="review-country" className="mb-1.5 block text-small font-medium text-secondary">
            {t('form.country')}
          </label>
          <input
            id="review-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('form.countryPlaceholder')}
            maxLength={60}
            className={INPUT_CLASS}
          />
        </div>

        {/* 시술 */}
        <div>
          <label htmlFor="review-treatment" className="mb-1.5 block text-small font-medium text-secondary">
            {t('form.treatment')}
          </label>
          <select
            id="review-treatment"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            required
            className={INPUT_CLASS}
          >
            <option value="" disabled>
              {t('form.treatmentPlaceholder')}
            </option>
            {TREATMENT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`form.treatmentOptions.${key}`)}
              </option>
            ))}
          </select>
        </div>

        {/* 별점 */}
        <div>
          <span className="mb-1.5 block text-small font-medium text-secondary">{t('form.rating')}</span>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        {/* 내용 */}
        <div>
          <label htmlFor="review-content" className="mb-1.5 block text-small font-medium text-secondary">
            {t('form.content')}
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('form.contentPlaceholder')}
            required
            rows={5}
            maxLength={2000}
            className={`${INPUT_CLASS} min-h-[120px] resize-y`}
          />
        </div>

        {/* 동의 */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary/40"
          />
          <span className="text-small leading-relaxed text-mono">
            {t('form.consent')}{' '}
            <Link href="/privacy" className="text-primary underline hover:text-secondary">
              {t('form.consentLink')}
            </Link>
          </span>
        </label>

        {/* 허니팟: 스크린 밖으로 숨김 (봇 감지용) */}
        <input
          type="text"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {error && (
          <p role="alert" className="text-small text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 font-medium text-white transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? t('form.submitting') : t('form.submit')}
        </button>
      </form>
    </div>
  );
}
