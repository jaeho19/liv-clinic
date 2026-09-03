'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import PrepWizard from '@/components/consultPrep/PrepWizard';
import PrepResult from '@/components/consultPrep/PrepResult';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import { PREP_LANGS, type PrepLang } from '@/lib/consultPrep/types';
import { trackPrepResultShown } from '@/lib/analytics-events';

const CONCERN_IDS = ['sagging', 'elasticity', 'fundamental', 'underEye', 'texture'] as const;

export default function ConsultPrepPage() {
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('consultPrep');
  const tConcerns = useTranslations('sections.concerns');
  const [result, setResult] = useState<PrepCardResult | null>(null);
  const [description, setDescription] = useState('');

  const raw = params.get('concern') ?? '';
  const concernId = (CONCERN_IDS as readonly string[]).includes(raw) ? raw : CONCERN_IDS[0];
  const lang: PrepLang = (PREP_LANGS as readonly string[]).includes(locale)
    ? (locale as PrepLang)
    : 'en';

  return (
    <main className="section-gap bg-background">
      <div className="container-custom">
        <h1 className="text-h2 text-secondary text-center mb-10">{t('title')}</h1>
        {result ? (
          <PrepResult result={result} concernId={concernId} description={description} />
        ) : (
          <PrepWizard
            concernId={concernId}
            concernTitle={tConcerns(`cards.${concernId}.title`)}
            lang={lang}
            onResult={(r, d) => {
              setResult(r);
              setDescription(d);
              trackPrepResultShown(concernId, r.lowConfidence);
            }}
          />
        )}
      </div>
    </main>
  );
}
