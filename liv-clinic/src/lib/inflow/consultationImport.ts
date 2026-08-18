/**
 * 홈페이지 상담 폼(consultation_requests) → 유입 통계(inflow_leads) 자동 연동.
 *
 * 상담 API 3종(consultation/contact/quick-consult)이 저장 성공 후 after()로 호출한다.
 * - 폼 응답을 절대 실패시키지 않는다(모든 오류는 로그만).
 * - inflow_leads.consultation_id UNIQUE로 중복 연동을 원천 차단한다.
 * - 국내/해외는 페이지 로케일에서만 파생(ko=국내, 그 외 지원 로케일=해외, 미상=미분류).
 * - 시술 태그는 규칙 엔진의 '확실(high)' 제안만 자동 기록한다.
 * - UTM 코드가 캠페인/콘텐츠와 매칭되면 캠페인 연결 + 콘텐츠 '직접(direct)' 귀속을 기록한다
 *   (UTM 확인은 택소노미 정의상 direct 근거다).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { UtmColumns } from '@/lib/utm';
import { suggestTreatmentTags } from './classify';
import type { PatientOrigin } from './taxonomy';

export type ConsultationFormType = 'consultation' | 'contact' | 'quick';

export const FORM_TYPE_DETAILS: Record<ConsultationFormType, string> = {
  consultation: '상담 폼',
  contact: '문의 페이지',
  quick: '빠른 상담바',
};

export interface ConsultationSource {
  id: string;
  name: string | null;
  phone: string | null;
  email?: string | null;
  treatment_type: string | null;
  /** 페이지 경로(/ko/...) 또는 폼 식별자(consultation-form 등) */
  source?: string | null;
  created_at: string;
}

/** timestamptz ISO → KST(UTC+9, DST 없음) 기준 YYYY-MM-DD */
export function kstDateOf(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export function originFromLocale(locale: string | null): PatientOrigin | null {
  if (!locale) return null;
  if (locale === 'ko') return 'domestic';
  return SITE_LOCALES.has(locale) ? 'foreign' : null;
}

// i18n/routing의 LOCALES와 동일 목록. routing.ts는 next-intl 런타임을 끌고 오므로
// 순수 lib에서는 목록을 복제하고, 라우트 쪽 resolveLocale 호출부가 SSOT(LOCALES)를 주입한다.
const SITE_LOCALES = new Set(['ko', 'en', 'ja', 'zh', 'zh-TW', 'vi', 'th', 'ru', 'fr', 'mn', 'ar']);

/** 경로 후보들(/ko/..., referer pathname 등)에서 첫 번째로 확인되는 로케일 */
export function resolveLocale(
  paths: (string | null | undefined)[],
  locales: readonly string[]
): string | null {
  for (const p of paths) {
    if (!p || !p.startsWith('/')) continue;
    const seg = p.split('/')[1];
    if (locales.includes(seg)) return seg;
  }
  return null;
}

/** referer 헤더 + 폼 source 경로에서 페이지 로케일 결정 (라우트용 편의 함수) */
export function localeFromRequestParts(
  referer: string | null,
  sourcePath: string | null | undefined,
  locales: readonly string[]
): string | null {
  let refererPath: string | null = null;
  if (referer) {
    try {
      refererPath = new URL(referer).pathname;
    } catch {
      refererPath = null;
    }
  }
  return resolveLocale([sourcePath, refererPath], locales);
}

export interface BuildOptions {
  formType: ConsultationFormType;
  locale: string | null;
  campaignId?: string | null;
}

export function buildInflowLeadFromConsultation(
  c: ConsultationSource,
  opts: BuildOptions
): Database['public']['Tables']['inflow_leads']['Insert'] {
  const tagSuggestion = suggestTreatmentTags(c.treatment_type);
  const noteParts = ['홈페이지 문의 자동 연동'];
  if (c.source && c.source.startsWith('/')) noteParts.push(c.source);
  if (c.email) noteParts.push(`Email: ${c.email}`);
  return {
    contact_date: kstDateOf(c.created_at),
    channel: 'website',
    channel_category: 'homepage',
    channel_detail: FORM_TYPE_DETAILS[opts.formType],
    patient_origin: originFromLocale(opts.locale),
    is_returning: false,
    name: c.name || null,
    phone: c.phone || null,
    treatment: c.treatment_type || null,
    treatment_tags: tagSuggestion?.confidence === 'high' ? tagSuggestion.tags : [],
    campaign_id: opts.campaignId ?? null,
    consultation_id: c.id,
    note: noteParts.join(' / '),
  };
}

/** 상담 저장 성공 후 호출 — 실패해도 폼 흐름에 영향 없음 */
export async function importConsultationToInflow(
  admin: SupabaseClient<Database>,
  c: ConsultationSource,
  opts: { formType: ConsultationFormType; locale: string | null; utm?: UtmColumns | null }
): Promise<void> {
  try {
    let campaignId: string | null = null;
    let contentId: string | null = null;
    if (opts.utm?.utm_campaign) {
      const { data } = await admin
        .from('marketing_campaigns')
        .select('id')
        .eq('code', opts.utm.utm_campaign)
        .maybeSingle();
      campaignId = data?.id ?? null;
    }
    if (opts.utm?.utm_content) {
      const { data } = await admin
        .from('marketing_contents')
        .select('id')
        .eq('code', opts.utm.utm_content)
        .maybeSingle();
      contentId = data?.id ?? null;
    }

    const payload = buildInflowLeadFromConsultation(c, {
      formType: opts.formType,
      locale: opts.locale,
      campaignId,
    });
    const { data: lead, error } = await admin.from('inflow_leads').insert(payload).select('id').single();
    if (error) {
      // 23505 = consultation_id UNIQUE 충돌(이미 연동됨) — 정상 케이스
      if (error.code !== '23505') console.error('[inflow-import] insert failed:', error.message);
      return;
    }
    if (contentId && lead) {
      const { error: linkError } = await admin
        .from('lead_content_links')
        .insert({ lead_id: lead.id, content_id: contentId, attribution: 'direct', note: 'UTM 자동 연동' });
      if (linkError && linkError.code !== '23505') {
        console.error('[inflow-import] content link failed:', linkError.message);
      }
    }
  } catch (e) {
    console.error('[inflow-import] unexpected error:', e);
  }
}
