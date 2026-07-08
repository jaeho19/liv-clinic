import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 이미지 최적화 설정
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // /gallery → /before-after 영구 통합(Wave-3, M6). localePrefix가 'always'라
  // 로케일 없는 /gallery는 미들웨어가 먼저 로케일을 붙이므로 :locale 규칙으로 충분.
  async redirects() {
    return [
      {
        source: '/:locale/gallery',
        destination: '/:locale/before-after',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
