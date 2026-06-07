'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Inquiry {
  id: string;
  treatmentType: string;
  message: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  createdAt: string;
}

export default function InquiryLookupPage() {
  const t = useTranslations('inquiry');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Inquiry[] | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/consultation/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      if (res.status === 429) {
        setError(t('rateLimited'));
        return;
      }
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = await res.json();
      setResult(Array.isArray(data.inquiries) ? data.inquiries : []);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (s: string) => (s === 'pending' ? t('statusPending') : s);

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container-custom max-w-xl">
        <h1 className="text-h2 text-secondary mb-3">{t('title')}</h1>
        <p className="text-body text-mono mb-8 whitespace-pre-line">{t('description')}</p>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl p-6 sm:p-8 space-y-5 border border-border">
          <div>
            <label htmlFor="lookup-phone" className="block text-body text-secondary mb-2">
              {t('phoneLabel')}
            </label>
            <input
              id="lookup-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="lookup-password" className="block text-body text-secondary mb-2">
              {t('passwordLabel')}
            </label>
            <input
              id="lookup-password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !phone.trim() || !password.trim()}
            className="w-full bg-primary text-white font-medium h-12 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
          {error && <p className="text-small text-red-500">{error}</p>}
        </form>

        {result !== null && (
          <div className="mt-8">
            {result.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-border text-center text-mono">
                {t('notFound')}
              </div>
            ) : (
              <>
                <h2 className="text-h3 text-secondary mb-4">{t('resultsTitle')}</h2>
                <ul className="space-y-4">
                  {result.map((q) => (
                    <li key={q.id} className="bg-white rounded-2xl p-6 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {statusLabel(q.status)}
                        </span>
                        <span className="text-small text-mono-light">{(q.createdAt || '').slice(0, 10)}</span>
                      </div>
                      <dl className="space-y-1.5 text-body">
                        <div className="flex gap-2">
                          <dt className="text-mono-light w-20 flex-shrink-0">{t('fieldTreatment')}</dt>
                          <dd className="text-mono">{q.treatmentType}</dd>
                        </div>
                        {(q.preferredDate || q.preferredTime) && (
                          <div className="flex gap-2">
                            <dt className="text-mono-light w-20 flex-shrink-0">{t('fieldPreferred')}</dt>
                            <dd className="text-mono">{[q.preferredDate, q.preferredTime].filter(Boolean).join(' ')}</dd>
                          </div>
                        )}
                        {q.message && (
                          <div className="flex gap-2">
                            <dt className="text-mono-light w-20 flex-shrink-0">{t('fieldMessage')}</dt>
                            <dd className="text-mono whitespace-pre-line">{q.message}</dd>
                          </div>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
