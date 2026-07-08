import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'inquiry', '/inquiry');
}

export default function InquiryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
