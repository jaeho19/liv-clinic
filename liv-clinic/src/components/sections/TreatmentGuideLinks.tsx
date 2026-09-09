'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

/** 시술 내용을 읽은 뒤 비용 조건과 방문 정보를 확인하는 경로. */
export default function TreatmentGuideLinks({ treatmentId }: {
  treatmentId: 'ulthera' | 'thermage' | 'thread';
}) {
  const t = useTranslations('nav');
  const links = [
    { href: `/pricing#${treatmentId}`, label: t('pricing') },
    { href: '/about/staff', label: t('aboutStaff') },
    { href: '/about/location', label: t('aboutLocation') },
  ];

  return (
    <div className="bg-background pb-8">
      <div className="container-custom flex flex-wrap justify-center gap-3">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center rounded-full border border-primary/30 bg-white px-5 py-2 text-small text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
