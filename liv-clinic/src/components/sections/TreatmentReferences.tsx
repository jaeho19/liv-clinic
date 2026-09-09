'use client';

import { useTranslations } from 'next-intl';

// 원문 링크만 제공한다. 효과 수치나 의료진 검토 이력을 이 자료에서 추정하지 않는다.
const references = {
  ulthera: [
    {
      title: 'FDA 510(k) — Ulthera PRIME (K233996)',
      href: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?id=K233996',
    },
    {
      title: 'Ultherapy — Instructions for Use',
      href: 'https://ultherapy.com/ifu',
    },
    {
      title: 'Microfocused Ultrasound With Visualization (MFU-V) Effectiveness and Safety: A Systematic Review and Meta-Analysis (2025)',
      href: 'https://doi.org/10.1093/asj/sjae228',
    },
  ],
  thermage: [
    {
      title: 'Thermage — Treatment Information & Important Safety Information',
      href: 'https://www.thermage.com/',
    },
  ],
  thread: [
    {
      title: 'American Society of Plastic Surgeons — Thread Lift Risks and Safety',
      href: 'https://www.plasticsurgery.org/cosmetic-procedures/thread-lift/safety',
    },
  ],
} as const;

export default function TreatmentReferences({ treatmentId }: {
  treatmentId: keyof typeof references;
}) {
  const t = useTranslations('treatments.common.references');

  return (
    <aside
      aria-labelledby={`${treatmentId}-references`}
      className="my-10 rounded-2xl border border-border bg-white p-6 md:p-8"
    >
      <h3 id={`${treatmentId}-references`} className="text-h4 text-secondary mb-2">
        {t('title')}
      </h3>
      <p className="text-small text-mono-light mb-4">{t('note')}</p>
      <ul className="space-y-3">
        {references[treatmentId].map(({ title, href }) => (
          <li key={href}>
            <a
              href={href}
              lang="en"
              dir="ltr"
              className="inline-block py-1 text-small text-secondary underline underline-offset-4 hover:text-primary [overflow-wrap:anywhere]"
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
