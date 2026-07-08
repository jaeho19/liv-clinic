import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'contact', '/contact');
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
