'use client';

import { Link } from '@/i18n/routing';
import { ComponentProps, useEffect } from 'react';
import { usePathname } from '@/i18n/routing';

type LinkProps = ComponentProps<typeof Link>;

interface ScrollLinkProps extends LinkProps {
  scrollToTop?: boolean;
}

export default function ScrollLink({
  scrollToTop = true,
  onClick,
  children,
  href,
  ...props
}: ScrollLinkProps) {
  const pathname = usePathname();

  // Scroll to top when navigating to the target page
  useEffect(() => {
    if (scrollToTop && pathname === href) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, href, scrollToTop]);

  return (
    <Link href={href} {...props} onClick={onClick}>
      {children}
    </Link>
  );
}
