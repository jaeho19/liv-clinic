'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import type { PrepLang } from '@/lib/consultPrep/types';
import { trackPrepStarted, trackPrepDescribed } from '@/lib/analytics-events';

interface Props {
  concernId: string;
  concernTitle: string;
  lang: PrepLang;
  onResult: (result: PrepCardResult, description: string) => void;
}

const KO_TIMING_KEYS = ['step3None', 'step3Wedding', 'step3Meeting', 'step3Reunion', 'step3Holiday'] as const;

export default function PrepWizard({ concernId, concernTitle, lang, onResult }: Props) {
  const t = useTranslations('consultPrep');
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [timing, setTiming] = useState('step3None');
  const [stay, setStay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const descriptionOk = description.trim().length >= 2;

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/consult-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concernId, description: description.trim(), lang }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || t('error'));
        return;
      }
      onResult(json.data as PrepCardResult, description.trim());
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {step === 1 && (
        <section>
          <h2 className="text-h3 text-secondary mb-6">{t('step1Title')}</h2>
          <p className="text-body text-mono mb-8">{concernTitle}</p>
          <Button
            onClick={() => {
              trackPrepStarted(concernId);
              setStep(2);
            }}
          >
            {t('next')}
          </Button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-h3 text-secondary mb-6">{t('step2Title')}</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            // 이 기능의 필수 입력인데 placeholder 뿐이라 스크린리더에 이름이 없었다.
            // step2Title 이 이미 그 질문 문장이다 — 새 i18n 키를 만들지 않는다.
            aria-label={t('step2Title')}
            placeholder={t('step2Placeholder')}
            rows={4}
            maxLength={500}
            className="w-full rounded-xl border border-border p-4 text-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {!descriptionOk && (
            <p className="text-small text-mono-light mt-2">{t('step2Required')}</p>
          )}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              {t('back')}
            </Button>
            <Button
              disabled={!descriptionOk}
              onClick={() => {
                trackPrepDescribed(concernId, description.trim().length);
                setStep(3);
              }}
            >
              {t('next')}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-h3 text-secondary mb-6">{t('step3Title')}</h2>

          {lang === 'ko' ? (
            <div className="flex flex-wrap gap-2">
              {KO_TIMING_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTiming(key)}
                  className={`rounded-full border px-4 py-2 text-small transition-colors ${
                    timing === key
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-mono hover:bg-background'
                  }`}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          ) : (
            <label className="block">
              <span className="text-small text-mono">{t('step3Stay')}</span>
              <input
                type="text"
                value={stay}
                onChange={(e) => setStay(e.target.value)}
                placeholder="2026-09-20 ~ 2026-09-24"
                className="mt-2 w-full rounded-xl border border-border p-4 text-body"
              />
            </label>
          )}

          {error && <p className="text-small text-red-600 mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              {t('back')}
            </Button>
            <Button onClick={submit} isLoading={loading} disabled={loading}>
              {loading ? t('loading') : t('submit')}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
