import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '리브성형외과 | LIV Plastic Surgery',
  description: '수술 없는 프리미엄 안티에이징, 울쎄라피 프라임 & 써마지 공식 인증 병원',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
