'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export interface BreadcrumbItem {
  /** Translation key under the `nav` namespace (e.g. 'lifting', 'ulthera'). */
  navKey?: string;
  /** Literal label used when there is no matching `nav` key. */
  label?: string;
  /** Locale-relative href (e.g. '/lifting'). Omit for the current page. */
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const ChevronIcon = () => (
  <svg
    className="w-3 h-3 flex-shrink-0 text-mono-light/60"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/**
 * Locale-aware breadcrumb trail. Auto-prepends a Home crumb; the last item is
 * rendered as the current page (plain text, aria-current), earlier items link.
 * Header-clearing top padding lets it sit above a fixed-header hero.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: tCommon('home'), href: '/' },
    ...items.map((item) => ({
      label: item.navKey ? tNav(item.navKey) : (item.label ?? ''),
      href: item.href,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="container-custom pt-24 md:pt-28 pb-2">
      <ol className="flex items-center gap-1.5 md:gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide text-xs md:text-small text-mono-light">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5 md:gap-2">
              {index > 0 && <ChevronIcon />}
              {isLast || !crumb.href ? (
                <span
                  className={isLast ? 'text-secondary' : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-primary">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
