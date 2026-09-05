import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { LOCALES } from '@/i18n/routing';
import { BASE_URL, buildHreflangMap } from '@/lib/seo';
import { buildSitemapPaths } from '@/lib/sitemapPaths';

// 발행 이벤트 목록이 바뀌면 1시간 안에 반영
export const revalidate = 3600;

type PublishedEvent = { slug: string; updated_at: string | null };

async function fetchPublishedEvents(): Promise<PublishedEvent[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('is_published', true);
    if (error) throw error;
    return (data ?? []) as PublishedEvent[];
  } catch (err) {
    console.error('sitemap: events fetch failed', err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // 정적·시술 페이지 — lastmod는 실제 수정일을 알 수 없으므로 넣지 않는다
  // (빌드 시각을 넣으면 매번 바뀌어 구글이 lastmod를 불신한다)
  for (const page of buildSitemapPaths()) {
    const locales = page.locales ?? LOCALES;
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        // 단일 로케일 페이지는 대체 언어가 없다
        ...(page.locales ? {} : { alternates: { languages: buildHreflangMap(page.path) } }),
      });
    }
  }

  // 발행 중인 이벤트 상세 — 실제 updated_at을 lastmod로
  for (const event of await fetchPublishedEvents()) {
    const path = `/events/${event.slug}`;
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        ...(event.updated_at ? { lastModified: event.updated_at } : {}),
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: { languages: buildHreflangMap(path) },
      });
    }
  }

  return entries;
}
