import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://liv-clinic.net';

// Admin dashboard and API routes must never be crawled (previously only noindex'd)
const BLOCKED_PATHS = ['/admin', '/api'];

// Search engine crawlers (ko/en/ja/zh markets)
const SEARCH_BOTS = ['Googlebot', 'Yeti', 'Bingbot', 'Baiduspider'];

// AI / LLM crawlers — explicitly allowed so LIV surfaces in AI answers (GEO/AEO)
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
      {
        userAgent: '*',
        allow: '/',
        disallow: [...BLOCKED_PATHS, '/_next/', '/private/', '/*.json$'],
      },
      // Named search + AI crawlers: allow site content, keep admin/api out
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
