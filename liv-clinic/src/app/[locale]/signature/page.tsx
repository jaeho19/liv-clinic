import { SignatureDetail } from '@/components/sections';
import { buildLocalizedMetadata } from '@/lib/pageMeta';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildLocalizedMetadata(locale, 'signature', '/signature');
}

export default function SignaturePage() {
  return <SignatureDetail />;
}
