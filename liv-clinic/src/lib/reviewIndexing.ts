import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { LOCALES } from '@/i18n/routing';

/** Shared by metadata and sitemap. Only published review locale names are read. */
export async function getIndexableReviewLocales(): Promise<string[]> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const published = new Set<string>();
  // Supabase caps responses. Read every page so a busy locale cannot hide others.
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from('reviews').select('locale')
      .eq('is_published', true).order('id').range(offset, offset + pageSize - 1);
    // A failed revalidation must keep the previous ISR page, not publish noindex.
    if (error) throw error;
    for (const row of data ?? []) published.add(row.locale);
    if (!data || data.length < pageSize) break;
  }
  // Korean is the existing brand landing page, even before reviews are published.
  return LOCALES.filter((locale) => locale === 'ko' || published.has(locale));
}
