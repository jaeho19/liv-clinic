import { MetadataRoute } from 'next';
import { isPreviewDeployment, SITE_URL as BASE_URL } from '@/lib/siteEnvironment';

// 관리자·API만 차단한다. /_next/(CSS·JS)나 *.json을 막으면 이름을 명시하지 않은 크롤러
// (Yandex·Applebot·DuckDuckBot 등)가 페이지를 렌더링하지 못한다. (2026-09-05 정리)
const BLOCKED_PATHS = ['/admin', '/api', '/private/'];

// 시장별 검색 크롤러 (ko: Yeti, ru: YandexBot, zh: Baiduspider, 애플·DuckDuckGo 포함)
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'Yeti', 'Baiduspider', 'YandexBot', 'Applebot', 'DuckDuckBot'];

// Search/indexing, user-requested retrieval and training are independent policies.
const AI_SEARCH_BOTS = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'];
const USER_REQUEST_AGENTS = ['ChatGPT-User', 'Claude-User', 'Perplexity-User'];
// Preserve the existing explicit training permissions; changing them needs a policy decision.
const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot'];
const LEGACY_AGENTS = ['Claude-Web'];

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: BLOCKED_PATHS },
      ...[...SEARCH_BOTS, ...AI_SEARCH_BOTS, ...USER_REQUEST_AGENTS, ...TRAINING_BOTS, ...LEGACY_AGENTS].map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: BLOCKED_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
