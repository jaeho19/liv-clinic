import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'equipment', '/about/equipment');
}

export default function EquipmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
