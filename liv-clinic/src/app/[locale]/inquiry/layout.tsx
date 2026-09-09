import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const metadata = await buildLocalizedMetadata(locale, 'inquiry', '/inquiry');
  return {
    ...metadata,
    alternates: { canonical: metadata.alternates?.canonical },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default function InquiryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
