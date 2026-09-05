import { Cormorant_Garamond, Noto_Sans_Arabic } from 'next/font/google';
import localFont from 'next/font/local';

// Pretendard Variable - 본문용 (한글/영문/키릴/라틴 diacritics)
// display: 'swap'으로 FOUT 방지 (Vercel Best Practice)
// Pretendard Variable(2MB) — globals.css에서 아랍어 페이지 폴백(html[lang="ar"] body)에만 쓰인다.
// preload를 켜면 모든 로케일이 2MB를 내려받으므로 끈다(브라우저가 필요할 때만 가져온다). 2026-09-05
export const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '300 700',
  display: 'swap',
  preload: false,
});

// Cormorant Garamond - 장식용 (영문)
// weight 최적화: 실제 사용되는 weight만 로드하여 번들 크기 감소
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

// Noto Sans Arabic - 아랍어 locale 전용
// Pretendard는 아랍어 글리프 미포함 → 별도 폰트 필수
// next/font/google이 자동 서브셋팅으로 /ar 페이지에만 로드
export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
});
