import { Cormorant_Garamond } from 'next/font/google';
import localFont from 'next/font/local';

// Pretendard Variable - 본문용 (한글/영문)
export const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '300 700',
  display: 'swap',
});

// Cormorant Garamond - 장식용 (영문)
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});
