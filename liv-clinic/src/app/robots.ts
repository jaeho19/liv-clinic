import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net';

// 관리자·API만 차단한다. /_next/(CSS·JS)나 *.json을 막으면 이름을 명시하지 않은 크롤러
// (Yandex·Applebot·DuckDuckBot 등)가 페이지를 렌더링하지 못한다. (2026-09-05 정리)
const BLOCKED_PATHS = ['/admin', '/api', '/private/'];

// 시장별 검색 크롤러 (ko: Yeti, ru: YandexBot, zh: Baiduspider, 애플·DuckDuckGo 포함)
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'Yeti', 'Baiduspider', 'YandexBot', 'Applebot', 'DuckDuckBot'];

// AI / LLM 크롤러 — AI 답변에 노출되도록 명시 허용 (GEO/AEO)
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: BLOCKED_PATHS },
      ...[...SEARCH_BOTS, ...AI_CRAWLERS].map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: BLOCKED_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
