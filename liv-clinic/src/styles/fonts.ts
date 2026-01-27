import { Cormorant_Garamond } from 'next/font/google';
import localFont from 'next/font/local';

// Pretendard Variable - 본문용 (한글/영문)
// display: 'swap'으로 FOUT 방지 (Vercel Best Practice)
export const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '300 700',
  display: 'swap',
  preload: true,
});

// Cormorant Garamond - 장식용 (영문)
// weight 최적화: 실제 사용되는 weight만 로드하여 번들 크기 감소
// 5개 → 3개 weight로 축소 (약 40% 감소)
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'], // 300, 700 제거 - 실제 사용 안 됨
  variable: '--font-cormorant',
  display: 'swap',
});
