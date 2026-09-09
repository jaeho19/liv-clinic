import type { Metadata } from 'next';
import NotFound from './[locale]/not-found';
import './globals.css';

export const metadata: Metadata = {
  title: '404 | LIV Plastic Surgery',
  robots: { index: false, follow: false },
};

/** Unmatched routes must not read next-intl request headers during static fallback. */
export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>
        <main><NotFound /></main>
      </body>
    </html>
  );
}
