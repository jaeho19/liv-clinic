import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'location', '/about/location');
}

export default function LocationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
