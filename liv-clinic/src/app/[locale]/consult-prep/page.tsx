'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import PrepWizard from '@/components/consultPrep/PrepWizard';
import PrepResult from '@/components/consultPrep/PrepResult';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import { PREP_LANGS, type PrepLang } from '@/lib/consultPrep/types';
import { trackPrepResultShown } from '@/lib/analytics-events';

const CONCERN_IDS = ['sagging', 'elasticity', 'fundamental', 'underEye', 'texture'] as const;

// useSearchParams()가 쓰는 Suspense 경계 "안"은 정적 생성 시점에 실제 쿼리를
// 알 수 없어 CSR로 미뤄진다(2026-09-03 리뷰). concern 쿼리에 의존하는
// 위저드/결과 카드만 이 컴포넌트로 분리해 좁게 Suspense로 감싼다 — 쿼리와
// 무관한 제목(h1)은 default export 쪽 정적 셸에 남겨 빌드된 정적 HTML에
// 그대로 텍스트로 들어가게 한다.
function ConsultPrepBody() {
  const params = useSearchParams();
  const locale = useLocale();
  const tConcerns = useTranslations('sections.concerns');
  const [result, setResult] = useState<PrepCardResult | null>(null);

  const raw = params.get('concern') ?? '';
  const concernId = (CONCERN_IDS as readonly string[]).includes(raw) ? raw : CONCERN_IDS[0];
  const lang: PrepLang = (PREP_LANGS as readonly string[]).includes(locale)
    ? (locale as PrepLang)
    : 'en';

  return result ? (
    <PrepResult result={result} concernId={concernId} />
  ) : (
    <PrepWizard
      concernId={concernId}
      concernTitle={tConcerns(`cards.${concernId}.title`)}
      lang={lang}
      onResult={(r) => {
        setResult(r);
        trackPrepResultShown(concernId, r.lowConfidence);
      }}
    />
  );
}

export default function ConsultPrepPage() {
  const t = useTranslations('consultPrep');

  return (
    <main className="section-gap bg-background">
      <div className="container-custom">
        <h1 className="text-h2 text-secondary text-center mb-10">{t('title')}</h1>
        <Suspense fallback={null}>
          <ConsultPrepBody />
        </Suspense>
      </div>
    </main>
  );
}
