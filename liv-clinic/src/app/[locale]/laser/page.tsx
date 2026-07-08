import { LaserCenterDetail } from '@/components/sections';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'laser', '/laser');
}

export default function LaserPage() {
  return <LaserCenterDetail />;
}
