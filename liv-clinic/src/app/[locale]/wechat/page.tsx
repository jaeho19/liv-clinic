import { setRequestLocale } from 'next-intl/server';
import WeChatInfo from '@/components/sections/WeChatInfo';

// zh 전용 페이지. 다른 로케일 접근은 middleware.ts에서 /zh/wechat으로 redirect됨.
export function generateStaticParams() {
  return [{ locale: 'zh' }];
}

export default async function WeChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WeChatInfo />;
}
