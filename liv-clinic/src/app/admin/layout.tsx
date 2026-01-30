import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'LIV 관리자',
  description: '리브성형외과 홈페이지 관리 시스템',
  robots: 'noindex, nofollow',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#f6f6f6] text-[#575756] antialiased">
        {children}
      </body>
    </html>
  );
}
