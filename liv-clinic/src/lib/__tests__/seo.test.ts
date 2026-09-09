import { describe, it, expect, afterEach, vi } from 'vitest';
import { BASE_URL, buildHreflangMap, defaultOgImage, generatePageMetadata, generateWebPageSchema, getSiteName, stripLocalePrefix, generateLocalBusinessSchema, generateMedicalServiceSchema, generateHowToSchema, generatePhysicianSchema, generateWebSiteSchema } from '@/lib/seo';
import { LOCALES } from '@/i18n/routing';
import robots from '@/app/robots';

afterEach(() => vi.unstubAllEnvs());

describe('technical SEO regression', () => {
  it.each(['deploy-preview', 'branch-deploy'])('blocks indexing in %s without changing canonical identity', (context) => {
    vi.stubEnv('CONTEXT', context);
    const meta = generatePageMetadata({ locale: 'en', path: '/pricing' });
    expect(meta.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false } });
    expect(meta.alternates?.canonical).toBe(`${BASE_URL}/en/pricing`);
    expect(robots()).toEqual({ rules: [{ userAgent: '*', disallow: '/' }] });
  });

  it('keeps production search access and the existing training policy', () => {
    vi.stubEnv('CONTEXT', 'production');
    expect(generatePageMetadata({ locale: 'en' }).robots).toMatchObject({ index: true, follow: true });
    const rules = robots().rules;
    expect(Array.isArray(rules)).toBe(true);
    for (const agent of ['*', 'Googlebot', 'Yeti', 'Bingbot', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'ChatGPT-User', 'Claude-User', 'GPTBot', 'ClaudeBot', 'Google-Extended']) {
      expect(rules).toContainEqual({ userAgent: agent, allow: '/', disallow: ['/admin', '/api', '/private/'] });
    }
  });

  it('does not claim an unknown publication or modification date', () => {
    const page = { title: 'Guide', description: 'Guide', path: '/medical', locale: 'en' };
    const unknown = generateWebPageSchema(page);
    expect(unknown).not.toHaveProperty('datePublished');
    expect(unknown).not.toHaveProperty('dateModified');
    expect(generateWebPageSchema({ ...page, dateModified: '2026-09-01' })).toHaveProperty('dateModified', '2026-09-01');
  });

  it('uses the document language for breadcrumbs and booking, with stable clinic identity', () => {
    for (const locale of LOCALES) {
      const page = generateWebPageSchema({ locale, path: '/medical', title: 'Q&A', description: 'Q&A', breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Q&A', url: `/${locale}/medical` }] });
      expect(page.breadcrumb).toMatchObject({ itemListElement: [{ item: `${BASE_URL}/${locale}` }, { item: `${BASE_URL}/${locale}/medical` }] });
      const clinic = generateLocalBusinessSchema(locale);
      expect(clinic['@id']).toBe(`${BASE_URL}/#organization`);
      expect(clinic.potentialAction.target.urlTemplate).toBe(`${BASE_URL}/${locale}/contact`);
    }
  });

  it('does not invent treatment facts or embed unsupported procedure properties', () => {
    const treatment = { id: 'thread', name: 'Thread lifting', nameEn: 'Thread lifting', description: 'Consultation and thread lifting', category: 'lifting', duration: '60–90 minutes' };
    const procedure = generateMedicalServiceSchema(treatment, { locale: 'en' });
    for (const key of ['procedureType', 'preparation', 'followup', 'bodyLocation', 'estimatedCost', 'provider', 'mainEntity', 'additionalProperty']) expect(procedure).not.toHaveProperty(key);
    expect(JSON.stringify(procedure)).not.toMatch(/[가-힣]/);
    expect(procedure['@id']).toBe(`${BASE_URL}/lifting/thread`);
    expect(procedure.url).toBe(`${BASE_URL}/en/lifting/thread`);
    expect(procedure.potentialAction.target.urlTemplate).toBe(`${BASE_URL}/en/contact?treatment=thread`);
    const howTo = generateHowToSchema({ ...treatment, process: [{ step: 1, title: 'Consultation', desc: 'Review suitability' }] }, { processWord: 'Process' });
    expect(howTo).not.toHaveProperty('totalTime');
    expect(howTo).not.toHaveProperty('performer');
  });

  it('omits unresolved education and does not assign every specialty to both doctors', () => {
    const doctor = generatePhysicianSchema({ id: 'dr-kim', name: 'Kim', nameEn: 'Kim', title: 'Director', specialty: 'Plastic surgery', philosophy: 'Individual care', education: [], certifications: [], specialties: [], experience: [] }, { locale: 'en' });
    expect(JSON.parse(JSON.stringify(doctor))).not.toHaveProperty('alumniOf');
    expect(doctor).not.toHaveProperty('medicalSpecialty');
    expect(doctor).toHaveProperty('hasOccupation.name', 'Plastic surgery');
    expect(doctor).toHaveProperty('url', `${BASE_URL}/en/about/staff#dr-kim`);
  });

  it('does not advertise a search action the page cannot handle', () => {
    expect(generateWebSiteSchema('en')).not.toHaveProperty('potentialAction');
  });
});

