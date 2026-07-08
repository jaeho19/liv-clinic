import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generatePageMetadata } from './seo';

type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Localized page metadata sourced from the `metaSeo` message namespace.
 *
 * Wraps generatePageMetadata so each page keeps the shared OG / canonical /
 * hreflang / robots wiring while self-canonicalizing to its own `path`
 * (e.g. /en/lifting → canonical https://liv-clinic.net/en/lifting).
 *
 * @param pageKey key under the `metaSeo` namespace (e.g. 'ulthera', 'about')
 * @param path    path after the locale segment, leading slash (e.g. '/lifting/ulthera')
 */
export async function buildLocalizedMetadata(
  locale: string,
  pageKey: string,
  path: string,
  images?: OgImage[],
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metaSeo' });
  const rawKeywords = t.raw(`${pageKey}.keywords`);
  const keywords = Array.isArray(rawKeywords) ? rawKeywords.map(String) : undefined;

  return generatePageMetadata({
    locale,
    title: t(`${pageKey}.title`),
    description: t(`${pageKey}.description`),
    keywords,
    path,
    images,
  });
}
