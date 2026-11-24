import { getTranslations } from 'next-intl/server';
import { BASE_URL, generateFAQSchema, generateWebPageSchema, getSiteName } from '@/lib/seo';
import { LOCALE_META } from '@/i18n/locales-meta';
import { GUIDE_UI } from './ui';
import { isDoctorAuthored } from './byline';
import { guideOgImage } from './ogImage';
import type { GuideDoc } from './types';

/**
 * Article(저자·검수·공개일·수정일) + MedicalWebPage(빵부스러기·검수) + FAQPage.
 * 검색엔진과 AI 검색(ChatGPT·Perplexity·Copilot 등)이 "누가 썼고, 언제 것이고, 무엇에 대한 글인지"를
 * 여기서 읽는다 — 화면에서 날짜를 뺀 한국어 칼럼도 날짜는 여기에 남긴다.
 *
 * 저자: 한국어 칼럼은 원장 Physician(@id는 /about/staff#dr-kim — 의료진 소개의 상세 정보와 이어진다),
 * 외국인 가이드는 병원(MedicalOrganization). reviewedBy·lastReviewed는 원장이 실제 검수한 편(reviewer=dr-kim)에만.
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
    '@type': ['Person', 'Physician'],
    '@id': `${BASE_URL}/about/staff#dr-kim`,
    name: tSections('doctors.kim.name'),
    alternateName: tSections('doctors.kim.nameEn'),
    jobTitle: tSections('doctors.kim.specialty'),
    medicalSpecialty: 'https://schema.org/PlasticSurgery',
    worksFor: { '@id': `${BASE_URL}/#organization` },
    url: `${BASE_URL}/${guide.locale}/about/staff`,
  };
  const reviewed = guide.reviewer === 'dr-kim';
  const datePublished = guide.published ?? guide.updated;
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: guide.title,
    description: guide.description,
    inLanguage: LOCALE_META[guide.locale].htmlLang,
    datePublished,
    dateModified: guide.updated,
    author: isDoctorAuthored(guide) ? physician : organization,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` },
    },
    mainEntityOfPage: url,
    ...(guideOgImage(guide) ? { image: guideOgImage(guide)!.url } : {}),
    ...(reviewed ? { reviewedBy: physician } : {}),
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
    datePublished,
    dateModified: guide.updated,
    breadcrumbs: [
      { name: tCommon('home'), url: '/' },
      { name: ui.guides, url: '/guides' },
      { name: guide.title, url: path },
    ],
  });
  // 의료 정보 페이지의 신뢰 표시: 누가 언제 검수했는지(MedicalWebPage.reviewedBy·lastReviewed)
  const schemas: object[] = [
    article,
    reviewed ? { ...webPage, reviewedBy: { '@id': physician['@id'] }, lastReviewed: guide.updated } : webPage,
  ];
  if (guide.faq.length > 0) {
    schemas.push(generateFAQSchema(guide.faq.map((f) => ({ question: f.q, answer: f.a }))));
  }
  return schemas;
}