describe('buildHreflangMap', () => {
  it('lists every locale with BCP-47 codes and x-default → /en', () => {
    const map = buildHreflangMap('/events/first-visit');
    expect(Object.keys(map)).toHaveLength(LOCALES.length + 1);
    expect(map['ko-KR']).toBe(`${BASE_URL}/ko/events/first-visit`);
    expect(map['zh-Hans-CN']).toBe(`${BASE_URL}/zh/events/first-visit`);
    expect(map['zh-Hant-TW']).toBe(`${BASE_URL}/zh-TW/events/first-visit`);
    expect(map['x-default']).toBe(`${BASE_URL}/en/events/first-visit`);
  });

  it('uses the bare locale home for an empty path', () => {
    const map = buildHreflangMap('');
    expect(map['en']).toBe(`${BASE_URL}/en`);
    expect(map['ja-JP']).toBe(`${BASE_URL}/ja`);
  });
});

describe('getSiteName', () => {
  it('keeps the Korean legal name for ko', () => {
    expect(getSiteName('ko')).toBe('리브성형외과');
  });

  it('uses the unified Japanese clinic name', () => {
    expect(getSiteName('ja')).toBe('LIV美容クリニック');
  });

  it('falls back to the English name for unknown locales', () => {
    expect(getSiteName('xx')).toBe('LIV Plastic Surgery');
  });
});

describe('buildHreflangMap with a locale subset (guides)', () => {
  it('lists only the given locales and points x-default at en', () => {
    const map = buildHreflangMap('/guides/ultherapy-cost-seoul', ['en', 'ja', 'zh', 'zh-TW']);
    expect(Object.keys(map).sort()).toEqual(['en', 'ja-JP', 'x-default', 'zh-Hans-CN', 'zh-Hant-TW'].sort());
    expect(map['x-default']).toBe(`${BASE_URL}/en/guides/ultherapy-cost-seoul`);
  });

  it('falls back to the first locale for x-default when en is absent', () => {
    const map = buildHreflangMap('/guides/x', ['ja']);
    expect(map['x-default']).toBe(`${BASE_URL}/ja/guides/x`);
  });
});

describe('defaultOgImage', () => {
  it('uses the per-language 1200×630 image for guide locales', () => {
    expect(defaultOgImage('ja', 'x')).toMatchObject({ url: `${BASE_URL}/images/og/og-ja.jpg`, width: 1200, height: 630 });
    expect(defaultOgImage('zh-TW', 'x').url).toBe(`${BASE_URL}/images/og/og-zh-TW.jpg`);
  });

  it('keeps the shared og-image.jpg for other locales', () => {
    expect(defaultOgImage('ko', 'x')).toMatchObject({ url: `${BASE_URL}/images/og-image.jpg`, width: 1200, height: 800 });
    expect(defaultOgImage('vi', 'x').url).toBe(`${BASE_URL}/images/og-image.jpg`);
  });
});

describe('generatePageMetadata guide options', () => {
  it('threads alternateLocales and ogType through', () => {
    const meta = generatePageMetadata({
      locale: 'ja',
      title: 't',
      description: 'd',
      path: '/guides/x',
      alternateLocales: ['en', 'ja'],
      ogType: 'article',
    });
    expect(Object.keys(meta.alternates!.languages as Record<string, string>)).toHaveLength(3);
    expect((meta.openGraph as { type?: string }).type).toBe('article');
  });

  it('defaults to all locales and the website type', () => {
    const meta = generatePageMetadata({ locale: 'en', path: '/about' });
    expect(Object.keys(meta.alternates!.languages as Record<string, string>)).toHaveLength(LOCALES.length + 1);
    expect((meta.openGraph as { type?: string }).type).toBe('website');
  });
});

describe('generateWebPageSchema never doubles the locale (GSC /ko/ko/media, /mn/mn/media)', () => {
  const base = { title: 't', description: 'd' };

  it('prefixes a locale-less path once', () => {
    const s = generateWebPageSchema({ ...base, locale: 'ko', path: '/media' }) as { url: string; '@id': string };
    expect(s.url).toBe(`${BASE_URL}/ko/media`);
    expect(s['@id']).toBe(`${BASE_URL}/ko/media`);
  });

  it('strips a locale prefix a caller passed by mistake', () => {
    expect((generateWebPageSchema({ ...base, locale: 'mn', path: '/mn/media' }) as { url: string }).url).toBe(`${BASE_URL}/mn/media`);
    expect((generateWebPageSchema({ ...base, locale: 'zh-TW', path: '/zh-TW' }) as { url: string }).url).toBe(`${BASE_URL}/zh-TW`);
  });

  it('leaves paths that merely start with the locale letters alone', () => {
    expect(stripLocalePrefix('/entertainment', 'en')).toBe('/entertainment');
    expect(stripLocalePrefix('/media', 'ko')).toBe('/media');
  });
});
