'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';
import type { PrepCardResult } from '@/lib/consultPrep/buildResult';
import { trackPrepToInquiry } from '@/lib/analytics-events';

interface Props {
  result: PrepCardResult;
  concernId: string;
  description: string;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-h4 text-secondary mb-4">{title}</h3>
      {children}
    </section>
  );
}

export default function PrepResult({ result, concernId, description }: Props) {
  const t = useTranslations('consultPrep');
  const withMeta = result.treatments.filter((x) => !x.consultOnly && x.duration);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card title={t('card1Title')}>
        {result.restatement && <p className="text-body text-mono mb-4">{result.restatement}</p>}
        <ul className="flex flex-wrap gap-2">
          {result.terms.map((term) => (
            <li
              key={term.id}
              className="rounded-full bg-background px-4 py-2 text-small text-secondary"
            >
              {term.label}
            </li>
          ))}
        </ul>
        {result.lowConfidence && (
          <p className="text-small text-mono-light mt-4">{t('lowConfidence')}</p>
        )}
      </Card>

      <Card title={t('card2Title')}>
        <ul className="space-y-4">
          {result.treatments.map((item) => (
            <li key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-body font-medium text-secondary">
                  {item.consultOnly ? t('consultOnly') : item.name}
                </span>
                {item.href && (
                  <Link href={item.href} className="text-small text-primary shrink-0">
                    →
                  </Link>
                )}
              </div>
              {item.reason && <p className="text-small text-mono mt-1">{item.reason}</p>}
              {item.caution && <p className="text-small text-mono-light mt-1">{item.caution}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('card3Title')}>
        <ol className="space-y-3 list-decimal list-inside">
          {result.questions.map((q) => (
            <li key={q.id} className="text-body text-mono">
              {q.text}
            </li>
          ))}
        </ol>
      </Card>

      {withMeta.length > 0 && (
        <Card title={t('card4Title')}>
          <dl className="space-y-4">
            {withMeta.map((item) => (
              <div key={item.id}>
                <dt className="text-small font-medium text-secondary mb-1">{item.name}</dt>
                <dd className="text-small text-mono">
                  {t('labelDuration')} {item.duration} · {t('labelAnesthesia')} {item.anesthesia} ·{' '}
                  {t('labelRecovery')} {item.recovery}
                </dd>
                {item.cautions.length > 0 && (
                  <dd className="text-small text-mono-light mt-1">
                    {t('labelCautions')}: {item.cautions.join(' / ')}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </Card>
      )}

      <p className="text-small text-mono-light leading-relaxed">{t('disclaimer')}</p>

      <Link
        href={{
          pathname: '/contact',
          query: {
            concern: concernId,
            prep: description.slice(0, 200),
            tags: result.treatments.filter((x) => !x.consultOnly).map((x) => x.id).join(','),
          },
        }}
        onClick={() => trackPrepToInquiry(concernId)}
      >
        <Button className="w-full">{t('ctaInquiry')}</Button>
      </Link>
    </div>
  );
}
