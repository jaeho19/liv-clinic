import { getTranslations } from 'next-intl/server';
import { BASE_URL, generateFAQSchema, generateWebPageSchema, getSiteName } from '@/lib/seo';
import { LOCALE_META } from '@/i18n/locales-meta';
import { GUIDE_UI } from './ui';
import type { GuideDoc } from './types';

/**
 * Article(저자·검수·수정일) + MedicalWebPage(빵부스러기) + FAQPage.
 * 저자 기본은 병원(MedicalOrganization). reviewer=dr-kim이면 원장 Physician(@id는 /about/staff#dr-kim)이
 * author·reviewedBy가 된다 — 원장이 실제 검수한 편에만 켠다.
 */
export async function buildGuideSchemas(guide: GuideDoc): Promise<object[]> {
  const ui = GUIDE_UI[guide.locale];
  const path = `/guides/${guide.slug}`;
  const url = `${BASE_URL}/${guide.locale}${path}`;
  const siteName = getSiteName(guide.locale);
  const [tCommon, tSections] = await Promise.all([
    getTranslations({ locale: guide.locale, namespace: 'common' }),
    getTranslations({ locale: guide.locale, namespace: 'sections' }),
  ]);
  const organization = { '@type': 'MedicalOrganization', '@id': `${BASE_URL}/#organization`, name: siteName, url: BASE_URL };
  const physician = {
    '@type': 'Physician',
    '@id': `${BASE_URL}/about/staff#dr-kim`,
    name: tSections('doctors.kim.name'),
    alternateName: tSections('doctors.kim.nameEn'),
    jobTitle: tSections('doctors.kim.specialty'),
    url: `${BASE_URL}/${guide.locale}/about/staff`,
  };
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: guide.title,
    description: guide.description,
    inLanguage: LOCALE_META[guide.locale].htmlLang,
    datePublished: guide.updated,
    dateModified: guide.updated,
    author: guide.reviewer === 'dr-kim' ? physician : organization,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` },
    },
    mainEntityOfPage: url,
    ...(guide.reviewer === 'dr-kim' ? { reviewedBy: physician } : {}),
    ...(guide.treatment
      ? { about: { '@type': 'MedicalProcedure', url: `${BASE_URL}/${guide.locale}${guide.treatment}` } }
      : {}),
  };
  const webPage = generateWebPageSchema({
    path,
    title: guide.title,
    description: guide.description,
    locale: guide.locale,
    type: 'MedicalWebPage',
    datePublished: guide.updated,
    dateModified: guide.updated,
    breadcrumbs: [
      { name: tCommon('home'), url: '/' },
      { name: ui.guides, url: '/guides' },
      { name: guide.title, url: path },
    ],
  });
  const schemas: object[] = [article, webPage];
  if (guide.faq.length > 0) {
    schemas.push(generateFAQSchema(guide.faq.map((f) => ({ question: f.q, answer: f.a }))));
  }
  return schemas;
}
