/**
 * Server-side localization helpers for page-level JSON-LD.
 *
 * The pure schema generators in `./seo.ts` stay locale-agnostic (no
 * next-intl/server import, so they remain safe to import from client code).
 * This module wraps them with `getTranslations` so every leaf layout emits
 * structured data in the visitor's language: `inLanguage` (BCP-47), the
 * self-canonical `@id`/`url`, human-readable names/descriptions and
 * breadcrumb labels all follow `params.locale`.
 *
 * Localized sources reused here (already the source of the visible UI):
 *   - metaSeo.{pageKey}          → WebPage title/description (matches <title>)
 *   - treatments.{cat}.{id}      → procedure name/description
 *   - treatments.common          → "process"/"reservation" schema suffixes
 *   - getLocalizedTreatment()    → localized process steps, FAQs, target areas…
 *   - nav / common.home          → breadcrumb labels
 */

import { getTranslations } from 'next-intl/server';
import {
  generateWebPageSchema,
  generateMedicalServiceSchema,
  generateHowToSchema,
  generateVoiceOptimizedFAQSchema,
  generateBreadcrumbSchema,
} from './seo';
import { getLocalizedTreatment, type TreatmentL10n } from './treatmentsI18n';

/** A breadcrumb node: the site root, a `nav`-namespace key, or a literal label. */
export type CrumbSpec =
  | { home: true }
  | { navKey: string; url: string }
  | { name: string; url: string };

async function resolveCrumbs(locale: string, specs: CrumbSpec[]) {
  const [tNav, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);
  return specs.map((s) =>
    'home' in s
      ? { name: tCommon('home'), url: '/' }
      : 'navKey' in s
        ? { name: tNav(s.navKey), url: s.url }
        : { name: s.name, url: s.url },
  );
}

/** Localized WebPage/MedicalWebPage/ProfilePage schema (title/description from metaSeo). */
export async function localizedWebPageSchema(opts: {
  locale: string;
  metaKey: string;
  path: string;
  type?: string;
  breadcrumbs: CrumbSpec[];
  mainEntity?: { '@id': string }[];
}) {
  const tMeta = await getTranslations({ locale: opts.locale, namespace: 'metaSeo' });
  const breadcrumbs = await resolveCrumbs(opts.locale, opts.breadcrumbs);
  return generateWebPageSchema({
    path: opts.path,
    title: tMeta(`${opts.metaKey}.title`),
    description: tMeta(`${opts.metaKey}.description`),
    locale: opts.locale,
    type: opts.type,
    breadcrumbs,
    mainEntity: opts.mainEntity,
  });
}

/** Standalone localized BreadcrumbList schema (category landing pages). */
export async function localizedBreadcrumbSchema(locale: string, specs: CrumbSpec[]) {
  return generateBreadcrumbSchema(await resolveCrumbs(locale, specs));
}

/** Structural shape read from a TREATMENTS entry. */
interface TreatmentBase extends TreatmentL10n {
  id: string;
  category: string;
  nameEn: string;
  benefits?: readonly { readonly title: string; readonly desc: string }[];
}

/**
 * MedicalService (+ optional HowTo) + WebPage schemas for a treatment leaf,
 * fully localized. `category` is both the TREATMENTS group and the nav key.
 */
export async function buildTreatmentLeafSchemas(opts: {
  locale: string;
  base: TreatmentBase;
  category: 'lifting' | 'antiaging';
  howTo?: boolean;
}) {
  const { locale, base, category } = opts;
  const id = base.id;
  const path = `/${category}/${id}`;

  const tT = await getTranslations({ locale, namespace: 'treatments' });
  const name = tT(`${category}.${id}.name`);
  const description = tT(`${category}.${id}.description`);
  const reservationWord = tT('common.consultationCta');
  const processWord = tT('common.process');

  const loc = getLocalizedTreatment(base, id, locale);

  const serviceData = {
    id: base.id,
    category: base.category,
    name,
    nameEn: base.nameEn,
    description,
    shortDesc: loc.shortDesc,
    duration: loc.duration ?? '',
    anesthesia: loc.anesthesia,
    recovery: loc.recovery,
    targetAreas: [...(loc.targetAreas ?? [])],
    benefits: (base.benefits ?? []).map((b) => ({ title: b.title, desc: b.desc })),
    faqs: (loc.faqs ?? []).map((f) => ({ q: f.q, a: f.a })),
  };

  const schemas: object[] = [
    generateMedicalServiceSchema(serviceData, { reservationWord, locale }),
  ];

  if (opts.howTo) {
    const processData = {
      name,
      nameEn: base.nameEn,
      description,
      duration: loc.duration ?? '',
      process: (loc.process ?? []).map((p) => ({ step: p.step, title: p.title, desc: p.desc })),
    };
    schemas.push(generateHowToSchema(processData, { processWord }));
  }

  schemas.push(
    await localizedWebPageSchema({
      locale,
      metaKey: id,
      path,
      type: 'MedicalWebPage',
      breadcrumbs: [
        { home: true },
        { navKey: category, url: `/${category}` },
        { navKey: id, url: path },
      ],
    }),
  );

  return schemas;
}

/** FAQ item shape as stored in the `medical.faq` message array. */
interface MedicalFaqMessage {
  id: string;
  category: string;
  question: string;
  questionVariants?: string[];
  shortAnswer?: string;
  answer: string;
  relatedTreatments?: string[];
  tags?: string[];
}

/**
 * Voice-optimized FAQPage + WebPage schemas for /medical, sourced from the
 * localized `medical.faq` message array (same data the UI renders). Item count
 * is read dynamically so appended questions flow through automatically.
 */
export async function buildMedicalSchemas(locale: string) {
  const [tMeta, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'metaSeo' }),
    getTranslations({ locale, namespace: 'medical' }),
  ]);

  const rawFaq = messages.raw('faq');
  const faqItems: MedicalFaqMessage[] = Array.isArray(rawFaq) ? rawFaq : [];

  const faqData = faqItems.map((qa) => ({
    id: qa.id,
    category: qa.category,
    question: qa.question,
    questionVariants: qa.questionVariants,
    shortAnswer: qa.shortAnswer ?? '',
    answer: qa.answer,
    relatedTreatments: qa.relatedTreatments ?? [],
    tags: qa.tags ?? [],
  }));

  const faqSchema = generateVoiceOptimizedFAQSchema(faqData, {
    name: tMeta('medical.title'),
    description: tMeta('medical.description'),
  });

  const pageSchema = await localizedWebPageSchema({
    locale,
    metaKey: 'medical',
    path: '/medical',
    type: 'WebPage',
    breadcrumbs: [{ home: true }, { navKey: 'medical', url: '/medical' }],
  });

  return [faqSchema, pageSchema];
}
