import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { TREATMENTS } from '@/lib/constants';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://livps.co.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/about/staff', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/about/equipment', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/about/location', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/laser', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/medical', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  // Treatment pages
  const liftingTreatments = Object.keys(TREATMENTS.lifting).map((id) => ({
    path: `/lifting/${id}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }));

  const antiagingTreatments = Object.keys(TREATMENTS.antiaging).map((id) => ({
    path: `/antiaging/${id}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }));

  // Laser category pages (다국어 검색 최적화)
  const laserCategories = [
    'pigmentation',  // 기미/색소
    'vascular',      // 홍조/혈관
    'skintone',      // 피부톤/미백
    'hair-removal',  // 제모
    'tattoo',        // 문신 제거
  ].map((id) => ({
    path: `/laser/${id}`,
    priority: 0.8,
    changeFrequency: 'monthly' as const,
  }));

  const allPages = [...staticPages, ...liftingTreatments, ...antiagingTreatments, ...laserCategories];

  // Generate sitemap entries for all locales
  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of allPages) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: currentDate,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko${page.path}`,
            en: `${BASE_URL}/en${page.path}`,
            ja: `${BASE_URL}/ja${page.path}`,
            zh: `${BASE_URL}/zh${page.path}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
