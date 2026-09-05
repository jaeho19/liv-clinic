import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // 지원하지 않는 로케일(예: /index.php 같은 옛 URL 세그먼트)은 기본 로케일 메시지로 응답한다.
  // 404 판정은 [locale]/layout.tsx의 notFound()가 담당한다 — 여기서 notFound()를 부르면
  // 렌더 컨텍스트 밖이라 500이 났다(2026-09-05 /index.php 실측).
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
